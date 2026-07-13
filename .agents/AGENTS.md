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

# Development Workflow Rule

For every code change made in this project, the agent MUST follow this exact sequence before considering the task complete:
1. **Lint**: Run `npm run lint` to catch syntax and styling errors.
2. **QA & Debug**: Fix any errors that arise from the linter or tests.
3. **Push to GitHub**: Commit the finalized changes and push them to the GitHub repository (`git add`, `git commit`, `git push origin main`).

# Deep Root Configuration (Sandbox vs Production)

**CRITICAL RULE**: Whenever the user asks to switch from "Sandbox" to "Production" (or vice versa), the agent MUST perform a "Deep Root Configuration" scan.
It is NOT enough to just change the `.env` file. The agent must:
1. **API Endpoints & Hardcodes**: Search the entire `src/app/api` directory for any hardcoded `sandbox` or `api.sandbox` URLs (e.g., Midtrans API, Biteship API) and ensure they dynamically switch based on the `NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION` or `NODE_ENV` flags.
2. **Webhooks & CRONs**: Ensure all webhook receivers (`/api/webhooks/*`) and CRON jobs are properly validating signatures using the **Production** secrets, not relying on bypassed Sandbox logic.
3. **Third-Party Features**: Validate that any flows reliant on external Sandbox environments (like testing accounts or dummy data generators) are completely stripped out or disabled in the Production flow.
4. **Agent Action**: If asked to transition to production, immediately list out all deep root configurations that will be affected and ask for confirmation before modifying core logic.

# History Case: Global 500 Error Outage on Vercel (12 July 2026)

**Background & Symptoms:**
The user reported a global 500 Server Error ("This page couldn't load. A server error occurred.") on Vercel production after requesting a new "Cookie Policy" UI to be added. 
The error affected ALL pages globally on `ninoc.store` and the Vercel edge returned an Error Digest hash (e.g. `4274333635`). 
Crucially, the website worked perfectly when running `npm run build` and `npm run start` locally.

**Root Causes Discovered:**
1. **Vercel Hobby Plan Build Failures (`vercel.json`)**: An agent previously set `"maxDuration": 120` in `vercel.json` for Serverless Functions. Since the user was on the Vercel Hobby plan (which enforces a strict 60s maximum limit), this caused the deployment to silently fail on Vercel's end. As a result, critical code fixes were never actually deployed to production, and Vercel continued serving broken cached code.
2. **Next.js `new URL()` Crash (`NEXT_PUBLIC_APP_URL`)**: In `src/app/layout.tsx`, the `generateMetadata` function passed `process.env.NEXT_PUBLIC_APP_URL` directly into `new URL()`. On Vercel, this variable was configured without a protocol (e.g., `ninoc.store` instead of `https://ninoc.store`). Node.js strictly throws `TypeError: Invalid URL` if a protocol is missing, which caused Next.js to fatally crash during Server-Side Rendering (SSR) for every single page.

**Resolution & Rules for Future Agents:**
To prevent this exact scenario from happening again, you MUST observe the following rules:
- **Vercel Limits**: NEVER set `"maxDuration"` greater than `60` in `vercel.json` unless the user explicitly confirms they are on a Vercel Pro/Enterprise plan.
- **URL Parsing**: NEVER pass raw environment variables directly into `new URL()` without validating or prepending a protocol (`http://` or `https://`). Always use a fallback and safety check, e.g.:
  ```typescript
  let rawUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ninoc.store';
  if (!rawUrl.startsWith('http')) rawUrl = `https://${rawUrl}`;
  ```
- **Hydration Mismatches**: When implementing browser-only APIs (like `window` or `localStorage`) inside Client Components, always wrap them in `useEffect` to prevent hydration mismatches, OR import the component using `next/dynamic` with `{ ssr: false }`.
- **Debugging Vercel Errors**: If the user reports a production error that cannot be replicated locally, always check if the Vercel deployment actually succeeded, and check for missing or malformed Environment Variables in Vercel.

# History Case: Biteship Courier Rates Bug & Hardcoded Values (13 July 2026)

**Background & Symptoms:**
The user reported that the courier prices were inaccurate, complaining that prices were "too expensive" or didn't meet their target of 12,000 IDR for regular shipping, and raised concerns about weight aggregation.

**Root Causes Discovered:**
1. **Silent Data Loss in Cart (`weight_grams` & `is_perishable`)**: When adding items to the cart, the hook `useProductSelection.ts` was not passing `weight_grams`, `department_id`, and `is_perishable` to the Zustand `useCart.ts` store. This caused all cart items to fall back to a hardcoded `100g` weight during checkout. It also caused perishable F&B products to bypass the Instant/Sameday courier restrictions because the `is_perishable` flag was lost.
2. **Hardcoded Origin Postal Code Typo (`api/biteship/rates/route.ts`)**: The fallback origin postal code for the primary warehouse (Griya Saluyu, Bandung) was hardcoded to `41254` (Subang) instead of `40292` (Bandung). This caused Grab/Gojek Instant rates to either fail or become astronomically expensive for users in Bandung whenever the database query failed to fetch the real origin.
3. **Misleading Mock Rates (`MOCK_RATES`)**: The fallback/dummy prices for shipping were arbitrarily set to 15,000 IDR for JNE Reguler. When testing without a live API key, the user was confused why the target price (12,000 IDR) was not showing. 

**Resolution & Rules for Future Agents:**
- **State Management & Interfaces**: When adding new fields to a database schema (like `weight_grams` or `is_perishable`), ALWAYS trace the data flow all the way to the frontend state management (like Zustand `CartItem` interfaces) to ensure the data is not being silently stripped out before it reaches critical APIs (like Checkout or Shipping calculations).
- **Hardcoded Geolocation / Magic Numbers**: NEVER use "magic numbers" for critical geolocations (like postal codes or coordinates) without verification. If you must use a fallback, triple-check that it accurately reflects the real-world location (e.g., Bandung is `402xx`, not `412xx`).
- **Mock Rates Alignment**: If the system is running in Sandbox/Mock mode, ensure the dummy data reflects the user's target business goals (e.g., JNE Reguler = 12,000 IDR). Do NOT use generic numbers that might cause confusion during user QA or demos.
