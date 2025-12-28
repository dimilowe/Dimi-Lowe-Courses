import { query } from '@/lib/db';
import { grantCloudEntitlement } from '@/lib/cloudEntitlements';
import type { CloudId, EntitlementTier } from '@/lib/types/cloudEntitlements';

type GrantAccessParams = {
  userId: string;
  offerKey: string;
  cmsSlug?: string | null;
  stripeCustomerId?: string | null;
  stripeSessionId?: string | null;
  amountTotal?: number | null;
};

const CLOUD_OFFER_MAP: Record<
  string,
  { cloudId: CloudId; tier: EntitlementTier }[]
> = {
  'cloud_creation_basic_monthly': [{ cloudId: 'creation', tier: 'basic' }],
  'cloud_creation_pro_monthly': [{ cloudId: 'creation', tier: 'pro' }],
  'cloud_video_basic_monthly': [{ cloudId: 'video', tier: 'basic' }],
  'cloud_video_pro_monthly': [{ cloudId: 'video', tier: 'pro' }],
  'cloud_writing_basic_monthly': [{ cloudId: 'writing', tier: 'basic' }],
  'cloud_writing_pro_monthly': [{ cloudId: 'writing', tier: 'pro' }],
  'cloud_file_basic_monthly': [{ cloudId: 'file', tier: 'basic' }],
  'cloud_file_pro_monthly': [{ cloudId: 'file', tier: 'pro' }],
  'cloud_monetization_basic_monthly': [{ cloudId: 'monetization', tier: 'basic' }],
  'cloud_monetization_pro_monthly': [{ cloudId: 'monetization', tier: 'pro' }],
  'cloud_intelligence_basic_monthly': [{ cloudId: 'intelligence', tier: 'basic' }],
  'cloud_intelligence_pro_monthly': [{ cloudId: 'intelligence', tier: 'pro' }],
  'cloud_music_basic_monthly': [{ cloudId: 'music', tier: 'basic' }],
  'cloud_music_pro_monthly': [{ cloudId: 'music', tier: 'pro' }],
  'cloud_growth_basic_monthly': [{ cloudId: 'growth', tier: 'basic' }],
  'cloud_growth_pro_monthly': [{ cloudId: 'growth', tier: 'pro' }],
  'cloud_shopping_basic_monthly': [{ cloudId: 'shopping', tier: 'basic' }],
  'cloud_shopping_pro_monthly': [{ cloudId: 'shopping', tier: 'pro' }],
  'cloud_advertising_basic_monthly': [{ cloudId: 'advertising', tier: 'basic' }],
  'cloud_advertising_pro_monthly': [{ cloudId: 'advertising', tier: 'pro' }],
  'cloud_all_pro_monthly': [
    { cloudId: 'creation', tier: 'pro' },
    { cloudId: 'video', tier: 'pro' },
    { cloudId: 'writing', tier: 'pro' },
    { cloudId: 'intelligence', tier: 'pro' },
    { cloudId: 'music', tier: 'pro' },
    { cloudId: 'growth', tier: 'pro' },
    { cloudId: 'shopping', tier: 'pro' },
    { cloudId: 'advertising', tier: 'pro' },
    { cloudId: 'gaming', tier: 'pro' },
    { cloudId: 'ecommerce', tier: 'pro' },
  ],
};

export async function grantAccessForOffer(params: GrantAccessParams): Promise<void> {
  const { userId, offerKey, cmsSlug, stripeSessionId, amountTotal } = params;

  await query(
    `INSERT INTO purchases (user_id, product_slug, stripe_payment_intent_id, amount, status, metadata)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      userId,
      cmsSlug,
      stripeSessionId,
      amountTotal,
      "completed",
      JSON.stringify({ offerKey, cmsSlug })
    ]
  );

  await query(
    `INSERT INTO entitlements (user_id, product_slug, source, metadata, updated_at)
     VALUES ($1, $2, $3, $4, NOW())
     ON CONFLICT DO NOTHING`,
    [userId, cmsSlug, "purchase", JSON.stringify({ offerKey })]
  );

  const cloudEnts = CLOUD_OFFER_MAP[offerKey];
  if (cloudEnts) {
    for (const { cloudId, tier } of cloudEnts) {
      await grantCloudEntitlement({
        userId: parseInt(userId, 10),
        cloudId,
        tier,
        source: 'stripe',
      });
    }
  }

  console.log(`[Offers] Granted access: userId=${userId}, offerKey=${offerKey}, cmsSlug=${cmsSlug}`);
}

export async function storePendingPurchase(params: {
  email: string;
  offerKey: string;
  cmsSlug: string;
  stripeSessionId: string;
  amountTotal: number | null;
}): Promise<void> {
  const { email, offerKey, cmsSlug, stripeSessionId, amountTotal } = params;

  await query(
    `INSERT INTO purchases (user_id, product_slug, stripe_payment_intent_id, amount, status, metadata)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      null,
      cmsSlug,
      stripeSessionId,
      amountTotal,
      "pending",
      JSON.stringify({ offerKey, cmsSlug, pendingEmail: email })
    ]
  );

  console.log(`[Offers] Stored pending purchase: email=${email}, offerKey=${offerKey}, cmsSlug=${cmsSlug}`);
}

export async function claimPendingPurchases(userId: string, email: string): Promise<number> {
  const pending = await query(
    `SELECT id, product_slug, metadata FROM purchases 
     WHERE user_id IS NULL 
     AND status = 'pending' 
     AND metadata->>'pendingEmail' = $1`,
    [email.toLowerCase().trim()]
  );

  let claimed = 0;
  for (const purchase of pending.rows) {
    const offerKey = purchase.metadata?.offerKey;
    
    await query(
      `UPDATE purchases SET user_id = $1, status = 'completed' WHERE id = $2`,
      [userId, purchase.id]
    );

    await query(
      `INSERT INTO entitlements (user_id, product_slug, source, metadata, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT DO NOTHING`,
      [userId, purchase.product_slug, "purchase", JSON.stringify({ offerKey })]
    );

    const cloudEnts = CLOUD_OFFER_MAP[offerKey];
    if (cloudEnts) {
      for (const { cloudId, tier } of cloudEnts) {
        await grantCloudEntitlement({
          userId: parseInt(userId, 10),
          cloudId,
          tier,
          source: 'stripe',
        });
      }
    }

    claimed++;
  }

  if (claimed > 0) {
    console.log(`[Offers] Claimed ${claimed} pending purchases for userId=${userId}`);
  }

  return claimed;
}
