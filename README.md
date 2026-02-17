# CityVision (Full-Stack Demo)

CityVision is a supervisor-ready demo web app with:

- **Frontend:** React + Vite + TypeScript
- **Backend:** Node.js + Express
- **Data:** In-memory (demo-friendly, no DB setup)

It includes fake authentication, a dashboard with simulated detections and video overlay boxes, and backend-persisted settings toggles.

---

## Project Structure

```text
cityvision-full-stack-demo/
├── backend/
│   ├── package.json
│   └── src/
│       └── server.js
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.app.json
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   ├── vite.config.ts
│   └── src/
│       ├── App.tsx
│       ├── api.ts
│       ├── main.tsx
│       ├── styles.css
│       ├── types.ts
│       ├── vite-env.d.ts
│       ├── components/
│       │   ├── Navbar.tsx
│       │   ├── ProtectedRoute.tsx
│       │   └── VideoDetectionPlayer.tsx
│       ├── pages/
│       │   ├── DashboardPage.tsx
│       │   ├── HomePage.tsx
│       │   ├── LoginPage.tsx
│       │   └── SettingsPage.tsx
│       └── state/
│           └── AuthContext.tsx
├── .gitignore
├── package.json
└── README.md
```

---

## Run Locally

### 1) Install dependencies (from repo root)

```bash
npm install
```

### 2) Start backend (Terminal 1, from repo root)

```bash
npm run start
```

Backend runs on: `http://localhost:4000`

### 3) Start frontend (Terminal 2, from repo root)

```bash
npm run dev
```

Frontend runs on: `http://localhost:5173`

The frontend dev server is configured with:
- host exposure for LAN access
- `/api` proxy to backend `http://localhost:4000`

So the same app works from:
- your local browser: `http://localhost:5173`
- phone on same Wi-Fi: `http://<your-computer-ip>:5173`
- Cursor forwarded port URL for `5173`

---

## Demo Features

1. **Login page (fake auth)**
   - Accepts any username/password
   - Stores session token in localStorage

2. **Home page**
   - Intro text
   - Button to Dashboard

3. **Dashboard**
   - Video player using a safe public sample MP4 URL
   - Simulated detection bounding boxes overlaid on video
   - Recent Detections table:
     - time
     - class
     - confidence
     - lane
     - speed
     - violation type

4. **Settings page**
   - Toggle switches:
     - Enable speed violation
     - Enable lane violation
   - Stored in backend memory via API

5. **Navbar + routing**
   - Home / Dashboard / Settings + Logout

---

## API Endpoints

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/detections`
- `GET /api/settings`
- `PUT /api/settings`

All endpoints except login require `Authorization: Bearer <token>`.

---

## Notes

- This app is intentionally demo-focused and non-production.
- Data is in-memory and resets when backend restarts.
