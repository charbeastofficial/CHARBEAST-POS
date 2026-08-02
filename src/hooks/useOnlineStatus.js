import { useEffect, useState } from "react";

const PING_INTERVAL_MS = 15000;
const PING_TIMEOUT_MS = 6000;

// navigator.onLine only reflects whether the OS network adapter is up (it
// can report "online" on a Wi-Fi network with no real internet), so it's
// used just as a fast first signal -- the real answer comes from actually
// reaching Supabase, since that's the one connection the POS can't run
// without.
async function pingSupabase() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!supabaseUrl) return true; // nothing configured to probe -- don't block on it

  try {
    await fetch(`${supabaseUrl}/auth/v1/health`, {
      method: "GET",
      cache: "no-store",
      signal: AbortSignal.timeout(PING_TIMEOUT_MS),
    });
    return true;
  } catch {
    return false;
  }
}

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator === "undefined" ? true : navigator.onLine
  );

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        if (!cancelled) setIsOnline(false);
        return;
      }
      const reachable = await pingSupabase();
      if (!cancelled) setIsOnline(reachable);
    };

    check();
    const interval = setInterval(check, PING_INTERVAL_MS);

    const handleOnline = () => check();
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      cancelled = true;
      clearInterval(interval);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}
