# CityVision - Real-Time Traffic Violation Detection Demo

Full-stack demo website for a graduation project.

## Tech Stack

- Frontend: React + Vite + simple CSS
- Backend: Node.js + Express
- Data storage: In-memory array (demo-only, no database)

## Features

- Login page (`/login`) secured with Google reCAPTCHA verification
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
  - `POST /api/auth/login`
  - `GET /api/auth/me`
  - `POST /api/auth/logout`
  - `GET /api/violations`
  - `POST /api/violations`
  - `GET /api/security/failed-logins`

## Security Aspects

- `helmet` headers enabled (CSP, clickjacking protection, MIME sniffing protection)
- CORS allowlist (configurable with `ALLOWED_ORIGINS`)
- API rate limiting to reduce abuse and spam
- Strict JSON body size limit (`16kb`) and malformed JSON handling
- Strong server-side payload validation for `POST /api/violations`
- In-memory log cap (`MAX_VIOLATIONS = 500`) to avoid unbounded memory growth
- CAPTCHA verification on frontend and backend (`/api/auth/login`)
- Failed login attempt logging for security monitoring (`/api/security/failed-logins`)
- Temporary login block after 5 failed attempts (configurable)
- Session token validation for protected API routes

## Setup

```bash
npm install
npm run dev
```

Optional environment setup:

```bash
cp .env.example .env
cp frontend/.env.example frontend/.env
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
LOGIN_ROUTE_RATE_LIMIT_MAX=20
LOGIN_MAX_FAILED_ATTEMPTS=5
LOGIN_BLOCK_WINDOW_MS=900000
AUTH_SESSION_TTL_MS=28800000
DEMO_LOGIN_USERNAME=admin
DEMO_LOGIN_PASSWORD=CityVision@123
RECAPTCHA_SECRET_KEY=YOUR_RECAPTCHA_SECRET
RECAPTCHA_MIN_SCORE=0.5
RECAPTCHA_EXPECTED_ACTION=
RECAPTCHA_ALLOWED_HOSTNAMES=
```

Frontend CAPTCHA key:

```bash
VITE_RECAPTCHA_SITE_KEY=YOUR_RECAPTCHA_SITE_KEY
```

> Demo defaults already use Google test keys so local development works out of the box.

## Demo Video Source

- Sample highway clip: Mixkit free stock video ("Traffic in the highway")
