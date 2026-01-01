const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const WINDOW_MS = 60 * 60 * 1000; // 1 hour

interface RateLimitConfig {
  maxRequests: number;
  windowMs?: number;
}

const TOOL_LIMITS: Record<string, RateLimitConfig> = {
  default: { maxRequests: 20 },
  'logo-generator': { maxRequests: 5 },
  'keyword-finder': { maxRequests: 10 },
  'price-matcher': { maxRequests: 15, windowMs: 24 * 60 * 60 * 1000 },
  'brand-access-resolve': { maxRequests: 10 },
  'music-video-parser': { maxRequests: 5 },
};

export function checkRateLimit(
  ip: string, 
  tool: string = 'default'
): { allowed: boolean; remaining: number; resetIn: number } {
  const config = TOOL_LIMITS[tool] || TOOL_LIMITS.default;
  const maxRequests = config.maxRequests;
  const windowMs = config.windowMs || WINDOW_MS;
  
  const key = `${tool}:${ip}`;
  const now = Date.now();
  const record = rateLimitMap.get(key);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, resetIn: windowMs };
  }
  
  if (record.count >= maxRequests) {
    return { 
      allowed: false, 
      remaining: 0, 
      resetIn: record.resetTime - now 
    };
  }
  
  record.count++;
  return { 
    allowed: true, 
    remaining: maxRequests - record.count, 
    resetIn: record.resetTime - now 
  };
}

// Clean up old entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(ip);
    }
  }
}, 10 * 60 * 1000);
