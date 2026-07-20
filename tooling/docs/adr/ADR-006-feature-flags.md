# ADR-006: Feature Flags Architecture

## Status
Accepted

## Context
A multi-tenant SaaS ERP requires enabling/disabling specific enterprise features (e.g., AI Insights, OCR Billing, Multi-Warehouse) on a per-tenant basis, usually tied to subscription plans.

## Decision
We will implement a granular Feature Flag architecture deeply integrated into the Tenant model.

1. **Database Schema:** 
   We will introduce a `features` JSONB column (or a `TenantFeature` relation) on the `Tenant` model in upcoming sprints.
2. **Access Control:** 
   A NestJS Guard (`@RequireFeature(Feature.AI_OCR)`) will intercept incoming API requests.
3. **Frontend Awareness:** 
   The React context will sync the tenant's enabled features from the API, hiding UI elements that are inaccessible.

## Consequences
- All net-new business modules must check the feature flag state before executing logic.
- We decouple feature rollout from code deployment.
