"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";

export function AffiliateTracker() {
  const searchParams = useSearchParams();
  const trackedRef = useRef<string | null>(null);

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref && ref !== trackedRef.current) {
      trackedRef.current = ref;
      // Fire and forget
      fetch(`/api/track?ref=${encodeURIComponent(ref)}`).catch(console.error);
    }
  }, [searchParams]);

  return null;
}
