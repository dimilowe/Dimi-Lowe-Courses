"use client";

import { useState, useEffect, useCallback } from "react";
import { Check, X, ExternalLink, Loader2, RefreshCw } from "lucide-react";

interface BrandRequest {
  id: string;
  requested_brand_name: string;
  requested_website_url: string | null;
  request_reason: string | null;
  resolved_website_url: string | null;
  resolved_contact_url: string | null;
  resolve_confidence: string;
  resolver_method: string | null;
  status: string;
  created_at: string;
}

export default function AdminBrandAccessPage() {
  const [requests, setRequests] = useState<BrandRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("new");

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = statusFilter ? `?status=${statusFilter}` : "";
      const res = await fetch(`/api/admin/brand-access/requests/list${params}`);
      if (res.status === 401) {
        setError("Unauthorized. Please log in as admin.");
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setRequests(data.requests || []);
    } catch {
      setError("Failed to load requests.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handlePublish = async (requestId: string) => {
    setActionLoading(requestId);
    try {
      const res = await fetch("/api/admin/brand-access/requests/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request_id: requestId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to publish");
      }
      fetchRequests();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to publish");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (requestId: string) => {
    const notes = prompt("Rejection reason (optional):");
    setActionLoading(requestId);
    try {
      const res = await fetch("/api/admin/brand-access/requests/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request_id: requestId, admin_notes: notes }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to reject");
      }
      fetchRequests();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to reject");
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getConfidenceBadge = (confidence: string) => {
    switch (confidence) {
      case "high":
        return <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">High</span>;
      case "medium":
        return <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs">Medium</span>;
      default:
        return <span className="px-2 py-0.5 bg-zinc-100 text-zinc-600 rounded text-xs">Low</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "added":
        return <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">Published</span>;
      case "rejected":
        return <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs">Rejected</span>;
      default:
        return <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">New</span>;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-zinc-900">Brand Access Requests</h1>
          <div className="flex items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-zinc-300 rounded-lg text-sm"
            >
              <option value="">All</option>
              <option value="new">New</option>
              <option value="added">Published</option>
              <option value="rejected">Rejected</option>
            </select>
            <button
              onClick={fetchRequests}
              className="flex items-center gap-2 px-3 py-2 bg-zinc-100 hover:bg-zinc-200 rounded-lg text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-zinc-400 animate-spin" />
          </div>
        )}

        {!loading && !error && requests.length === 0 && (
          <div className="text-center py-12 text-zinc-500">
            No requests found.
          </div>
        )}

        {!loading && !error && requests.length > 0 && (
          <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200">
                  <th className="text-left py-3 px-4 font-medium text-zinc-700">Brand</th>
                  <th className="text-left py-3 px-4 font-medium text-zinc-700">Website</th>
                  <th className="text-left py-3 px-4 font-medium text-zinc-700">Contact URL</th>
                  <th className="text-left py-3 px-4 font-medium text-zinc-700">Confidence</th>
                  <th className="text-left py-3 px-4 font-medium text-zinc-700">Reason</th>
                  <th className="text-left py-3 px-4 font-medium text-zinc-700">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-zinc-700">Submitted</th>
                  <th className="text-left py-3 px-4 font-medium text-zinc-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                    <td className="py-3 px-4 font-medium text-zinc-900">
                      {req.requested_brand_name}
                    </td>
                    <td className="py-3 px-4">
                      {req.resolved_website_url || req.requested_website_url ? (
                        <a
                          href={req.resolved_website_url || req.requested_website_url || ""}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex items-center gap-1"
                        >
                          Visit <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-3 px-4 max-w-[200px]">
                      {req.resolved_contact_url ? (
                        <a
                          href={req.resolved_contact_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-xs break-all flex items-center gap-1"
                        >
                          Open <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-zinc-400">Not found</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {getConfidenceBadge(req.resolve_confidence)}
                    </td>
                    <td className="py-3 px-4 max-w-[150px] truncate text-zinc-600">
                      {req.request_reason || "—"}
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(req.status)}
                    </td>
                    <td className="py-3 px-4 text-zinc-500 text-xs">
                      {formatDate(req.created_at)}
                    </td>
                    <td className="py-3 px-4">
                      {req.status === "new" && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handlePublish(req.id)}
                            disabled={actionLoading === req.id || !req.resolved_contact_url}
                            className="p-1.5 bg-green-100 hover:bg-green-200 rounded text-green-700 disabled:opacity-50"
                            title={req.resolved_contact_url ? "Publish" : "No contact URL"}
                          >
                            {actionLoading === req.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Check className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleReject(req.id)}
                            disabled={actionLoading === req.id}
                            className="p-1.5 bg-red-100 hover:bg-red-200 rounded text-red-700 disabled:opacity-50"
                            title="Reject"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
