from avatar.models.restaurants.order import Order
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from datetime import datetime, time
from bson import ObjectId
from avatar.database.database import db
from avatar.models.restaurants.table_session import TableSession
from pydantic import BaseModel
from math import ceil
from avatar.websocket_manager import manager

router = APIRouter()
table_sessions_collection = db['table_sessions']
orders_collection = db['orders']

# Request Models
class InitializeSessionRequest(BaseModel):
    table_number: int
    initial_user_id: str
    initial_user_name: Optional[str] = None

class AddUserRequest(BaseModel):
    user_id: str
    user_name: Optional[str] = None

class UpdateSessionStatusRequest(BaseModel):
    status: str  # active, completed, cancelled

class TableSessionResponse(BaseModel):
    session: TableSession
    orders: List[Order]

class PaginatedTableSessionResponse(BaseModel):
    items: List[TableSessionResponse]
    total: int
    page: int
    total_pages: int
    has_more: bool

class TableSessionWithOrders(TableSession):
    user_orders: List[Order] = []  # Override to store full Order objects instead of just IDs

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class TableSessionRequest(BaseModel):
    table_number: int
    user_id: str
    user_name: str

@router.post("/init-table-session", response_model=TableSessionWithOrders)
async def create_table_session(
    request: TableSessionRequest
):
    try:
        # Find existing active session for the table
        existing_session = await table_sessions_collection.find_one({
            "table_number": request.table_number,
            "status": {"$ne": "paid"}
        })
        
        if existing_session:
            # Check if user already has an order in this session
            order_ids = [ObjectId(order_id) for order_id in existing_session["user_orders"]]
            existing_orders = await orders_collection.find({"_id": {"$in": order_ids}}).to_list(None)
            
            # Check if user already has an order
            user_has_order = any(order["user_id"] == request.user_id for order in existing_orders)
            
            if user_has_order:
                # User already in session, just return the current session state
                session_dict = dict(existing_session)
                session_dict["user_orders"] = [Order.parse_obj(order) for order in existing_orders]
                return TableSessionWithOrders.parse_obj(session_dict)
            
            # User not in session, create new order
            initial_order = Order(
                user_id=request.user_id,
                user_name=request.user_name,
                items=[]
            )
            order_result = await orders_collection.insert_one(
                initial_order.dict(by_alias=True)
            )
            new_order_id = str(order_result.inserted_id)
            
            # Add new order to session
            updated_session = await table_sessions_collection.find_one_and_update(
                {"_id": existing_session["_id"]},
                {
                    "$push": {"user_orders": new_order_id},
                    "$set": {"updated_at": datetime.utcnow()}
                },
                return_document=True
            )
            
            # Fetch all orders for the session
            order_ids = [ObjectId(order_id) for order_id in updated_session["user_orders"]]
            orders = await orders_collection.find({"_id": {"$in": order_ids}}).to_list(None)
            
            # Convert the session to our response model
            session_dict = dict(updated_session)
            session_dict["user_orders"] = [Order.parse_obj(order) for order in orders]
            
            try:
                # Broadcast session update for new order in existing session
                await manager.broadcast_to_waiters({
                    "type": "session_updated",
                    "table_number": request.table_number,
                    "session_id": str(updated_session["_id"]),
                    "message": f"New order added to table {request.table_number}"
                })
                print(f"Broadcast sent: New order added to table {request.table_number}")
            except Exception as broadcast_error:
                print(f"Error broadcasting session update: {broadcast_error}")
                
            return TableSessionWithOrders.parse_obj(session_dict)
            
        else:
            # Create new session if none exists
            initial_order = Order(
                user_id=request.user_id,
                user_name=request.user_name,
                items=[]
            )
            order_result = await orders_collection.insert_one(
                initial_order.dict(by_alias=True)
            )
            new_order_id = str(order_result.inserted_id)
            
            session = TableSession(
                table_number=request.table_number,
                user_orders=[new_order_id],
                status="active"
            )
            result = await table_sessions_collection.insert_one(
                session.dict(by_alias=True)
            )
            created_session = await table_sessions_collection.find_one(
                {"_id": result.inserted_id}
            )
            
            # Fetch the newly created order
            order = await orders_collection.find_one({"_id": ObjectId(new_order_id)})
            
            # Convert the session to our response model
            session_dict = dict(created_session)
            session_dict["user_orders"] = [Order.parse_obj(order)]
            
            try:
                # Broadcast new session creation
                await manager.broadcast_to_waiters({
                    "type": "session_updated",
                    "table_number": request.table_number,
                    "session_id": str(created_session["_id"]),
                    "message": f"New session created for table {request.table_number}"
                })
                print(f"Broadcast sent: New session created for table {request.table_number}")
            except Exception as broadcast_error:
                print(f"Error broadcasting new session: {broadcast_error}")

            return TableSessionWithOrders.parse_obj(session_dict)
            
    except Exception as e:
        print(f"Error in create_table_session: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    

@router.get("/table-session/{table_number}", response_model=TableSession)
async def get_table_session(table_number: int):
    """Get active session for a table"""
    try:
        session = await table_sessions_collection.find_one({
            "table_number": table_number,
            "status": "active"
        })
        if not session:
            raise HTTPException(
                status_code=404,
                detail="No active session found for this table"
            )
            
        # Ensure user_orders exists
        if "user_orders" not in session:
            session["user_orders"] = []
            
        return TableSession.parse_obj(session)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/table-session/{table_number}/status", response_model=TableSession)
async def update_session_status(
    table_number: int,
    request: UpdateSessionStatusRequest
):
    try:
        result = await table_sessions_collection.update_one(
            {"table_number": table_number, "status": "active"},
            {
                "$set": {
                    "status": request.status,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        if result.modified_count == 0:
            raise HTTPException(
                status_code=404,
                detail="No active session found for this table"
            )
        
        updated_session = await table_sessions_collection.find_one(
            {"table_number": table_number, "status": request.status}
        )
        
        if request.status == "paid":
            await manager.broadcast_to_waiters({
                "type": "session_paid",
                "table_number": table_number,
                "session_id": str(updated_session["_id"])
            })
            
        return TableSession.parse_obj(updated_session)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))




@router.get("/table-sessions", response_model=PaginatedTableSessionResponse)
async def get_active_sessions(
    page: int = Query(default=1, ge=1, description="Page number"),
    page_size: int = Query(default=20, le=20, ge=1, description="Items per page")
):
    """
    Get paginated table sessions that are currently active with their associated orders.
    Returns 20 items per page by default.
    """
    try:
        # Calculate skip for pagination
        skip = (page - 1) * page_size

        # Query filter for active sessions
        status_filter = {"status": "active"}

        # Get total count of active sessions
        total_sessions = await table_sessions_collection.count_documents(status_filter)
        
        if total_sessions == 0:
            return PaginatedTableSessionResponse(
                items=[],
                total=0,
                page=page,
                total_pages=0,
                has_more=False
            )

        # Get paginated active sessions
        sessions_cursor = table_sessions_collection.find(status_filter).sort("created_at", -1).skip(skip).limit(page_size)
        active_sessions = await sessions_cursor.to_list(length=page_size)
            
        result = []
        for session in active_sessions:
            # Convert order IDs to ObjectId
            order_ids = [ObjectId(id) for id in session.get("user_orders", [])]
            
            # Fetch orders for this session
            if order_ids:
                orders_cursor = orders_collection.find({"_id": {"$in": order_ids}})
                session_orders = await orders_cursor.to_list(length=100)
                
                # Parse each order and its items
                parsed_orders = []
                for order in session_orders:
                    parsed_order = Order.parse_obj(order)
                    parsed_orders.append(parsed_order)
            else:
                parsed_orders = []
                
            # Create response object using existing models
            session_response = TableSessionResponse(
                session=TableSession.parse_obj(session),
                orders=parsed_orders
            )
            
            result.append(session_response)

        # Calculate pagination metadata
        total_pages = ceil(total_sessions / page_size)
        has_more = page < total_pages
            
        return PaginatedTableSessionResponse(
            items=result,
            total=total_sessions,
            page=page,
            total_pages=total_pages,
            has_more=has_more
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving active sessions: {str(e)}"
        )