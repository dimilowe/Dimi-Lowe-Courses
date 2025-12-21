import { create } from 'zustand';
import type { UserTier } from '@/lib/pricing/types';
import type { CloudId, CloudEntitlementsMap } from '@/lib/types/cloudEntitlements';

type UpgradeFeature = 'export' | 'exports' | 'heavyTools' | 'heavyTool' | 'ai' | 'workflows' | 'memory' | 'cloud' | null;
type Tier = 'starter' | 'basic' | 'pro' | null;

interface UIState {
  userTier: UserTier;
  setUserTier: (tier: UserTier) => void;

  cloudEntitlements: CloudEntitlementsMap;
  setCloudEntitlements: (entitlements: CloudEntitlementsMap) => void;

  isAuthModalOpen: boolean;
  isUpgradeModalOpen: boolean;
  upgradeFeature: UpgradeFeature;
  upgradeRequiredTier: Tier;
  upgradeRequiredCloud: CloudId | null;

  openAuthModal: () => void;
  closeAuthModal: () => void;

  openUpgradeModal: (feature: UpgradeFeature, tier: Tier, cloud?: CloudId | null) => void;
  closeUpgradeModal: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  userTier: 'free',
  setUserTier: (tier) => set({ userTier: tier }),

  cloudEntitlements: {},
  setCloudEntitlements: (entitlements) => set({ cloudEntitlements: entitlements }),

  isAuthModalOpen: false,
  isUpgradeModalOpen: false,
  upgradeFeature: null,
  upgradeRequiredTier: null,
  upgradeRequiredCloud: null,

  openAuthModal: () => set({ isAuthModalOpen: true }),
  closeAuthModal: () => set({ isAuthModalOpen: false }),

  openUpgradeModal: (feature, tier, cloud = null) =>
    set({
      isUpgradeModalOpen: true,
      upgradeFeature: feature,
      upgradeRequiredTier: tier,
      upgradeRequiredCloud: cloud,
    }),

  closeUpgradeModal: () =>
    set({
      isUpgradeModalOpen: false,
      upgradeFeature: null,
      upgradeRequiredTier: null,
      upgradeRequiredCloud: null,
    }),
}));
