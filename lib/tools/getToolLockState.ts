'use client';

import type { UserTier } from '@/lib/pricing/types';
import type { CloudId, ToolAccessTier, CloudEntitlementsMap } from '@/lib/types/cloudEntitlements';
import { TIER_ORDER } from '@/lib/entitlements/tiers';

export type HeavyMode = 'none' | 'single' | 'multi';

export type ToolFeature = 'heavyTool' | 'ai' | 'cloud' | null;

export type ToolLockState = {
  locked: boolean;
  feature: ToolFeature;
  requiredTier: UserTier | null;
  requiredCloud: CloudId | null;
};

export type ToolAccessMeta = {
  heavyMode?: HeavyMode;
  hasAi?: boolean;
  requiredCloud?: CloudId | null;
  requiredTier?: ToolAccessTier | null;
};

function hasCloudAccess(
  cloudEntitlements: CloudEntitlementsMap | undefined,
  cloudId: CloudId,
  requiredTier: ToolAccessTier
): boolean {
  if (!cloudEntitlements) return false;
  
  const userTierForCloud = cloudEntitlements[cloudId];
  if (!userTierForCloud) return false;
  
  const userTierIndex = TIER_ORDER.indexOf(userTierForCloud);
  const requiredTierIndex = TIER_ORDER.indexOf(requiredTier);
  
  return userTierIndex >= requiredTierIndex;
}

export function getToolLockState(
  userTier: UserTier,
  meta: ToolAccessMeta,
  cloudEntitlements?: CloudEntitlementsMap
): ToolLockState {
  if (meta.requiredCloud && meta.requiredTier) {
    const hasAccess = hasCloudAccess(cloudEntitlements, meta.requiredCloud, meta.requiredTier);
    
    if (!hasAccess) {
      return {
        locked: true,
        feature: 'cloud',
        requiredTier: meta.requiredTier,
        requiredCloud: meta.requiredCloud,
      };
    }
    
    return {
      locked: false,
      feature: null,
      requiredTier: null,
      requiredCloud: null,
    };
  }

  const heavyMode: HeavyMode = meta.heavyMode ?? 'none';
  const hasAi = !!meta.hasAi;

  if (hasAi && userTier !== 'pro') {
    return {
      locked: true,
      feature: 'ai',
      requiredTier: 'pro',
      requiredCloud: null,
    };
  }

  if (heavyMode === 'single') {
    if (userTier === 'free') {
      return {
        locked: true,
        feature: 'heavyTool',
        requiredTier: 'starter',
        requiredCloud: null,
      };
    }
  }

  if (heavyMode === 'multi') {
    if (userTier === 'free' || userTier === 'starter') {
      return {
        locked: true,
        feature: 'heavyTool',
        requiredTier: 'basic',
        requiredCloud: null,
      };
    }
  }

  return {
    locked: false,
    feature: null,
    requiredTier: null,
    requiredCloud: null,
  };
}
