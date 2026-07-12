"use client";

import { Toaster } from "sonner";

import dynamic from "next/dynamic";

const SupportChat = dynamic(() => import("@/components/SupportChat"), { ssr: false });
const QuickBuyModal = dynamic(() => import("@/components/QuickBuyModal"), { ssr: false });
const GlobalCursor = dynamic(() => import("@/components/GlobalCursor"), { ssr: false });
const CookieConsent = dynamic(() => import("@/components/CookieConsent"), { ssr: false });

export default function ClientOverlays() {
  return (
    <>
      <GlobalCursor />
      <Toaster position="top-center" richColors theme="light" />
      <QuickBuyModal />
      <div className="print:hidden">
        <SupportChat />
      </div>
      <CookieConsent />
    </>
  );
}
