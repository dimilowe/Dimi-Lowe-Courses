import * as cheerio from 'cheerio';
import { extractStoreDomain, cleanStoreName } from './affiliateUrl';

export interface ScrapedProductData {
  title: string;
  imageUrl: string | null;
  price: number | null;
  currency: string;
  store: string;
}

export async function scrapeProductFromUrl(url: string): Promise<ScrapedProductData> {
  const store = cleanStoreName(extractStoreDomain(url));
  
  const fallback: ScrapedProductData = {
    title: 'Unknown Product',
    imageUrl: null,
    price: null,
    currency: 'USD',
    store,
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; VCMBot/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`Scrape failed for ${url}: HTTP ${response.status}`);
      return fallback;
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) {
      console.warn(`Scrape failed for ${url}: Not HTML (${contentType})`);
      return fallback;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const title =
      $('meta[property="og:title"]').attr('content') ||
      $('meta[name="twitter:title"]').attr('content') ||
      $('title').text().trim() ||
      'Unknown Product';

    const imageUrl =
      $('meta[property="og:image"]').attr('content') ||
      $('meta[name="twitter:image"]').attr('content') ||
      null;

    let price: number | null = null;
    let currency = 'USD';

    const jsonLdScripts = $('script[type="application/ld+json"]');
    jsonLdScripts.each((_i, el) => {
      try {
        const json = JSON.parse($(el).html() || '');
        const product = json['@type'] === 'Product' ? json : json['@graph']?.find((item: { '@type': string }) => item['@type'] === 'Product');
        if (product?.offers) {
          const offer = Array.isArray(product.offers) ? product.offers[0] : product.offers;
          if (offer.price) {
            price = parseFloat(offer.price);
            currency = offer.priceCurrency || 'USD';
          }
        }
      } catch {
      }
    });

    if (price === null) {
      const priceFromMeta = $('meta[property="product:price:amount"]').attr('content');
      if (priceFromMeta) {
        price = parseFloat(priceFromMeta);
        currency = $('meta[property="product:price:currency"]').attr('content') || 'USD';
      }
    }

    return {
      title: title.substring(0, 500),
      imageUrl,
      price: isNaN(price as number) ? null : price,
      currency,
      store,
    };
  } catch (error) {
    console.error(`Scrape error for ${url}:`, error);
    return fallback;
  }
}
