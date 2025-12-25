"use client";

import Link from "next/link";
import { CheckCircle2, Lock, ExternalLink } from "lucide-react";
import { WorkflowStep } from "@/lib/workflows/types";
import { parseInstruction } from "@/lib/workflows/instructionParser";

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

  const instructionSegments = parseInstruction(step.instruction);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-orange-100 text-orange-600 font-bold text-lg flex items-center justify-center">
          {stepNumber}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            {step.title}
          </h3>
          
          <div className="text-gray-600 mb-4 space-y-3">
            {instructionSegments.map((segment, index) => {
              if (segment.type === 'paragraph') {
                return (
                  <p key={index} className="leading-relaxed">
                    {segment.text}
                  </p>
                );
              } else {
                return (
                  <ul key={index} className="list-disc list-outside ml-5 space-y-1.5">
                    {segment.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="leading-relaxed">
                        {item}
                      </li>
                    ))}
                  </ul>
                );
              }
            })}
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5 text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              <span className="font-medium">Output:</span>
              <span className="text-gray-600">{step.output}</span>
            </div>
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
