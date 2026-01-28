from typing import Optional

from sqlalchemy.orm import Session

from app.models.party import Party, PartyStatus
from app.models.word import Word


def create_party(db: Session) -> Party:
    """Create a new party"""
    party = Party(status=PartyStatus.ADD)
    db.add(party)
    db.commit()
    db.refresh(party)
    return party


def get_party(db: Session, party_id: int) -> Optional[Party]:
    """Get a party by ID"""
    return db.query(Party).filter(Party.id == party_id).first()


def update_party_status(db: Session, party_id: int, status: PartyStatus) -> Optional[Party]:
    """Update party status"""
    party = get_party(db, party_id)
    if party:
        party.status = status
        db.commit()
        db.refresh(party)
    return party


def add_word_to_party(db: Session, party_id: int, text: str) -> Optional[Word]:
    """Add a word to a party"""
    party = get_party(db, party_id)
    if not party:
        return None
    
    word = Word(text=text, party_id=party_id)
    db.add(word)
    db.commit()
    db.refresh(word)
    return word
