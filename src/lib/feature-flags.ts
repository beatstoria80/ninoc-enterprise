/**
 * NINOC Feature Flags — Centralized Kill Switches
 *
 * Controls feature visibility across the application.
 * Even if code is merged to main, features remain hidden
 * until their flag is explicitly enabled in environment variables.
 */

export const FEATURE_FLAGS = {
  /**
   * WhatsApp Commerce Channel
   *
   * When false: "Lanjut via WhatsApp" button is hidden on Checkout page.
   * When true:  WhatsApp checkout flow is available to users.
   *
   * MUST remain false in production until all 12 graduation criteria
   * in the implementation plan are met.
   *
   * @see implementation_plan.md — Section "Graduation Criteria"
   */
  WA_COMMERCE_ENABLED:
    process.env.NEXT_PUBLIC_WA_COMMERCE_ENABLED === 'true',

  /**
   * WhatsApp Commerce — Sandbox Mode
   *
   * When true: All WA commerce operations are tagged as sandbox.
   * When false: Operations are treated as production.
   *
   * This flag controls the `is_sandbox` column in wa_commerce_* tables
   * and affects which Meta API credentials are used.
   */
  WA_COMMERCE_SANDBOX:
    process.env.NEXT_PUBLIC_WA_COMMERCE_SANDBOX !== 'false', // Default: true (safe)
} as const;

/**
 * Type-safe feature flag checker
 */
export function isFeatureEnabled(
  flag: keyof typeof FEATURE_FLAGS
): boolean {
  return FEATURE_FLAGS[flag];
}
