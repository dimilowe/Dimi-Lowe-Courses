import type { CloudId, EntitlementTier, CloudEntitlement } from '@/lib/types/cloudEntitlements';

export type GateReason =
  | 'allowed'
  | 'not_logged_in'
  | 'no_entitlement'
  | 'tier_too_low'
  | 'misconfigured_tool';

export interface GateResult {
  allowed: boolean;
  reason: GateReason;
  required_tier: EntitlementTier;
  user_tier_best: EntitlementTier | null;
  upgrade_cloud_id: CloudId | null;
  checked_cloud_ids: CloudId[];
}

export interface ToolAccess {
  required_clouds: CloudId[];
  required_tier: EntitlementTier;
}

const TIER_ORDER: EntitlementTier[] = ['free', 'basic', 'pro', 'enterprise'];

function hasAccess(
  entitlements: CloudEntitlement[] | undefined,
  cloud: CloudId,
  required: EntitlementTier
): boolean {
  const record = entitlements?.find(
    e => e.cloud_id === cloud && (e.status === 'active' || e.status === 'trial')
  );
  if (!record) return false;
  return TIER_ORDER.indexOf(record.tier) >= TIER_ORDER.indexOf(required);
}

export function gateTool(params: {
  tool: ToolAccess;
  entitlements: CloudEntitlement[] | undefined;
  isLoggedIn: boolean;
}): GateResult {
  const { tool, entitlements, isLoggedIn } = params;
  const cloudIds = tool.required_clouds;

  if (!cloudIds || cloudIds.length === 0) {
    return {
      allowed: tool.required_tier === 'free',
      reason: tool.required_tier === 'free' ? 'allowed' : 'misconfigured_tool',
      required_tier: tool.required_tier,
      user_tier_best: null,
      upgrade_cloud_id: null,
      checked_cloud_ids: cloudIds ?? []
    };
  }

  if (tool.required_tier === 'free') {
    return {
      allowed: true,
      reason: 'allowed',
      required_tier: tool.required_tier,
      user_tier_best: null,
      upgrade_cloud_id: null,
      checked_cloud_ids: cloudIds
    };
  }

  if (!isLoggedIn) {
    return {
      allowed: false,
      reason: 'not_logged_in',
      required_tier: tool.required_tier,
      user_tier_best: null,
      upgrade_cloud_id: cloudIds[0] ?? null,
      checked_cloud_ids: cloudIds
    };
  }

  const ok = cloudIds.some(cloudId => hasAccess(entitlements, cloudId, tool.required_tier));

  if (ok) {
    const active = entitlements?.filter(
      e => cloudIds.includes(e.cloud_id) && (e.status === 'active' || e.status === 'trial')
    ) ?? [];
    const best = active
      .map(e => e.tier)
      .sort((a, b) => TIER_ORDER.indexOf(b) - TIER_ORDER.indexOf(a))[0] ?? null;

    return {
      allowed: true,
      reason: 'allowed',
      required_tier: tool.required_tier,
      user_tier_best: best,
      upgrade_cloud_id: null,
      checked_cloud_ids: cloudIds
    };
  }

  const activeEntitlements = entitlements?.filter(
    e => cloudIds.includes(e.cloud_id) && (e.status === 'active' || e.status === 'trial')
  ) ?? [];
  
  const userTierBest = activeEntitlements.length > 0
    ? activeEntitlements
        .map(e => e.tier)
        .sort((a, b) => TIER_ORDER.indexOf(b) - TIER_ORDER.indexOf(a))[0]
    : null;

  let upgradeCloudId: CloudId | null = null;
  
  if (activeEntitlements.length > 0) {
    const sorted = activeEntitlements.sort(
      (a, b) => TIER_ORDER.indexOf(b.tier) - TIER_ORDER.indexOf(a.tier)
    );
    upgradeCloudId = sorted[0].cloud_id;
  } else {
    upgradeCloudId = cloudIds[0] ?? null;
  }

  return {
    allowed: false,
    reason: activeEntitlements.length > 0 ? 'tier_too_low' : 'no_entitlement',
    required_tier: tool.required_tier,
    user_tier_best: userTierBest,
    upgrade_cloud_id: upgradeCloudId,
    checked_cloud_ids: cloudIds
  };
}

export function getTierBadge(required_tier: EntitlementTier): string | null {
  if (required_tier === 'free') return null;
  return required_tier.toUpperCase();
}

export function compareTiers(a: EntitlementTier, b: EntitlementTier): number {
  return TIER_ORDER.indexOf(a) - TIER_ORDER.indexOf(b);
}

export function isValidTier(tier: string): tier is EntitlementTier {
  return TIER_ORDER.includes(tier as EntitlementTier);
}
