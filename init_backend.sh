#!/usr/bin/env bash
set -e

PROJECT_NAME="bubbleup"
BACKEND_DIR="backend"
APP_DIR="$BACKEND_DIR/app"

echo "🚀 Initializing BubbleUp FastAPI Backend..."

# ================================================
# 1. CREATE DIRECTORY STRUCTURE
# ================================================
echo "📁 Creating directory structure..."
mkdir -p $APP_DIR/{api/routes,core,models,schemas,services,db/migrations,crud,utils}
mkdir -p $BACKEND_DIR/tests

# ================================================
# 2. CREATE __init__.py FILES
# ================================================
echo "📝 Creating Python module files..."
touch $APP_DIR/__init__.py
touch $APP_DIR/{api,core,models,schemas,services,db,crud,utils}/__init__.py
touch $APP_DIR/api/routes/__init__.py
touch $BACKEND_DIR/tests/__init__.py

# ================================================
# 3. REQUIREMENTS.TXT
# ================================================
echo "📦 Creating requirements.txt..."
cat <<'EOF' > $BACKEND_DIR/requirements.txt
fastapi==0.128.0
uvicorn[standard]==0.40.0
sqlalchemy==2.0.45
psycopg2-binary==2.9.9
pydantic==2.12.5
pydantic-settings==2.1.0
python-dotenv==1.2.1
alembic==1.18.1
EOF

# ================================================
# 4. CONFIGURATION (core/config.py)
# ================================================
echo "⚙️  Creating configuration..."
cat <<'EOF' > $APP_DIR/core/config.py
import os
from typing import List

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "BubbleUp API"
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql+psycopg2://postgres:postgres@db:5432/bubbleup"
    )
    BACKEND_CORS_ORIGINS: List[str] = ["*"]
    
    class Config:
        case_sensitive = True


settings = Settings()
EOF

# ================================================
# 5. DATABASE SETUP (db/base.py, db/session.py)
# ================================================
echo "🗄️  Creating database setup..."
cat <<'EOF' > $APP_DIR/db/base.py
from sqlalchemy.orm import declarative_base

Base = declarative_base()

# Import all models here so Base has them before being imported by Alembic
from app.models.party import Party  # noqa
from app.models.word import Word  # noqa
EOF

cat <<'EOF' > $APP_DIR/db/session.py
from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

engine = create_engine(settings.DATABASE_URL, echo=True, pool_pre_ping=True)

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
)


def get_db() -> Generator:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
EOF

# ================================================
# 6. MODELS (models/party.py, models/word.py)
# ================================================
echo "📊 Creating database models..."
cat <<'EOF' > $APP_DIR/models/party.py
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
    
    # Relationship
    words = relationship("Word", back_populates="party", cascade="all, delete-orphan")
EOF

cat <<'EOF' > $APP_DIR/models/word.py
from sqlalchemy import Column, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.db.base import Base


class Word(Base):
    __tablename__ = "words"
    
    id = Column(Integer, primary_key=True, index=True)
    text = Column(String, nullable=False)
    party_id = Column(Integer, ForeignKey("parties.id"), nullable=False)
    
    # Relationship
    party = relationship("Party", back_populates="words")
EOF

# ================================================
# 7. SCHEMAS (schemas/party.py, schemas/word.py)
# ================================================
echo "📋 Creating Pydantic schemas..."
cat <<'EOF' > $APP_DIR/schemas/party.py
from enum import Enum
from typing import List, Optional

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
EOF

cat <<'EOF' > $APP_DIR/schemas/word.py
from pydantic import BaseModel


class WordCreate(BaseModel):
    text: str


class WordResponse(BaseModel):
    id: int
    text: str
    party_id: int
    
    class Config:
        from_attributes = True
EOF

# ================================================
# 8. CRUD OPERATIONS (crud/party.py)
# ================================================
echo "🔧 Creating CRUD operations..."
cat <<'EOF' > $APP_DIR/crud/party.py
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
EOF

# ================================================
# 9. API ROUTES (api/routes/party.py)
# ================================================
echo "🛣️  Creating API routes..."
cat <<'EOF' > $APP_DIR/api/routes/party.py
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
EOF

# ================================================
# 10. API ROUTER (api/router.py)
# ================================================
cat <<'EOF' > $APP_DIR/api/router.py
from fastapi import APIRouter

from app.api.routes import party

api_router = APIRouter()
api_router.include_router(party.router, prefix="/party", tags=["party"])
EOF

# ================================================
# 11. MAIN APPLICATION (main.py)
# ================================================
echo "🚀 Creating main application..."
cat <<'EOF' > $APP_DIR/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import settings
from app.db.base import Base
from app.db.session import engine

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
EOF

# ================================================
# 12. DOCKER CONFIGURATION
# ================================================
echo "🐳 Creating Docker configuration..."
cat <<'EOF' > Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY backend /app

# Expose port
EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
EOF

cat <<'EOF' > docker-compose.yml
services:
  db:
    image: postgres:15
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: bubbleup
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  backend:
    build: .
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
    volumes:
      - ./backend:/app
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql+psycopg2://postgres:postgres@db:5432/bubbleup
    depends_on:
      db:
        condition: service_healthy

volumes:
  postgres_data:
EOF

# ================================================
# 13. ENVIRONMENT FILES
# ================================================
cat <<'EOF' > $BACKEND_DIR/.env.example
# Database
DATABASE_URL=postgresql+psycopg2://postgres:postgres@db:5432/bubbleup

# API Settings
PROJECT_NAME=BubbleUp API

# CORS Origins (comma-separated)
BACKEND_CORS_ORIGINS=["http://localhost:3000","http://localhost:8000"]
EOF

# ================================================
# 14. .gitignore
# ================================================
cat <<'EOF' > .gitignore
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
venv/
env/
ENV/

# Environment
.env
.env.local

# Database
*.db
*.sqlite

# IDEs
.vscode/
.idea/
*.swp
*.swo

# Docker
.dockerignore

# OS
.DS_Store
Thumbs.db
EOF

# ================================================
# 15. README
# ================================================
cat <<'EOF' > $BACKEND_DIR/README.md
# BubbleUp Backend API

FastAPI backend for the BubbleUp party application.

## Quick Start

1. **Start with Docker** (Recommended):
   ```bash
   docker-compose up --build
   ```

2. **Access the API**:
   - API: http://localhost:8000
   - Docs: http://localhost:8000/docs
   - Health: http://localhost:8000/health

## API Endpoints

### Root
- `GET /` - Welcome message
- `GET /health` - Health check

### Party Management
- `POST /api/party/` - Create a new party
- `GET /api/party/{party_id}` - Get party details
- `POST /api/party/{party_id}/words` - Add a word to party
- `PATCH /api/party/{party_id}/status` - Update party status

## Development

### Without Docker
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Database
PostgreSQL with automatic table creation on startup.

## Project Structure
```
backend/
├── app/
│   ├── api/
│   │   ├── routes/
│   │   │   └── party.py
│   │   └── router.py
│   ├── core/
│   │   └── config.py
│   ├── crud/
│   │   └── party.py
│   ├── db/
│   │   ├── base.py
│   │   └── session.py
│   ├── models/
│   │   ├── party.py
│   │   └── word.py
│   ├── schemas/
│   │   ├── party.py
│   │   └── word.py
│   └── main.py
└── requirements.txt
```
EOF

# ================================================
# 16. RUN SCRIPT
# ================================================
cat <<'EOF' > $BACKEND_DIR/run_backend.sh
#!/bin/bash
cd "$(dirname "$0")"
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
EOF
chmod +x $BACKEND_DIR/run_backend.sh

echo ""
echo "✅ Backend initialization complete!"
echo ""
echo "🚀 To start the application:"
echo "   docker-compose up --build"
echo ""
echo "📚 API Documentation will be at:"
echo "   http://localhost:8000/docs"
echo ""
  db:
    image: postgres:15
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
      POSTGRES_DB: app
    ports:
      - "5432:5432"

  backend:
    build: .
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
    volumes:
      - ./backend:/app
    ports:
      - "8000:8000"
    depends_on:
      - db
EOF

echo "✅ Backend initialized successfully!"
echo ""
echo "Next steps:"
echo "1. source venv/bin/activate"
echo "2. docker compose up"
echo "3. uvicorn app.main:app --reload"

