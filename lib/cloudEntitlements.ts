// Billing compatibility: existing offers and subscriptions use cloud_entitlements.
// Keep stored grant identifiers stable when fulfilling existing purchases.
import { query } from '@/lib/db';
import type { CloudId, EntitlementSource, EntitlementStatus, EntitlementTier } from '@/lib/types/cloudEntitlements';

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
