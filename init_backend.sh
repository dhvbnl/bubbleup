#!/usr/bin/env bash
set -e

PROJECT_NAME="bubbleup"
BACKEND_DIR="backend"
APP_DIR="$BACKEND_DIR/app"

echo "🚀 Initializing FastAPI backend..."

# ------------------------------------------------
# Create directories
# ------------------------------------------------
mkdir -p $APP_DIR/{api,core,models,schemas,services,db,utils}
mkdir -p $APP_DIR/db/migrations
mkdir -p $BACKEND_DIR/tests

# ------------------------------------------------
# Init python modules
# ------------------------------------------------
touch $APP_DIR/__init__.py
touch $APP_DIR/{api,core,models,schemas,services,db,utils}/__init__.py
touch $BACKEND_DIR/tests/__init__.py

# ------------------------------------------------
# Core files
# ------------------------------------------------
touch $APP_DIR/main.py
touch $APP_DIR/core/{config.py,security.py,websocket.py}
touch $APP_DIR/api/{party.py,word.py,display.py,ws.py}
touch $APP_DIR/models/{party.py,word.py}
touch $APP_DIR/schemas/{party.py,word.py}
touch $APP_DIR/services/{party_service.py,word_service.py,broadcast.py}
touch $APP_DIR/db/{base.py,session.py}
touch $APP_DIR/utils/qrcode.py

# ------------------------------------------------
# Config files
# ------------------------------------------------
touch $BACKEND_DIR/requirements.txt
touch $BACKEND_DIR/.env.example
touch $BACKEND_DIR/README.md
touch docker-compose.yml
touch Dockerfile
touch .gitignore

# ------------------------------------------------
# Python virtual environment
# ------------------------------------------------
python3 -m venv venv
source venv/bin/activate

pip install --upgrade pip
pip install fastapi uvicorn sqlalchemy asyncpg alembic python-dotenv

pip freeze > $BACKEND_DIR/requirements.txt

# ------------------------------------------------
# Alembic init
# ------------------------------------------------
cd $BACKEND_DIR
alembic init app/db/migrations
cd ..

# ------------------------------------------------
# .gitignore
# ------------------------------------------------
cat <<EOF > .gitignore
venv/
__pycache__/
.env
*.pyc
EOF

# ------------------------------------------------
# .env.example
# ------------------------------------------------
cat <<EOF > $BACKEND_DIR/.env.example
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/app
SECRET_KEY=change-me
ENV=development
EOF

# ------------------------------------------------
# Minimal Dockerfile
# ------------------------------------------------
cat <<EOF > Dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY backend /app
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
EOF

# ------------------------------------------------
# Minimal docker-compose
# ------------------------------------------------
cat <<EOF > docker-compose.yml
version: "3.9"
services:
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

