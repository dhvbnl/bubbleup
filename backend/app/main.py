from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import settings
from app.db.base import Base
from app.db.session import engine
# Import models to register them with SQLAlchemy
from app.models import party, word  # noqa

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="BubbleUp Party API",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    """Initialize database tables on startup"""
    Base.metadata.create_all(bind=engine)


@app.get("/", tags=["root"])
def read_root():
    return {"message": "Welcome to BubbleUp API", "docs": "/docs"}


@app.get("/health", tags=["health"])
def health_check():
    return {"status": "healthy", "service": "bubbleup-api"}


app.include_router(api_router, prefix="/api")
