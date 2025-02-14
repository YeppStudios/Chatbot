from pydantic import BaseModel, Field
from typing import Optional

class Dish(BaseModel):
    dish_name: str
    description: Optional[str] = None
    price: Optional[str] = None
    category: Optional[str] = None
    nutritional_info: Optional[str] = None
    photo_url: Optional[str] = None
