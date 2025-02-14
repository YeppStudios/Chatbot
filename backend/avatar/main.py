from avatar.constants import ErrorCodes
from avatar.models.request.error import ErrorResponse
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
import uvicorn
from dotenv import load_dotenv
from avatar.routes.user_routes import router as user_router
from avatar.routes.page_settings_routes import router as page_settings_router
from avatar.routes.file_routes import router as file_router
from avatar.routes.avatar_routes import router as avatar_router
from avatar.routes.conversation_routes import router as conversation_router
from avatar.routes.restaurants.order_routes import router as order_router
from avatar.routes.restaurants.dish_routes import router as dish_router
from avatar.routes.retrieval_routes import router as retrieval_router
from avatar.routes.restaurants.table_session_routes import router as table_session_router
from avatar.routes.ai_routes import router as ai_router
from avatar.database.database import client
import logging
from fastapi.middleware.cors import CORSMiddleware
from fastapi.encoders import jsonable_encoder
from avatar.websocket_manager import manager 

load_dotenv()

app = FastAPI()

origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "https://wpip-avatar.vercel.app",
    "https://wpip-avatar-git-test-yepp.vercel.app",
    "https://snipy.ai",
]

# Add WebSocket URLs
websocket_origins = [
    origin.replace('http', 'ws') for origin in origins
] + [
    "ws://localhost:8000",
    "ws://0.0.0.0:8000",
    "wss://snipy.ai"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins + websocket_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(user_router)
app.include_router(page_settings_router)
app.include_router(avatar_router)
app.include_router(conversation_router)
app.include_router(ai_router)
app.include_router(file_router)
app.include_router(order_router)
app.include_router(dish_router)
app.include_router(retrieval_router)
app.include_router(table_session_router)

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    return JSONResponse(
        status_code=400,
        content=jsonable_encoder(
            ErrorResponse(
                errorCode=ErrorCodes.INVALID_REQUEST,
                message=" ".join([err["msg"] for err in exc.errors()]),
            )
        ),
    )

@app.websocket("/ws/waiter")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect_waiter(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect_waiter(websocket)
    except Exception as e:
        manager.disconnect_waiter(websocket)


app.state.websocket_manager = manager


@app.get("/")
async def read_root():
    return {"Hello": "World"}


@app.on_event("startup")
async def startup_event():
    try:
        client.admin.command('ping')
        print("You successfully connected to MongoDB!")
    except Exception as e:
        print(f"Failed to connect to MongoDB: {e}")


@app.on_event("shutdown")
async def shutdown_event():
    client.close()


logging.basicConfig(level=logging.DEBUG)


def start():
    uvicorn.run("avatar.main:app", host="0.0.0.0", port=8000, reload=True)


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
