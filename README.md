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
