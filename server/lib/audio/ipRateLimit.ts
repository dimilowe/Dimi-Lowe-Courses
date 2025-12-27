interface LockEntry {
  lockedAt: number;
  expiresAt: number;
}

const activeLocks = new Map<string, LockEntry>();

const LOCK_TTL_MS = 120000;
const CLEANUP_INTERVAL_MS = 60000;

setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of activeLocks.entries()) {
    if (now > entry.expiresAt) {
      activeLocks.delete(ip);
    }
  }
}, CLEANUP_INTERVAL_MS);

export function acquireLock(ip: string, ttlMs: number = LOCK_TTL_MS): boolean {
  const now = Date.now();
  const existing = activeLocks.get(ip);
  
  if (existing && now < existing.expiresAt) {
    return false;
  }
  
  activeLocks.set(ip, {
    lockedAt: now,
    expiresAt: now + ttlMs
  });
  
  return true;
}

export function releaseLock(ip: string): void {
  activeLocks.delete(ip);
}

export function isLocked(ip: string): boolean {
  const now = Date.now();
  const existing = activeLocks.get(ip);
  
  if (!existing) return false;
  if (now > existing.expiresAt) {
    activeLocks.delete(ip);
    return false;
  }
  
  return true;
}

export function getActiveLockCount(): number {
  return activeLocks.size;
}
