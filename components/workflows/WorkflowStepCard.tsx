"use client";

import Link from "next/link";
import { CheckCircle2, Clock, ArrowRight, Lock } from "lucide-react";
import { WorkflowStep } from "@/lib/workflows/types";

interface WorkflowStepCardProps {
  step: WorkflowStep;
  stepNumber: number;
  availableTools: Set<string>;
}

export default function WorkflowStepCard({ step, stepNumber, availableTools }: WorkflowStepCardProps) {
  const hasMainTool = step.tool_slug && step.tool_label;
  const isToolAvailable = step.tool_slug ? availableTools.has(step.tool_slug) : false;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-orange-100 text-orange-600 font-bold text-lg flex items-center justify-center">
          {stepNumber}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {step.title}
          </h3>
          
          <p className="text-gray-600 mb-4">
            {step.instruction}
          </p>

          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5 text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              <span className="font-medium">Output:</span>
              <span className="text-gray-600">{step.output}</span>
            </div>

            {step.time_estimate && (
              <div className="flex items-center gap-1.5 text-gray-500">
                <Clock className="h-4 w-4" />
                <span>{step.time_estimate}</span>
              </div>
            )}
          </div>

          {hasMainTool && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              {isToolAvailable ? (
                <Link
                  href={`/tools/${step.tool_slug}`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors"
                >
                  {step.tool_label}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <button
                  disabled
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-400 font-medium rounded-lg cursor-not-allowed"
                >
                  <Lock className="h-4 w-4" />
                  {step.tool_label} — Coming soon
                </button>
              )}

              {step.secondary_tools && step.secondary_tools.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {step.secondary_tools.map((tool) => {
                    const available = availableTools.has(tool.tool_slug);
                    return available ? (
                      <Link
                        key={tool.tool_slug}
                        href={`/tools/${tool.tool_slug}`}
                        className="text-sm text-orange-600 hover:text-orange-700 underline"
                      >
                        {tool.label}
                      </Link>
                    ) : (
                      <span
                        key={tool.tool_slug}
                        className="text-sm text-gray-400"
                      >
                        {tool.label} (coming soon)
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
