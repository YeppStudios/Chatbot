from typing import List, Optional
from avatar.models.restaurants.dish import Dish
from fastapi import FastAPI, HTTPException, APIRouter
from bson import ObjectId
from avatar.database.database import db
from pydantic import BaseModel
from fuzzywuzzy import process
from fuzzywuzzy import fuzz

app = FastAPI()
dishes_collection = db["dishes"]
router = APIRouter()

def dish_helper(dish) -> dict:
    return {
        "id": str(dish["_id"]),
        "dish_name": dish["dish_name"],
        "description": dish.get("description", ""),
        "price": dish.get("price", ""),
        "category": dish.get("category", ""),
        "nutritional_info": dish.get("nutritional_info", ""),
        "photo_url": dish.get("photo_url", "")
    }

# Create a new dish
@router.post("/dishes", response_model=Dish)
async def create_dish(dish: Dish):
    new_dish = dish.dict()
    result = await dishes_collection.insert_one(new_dish)
    created_dish = await dishes_collection.find_one({"_id": result.inserted_id})
    return dish_helper(created_dish)

# Read all dishes
@router.get("/dishes", response_model=List[Dish])
async def get_all_dishes():
    dishes = []
    async for dish in dishes_collection.find():
        dishes.append(dish_helper(dish))
    return dishes

# Read a specific dish by ID
@router.get("/dishes/{dish_id}", response_model=Dish)
async def get_dish(dish_id: str):
    dish = await dishes_collection.find_one({"_id": ObjectId(dish_id)})
    if dish is None:
        raise HTTPException(status_code=404, detail="Dish not found")
    return dish_helper(dish)

class DishesRequest(BaseModel):
    dishes: List[Dish]
    
@router.post("/dishes/bulk")
async def create_multiple_dishes(request: DishesRequest):
    try:
        new_dishes = [dish.dict() for dish in request.dishes]
        result = await dishes_collection.insert_many(new_dishes)
        created_dishes = []
        async for dish in dishes_collection.find({"_id": {"$in": result.inserted_ids}}):
            created_dishes.append(dish_helper(dish))
        return created_dishes
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Update a dish by ID
@router.put("/dishes/{dish_id}", response_model=Dish)
async def update_dish(dish_id: str, dish: Dish):
    updated_dish = await dishes_collection.find_one_and_update(
        {"_id": ObjectId(dish_id)},
        {"$set": dish.dict(exclude_unset=True)},
        return_document=True
    )
    if updated_dish is None:
        raise HTTPException(status_code=404, detail="Dish not found")
    return dish_helper(updated_dish)


# Delete multiple dishes by IDs
@router.delete("/dishes/bulk", response_model=dict)
async def delete_multiple_dishes(request: DishesRequest):
    try:
        dish_ids = [dish.id for dish in request.dishes]
        delete_result = await dishes_collection.delete_many({"id": {"$in": dish_ids}})
        if delete_result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="No dishes found to delete")
        return {"message": f"Deleted {delete_result.deleted_count} dishes successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Delete all dishes with photo_url set to null
@router.delete("/dishes/delete-null-photo", response_model=dict)
async def delete_dishes_with_null_photo():
    delete_result = await dishes_collection.delete_many({"photo_url": None})
    if delete_result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="No dishes with null photo_url found to delete")
    return {"message": f"Deleted {delete_result.deleted_count} dishes with null photo_url successfully"}

# Delete dishes by names
class DishNamesRequest(BaseModel):
    dish_names: List[str]

@router.delete("/dishes/delete-by-names", response_model=dict)
async def delete_dishes_by_names(request: DishNamesRequest):
    try:
        delete_result = await dishes_collection.delete_many({"dish_name": {"$in": request.dish_names}})
        if delete_result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="No dishes found to delete")
        return {"message": f"Deleted {delete_result.deleted_count} dishes successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


class DishSearchRequest(BaseModel):
    dish_name: str
    limit: Optional[int] = 5

class DishSearchResponse(BaseModel):
    dish_name: str
    matched_dishes: List[str]
    message: str

class DishRequest(BaseModel):
    dish_name: str

class DishesRequest(BaseModel):
    dishes: List[DishRequest]

class DishResponse(BaseModel):
    dish_name: str
    matched_dishes: List[str]
    message: str