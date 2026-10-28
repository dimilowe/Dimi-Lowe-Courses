"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminLayout } from "@/components/admin/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, MessageSquare, Mail, Clock, RefreshCw } from "lucide-react";

interface FeedbackItem {
  id: number;
  feedback_type: string;
  subject: string;
  message: string;
  email: string | null;
  priority: string | null;
  author_name: string | null;
  author_bio: string | null;
  created_at?: string | null;
}

const TYPE_OPTIONS = [
  "all",
  "issue",
  "tool_idea", // Historical issue reports.
  "feature",
  "improvement",
  "bug",
  "general",
  "article",
];

function formatType(value: string) {
  if (value === "tool_idea" || value === "issue") return "Issues";
  return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function AdminFeedbackPage() {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFeedback = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/feedback", { credentials: "include" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to load feedback");
      }
      setItems(data.feedback || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load feedback");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFeedback();
  }, []);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter((item) => {
      const matchesType = typeFilter === "all" || item.feedback_type === typeFilter;
      if (!matchesType) return false;
      if (!query) return true;
      const haystack = [
        item.subject,
        item.message,
        item.email || "",
        item.feedback_type,
        item.author_name || "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [items, search, typeFilter]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-orange-500" />
              Feedback Inbox
            </h1>
            <p className="text-gray-500 mt-1">
              Review issues, bug reports, and feature feedback from users.
            </p>
          </div>
          <Button variant="outline" onClick={loadFeedback} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              className="pl-9"
              placeholder="Search subject, message, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {TYPE_OPTIONS.map((type) => (
              <Button
                key={type}
                type="button"
                variant={typeFilter === type ? "default" : "outline"}
                className={typeFilter === type ? "bg-orange-500 hover:bg-orange-600" : ""}
                onClick={() => setTypeFilter(type)}
              >
                {formatType(type)}
              </Button>
            ))}
          </div>
        </div>

        {error && (
          <Card>
            <CardContent className="py-6">
              <p className="text-sm text-red-600">{error}</p>
            </CardContent>
          </Card>
        )}

        {!error && isLoading && (
          <Card>
            <CardContent className="py-10 text-center text-gray-500">
              Loading feedback...
            </CardContent>
          </Card>
        )}

        {!error && !isLoading && filteredItems.length === 0 && (
          <Card>
            <CardContent className="py-10 text-center text-gray-500">
              No feedback found for this filter.
            </CardContent>
          </Card>
        )}

        {!error && !isLoading && filteredItems.length > 0 && (
          <div className="space-y-4">
            {filteredItems.map((item) => (
              <Card key={item.id}>
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-lg">{item.subject}</CardTitle>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <Badge variant="secondary">{formatType(item.feedback_type)}</Badge>
                        <Badge variant="outline">{item.priority || "medium"}</Badge>
                        {item.email && (
                          <span className="inline-flex items-center text-sm text-gray-600">
                            <Mail className="w-3.5 h-3.5 mr-1.5" />
                            {item.email}
                          </span>
                        )}
                        {item.created_at && (
                          <span className="inline-flex items-center text-sm text-gray-500">
                            <Clock className="w-3.5 h-3.5 mr-1.5" />
                            {new Date(item.created_at).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{item.message}</p>
                  {item.email && (
                    <a
                      href={`mailto:${item.email}?subject=${encodeURIComponent(`Re: ${item.subject}`)}`}
                      className="inline-flex"
                    >
                      <Button type="button" variant="outline" size="sm">
                        Reply
                      </Button>
                    </a>
                  )}
                  {item.author_name && (
                    <div className="text-sm text-gray-600">
                      <strong>Author:</strong> {item.author_name}
                    </div>
                  )}
                  {item.author_bio && (
                    <div className="text-sm text-gray-600">
                      <strong>Author Bio:</strong> {item.author_bio}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
