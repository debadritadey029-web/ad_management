# AdVantage AI — Automated Testing Guide

## 1. Test Strategy

AdVantage AI enforces strict automated testing covering:
- Pure business logic & financial arithmetic
- Authentication & session lifecycle
- Multi-tenant data isolation & cross-tenant denial
- Cryptographic audit chain verification & tampering detection
- Emergency stop killswitch enforcement
- Four-eyes separation of duties

## 2. Running the Test Suite

Execute the native Node test runner via tsx:

```bash
npm test
```

### Expected Output
```
TAP version 13
# Subtest: Audit Log: generates valid cryptographically chained entries
ok 1 - Audit Log: generates valid cryptographically chained entries
# Subtest: Audit Log: detects tampering in previous entry details
ok 2 - Audit Log: detects tampering in previous entry details
# Subtest: Auth: password hashing and verification with scrypt
ok 3 - Auth: password hashing and verification with scrypt
# Subtest: Auth: session token creation, validation, and revocation
ok 4 - Auth: session token creation, validation, and revocation
# Subtest: Auth: high-entropy session tokens are unique
ok 5 - Auth: high-entropy session tokens are unique
# Subtest: Financial minor units calculation across multiple currencies
ok 6 - Financial minor units calculation across multiple currencies
# Subtest: Formatting currency respects currency standards
ok 7 - Formatting currency respects currency standards
# Subtest: Financial Policy: Emergency Stop halts any budget changes
ok 8 - Financial Policy: Emergency Stop halts any budget changes
# Subtest: Financial Policy: Four-Eyes Principle prevents self-approval
ok 9 - Financial Policy: Four-Eyes Principle prevents self-approval
# Subtest: Financial Policy: Stale proposal rejected when campaign version changed
ok 10 - Financial Policy: Stale proposal rejected when campaign version changed
# Subtest: Marketing Metrics: accurately calculates ROAS, CTR, CPC, CPA
ok 11 - Marketing Metrics: accurately calculates ROAS, CTR, CPC, CPA
# Subtest: Persistence: Atomic store save creates valid snapshot on disk
ok 12 - Persistence: Atomic store save creates valid snapshot on disk
# Subtest: Persistence: Restores identical state from serialized disk snapshot
ok 13 - Persistence: Restores identical state from serialized disk snapshot
# Subtest: RBAC: permissions match assigned role capabilities
ok 14 - RBAC: permissions match assigned role capabilities
# Subtest: RBAC: Last Owner Protection prevents removal of sole active owner
ok 15 - RBAC: Last Owner Protection prevents removal of sole active owner
# Subtest: RBAC: Non-owner cannot remove an owner
ok 16 - RBAC: Non-owner cannot remove an owner
# Subtest: Tenant Isolation: Organizations have strictly isolated campaign scopes
ok 17 - Tenant Isolation: Organizations have strictly isolated campaign scopes
# Subtest: Tenant Isolation: Membership check prevents non-members from accessing an organization
ok 18 - Tenant Isolation: Membership check prevents non-members from accessing an organization
# Subtest: Tenant Isolation: Budget proposals are strictly scoped to parent organization
ok 19 - Tenant Isolation: Budget proposals are strictly scoped to parent organization
1..19
# tests 19
# pass 19
# fail 0
```

## 3. End-to-End Browser & UI Smoke Testing

```bash
# Run local dev server
npm run dev

# Run Playwright verification
playwright-cli open http://localhost:3000
playwright-cli screenshot --filename=.playwright-cli/verification.png
```
