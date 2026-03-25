# Project Milestone & Control System — Project Structure

## Repository Layout (Monorepo)

```
project-milestone/
├── backend/          ← NestJS (Node.js + TypeScript)
├── web/              ← React.js (TypeScript)
├── mobile/           ← Flutter (Dart)
├── shared/           ← Shared TypeScript types/interfaces (backend ↔ web)
├── docs/             ← API docs, diagrams, design files
├── .github/
│   └── workflows/    ← GitHub Actions CI/CD pipelines
├── docker-compose.yml
└── README.md
```

---

## 1. Backend — NestJS (TypeScript)

```
backend/
├── src/
│   ├── main.ts                        ← App entry point (Swagger setup, port)
│   ├── app.module.ts                  ← Root module
│   │
│   ├── config/
│   │   ├── app.config.ts              ← Port, environment
│   │   ├── database.config.ts         ← PostgreSQL connection
│   │   ├── jwt.config.ts              ← JWT secret, expiry
│   │   └── redis.config.ts            ← Redis connection
│   │
│   ├── common/
│   │   ├── decorators/
│   │   │   ├── current-user.decorator.ts
│   │   │   └── roles.decorator.ts
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts   ← Global error handler
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   └── roles.guard.ts             ← RBAC enforcement
│   │   ├── interceptors/
│   │   │   ├── logging.interceptor.ts
│   │   │   └── response-transform.interceptor.ts
│   │   ├── pipes/
│   │   │   └── validation.pipe.ts
│   │   └── utils/
│   │       ├── pagination.util.ts
│   │       └── hash.util.ts
│   │
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts         ← /api/v1/auth
│   │   │   ├── auth.service.ts
│   │   │   ├── strategies/
│   │   │   │   ├── jwt.strategy.ts
│   │   │   │   └── jwt-refresh.strategy.ts
│   │   │   └── dto/
│   │   │       ├── login.dto.ts
│   │   │       └── register.dto.ts
│   │   │
│   │   ├── users/
│   │   │   ├── users.module.ts
│   │   │   ├── users.controller.ts        ← /api/v1/users
│   │   │   ├── users.service.ts
│   │   │   ├── entities/user.entity.ts
│   │   │   └── dto/
│   │   │
│   │   ├── projects/
│   │   │   ├── projects.module.ts
│   │   │   ├── projects.controller.ts     ← /api/v1/projects
│   │   │   ├── projects.service.ts
│   │   │   ├── entities/project.entity.ts
│   │   │   └── dto/
│   │   │
│   │   ├── milestones/
│   │   ├── tasks/
│   │   ├── expenses/
│   │   ├── resources/
│   │   ├── activities/
│   │   ├── units/
│   │   ├── issues/
│   │   ├── comments/
│   │   ├── attachments/
│   │   ├── time-tracking/
│   │   ├── notifications/
│   │   ├── reports/
│   │   └── audit-logs/
│   │
│   ├── database/
│   │   ├── migrations/                    ← TypeORM migrations
│   │   └── seeds/                         ← Dev/test seed data
│   │
│   └── websocket/
│       ├── events.gateway.ts              ← Socket.io gateway
│       └── events.module.ts
│
├── test/
│   ├── unit/
│   └── integration/
├── .env.example
├── package.json
├── tsconfig.json
├── Dockerfile
└── nest-cli.json
```

### Each Module follows this pattern:
```
module-name/
├── module-name.module.ts
├── module-name.controller.ts   ← HTTP endpoints + Swagger decorators
├── module-name.service.ts      ← Business logic
├── entities/
│   └── module-name.entity.ts   ← TypeORM entity
└── dto/
    ├── create-module-name.dto.ts
    └── update-module-name.dto.ts
```

---

## 2. Web Frontend — React.js (TypeScript)

```
web/
├── public/
├── src/
│   ├── main.tsx                       ← Entry point
│   ├── App.tsx                        ← Router setup
│   │
│   ├── api/
│   │   ├── axios.ts                   ← Axios instance (base URL, interceptors)
│   │   ├── auth.api.ts
│   │   ├── projects.api.ts
│   │   ├── milestones.api.ts
│   │   ├── tasks.api.ts
│   │   ├── expenses.api.ts
│   │   └── ...                        ← One file per module
│   │
│   ├── assets/
│   │   ├── images/
│   │   └── icons/
│   │
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button/
│   │   │   ├── Modal/
│   │   │   ├── Table/
│   │   │   ├── Badge/
│   │   │   ├── Spinner/
│   │   │   ├── EmptyState/
│   │   │   └── ConfirmDialog/
│   │   ├── layout/
│   │   │   ├── Sidebar/
│   │   │   ├── TopNav/
│   │   │   ├── PageHeader/
│   │   │   └── AppLayout/
│   │   └── charts/
│   │       ├── ProgressBar/
│   │       ├── BudgetChart/
│   │       └── MilestoneTimeline/
│   │
│   ├── context/
│   │   ├── AuthContext.tsx
│   │   └── NotificationContext.tsx
│   │
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── usePagination.ts
│   │   ├── useDebounce.ts
│   │   └── useSocket.ts               ← WebSocket hook
│   │
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── Login.tsx
│   │   │   └── Register.tsx
│   │   ├── dashboard/
│   │   │   └── Dashboard.tsx
│   │   ├── projects/
│   │   │   ├── ProjectList.tsx
│   │   │   ├── ProjectDetail.tsx
│   │   │   └── CreateProject.tsx
│   │   ├── milestones/
│   │   ├── tasks/
│   │   ├── expenses/
│   │   ├── issues/
│   │   ├── resources/
│   │   ├── activities/
│   │   ├── reports/
│   │   ├── calendar/
│   │   ├── search/
│   │   ├── notifications/
│   │   └── settings/
│   │       ├── Profile.tsx
│   │       └── TeamMembers.tsx
│   │
│   ├── routes/
│   │   ├── index.tsx                  ← Route definitions
│   │   ├── ProtectedRoute.tsx         ← Auth guard
│   │   └── RoleRoute.tsx              ← Role-based route guard
│   │
│   ├── store/                         ← Zustand stores
│   │   ├── auth.store.ts
│   │   ├── project.store.ts
│   │   └── notification.store.ts
│   │
│   ├── types/
│   │   ├── auth.types.ts
│   │   ├── project.types.ts
│   │   ├── task.types.ts
│   │   └── api.types.ts               ← Generic API response types
│   │
│   └── utils/
│       ├── date.utils.ts
│       ├── format.utils.ts
│       └── role.utils.ts
│
├── .env.example
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.ts
```

---

## 3. Mobile — Flutter (Dart)

```
mobile/
├── lib/
│   ├── main.dart                      ← Entry point
│   │
│   ├── app/
│   │   ├── app.dart                   ← MaterialApp setup
│   │   └── routes.dart                ← Named route definitions
│   │
│   ├── config/
│   │   ├── api_config.dart            ← Base URL, timeouts
│   │   └── app_theme.dart             ← Colors, typography
│   │
│   ├── core/
│   │   ├── error/
│   │   │   ├── exceptions.dart
│   │   │   └── failures.dart
│   │   ├── network/
│   │   │   ├── dio_client.dart        ← Dio HTTP client + interceptors
│   │   │   └── network_info.dart
│   │   ├── storage/
│   │   │   ├── secure_storage.dart    ← Tokens (flutter_secure_storage)
│   │   │   └── local_storage.dart     ← Preferences
│   │   └── utils/
│   │       ├── date_utils.dart
│   │       └── validators.dart
│   │
│   ├── data/
│   │   ├── models/                    ← JSON-serializable models
│   │   │   ├── project_model.dart
│   │   │   ├── task_model.dart
│   │   │   └── ...
│   │   ├── repositories/              ← Implements domain contracts
│   │   │   ├── project_repository.dart
│   │   │   └── ...
│   │   └── datasources/
│   │       ├── remote/                ← API calls (Dio)
│   │       └── local/                 ← Cached data (Hive/SQLite)
│   │
│   ├── domain/
│   │   ├── entities/                  ← Pure Dart classes (no JSON)
│   │   ├── repositories/              ← Abstract contracts
│   │   └── usecases/                  ← Single-responsibility business logic
│   │       ├── get_projects.dart
│   │       ├── create_task.dart
│   │       └── ...
│   │
│   └── presentation/
│       ├── bloc/                      ← Bloc/Cubit state management
│       │   ├── auth/
│       │   ├── project/
│       │   ├── task/
│       │   └── ...
│       ├── pages/
│       │   ├── auth/
│       │   ├── dashboard/
│       │   ├── projects/
│       │   ├── milestones/
│       │   ├── tasks/
│       │   ├── expenses/
│       │   ├── issues/
│       │   ├── activities/
│       │   └── settings/
│       └── widgets/
│           ├── common/
│           └── project/
│
├── test/
│   ├── unit/
│   ├── widget/
│   └── integration/
├── pubspec.yaml
└── .env
```

---

## 4. Database Schema (Full)

```sql
-- USERS
users (
  id UUID PRIMARY KEY,
  name VARCHAR,
  email VARCHAR UNIQUE,
  password_hash VARCHAR,
  role ENUM('admin','manager','engineer','viewer','client','subcontractor'),
  avatar_url VARCHAR,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- REFRESH TOKENS
refresh_tokens (
  id UUID PRIMARY KEY,
  user_id UUID → users,
  token_hash VARCHAR,
  expires_at TIMESTAMP,
  created_at TIMESTAMP
)

-- PROJECTS
projects (
  id UUID PRIMARY KEY,
  name VARCHAR,
  description TEXT,
  status ENUM('planning','active','on_hold','completed','cancelled'),
  industry ENUM('construction','telecom','software','other'),
  start_date DATE,
  end_date DATE,
  budget DECIMAL,
  owner_id UUID → users,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- PROJECT MEMBERS
project_members (
  id UUID PRIMARY KEY,
  project_id UUID → projects,
  user_id UUID → users,
  role ENUM('manager','engineer','viewer','client','subcontractor'),
  joined_at TIMESTAMP
)

-- MILESTONES
milestones (
  id UUID PRIMARY KEY,
  project_id UUID → projects,
  name VARCHAR,
  description TEXT,
  status ENUM('pending','in_progress','completed','delayed'),
  due_date DATE,
  progress INT DEFAULT 0,        ← 0-100%
  created_by UUID → users,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- TASKS
tasks (
  id UUID PRIMARY KEY,
  project_id UUID → projects,
  milestone_id UUID → milestones (nullable),
  title VARCHAR,
  description TEXT,
  status ENUM('todo','in_progress','review','done','blocked'),
  priority ENUM('low','medium','high','critical'),
  assigned_to UUID → users,
  created_by UUID → users,
  due_date DATE,
  estimated_hours DECIMAL,
  actual_hours DECIMAL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- TIME ENTRIES
time_entries (
  id UUID PRIMARY KEY,
  task_id UUID → tasks,
  user_id UUID → users,
  hours DECIMAL,
  description TEXT,
  date DATE,
  created_at TIMESTAMP
)

-- EXPENSES
expenses (
  id UUID PRIMARY KEY,
  project_id UUID → projects,
  title VARCHAR,
  amount DECIMAL,
  category ENUM('labor','material','equipment','travel','other'),
  status ENUM('pending','approved','rejected'),
  submitted_by UUID → users,
  approved_by UUID → users (nullable),
  receipt_url VARCHAR,
  notes TEXT,
  date DATE,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- RESOURCES
resources (
  id UUID PRIMARY KEY,
  project_id UUID → projects,
  name VARCHAR,
  type ENUM('material','equipment','labor'),
  quantity DECIMAL,
  unit VARCHAR,
  unit_cost DECIMAL,
  total_cost DECIMAL,
  supplier VARCHAR,
  created_at TIMESTAMP
)

-- ACTIVITIES (Site Updates)
activities (
  id UUID PRIMARY KEY,
  project_id UUID → projects,
  milestone_id UUID → milestones (nullable),
  user_id UUID → users,
  title VARCHAR,
  description TEXT,
  location VARCHAR,
  weather VARCHAR,
  created_at TIMESTAMP
)

-- ACTIVITY PHOTOS
activity_photos (
  id UUID PRIMARY KEY,
  activity_id UUID → activities,
  photo_url VARCHAR,
  caption TEXT,
  uploaded_at TIMESTAMP
)

-- UNITS / COMPONENTS
units (
  id UUID PRIMARY KEY,
  project_id UUID → projects,
  name VARCHAR,
  type VARCHAR,
  status ENUM('pending','in_progress','completed','defective'),
  progress INT DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- ISSUES / SNAG LIST
issues (
  id UUID PRIMARY KEY,
  project_id UUID → projects,
  title VARCHAR,
  description TEXT,
  priority ENUM('low','medium','high','critical'),
  status ENUM('open','in_progress','resolved','closed'),
  assigned_to UUID → users,
  reported_by UUID → users,
  resolved_at TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- COMMENTS (polymorphic: tasks, milestones, issues, activities)
comments (
  id UUID PRIMARY KEY,
  entity_type ENUM('task','milestone','issue','activity','expense'),
  entity_id UUID,
  user_id UUID → users,
  content TEXT,
  parent_id UUID → comments (nullable, for replies),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- ATTACHMENTS (polymorphic)
attachments (
  id UUID PRIMARY KEY,
  entity_type ENUM('task','issue','expense','activity','project'),
  entity_id UUID,
  file_url VARCHAR,
  file_name VARCHAR,
  file_size INT,
  file_type VARCHAR,
  uploaded_by UUID → users,
  uploaded_at TIMESTAMP
)

-- NOTIFICATIONS
notifications (
  id UUID PRIMARY KEY,
  user_id UUID → users,
  type ENUM('task_assigned','milestone_due','expense_approved','issue_raised','comment_added'),
  title VARCHAR,
  message TEXT,
  is_read BOOLEAN DEFAULT false,
  action_url VARCHAR,
  created_at TIMESTAMP
)

-- AUDIT LOGS
audit_logs (
  id UUID PRIMARY KEY,
  user_id UUID → users,
  action ENUM('create','update','delete','approve','reject'),
  entity_type VARCHAR,
  entity_id UUID,
  changes JSONB,             ← { before: {}, after: {} }
  ip_address VARCHAR,
  created_at TIMESTAMP
)
```

---

## 5. API Endpoint Structure

```
/api/v1/
├── auth/
│   ├── POST   /register
│   ├── POST   /login
│   ├── POST   /refresh
│   └── POST   /logout
│
├── users/
│   ├── GET    /             (admin only)
│   ├── GET    /:id
│   ├── PATCH  /:id
│   └── DELETE /:id
│
├── projects/
│   ├── GET    /             (list, paginated + filtered)
│   ├── POST   /
│   ├── GET    /:id
│   ├── PATCH  /:id
│   ├── DELETE /:id
│   └── POST   /:id/members
│
├── milestones/
│   ├── GET    /project/:projectId
│   ├── POST   /
│   ├── PATCH  /:id
│   └── DELETE /:id
│
├── tasks/
│   ├── GET    /project/:projectId
│   ├── GET    /milestone/:milestoneId
│   ├── POST   /
│   ├── PATCH  /:id
│   └── DELETE /:id
│
├── expenses/
│   ├── GET    /project/:projectId
│   ├── POST   /
│   ├── PATCH  /:id/approve
│   ├── PATCH  /:id/reject
│   └── DELETE /:id
│
├── issues/         (similar CRUD pattern)
├── resources/      (similar CRUD pattern)
├── activities/     (similar CRUD pattern)
├── units/          (similar CRUD pattern)
├── time-entries/   (similar CRUD pattern)
│
├── comments/
│   ├── GET    /:entityType/:entityId
│   ├── POST   /
│   └── DELETE /:id
│
├── attachments/
│   ├── POST   /upload
│   └── DELETE /:id
│
├── notifications/
│   ├── GET    /
│   ├── PATCH  /:id/read
│   └── PATCH  /read-all
│
├── reports/
│   ├── GET    /project/:projectId/summary
│   ├── GET    /project/:projectId/budget
│   └── GET    /project/:projectId/progress
│
└── search/
    └── GET    /             (?q=&type=project|task|issue)
```

---

## 6. WebSocket Events

```
Client → Server:
  join_project     { projectId }
  leave_project    { projectId }

Server → Client:
  task_updated     { task }
  milestone_completed { milestone }
  new_comment      { comment, entityType, entityId }
  expense_status   { expense, status }
  new_notification { notification }
  issue_raised     { issue }
```

---

## 7. Environment Variables

```bash
# backend/.env.example
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/project_milestone
REDIS_URL=redis://localhost:6379
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
SENDGRID_API_KEY=
SENTRY_DSN=

# web/.env.example
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_WS_URL=http://localhost:3000
```

---

## 8. Tech Stack Summary

| Layer         | Technology                        |
|---------------|-----------------------------------|
| Mobile        | Flutter + Bloc + Dio              |
| Web           | React.js + Vite + TailwindCSS + Zustand |
| Backend       | NestJS + TypeORM + Passport.js    |
| Database      | PostgreSQL                        |
| Cache         | Redis                             |
| Real-time     | Socket.io (WebSockets)            |
| Auth          | JWT (access + refresh tokens)     |
| Storage       | Cloudinary                        |
| Email         | SendGrid / Nodemailer             |
| CI/CD         | GitHub Actions                    |
| Hosting       | Render (backend + DB) + Netlify (web) |
| Monitoring    | Sentry + UptimeRobot              |
| API Docs      | Swagger / OpenAPI 3.0             |
