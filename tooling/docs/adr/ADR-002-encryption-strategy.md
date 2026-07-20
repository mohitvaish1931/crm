# ADR-002: Encryption & Cryptography Strategy

## Status
Accepted

## Context
The ERP handles distinct types of sensitive data: passwords, PII, and JWT signatures. Each requires a specialized cryptographic approach to balance security, performance, and recoverability.

## Decision
We will segment cryptography into three distinct layers:

1. **Hashing (Passwords): Argon2id**
   - Passwords must be irreversible.
   - We use `Argon2id` as it provides memory-hard protection against GPU brute-forcing and trade-offs against side-channel attacks.

2. **Encryption (PII & API Keys): AES-256-GCM**
   - Certain fields (e.g., third-party API integrations like Stripe/SendGrid keys, highly sensitive PII) require reversible encryption.
   - We will use `AES-256-GCM` (Galois/Counter Mode). GCM provides authenticated encryption, meaning it verifies both the confidentiality and authenticity (integrity) of the cipher text.
   - The master encryption key must be rotated annually.

3. **Signing (JWTs): RS256 (RSA Signature with SHA-256)**
   - Access Tokens are stateless and verified by potentially multiple services.
   - We use asymmetric cryptography (RS256) rather than symmetric (HS256).
   - The Auth Service signs the token using the Private Key. Future downstream microservices will only require the Public Key to verify the token, preventing the leakage of the signing key.

## Consequences
- Requires strict management of the AES master key and RSA key pair.
- Asymmetric JWT verification is slightly slower than symmetric, but the architectural decoupling provides overwhelming long-term value.
