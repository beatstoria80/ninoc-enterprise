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
- **CRITICAL - Supabase Data API Grants (Post-October 30 Rules)**: Supabase no longer automatically grants Data API permissions to new tables in the public schema. When creating any new table in a migration, you MUST explicitly include grants:
  ```sql
  GRANT SELECT ON public.<table_name> TO anon;
  GRANT SELECT, INSERT, UPDATE, DELETE ON public.<table_name> TO authenticated;
  GRANT ALL ON public.<table_name> TO service_role;
  ```
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

# Architecture Audit & System Reference Guide (14 July 2026)

This section serves as the authoritative architectural blueprint and reference guide for any future agent or engineer modifying `ninoc-enterprise`.

## 1. Core Architectural Layers & Stack
- **Framework & Routing**: Next.js 15 (App Router). Dynamic routes include `/shop/[slug]` (product detail) and `/collections/[department]`.
- **Global State & Storage Layer**:
  - `useCart.ts` (`src/store/useCart.ts`): Managed via **Zustand** with synchronous local storage persistence. Always check `isHydrated` before rendering client cart counts to prevent React Hydration Mismatch warnings.
  - `useProductSelection.ts` (`src/hooks/shop/useProductSelection.ts`): The Single Source of Truth for product variant selection (`effectiveSize`, `effectiveColor`, surcharge calculations, and category-specific attributes like `SET OF 2`).
- **Database & Integrations Layer**:
  - **Supabase**: PostgreSQL DB, Authentication, RLS policies, and Realtime notification subscriptions (`user_notifications`).
  - **Midtrans API (`/api/midtrans/`)**: Snap Token generation and HMAC-SHA512 webhook signature verification.
  - **Biteship API (`/api/biteship/`)**: Courier rate engine. Primary warehouse origin postal code is `40292` (Bandung Griya Saluyu).

## 2. Mandatory Rules for UI Interaction & Global Listeners
- **Global Drag Scroll & Pointer Events (`GlobalDragScroll.tsx`)**:
  - NEVER intercept or block mouse/pointer events on semantic interactive elements. Always enforce exclusion selectors:
    ```typescript
    const target = e.target as HTMLElement;
    if (target.closest('.no-drag, nav, header, a, button, input, select, textarea, [role="button"]')) return;
    ```
- **Navigation & Sticky Headers (`GlobalHeader.tsx`)**:
  - Ensure header navigation containers (`<nav>`, navigation link wrappers, and `<NavLink />`) explicitly declare `no-drag pointer-events-auto` so they retain top-level click precedence.

## 3. Product Variant & Add-to-Cart Standard Pattern
When resolving product stock or variant state in modals or views (`ImmersiveProductView`, `QuickBuyModal`, `ShopProductClient`), ALWAYS normalize and match case-insensitively:
```typescript
const effectiveSize = selectedSize || (availableSizes.length > 0 ? availableSizes[0] : '');
const effectiveColor = selectedColor || (availableColors.length > 0 ? availableColors[0] : '');

const safeVariants = Array.isArray(product?.variants) ? product.variants : [];
const selectedVariant = safeVariants.find((v: any) => 
  (!effectiveSize ? true : v?.size?.toUpperCase() === effectiveSize.toUpperCase()) && 
  (!effectiveColor ? true : v?.color?.toUpperCase() === effectiveColor.toUpperCase())
);
```

# Communication & Language Rule

- **Language of Communication**: Selalu berkomunikasi, menulis rencana implementasi, menjelaskan perubahan, dan menjawab pengguna dalam **Bahasa Indonesia**. Ini adalah bahasa default untuk proyek/workspace ini.

# History Case: IT Review Dummy Account for Supplier Dashboard (18 August 2026)

**Background:**
The user requested a bypass for the `Supplier Dashboard` authorization flow (`getCurrentSupplier()`) so that the IT team of "PT Tairflask Indonesia Utama" could review the UI/UX and Navigation Journey without needing to go through the standard `Become a B2B Partner` application and admin approval process.

**Execution & Safety Measures:**
To adhere strictly to **Enterprise-Grade Security Standards**, we deliberately **DID NOT** modify the source code (`layout.tsx` or `supplier.ts`) to inject a bypass or backdoor. Modifying the code would pose a significant security risk to the live production server.

Instead, a dedicated **Dummy IT Review Account** was created directly in the production database and manually mapped to the PT Tairflask Indonesia Utama supplier record via the `supplier_users` table.

**Dummy Account Credentials:**
- **Email:** `audit_it@ninoc.store` (Login Username: `audit_it`)
- **Password:** `akses123!`
- **Supplier Target:** PT Tairflask Indonesia Utama

**Production Safety Note:**
This dummy account is completely isolated within the Supplier B2B context. It **does not** disrupt, intersect with, or impact the Live Production API of general buyer transactions (Checkout, Cart, Midtrans, Biteship). It only has read-write access scoped strictly to the supplier's inventory and analytics. Future AI Agents should recognize this account as a safe demo/review credential and leave it intact unless explicitly asked to remove it.

# History Case: Page Opening Loader Bug & CRITICAL Architecture Rules (25 August 2026)

**Background & Symptoms:**
An agent added a "premium loader" (pulsing NINOC logo + animated loading bar) to `MascotDesktop.tsx` that displayed while the 38MB mascot video (`mascot_ninoc.mp4`) was loading. The loader **blocked the entire page opening experience** — users saw an endless loading animation with no way to interact, making the website appear broken and causing users to leave immediately.

The root cause was that:
1. The `onLoaded` callback was tied to `isVideoReady` (triggered by `onCanPlay`), which only fires after the 38MB video finishes buffering.
2. The `HomeClientWrapper.tsx` state `isMascotLoaded` blocked all UI reveal (text, CTA buttons, navigation) until `onLoaded` fired.
3. On slow connections, this meant the page was permanently stuck on a loading screen.

**Resolution:**
- **Removed** the loader entirely from `MascotDesktop.tsx` (no logo pulse, no loading bar, no blocking overlay).
- **Restored** `onLoaded` to fire immediately on mount — UI reveals after a simple 1-second timer regardless of video load state.
- **Removed** `isMascotLoaded` state from `HomeClientWrapper.tsx`.
- The video element retains `opacity: isVideoReady ? 1 : 0` with CSS transition, so it fades in naturally when ready without blocking anything.

**CRITICAL Rules for Future Agents — DO NOT VIOLATE:**

1. **NEVER add a loader, spinner, or blocking overlay to the page opening sequence.** The opening MUST be instant and interactive. The mascot video (38MB) fades in naturally via CSS opacity transition when ready — this is the correct and final behavior.

2. **NEVER gate UI reveal on video load state.** The `isDesktopRevealed` state in `HomeClientWrapper.tsx` must be controlled by a simple timer (currently 1 second), NOT by any video readiness callback. Users must see the brand copy, CTA button, and navigation immediately.

3. **NEVER add `isMascotLoaded` or similar blocking state** that prevents `DesktopIntroOverlay` or `MobileIntroCard` from appearing until a heavy asset loads.

4. **Protected Files — Opening Sequence Architecture:**
   - `src/components/mascot/MascotDesktop.tsx`: NO loaders, NO blocking overlays. Video fades in via CSS.
   - `src/app/_components/home/HomeClientWrapper.tsx`: Desktop reveal = simple timer. Mobile reveal = touch/auto-reveal timer. NO dependency on video load.
   - `src/components/mascot/MascotVideoConfig.ts`: Nodding timestamps are `noddingStart: 12.25` and `noddingEnd: 15.28` — these are verified frame-accurate values from the source video.
   - `src/components/platforms/mobile/MobileLayout.tsx`: Safe area spacer and padding are conditional on `isOpeningSequence` — do not revert to unconditional rendering.

5. **The page opening animation flow (FINAL, DO NOT CHANGE):**
   - **Desktop**: Background is `#e3e4e7` → mascot video fades in when ready → UI text/CTA rises from bottom (staggered, 0.8s duration, `cubic-bezier(0.23, 1, 0.32, 1)`) after 1 second → user clicks "Get Yours Now" → scene transitions to archive.
   - **Mobile**: Background is `#e3e4e7` → user touches screen (or 5s auto-reveal) → intro card appears → user taps CTA → scene transitions to archive. Header and tab bar are HIDDEN during this entire sequence.


# Infrastructure Note: Meta Configuration

**Rule:** The website infrastructure is already fully integrated with Meta Configurations (WhatsApp Business API, Webhooks, etc). Future agents MUST NOT assume the Meta environment is empty or prompt the user to create a new Meta App from scratch. The environment variables (like `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_ACCESS_TOKEN`, etc.) are already established in the production/sandbox environments. Skip basic Meta onboarding unless explicitly asked to troubleshoot.

# History Case: Supplier Production Security Upgrade & Bypassing KYC (12 September 2026)

**Background & Actions Taken:**
1. **Removed MOCK FALLBACK (`supplier.ts`)**: The system no longer uses hardcoded fallback logic for testing accounts (like `audit_it` or `denim`). All B2B accounts must now explicitly exist in the `supplier_users` and `suppliers` table with a valid `partner_code`.
2. **KYC Onboarding Intercept**: Next.js middleware forces all new Supabase Auth users to complete the `customer_profiles` KYC (First Name, Phone, Address). To bypass this for dummy/testing accounts, a backend script must directly `UPSERT` the user's data into `customer_profiles` with `is_verified: true`.
3. **Ledger UI Overhaul**: The `/supplier/ledger` UI was strictly redesigned to a minimalist, dense, and enterprise-grade layout. Removed giant UI cards and excessive padding.
4. **Route Protection Validation**: The `/supplier` route is impenetrable by unauthorized/foreign users because `layout.tsx` enforces three layers of security: Server-Side JWT Verification -> DB Mapping Check (`supplier_users`) -> Application Status Check (Quarantine screen for `status: 'pending'`).

**Rules for Future Agents:**
- NEVER add `MOCK FALLBACK` back into `getCurrentSupplier()`. The application is now in a Live Production State.
- If you need to create testing accounts for the B2B portal, inject them directly into the DB using the `create-dummy-supplier.mjs` script (which handles Auth, Profiles, Suppliers, and Supplier Users).
- Maintain the minimalist, high-density aesthetic across all internal dashboards. Do not use oversized consumer-facing UI components for B2B tools.

# Infrastructure Note: Google Ads API Authentication (15 September 2026)

**Background & Rules for Future Agents:**
While Google Cloud has shifted towards project-linked IAM-based access for Google Ads, the npm library `google-ads-api@24.x` (used in this project) still **requires** a `developer_token` in the `GoogleAdsApi` constructor. The library sends it as a `developer-token` header on every gRPC/REST call (verified in `node_modules/google-ads-api/build/src/service.js`).

**CRITICAL Rules:**
1. **Developer Token is REQUIRED by the library**: The `GOOGLE_ADS_DEVELOPER_TOKEN` env var MUST be read and passed to the `GoogleAdsApi({ developer_token })` constructor. Passing an empty string causes Google Ads API to **reject ALL requests**, breaking the entire Google Ads Manager UI in the admin dashboard. This was the root cause of a production outage on 17 September 2026.
2. **Access Management**: IAM roles (Owner/Editor) on Google Cloud Project (ID: 558984968121) control API access at the cloud level, but the library still needs the developer token for the HTTP header.
3. **Troubleshooting Guidance**: If the user experiences API access errors, check: (a) `GOOGLE_ADS_DEVELOPER_TOKEN` is set and valid, (b) `GOOGLE_ADS_LOGIN_CUSTOMER_ID` is the MCC ID, (c) `GOOGLE_ADS_CUSTOMER_ID` is the client account ID.
4. **Environment Variables**: The required environment variables for Google Ads API are: `GOOGLE_ADS_CLIENT_ID`, `GOOGLE_ADS_CLIENT_SECRET`, `GOOGLE_ADS_DEVELOPER_TOKEN`, `GOOGLE_ADS_REFRESH_TOKEN`, `GOOGLE_ADS_CUSTOMER_ID` (plus `GOOGLE_ADS_LOGIN_CUSTOMER_ID` if using an MCC).

