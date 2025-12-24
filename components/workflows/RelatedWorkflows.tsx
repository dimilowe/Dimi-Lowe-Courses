"use client";

import { Workflow } from "@/lib/workflows/types";
import WorkflowCard from "./WorkflowCard";

interface RelatedWorkflowsProps {
  workflows: Workflow[];
}

export default function RelatedWorkflows({ workflows }: RelatedWorkflowsProps) {
  if (workflows.length === 0) return null;

  return (
    <section className="mt-16">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Related Workflows
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {workflows.map((workflow) => (
          <WorkflowCard key={workflow.id} workflow={workflow} />
        ))}
      </div>
    </section>
  );
}
