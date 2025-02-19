from chatbot.constants import ErrorCodes
from chatbot.models.request.error import ErrorResponse
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
import uvicorn
from dotenv import load_dotenv
from chatbot.routes.user_routes import router as user_router
from chatbot.routes.file_routes import router as file_router
from chatbot.routes.assistant_routes import router as assistant_router
from chatbot.routes.conversation_routes import router as conversation_router
from chatbot.routes.retrieval_routes import router as retrieval_router
from chatbot.routes.ai_routes import router as ai_router
from chatbot.database.database import client
import logging
from fastapi.middleware.cors import CORSMiddleware
from fastapi.encoders import jsonable_encoder
from chatbot.websocket_manager import manager 

load_dotenv()

app = FastAPI()

origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "https://wpip-chatbot.vercel.app",
    "https://wpip-chatbot-git-test-yepp.vercel.app",
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
app.include_router(assistant_router)
app.include_router(conversation_router)
app.include_router(ai_router)
app.include_router(file_router)
app.include_router(retrieval_router)

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
    uvicorn.run("chatbot.main:app", host="0.0.0.0", port=8000, reload=True)


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
