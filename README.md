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

### Web
```bash
cd web
cp .env.example .env
npm install
npm run dev
# App: http://localhost:5173
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
