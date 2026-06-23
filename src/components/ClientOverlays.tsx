"use client";

import dynamic from "next/dynamic";
import { Toaster } from "sonner";

const SupportChat = dynamic(() => import("@/components/SupportChat"), { ssr: false });
const QuickBuyModal = dynamic(() => import("@/components/QuickBuyModal"), { ssr: false });

export default function ClientOverlays() {
  return (
    <>
      <Toaster position="top-center" richColors theme="light" />
      <QuickBuyModal />
      <div className="print:hidden">
        <SupportChat />
      </div>
    </>
  );
}
