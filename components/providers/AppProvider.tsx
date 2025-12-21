'use client';

import { useEffect } from 'react';
import { useUIStore } from '@/lib/state/uiStore';
import { AuthModal } from '@/components/auth-modal';
import UpgradeModal from '@/components/modals/UpgradeModal';
import type { UserTier } from '@/lib/pricing/types';
import type { CloudId, EntitlementTier, CloudEntitlementsMap } from '@/lib/types/cloudEntitlements';

interface AppProviderProps {
  children: React.ReactNode;
  currentTier?: UserTier;
}

interface CloudEntitlementResponse {
  cloud_id: CloudId;
  tier: EntitlementTier;
  status: string;
}

export function AppProvider({ children, currentTier = 'free' }: AppProviderProps) {
  const {
    isAuthModalOpen,
    isUpgradeModalOpen,
    upgradeFeature,
    upgradeRequiredTier,
    closeAuthModal,
    closeUpgradeModal,
    setUserTier,
    setCloudEntitlements,
  } = useUIStore();

  useEffect(() => {
    setUserTier(currentTier);
  }, [currentTier, setUserTier]);

  useEffect(() => {
    async function fetchCloudEntitlements() {
      try {
        const res = await fetch('/api/user/entitlements');
        if (res.ok) {
          const data = await res.json();
          const entitlements: CloudEntitlementResponse[] = data.entitlements || [];
          
          const entitlementsMap: CloudEntitlementsMap = {};
          for (const e of entitlements) {
            if (e.status === 'active' || e.status === 'trial') {
              entitlementsMap[e.cloud_id] = e.tier;
            }
          }
          setCloudEntitlements(entitlementsMap);
        }
      } catch (error) {
        console.error('Failed to fetch cloud entitlements:', error);
      }
    }
    
    fetchCloudEntitlements();
  }, [setCloudEntitlements]);

  const handleAuthSuccess = (userId: string) => {
    closeAuthModal();
    window.location.reload();
  };

  const mappedFeature = upgradeFeature === 'export' ? 'exports' : upgradeFeature;

  return (
    <>
      {children}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={closeAuthModal}
        onSuccess={handleAuthSuccess}
      />
      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={closeUpgradeModal}
        currentTier={currentTier}
        requiredFeature={mappedFeature as 'ai' | 'heavyTools' | 'workflows' | 'exports' | 'memory' | undefined}
        targetTier={upgradeRequiredTier || 'starter'}
      />
    </>
  );
}
