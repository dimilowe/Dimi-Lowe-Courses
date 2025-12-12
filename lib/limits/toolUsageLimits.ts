import type { CloudEntitlement } from '@/lib/types/cloudEntitlements';
import { hasAccess } from '@/lib/cloudEntitlements';

type ToolLimitKey = 'maxSavedItems';

interface ToolLimitConfig {
  cloudId: string;
  requiredTier: 'basic' | 'pro' | 'enterprise';
  limits: {
    free: Partial<Record<ToolLimitKey, number>>;
    subscribed: Partial<Record<ToolLimitKey, number | null>>;
  };
}

const TOOL_USAGE_LIMITS: Record<string, ToolLimitConfig> = {
  'universal-shopping-cart': {
    cloudId: 'shopping',
    requiredTier: 'basic',
    limits: {
      free: {
        maxSavedItems: 10,
      },
      subscribed: {
        maxSavedItems: null,
      },
    },
  },
};

export interface ToolUsageLimitsResult {
  maxSavedItems?: number | null;
}

export function getToolUsageLimits(params: {
  toolSlug: string;
  cloudEntitlements?: CloudEntitlement[];
}): ToolUsageLimitsResult {
  const { toolSlug, cloudEntitlements } = params;

  const config = TOOL_USAGE_LIMITS[toolSlug];
  if (!config) {
    return {};
  }

  const isSubscribed = hasAccess(
    cloudEntitlements,
    config.cloudId as any,
    config.requiredTier
  );

  const tierLimits = isSubscribed ? config.limits.subscribed : config.limits.free;

  return {
    maxSavedItems: tierLimits.maxSavedItems,
  };
}

export function getToolLimitConfig(toolSlug: string): ToolLimitConfig | null {
  return TOOL_USAGE_LIMITS[toolSlug] || null;
}
