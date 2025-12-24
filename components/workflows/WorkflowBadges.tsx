"use client";

import { Target, Clock, BarChart3 } from "lucide-react";
import { Difficulty } from "@/lib/workflows/types";

interface WorkflowBadgesProps {
  outcome_tag: string;
  difficulty: Difficulty;
  time_to_first_result: string;
  size?: "sm" | "md";
}

const difficultyColors: Record<Difficulty, string> = {
  Beginner: "bg-green-100 text-green-700",
  Intermediate: "bg-yellow-100 text-yellow-700",
  Advanced: "bg-red-100 text-red-700"
};

export default function WorkflowBadges({
  outcome_tag,
  difficulty,
  time_to_first_result,
  size = "md"
}: WorkflowBadgesProps) {
  const textSize = size === "sm" ? "text-xs" : "text-sm";
  const iconSize = size === "sm" ? "h-3 w-3" : "h-4 w-4";
  const padding = size === "sm" ? "px-2 py-1" : "px-3 py-1.5";

  return (
    <div className="flex flex-wrap gap-2">
      <span className={`inline-flex items-center gap-1.5 ${padding} rounded-full bg-orange-100 text-orange-700 font-medium ${textSize}`}>
        <Target className={iconSize} />
        {outcome_tag}
      </span>
      <span className={`inline-flex items-center gap-1.5 ${padding} rounded-full ${difficultyColors[difficulty]} font-medium ${textSize}`}>
        <BarChart3 className={iconSize} />
        {difficulty}
      </span>
      <span className={`inline-flex items-center gap-1.5 ${padding} rounded-full bg-gray-100 text-gray-700 font-medium ${textSize}`}>
        <Clock className={iconSize} />
        {time_to_first_result}
      </span>
    </div>
  );
}
