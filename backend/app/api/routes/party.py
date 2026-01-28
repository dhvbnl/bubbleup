from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.crud.party import add_word_to_party, create_party, get_party, update_party_status
from app.db.session import get_db
from app.models.party import PartyStatus
from app.schemas.party import PartyResponse
from app.schemas.word import WordCreate, WordResponse

router = APIRouter()


@router.post("/", response_model=PartyResponse, status_code=201)
def create_new_party(db: Session = Depends(get_db)):
    """Create a new party"""
    return create_party(db)


@router.get("/{party_id}", response_model=PartyResponse)
def get_party_by_id(party_id: int, db: Session = Depends(get_db)):
    """Get a party by ID"""
    party = get_party(db, party_id)
    if not party:
        raise HTTPException(status_code=404, detail="Party not found")
    return party


@router.post("/{party_id}/words", response_model=WordResponse, status_code=201)
def add_word(party_id: int, word: WordCreate, db: Session = Depends(get_db)):
    """Add a word to a party"""
    result = add_word_to_party(db, party_id, word.text)
    if not result:
        raise HTTPException(status_code=404, detail="Party not found")
    return result


@router.patch("/{party_id}/status")
def update_status(party_id: int, status: str, db: Session = Depends(get_db)):
    """Update party status"""
    try:
        party_status = PartyStatus(status)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    party = update_party_status(db, party_id, party_status)
    if not party:
        raise HTTPException(status_code=404, detail="Party not found")
    return {"message": "Status updated", "status": status}
