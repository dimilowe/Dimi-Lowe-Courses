import { query } from '@/lib/db';
import type { 
  CloudEntitlement, 
  CloudId, 
  EntitlementTier, 
  EntitlementSource, 
  EntitlementStatus 
} from '@/lib/types/cloudEntitlements';
import type { CloudSlug } from '@/lib/clouds';

const TIER_ORDER: EntitlementTier[] = ['free', 'basic', 'pro', 'enterprise'];

const CLOUD_SLUG_TO_ID: Record<CloudSlug, CloudId> = {
  creation: 'creation',
  video: 'video',
  writing_seo: 'writing',
  file_data: 'file',
  monetization: 'monetization',
  intelligence: 'intelligence',
  music_performance: 'music',
  growth_distribution: 'growth',
  shopping: 'shopping',
  advertising: 'advertising',
};

export function cloudSlugToId(slug: CloudSlug): CloudId {
  return CLOUD_SLUG_TO_ID[slug];
}

export function hasAccess(
  entitlements: CloudEntitlement[] | undefined,
  cloud: CloudId,
  required: EntitlementTier
): boolean {
  if (!entitlements?.length) return false;

  const record = entitlements.find(
    (e) => e.cloud_id === cloud && (e.status === 'active' || e.status === 'trial')
  );

  if (!record) return false;

  return TIER_ORDER.indexOf(record.tier) >= TIER_ORDER.indexOf(required);
}

export async function getCloudEntitlementsForUser(
  userId: number
): Promise<CloudEntitlement[]> {
  const { rows } = await query(
    `SELECT * FROM cloud_entitlements
     WHERE user_id = $1
       AND status IN ('active', 'trial')`,
    [userId]
  );

  return rows as CloudEntitlement[];
}

export async function grantCloudEntitlement(params: {
  userId: number;
  cloudId: CloudId;
  tier: EntitlementTier;
  source: EntitlementSource;
  status?: EntitlementStatus;
  validFrom?: Date;
  validTo?: Date | null;
}): Promise<void> {
  const {
    userId,
    cloudId,
    tier,
    source,
    status = 'active',
    validFrom = new Date(),
    validTo = null,
  } = params;

  await query(
    `INSERT INTO cloud_entitlements
       (user_id, cloud_id, tier, source, status, valid_from, valid_to)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (user_id, cloud_id)
     DO UPDATE SET
       tier = EXCLUDED.tier,
       source = EXCLUDED.source,
       status = EXCLUDED.status,
       valid_from = EXCLUDED.valid_from,
       valid_to = EXCLUDED.valid_to,
       updated_at = NOW()`,
    [userId, cloudId, tier, source, status, validFrom, validTo]
  );

  console.log(`[CloudEntitlements] Granted: userId=${userId}, cloudId=${cloudId}, tier=${tier}`);
}

export async function revokeCloudEntitlement(
  userId: number,
  cloudId: CloudId
): Promise<void> {
  await query(
    `UPDATE cloud_entitlements 
     SET status = 'canceled', updated_at = NOW()
     WHERE user_id = $1 AND cloud_id = $2`,
    [userId, cloudId]
  );

  console.log(`[CloudEntitlements] Revoked: userId=${userId}, cloudId=${cloudId}`);
}

export type CloudEntitlementDetails = {
  tier: EntitlementTier;
  status: EntitlementStatus;
  currentPeriodEnd: Date | null;
  stripeSubscriptionId: string | null;
} | null;

export async function getUserCloudEntitlement(
  userId: number,
  cloudId: string
): Promise<CloudEntitlementDetails> {
  const { rows } = await query(
    `SELECT tier, status, current_period_end, stripe_subscription_id
     FROM cloud_entitlements
     WHERE user_id = $1 AND cloud_id = $2
     ORDER BY created_at DESC
     LIMIT 1`,
    [userId, cloudId]
  );

  if (!rows[0]) return null;

  return {
    tier: rows[0].tier as EntitlementTier,
    status: rows[0].status as EntitlementStatus,
    currentPeriodEnd: rows[0].current_period_end ? new Date(rows[0].current_period_end) : null,
    stripeSubscriptionId: rows[0].stripe_subscription_id || null,
  };
}
