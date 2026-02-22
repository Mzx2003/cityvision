# CityVision - Real-Time Traffic Violation Detection Demo

Full-stack demo website for a graduation project.

## Tech Stack

- Frontend: React + Vite + simple CSS
- Backend: Node.js + Express
- Data storage: In-memory array (demo-only, no database)

## Features

- Home page (`/`) with hero section, feature cards, action buttons, how-it-works, and footer
- Demo page (`/demo`) with:
  - Local traffic video (`frontend/public/sample-traffic.mp4`)
  - Simulated detection boxes (random every 1-2 seconds)
  - Violation table (time, type, confidence)
- Dashboard page (`/dashboard`) with stat cards and a simple chart placeholder
- Settings page (`/settings`) with toggles, camera source input, and sensitivity slider
- Shared left sidebar + top header layout
- REST API:
  - `GET /api/health`
  - `GET /api/violations`
  - `POST /api/violations`

## Security Aspects

- `helmet` headers enabled (CSP, clickjacking protection, MIME sniffing protection)
- CORS allowlist (configurable with `ALLOWED_ORIGINS`)
- API rate limiting to reduce abuse and spam
- Strict JSON body size limit (`16kb`) and malformed JSON handling
- Strong server-side payload validation for `POST /api/violations`
- In-memory log cap (`MAX_VIOLATIONS = 500`) to avoid unbounded memory growth

## Setup

```bash
npm install
npm run dev
```

## Default URLs

- Frontend (Vite): `http://localhost:5173`
- Backend (Express): `http://localhost:4000`

The frontend proxies `/api/*` requests to the backend during development.

## Build and Run

```bash
npm run build
npm start
```

When a frontend build exists, the backend serves `frontend/dist`.

## Optional Security Configuration

Set environment variables before starting the backend:

```bash
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:4000,http://127.0.0.1:4000
API_RATE_LIMIT_WINDOW_MS=60000
API_RATE_LIMIT_MAX=120
API_WRITE_LIMIT_MAX=30
```

## Demo Video Source

- Sample highway clip: Mixkit free stock video ("Traffic in the highway")
