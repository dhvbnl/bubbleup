import enum

from sqlalchemy import Column, Enum, Integer
from sqlalchemy.orm import relationship

from app.db.base import Base


class PartyStatus(enum.Enum):
    ADD = "add"
    DISPLAY = "display"


class Party(Base):
    __tablename__ = "parties"
    id = Column(Integer, primary_key=True, index=True)
    status = Column(Enum(PartyStatus), nullable=False, default=PartyStatus.ADD)
    words = relationship("Word", back_populates="party")
