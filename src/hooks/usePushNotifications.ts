"use client";

import { useEffect } from "react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return new Uint8Array([...rawData].map((c) => c.charCodeAt(0)));
}

export const usePushNotifications = () => {
  useEffect(() => {
    const initPush = async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

      // 1️⃣ Register service worker (from next-pwa, sw.js is auto-generated)
      const registration = await navigator.serviceWorker.ready;

      // 2️⃣ Request permission
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return;

      // 3️⃣ Subscribe user
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ),
      });

      // 4️⃣ Send subscription to backend
      await fetch("/api/subscribe", {
        method: "POST",
        body: JSON.stringify(subscription),
        headers: { "Content-Type": "application/json" },
      });
    };

    initPush();
  }, []);
};
