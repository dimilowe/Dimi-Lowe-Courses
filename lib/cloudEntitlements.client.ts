import type { CloudEntitlement, CloudId } from '@/lib/types/cloudEntitlements';
import type { CloudSlug } from '@/lib/clouds';
import { TIER_ORDER, type EntitlementTier } from '@/lib/entitlements/tiers';

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
  gaming: 'gaming',
  ecommerce: 'ecommerce',
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
