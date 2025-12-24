"use client";

import { Search, X } from "lucide-react";

interface WorkflowFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedOutcome: string | null;
  onOutcomeChange: (outcome: string | null) => void;
  outcomeTags: string[];
  resultCount: number;
  onClearFilters: () => void;
}

export default function WorkflowFilters({
  searchQuery,
  onSearchChange,
  selectedOutcome,
  onOutcomeChange,
  outcomeTags,
  resultCount,
  onClearFilters
}: WorkflowFiltersProps) {
  const hasActiveFilters = searchQuery || selectedOutcome;

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search workflows..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-orange-300 focus:ring-2 focus:ring-orange-100 outline-none transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-gray-500">Outcome:</span>
        {outcomeTags.map((tag) => (
          <button
            key={tag}
            onClick={() => onOutcomeChange(selectedOutcome === tag ? null : tag)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              selectedOutcome === tag
                ? "bg-orange-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between pt-2">
        <span className="text-sm text-gray-600">
          Showing {resultCount} workflow{resultCount !== 1 ? "s" : ""}
        </span>
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1"
          >
            <X className="h-4 w-4" />
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
