# Project Milestone & Control System

A general-purpose engineering project management system for tracking milestones, tasks, budgets, resources, and field activities. Supports construction, telecom, and software industries.

## Monorepo Structure

```
project-milestone/
├── backend/    ← NestJS (Node.js + TypeScript) — REST API + WebSockets
├── web/        ← React.js (TypeScript + Vite + TailwindCSS) — Web App
├── mobile/     ← Flutter (Dart) — Android App
├── shared/     ← Shared TypeScript types
└── docs/       ← Design docs & diagrams
```

## Tech Stack

| Layer      | Technology                                      |
|------------|-------------------------------------------------|
| Mobile     | Flutter + Bloc + Dio                            |
| Web        | React.js + Vite + TailwindCSS + Zustand         |
| Backend    | NestJS + TypeORM + Passport.js                  |
| Database   | PostgreSQL                                      |
| Cache      | Redis                                           |
| Real-time  | Socket.io (WebSockets)                          |
| Auth       | JWT (access 15min + refresh 7d)                 |
| Storage    | Cloudinary                                      |
| Email      | SendGrid / Nodemailer                           |
| CI/CD      | GitHub Actions                                  |
| Hosting    | Render (backend + DB) + Netlify (web)           |
| Monitoring | Sentry + UptimeRobot                            |
| API Docs   | Swagger / OpenAPI 3.0                           |

## Getting Started

### Backend
```bash
cd backend
cp .env.example .env      # fill in your values
npm install
npm run start:dev
# Swagger docs: http://localhost:3000/api/docs
```

Optional migration workflow:

```bash
npm run migration:generate
npm run migration:run
```

### Web
```bash
cd web
cp .env.example .env
npm install
npm run dev
# App: http://localhost:5173
```

### Quick Start Script
```bash
./start.sh
```

### Mobile
```bash
cd mobile
flutter pub get
flutter run
```

## User Roles
- **Admin** — Full control
- **Manager** — Project oversight
- **Engineer** — Task execution
- **Viewer** — Read-only
- **Client/Stakeholder** — Reports only
- **Subcontractor** — Assigned tasks only

## API Base URL
`http://localhost:3000/api/v1`

Swagger UI: `http://localhost:3000/api/docs`

## Environment Notes

- `backend/.env.example` includes `FRONTEND_URLS` for CORS and `DB_SYNCHRONIZE` / `DB_MIGRATIONS_RUN` to control schema sync vs migrations.
- `web/.env.example` includes `VITE_WS_URL` so Socket.IO does not depend on a hard-coded localhost value.
- `docs/roadmap.md` tracks the next larger delivery phases beyond the foundation fixes in this pass.
- `docs/presentation-checklist.md` gives a suggested live demo sequence for the morning presentation.
