# AuroraSense

Real-time aurora forecasting platform powered by NOAA space weather data.

## Stack

- Frontend: React + Vite + TailwindCSS + Mapbox GL JS
- Backend: Python FastAPI, async NOAA data ingestion

---

## Setup

### 1. Environment variables

**Backend** — copy and edit:
```bash
cp backend/.env.example backend/.env
```

**Frontend** — copy and add your Mapbox token:
```bash
cp frontend/.env.example frontend/.env
```
Get a free Mapbox token at https://account.mapbox.com/

---

### 2. Run with Docker

```bash
docker-compose up --build
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API docs: http://localhost:8000/docs

---

### 3. Run locally (without Docker)

**Backend:**
```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/aurora/kp` | Current Kp index (last 12 min) |
| GET | `/api/aurora/forecast` | 3-day Kp forecast + visibility latitude |

Data is sourced from [NOAA Space Weather Prediction Center](https://www.swpc.noaa.gov/).
