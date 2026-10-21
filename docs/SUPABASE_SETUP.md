# Supabase Auth and tenant identity setup

This is the first implementation slice for Supabase email OTP and tenant membership. It does not by itself migrate campaign/finance data or make the existing in-memory campaign store durable. Keep the app in staging until the remaining items in the release checklist are complete.

## 1. Create the Supabase project

1. Create a project in the Supabase dashboard and keep the database password private.
2. In **Authentication → Providers → Email**, enable email sign-in / OTP.
3. In **Authentication → URL Configuration**, add your staging URL (for example `https://ad-management-production.vercel.app`) to Site URL / Redirect URLs. Add localhost for local development.
4. In **Authentication → SMTP Settings**, configure a production SMTP provider (recommended simple option: Resend SMTP). Do not rely on Supabase's default email service for production delivery.
5. In **Authentication → Rate Limits**, keep OTP/email limits enabled and configure a suitable production limit.

## 2. Apply the schema

Open **SQL Editor**, paste and run `supabase/migrations/001_auth_tenant_foundation.sql`. It creates app profile, organization, and membership tables with RLS. Membership creation is intentionally not available to arbitrary authenticated clients; provisioning must be done through an authenticated owner/invitation workflow.

## 3. Configure Vercel environment variables

Set these in **Vercel → Project → Settings → Environment Variables**. Add them to Preview/Staging first; do not paste secrets into chat or commit them.

- `VITE_SUPABASE_URL`: Supabase Project URL (public).
- `VITE_SUPABASE_ANON_KEY`: Supabase publishable/anon key (public; protected by RLS).
- `SUPABASE_URL`: same project URL, server-side.
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service-role key (server-only; never prefix with `VITE_`).
- `APP_ENV=staging` for the staging deployment.
- `ENABLE_DEMO_AUTH=false`
- `ENABLE_DEV_OTP_CODE=false`

Production must use `APP_ENV=production`, with both demo flags set to `false`. Redeploy after changing variables.

## 4. Membership provisioning

After the first user signs in, create an organization and owner membership using a trusted admin workflow. Do not manually expose service-role credentials in the browser. For initial controlled testing, an administrator can provision the first organization in the Supabase SQL Editor by using the authenticated user's UUID from **Authentication → Users**. Keep a record of the owner and do not grant owner role based on user-editable metadata.

## 5. Release gate (not yet complete)

- Wire Supabase Auth into the app's login/logout UI and validate access tokens on every API request.
- Replace the process-global identity and demo context switching with request-scoped authenticated identity and verified active membership.
- Migrate campaigns, proposals, creative assets, leads, provider connections, and audit events from the in-memory store into durable tables with organization-scoped policies/queries.
- Implement transactional budget approval, durable sessions, invitation flows, and audit writes.
- Add automated API and browser tests for unauthorized requests, cross-tenant access, OTP, role permissions, and mobile navigation.
- Verify provider OAuth/publishing separately before enabling any campaign write action.

Until these are completed and verified, do not use real customer data or live advertising accounts.
