// canonical - Single source of truth for entitlement tiers
// Run `npx tsx scripts/check-tier-duplicates.ts` to verify no duplicates exist
export const ENTITLEMENT_TIERS = ['free', 'starter', 'basic', 'pro'] as const;
export type EntitlementTier = (typeof ENTITLEMENT_TIERS)[number];

export const TIER_ORDER: readonly EntitlementTier[] = ENTITLEMENT_TIERS;

export function tierIndex(tier: string): number {
  const i = TIER_ORDER.indexOf(tier as EntitlementTier);
  return i === -1 ? -1 : i;
}

export function isEntitlementTier(tier: string): tier is EntitlementTier {
  return TIER_ORDER.includes(tier as EntitlementTier);
}
