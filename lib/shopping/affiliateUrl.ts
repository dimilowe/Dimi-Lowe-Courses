export type AffiliateProvider = 'none' | 'impact' | 'ltk' | 'awin' | 'custom';

export type AffiliateUrlResult = {
  url: string;
  provider: AffiliateProvider;
};

export function getAffiliateUrlForProduct(
  canonicalUrl: string,
  _storeDomain?: string
): AffiliateUrlResult | null {
  return { url: canonicalUrl, provider: 'none' };
}

export function extractStoreDomain(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace(/^www\./, '').split('.').slice(0, -1).join('.') || hostname;
  } catch {
    return 'Unknown Store';
  }
}

export function cleanStoreName(domain: string): string {
  const storeMap: Record<string, string> = {
    'amazon': 'Amazon',
    'ebay': 'eBay',
    'etsy': 'Etsy',
    'nordstrom': 'Nordstrom',
    'asos': 'ASOS',
    'zara': 'Zara',
    'hm': 'H&M',
    'uniqlo': 'Uniqlo',
    'shein': 'SHEIN',
    'target': 'Target',
    'walmart': 'Walmart',
    'macys': "Macy's",
    'bloomingdales': 'Bloomingdales',
    'sephora': 'Sephora',
    'ulta': 'Ulta',
    'nike': 'Nike',
    'adidas': 'Adidas',
    'gap': 'Gap',
    'oldnavy': 'Old Navy',
    'jcrew': 'J.Crew',
    'anthropologie': 'Anthropologie',
    'urbanoutfitters': 'Urban Outfitters',
    'freepeople': 'Free People',
    'revolve': 'Revolve',
    'ssense': 'SSENSE',
    'farfetch': 'Farfetch',
    'net-a-porter': 'NET-A-PORTER',
    'mytheresa': 'Mytheresa',
  };
  
  const normalized = domain.toLowerCase().replace(/[^a-z0-9]/g, '');
  for (const [key, value] of Object.entries(storeMap)) {
    if (normalized.includes(key)) {
      return value;
    }
  }
  
  return domain.charAt(0).toUpperCase() + domain.slice(1);
}
