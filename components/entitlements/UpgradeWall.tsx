'use client';

import Link from 'next/link';
import { Lock, Sparkles, ArrowRight } from 'lucide-react';
import type { GateResult } from '@/lib/entitlements/gate';
import type { CloudId } from '@/lib/types/cloudEntitlements';

interface UpgradeWallProps {
  gate: GateResult;
  toolName: string;
  toolDescription?: string;
}

const CLOUD_NAMES: Record<CloudId, string> = {
  creation: 'Creation Cloud',
  video: 'Video Cloud',
  writing: 'Writing Cloud',
  file: 'File Cloud',
  monetization: 'Monetization Cloud',
  intelligence: 'Intelligence Cloud',
  music: 'Music Cloud',
  growth: 'Growth Cloud',
  shopping: 'Shopping Cloud',
  advertising: 'Advertising Cloud',
  gaming: 'Gaming Cloud',
  ecommerce: 'E-commerce Cloud',
};

export default function UpgradeWall({ gate, toolName, toolDescription }: UpgradeWallProps) {
  const cloudName = gate.upgrade_cloud_id ? CLOUD_NAMES[gate.upgrade_cloud_id] || gate.upgrade_cloud_id : 'a Cloud subscription';
  const tierLabel = gate.required_tier.charAt(0).toUpperCase() + gate.required_tier.slice(1);

  const getMessage = () => {
    switch (gate.reason) {
      case 'not_logged_in':
        return 'Sign in to access this tool';
      case 'no_entitlement':
        return `Subscribe to ${cloudName} to unlock this tool`;
      case 'tier_too_low':
        return `Upgrade to ${tierLabel} tier to unlock this tool`;
      case 'misconfigured_tool':
        return 'This tool is currently unavailable';
      default:
        return 'This tool requires a subscription';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-400 to-rose-500 mx-auto flex items-center justify-center shadow-lg">
            <Lock className="w-10 h-10 text-white" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-zinc-900 mb-2">
          {toolName}
        </h1>

        {toolDescription && (
          <p className="text-zinc-600 mb-6">
            {toolDescription}
          </p>
        )}

        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm mb-6">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <span className="text-sm font-semibold text-zinc-800">
              {tierLabel.toUpperCase()} Feature
            </span>
          </div>

          <p className="text-zinc-700 mb-6">
            {getMessage()}
          </p>

          {gate.reason === 'not_logged_in' ? (
            <Link
              href="/sign-in"
              className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white rounded-xl font-semibold hover:bg-zinc-800 transition-colors"
            >
              Sign In
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-rose-500 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-rose-600 transition-colors shadow-md"
            >
              View Plans
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>

        <Link
          href="/tools"
          className="text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
        >
          Browse free tools
        </Link>
      </div>
    </div>
  );
}
