from avatar.models.page_settings import PageSettings
from fastapi import APIRouter, HTTPException
from avatar.database.database import db
from typing import List, Union
from bson import Regex
router = APIRouter()

page_settings_collection = db.page_settings

@router.get("/list-page-settings", response_model=List[PageSettings])
async def get_all_page_settings():
    page_settings_data = await page_settings_collection.find().to_list(length=None)
    if not page_settings_data:
        raise HTTPException(status_code=404, detail="No page settings found")
    return page_settings_data

@router.get("/page-settings", response_model=PageSettings)
async def get_root_page_settings():
    page_settings_data = await page_settings_collection.find_one({"route": "/"})
    if not page_settings_data:
        raise HTTPException(status_code=404, detail="Root page settings not found")
    return page_settings_data

@router.get("/page-settings/{route:path}", response_model=PageSettings)
async def get_page_settings_by_route(route: str):
    search_route = "/" + route
    
    page_settings_data = await page_settings_collection.find_one({"route": search_route})
    if not page_settings_data:
        raise HTTPException(status_code=404, detail=f"Page settings for route '{search_route}' not found")
    return page_settings_data

@router.put("/page-settings/{route}", response_model=PageSettings)
async def update_page_settings(route: str, new_settings: PageSettings):
    new_settings_dict = new_settings.dict(exclude={"route"})
    
    # Find existing settings by matching the route directly
    existing_settings = await page_settings_collection.find_one({"route": "/" + route})
    
    if not existing_settings:
        raise HTTPException(status_code=404, detail="Page settings not found")
    
    # Update the document in the collection
    updated_result = await page_settings_collection.update_one(
        {"route": "/" + route},  # match the route directly
        {"$set": new_settings_dict}  # update with the new settings
    )
    
    updated_settings = await page_settings_collection.find_one({"route": "/" + route})
    return PageSettings(**updated_settings)



@router.post("/page-settings", response_model=PageSettings)
async def create_page_settings(new_settings: PageSettings):
    existing_settings = await page_settings_collection.find_one({"route": new_settings.route})
    if existing_settings:
        raise HTTPException(status_code=400, detail="Page settings for this route already exist")
    
    result = await page_settings_collection.insert_one(new_settings.dict())
    if result.inserted_id:
        return new_settings
    else:
        raise HTTPException(status_code=500, detail="Failed to create page settings")
    

@router.delete("/page-settings/{route:path}", response_model=dict)
async def delete_page_settings(route: str = ""):
    # Handle root route case
    search_route = "/" if not route else "/" + route
    
    # Find and delete the document
    result = await page_settings_collection.delete_one({"route": search_route})
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=404, 
            detail=f"Page settings for route '{search_route}' not found"
        )
    
    return {
        "status": "success",
        "message": f"Page settings for route '{search_route}' deleted successfully",
        "deleted_count": result.deleted_count
    }