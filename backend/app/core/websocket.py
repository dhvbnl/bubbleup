from typing import Dict, List
from fastapi import WebSocket


class ConnectionManager:
    """Manage WebSocket connections for real-time updates"""
    
    def __init__(self):
        self.active_connections: Dict[int, List[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, party_id: int):
        await websocket.accept()
        if party_id not in self.active_connections:
            self.active_connections[party_id] = []
        self.active_connections[party_id].append(websocket)
    
    def disconnect(self, websocket: WebSocket, party_id: int):
        if party_id in self.active_connections:
            self.active_connections[party_id].remove(websocket)
            if not self.active_connections[party_id]:
                del self.active_connections[party_id]
    
    async def broadcast_to_party(self, party_id: int, message: dict):
        """Broadcast message to all connections for a specific party"""
        if party_id in self.active_connections:
            dead_connections = []
            for connection in self.active_connections[party_id]:
                try:
                    await connection.send_json(message)
                except Exception:
                    dead_connections.append(connection)
            
            # Clean up dead connections
            for connection in dead_connections:
                self.disconnect(connection, party_id)


manager = ConnectionManager()
