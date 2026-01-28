from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql.schema import ForeignKey

from app.db.base import Base


class Word(Base):
    __tablename__ = "words"

    id = Column(Integer, primary_key=True)
    text = Column(String, nullable=False)

    party_id = Column(Integer, ForeignKey("parties.id"))
    party = relationship("Party", back_populates="words")
