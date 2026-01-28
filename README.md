# BubbleUp - Live Word Bubble Application

A real-time interactive word bubble application where users can create parties, share links via QR codes, and watch words appear live on a display screen.

## 🚀 Quick Start

```bash
docker-compose up --build
```

Then open http://localhost:3000 in your browser!

## ✨ Features

- **🎉 Party Creation**: Create parties instantly
- **📱 QR Code Sharing**: Easy mobile access
- **⚡ Real-time Updates**: WebSocket-powered live updates
- **🎨 Beautiful UI**: Modern React + Next.js + Tailwind CSS
- **🐳 Easy Deployment**: Fully Dockerized

## 📖 How It Works

### 1. Create a Party (Home Page)
Visit http://localhost:3000 and click "Create Party"

### 2. Manage Your Party (`/party/{id}/manage`)
- View and share QR code
- Control party mode (Collecting/Displaying words)
- Add your own words
- See all collected words

### 3. Display Screen (`/party/{id}/display`)
- Show on projector/TV
- Automatically updates when words are added
- Beautiful animated word bubbles in display mode

### 4. Add Words (`/party/{id}/add`)
- Participants scan QR or visit link
- Submit words easily
- Instant real-time updates

## 🛠 Technology Stack

**Backend**: FastAPI + PostgreSQL + WebSockets + SQLAlchemy  
**Frontend**: Next.js 14 + React 18 + Tailwind CSS + TypeScript  
**DevOps**: Docker + Docker Compose

## 📡 API Endpoints

- `POST /api/party/` - Create party
- `GET /api/party/{id}/links` - Get QR code and URLs
- `POST /api/party/{id}/words` - Add word
- `PATCH /api/party/{id}/status` - Change mode
- `WS /api/party/{id}/ws` - Real-time WebSocket
- `GET /health` - Health check
- Full docs: http://localhost:8000/docs

## 🔧 Development

### Backend Only
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend Only
```bash
cd frontend
npm install
npm run dev
```

## 📦 Services

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Database**: PostgreSQL on port 5432

## 🎯 Project Structure

```
bubbleup/
├── backend/          # FastAPI application
│   ├── app/
│   │   ├── api/      # API routes
│   │   ├── core/     # Config & WebSocket
│   │   ├── crud/     # Database operations
│   │   ├── models/   # SQLAlchemy models
│   │   ├── schemas/  # Pydantic schemas
│   │   └── utils/    # QR code generation
│   └── requirements.txt
├── frontend/         # Next.js application
│   ├── src/
│   │   ├── pages/    # React pages
│   │   ├── lib/      # API client & hooks
│   │   └── styles/   # Tailwind CSS
│   └── package.json
└── docker-compose.yml
```

## 🐛 Troubleshooting

**Services not starting?**
```bash
docker-compose down
docker-compose up --build
```

**Check logs:**
```bash
docker-compose logs backend
docker-compose logs frontend
```

**Reset database:**
```bash
docker-compose down -v
docker-compose up --build
```

## 📝 License

MIT
