import { useState, useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";

const CHECK_URL = "https://clients3.google.com/generate_204";
const POLL_INTERVAL_MS = 30_000;

async function checkOnline(): Promise<boolean> {
  try {
    const res = await fetch(CHECK_URL, { method: "HEAD", cache: "no-cache" });
    return res.status === 204 || res.ok;
  } catch {
    return false;
  }
}

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const probe = async () => {
    const online = await checkOnline();
    setIsOnline(online);
  };

  useEffect(() => {
    probe();
    intervalRef.current = setInterval(probe, POLL_INTERVAL_MS);

    const sub = AppState.addEventListener("change", (state: AppStateStatus) => {
      if (state === "active") probe();
    });

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      sub.remove();
    };
  }, []);

  return { isOnline };
}
