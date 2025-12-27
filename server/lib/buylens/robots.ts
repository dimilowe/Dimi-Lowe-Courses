import { USER_AGENT } from "./types";

const robotsCache = new Map<string, { allowed: Set<string>; disallowed: Set<string>; fetched: boolean }>();

export async function checkRobotsAllowed(domain: string, path: string): Promise<boolean> {
  const cacheKey = domain.toLowerCase();
  
  if (!robotsCache.has(cacheKey)) {
    try {
      const robotsUrl = `https://${domain}/robots.txt`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(robotsUrl, {
        headers: { "User-Agent": USER_AGENT },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        robotsCache.set(cacheKey, { allowed: new Set(["*"]), disallowed: new Set(), fetched: true });
        return true;
      }
      
      const text = await response.text();
      const { allowed, disallowed } = parseRobotsTxt(text);
      robotsCache.set(cacheKey, { allowed, disallowed, fetched: true });
    } catch (error) {
      robotsCache.set(cacheKey, { allowed: new Set(["*"]), disallowed: new Set(), fetched: true });
      return true;
    }
  }
  
  const rules = robotsCache.get(cacheKey)!;
  
  for (const pattern of rules.disallowed) {
    if (pathMatches(path, pattern)) {
      return false;
    }
  }
  
  return true;
}

function parseRobotsTxt(text: string): { allowed: Set<string>; disallowed: Set<string> } {
  const allowed = new Set<string>();
  const disallowed = new Set<string>();
  
  const lines = text.split("\n");
  let inOurSection = false;
  let inWildcardSection = false;
  
  for (const line of lines) {
    const trimmed = line.trim().toLowerCase();
    
    if (trimmed.startsWith("user-agent:")) {
      const agent = trimmed.replace("user-agent:", "").trim();
      if (agent === "*") {
        inWildcardSection = true;
        inOurSection = false;
      } else if (agent.includes("buylens") || agent.includes("bot")) {
        inOurSection = true;
        inWildcardSection = false;
      } else {
        inOurSection = false;
        inWildcardSection = false;
      }
    } else if (inOurSection || inWildcardSection) {
      if (trimmed.startsWith("disallow:")) {
        const path = trimmed.replace("disallow:", "").trim();
        if (path) {
          disallowed.add(path);
        }
      } else if (trimmed.startsWith("allow:")) {
        const path = trimmed.replace("allow:", "").trim();
        if (path) {
          allowed.add(path);
        }
      }
    }
  }
  
  return { allowed, disallowed };
}

function pathMatches(path: string, pattern: string): boolean {
  if (pattern === "/") return false;
  if (pattern.endsWith("*")) {
    return path.startsWith(pattern.slice(0, -1));
  }
  return path.startsWith(pattern);
}

export function clearRobotsCache(): void {
  robotsCache.clear();
}
