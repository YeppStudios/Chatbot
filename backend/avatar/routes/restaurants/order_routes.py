from enum import Enum
from avatar.websocket_manager import ConnectionManager
from fastapi import APIRouter, HTTPException, Query, WebSocket, WebSocketDisconnect
from typing import List, Optional
from datetime import datetime
from bson import ObjectId
from avatar.database.database import db
from avatar.models.restaurants.order import Order, SingleOrderItem
from pydantic import BaseModel

router = APIRouter()
orders_collection = db['orders']
manager = ConnectionManager()


class OrderStatus(str, Enum):
    PENDING = "pending"
    READY = "ready"
    DELIVERED = "delivered"
    PAID = "paid"

class UpdateOrderStatusRequest(BaseModel):
    status: str

@router.get("/order/{order_id}", response_model=Order)
async def get_order(order_id: str):
    """Get a specific order"""
    try:
        if not ObjectId.is_valid(order_id):
            raise HTTPException(status_code=400, detail="Invalid order ID")
        
        order = await orders_collection.find_one({"_id": ObjectId(order_id)})
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        return Order.parse_obj(order)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class AddItemRequest(BaseModel):
    item_name: str
    quantity: int = 1
    notes: Optional[str] = None
    photo_url: Optional[str] = None
    id: Optional[str] = None  # Optional ID for the item

@router.post("/order/{order_id}/add-item", response_model=Order)
async def add_item_to_order(
    order_id: str,
    item: AddItemRequest
):
    """Add an item to an existing order"""
    try:
        if not ObjectId.is_valid(order_id):
            raise HTTPException(status_code=400, detail="Invalid order ID")

        # Get table session for this order
        order = await orders_collection.find_one({"_id": ObjectId(order_id)})
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
            
        session = await db['table_sessions'].find_one({"user_orders": order_id})
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        # Create new item with ID
        new_item = SingleOrderItem(
            _id=ObjectId() if not item.id else ObjectId(item.id),
            item_name=item.item_name,
            quantity=item.quantity,
            notes=item.notes,
            photo_url=item.photo_url
        )

        result = await orders_collection.update_one(
            {"_id": ObjectId(order_id)},
            {
                "$push": {"items": new_item.dict(by_alias=True)},
                "$set": {"updated_at": datetime.utcnow()}
            }
        )

        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Order not found")

        updated_order = await orders_collection.find_one(
            {"_id": ObjectId(order_id)}
        )

        updated_order_dict = Order.parse_obj(updated_order).dict(by_alias=True)
        
        message = {
            "type": "new_item",
            "order_id": str(order_id),
            "session_id": str(session["_id"]),  # Add session ID
            "table_number": session["table_number"],
            "order": updated_order_dict
        }
        
        print(f"Preparing to broadcast message: {message}")
        await manager.broadcast_to_waiters(message)
        print("Broadcast to waiters completed")

        return Order.parse_obj(updated_order)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# in your FastAPI router file
@router.websocket("/ws/waiter")
async def websocket_endpoint(websocket: WebSocket):
    print("New waiter WebSocket connection attempt")
    await manager.connect_waiter(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            print(f"Received message from waiter: {data}")
    except WebSocketDisconnect:
        print("Waiter WebSocket disconnected")
        manager.disconnect_waiter(websocket)
    except Exception as e:
        print(f"Error in waiter WebSocket: {e}")
        manager.disconnect_waiter(websocket)
        

@router.patch("/order/{order_id}/status", response_model=Order)
async def update_order_status(
    order_id: str,
    request: UpdateOrderStatusRequest
):
    """Update order status"""
    try:
        if not ObjectId.is_valid(order_id):
            raise HTTPException(status_code=400, detail="Invalid order ID")

        result = await orders_collection.update_one(
            {"_id": ObjectId(order_id)},
            {
                "$set": {
                    "status": request.status,
                    "updated_at": datetime.utcnow()
                }
            }
        )

        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Order not found")

        updated_order = await orders_collection.find_one(
            {"_id": ObjectId(order_id)}
        )
        return Order.parse_obj(updated_order)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/order/{order_id}/item/{item_id}")
async def remove_item_from_order(order_id: str, item_id: str):
    """Remove an item from an order by item ID"""
    try:
        if not ObjectId.is_valid(order_id):
            raise HTTPException(status_code=400, detail="Invalid order ID")
        
        if not ObjectId.is_valid(item_id):
            raise HTTPException(status_code=400, detail="Invalid item ID")

        # Remove item by ID
        result = await orders_collection.update_one(
            {"_id": ObjectId(order_id)},
            {
                "$pull": {"items": {"_id": ObjectId(item_id)}},
                "$set": {"updated_at": datetime.utcnow()}
            }
        )

        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Order or item not found")

        updated_order = await orders_collection.find_one(
            {"_id": ObjectId(order_id)}
        )
        return Order.parse_obj(updated_order)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/user/{user_id}/orders", response_model=List[Order])
async def get_user_orders(user_id: str):
    """Get all orders for a specific user"""
    try:
        orders_cursor = orders_collection.find({"user_id": user_id})
        orders = await orders_cursor.to_list(length=100)
        return [Order.parse_obj(order) for order in orders]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    



@router.get("/orders", response_model=List[Order])
async def get_all_orders(
    status: Optional[OrderStatus] = Query(None, description="Filter by order status"),
    user_id: Optional[str] = Query(None, description="Filter by user ID"),
    from_date: Optional[datetime] = Query(None, description="Filter orders from this date"),
    to_date: Optional[datetime] = Query(None, description="Filter orders until this date"),
    limit: int = Query(50, ge=1, le=100, description="Number of orders to return"),
    skip: int = Query(0, ge=0, description="Number of orders to skip for pagination")
):
    try:
        # Build query filter
        query = {}
        
        if status:
            query["status"] = status
            
        if user_id:
            query["user_id"] = user_id
            
        if from_date or to_date:
            date_query = {}
            if from_date:
                date_query["$gte"] = from_date
            if to_date:
                date_query["$lte"] = to_date
            if date_query:
                query["created_at"] = date_query

        # Execute query with pagination
        cursor = orders_collection.find(query)
        
        # Add sorting by creation date (newest first)
        cursor = cursor.sort("created_at", -1)
        
        # Apply pagination
        cursor = cursor.skip(skip).limit(limit)
        
        # Convert to list
        orders = await cursor.to_list(length=limit)
        
        # Count total matching documents (for pagination info)
        total_orders = await orders_collection.count_documents(query)
        
        # Prepare response with pagination metadata
        response_data = [Order.parse_obj(order) for order in orders]
        
        # Add pagination headers
        headers = {
            "X-Total-Count": str(total_orders),
            "X-Page-Size": str(limit),
            "X-Current-Page": str(skip // limit + 1),
            "X-Total-Pages": str((total_orders + limit - 1) // limit)
        }
        
        return response_data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# You might also want to add a count endpoint to get just the number of orders
@router.get("/orders/count")
async def get_orders_count(
    status: Optional[OrderStatus] = Query(None, description="Filter by order status"),
    user_id: Optional[str] = Query(None, description="Filter by user ID"),
    from_date: Optional[datetime] = Query(None, description="Filter orders from this date"),
    to_date: Optional[datetime] = Query(None, description="Filter orders until this date")
):
    """Get count of orders matching the filter criteria"""
    try:
        query = {}
        
        if status:
            query["status"] = status
            
        if user_id:
            query["user_id"] = user_id
            
        if from_date or to_date:
            date_query = {}
            if from_date:
                date_query["$gte"] = from_date
            if to_date:
                date_query["$lte"] = to_date
            if date_query:
                query["created_at"] = date_query
                
        count = await orders_collection.count_documents(query)
        return {"count": count}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

@router.delete("/order/{order_id}", response_model=dict)
async def delete_order(order_id: str):
    try:
        if not ObjectId.is_valid(order_id):
            raise HTTPException(status_code=400, detail="Invalid order ID")

        order = await orders_collection.find_one({"_id": ObjectId(order_id)})
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")

        if order.get("status") == OrderStatus.PAID:
            raise HTTPException(
                status_code=400, 
                detail="Cannot delete a paid order"
            )

        result = await orders_collection.delete_one({"_id": ObjectId(order_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(
                status_code=500,
                detail="Failed to delete order"
            )

        return {
            "status": "success",
            "message": "Order deleted successfully",
            "order_id": str(order_id)
        }

    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))