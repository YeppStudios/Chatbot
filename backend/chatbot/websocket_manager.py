# websocket_manager.py
from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, Set
import json
from datetime import datetime
from bson import ObjectId

def serialize_for_json(obj):
    if isinstance(obj, datetime):
        return obj.isoformat()
    if isinstance(obj, ObjectId):
        return str(obj)
    if isinstance(obj, dict):
        return {key: serialize_for_json(value) for key, value in obj.items()}
    if isinstance(obj, list):
        return [serialize_for_json(item) for item in obj]
    return obj

class ConnectionManager:
    _instance = None
    _connections = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ConnectionManager, cls).__new__(cls)
            cls._connections = {
                "waiters": set(),
                "tables": {}
            }
        return cls._instance

    def __init__(self):
        self._connections = self.__class__._connections

    async def connect_waiter(self, websocket: WebSocket):
        try:
            await websocket.accept()
            self._connections["waiters"].add(websocket)
            await websocket.send_json({
                "type": "connection_test",
                "message": "Connected successfully",
                "connectionId": id(websocket)
            })
        except Exception as e:
            print(f"Error in connect_waiter: {e}")
            raise

    def disconnect_waiter(self, websocket: WebSocket):
        if websocket in self._connections["waiters"]:
            self._connections["waiters"].remove(websocket)

    async def broadcast_to_waiters(self, message: dict):
        if not self._connections["waiters"]:
            return
            
        active_waiters = self._connections["waiters"].copy()
        dead_connections = set()

        try:
            serialized_message = serialize_for_json(message)
            for connection in active_waiters:
                try:
                    await connection.send_json(serialized_message)
                except Exception as e:
                    dead_connections.add(connection)
            
            for dead in dead_connections:
                self.disconnect_waiter(dead)
                
        except Exception as e:
            print(f"Error in broadcast: {e}")

manager = ConnectionManager()