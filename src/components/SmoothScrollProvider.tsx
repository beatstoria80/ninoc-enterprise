"use client";

import { useEffect } from 'react';

// Lenis smooth scroll DISABLED — interferes with custom pointer drag on slider
// To re-enable: remove this component from layout.tsx
export default function SmoothScrollProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}