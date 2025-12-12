import type { UserTier } from './types';

type MemoryEntitlement = false | 'limited' | 'full';
type HeavyToolsEntitlement = false | 'single-step' | 'multi-step' | 'full';
type WorkflowsEntitlement = false | 'limited' | 'full';
type ExportsEntitlement = 'watermarked' | 'fullres';

export type ShoppingLimits = {
  maxItems: number;
  maxCollections: number;
};

export type CloudEntitlementConfig = {
  memory: MemoryEntitlement;
  ai: boolean;
  heavyTools: HeavyToolsEntitlement;
  workflows: WorkflowsEntitlement;
  workflowLimit: number | 'unlimited';
  exports: ExportsEntitlement;
  shopping: ShoppingLimits;
};

export const CLOUD_ENTITLEMENTS: Record<UserTier, CloudEntitlementConfig> = {
  free: {
    memory: false,
    ai: false,
    heavyTools: false,
    workflows: false,
    workflowLimit: 0,
    exports: 'watermarked',
    shopping: {
      maxItems: 20,
      maxCollections: 1,
    },
  },
  starter: {
    memory: 'limited',
    ai: false,
    heavyTools: 'single-step',
    workflows: 'limited',
    workflowLimit: 3,
    exports: 'fullres',
    shopping: {
      maxItems: Infinity,
      maxCollections: Infinity,
    },
  },
  basic: {
    memory: 'full',
    ai: false,
    heavyTools: 'multi-step',
    workflows: 'full',
    workflowLimit: 'unlimited',
    exports: 'fullres',
    shopping: {
      maxItems: Infinity,
      maxCollections: Infinity,
    },
  },
  pro: {
    memory: 'full',
    ai: true,
    heavyTools: 'full',
    workflows: 'full',
    workflowLimit: 'unlimited',
    exports: 'fullres',
    shopping: {
      maxItems: Infinity,
      maxCollections: Infinity,
    },
  },
};

export function getEntitlementsForTier(tier: UserTier): CloudEntitlementConfig {
  return CLOUD_ENTITLEMENTS[tier] ?? CLOUD_ENTITLEMENTS.free;
}
