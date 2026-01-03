import dns from 'dns';
import { promisify } from 'util';

const dnsLookup = promisify(dns.lookup);

const PRIVATE_RANGES = [
  { start: 0x0A000000, end: 0x0AFFFFFF },
  { start: 0xAC100000, end: 0xAC1FFFFF },
  { start: 0xC0A80000, end: 0xC0A8FFFF },
  { start: 0x7F000000, end: 0x7FFFFFFF },
  { start: 0x00000000, end: 0x000000FF },
  { start: 0xA9FE0000, end: 0xA9FEFFFF },
  { start: 0xE0000000, end: 0xEFFFFFFF },
];

const BLOCKED_METADATA_IPS = [
  '169.254.169.254',
  '100.100.100.200',
  'fd00:ec2::254',
];

const BLOCKED_HOSTNAMES = [
  'localhost',
  'localhost.localdomain',
  'metadata.google.internal',
  'metadata.goog',
];

function ipToInt(ip: string): number {
  const parts = ip.split('.').map(Number);
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

function isPrivateIP(ip: string): boolean {
  if (ip.includes(':')) {
    const lower = ip.toLowerCase();
    if (lower === '::1' || lower.startsWith('fe80:') || lower.startsWith('fc') || lower.startsWith('fd')) {
      return true;
    }
    return false;
  }

  const ipInt = ipToInt(ip);
  for (const range of PRIVATE_RANGES) {
    if (ipInt >= range.start && ipInt <= range.end) {
      return true;
    }
  }
  return false;
}

export async function validateUrlSafety(urlString: string): Promise<{ safe: boolean; error?: string }> {
  let url: URL;
  try {
    url = new URL(urlString);
  } catch {
    return { safe: false, error: 'Invalid URL format' };
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    return { safe: false, error: `Blocked protocol: ${url.protocol}` };
  }

  const hostname = url.hostname.toLowerCase();

  if (BLOCKED_HOSTNAMES.some(h => hostname === h || hostname.endsWith('.' + h))) {
    return { safe: false, error: 'Blocked hostname' };
  }

  const ipMatch = hostname.match(/^(\d{1,3}\.){3}\d{1,3}$/);
  if (ipMatch) {
    if (isPrivateIP(hostname) || BLOCKED_METADATA_IPS.includes(hostname)) {
      return { safe: false, error: 'Blocked IP address' };
    }
    return { safe: true };
  }

  try {
    const result = await dnsLookup(hostname);
    const resolvedIp = result.address;
    
    if (isPrivateIP(resolvedIp) || BLOCKED_METADATA_IPS.includes(resolvedIp)) {
      return { safe: false, error: `Hostname resolves to blocked IP: ${resolvedIp}` };
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'DNS lookup failed';
    return { safe: false, error: `DNS resolution failed: ${message}` };
  }

  return { safe: true };
}

export function quickUrlCheck(urlString: string): { valid: boolean; error?: string } {
  try {
    const url = new URL(urlString);
    
    if (!['http:', 'https:'].includes(url.protocol)) {
      return { valid: false, error: `Invalid protocol: ${url.protocol}` };
    }
    
    const hostname = url.hostname.toLowerCase();
    if (BLOCKED_HOSTNAMES.includes(hostname)) {
      return { valid: false, error: 'Blocked hostname' };
    }
    
    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid URL' };
  }
}
