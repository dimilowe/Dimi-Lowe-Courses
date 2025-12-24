"use client";

import Link from "next/link";
import { CheckCircle2, Clock, ArrowRight, Lock, ExternalLink } from "lucide-react";
import { WorkflowStep } from "@/lib/workflows/types";

interface ToolInfo {
  name: string;
  available: boolean;
}

interface WorkflowStepCardProps {
  step: WorkflowStep;
  stepNumber: number;
  toolsInfo: Map<string, ToolInfo>;
}

export default function WorkflowStepCard({ step, stepNumber, toolsInfo }: WorkflowStepCardProps) {
  const hasMainTool = step.tool_slug;
  const toolInfo = step.tool_slug ? toolsInfo.get(step.tool_slug) : null;
  const isToolAvailable = toolInfo?.available ?? false;
  const toolName = toolInfo?.name ?? step.tool_label;

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
                <a
                  href={`/tools/${step.tool_slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors"
                >
                  {toolName}
                  <ExternalLink className="h-4 w-4" />
                </a>
              ) : (
                <button
                  disabled
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-400 font-medium rounded-lg cursor-not-allowed"
                >
                  <Lock className="h-4 w-4" />
                  {toolName} — Coming soon
                </button>
              )}

              {step.secondary_tools && step.secondary_tools.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {step.secondary_tools.map((tool) => {
                    const secToolInfo = toolsInfo.get(tool.tool_slug);
                    const secToolName = secToolInfo?.name ?? tool.label;
                    const available = secToolInfo?.available ?? false;
                    return available ? (
                      <a
                        key={tool.tool_slug}
                        href={`/tools/${tool.tool_slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-orange-600 hover:text-orange-700 underline inline-flex items-center gap-1"
                      >
                        {secToolName}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span
                        key={tool.tool_slug}
                        className="text-sm text-gray-400"
                      >
                        {secToolName} (coming soon)
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
