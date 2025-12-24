"use client";

import { useState, useMemo } from "react";
import { Zap } from "lucide-react";
import { getWorkflows, getAllOutcomeTags, getAllDifficulties } from "@/lib/workflows/workflows";
import WorkflowCard from "@/components/workflows/WorkflowCard";
import WorkflowFilters from "@/components/workflows/WorkflowFilters";

export default function WorkflowsPage() {
  const workflows = getWorkflows();
  const outcomeTags = getAllOutcomeTags();
  const difficulties = getAllDifficulties();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOutcome, setSelectedOutcome] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);

  const filteredWorkflows = useMemo(() => {
    return workflows.filter((workflow) => {
      const matchesSearch =
        !searchQuery ||
        workflow.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        workflow.pain_subtitle.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesOutcome = !selectedOutcome || workflow.outcome_tag === selectedOutcome;
      const matchesDifficulty = !selectedDifficulty || workflow.difficulty === selectedDifficulty;

      return matchesSearch && matchesOutcome && matchesDifficulty;
    });
  }, [workflows, searchQuery, selectedOutcome, selectedDifficulty]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedOutcome(null);
    setSelectedDifficulty(null);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-orange-50/50 to-white">
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-full text-sm font-medium mb-4">
            <Zap className="h-4 w-4" />
            Step-by-step guides
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Creator Workflows
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Proven step-by-step processes to achieve specific creator goals. 
            Pick your challenge and follow the path to results.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
          <WorkflowFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedOutcome={selectedOutcome}
            onOutcomeChange={setSelectedOutcome}
            selectedDifficulty={selectedDifficulty}
            onDifficultyChange={setSelectedDifficulty}
            outcomeTags={outcomeTags}
            difficulties={difficulties}
            resultCount={filteredWorkflows.length}
            onClearFilters={clearFilters}
          />
        </div>

        {filteredWorkflows.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWorkflows.map((workflow) => (
              <WorkflowCard key={workflow.id} workflow={workflow} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
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
