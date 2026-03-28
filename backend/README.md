# Backend

NestJS API for the Project Milestone & Control System.

## Key Capabilities

- JWT authentication and protected REST endpoints
- Project, task, expense, issue, resource, and milestone management
- Procurement modules: material requests, purchase orders, supplier invoices, goods receipts
- Inventory APIs with Socket.IO updates
- Swagger docs at `http://localhost:3000/api/docs`
- Audit log endpoints for admin review

## Run

```bash
npm install
cp .env.example .env
npm run start:dev
```

Production-style run:

```bash
npm run build
npm run start:prod
```

## Migrations

Migration support is configured through `src/database/data-source.ts`.

```bash
npm run migration:generate
npm run migration:run
```

For development, `DB_SYNCHRONIZE=true` still works as a temporary fallback until a full baseline migration is authored.

## Useful Scripts

```bash
npm run build
npm run lint
npm run test
npm run test:e2e
```
