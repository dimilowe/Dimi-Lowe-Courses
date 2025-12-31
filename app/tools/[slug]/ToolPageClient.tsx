'use client';

import { useEffect, useState, ComponentType } from 'react';
import { ToolForRenderer } from '@/lib/cms/getCmsToolBySlug';
import { getEngineLoader, EngineComponentProps } from '@/lib/engineRegistry';
import ToolComingSoon from '@/components/engines/ToolComingSoon';
import { CloudUpsellBlock } from '@/components/clouds/CloudUpsellBlock';
import UpgradeWall from '@/components/entitlements/UpgradeWall';
import { gateTool, GateResult } from '@/lib/entitlements/gate';
import { hasAccess, cloudSlugToId } from '@/lib/cloudEntitlements.client';
import type { CloudEntitlement, CloudId, EntitlementTier } from '@/lib/types/cloudEntitlements';

interface ToolPageClientProps {
  tool: ToolForRenderer;
  hasEngine: boolean;
}

export default function ToolPageClient({ tool, hasEngine }: ToolPageClientProps) {
  const [EngineComponent, setEngineComponent] = useState<ComponentType<EngineComponentProps> | null>(null);
  const [loading, setLoading] = useState(hasEngine);
  const [entitlements, setEntitlements] = useState<CloudEntitlement[]>([]);
  const [entitlementsLoading, setEntitlementsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    fetch('/api/user/entitlements')
      .then(res => res.json())
      .then(data => {
        setEntitlements(data.entitlements || []);
        setIsLoggedIn(data.isLoggedIn ?? false);
        setEntitlementsLoading(false);
      })
      .catch(() => {
        setEntitlementsLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!hasEngine || !tool.engine) {
      setLoading(false);
      return;
    }

    const loader = getEngineLoader(tool.engine);
    if (!loader) {
      setLoading(false);
      return;
    }

    loader()
      .then((mod) => {
        setEngineComponent(() => mod.default);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [hasEngine, tool.engine]);

  const required_clouds: CloudId[] = (tool.requiredClouds as CloudId[]) || 
    (tool.cloudTags?.map(tag => cloudSlugToId(tag)).filter((id): id is CloudId => id !== null) || []);
  const required_tier = tool.requiredTier || 'free';

  const gateResult: GateResult | null = !entitlementsLoading ? gateTool({
    tool: { required_clouds, required_tier },
    entitlements,
    isLoggedIn
  }) : null;

  const primaryCloudId = required_clouds[0] || null;
  const canUsePro = primaryCloudId && hasAccess(entitlements, primaryCloudId, 'pro');
  const canUseBasic = primaryCloudId && hasAccess(entitlements, primaryCloudId, 'basic');

  if (loading || entitlementsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse">
          <div className="w-16 h-16 bg-orange-200 rounded-full mx-auto mb-4" />
          <div className="h-4 bg-gray-200 rounded w-48" />
        </div>
      </div>
    );
  }

  if (gateResult && !gateResult.allowed) {
    return (
      <UpgradeWall
        gate={gateResult}
        toolName={tool.name}
        toolDescription={tool.description}
      />
    );
  }

  if (!EngineComponent) {
    return <ToolComingSoon tool={tool} />;
  }

  return (
    <>
      <EngineComponent 
        tool={tool} 
        canUsePro={canUsePro || false}
        canUseBasic={canUseBasic || false}
        entitlementsLoading={entitlementsLoading}
      />
      {tool.cloudTags && tool.cloudTags.length > 0 && (
        <div className="max-w-4xl mx-auto px-4 pb-12">
          <CloudUpsellBlock cloudSlugs={tool.cloudTags} />
        </div>
      )}
    </>
  );
}
