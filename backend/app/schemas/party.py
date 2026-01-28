from enum import Enum
from typing import List

from pydantic import BaseModel


class PartyStatusSchema(str, Enum):
    add = "add"
    display = "display"


class WordBase(BaseModel):
    text: str


class WordResponse(WordBase):
    id: int
    party_id: int
    
    class Config:
        from_attributes = True


class PartyBase(BaseModel):
    pass


class PartyCreate(PartyBase):
    pass


class PartyResponse(PartyBase):
    id: int
    status: PartyStatusSchema
    words: List[WordResponse] = []
    
    class Config:
        from_attributes = True
