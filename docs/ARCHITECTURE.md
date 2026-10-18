# AdVantage AI — System Architecture

## 1. Overview

AdVantage AI is a secure, multi-tenant enterprise advertising management platform engineered to unify advertising operations, multi-currency financial safety, AI-driven recommendations, creative studio production, and messaging lead management.

```
                      +-----------------------------+
                      |   Modern React 19 Frontend  |
                      |   (Vite + Tailwind + i18n)  |
                      +--------------+--------------+
                                     |
               HTTPS / Bearer Auth / x-organization-id
                                     |
                      +--------------v--------------+
                      |    Express API Middleware   |
                      | Security Headers, Limiter,  |
                      | Session & Tenant Isolation  |
                      +--------------+--------------+
                                     |
    +-----------------+--------------+--------------+-----------------+
    |                 |                             |                 |
+---v----+       +----v-----+                  +----v-----+      +----v----+
|  RBAC  |       | Financial|                  | Provider |      |   AI    |
| & Auth |       |  Safety  |                  | Adapters |      | Copilot |
| Module |       |  Engine  |                  | Module   |      | Module  |
+---+----+       +----+-----+                  +----+-----+      +----+----+
    |                 |                             |                 |
    +-----------------+--------------+--------------+-----------------+
                                     |
                      +--------------v--------------+
                      |     Persistence Layer       |
                      |   - Atomic File Snapshot    |
                      |   - PostgreSQL Adapter      |
                      |   - SHA-256 Audit Chain     |
                      +-----------------------------+
```

## 2. Core Modules

### 2.1 Identity & Multi-Tenancy (RBAC)
- **Tenant Isolation**: Every database query, state mutation, campaign, proposal, and audit entry is strictly bound to an `orgId`.
- **RBAC Roles**: `OWNER`, `ADMIN`, `CAMPAIGN_MANAGER`, `ANALYST`, `CREATIVE`, `FINANCE_APPROVER`, `OPERATOR`, and `READ_ONLY`.
- **Last-Owner Protection**: System rejects attempts to remove or demote the sole active owner of an organization.

### 2.2 Central Financial Safety Engine
- **Minor-Unit Arithmetic**: Prevents floating-point errors by storing monetary values as exact integer minor units (e.g. cents for USD/EUR, paise for INR, 0 decimals for JPY, 3 decimals for KWD).
- **Four-Eyes Separation of Duties**: Proposal requesters are strictly blocked from approving their own financial budget adjustments.
- **Optimistic Concurrency & Stale Detection**: Proposals store `campaignVersionAtRequest`. If the campaign is altered after proposal creation, execution is rejected as stale.
- **Central Emergency Stop**: Instant killswitch halting all outbound provider API writes and pausing active campaigns.

### 2.3 Provider Adapters Layer
Official API connectors for:
- Meta Ads (Facebook & Instagram - Graph API v21.0)
- Google Ads & YouTube (API v18)
- TikTok Ads (Marketing API v1.3)
- LinkedIn Ads (Marketing Solutions v2)
- Microsoft Advertising, Pinterest, Snapchat, Reddit, X, and Apple Search Ads.

### 2.4 Cryptographic Audit Trail
Append-only log where each entry contains a SHA-256 hash chaining `prevHash + orgId + actorUserId + action + entityId + timestamp + details`. Built-in live integrity validator detects any record tampering.
