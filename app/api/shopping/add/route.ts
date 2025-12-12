import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUserWithTier } from '@/lib/pricing/getCurrentUserWithTier';
import { getEntitlementsForTier } from '@/lib/pricing/cloudEntitlements';
import { scrapeProductFromUrl } from '@/lib/shopping/scraper';
import { extractStoreDomain, cleanStoreName, getAffiliateUrlForProduct } from '@/lib/shopping/affiliateUrl';

interface UrlModePayload {
  mode: 'url';
  url: string;
  collectionId?: string;
  tags?: string[];
}

interface DirectModePayload {
  mode: 'direct';
  title: string;
  imageUrl?: string;
  canonicalUrl: string;
  affiliateUrl?: string;
  store?: string;
  priceCurrent?: number;
  currency?: string;
  collectionId?: string;
  tags?: string[];
}

type AddItemPayload = UrlModePayload | DirectModePayload;

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUserWithTier();
    if (!user) {
      return NextResponse.json(
        { error: 'Please log in to save items.', loginRequired: true },
        { status: 401 }
      );
    }

    const entitlements = getEntitlementsForTier(user.subscription_tier);
    const { maxItems } = entitlements.shopping;

    const countResult = await query(
      'SELECT COUNT(*) as count FROM shopping_items WHERE user_id = $1',
      [user.id]
    );
    const currentCount = parseInt(countResult.rows[0].count, 10);

    if (currentCount >= maxItems) {
      return NextResponse.json(
        {
          error: `You've reached your limit of ${maxItems} saved items. Upgrade to save more.`,
          upgradeRequired: true,
          requiredTier: 'starter',
          feature: 'shoppingItems',
          currentLimit: maxItems,
        },
        { status: 403 }
      );
    }

    const body: AddItemPayload = await request.json();

    let title: string;
    let imageUrl: string | null;
    let canonicalUrl: string;
    let affiliateUrl: string | null = null;
    let store: string;
    let priceCurrent: number | null = null;
    let currency = 'USD';
    let collectionId: string | null = body.collectionId || null;
    let tags: string[] = body.tags || [];

    if (body.mode === 'url') {
      if (!body.url) {
        return NextResponse.json({ error: 'URL is required' }, { status: 400 });
      }

      canonicalUrl = body.url;
      const scraped = await scrapeProductFromUrl(body.url);
      title = scraped.title;
      imageUrl = scraped.imageUrl;
      priceCurrent = scraped.price;
      currency = scraped.currency;
      store = scraped.store;

      const affiliateResult = getAffiliateUrlForProduct(canonicalUrl, store);
      affiliateUrl = affiliateResult?.url || null;
    } else if (body.mode === 'direct') {
      if (!body.canonicalUrl) {
        return NextResponse.json({ error: 'canonicalUrl is required' }, { status: 400 });
      }
      if (!body.title) {
        return NextResponse.json({ error: 'title is required' }, { status: 400 });
      }

      title = body.title;
      imageUrl = body.imageUrl || null;
      canonicalUrl = body.canonicalUrl;
      affiliateUrl = body.affiliateUrl || null;
      store = body.store || cleanStoreName(extractStoreDomain(canonicalUrl));
      priceCurrent = body.priceCurrent ?? null;
      currency = body.currency || 'USD';

      if (!affiliateUrl) {
        const affiliateResult = getAffiliateUrlForProduct(canonicalUrl, store);
        affiliateUrl = affiliateResult?.url || null;
      }
    } else {
      return NextResponse.json({ error: 'Invalid mode. Use "url" or "direct".' }, { status: 400 });
    }

    const insertResult = await query(
      `INSERT INTO shopping_items 
       (user_id, collection_id, title, image_url, canonical_url, affiliate_url, store, price_current, currency, tags)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [user.id, collectionId, title, imageUrl, canonicalUrl, affiliateUrl, store, priceCurrent, currency, tags]
    );

    const item = insertResult.rows[0];

    if (priceCurrent !== null) {
      await query(
        `INSERT INTO shopping_price_snapshots (item_id, price, currency) VALUES ($1, $2, $3)`,
        [item.id, priceCurrent, currency]
      );
    }

    return NextResponse.json({
      success: true,
      item: {
        id: item.id,
        title: item.title,
        imageUrl: item.image_url,
        canonicalUrl: item.canonical_url,
        affiliateUrl: item.affiliate_url,
        store: item.store,
        priceCurrent: item.price_current ? parseFloat(item.price_current) : null,
        currency: item.currency,
        tags: item.tags,
        collectionId: item.collection_id,
        createdAt: item.created_at,
      },
    });
  } catch (error) {
    console.error('Shopping add error:', error);
    return NextResponse.json({ error: 'Failed to add item' }, { status: 500 });
  }
}
