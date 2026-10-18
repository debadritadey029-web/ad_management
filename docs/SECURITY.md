# AdVantage AI — Application Security & Threat Model

## 1. Security Architecture Principles

AdVantage AI enforces defense-in-depth across authentication, authorization, financial safeguards, and external AI integrations.

### 1.1 Authentication & Passwords
- **Algorithm**: Passwords hashed using `node:crypto.scryptSync` with unique 16-byte random salts.
- **Comparison**: Uses `timingSafeEqual` to prevent side-channel timing attacks.
- **Sessions**: High-entropy 64-character hexadecimal tokens generated with `crypto.randomBytes(32)`. Expired sessions are automatically pruned.

### 1.2 Tenant Isolation & Cross-Tenant Protection
- Strict tenant resolution in `resolveContext` middleware.
- Every protected operation enforces active membership in the target organization (`orgId`).
- Access attempts to an organization without membership return `403 TENANT_ACCESS_DENIED`.

### 1.3 Financial Safeguards & Four-Eyes Principle
- Deterministic application-level code enforces:
  1. `requesterUserId !== approverUserId` (Self-approval strictly prohibited).
  2. Budget adjustments exceeding threshold require independent approval.
  3. Budget adjustments cannot exceed organization maximum ceilings.
  4. Emergency Stop blocks all budget modifications and campaign creations organization-wide.

### 1.4 Cryptographic Audit Trail
- Each entry calculates SHA-256 hash chaining to the preceding entry hash.
- Tampering with any field invalidates the chain, detected via `/api/audit`.

### 1.5 AI Safety & Prompt Injection Guard
- LLM outputs are treated as untrusted advisory proposals.
- AI cannot directly modify campaigns or bypass financial rules.
- Input prompt sanitizer strips dangerous regex patterns attempting instruction overrides.

### 1.6 Network & Transport Security
- HTTP Security Headers:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: SAMEORIGIN`
  - `X-XSS-Protection: 1; mode=block`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains` (in production)
- Token bucket rate limiting applied to authentication and AI copilot endpoints.
