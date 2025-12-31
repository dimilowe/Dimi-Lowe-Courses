import type { CloudId, EntitlementTier, CloudEntitlement } from '@/lib/types/cloudEntitlements';
import type { Tool } from '@/data/toolsRegistry';

export type GateReason = 'allowed' | 'not_logged_in' | 'no_entitlement' | 'tier_too_low';

export interface GateResult {
  allowed: boolean;
  reason: GateReason;
  cloud_id: CloudId;
  required_tier: EntitlementTier;
  user_tier: EntitlementTier | null;
}

const TIER_ORDER: EntitlementTier[] = ['free', 'basic', 'pro', 'enterprise'];

export function gateTool(
  tool: Pick<Tool, 'cloud_id' | 'required_tier'>,
  entitlements: CloudEntitlement[] | undefined,
  isLoggedIn: boolean
): GateResult {
  if (tool.required_tier === 'free') {
    return {
      allowed: true,
      reason: 'allowed',
      cloud_id: tool.cloud_id,
      required_tier: tool.required_tier,
      user_tier: null
    };
  }

  if (!isLoggedIn) {
    return {
      allowed: false,
      reason: 'not_logged_in',
      cloud_id: tool.cloud_id,
      required_tier: tool.required_tier,
      user_tier: null
    };
  }

  const record = entitlements?.find(
    e => e.cloud_id === tool.cloud_id && (e.status === 'active' || e.status === 'trial')
  );

  if (!record) {
    return {
      allowed: false,
      reason: 'no_entitlement',
      cloud_id: tool.cloud_id,
      required_tier: tool.required_tier,
      user_tier: 'free'
    };
  }

  const allowed = TIER_ORDER.indexOf(record.tier) >= TIER_ORDER.indexOf(tool.required_tier);

  return {
    allowed,
    reason: allowed ? 'allowed' : 'tier_too_low',
    cloud_id: tool.cloud_id,
    required_tier: tool.required_tier,
    user_tier: record.tier
  };
}

export function getTierBadge(required_tier: EntitlementTier): string | null {
  if (required_tier === 'free') return null;
  return required_tier.toUpperCase();
}

export function compareTiers(a: EntitlementTier, b: EntitlementTier): number {
  return TIER_ORDER.indexOf(a) - TIER_ORDER.indexOf(b);
}
