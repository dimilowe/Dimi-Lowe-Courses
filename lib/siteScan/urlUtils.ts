const TRACKING_PARAMS = new Set([
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
  'fbclid', 'gclid', 'gclsrc', 'dclid', 'msclkid',
  'mc_cid', 'mc_eid', 'ref', 'source', 'campaign',
  '_ga', '_gl', 'yclid', 'zanpid', 'sscid'
]);

const IGNORED_PROTOCOLS = new Set([
  'mailto:', 'tel:', 'javascript:', 'data:', 'ftp:', 'file:'
]);

export function normalizeUrl(urlString: string, baseUrl: string, stripQueryParams: boolean = true): string | null {
  if (!urlString || urlString.trim() === '' || urlString === '#') {
    return null;
  }

  for (const proto of IGNORED_PROTOCOLS) {
    if (urlString.toLowerCase().startsWith(proto)) {
      return null;
    }
  }

  try {
    const resolved = new URL(urlString, baseUrl);

    if (!['http:', 'https:'].includes(resolved.protocol)) {
      return null;
    }

    resolved.hash = '';

    if (stripQueryParams) {
      resolved.search = '';
    } else {
      const params = new URLSearchParams(resolved.search);
      const cleaned = new URLSearchParams();
      
      for (const [key, value] of params) {
        if (!TRACKING_PARAMS.has(key.toLowerCase())) {
          cleaned.set(key, value);
        }
      }
      
      resolved.search = cleaned.toString();
    }

    let path = resolved.pathname;
    if (path.length > 1 && path.endsWith('/')) {
      path = path.slice(0, -1);
      resolved.pathname = path;
    }

    return resolved.href;
  } catch {
    return null;
  }
}

export function extractDomain(urlString: string): string | null {
  try {
    const url = new URL(urlString);
    return url.hostname.toLowerCase();
  } catch {
    return null;
  }
}

export function isSameDomain(url1: string, url2: string): boolean {
  const domain1 = extractDomain(url1);
  const domain2 = extractDomain(url2);
  return domain1 !== null && domain1 === domain2;
}

export function isInternalUrl(targetUrl: string, baseDomain: string): boolean {
  const targetDomain = extractDomain(targetUrl);
  if (!targetDomain) return false;
  
  return targetDomain === baseDomain || 
         targetDomain.endsWith('.' + baseDomain) ||
         baseDomain.endsWith('.' + targetDomain);
}
