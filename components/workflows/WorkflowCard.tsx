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

const CLOUD_COLORS: Record<CloudId, string> = {
  "creation": "bg-pink-100 text-pink-700",
  "video": "bg-orange-100 text-orange-700",
  "writing-seo": "bg-blue-100 text-blue-700",
  "file-data": "bg-slate-100 text-slate-700",
  "monetization": "bg-green-100 text-green-700",
  "intelligence": "bg-purple-100 text-purple-700",
  "music-performance": "bg-fuchsia-100 text-fuchsia-700",
  "growth-distribution": "bg-teal-100 text-teal-700",
  "shopping": "bg-amber-100 text-amber-700",
  "advertising": "bg-red-100 text-red-700",
};

interface WorkflowCardProps {
  workflow: Workflow;
}

export default function WorkflowCard({ workflow }: WorkflowCardProps) {
  const cloudLabel = CLOUD_LABELS[workflow.cloud];
  const cloudColor = CLOUD_COLORS[workflow.cloud];
  const CloudIcon = CLOUD_THEMES[workflow.cloud]?.icon;

  return (
    <Link
      href={`/workflows/${workflow.slug}`}
      className="group block bg-white rounded-2xl border border-gray-200 hover:border-orange-300 hover:shadow-lg transition-all p-6"
    >
      <div className="mb-4">
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${cloudColor}`}>
          {CloudIcon && <CloudIcon className="h-3.5 w-3.5" />}
          {cloudLabel}
        </span>
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
