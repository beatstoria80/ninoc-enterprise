"use client";

import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SafeAreaWrapperProps {
  children: React.ReactNode;
  className?: string;
  /** Enable iOS safe area padding */
  top?: boolean;
  bottom?: boolean;
  left?: boolean;
  right?: boolean;
}

/**
 * SafeAreaWrapper - iOS Safe Area handling for mobile devices
 *
 * Provides proper padding for:
 * - Notch (Dynamic Island on newer iPhones)
 * - Home indicator (bottom bar on Face ID devices)
 * - Status bar
 *
 * Usage:
 * <SafeAreaWrapper top bottom>
 *   <YourContent />
 * </SafeAreaWrapper>
 */
export default function SafeAreaWrapper({
  children,
  className,
  top = false,
  bottom = false,
  left = false,
  right = false
}: SafeAreaWrapperProps) {
  return (
    <div
      className={cn(
        "ios-safe-area",
        // iOS safe area variables
        top && "pt-[env(safe-area-inset-top)]",
        bottom && "pb-[calc(1rem+env(safe-area-inset-bottom))]",
        left && "pl-[env(safe-area-inset-left)]",
        right && "pr-[env(safe-area-inset-right)]",
        // Fallback for non-iOS devices
        "[padding-top:var(--safe-area-top,0px)]",
        "[padding-bottom:var(--safe-area-bottom,0px)]",
        className
      )}
      style={
        {
          // Fallback CSS custom properties for non-iOS
          '--safe-area-top': '0px',
          '--safe-area-bottom': '0px',
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}