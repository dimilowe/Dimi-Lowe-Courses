"use client";

import { useState, useEffect, useMemo } from "react";
import type { CloudDashboardEngineConfig, CMSObject } from "@/lib/types/cms";
import type { CloudId, EntitlementTier } from "@/lib/types/cloudEntitlements";
import { getCloudTheme, resolveCloudId } from "@/lib/cloudTheme";
import CloudDashboardLayout from "@/components/clouds/CloudDashboardLayout";
import CloudHero from "@/components/clouds/CloudHero";
import CloudPrimaryCards, { PrimaryCardData } from "@/components/clouds/CloudPrimaryCards";
import CloudCategoryTabs from "@/components/clouds/CloudCategoryTabs";
import CloudFeaturedTools, { FeaturedTool } from "@/components/clouds/CloudFeaturedTools";
import CloudRecentFilesRail, { RecentFile } from "@/components/clouds/CloudRecentFilesRail";
import CloudAppRow from "@/components/clouds/CloudAppRow";
import CloudShortcuts from "@/components/clouds/CloudShortcuts";

type CloudDashboardProps = {
  cms: CMSObject & { engine_config: CloudDashboardEngineConfig };
};

type TaggedTool = {
  slug: string;
  title: string;
  description: string;
  featured: boolean;
  segment?: string;
  cloud_ids: CloudId[];
  required_tier: EntitlementTier;
};

interface WorkspaceItem {
  id: string;
  title: string;
  type: string;
  thumbnail_url: string | null;
  updated_at: string;
  last_opened_at: string | null;
}

export default function CloudDashboardEngine({ cms }: CloudDashboardProps) {
  const { hero, featuredProducts, appRow, shortcuts } = cms.engine_config;

  const theme = getCloudTheme(cms.slug);
  const cloudId = resolveCloudId(cms.slug);
  const cloudSlugForApi = cloudId ? `${cloudId}-cloud` : cms.slug;

  const [taggedTools, setTaggedTools] = useState<TaggedTool[]>([]);
  const [loadingTools, setLoadingTools] = useState(true);
  const [activeTab, setActiveTab] = useState("featured");
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>([]);
  const [toolQuery, setToolQuery] = useState("");

  const filteredTools = useMemo(() => {
    const q = toolQuery.trim().toLowerCase();
    if (!q) return taggedTools;
    return taggedTools.filter((t) => {
      const haystack = `${t.title} ${t.description} ${t.slug} ${t.segment ?? ""}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [taggedTools, toolQuery]);

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

  // Global Workspace: Show ALL recent files by default (scope=all)
  // Items are not "owned" by a cloud - origin_cloud_id is just metadata
  useEffect(() => {
    async function fetchRecentFiles() {
      try {
        const res = await fetch(`/api/workspace/items?scope=all&sort=recent&limit=10`);
        if (res.ok) {
          const data = await res.json();
          const files: RecentFile[] = (data.items || []).map((item: WorkspaceItem) => ({
            id: item.id,
            name: item.title,
            type: item.type.includes('image') ? 'image' : item.type.includes('video') ? 'video' : 'default',
            thumbnailUrl: item.thumbnail_url || undefined,
            href: `/workspace/${item.id}`,
            timestamp: formatRelativeTime(item.last_opened_at || item.updated_at),
          }));
          setRecentFiles(files);
        } else {
          const text = await res.text().catch(() => "");
          console.error("Recent files fetch failed:", res.status, text);
        }
      } catch (error) {
        console.error("Failed to fetch recent files:", error);
      }
    }
    fetchRecentFiles();
  }, []); // No dependencies - global workspace, fetch once on mount

  function formatRelativeTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  }

  const primaryCards: PrimaryCardData[] = featuredProducts.map((item) => ({
    title: item.title,
    description: item.description,
    primaryLabel: item.primaryCta.label,
    primaryHref: item.primaryCta.label === "View plans" ? "/pricing" : item.primaryCta.href,
    secondaryLabel: item.secondaryCta?.label,
    secondaryHref: item.secondaryCta?.href,
    badge: item.badge,
  }));

  const featuredToolsList: FeaturedTool[] = filteredTools.map((tool) => ({
    slug: tool.slug,
    title: tool.title,
    description: tool.description,
    cloud_ids: tool.cloud_ids,
    required_tier: tool.required_tier,
  }));

  return (
    <CloudDashboardLayout
      hero={
        <CloudHero
          title={hero.title}
          subtitle={hero.subtitle}
          badge={cms.data.title}
          proLabel={false}
          showSearchBar={true}
          toolQuery={toolQuery}
          onToolQueryChange={setToolQuery}
          toolCount={filteredTools.length}
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
        ) : toolQuery.trim() ? (
          <div className="text-center py-12">
            <p className="text-zinc-500 mb-3">
              No tools found for &quot;{toolQuery}&quot;
            </p>
            <button
              onClick={() => setToolQuery("")}
              className="text-sm font-medium text-purple-600 hover:text-purple-700"
            >
              Clear search
            </button>
          </div>
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
        <CloudRecentFilesRail files={recentFiles} title="Recent files" gradient={theme.recentFilesBg} />
      }
    />
  );
}
