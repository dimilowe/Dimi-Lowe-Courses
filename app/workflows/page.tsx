"use client";

import { useState, useMemo } from "react";
import { Zap, Search, X } from "lucide-react";
import { getWorkflows, getAllOutcomeTags } from "@/lib/workflows/workflows";
import WorkflowCard from "@/components/workflows/WorkflowCard";

export default function WorkflowsPage() {
  const workflows = getWorkflows();
  const outcomeTags = getAllOutcomeTags();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOutcome, setSelectedOutcome] = useState<string | null>(null);

  const filteredWorkflows = useMemo(() => {
    return workflows.filter((workflow) => {
      const matchesSearch =
        !searchQuery ||
        workflow.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        workflow.pain_subtitle.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesOutcome = !selectedOutcome || workflow.outcome_tag === selectedOutcome;

      return matchesSearch && matchesOutcome;
    });
  }, [workflows, searchQuery, selectedOutcome]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedOutcome(null);
  };

  const hasActiveFilters = searchQuery || selectedOutcome;

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="bg-orange-500 text-white">
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-20">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium mb-6">
              <Zap className="h-4 w-4" />
              Step-by-step guides
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Creator Workflows
            </h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto mb-8">
              Proven step-by-step processes to achieve specific creator goals. 
              Pick your challenge and follow the path to results.
            </p>

            <div className="max-w-xl mx-auto relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search workflows..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl border-0 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-white/50 outline-none transition-all shadow-lg"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-6">
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-500 font-medium">Filter:</span>
            {outcomeTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedOutcome(selectedOutcome === tag ? null : tag)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedOutcome === tag
                    ? "bg-orange-500 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {tag}
              </button>
            ))}
            <div className="flex-1" />
            <span className="text-sm text-gray-500">
              {filteredWorkflows.length} workflow{filteredWorkflows.length !== 1 ? "s" : ""}
            </span>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1"
              >
                <X className="h-4 w-4" />
                Clear
              </button>
            )}
          </div>
        </div>

        {filteredWorkflows.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-16">
            {filteredWorkflows.map((workflow) => (
              <WorkflowCard key={workflow.id} workflow={workflow} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
            <p className="text-gray-500 mb-4">No workflows match your filters.</p>
            <button
              onClick={clearFilters}
              className="text-orange-600 hover:text-orange-700 font-medium"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
