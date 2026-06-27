# Production Deployment & Configuration Rules

These instructions guide the agent when asked to "configure for production", "deploy to production", or "switch from sandbox to production".

## 1. Environment Variables (.env)
When moving to production, always ensure the following environment variables are correctly transitioned from Sandbox to Production:

- **Midtrans Payment Gateway**:
  - `NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION=true`
  - Update `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY` to the Production Client Key (usually starts with `Mid-client-` instead of `SB-Mid-client-`).
  - Update `MIDTRANS_SERVER_KEY` to the Production Server Key (usually starts with `Mid-server-` instead of `SB-Mid-server-`).

- **Supabase**:
  - Ensure `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` point to the Production Supabase project.

- **App URL**:
  - Verify `NEXT_PUBLIC_APP_URL` is set to the real production domain (e.g., `https://ninoc.store`).

- **Biteship (Shipping)**:
  - Ensure `BITESHIP_API_KEY` is using the production token (usually `biteship_live....`).
  - Check `BITESHIP_WEBHOOK_SECRET` is secured and updated.

## 2. Database & Supabase Configuration
- Before going live, ensure all Postgres database migrations (`supabase/migrations/*.sql`) have been pushed to the production database.
- **CRITICAL - RLS Policies**: Ensure Row Level Security (RLS) policies are safe. NEVER directly query `auth.users` in policies without a `SECURITY DEFINER` function, as this causes `permission denied for table users` errors for `authenticated` users. Always use `auth.jwt()->'user_metadata'` or check against a public table (like `admin_roles` or `admin_users`).
- Make sure webhooks and Edge Functions inside Supabase point to the production API (e.g., Midtrans webhooks, Biteship webhooks).

## 3. UI/UX and Testing Code
- Remove or disable any "Simulate Payment", "Simulate Webhook", or "Test Endpoint" buttons/scripts that were used for local debugging.
- Verify that Turnstile / Captcha keys are using Production keys, not "Always Pass" dummy keys.

## Agent Trigger Phrase
If the user asks: "siapkan untuk production", "ganti ke production", "deploy production", immediately cross-reference this checklist and ask the user for the production secrets (Midtrans, Supabase, dll) to populate the `.env.production` atau `.env.vercel` file.
