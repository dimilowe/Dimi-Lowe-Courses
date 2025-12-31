'use client';

import Link from 'next/link';
import { Sparkles, ArrowRight, Lock } from 'lucide-react';
import { useUIStore } from '@/lib/state/uiStore';
import { gateTool, getTierBadge } from '@/lib/entitlements/gate';
import type { CloudId, EntitlementTier, CloudEntitlement } from '@/lib/types/cloudEntitlements';

export interface FeaturedTool {
  slug: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  appLabel?: string;
  gradient?: string;
  cloud_ids: CloudId[];
  required_tier: EntitlementTier;
}

interface CloudFeaturedToolsProps {
  tools: FeaturedTool[];
  title?: string;
}

const PLACEHOLDER_GRADIENTS = [
  'from-orange-400 to-rose-500',
  'from-pink-500 to-purple-500',
  'from-cyan-400 to-blue-500',
  'from-green-400 to-teal-500',
  'from-amber-400 to-orange-500',
  'from-indigo-400 to-purple-500',
];

function entitlementsMapToArray(map: Record<string, string> | undefined): CloudEntitlement[] {
  if (!map) return [];
  return Object.entries(map).map(([cloud_id, tier]) => ({
    id: '',
    user_id: 0,
    cloud_id: cloud_id as CloudId,
    tier: tier as EntitlementTier,
    source: 'manual_grant' as const,
    status: 'active' as const,
    valid_from: '',
    valid_to: null,
    created_at: '',
    updated_at: '',
  }));
}

export default function CloudFeaturedTools({ 
  tools, 
  title = 'Featured Tools' 
}: CloudFeaturedToolsProps) {
  const { cloudEntitlements, openUpgradeModal } = useUIStore();
  const isLoggedIn = Object.keys(cloudEntitlements || {}).length > 0;
  const entitlementsArray = entitlementsMapToArray(cloudEntitlements);

  if (tools.length === 0) return null;

  return (
    <div>
      {title && (
        <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-4">
          {title}
        </h2>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tools.map((tool, idx) => {
          const gradient = tool.gradient || PLACEHOLDER_GRADIENTS[idx % PLACEHOLDER_GRADIENTS.length];
          const gateResult = gateTool({
            tool: { required_clouds: tool.cloud_ids, required_tier: tool.required_tier },
            entitlements: entitlementsArray,
            isLoggedIn
          });
          const badge = getTierBadge(tool.required_tier);

          const handleClick = (e: React.MouseEvent) => {
            if (!gateResult.allowed && gateResult.required_tier !== 'free') {
              e.preventDefault();
              const upgradeCloud = gateResult.upgrade_cloud_id || tool.cloud_ids[0];
              openUpgradeModal('cloud', gateResult.required_tier as 'basic' | 'pro', upgradeCloud);
            }
          };
          
          return (
            <Link
              key={tool.slug}
              href={`/tools/${tool.slug}`}
              onClick={handleClick}
              className="group relative rounded-2xl overflow-hidden bg-white border border-zinc-200 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1"
            >
              <div className={`h-40 bg-gradient-to-br ${gradient} relative overflow-hidden`}>
                {tool.thumbnailUrl ? (
                  <img 
                    src={tool.thumbnailUrl} 
                    alt={tool.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-2xl bg-white/30 backdrop-blur-sm flex items-center justify-center shadow-lg">
                      <Sparkles className="w-7 h-7 text-white drop-shadow-md" />
                    </div>
                  </div>
                )}
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                
                {!gateResult.allowed && badge ? (
                  <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-zinc-800/80 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 uppercase tracking-wide shadow-sm">
                    <Lock className="w-3 h-3" />
                    {badge}
                  </span>
                ) : badge ? (
                  <span className="absolute top-3 right-3 inline-flex items-center rounded-full bg-amber-400 text-amber-900 text-[10px] font-bold px-2 py-0.5 uppercase tracking-wide shadow-sm">
                    {badge}
                  </span>
                ) : null}
                
                {tool.appLabel && (
                  <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-md bg-white/90 backdrop-blur-sm text-zinc-800 text-[10px] font-semibold px-2 py-1 uppercase tracking-wide shadow-sm">
                    <div className="w-3 h-3 rounded bg-gradient-to-br from-pink-500 to-orange-400" />
                    {tool.appLabel}
                  </span>
                )}
                
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-sm font-bold text-white group-hover:underline decoration-2 underline-offset-2 flex items-center gap-1 drop-shadow-lg">
                    {tool.title}
                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </h3>
                  {tool.description && (
                    <p className="text-xs text-white/90 line-clamp-1 mt-0.5 drop-shadow-md">
                      {tool.description}
                    </p>
                  )}
                </div>

                {!gateResult.allowed && (
                  <div className="absolute inset-0 bg-white/40 pointer-events-none" />
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
