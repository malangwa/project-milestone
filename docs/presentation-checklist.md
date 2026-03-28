# Presentation Checklist

## Before You Start

1. Ensure PostgreSQL is running and `.env` files are present in `backend/` and `web/`.
2. Run `./start.sh` from the repository root.
3. Confirm:
   - Web app: `http://localhost:5173`
   - Swagger: `http://localhost:3000/api/docs`

## Suggested Demo Flow

1. Open the dashboard and show summary cards plus the pending approvals section.
2. Open a project and show:
   - team members
   - tasks
   - material requests
   - procurement panel
3. In procurement:
   - create or open a purchase order
   - create an invoice
   - verify / approve / pay the invoice
   - create a goods receipt
4. Open the store page:
   - show grouped stock
   - show history modal
   - mention real-time inventory updates and analytics
5. Open reports:
   - show project progress
   - show expense, materials, issues, and procurement metrics
6. If logged in as admin, open audit logs and show the approval trail.

## Backup Talking Points

- Route-level code splitting reduced the initial web payload.
- Inventory WebSocket auth is now explicitly JWT-validated.
- Audit logging now records approval and store operations.
- Procurement and reporting now cover more of the end-to-end project spending flow.
