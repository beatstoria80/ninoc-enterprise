"use client";

import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function PushNotificationManager() {
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const [showBanner, setShowBanner] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);

  const subscribeUser = async () => {
    setIsSubscribing(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

      if (!vapidPublicKey) {
        console.error("[Push] VAPID public key not found");
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as any,
      });

      const subJson = subscription.toJSON();

      // Send subscription to our API
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: subJson.endpoint,
          keys: {
            p256dh: subJson.keys?.p256dh,
            auth: subJson.keys?.auth,
          },
        }),
      });

      console.log("[Push] Subscription saved successfully");
      setPermission("granted");
      setShowBanner(false);
    } catch (err) {
      console.error("[Push] Subscription failed:", err);
    } finally {
      setIsSubscribing(false);
    }
  };

  useEffect(() => {
    const initPush = async () => {
      if (!("Notification" in window) || !("serviceWorker" in navigator)) {
        setPermission("unsupported");
        return;
      }

      setPermission(Notification.permission);

      // Register Service Worker
      try {
        const reg = await navigator.serviceWorker.register("/sw.js");
        console.log("[PWA] Service Worker registered:", reg.scope);
      } catch (err) {
        console.error("[PWA] Service Worker registration failed:", err);
      }

      // Show banner if not yet granted and not dismissed recently
      if (Notification.permission === "default") {
        const dismissed = localStorage.getItem("ninoc_push_dismissed");
        if (!dismissed || Date.now() - parseInt(dismissed) > 7 * 24 * 60 * 60 * 1000) {
          // Show after a small delay so it doesn't feel intrusive
          setTimeout(() => setShowBanner(true), 5000);
        }
      } else if (Notification.permission === "granted") {
        // Auto-subscribe silently if already granted
        subscribeUser();
      }
    };
    
    initPush();
  }, []);



  const handleEnable = async () => {
    const result = await Notification.requestPermission();
    setPermission(result);

    if (result === "granted") {
      await subscribeUser();
    } else {
      setShowBanner(false);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem("ninoc_push_dismissed", Date.now().toString());
  };

  if (!showBanner || permission === "granted" || permission === "unsupported" || permission === "denied") {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:bottom-4 sm:w-[380px] z-[9999] animate-in slide-in-from-bottom-4 duration-500">
      <div className="bg-ink text-white rounded-lg shadow-2xl border border-white/10 p-4 flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-rose/20 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Bell size={18} className="text-rose" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-widest text-white/90 mb-1">
            Aktifkan Notifikasi
          </p>
          <p className="text-[10px] text-white/60 leading-relaxed">
            Dapatkan update real-time untuk status pesanan, pembayaran, dan pengiriman Anda langsung di browser.
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleEnable}
              disabled={isSubscribing}
              className="flex-1 bg-rose text-white py-1.5 px-3 rounded text-[10px] font-bold uppercase tracking-widest hover:bg-rose/90 transition-colors disabled:opacity-50"
            >
              {isSubscribing ? "Mengaktifkan..." : "Aktifkan"}
            </button>
            <button
              onClick={handleDismiss}
              className="px-2 py-1.5 text-white/40 hover:text-white/80 transition-colors"
              aria-label="Tutup"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
