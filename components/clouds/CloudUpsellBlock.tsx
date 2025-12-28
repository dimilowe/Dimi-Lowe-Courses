"use client";

import Link from "next/link";
import { CLOUD_CONFIG_BY_SLUG } from "@/lib/clouds";
import type { CloudSlug } from "@/lib/clouds";
import { ArrowRight, Sparkles } from "lucide-react";

interface CloudUpsellBlockProps {
  cloudSlugs: CloudSlug[];
}

const CLOUD_SLUG_TO_DASHBOARD: Record<CloudSlug, string> = {
  creation: "creation-cloud",
  video: "video-cloud",
  writing_seo: "writing-seo-cloud",
  file_data: "file-data-cloud",
  monetization: "monetization-cloud",
  intelligence: "intelligence-cloud",
  music_performance: "music-performance-cloud",
  growth_distribution: "growth-distribution-cloud",
  shopping: "shopping-cloud",
  advertising: "advertising-cloud",
  gaming: "gaming-cloud",
  ecommerce: "ecommerce-cloud",
};

export function CloudUpsellBlock({ cloudSlugs }: CloudUpsellBlockProps) {
  if (!cloudSlugs || cloudSlugs.length === 0) return null;

  const configs = cloudSlugs
    .map((slug) => CLOUD_CONFIG_BY_SLUG[slug])
    .filter(Boolean);

  if (configs.length === 0) return null;

  return (
    <section className="mt-10 rounded-2xl border border-gray-200 p-6 bg-gradient-to-br from-white via-gray-50 to-purple-50">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-5 h-5 text-purple-500" />
        <h2 className="text-xl font-semibold text-gray-900">
          Part of the VCM Cloud ecosystem
        </h2>
      </div>
      <p className="text-sm text-gray-600 mb-4">
        This tool belongs to one or more VCM Clouds. Explore the full dashboard
        to unlock AI workflows, batch features, and pro-level automations.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        {configs.map((cloud) => (
          <div
            key={cloud.slug}
            className="border border-gray-200 rounded-xl p-4 flex flex-col justify-between bg-white hover:shadow-md transition-shadow"
          >
            <div>
              <div className="text-sm font-semibold mb-1 text-gray-900">{cloud.name}</div>
              <div className="text-xs text-gray-500 mb-3">
                {cloud.shortDescription}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={`/clouds/${CLOUD_SLUG_TO_DASHBOARD[cloud.slug]}`}
                className="inline-flex items-center gap-1 text-xs font-medium text-purple-600 hover:text-purple-700"
              >
                Open dashboard <ArrowRight className="w-3 h-3" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center text-xs text-gray-500 hover:text-gray-700"
              >
                View plans
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
