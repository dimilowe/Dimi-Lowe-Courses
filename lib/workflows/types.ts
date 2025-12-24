import { CloudId } from "@/lib/cloudTheme";

export type Difficulty = "Beginner" | "Intermediate" | "Advanced";

export interface WorkflowStep {
  title: string;
  instruction: string;
  output: string;
  time_estimate?: string;
  tool_slug?: string;
  tool_label?: string;
  secondary_tools?: { tool_slug: string; label: string }[];
}

export interface ToolRef {
  slug: string;
  name: string;
}

export interface WorkflowSEO {
  title: string;
  description: string;
  keywords?: string[];
}

export interface Workflow {
  id: string;
  slug: string;
  title: string;
  pain_subtitle: string;
  cloud: CloudId;
  outcome_tag: string;
  difficulty: Difficulty;
  time_to_first_result: string;
  summary?: string;
  why_this_works: string[];
  steps: WorkflowStep[];
  failure_points: string[];
  expected_outcome: string;
  tool_refs?: ToolRef[];
  related_slugs?: string[];
  seo: WorkflowSEO;
  isPublished: boolean;
  isIndexed: boolean;
}
