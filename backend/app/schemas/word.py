from pydantic import BaseModel


class WordCreate(BaseModel):
    text: str


class WordResponse(BaseModel):
    id: int
    text: str
    party_id: int
    
    class Config:
        from_attributes = True