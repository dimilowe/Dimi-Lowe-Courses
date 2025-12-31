import type { CloudId, EntitlementTier, CloudEntitlement } from '@/lib/types/cloudEntitlements';
import type { Tool } from '@/data/toolsRegistry';

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
  tool: Pick<Tool, 'cloud_ids' | 'required_tier'>;
  entitlements: CloudEntitlement[] | undefined;
  isLoggedIn: boolean;
}): GateResult {
  const { tool, entitlements, isLoggedIn } = params;

  if (!tool.cloud_ids || tool.cloud_ids.length === 0) {
    return {
      allowed: tool.required_tier === 'free',
      reason: tool.required_tier === 'free' ? 'allowed' : 'misconfigured_tool',
      required_tier: tool.required_tier,
      user_tier_best: null,
      upgrade_cloud_id: null,
      checked_cloud_ids: tool.cloud_ids ?? []
    };
  }

  if (tool.required_tier === 'free') {
    return {
      allowed: true,
      reason: 'allowed',
      required_tier: tool.required_tier,
      user_tier_best: null,
      upgrade_cloud_id: null,
      checked_cloud_ids: tool.cloud_ids
    };
  }

  if (!isLoggedIn) {
    return {
      allowed: false,
      reason: 'not_logged_in',
      required_tier: tool.required_tier,
      user_tier_best: null,
      upgrade_cloud_id: tool.cloud_ids[0] ?? null,
      checked_cloud_ids: tool.cloud_ids
    };
  }

  const ok = tool.cloud_ids.some(cloudId => hasAccess(entitlements, cloudId, tool.required_tier));

  if (ok) {
    const active = entitlements?.filter(
      e => tool.cloud_ids.includes(e.cloud_id) && (e.status === 'active' || e.status === 'trial')
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
      checked_cloud_ids: tool.cloud_ids
    };
  }

  const hasSomeEntitlement = entitlements?.some(
    e => tool.cloud_ids.includes(e.cloud_id) && (e.status === 'active' || e.status === 'trial')
  );

  return {
    allowed: false,
    reason: hasSomeEntitlement ? 'tier_too_low' : 'no_entitlement',
    required_tier: tool.required_tier,
    user_tier_best: 'free',
    upgrade_cloud_id: tool.cloud_ids[0] ?? null,
    checked_cloud_ids: tool.cloud_ids
  };
}

export function getTierBadge(required_tier: EntitlementTier): string | null {
  if (required_tier === 'free') return null;
  return required_tier.toUpperCase();
}

export function compareTiers(a: EntitlementTier, b: EntitlementTier): number {
  return TIER_ORDER.indexOf(a) - TIER_ORDER.indexOf(b);
}
