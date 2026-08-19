/**
 * Centralized pricing constants — Single Source of Truth.
 *
 * Used by BOTH the client-side Zustand cart store and the server-side
 * PricingEngine to ensure surcharge logic is always in sync.
 *
 * This file intentionally contains NO React or Next.js imports so it
 * can be safely imported from any environment.
 */

/** Sizes that incur an extra surcharge (XXL and above) */
export const SURCHARGE_SIZES = ['XXL', '2XL', '3XL', 'XXXL', '4XL', '5XL'] as const;

/** Extra charge amount for surcharge sizes, in IDR */
export const SIZE_SURCHARGE_AMOUNT = 25000; // Rp 25.000

/** Platform convenience fee per transaction, in IDR */
export const PLATFORM_FEE = 0; // Rp 2.500

/** Maximum length for item names sent to Midtrans */
export const MAX_ITEM_NAME_LENGTH = 50;
