"use client";

import { Toaster } from "sonner";

import SupportChat from "@/components/SupportChat";
import QuickBuyModal from "@/components/QuickBuyModal";
import GlobalCursor from "@/components/GlobalCursor";

export default function ClientOverlays() {
  return (
    <>
      <GlobalCursor />
      <Toaster position="top-center" richColors theme="light" />
      <QuickBuyModal />
      <div className="print:hidden">
        <SupportChat />
      </div>
    </>
  );
}
