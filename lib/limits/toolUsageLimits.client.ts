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

export function getToolUsageLimitsClient(params: {
  toolSlug: string;
  hasShoppingCloudAccess: boolean;
}): ToolUsageLimitsResult {
  const { toolSlug, hasShoppingCloudAccess } = params;

  const config = TOOL_USAGE_LIMITS[toolSlug];
  if (!config) {
    return {};
  }

  const tierLimits = hasShoppingCloudAccess ? config.limits.subscribed : config.limits.free;

  return {
    maxSavedItems: tierLimits.maxSavedItems,
  };
}
