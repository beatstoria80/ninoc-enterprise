"use client";

import React from 'react';
import { Lock, Shield } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useDictionary } from '@/hooks/useDictionary';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface BottomCTAProps {
  /** Button text */
  text: string;
  /** Loading state */
  isLoading?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Loading state label */
  loadingLabel?: string;
  /** On click handler */
  onClick?: () => void;
  /** Form id for form submit */
  formId?: string;
  /** Final total price to show floating summary */
  totalPrice?: number;
}

/**
 * BottomCTA - Fixed bottom payment button for mobile
 *
 * Features:
 * - Fixed position at bottom of screen
 * - iOS safe area padding
 * - Backdrop blur effect
 * - Full-width touch target
 * - iOS haptic feedback styling
 *
 * Mobile UX best practices:
 * - 44px minimum touch target (we use py-4 ~ 64px)
 * - Thumb zone accessibility
 * - Backdrop blur for premium feel
 * - Safe area consideration for notch/home bar
 */
export default function BottomCTA({
  text,
  isLoading = false,
  disabled = false,
  loadingLabel = "Processing...",
  onClick,
  formId,
  totalPrice
}: BottomCTAProps) {
  const dict = useDictionary();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] ios-bottom-cta">
      {/* Safe area spacer for iOS */}
      <div
        className="h-[env(safe-area-inset-bottom,0px)] bg-white"
        aria-hidden="true"
      />

      {/* CTA Button Container */}
      <div className="bg-white/95 backdrop-blur-xl border-t border-ink/[0.06] shadow-[0_-4px_30px_rgba(0,0,0,0.08)]">
        {/* Content */}
        <div className="px-6 py-4">
          
          {totalPrice !== undefined ? (
            <div className="flex justify-between items-end mb-3 px-1">
              <div className="flex flex-col">
                <span className="text-[10px] md:text-[8px] font-medium uppercase tracking-[0.2em] text-ink/40 mb-0.5">Total</span>
                <span className="text-xl font-display font-medium italic text-rose leading-none">
                  IDR {totalPrice.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="flex items-center gap-1.5 pb-0.5">
                <Shield size={10} className="text-rose/50" />
                <span className="text-[10px] md:text-[8px] font-medium uppercase tracking-wider text-ink/30">Secured</span>
              </div>
            </div>
          ) : (
            <div className="flex justify-center gap-6 mb-3">
              <div className="flex items-center gap-1.5">
                <Shield size={10} className="text-rose/50" />
                <span className="text-[11px] md:text-[8px] font-medium uppercase tracking-wider text-ink/30">{dict.checkout.secure}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Lock size={10} className="text-rose/50" />
                <span className="text-[11px] md:text-[8px] font-medium uppercase tracking-wider text-ink/30">{dict.checkout.encrypted}</span>
              </div>
            </div>
          )}

          {/* Main CTA Button */}
          {formId ? (
            <button
              type="submit"
              form={formId}
              disabled={disabled || isLoading}
              className={cn(
                "w-full py-4 rounded-none text-xs md:text-[10px] font-medium uppercase tracking-widest transition-all flex items-center justify-center gap-3",
                // iOS active state styling
                "active:scale-[0.98] active:bg-rose/90",
                // Disabled state
                disabled || isLoading
                  ? "bg-ink/5 text-ink/20 cursor-not-allowed"
                  : "bg-ink text-white shadow-lg shadow-ink/10"
              )}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 border-[1.5px] border-white/20 border-t-white rounded-full animate-spin" />
                  <span>{loadingLabel}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Lock size={12} />
                  <span>{text}</span>
                </div>
              )}
            </button>
          ) : (
            <button
              type="button"
              disabled={disabled || isLoading}
              onClick={onClick}
              className={cn(
                "w-full py-4 rounded-none text-xs md:text-[10px] font-medium uppercase tracking-widest transition-all flex items-center justify-center gap-3",
                "active:scale-[0.98] active:bg-rose/90",
                disabled || isLoading
                  ? "bg-ink/5 text-ink/20 cursor-not-allowed"
                  : "bg-ink text-white shadow-lg shadow-ink/10"
              )}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 border-[1.5px] border-white/20 border-t-white rounded-full animate-spin" />
                  <span>{loadingLabel}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Lock size={12} />
                  <span>{text}</span>
                </div>
              )}
            </button>
          )}
        </div>
      </div>

      <style jsx>{`
        .ios-bottom-cta {
          /* iOS momentum scroll prevention when scrolling up from bottom */
          transform: translateZ(0);
          -webkit-backface-visibility: hidden;
          -webkit-perspective: 1000;
        }

        /* iOS-specific safe area handling via CSS */
        @supports (padding: env(safe-area-inset-bottom)) {
          .ios-bottom-cta {
            padding-bottom: env(safe-area-inset-bottom);
          }
        }

        /* Prevent content scroll when touching CTA */
        .ios-bottom-cta button:active {
          -webkit-tap-highlight-color: transparent;
        }
      `}</style>
    </div>
  );
}