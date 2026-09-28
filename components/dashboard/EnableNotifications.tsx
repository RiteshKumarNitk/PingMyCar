"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

type Status = "checking" | "unsupported" | "off" | "granted" | "denied" | "error";

export function EnableNotifications() {
  const [status, setStatus] = useState<Status>("checking");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function check() {
      if (typeof window === "undefined" || !("Notification" in window) || !("serviceWorker" in navigator)) {
        setStatus("unsupported");
        return;
      }
      if (Notification.permission === "denied") {
        setStatus("denied");
        return;
      }
      if (Notification.permission === "granted") {
        // Permission alone doesn't mean this browser has an active push
        // subscription — check for one before hiding the banner.
        try {
          const registration = await navigator.serviceWorker.getRegistration("/sw.js");
          const existing = await registration?.pushManager.getSubscription();
          setStatus(existing ? "granted" : "off");
        } catch {
          setStatus("off");
        }
        return;
      }
      setStatus("off");
    }
    check();
  }, []);

  async function enable() {
    setLoading(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "off");
        setLoading(false);
        return;
      }

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        setStatus("error");
        setLoading(false);
        return;
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      const res = await fetch("/api/devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription.toJSON()),
      });

      setStatus(res.ok ? "granted" : "error");
    } catch {
      setStatus("error");
    }
    setLoading(false);
  }

  if (status === "checking" || status === "unsupported") return null;

  if (status === "granted") {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
        <BellRing className="size-4 text-success" aria-hidden />
        Browser notifications on
      </span>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-comm/25 bg-comm-bg px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="flex items-start gap-2.5 text-sm text-foreground/80">
        {status === "denied" ? (
          <BellOff className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
        ) : (
          <Bell className="mt-0.5 size-4 shrink-0 text-comm" aria-hidden />
        )}
        {status === "denied"
          ? "Notifications are blocked in your browser settings."
          : status === "error"
            ? "Couldn't enable notifications. Try again."
            : "Get notified in your browser when someone messages you."}
      </p>
      {status !== "denied" && (
        <Button size="sm" variant="outline" loading={loading} onClick={enable} className="self-start sm:self-auto">
          {loading ? "Enabling…" : "Enable notifications"}
        </Button>
      )}
    </div>
  );
}
