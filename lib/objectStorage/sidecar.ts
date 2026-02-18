const SIDECAR_URL = 'http://127.0.0.1:1106/';
const CHECK_TTL_MS = 30_000;
const CHECK_TIMEOUT_MS = 250;

let cachedReachability: { ok: boolean; checkedAt: number } | null = null;

export async function isObjectStorageSidecarReachable(): Promise<boolean> {
  const now = Date.now();
  if (cachedReachability && now - cachedReachability.checkedAt < CHECK_TTL_MS) {
    return cachedReachability.ok;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CHECK_TIMEOUT_MS);

  try {
    const response = await fetch(SIDECAR_URL, {
      method: 'GET',
      signal: controller.signal,
      cache: 'no-store',
    });
    const ok = response.status > 0;
    cachedReachability = { ok, checkedAt: now };
    return ok;
  } catch {
    cachedReachability = { ok: false, checkedAt: now };
    return false;
  } finally {
    clearTimeout(timeoutId);
  }
}
