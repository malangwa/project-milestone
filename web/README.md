# Web App

React + Vite frontend for the Project Milestone & Control System.

## Highlights

- Authenticated dashboard, project tracking, reports, expenses, issues, resources, and time tracking
- Procurement and store workflows
- Route-level code splitting for faster initial load
- Admin-only audit log screen
- Real-time inventory updates through Socket.IO

## Run

```bash
npm install
cp .env.example .env
npm run dev
```

Default local URL: `http://localhost:5173`

## Build

```bash
npm run build
```

## Environment

- `VITE_API_BASE_URL` points to the backend REST API
- `VITE_WS_URL` points to the backend Socket.IO host
