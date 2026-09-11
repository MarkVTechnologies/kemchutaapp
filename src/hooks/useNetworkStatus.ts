import { useState, useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import axios from "axios";
import { apiClient } from "@/services/api/client";
import { subscribeNetworkSignal } from "@/services/networkSignal";

// Reuses the same axios client every other network call in the app already
// goes through, rather than a bare fetch() — a raw fetch() with an
// AbortController/HEAD combo turned out to fail unpredictably on this RN/
// Android stack even while every axios-based request in the app succeeded,
// which was making this check report "offline" while the app was clearly
// online (content loading fine on screen at the same time).
//
// GET, not HEAD: HEAD responses correctly carry the same Content-Length a
// GET would (per HTTP spec) while sending zero body bytes — React Native's
// native networking layer doesn't tolerate that mismatch as gracefully as
// curl/browsers do, so HEAD requests to this backend hung/failed here even
// though curl and every GET in the app worked fine against the same URL.
//
// /healthz, not /api/estates: a tiny purpose-built health check instead of
// a real ~70KB data endpoint, so this doesn't cost real bandwidth every 30s.
const HEALTH_URL = "/healthz";
const POLL_INTERVAL_MS = 30_000;
// Cold start fires a burst of real requests (estate list/detail images, data
// fetches) that compete for the same connection pool as this check. A short
// timeout here isn't a "no internet" signal in that window — it's the health
// check queued behind real work. Confirmed on-device: DNS resolved and a raw
// TCP connect to the API host succeeded instantly while the app still showed
// this banner, so the network itself was never the problem — the check was
// just too impatient during cold start.
const TIMEOUT_MS = 10_000;
// Wait for the initial request burst to clear before the first probe at all,
// instead of racing it from the moment the app mounts.
const INITIAL_PROBE_DELAY_MS = 5_000;
// After a failure, recheck soon (real outages should still surface quickly)
// rather than waiting a full poll interval.
const RETRY_AFTER_FAILURE_MS = 5_000;
// A single failed probe is routinely just cold-start jitter (OS radio/DNS
// still settling right after app launch) rather than a real outage — require
// this many consecutive failures before reporting offline.
const FAILURES_BEFORE_OFFLINE = 2;

async function checkOnline(): Promise<boolean> {
  try {
    await apiClient.get(HEALTH_URL, { timeout: TIMEOUT_MS });
    return true;
  } catch (err) {
    // /healthz can itself return a non-2xx (e.g. 503 when the server's own
    // database is degraded) — but getting ANY HTTP response at all, even an
    // error one, proves the device's network path to the internet works.
    // Only a true network-level failure (timeout, DNS, no connection —
    // where axios never got a response to reject with) means "offline".
    return axios.isAxiosError(err) && !!err.response;
  }
}

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const consecutiveFailures = useRef(0);
  const mountedRef = useRef(true);

  const scheduleNext = (delay: number) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(runProbe, delay);
  };

  const runProbe = async () => {
    const online = await checkOnline();
    if (!mountedRef.current) return;

    if (online) {
      consecutiveFailures.current = 0;
      setIsOnline(true);
      scheduleNext(POLL_INTERVAL_MS);
    } else {
      consecutiveFailures.current += 1;
      if (consecutiveFailures.current >= FAILURES_BEFORE_OFFLINE) {
        setIsOnline(false);
      }
      scheduleNext(RETRY_AFTER_FAILURE_MS);
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    const mountedAt = Date.now();
    scheduleNext(INITIAL_PROBE_DELAY_MS);

    // Real screens' own API calls are just as good a signal as the dedicated
    // probe — a successful one clears a false "offline" state immediately
    // instead of waiting for the next poll cycle to happen to land on a
    // healthy edge node.
    const unsubscribe = subscribeNetworkSignal((online) => {
      if (!mountedRef.current) return;
      if (online) {
        consecutiveFailures.current = 0;
        setIsOnline(true);
      } else {
        consecutiveFailures.current += 1;
        if (consecutiveFailures.current >= FAILURES_BEFORE_OFFLINE) {
          setIsOnline(false);
        }
      }
    });

    const sub = AppState.addEventListener("change", (state: AppStateStatus) => {
      // Android/RN can fire an "unknown -> active" transition of its own
      // moments after cold start, independent of the mount effect above —
      // without this guard that becomes a second immediate probe racing the
      // same cold-start request burst the initial delay exists to avoid.
      if (state === "active" && Date.now() - mountedAt > INITIAL_PROBE_DELAY_MS) {
        scheduleNext(0);
      }
    });

    return () => {
      mountedRef.current = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      sub.remove();
      unsubscribe();
    };
  }, []);

  return { isOnline };
}
