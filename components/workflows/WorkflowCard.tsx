"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Workflow } from "@/lib/workflows/types";
import { CloudId, CLOUD_THEMES } from "@/lib/cloudTheme";

const CLOUD_LABELS: Record<CloudId, string> = {
  "creation": "Creation Cloud",
  "video": "Video Cloud",
  "writing-seo": "Writing & SEO Cloud",
  "file-data": "File & Data Cloud",
  "monetization": "Monetization Cloud",
  "intelligence": "Intelligence Cloud",
  "music-performance": "Music Cloud",
  "growth-distribution": "Growth Cloud",
  "shopping": "Shopping Cloud",
  "advertising": "Advertising Cloud",
};

const CLOUD_BG_COLORS: Record<CloudId, string> = {
  "creation": "#fce7f3",
  "video": "#ffedd5",
  "writing-seo": "#dbeafe",
  "file-data": "#f1f5f9",
  "monetization": "#d1fae5",
  "intelligence": "#ede9fe",
  "music-performance": "#fae8ff",
  "growth-distribution": "#ccfbf1",
  "shopping": "#fef3c7",
  "advertising": "#fee2e2",
};

interface WorkflowCardProps {
  workflow: Workflow;
}

export default function WorkflowCard({ workflow }: WorkflowCardProps) {
  const cloudLabel = CLOUD_LABELS[workflow.cloud];
  const bgColor = CLOUD_BG_COLORS[workflow.cloud];
  const CloudIcon = CLOUD_THEMES[workflow.cloud]?.icon;

  return (
    <Link
      href={`/workflows/${workflow.slug}`}
      className="group block rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all hover:-translate-y-1"
      style={{ backgroundColor: bgColor }}
    >
      <div className="p-6 h-full flex flex-col">
        <div className="mb-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/80 text-gray-800">
            {CloudIcon && <CloudIcon className="h-3.5 w-3.5" />}
            {cloudLabel}
          </span>
        </div>

        <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-gray-800 transition-colors">
          {workflow.title}
        </h3>

        <p className="text-gray-700/80 text-sm mb-4 line-clamp-2 flex-1">
          {workflow.pain_subtitle}
        </p>

        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1.5 text-gray-700/70 font-medium">
            <Sparkles className="h-4 w-4" />
            {workflow.steps.length} steps
          </span>
          <span className="flex items-center gap-1 text-gray-900 font-semibold group-hover:gap-2 transition-all">
            Start workflow
            <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}
