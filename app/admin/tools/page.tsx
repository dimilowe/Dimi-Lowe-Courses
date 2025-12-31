"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  ExternalLink,
  Filter,
  Wrench,
  LayoutGrid,
  ArrowLeft,
  Eye,
  EyeOff,
  Star,
  StarOff,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Cloud,
  X,
} from "lucide-react";
import { CLOUDS, type CloudSlug } from "@/lib/clouds";

interface LinkStatus {
  status: "ready" | "warning" | "error";
  label: string;
  details: string[];
}

type EntitlementTier = "free" | "basic" | "pro" | "enterprise";

interface ToolSkin {
  slug: string;
  name: string;
  engineType: string;
  segment: string;
  clusterSlug: string;
  cloudTags?: CloudSlug[];
  requiredClouds?: string[];
  requiredTier?: EntitlementTier;
  isIndexed: boolean;
  isFeatured: boolean;
  inDirectory: boolean;
  priority: string;
  dimensions?: { width: number; height: number };
  h1: string;
  primaryKeyword: string;
  linkStatus: LinkStatus;
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

type TabType = "tools" | "clusters";

export default function AdminToolsPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [password, setPassword] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("tools");

  const [tools, setTools] = useState<ToolSkin[]>([]);
  const [clusters, setClusters] = useState<ClusterSummary[]>([]);
  const [pillars, setPillars] = useState<Pillar[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  const [filterEngine, setFilterEngine] = useState<string>("all");
  const [filterCluster, setFilterCluster] = useState<string>("all");
  const [filterSegment, setFilterSegment] = useState<string>("all");
  const [filterIndexed, setFilterIndexed] = useState<string>("all");
  const [filterLinkStatus, setFilterLinkStatus] = useState<string>("all");

  const [editingCloudTags, setEditingCloudTags] = useState<{ slug: string; tags: CloudSlug[] } | null>(null);
  const [savingCloudTags, setSavingCloudTags] = useState(false);
  
  const [editingEntitlements, setEditingEntitlements] = useState<{ slug: string; requiredClouds: string[]; requiredTier: EntitlementTier } | null>(null);
  const [savingEntitlements, setSavingEntitlements] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadTools();
      loadClusters();
      loadPillars();
    }
  }, [isAuthenticated]);

  const checkAuth = async () => {
    try {
      const res = await fetch("/api/admin/check", { credentials: "include" });
      const data = await res.json();
      setIsAuthenticated(data.isAdmin);
    } catch (error) {
      console.error("Auth check failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
        credentials: "include",
      });
      if (res.ok) {
        setPassword("");
        setIsAuthenticated(true);
      } else {
        alert("Invalid password");
      }
    } catch (error) {
      console.error("Login failed:", error);
      alert("Login failed");
    }
  };

  const loadTools = async () => {
    try {
      const res = await fetch("/api/admin/tools", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load tools");
      const data = await res.json();
      setTools(data.tools || []);
    } catch (error) {
      console.error("Failed to load tools:", error);
    }
  };

  const loadClusters = async () => {
    try {
      const res = await fetch("/api/admin/tools/clusters", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load clusters");
      const data = await res.json();
      setClusters(data.clusters || []);
    } catch (error) {
      console.error("Failed to load clusters:", error);
    }
  };

  const loadPillars = async () => {
    try {
      const res = await fetch("/api/admin/pillars", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load pillars");
      const data = await res.json();
      setPillars(data.pillars || []);
    } catch (error) {
      console.error("Failed to load pillars:", error);
    }
  };

  const toggleIndexed = async (slug: string, currentValue: boolean) => {
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
        loadClusters();
      } else {
        const data = await res.json();
        if (data.blocked) {
          alert(data.error || "Cannot index this tool yet. Check link status.");
        }
      }
    } catch (error) {
      console.error("Failed to update tool:", error);
    }
  };

  const toggleFeatured = async (slug: string, currentValue: boolean) => {
    try {
      const res = await fetch("/api/admin/tools/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, field: "isFeatured", value: !currentValue }),
        credentials: "include",
      });
      if (res.ok) {
        setTools((prev) =>
          prev.map((t) => (t.slug === slug ? { ...t, isFeatured: !currentValue } : t))
        );
      }
    } catch (error) {
      console.error("Failed to update tool:", error);
    }
  };

  const toggleDirectory = async (slug: string, currentValue: boolean) => {
    try {
      const res = await fetch("/api/admin/tools/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, field: "inDirectory", value: !currentValue }),
        credentials: "include",
      });
      if (res.ok) {
        setTools((prev) =>
          prev.map((t) => (t.slug === slug ? { ...t, inDirectory: !currentValue } : t))
        );
      }
    } catch (error) {
      console.error("Failed to update tool:", error);
    }
  };

  const saveCloudTags = async () => {
    if (!editingCloudTags) return;
    setSavingCloudTags(true);
    try {
      const res = await fetch("/api/admin/tools/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          slug: editingCloudTags.slug, 
          field: "cloudTags", 
          value: editingCloudTags.tags 
        }),
        credentials: "include",
      });
      if (res.ok) {
        setTools((prev) =>
          prev.map((t) => (t.slug === editingCloudTags.slug ? { ...t, cloudTags: editingCloudTags.tags } : t))
        );
        setEditingCloudTags(null);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to save cloud tags");
      }
    } catch (error) {
      console.error("Failed to save cloud tags:", error);
      alert("Failed to save cloud tags");
    } finally {
      setSavingCloudTags(false);
    }
  };

  const saveEntitlements = async () => {
    if (!editingEntitlements) return;
    
    if (editingEntitlements.requiredTier !== "free" && editingEntitlements.requiredClouds.length === 0) {
      alert("Non-free tier requires at least one cloud to be selected");
      return;
    }
    
    setSavingEntitlements(true);
    try {
      const cloudsRes = await fetch("/api/admin/tools/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          slug: editingEntitlements.slug, 
          field: "requiredClouds", 
          value: editingEntitlements.requiredClouds 
        }),
        credentials: "include",
      });
      
      const tierRes = await fetch("/api/admin/tools/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          slug: editingEntitlements.slug, 
          field: "requiredTier", 
          value: editingEntitlements.requiredTier 
        }),
        credentials: "include",
      });
      
      if (cloudsRes.ok && tierRes.ok) {
        setTools((prev) =>
          prev.map((t) => (t.slug === editingEntitlements.slug 
            ? { ...t, requiredClouds: editingEntitlements.requiredClouds, requiredTier: editingEntitlements.requiredTier } 
            : t))
        );
        setEditingEntitlements(null);
      } else {
        const cloudData = await cloudsRes.json().catch(() => ({}));
        const tierData = await tierRes.json().catch(() => ({}));
        alert(cloudData.error || tierData.error || "Failed to save entitlements");
      }
    } catch (error) {
      console.error("Failed to save entitlements:", error);
      alert("Failed to save entitlements");
    } finally {
      setSavingEntitlements(false);
    }
  };

  const uniqueEngines = [...new Set(tools.map((t) => t.engineType))];
  const uniqueSegments = [...new Set(tools.map((t) => t.segment))];

  const filteredTools = tools.filter((tool) => {
    const matchesSearch =
      searchQuery === "" ||
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.primaryKeyword?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesEngine = filterEngine === "all" || tool.engineType === filterEngine;
    const matchesCluster = filterCluster === "all" || tool.clusterSlug === filterCluster;
    const matchesSegment = filterSegment === "all" || tool.segment === filterSegment;
    const matchesIndexed =
      filterIndexed === "all" ||
      (filterIndexed === "indexed" && tool.isIndexed) ||
      (filterIndexed === "not-indexed" && !tool.isIndexed);
    const matchesLinkStatus =
      filterLinkStatus === "all" ||
      tool.linkStatus?.status === filterLinkStatus;
    return matchesSearch && matchesEngine && matchesCluster && matchesSegment && matchesIndexed && matchesLinkStatus;
  });

  const totalPages = Math.ceil(filteredTools.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedTools = filteredTools.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const getSegmentColor = (segment: string) => {
    switch (segment) {
      case "creator":
        return "bg-orange-100 text-orange-800";
      case "social":
        return "bg-blue-100 text-blue-800";
      case "utility":
        return "bg-gray-100 text-gray-800";
      case "finance":
        return "bg-green-100 text-green-800";
      case "health":
        return "bg-pink-100 text-pink-800";
      case "mbb":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getEngineColor = (engine: string) => {
    switch (engine) {
      case "platform-resizer":
        return "bg-cyan-100 text-cyan-800";
      case "calculator":
        return "bg-amber-100 text-amber-800";
      case "ai-analysis":
        return "bg-violet-100 text-violet-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Admin Login</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                type="password"
                placeholder="Admin Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600">
                Login
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <h1 className="text-3xl font-bold tracking-wide flex items-center gap-3">
              <Wrench className="w-8 h-8 text-orange-500" />
              Tool Control Panel
            </h1>
          </div>
          <div className="flex gap-2">
            <Button
              variant={activeTab === "tools" ? "default" : "outline"}
              onClick={() => setActiveTab("tools")}
              className={activeTab === "tools" ? "bg-orange-500 hover:bg-orange-600" : ""}
            >
              <Wrench className="w-4 h-4 mr-2" />
              Tools ({tools.length})
            </Button>
            <Button
              variant={activeTab === "clusters" ? "default" : "outline"}
              onClick={() => setActiveTab("clusters")}
              className={activeTab === "clusters" ? "bg-orange-500 hover:bg-orange-600" : ""}
            >
              <LayoutGrid className="w-4 h-4 mr-2" />
              Clusters ({clusters.length})
            </Button>
          </div>
        </div>

        {activeTab === "tools" && (
          <>
            <div className="mb-6 space-y-4">
              <div className="relative flex items-center">
                <Search className="absolute left-4 w-5 h-5 text-gray-400 pointer-events-none z-10" />
                <Input
                  type="text"
                  placeholder="Search by name, slug, or keyword..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-12 h-14 text-lg bg-white"
                />
              </div>

              <div className="flex flex-wrap gap-3 items-center">
                <Filter className="w-5 h-5 text-gray-500" />

                <select
                  className="border rounded px-3 py-2 bg-white text-sm"
                  value={filterEngine}
                  onChange={(e) => {
                    setFilterEngine(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="all">All Engines</option>
                  {uniqueEngines.map((e) => (
                    <option key={e} value={e}>
                      {e}
                    </option>
                  ))}
                </select>

                <select
                  className="border rounded px-3 py-2 bg-white text-sm"
                  value={filterCluster}
                  onChange={(e) => {
                    setFilterCluster(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="all">All Pillars</option>
                  {pillars.map((p) => (
                    <option key={p.slug} value={p.slug}>
                      {p.title}
                    </option>
                  ))}
                </select>

                <select
                  className="border rounded px-3 py-2 bg-white text-sm"
                  value={filterSegment}
                  onChange={(e) => {
                    setFilterSegment(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="all">All Segments</option>
                  {uniqueSegments.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>

                <select
                  className="border rounded px-3 py-2 bg-white text-sm"
                  value={filterIndexed}
                  onChange={(e) => {
                    setFilterIndexed(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="all">All Status</option>
                  <option value="indexed">Indexed Only</option>
                  <option value="not-indexed">Not Indexed</option>
                </select>

                <select
                  className="border rounded px-3 py-2 bg-white text-sm"
                  value={filterLinkStatus}
                  onChange={(e) => {
                    setFilterLinkStatus(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="all">All Link Status</option>
                  <option value="ready">Ready to Index</option>
                  <option value="warning">Incomplete</option>
                  <option value="error">Not Ready</option>
                </select>

                <span className="text-sm text-gray-500 ml-auto">
                  Showing {filteredTools.length} of {tools.length} tools
                </span>
              </div>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="text-left p-4 font-medium text-gray-600">Name</th>
                        <th className="text-left p-4 font-medium text-gray-600">Engine</th>
                        <th className="text-left p-4 font-medium text-gray-600">Cluster</th>
                        <th className="text-center p-4 font-medium text-gray-600">Clouds</th>
                        <th className="text-center p-4 font-medium text-gray-600">Tier</th>
                        <th className="text-center p-4 font-medium text-gray-600">Link Status</th>
                        <th className="text-center p-4 font-medium text-gray-600">Indexed</th>
                        <th className="text-center p-4 font-medium text-gray-600">Featured</th>
                        <th className="text-center p-4 font-medium text-gray-600">In Directory</th>
                        <th className="text-center p-4 font-medium text-gray-600">Preview</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedTools.map((tool) => (
                        <tr key={tool.slug} className="border-b hover:bg-gray-50">
                          <td className="p-4">
                            <div>
                              <div className="font-medium text-gray-900">{tool.name}</div>
                              <div className="text-sm text-gray-500">{tool.slug}</div>
                              {tool.dimensions && (
                                <div className="text-xs text-gray-400">
                                  {tool.dimensions.width}×{tool.dimensions.height}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge className={getEngineColor(tool.engineType)}>
                              {tool.engineType}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <span className="text-sm text-gray-600">{tool.clusterSlug || "-"}</span>
                          </td>
                          <td className="p-4 text-center">
                            {tool.source === "cms" ? (
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
                            ) : (
                              <span className="text-xs text-gray-400">-</span>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            <button
                              onClick={() => setEditingEntitlements({ 
                                slug: tool.slug, 
                                requiredClouds: tool.requiredClouds || [], 
                                requiredTier: tool.requiredTier || "free" 
                              })}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
                                tool.requiredTier === "enterprise"
                                  ? "bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200"
                                  : tool.requiredTier === "pro"
                                  ? "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200"
                                  : tool.requiredTier === "basic"
                                  ? "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200"
                                  : "bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200"
                              }`}
                              title="Click to edit tier and required clouds"
                            >
                              <span className="uppercase tracking-wide">
                                {tool.requiredTier || "free"}
                              </span>
                              {(tool.requiredClouds?.length || 0) > 0 && (
                                <span className="opacity-70">
                                  +{tool.requiredClouds!.length} cloud{tool.requiredClouds!.length > 1 ? 's' : ''}
                                </span>
                              )}
                            </button>
                          </td>
                          <td className="p-4 text-center">
                            <div 
                              className="group relative inline-block"
                              title={tool.linkStatus?.details?.join("\n") || ""}
                            >
                              {tool.linkStatus?.status === "ready" ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                  <CheckCircle className="w-3 h-3" />
                                  Ready
                                </span>
                              ) : tool.linkStatus?.status === "error" ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                                  <XCircle className="w-3 h-3" />
                                  Not Ready
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                                  <AlertTriangle className="w-3 h-3" />
                                  Incomplete
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <button
                              onClick={() => toggleIndexed(tool.slug, tool.isIndexed)}
                              className={`p-2 rounded-full transition-colors ${
                                tool.isIndexed
                                  ? "bg-green-100 text-green-600 hover:bg-green-200"
                                  : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                              }`}
                              title={tool.isIndexed ? "Remove from index" : "Add to index"}
                            >
                              {tool.isIndexed ? (
                                <Eye className="w-4 h-4" />
                              ) : (
                                <EyeOff className="w-4 h-4" />
                              )}
                            </button>
                          </td>
                          <td className="p-4 text-center">
                            <button
                              onClick={() => toggleFeatured(tool.slug, tool.isFeatured)}
                              className={`p-2 rounded-full transition-colors ${
                                tool.isFeatured
                                  ? "bg-yellow-100 text-yellow-600 hover:bg-yellow-200"
                                  : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                              }`}
                              title={tool.isFeatured ? "Remove from featured" : "Add to featured"}
                            >
                              {tool.isFeatured ? (
                                <Star className="w-4 h-4 fill-current" />
                              ) : (
                                <StarOff className="w-4 h-4" />
                              )}
                            </button>
                          </td>
                          <td className="p-4 text-center">
                            <input
                              type="checkbox"
                              checked={tool.inDirectory}
                              onChange={() => toggleDirectory(tool.slug, tool.inDirectory)}
                              className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500"
                            />
                          </td>
                          <td className="p-4 text-center">
                            <a
                              href={`/tools/${tool.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded text-sm text-gray-700 transition-colors"
                            >
                              <ExternalLink className="w-3 h-3" />
                              Open
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-6 mt-6 border-t">
                <p className="text-sm text-gray-500">
                  Showing {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, filteredTools.length)} of{" "}
                  {filteredTools.length} tools
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </Button>
                  <span className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === "clusters" && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clusters.map((cluster) => (
              <Card key={cluster.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{cluster.pillarTitle}</CardTitle>
                  <Badge className={getEngineColor(cluster.engineId)}>{cluster.engineId}</Badge>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Pillar Slug:</span>
                      <span className="font-mono text-gray-700">{cluster.pillarSlug}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Tools:</span>
                      <span className="font-semibold text-gray-900">{cluster.toolCount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Indexed:</span>
                      <span
                        className={`font-semibold ${
                          cluster.indexedCount > 0 ? "text-green-600" : "text-gray-400"
                        }`}
                      >
                        {cluster.indexedCount}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Articles:</span>
                      <span
                        className={`font-semibold ${
                          cluster.articleCount > 0 ? "text-blue-600" : "text-gray-400"
                        }`}
                      >
                        {cluster.articleCount}
                      </span>
                    </div>
                    <div className="pt-3 border-t">
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500"
                          style={{
                            width: `${cluster.toolCount > 0 ? (cluster.indexedCount / cluster.toolCount) * 100 : 0}%`,
                          }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1 text-center">
                        {cluster.toolCount > 0
                          ? Math.round((cluster.indexedCount / cluster.toolCount) * 100)
                          : 0}
                        % indexed
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {editingCloudTags && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h3 className="font-semibold text-gray-900">Edit Cloud Tags</h3>
                <p className="text-sm text-gray-500">{editingCloudTags.slug}</p>
              </div>
              <button
                onClick={() => setEditingCloudTags(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-600 mb-4">
                Assign this tool to one or more VCM Clouds. Tools without tags break the flywheel.
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
                      <input
                        type="checkbox"
                        className="mt-0.5 w-4 h-4 accent-purple-500"
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
            <div className="flex items-center justify-end gap-2 p-4 border-t bg-gray-50 rounded-b-xl">
              <Button
                variant="outline"
                onClick={() => setEditingCloudTags(null)}
                disabled={savingCloudTags}
              >
                Cancel
              </Button>
              <Button
                onClick={saveCloudTags}
                disabled={savingCloudTags}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {savingCloudTags ? "Saving..." : "Save Cloud Tags"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {editingEntitlements && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h3 className="font-semibold text-gray-900">Edit Entitlements</h3>
                <p className="text-sm text-gray-500">{editingEntitlements.slug}</p>
              </div>
              <button
                onClick={() => setEditingEntitlements(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Required Tier</label>
                <p className="text-xs text-gray-500 mb-2">
                  Set the minimum subscription tier required to access this tool.
                </p>
                <select
                  value={editingEntitlements.requiredTier}
                  onChange={(e) => setEditingEntitlements({
                    ...editingEntitlements,
                    requiredTier: e.target.value as EntitlementTier
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                >
                  <option value="free">Free (no subscription required)</option>
                  <option value="basic">Basic</option>
                  <option value="pro">Pro</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
              
              {editingEntitlements.requiredTier !== "free" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Required Clouds</label>
                  <p className="text-xs text-gray-500 mb-2">
                    User must have at least one of these clouds at the required tier (OR logic).
                  </p>
                  {editingEntitlements.requiredClouds.length === 0 && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg mb-3">
                      <p className="text-sm text-amber-700">
                        At least one cloud must be selected for non-free tiers.
                      </p>
                    </div>
                  )}
                  <div className="space-y-2">
                    {CLOUDS.map((cloud) => {
                      const checked = editingEntitlements.requiredClouds.includes(cloud.slug);
                      return (
                        <label
                          key={cloud.slug}
                          className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            checked ? "bg-amber-50 border-amber-300" : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="mt-0.5 w-4 h-4 accent-amber-500"
                            checked={checked}
                            onChange={() => {
                              if (checked) {
                                setEditingEntitlements({
                                  ...editingEntitlements,
                                  requiredClouds: editingEntitlements.requiredClouds.filter((c) => c !== cloud.slug),
                                });
                              } else {
                                setEditingEntitlements({
                                  ...editingEntitlements,
                                  requiredClouds: [...editingEntitlements.requiredClouds, cloud.slug],
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
              )}
            </div>
            <div className="flex items-center justify-end gap-2 p-4 border-t bg-gray-50 rounded-b-xl">
              <Button
                variant="outline"
                onClick={() => setEditingEntitlements(null)}
                disabled={savingEntitlements}
              >
                Cancel
              </Button>
              <Button
                onClick={saveEntitlements}
                disabled={savingEntitlements || (editingEntitlements.requiredTier !== "free" && editingEntitlements.requiredClouds.length === 0)}
                className="bg-amber-600 hover:bg-amber-700"
              >
                {savingEntitlements ? "Saving..." : "Save Entitlements"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
