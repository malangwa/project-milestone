# Product Roadmap

## Phase 1: Stabilize Foundations

- Replace remaining UI-only role checks with route-level and API-level authorization where access rules are already known.
- Author a baseline TypeORM migration and switch development environments from schema sync to migration-driven setup.
- Split the large web bundle with route-level lazy loading and shared chart/store chunks.
- Add focused regression tests for project membership, procurement flows, and inventory adjustments.

## Phase 2: Complete Procurement Operations

- Add file upload flows for supplier invoices, receipts, and project attachments instead of manual URL entry.
- Build a unified approval inbox for expenses, material requests, purchase orders, and supplier invoices.
- Add supplier and procurement analytics: lead time, fulfilment rate, spend by project, and request-to-receipt variance.
- Add inventory reservations and smarter reorder suggestions based on low-stock thresholds and recent consumption.

## Phase 3: Improve Project Execution

- Introduce project templates and reusable checklists for common project types.
- Expand notifications for due dates, blocked work, approval requests, low stock, and procurement delays.
- Expose audit logs in the web UI for traceability across project and store operations.
- Tighten mobile/web parity if the Flutter client is intended to remain a first-class product surface.
