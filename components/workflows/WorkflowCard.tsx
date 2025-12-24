"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Workflow } from "@/lib/workflows/types";
import WorkflowBadges from "./WorkflowBadges";

interface WorkflowCardProps {
  workflow: Workflow;
}

export default function WorkflowCard({ workflow }: WorkflowCardProps) {
  return (
    <Link
      href={`/workflows/${workflow.slug}`}
      className="group block bg-white rounded-2xl border border-gray-200 hover:border-orange-300 hover:shadow-lg transition-all p-6"
    >
      <div className="mb-4">
        <WorkflowBadges
          outcome_tag={workflow.outcome_tag}
          difficulty={workflow.difficulty}
          time_to_first_result={workflow.time_to_first_result}
          size="sm"
        />
      </div>

      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-orange-600 transition-colors mb-2">
        {workflow.title}
      </h3>

      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
        {workflow.pain_subtitle}
      </p>

      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5 text-gray-500">
          <Sparkles className="h-4 w-4" />
          {workflow.steps.length} steps
        </span>
        <span className="flex items-center gap-1 text-orange-600 font-medium group-hover:gap-2 transition-all">
          Start workflow
          <ArrowRight className="h-4 w-4" />
        </span>
      </div>
    </Link>
  );
}
