# BubbleUp Backend API

FastAPI backend for the BubbleUp application.

## Quick Start with Docker

1. From the project root, start the services:
```bash
docker-compose up --build
```

2. The API will be available at `http://localhost:8000`
3. API documentation at `http://localhost:8000/docs`
4. Health check at `http://localhost:8000/health`

## API Endpoints

### Health Check
- `GET /health` - Check if the API is running

### Party Management
- `POST /api/party/` - Create a new party

## Database

The application uses PostgreSQL with SQLAlchemy ORM. Tables are automatically created on startup (development mode).

## Environment Variables

Copy `.env.example` to `.env` and update as needed:
- `DATABASE_URL` - PostgreSQL connection string
- `PROJECT_NAME` - API title
- `BACKEND_CORS_ORIGINS` - Allowed CORS origins

## Development

To run without Docker:
```bash
pip install -r requirements.txt
uvicorn app.main:app --reload
```