'use client';

import Link from 'next/link';
import { Sparkles, ArrowRight, Lock } from 'lucide-react';
import { useUIStore } from '@/lib/state/uiStore';
import { getToolLockState, type HeavyMode } from '@/lib/tools/getToolLockState';
import type { CloudId, ToolAccessTier } from '@/lib/types/cloudEntitlements';

export interface FeaturedTool {
  slug: string;
  title: string;
  description?: string;
  isPro?: boolean;
  thumbnailUrl?: string;
  appLabel?: string;
  gradient?: string;
  heavyMode?: HeavyMode;
  hasAi?: boolean;
  requiredCloud?: CloudId | null;
  requiredTier?: ToolAccessTier | null;
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

function getTierLabel(tier: string | null): string {
  if (tier === 'starter') return 'Starter';
  if (tier === 'basic') return 'Basic';
  if (tier === 'pro') return 'Pro';
  return '';
}

export default function CloudFeaturedTools({ 
  tools, 
  title = 'Featured Tools' 
}: CloudFeaturedToolsProps) {
  const { userTier, cloudEntitlements, openUpgradeModal } = useUIStore();

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
          const lockState = getToolLockState(
            userTier, 
            { 
              heavyMode: tool.heavyMode, 
              hasAi: tool.hasAi,
              requiredCloud: tool.requiredCloud,
              requiredTier: tool.requiredTier,
            },
            cloudEntitlements
          );

          const handleClick = (e: React.MouseEvent) => {
            if (lockState.locked && lockState.requiredTier && lockState.requiredTier !== 'free') {
              e.preventDefault();
              const feature = lockState.feature === 'heavyTool' ? 'heavyTools' : lockState.feature;
              openUpgradeModal(feature, lockState.requiredTier as 'starter' | 'basic' | 'pro', lockState.requiredCloud);
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
                
                {lockState.locked ? (
                  <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-zinc-800/80 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 uppercase tracking-wide shadow-sm">
                    <Lock className="w-3 h-3" />
                    {getTierLabel(lockState.requiredTier)}
                  </span>
                ) : tool.isPro ? (
                  <span className="absolute top-3 right-3 inline-flex items-center rounded-full bg-amber-400 text-amber-900 text-[10px] font-bold px-2 py-0.5 uppercase tracking-wide shadow-sm">
                    PRO
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

                {lockState.locked && (
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
