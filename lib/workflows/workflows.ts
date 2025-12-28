import { Workflow } from "./types";

export const workflows: Workflow[] = [
  {
    id: "wf-1",
    slug: "copy-competitor-ads",
    title: "Copy Proven Competitor Ads (Without Burning Cash)",
    pain_subtitle: "You don't guess what works. You borrow proof, then adapt it to your offer. This workflow is built to find ads that convert, not just ads that get clicks.",
    cloud: "advertising",
    outcome_tag: "Ads",
    difficulty: "Intermediate",
    time_to_first_result: "1–2 weeks",
    why_this_works: [
      "Your competitors already spent thousands discovering what works",
      "You extract patterns, not words (legal + effective)",
      "You start with winning angles, not random ideas",
      "You avoid early-stage ad budget death",
      "You replace emotion with signals"
    ],
    steps: [
      {
        title: "Identify a Truly Profitable Competitor",
        instruction: "Find one brand in your niche that:\n\n• Has been running ads 3+ months\n• Is advertising the same product category\n• Is running ads on the same platform you plan to use\n\nRule: Consistency = profit. Short bursts = experiments or failure.",
        output: "1 confirmed profitable competitor",
        time_estimate: "1 hour"
      },
      {
        title: "Deconstruct the Offer (Not the Ad)",
        instruction: "Before touching creative, answer:\n\n• What pain are they solving?\n• What outcome is promised?\n• How is risk reduced? (trial, guarantee, framing)\n• What makes this feel urgent or necessary?\n\nIf your offer is weaker than theirs, the ad will fail.",
        output: "A strengthened or re-framed offer that can compete",
        time_estimate: "2 hours"
      },
      {
        title: "Collect Their Longest-Running Ads",
        instruction: "Use Facebook Ad Library and TikTok Creative Center.\n\nFind:\n• Ads running the longest\n• Ads with multiple variations\n• Ads reused across campaigns\n\nSave: Screenshots, on-screen text, hook language, and call-to-action phrasing.",
        output: "5–10 proven ad examples",
        time_estimate: "2 hours"
      },
      {
        title: "Extract Winning Patterns",
        instruction: "Do not copy.\n\nAnalyze:\n• Opening hook type (shock, pain, contrast, authority)\n• Emotional framing (fear, relief, aspiration)\n• Structure (problem → proof → payoff)\n• Visual style (UGC, demo, lifestyle, before/after)\n\nUse your Ad Copy Analyzer Tool to translate patterns into your brand voice.",
        output: "5 rewritten hooks + angles tailored to your offer",
        time_estimate: "3 hours",
        tool_slug: "ad-copy-analyzer",
        tool_label: "Analyze patterns"
      },
      {
        title: "Generate Visual Prompts (Pattern-Matched)",
        instruction: "Use your Image Prompt Generator Tool to:\n\n• Describe the style and composition\n• Preserve the pattern, not the asset\n• Generate variation automatically\n\nRule: Same structure, different execution.",
        output: "5 image prompts ready for generation",
        time_estimate: "2 hours",
        tool_slug: "image-to-prompt",
        tool_label: "Generate prompts"
      },
      {
        title: "Create Your Ad Creatives",
        instruction: "Generate images using:\n\n• ChatGPT (DALL·E)\n• Gemini\n• Grok\n• Or any image LLM you trust\n\nMake small variations: Change background, change subject, change emotion.\n\nDo not over-iterate.",
        output: "5 ad creatives ready to launch",
        time_estimate: "3 hours"
      },
      {
        title: "Launch Controlled Tests",
        instruction: "Launch each creative at $3–$20/day with:\n\n• Same audience\n• Same offer\n• Same landing page\n\nLet ads run 3 days minimum or 1,000+ impressions.",
        output: "Clean initial performance data",
        time_estimate: "3 days"
      },
      {
        title: "Decide With Real Signals",
        instruction: "Use metrics correctly:\n\n• CTR → creative filter\n• CPC + downstream action → scale signal\n\nRules:\n• Kill ads under 1% CTR\n• Iterate 1–2% CTR\n• Scale ads that maintain CTR while CPC drops or stays stable\n\nNever scale clickbait.",
        output: "1–2 scalable ad creatives",
        time_estimate: "1 week"
      }
    ],
    failure_points: [
      "Copying ads word-for-word",
      "Studying losing competitors",
      "Testing across platforms blindly",
      "Judging ads too fast",
      "Scaling CTR without conversions",
      "Ignoring offer strength",
      "Quitting after one batch"
    ],
    expected_outcome: "You walk away with 1–2 ads built on proven demand, lower learning costs, repeatable ad pattern intelligence, and a system you can rerun every time you launch something new.",
    tool_refs: [
      { slug: "ad-copy-analyzer", name: "Ad Copy Analyzer" },
      { slug: "image-to-prompt", name: "Image to Prompt Generator" }
    ],
    seo: {
      title: "Copy Competitor Ads That Work — Complete Workflow | VCM Suite",
      description: "Learn how to ethically reverse-engineer competitor ads that are already profitable. Stop guessing and start with proven patterns.",
      keywords: ["facebook ads", "competitor analysis", "ad copy", "marketing"]
    },
    isPublished: true,
    isIndexed: true
  }
];

export function getWorkflows(): Workflow[] {
  return workflows.filter(w => w.isPublished);
}

export function getWorkflowBySlug(slug: string): Workflow | undefined {
  return workflows.find(w => w.slug === slug && w.isPublished);
}

export function getRelatedWorkflows(workflow: Workflow, limit = 3): Workflow[] {
  const others = workflows.filter(w => w.slug !== workflow.slug && w.isPublished);
  
  const sameOutcome = others.filter(w => w.outcome_tag === workflow.outcome_tag);
  if (sameOutcome.length >= limit) return sameOutcome.slice(0, limit);
  
  const sameDifficulty = others.filter(
    w => w.difficulty === workflow.difficulty && w.outcome_tag !== workflow.outcome_tag
  );
  const combined = [...sameOutcome, ...sameDifficulty];
  if (combined.length >= limit) return combined.slice(0, limit);
  
  const remaining = others.filter(
    w => w.outcome_tag !== workflow.outcome_tag && w.difficulty !== workflow.difficulty
  );
  return [...combined, ...remaining].slice(0, limit);
}

export function getAllOutcomeTags(): string[] {
  return [...new Set(workflows.filter(w => w.isPublished).map(w => w.outcome_tag))];
}

export function getAllDifficulties(): string[] {
  return ["Beginner", "Intermediate", "Advanced"];
}
