"use client";

import { Toaster } from "sonner";

import dynamic from "next/dynamic";

import { useCart, useCartUI } from "@/store/useCart";
import { WarehouseConflictModal } from "@/components/WarehouseConflictToast";
import { toast } from "sonner";

const SupportChat = dynamic(() => import("@/components/SupportChat"), { ssr: false });
const QuickBuyModal = dynamic(() => import("@/components/QuickBuyModal"), { ssr: false });
const GlobalCursor = dynamic(() => import("@/components/GlobalCursor"), { ssr: false });
const CookieConsent = dynamic(() => import("@/components/CookieConsent"), { ssr: false });

export default function ClientOverlays() {
  const conflictInfo = useCartUI(state => state.conflictInfo);
  const setConflictInfo = useCartUI(state => state.setConflictInfo);
  const clearAndAddItem = useCart(state => state.clearAndAddItem);

  const handleClearAndSwitch = () => {
    if (!conflictInfo) return;
    clearAndAddItem(
      conflictInfo.product,
      conflictInfo.options.size,
      conflictInfo.options.color,
      conflictInfo.options.sizeSurcharge,
      conflictInfo.options.qty,
      conflictInfo.options.maxStock
    );
    toast.success("Keranjang belanja kamu disesuaikan untuk " + conflictInfo.newWarehouseName);
  };

  return (
    <>
      <GlobalCursor />
      <Toaster position="top-center" richColors theme="light" />
      <QuickBuyModal />
      <div className="print:hidden">
        <SupportChat />
      </div>
      <CookieConsent />
      <WarehouseConflictModal
        isOpen={!!conflictInfo?.isOpen}
        onClose={() => setConflictInfo(null)}
        onClearAndSwitch={handleClearAndSwitch}
        currentWarehouseName={conflictInfo?.currentWarehouseName}
        newWarehouseName={conflictInfo?.newWarehouseName}
      />
    </>
  );
}
