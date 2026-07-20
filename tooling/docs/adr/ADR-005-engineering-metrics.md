# ADR-005: Engineering Metrics & Performance Targets

## Status
Accepted

## Context
To guarantee enterprise-grade stability and developer velocity, strict non-functional requirements must be mandated.

## Decision
We enforce the following Engineering Targets for the Textile ERP SaaS:

| Metric | Target | Enforced By |
| :--- | :--- | :--- |
| Code Coverage | **> 85%** | CI Pipeline (Jest) |
| API P95 Latency | **< 200ms** | OpenTelemetry / Grafana |
| Monorepo Build Time | **< 3 min** | Turborepo Caching / CI |
| Deployment Time | **< 10 min** | GitHub Actions |
| Uptime | **99.99%** | Multi-AZ Cloud Infra |
| Error Budget | **0.01%** | SRE Alerting |

## Consequences
- Any PR lowering code coverage below 85% will be blocked automatically.
- Complex database queries must be paginated or indexed to meet the 200ms latency budget.
