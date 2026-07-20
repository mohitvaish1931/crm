# ADR-001: Production Secrets Strategy

## Status
Accepted

## Context
A multi-tenant SaaS ERP requires rigorous secrets management to ensure API keys, database credentials, and cryptographic keys are never leaked, exposed in version control, or bundled into application images.

## Decision
We will enforce the following Secrets Management Strategy:

1. **Development Environment:**
   - Secrets (e.g., persistent RSA keys) are stored in `.env.local`.
   - `.env.local` is strictly ignored by Git.

2. **Docker Build Process:**
   - Secrets must **never** be passed as Docker `ARG` instructions during the build phase to prevent them from being permanently baked into the image history.
   - Build-time secrets (if absolutely necessary) must use Docker BuildKit's `--secret` mount.

3. **Production Deployment (Kubernetes / ECS):**
   - Application secrets will be managed via a secure vault (e.g., HashiCorp Vault, AWS Secrets Manager, or Kubernetes Secrets injected as environment variables).
   - Node.js will read secrets exclusively from `process.env`.
   - Zod validation will run on startup (via `@nestjs/config`) to guarantee fail-fast behavior if any secret is missing or malformed.

4. **GitHub Actions / CI:**
   - Secrets required for testing or deployment will be managed via GitHub Actions Secrets.
   - No secret will ever be echo'd to logs.

5. **Rotation Policy:**
   - Database credentials and API keys will follow a 90-day rotation policy.

## Consequences
- Developers must manually provision `.env.local` when onboarding.
- The system will crash on startup if required secrets are missing, preventing silent failures.
