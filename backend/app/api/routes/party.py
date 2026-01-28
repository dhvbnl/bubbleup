from fastapi import APIRouter, Depends, HTTPException, Request, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

from app.core.websocket import manager
from app.crud.party import add_word_to_party, create_party, get_party, update_party_status
from app.db.session import get_db
from app.models.party import PartyStatus
from app.schemas.party import PartyResponse, PartyWithLinksResponse
from app.schemas.word import WordCreate, WordResponse
from app.utils.qrcode import generate_qr_code

router = APIRouter()


def build_party_links(request: Request, party_id: int, include_qr: bool = False) -> dict:
    """Build URLs for party management, display, and adding words"""
    base_url = str(request.base_url).rstrip("/")
    
    links = {
        "manage_url": f"{base_url}/party/{party_id}/manage",
        "display_url": f"{base_url}/party/{party_id}/display",
        "add_url": f"{base_url}/party/{party_id}/add",
    }
    
    if include_qr:
        links["qr_code"] = generate_qr_code(links["add_url"])
    
    return links


@router.post("/", response_model=PartyWithLinksResponse, status_code=201)
def create_new_party(request: Request, db: Session = Depends(get_db)):
    """Create a new party and return management links"""
    party = create_party(db)
    
    # Build response with links
    response_data = {
        "id": party.id,
        "status": party.status.value,
        "words": [],
        **build_party_links(request, party.id, include_qr=True)
    }
    
    return response_data


@router.get("/{party_id}", response_model=PartyResponse)
def get_party_by_id(party_id: int, db: Session = Depends(get_db)):
    """Get a party by ID"""
    party = get_party(db, party_id)
    if not party:
        raise HTTPException(status_code=404, detail="Party not found")
    return party


@router.get("/{party_id}/links", response_model=PartyWithLinksResponse)
def get_party_links(party_id: int, request: Request, include_qr: bool = True, db: Session = Depends(get_db)):
    """Get party with management links and QR code"""
    party = get_party(db, party_id)
    if not party:
        raise HTTPException(status_code=404, detail="Party not found")
    
    response_data = {
        "id": party.id,
        "status": party.status.value,
        "words": [{"id": w.id, "text": w.text, "party_id": w.party_id} for w in party.words],
        **build_party_links(request, party.id, include_qr=include_qr)
    }
    
    return response_data


@router.post("/{party_id}/words", response_model=WordResponse, status_code=201)
async def add_word(party_id: int, word: WordCreate, db: Session = Depends(get_db)):
    """Add a word to a party"""
    result = add_word_to_party(db, party_id, word.text)
    if not result:
        raise HTTPException(status_code=404, detail="Party not found")
    
    # Broadcast new word to all connected clients
    await manager.broadcast_to_party(party_id, {
        "type": "word_added",
        "word": {"id": result.id, "text": result.text, "party_id": result.party_id}
    })
    
    return result


@router.patch("/{party_id}/status", response_model=PartyResponse)
async def update_status(party_id: int, status: str, db: Session = Depends(get_db)):
    """Update party status (add/display)"""
    try:
        party_status = PartyStatus(status)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid status. Use 'add' or 'display'")
    
    party = update_party_status(db, party_id, party_status)
    if not party:
        raise HTTPException(status_code=404, detail="Party not found")
    
    # Broadcast status change to all connected clients
    await manager.broadcast_to_party(party_id, {
        "type": "status_changed",
        "status": status
    })
    
    return party


@router.websocket("/{party_id}/ws")
async def websocket_endpoint(websocket: WebSocket, party_id: int, db: Session = Depends(get_db)):
    """WebSocket endpoint for real-time updates"""
    # Verify party exists
    party = get_party(db, party_id)
    if not party:
        await websocket.close(code=1008, reason="Party not found")
        return
    
    await manager.connect(websocket, party_id)
    
    try:
        # Send initial party state
        await websocket.send_json({
            "type": "init",
            "party": {
                "id": party.id,
                "status": party.status.value,
                "words": [{"id": w.id, "text": w.text, "party_id": w.party_id} for w in party.words]
            }
        })
        
        # Keep connection alive
        while True:
            data = await websocket.receive_text()
            # Echo back for keepalive
            await websocket.send_json({"type": "pong"})
    
    except WebSocketDisconnect:
        manager.disconnect(websocket, party_id)
