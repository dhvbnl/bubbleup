from fastapi import APIRouter

from app.api.routes import party

api_router = APIRouter()
api_router.include_router(party.router, prefix="/party", tags=["party"])
