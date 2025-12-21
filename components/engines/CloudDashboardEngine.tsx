"use client";

import { useState, useEffect } from "react";
import type { CloudDashboardEngineConfig, CMSObject } from "@/lib/types/cms";
import { getCloudTheme, resolveCloudId } from "@/lib/cloudTheme";
import CloudDashboardLayout from "@/components/clouds/CloudDashboardLayout";
import CloudHero from "@/components/clouds/CloudHero";
import CloudPrimaryCards, { PrimaryCardData } from "@/components/clouds/CloudPrimaryCards";
import CloudCategoryTabs from "@/components/clouds/CloudCategoryTabs";
import CloudFeaturedTools, { FeaturedTool } from "@/components/clouds/CloudFeaturedTools";
import CloudRecentFilesRail from "@/components/clouds/CloudRecentFilesRail";
import CloudAppRow from "@/components/clouds/CloudAppRow";
import CloudShortcuts from "@/components/clouds/CloudShortcuts";

type CloudDashboardProps = {
  cms: CMSObject & { engine_config: CloudDashboardEngineConfig };
};

type HeavyMode = 'none' | 'single' | 'multi';

type TaggedTool = {
  slug: string;
  title: string;
  description: string;
  featured: boolean;
  segment?: string;
  heavyMode?: HeavyMode;
  hasAi?: boolean;
  requiredCloud?: string | null;
  requiredTier?: string | null;
};

export default function CloudDashboardEngine({ cms }: CloudDashboardProps) {
  const { hero, featuredProducts, appRow, shortcuts } = cms.engine_config;

  const theme = getCloudTheme(cms.slug);
  const cloudId = resolveCloudId(cms.slug);
  const cloudSlugForApi = cloudId ? `${cloudId}-cloud` : cms.slug;

  const [taggedTools, setTaggedTools] = useState<TaggedTool[]>([]);
  const [loadingTools, setLoadingTools] = useState(true);
  const [activeTab, setActiveTab] = useState("featured");

  useEffect(() => {
    async function fetchTaggedTools() {
      try {
        const res = await fetch(`/api/clouds/${cloudSlugForApi}/tools`);
        if (res.ok) {
          const data = await res.json();
          setTaggedTools(data.tools || []);
        }
      } catch (error) {
        console.error("Failed to fetch tagged tools:", error);
      } finally {
        setLoadingTools(false);
      }
    }
    fetchTaggedTools();
  }, [cloudSlugForApi]);

  const primaryCards: PrimaryCardData[] = featuredProducts.map((item) => ({
    title: item.title,
    description: item.description,
    primaryLabel: item.primaryCta.label,
    primaryHref: item.primaryCta.label === "View plans" ? "/pricing" : item.primaryCta.href,
    secondaryLabel: item.secondaryCta?.label,
    secondaryHref: item.secondaryCta?.href,
    badge: item.badge,
  }));

  const featuredToolsList: FeaturedTool[] = taggedTools.map((tool) => ({
    slug: tool.slug,
    title: tool.title,
    description: tool.description,
    isPro: tool.featured,
    heavyMode: tool.heavyMode,
    hasAi: tool.hasAi,
    requiredCloud: tool.requiredCloud as FeaturedTool['requiredCloud'],
    requiredTier: tool.requiredTier as FeaturedTool['requiredTier'],
  }));

  return (
    <CloudDashboardLayout
      hero={
        <CloudHero
          title={hero.title}
          subtitle={hero.subtitle}
          badge={cms.data.title}
          proLabel={false}
          showPromptBar={true}
          mode={hero.mode || "image"}
          primaryToolSlug={hero.primaryToolSlug}
          cloudId={cloudSlugForApi}
          primaryCta={{
            label: `Start with ${hero.mode === "image" ? "an image" : hero.mode === "video" ? "a video" : "text"}`,
            href: `/tools/${hero.primaryToolSlug}`,
          }}
          icon={theme.icon}
          gradient={theme.heroBg}
        />
      }
      primaryCards={
        primaryCards.length > 0 ? (
          <CloudPrimaryCards cards={primaryCards} />
        ) : null
      }
      tabs={
        <CloudCategoryTabs
          tabs={theme.tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      }
      featured={
        loadingTools ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-zinc-100 rounded-2xl h-48 animate-pulse"
              />
            ))}
          </div>
        ) : featuredToolsList.length > 0 ? (
          <CloudFeaturedTools tools={featuredToolsList} title="" />
        ) : null
      }
      appRow={
        appRow && appRow.length > 0 ? (
          <CloudAppRow apps={appRow} />
        ) : null
      }
      shortcuts={
        shortcuts && shortcuts.length > 0 ? (
          <CloudShortcuts shortcuts={shortcuts} />
        ) : null
      }
      sidebar={
        <CloudRecentFilesRail files={[]} title="Recent files" gradient={theme.recentFilesBg} />
      }
    />
  );
}
