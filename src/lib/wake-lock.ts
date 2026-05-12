let wakeLock: WakeLockSentinel | null = null;

export async function requestWakeLock() {
  if (typeof window === "undefined" || !("wakeLock" in navigator)) return;
  try {
    wakeLock = await navigator.wakeLock.request("screen");
    wakeLock.addEventListener("release", () => {
      wakeLock = null;
    });
  } catch {
    // Wake lock request failed (e.g. low battery)
  }
}

export async function releaseWakeLock() {
  if (wakeLock) {
    await wakeLock.release();
    wakeLock = null;
  }
}

export function reacquireOnVisibility() {
  const handler = () => {
    if (document.visibilityState === "visible" && !wakeLock) {
      requestWakeLock();
    }
  };
  document.addEventListener("visibilitychange", handler);
  return () => document.removeEventListener("visibilitychange", handler);
}
