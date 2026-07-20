# ADR-003: Soft Delete Policy Matrix

## Status
Accepted

## Context
A blanket "soft delete everything" approach leads to database bloat, indexing complexity, and privacy compliance issues (e.g., GDPR). Different entities in an ERP require distinct deletion strategies.

## Decision
We enforce a strict Soft Delete Policy Matrix categorizing all database models into three deletion types:

| Model | Policy | Justification |
| :--- | :--- | :--- |
| `Tenant` | **Soft Delete** | Retaining tenant records prevents cascading data loss, enables account recovery, and maintains foreign key constraints for historical data. |
| `User` | **Soft Delete** | Enables recovering accidentally deleted employees/admins and maintains historical references (e.g., "Created By" audit trails). |
| `Session` | **Hard Delete** | Security risk. Revoked or expired sessions have no business value. Hard deleting them keeps the table small and queries fast. |
| `Audit Logs` | **Immutable** | Regulatory compliance dictates logs must never be deleted or updated. |
| `Ledger/Invoices`| **Immutable** | Financial records cannot be altered or removed. Adjustments must be made via compensating transactions. |

## Implementation Strategy
- **Soft Delete Models:** Will utilize `deletedAt` timestamps. Application logic (or Prisma Client Extensions) will automatically append `WHERE deletedAt IS NULL` to read queries.
- **Hard Delete Models:** Executed via standard `DELETE` SQL statements.
- **Immutable Models:** Database-level triggers or application-level guards will block `UPDATE` and `DELETE` operations entirely.

## Consequences
- Queries targeting Soft Deleted models must be explicitly filtered (handled globally via Prisma Extension).
- The schema precisely reflects the business lifecycle of each record type.
