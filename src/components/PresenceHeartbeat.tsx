import { useMutation } from "convex/react";
import { useEffect } from "react";
import { api } from "@/lib/api";

const HEARTBEAT_INTERVAL = 45_000;

export function PresenceHeartbeat() {
  const touchActive = useMutation(api.profiles.touchActive);

  useEffect(() => {
    let lastHeartbeat = 0;

    function heartbeat() {
      if (document.visibilityState !== "visible") return;
      const now = Date.now();
      if (now - lastHeartbeat < HEARTBEAT_INTERVAL / 2) return;
      lastHeartbeat = now;
      void touchActive({}).catch((error) => {
        if (import.meta.env.DEV) console.error("Presence heartbeat failed.", error);
      });
    }

    heartbeat();
    const interval = window.setInterval(heartbeat, HEARTBEAT_INTERVAL);
    document.addEventListener("visibilitychange", heartbeat);
    window.addEventListener("focus", heartbeat);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", heartbeat);
      window.removeEventListener("focus", heartbeat);
    };
  }, [touchActive]);

  return null;
}
