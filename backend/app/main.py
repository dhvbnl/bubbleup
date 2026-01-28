from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.api.router import api_router
from app.core.config import settings
from app.db.base import Base
from app.db.session import engine
# Import models to register them with SQLAlchemy
from app.models import party, word  # noqa: F401


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan - startup and shutdown events"""
    # Startup: Initialize database tables
    Base.metadata.create_all(bind=engine)
    yield
    # Shutdown: cleanup if needed
    engine.dispose()


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="BubbleUp Party API",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files (optional - mainly for development)
frontend_path = Path(__file__).parent.parent.parent / "frontend"
if frontend_path.exists():
    try:
        app.mount("/static", StaticFiles(directory=str(frontend_path)), name="static")
    except RuntimeError:
        pass  # Directory might not exist in Docker


@app.get("/", tags=["root"])
def read_root():
    """API root endpoint"""
    return {"message": "Welcome to BubbleUp API", "docs": "/docs"}


@app.get("/party/{party_id}/{page}", tags=["pages"])
def serve_party_page(party_id: int, page: str):
    """Serve party-specific pages (manage, display, add)"""
    page_path = frontend_path / "pages" / f"{page}.html"
    if page_path.exists():
        return FileResponse(str(page_path))
    return {"error": "Page not found"}


@app.get("/health", tags=["health"])
def health_check():
    return {"status": "healthy", "service": "bubbleup-api"}


app.include_router(api_router, prefix="/api")
