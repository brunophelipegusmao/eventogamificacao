"use client";

import { Bell, BellOff, BellRing } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const AUTO_PROMPT_KEY = "jm-push-auto-prompt-shown";

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

type Status = "unsupported" | "default" | "granted" | "denied" | "subscribed";

export function PushNotifications() {
  const [status, setStatus] = useState<Status>("unsupported");
  const [busy, setBusy] = useState(false);

  const checkSubscription = useCallback(async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setStatus("denied");
      return;
    }
    if (Notification.permission !== "granted") {
      setStatus("default");
      return;
    }
    const registration = await navigator.serviceWorker.ready;
    const existing = await registration.pushManager.getSubscription();
    setStatus(existing ? "subscribed" : "granted");
  }, []);

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  const subscribe = useCallback(async () => {
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!publicKey) return;

    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "default");
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      await fetch("/api/participant/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription.toJSON()),
      });

      setStatus("subscribed");
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    if (status !== "default") return;
    if (typeof window === "undefined") return;
    if (localStorage.getItem(AUTO_PROMPT_KEY)) return;

    localStorage.setItem(AUTO_PROMPT_KEY, "1");
    subscribe();
  }, [status, subscribe]);

  if (status === "unsupported" || status === "subscribed") {
    return status === "subscribed" ? (
      <span
        className="hidden items-center gap-1 text-xs text-muted-foreground sm:inline-flex"
        title="Notificações ativadas"
      >
        <BellRing className="size-3.5 text-primary" />
      </span>
    ) : null;
  }

  if (status === "denied") {
    return (
      <span
        className="hidden items-center gap-1 text-xs text-muted-foreground sm:inline-flex"
        title="Notificações bloqueadas pelo navegador. Ative manualmente nas configurações do site."
      >
        <BellOff className="size-3.5" />
      </span>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      disabled={busy}
      onClick={subscribe}
      aria-label="Ativar notificações"
      title="Ativar notificações"
    >
      <Bell className="size-4" />
    </Button>
  );
}
