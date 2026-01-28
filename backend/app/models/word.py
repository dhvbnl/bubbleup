from sqlalchemy import Column, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.db.base import Base


class Word(Base):
    __tablename__ = "words"

    id = Column(Integer, primary_key=True, index=True)
    text = Column(String, nullable=False)
    party_id = Column(Integer, ForeignKey("parties.id"), nullable=False, index=True)
    
    # Relationship
    party = relationship("Party", back_populates="words")
