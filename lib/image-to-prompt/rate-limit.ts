import { headers } from 'next/headers';
import { recordApiInvocation } from '@/lib/ops/metrics';

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 30;

export async function getClientIP(): Promise<string> {
  const headersList = await headers();
  
  const xForwardedFor = headersList.get('x-forwarded-for');
  if (xForwardedFor) {
    const firstIP = xForwardedFor.split(',')[0].trim();
    if (firstIP) return firstIP;
  }
  
  const xRealIP = headersList.get('x-real-ip');
  if (xRealIP) return xRealIP.trim();
  
  const cfConnectingIP = headersList.get('cf-connecting-ip');
  if (cfConnectingIP) return cfConnectingIP.trim();
  
  return 'unknown';
}

export function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetIn: number } {
  recordApiInvocation('/api/image-to-prompt');
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + WINDOW_MS });
    return { allowed: true, remaining: MAX_REQUESTS - 1, resetIn: WINDOW_MS };
  }

  if (record.count >= MAX_REQUESTS) {
    return { allowed: false, remaining: 0, resetIn: record.resetTime - now };
  }

  record.count += 1;
  return { allowed: true, remaining: MAX_REQUESTS - record.count, resetIn: record.resetTime - now };
}

if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of rateLimitMap.entries()) {
      if (now > record.resetTime) {
        rateLimitMap.delete(ip);
      }
    }
  }, 60 * 1000);
}
