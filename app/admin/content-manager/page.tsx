"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AdminLayout } from "@/components/admin/admin-layout";
import { CMSImportModal } from "@/components/admin/cms-import-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Wrench,
  FileText,
  Search,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Upload,
  Cloud,
  X,
  Star,
  Trash2,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { CLOUDS, type CloudSlug } from "@/lib/clouds";

type EntitlementTier = "free" | "basic" | "pro" | "enterprise";

interface ToolSkin {
  slug: string;
  name: string;
  engineType: string;
  segment: string;
  clusterSlug: string;
  cloudTags?: CloudSlug[];
  requiredTier: EntitlementTier;
  requiredClouds: string[];
  isIndexed: boolean;
  isFeatured: boolean;
  inDirectory: boolean;
  priority: string;
  h1: string;
  primaryKeyword: string;
  linkStatus: {
    status: "ready" | "warning" | "error";
    label: string;
    details: string[];
  };
  source?: string;
}

interface ClusterSummary {
  id: string;
  pillarSlug: string;
  pillarTitle: string;
  engineId: string;
  toolCount: number;
  indexedCount: number;
  articleCount: number;
}

interface Pillar {
  id: number;
  slug: string;
  title: string;
}

interface Article {
  id: string;
  slug: string;
  title: string;
  is_indexed: boolean;
  is_published: boolean;
  cluster_slug: string | null;
  cluster_title: string | null;
  word_count: number;
  health: "thin" | "ok" | "strong";
  source: "cluster_articles" | "cms_objects";
}

interface MBB {
  id: string;
  slug: string;
  title: string;
  mbb_type: string | null;
  cluster_slug: string | null;
  cluster_title: string | null;
  is_indexed: boolean;
  word_count: number;
  health: "thin" | "ok" | "strong";
}

type TabType = "tools" | "articles";

function ContentManagerInner() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as TabType) || "tools";
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [tools, setTools] = useState<ToolSkin[]>([]);
  const [clusters, setClusters] = useState<ClusterSummary[]>([]);
  const [pillars, setPillars] = useState<Pillar[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [mbbs, setMbbs] = useState<MBB[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [articleSearchQuery, setArticleSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [articlePage, setArticlePage] = useState(1);
  const [filterEngine, setFilterEngine] = useState("all");
  const [filterIndexed, setFilterIndexed] = useState("all");
  const [filterCluster, setFilterCluster] = useState("all");
  const [articleFilterCluster, setArticleFilterCluster] = useState("all");
  const [articleFilterHealth, setArticleFilterHealth] = useState("all");
  const [selectedTools, setSelectedTools] = useState<Set<string>>(new Set());
  const [bulkCluster, setBulkCluster] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingCloudTags, setEditingCloudTags] = useState<{ slug: string; tags: CloudSlug[] } | null>(null);
  const [savingCloudTags, setSavingCloudTags] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ slug: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [pendingTierChange, setPendingTierChange] = useState<{ slug: string; tier: EntitlementTier } | null>(null);
  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [toolsRes, clustersRes, pillarsRes, articlesRes, mbbsRes] = await Promise.all([
        fetch("/api/admin/tools", { credentials: "include" }),
        fetch("/api/admin/tools/clusters", { credentials: "include" }),
        fetch("/api/admin/pillars", { credentials: "include" }),
        fetch("/api/admin/articles", { credentials: "include" }),
        fetch("/api/admin/mbbs", { credentials: "include" }),
      ]);
      
      if (toolsRes.ok) {
        const data = await toolsRes.json();
        setTools(data.tools || []);
      }
      if (clustersRes.ok) {
        const data = await clustersRes.json();
        setClusters(data.clusters || []);
      }
      if (pillarsRes.ok) {
        const data = await pillarsRes.json();
        setPillars(data.pillars || []);
      }
      if (articlesRes.ok) {
        const data = await articlesRes.json();
        setArticles(data.articles || []);
      }
      if (mbbsRes.ok) {
        const data = await mbbsRes.json();
        setMbbs(data.mbbs || []);
      }
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleToolIndexed = async (slug: string, currentValue: boolean) => {
    try {
      const res = await fetch("/api/admin/tools/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, field: "isIndexed", value: !currentValue }),
        credentials: "include",
      });
      if (res.ok) {
        setTools((prev) =>
          prev.map((t) => (t.slug === slug ? { ...t, isIndexed: !currentValue } : t))
        );
      }
    } catch (error) {
      console.error("Failed to update tool:", error);
    }
  };

  const toggleToolFeatured = async (slug: string, currentValue: boolean) => {
    try {
      const res = await fetch("/api/admin/tools", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, isFeatured: !currentValue }),
        credentials: "include",
      });
      if (res.ok) {
        setTools((prev) =>
          prev.map((t) => (t.slug === slug ? { ...t, isFeatured: !currentValue } : t))
        );
      }
    } catch (error) {
      console.error("Failed to update tool featured status:", error);
    }
  };

  const deleteTool = async (slug: string) => {
    setIsDeleting(true);
    try {
      const res = await fetch("/api/admin/tools/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
        credentials: "include",
      });
      if (res.ok) {
        setTools((prev) => prev.filter((t) => t.slug !== slug));
        setDeleteConfirm(null);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete tool");
      }
    } catch (error) {
      console.error("Failed to delete tool:", error);
      alert("Failed to delete tool");
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleArticleIndexed = async (article: Article) => {
    try {
      const res = await fetch("/api/admin/articles/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          id: article.id, 
          slug: article.slug,
          source: article.source,
          field: "is_indexed", 
          value: !article.is_indexed 
        }),
        credentials: "include",
      });
      if (res.ok) {
        setArticles((prev) =>
          prev.map((a) => (a.id === article.id ? { ...a, is_indexed: !article.is_indexed } : a))
        );
      }
    } catch (error) {
      console.error("Failed to update article:", error);
    }
  };

  const toggleMbbIndexed = async (mbb: MBB) => {
    try {
      const res = await fetch("/api/admin/mbbs/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          slug: mbb.slug,
          field: "is_indexed", 
          value: !mbb.is_indexed 
        }),
        credentials: "include",
      });
      if (res.ok) {
        setMbbs((prev) =>
          prev.map((m) => (m.id === mbb.id ? { ...m, is_indexed: !mbb.is_indexed } : m))
        );
      }
    } catch (error) {
      console.error("Failed to update MBB:", error);
    }
  };

  const updateToolCluster = async (slug: string, clusterSlug: string) => {
    try {
      const res = await fetch("/api/admin/tools/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, field: "clusterSlug", value: clusterSlug || null }),
        credentials: "include",
      });
      if (res.ok) {
        setTools((prev) =>
          prev.map((t) => (t.slug === slug ? { ...t, clusterSlug } : t))
        );
      }
    } catch (error) {
      console.error("Failed to update tool cluster:", error);
    }
  };

  const saveCloudTags = async () => {
    if (!editingCloudTags) return;
    
    if (pendingTierChange && editingCloudTags.tags.length === 0) {
      alert("You must select at least one cloud for non-free tiers.");
      return;
    }
    
    setSavingCloudTags(true);
    try {
      const cloudTagsRes = await fetch("/api/admin/tools/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          slug: editingCloudTags.slug, 
          field: "cloudTags", 
          value: editingCloudTags.tags 
        }),
        credentials: "include",
      });
      
      if (!cloudTagsRes.ok) {
        const data = await cloudTagsRes.json();
        alert(data.error || "Failed to save cloud tags");
        return;
      }
      
      const requiredCloudsRes = await fetch("/api/admin/tools/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          slug: editingCloudTags.slug, 
          field: "requiredClouds", 
          value: editingCloudTags.tags 
        }),
        credentials: "include",
      });
      
      if (!requiredCloudsRes.ok) {
        const data = await requiredCloudsRes.json();
        alert(data.error || "Failed to save required clouds");
        return;
      }
      
      let updatedTier: EntitlementTier | undefined;
      
      if (pendingTierChange && pendingTierChange.slug === editingCloudTags.slug) {
        const tierRes = await fetch("/api/admin/tools/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            slug: pendingTierChange.slug, 
            field: "requiredTier", 
            value: pendingTierChange.tier 
          }),
          credentials: "include",
        });
        
        if (!tierRes.ok) {
          const data = await tierRes.json();
          alert(data.error || "Failed to save tier");
          return;
        }
        updatedTier = pendingTierChange.tier;
        setPendingTierChange(null);
      }
      
      setTools((prev) =>
        prev.map((t) => {
          if (t.slug === editingCloudTags.slug) {
            return { 
              ...t, 
              cloudTags: editingCloudTags.tags,
              requiredClouds: editingCloudTags.tags,
              ...(updatedTier ? { requiredTier: updatedTier } : {})
            };
          }
          return t;
        })
      );
      setEditingCloudTags(null);
    } catch (error) {
      console.error("Failed to save cloud tags:", error);
      alert("Failed to save cloud tags");
    } finally {
      setSavingCloudTags(false);
    }
  };

  const handleTierChange = async (slug: string, newTier: EntitlementTier) => {
    const tool = tools.find(t => t.slug === slug);
    if (!tool) return;
    
    if (newTier !== "free" && (!tool.requiredClouds || tool.requiredClouds.length === 0)) {
      setPendingTierChange({ slug, tier: newTier });
      setEditingCloudTags({ slug, tags: (tool.cloudTags || []) as CloudSlug[] });
      return;
    }
    
    try {
      const res = await fetch("/api/admin/tools/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, field: "requiredTier", value: newTier }),
        credentials: "include",
      });
      if (res.ok) {
        setTools((prev) =>
          prev.map((t) => (t.slug === slug ? { ...t, requiredTier: newTier } : t))
        );
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update tier");
      }
    } catch (error) {
      console.error("Failed to update tier:", error);
      alert("Failed to update tier");
    }
  };

  const bulkAssignCluster = async () => {
    if (selectedTools.size === 0) return;
    const isRemove = bulkCluster === "__remove__";
    const clusterValue = isRemove ? "" : bulkCluster;
    if (!bulkCluster) return;
    
    const updates = Array.from(selectedTools).map((slug) =>
      fetch("/api/admin/tools/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, field: "clusterSlug", value: clusterValue || null }),
        credentials: "include",
      })
    );
    await Promise.all(updates);
    setTools((prev) =>
      prev.map((t) =>
        selectedTools.has(t.slug) ? { ...t, clusterSlug: clusterValue } : t
      )
    );
    setSelectedTools(new Set());
    setBulkCluster("");
  };

  const toggleToolSelection = (slug: string) => {
    setSelectedTools((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) {
        next.delete(slug);
      } else {
        next.add(slug);
      }
      return next;
    });
  };

  const toggleAllOnPage = () => {
    const slugsOnPage = paginatedTools.map((t) => t.slug);
    const allSelected = slugsOnPage.every((s) => selectedTools.has(s));
    if (allSelected) {
      setSelectedTools((prev) => {
        const next = new Set(prev);
        slugsOnPage.forEach((s) => next.delete(s));
        return next;
      });
    } else {
      setSelectedTools((prev) => {
        const next = new Set(prev);
        slugsOnPage.forEach((s) => next.add(s));
        return next;
      });
    }
  };

  const engineTypes = [...new Set(tools.map((t) => t.engineType))];
  const clusterSlugs = [...new Set(clusters.map((c) => c.pillarSlug))];

  const filteredTools = tools.filter((tool) => {
    const matchesSearch =
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.slug.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesEngine = filterEngine === "all" || tool.engineType === filterEngine;
    const matchesIndexed =
      filterIndexed === "all" ||
      (filterIndexed === "indexed" && tool.isIndexed) ||
      (filterIndexed === "not-indexed" && !tool.isIndexed);
    const matchesCluster =
      filterCluster === "all" ||
      (filterCluster === "unassigned" && !tool.clusterSlug) ||
      tool.clusterSlug === filterCluster;
    return matchesSearch && matchesEngine && matchesIndexed && matchesCluster;
  });

  const totalPages = Math.ceil(filteredTools.length / ITEMS_PER_PAGE);
  const paginatedTools = filteredTools.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const filteredArticles = articles.filter((article) => {
    const matchesSearch =
      articleSearchQuery === "" ||
      article.title.toLowerCase().includes(articleSearchQuery.toLowerCase()) ||
      article.slug.toLowerCase().includes(articleSearchQuery.toLowerCase());
    const matchesCluster =
      articleFilterCluster === "all" ||
      article.cluster_slug === articleFilterCluster;
    const matchesHealth =
      articleFilterHealth === "all" ||
      article.health === articleFilterHealth;
    return matchesSearch && matchesCluster && matchesHealth;
  });

  const totalArticlePages = Math.ceil(filteredArticles.length / ITEMS_PER_PAGE);
  const paginatedArticles = filteredArticles.slice(
    (articlePage - 1) * ITEMS_PER_PAGE,
    articlePage * ITEMS_PER_PAGE
  );

  const filteredPillars = pillars.filter((pillar) => {
    const matchesSearch =
      articleSearchQuery === "" ||
      pillar.title.toLowerCase().includes(articleSearchQuery.toLowerCase()) ||
      pillar.slug.toLowerCase().includes(articleSearchQuery.toLowerCase());
    return matchesSearch;
  });

  const totalPillarPages = Math.ceil(filteredPillars.length / ITEMS_PER_PAGE);
  const paginatedPillars = filteredPillars.slice(
    (articlePage - 1) * ITEMS_PER_PAGE,
    articlePage * ITEMS_PER_PAGE
  );

  const getLinkStatusIcon = (status: string) => {
    switch (status) {
      case "ready":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case "error":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <AdminLayout>
      <CMSImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImportComplete={() => loadData()}
      />

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Tool</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete <strong>&quot;{deleteConfirm.name}&quot;</strong>? 
              This will hide it from the site but can be restored later.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirm(null)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                onClick={() => deleteTool(deleteConfirm.slug)}
                disabled={isDeleting}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Wrench className="w-6 h-6 text-orange-500" />
              Content
            </h1>
            <p className="text-gray-500 mt-1">
              View, edit, and import content
            </p>
          </div>
          <Button
            onClick={() => setShowImportModal(true)}
            className="bg-orange-500 hover:bg-orange-600"
          >
            <Upload className="w-4 h-4 mr-2" />
            Import JSON
          </Button>
        </div>

        <div className="flex gap-2 border-b">
          {[
            { id: "tools", label: `Tools (${tools.length})`, icon: Wrench },
            { id: "articles", label: `Pillars (${pillars.length})`, icon: FileText },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as TabType);
                setCurrentPage(1);
              }}
              className={`px-4 py-2 flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-orange-500 text-orange-600 font-medium"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "tools" && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search tools..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10"
                />
              </div>
              <select
                value={filterEngine}
                onChange={(e) => {
                  setFilterEngine(e.target.value);
                  setCurrentPage(1);
                }}
                className="border rounded-md px-3 py-2 text-sm"
              >
                <option value="all">All Engines</option>
                {engineTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <select
                value={filterIndexed}
                onChange={(e) => {
                  setFilterIndexed(e.target.value);
                  setCurrentPage(1);
                }}
                className="border rounded-md px-3 py-2 text-sm"
              >
                <option value="all">All Status</option>
                <option value="indexed">Indexed</option>
                <option value="not-indexed">Not Indexed</option>
              </select>
              <select
                value={filterCluster}
                onChange={(e) => {
                  setFilterCluster(e.target.value);
                  setCurrentPage(1);
                }}
                className="border rounded-md px-3 py-2 text-sm"
              >
                <option value="all">All Pillars</option>
                <option value="unassigned">Unassigned Only</option>
                {pillars.map((pillar) => (
                  <option key={pillar.slug} value={pillar.slug}>{pillar.title}</option>
                ))}
              </select>
            </div>

            {selectedTools.size > 0 && (
              <div className="flex items-center gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <span className="text-sm font-medium text-orange-700">
                  {selectedTools.size} selected
                </span>
                <select
                  value={bulkCluster}
                  onChange={(e) => setBulkCluster(e.target.value)}
                  className="border rounded-md px-3 py-1.5 text-sm"
                >
                  <option value="">Select pillar...</option>
                  <option value="__remove__">— Remove from pillar —</option>
                  {pillars.map((pillar) => (
                    <option key={pillar.slug} value={pillar.slug}>{pillar.title}</option>
                  ))}
                </select>
                <Button
                  onClick={bulkAssignCluster}
                  disabled={!bulkCluster}
                  size="sm"
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  Assign to Pillar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedTools(new Set())}
                >
                  Clear
                </Button>
              </div>
            )}

            <div className="text-sm text-gray-500">
              Showing {paginatedTools.length} of {filteredTools.length} tools
            </div>

            {isLoading ? (
              <div className="text-center py-12 text-gray-400">Loading tools...</div>
            ) : (
              <div className="border rounded-lg overflow-x-auto">
                <table className="w-full text-sm min-w-[1000px]">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 w-10">
                        <input
                          type="checkbox"
                          checked={paginatedTools.length > 0 && paginatedTools.every((t) => selectedTools.has(t.slug))}
                          onChange={toggleAllOnPage}
                          className="w-4 h-4 rounded border-gray-300"
                        />
                      </th>
                      <th className="text-left px-4 py-3 font-medium">Tool</th>
                      <th className="text-left px-4 py-3 font-medium">Engine</th>
                      <th className="text-left px-4 py-3 font-medium">Pillar</th>
                      <th className="text-center px-4 py-3 font-medium">Clouds</th>
                      <th className="text-center px-4 py-3 font-medium">Tier</th>
                      <th className="text-center px-4 py-3 font-medium">Links</th>
                      <th className="text-center px-4 py-3 font-medium">Featured</th>
                      <th className="text-center px-4 py-3 font-medium">Indexed</th>
                      <th className="text-center px-4 py-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {paginatedTools.map((tool) => (
                      <tr key={tool.slug} className={`hover:bg-gray-50 ${selectedTools.has(tool.slug) ? "bg-orange-50" : ""}`}>
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedTools.has(tool.slug)}
                            onChange={() => toggleToolSelection(tool.slug)}
                            className="w-4 h-4 rounded border-gray-300"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium">{tool.name}</div>
                          <div className="text-xs text-gray-400">{tool.slug}</div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline">{tool.engineType}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={tool.clusterSlug || ""}
                            onChange={(e) => updateToolCluster(tool.slug, e.target.value)}
                            className="text-sm border rounded px-2 py-1 w-full max-w-[200px] bg-white"
                          >
                            <option value="">— None —</option>
                            {pillars.map((pillar) => (
                              <option key={pillar.slug} value={pillar.slug}>
                                {pillar.title}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => setEditingCloudTags({ slug: tool.slug, tags: tool.cloudTags || [] })}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                              (tool.cloudTags?.length || 0) > 0
                                ? "bg-purple-100 text-purple-700 hover:bg-purple-200"
                                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                            }`}
                            title="Edit cloud tags"
                          >
                            <Cloud className="w-3 h-3" />
                            {(tool.cloudTags?.length || 0) > 0 ? tool.cloudTags!.length : "0"}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <select
                            value={tool.requiredTier || "free"}
                            onChange={(e) => handleTierChange(tool.slug, e.target.value as EntitlementTier)}
                            className={`text-xs font-semibold px-2 py-1 rounded-lg border cursor-pointer ${
                              tool.requiredTier === "enterprise"
                                ? "bg-purple-100 text-purple-700 border-purple-200"
                                : tool.requiredTier === "pro"
                                ? "bg-amber-100 text-amber-700 border-amber-200"
                                : tool.requiredTier === "basic"
                                ? "bg-blue-100 text-blue-700 border-blue-200"
                                : "bg-gray-100 text-gray-500 border-gray-200"
                            }`}
                          >
                            <option value="free">FREE</option>
                            <option value="basic">BASIC</option>
                            <option value="pro">PRO</option>
                            <option value="enterprise">ENTERPRISE</option>
                          </select>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {getLinkStatusIcon(tool.linkStatus.status)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => toggleToolFeatured(tool.slug, tool.isFeatured)}
                            className="inline-flex"
                            title={tool.isFeatured ? "Remove from Featured" : "Add to Featured"}
                          >
                            {tool.isFeatured ? (
                              <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                            ) : (
                              <Star className="w-5 h-5 text-gray-300" />
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => toggleToolIndexed(tool.slug, tool.isIndexed)}
                            className="inline-flex"
                          >
                            {tool.isIndexed ? (
                              <Eye className="w-5 h-5 text-green-500" />
                            ) : (
                              <EyeOff className="w-5 h-5 text-gray-300" />
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Link href={`/tools/${tool.slug}`} target="_blank">
                              <Button variant="ghost" size="sm">
                                <ExternalLink className="w-4 h-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteConfirm({ slug: tool.slug, name: tool.name })}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4">
                <span className="text-sm text-gray-500">
                  Page {currentPage} of {totalPages}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "articles" && (
          <div className="space-y-4">
            <div className="flex gap-3 items-center flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search pillars..."
                  value={articleSearchQuery}
                  onChange={(e) => {
                    setArticleSearchQuery(e.target.value);
                    setArticlePage(1);
                  }}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="text-sm text-gray-500">
              Showing {paginatedPillars.length} of {filteredPillars.length} pillars
            </div>

            {isLoading ? (
              <div className="text-center py-12 text-gray-400">Loading pillars...</div>
            ) : filteredPillars.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">No pillars yet</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Import pillars via JSON
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium">Pillar</th>
                      <th className="text-left px-4 py-3 font-medium">Slug</th>
                      <th className="text-center px-4 py-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {paginatedPillars.map((pillar) => (
                      <tr key={pillar.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="font-medium">{pillar.title}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-gray-500 font-mono">{pillar.slug}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Link
                            href={`/tools/clusters/${pillar.slug}`}
                            target="_blank"
                            className="inline-flex items-center gap-1 text-orange-600 hover:text-orange-700"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {totalPillarPages > 1 && (
              <div className="flex items-center justify-between pt-4">
                <span className="text-sm text-gray-500">
                  Page {articlePage} of {totalPillarPages}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setArticlePage((p) => Math.max(1, p - 1))}
                    disabled={articlePage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setArticlePage((p) => Math.min(totalPillarPages, p + 1))}
                    disabled={articlePage === totalPillarPages}
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {editingCloudTags && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[80vh] overflow-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">
                {pendingTierChange ? "Select Required Clouds" : "Edit Cloud Tags"}
              </h3>
              <button onClick={() => { setEditingCloudTags(null); setPendingTierChange(null); }} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              {pendingTierChange && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-700">
                    Setting tier to <strong className="uppercase">{pendingTierChange.tier}</strong> requires at least one cloud.
                    Select the clouds users need to access this tool.
                  </p>
                </div>
              )}
              <p className="text-sm text-gray-500 mb-4">
                Assign this tool to one or more Creator Clouds.
              </p>
              <div className="space-y-2">
                {CLOUDS.map((cloud) => {
                  const checked = editingCloudTags.tags.includes(cloud.slug);
                  return (
                    <label
                      key={cloud.slug}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        checked ? "bg-purple-50 border-purple-300" : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      <div className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                        checked ? "bg-purple-600 border-purple-600" : "border-gray-300 bg-white"
                      }`}>
                        {checked && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={checked}
                        onChange={() => {
                          if (checked) {
                            setEditingCloudTags({
                              ...editingCloudTags,
                              tags: editingCloudTags.tags.filter((t) => t !== cloud.slug),
                            });
                          } else {
                            setEditingCloudTags({
                              ...editingCloudTags,
                              tags: [...editingCloudTags.tags, cloud.slug],
                            });
                          }
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-gray-900">{cloud.name}</div>
                        <div className="text-xs text-gray-500">{cloud.shortDescription}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t bg-gray-50">
              <Button variant="outline" onClick={() => { setEditingCloudTags(null); setPendingTierChange(null); }}>
                Cancel
              </Button>
              <Button
                onClick={saveCloudTags}
                disabled={savingCloudTags}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {savingCloudTags ? "Saving..." : "Save Tags"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export default function ContentManagerPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <ContentManagerInner />
    </Suspense>
  );
}
