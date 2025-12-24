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

const CLOUD_GRADIENTS: Record<CloudId, string> = {
  "creation": "from-pink-400 via-pink-300 to-rose-200",
  "video": "from-orange-400 via-amber-300 to-yellow-200",
  "writing-seo": "from-blue-400 via-blue-300 to-sky-200",
  "file-data": "from-slate-400 via-slate-300 to-gray-200",
  "monetization": "from-emerald-400 via-green-300 to-teal-200",
  "intelligence": "from-purple-400 via-violet-300 to-indigo-200",
  "music-performance": "from-fuchsia-400 via-pink-300 to-purple-200",
  "growth-distribution": "from-teal-400 via-cyan-300 to-sky-200",
  "shopping": "from-amber-400 via-orange-300 to-yellow-200",
  "advertising": "from-red-400 via-rose-300 to-pink-200",
};

interface WorkflowCardProps {
  workflow: Workflow;
}

export default function WorkflowCard({ workflow }: WorkflowCardProps) {
  const cloudLabel = CLOUD_LABELS[workflow.cloud];
  const cloudGradient = CLOUD_GRADIENTS[workflow.cloud];
  const CloudIcon = CLOUD_THEMES[workflow.cloud]?.icon;

  return (
    <Link
      href={`/workflows/${workflow.slug}`}
      className="group block rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all hover:-translate-y-1"
    >
      <div className={`bg-gradient-to-br ${cloudGradient} p-6 h-full flex flex-col`}>
        <div className="mb-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/80 text-gray-800 backdrop-blur-sm">
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
