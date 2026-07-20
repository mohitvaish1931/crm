# ADR-004: Redis Workload & Eviction Strategy

## Status
Accepted

## Context
Redis is utilized across multiple sub-systems in the ERP (Rate Limiting, Session Management, Caching, and future Queues). A blanket `allkeys-lru` eviction policy could evict critical rate-limit counters or session tokens.

## Decision
We will enforce logical separation of workloads, preferably using separate Redis Logical Databases (e.g., DB 0, DB 1) or separate Redis instances at scale. 
For a unified Redis cluster, we will configure the eviction policy as `volatile-lru`.

- **Volatile-LRU**: Evicts only keys with an `expire` field set.
- **Rate Limiting Keys**: Always have a short TTL (e.g., 60s). Can safely be evicted if memory is pressured.
- **Session Keys**: (If stored in Redis in the future) will have strict TTLs.
- **Queue Data**: Will NEVER have a TTL, and thus will never be evicted by `volatile-lru`.

## Consequences
- Developers MUST ensure proper TTLs are set on all cache and rate limiting keys.
- Memory usage must be monitored closely to ensure queue data doesn't trigger OOM.
