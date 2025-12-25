import { Workflow } from "./types";

export const workflows: Workflow[] = [
  {
    id: "wf-1",
    slug: "first-sale-from-zero",
    title: "From Zero to Your First Digital Sale",
    pain_subtitle: "You have ideas but zero products, zero audience, and zero sales.",
    cloud: "monetization",
    outcome_tag: "First Sale",
    difficulty: "Beginner",
    time_to_first_result: "2–4 weeks",
    why_this_works: [
      "Focuses on selling before building, so you don't waste time on products nobody wants",
      "Uses free traffic sources to validate demand without ad spend",
      "Creates a minimum viable product that can be delivered in hours, not months",
      "Builds momentum with quick wins that compound into bigger opportunities"
    ],
    steps: [
      {
        title: "Pick a painful problem you can solve",
        instruction: "List 5 problems you've personally solved. Pick the one where people actively complain online (Reddit, Twitter, forums).",
        output: "One specific problem statement",
        time_estimate: "1 hour",
        tool_slug: "keyword-finder",
        tool_label: "Find demand"
      },
      {
        title: "Research what people already pay for",
        instruction: "Search Gumroad, Etsy, and competitors to see what formats sell (templates, guides, tools). Note price points.",
        output: "3 competitor products with prices",
        time_estimate: "2 hours"
      },
      {
        title: "Create your minimum viable product",
        instruction: "Build the simplest version that solves the core problem. A Notion template, a PDF guide, or a spreadsheet is enough.",
        output: "Deliverable file ready to sell",
        time_estimate: "4–8 hours",
        tool_slug: "pdf-editor",
        tool_label: "Create PDF"
      },
      {
        title: "Write a landing page that sells",
        instruction: "Focus on the transformation: what life looks like before vs after using your product. Include 3 bullet benefits and a clear price.",
        output: "Live sales page",
        time_estimate: "2 hours",
        tool_slug: "ad-copy-analyzer",
        tool_label: "Improve copy"
      },
      {
        title: "Set up payment collection",
        instruction: "Use Gumroad, Lemonsqueezy, or Stripe for instant checkout. Keep it simple—no complex funnels yet.",
        output: "Working checkout link",
        time_estimate: "30 minutes"
      },
      {
        title: "Share in 5 communities where your audience lives",
        instruction: "Post genuinely helpful content that leads to your product. Don't spam—add value first, mention your solution naturally.",
        output: "5 community posts live",
        time_estimate: "3 hours",
        tool_slug: "reach-grabber-tool",
        tool_label: "Optimize reach"
      },
      {
        title: "Follow up and iterate",
        instruction: "Ask early customers for feedback. Use it to improve the product or create upsells.",
        output: "First customer testimonial",
        time_estimate: "Ongoing"
      }
    ],
    failure_points: [
      "Spending months building before validating demand",
      "Pricing too low out of fear (under $10 kills perceived value)",
      "Posting once and giving up when sales don't happen instantly",
      "Making the product too broad instead of solving one specific problem",
      "Hiding in creation mode instead of putting yourself out there",
      "Ignoring feedback from potential customers",
      "Not following up with interested prospects"
    ],
    expected_outcome: "Within 2–4 weeks, you'll have made your first sale online—even if it's just $20. More importantly, you'll have proof that strangers will pay for your expertise, which is the foundation for everything else.",
    tool_refs: [
      { slug: "keyword-finder", name: "Keyword Finder" },
      { slug: "pdf-editor", name: "PDF Editor" },
      { slug: "ad-copy-analyzer", name: "Ad Copy Analyzer" }
    ],
    seo: {
      title: "From Zero to First Sale — Step-by-Step Workflow | VCM Suite",
      description: "A proven 7-step workflow to make your first digital product sale online. No audience, no experience required. Start selling in 2–4 weeks.",
      keywords: ["first sale", "digital product", "make money online", "sell online"]
    },
    isPublished: true,
    isIndexed: true
  },
  {
    id: "wf-2",
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
        instruction: "Find one brand in your niche that has been running ads 3+ months, is advertising the same product category, and is running ads on the same platform you plan to use. Rule: Consistency = profit. Short bursts = experiments or failure.",
        output: "1 confirmed profitable competitor",
        time_estimate: "1 hour"
      },
      {
        title: "Deconstruct the Offer (Not the Ad)",
        instruction: "Before touching creative, answer: What pain are they solving? What outcome is promised? How is risk reduced? (trial, guarantee, framing) What makes this feel urgent or necessary? If your offer is weaker than theirs, the ad will fail.",
        output: "A strengthened or re-framed offer that can compete",
        time_estimate: "2 hours"
      },
      {
        title: "Collect Their Longest-Running Ads",
        instruction: "Use Facebook Ad Library and TikTok Creative Center. Find ads running the longest, ads with multiple variations, and ads reused across campaigns. Save screenshots, on-screen text, hook language, and call-to-action phrasing.",
        output: "5–10 proven ad examples",
        time_estimate: "2 hours"
      },
      {
        title: "Extract Winning Patterns",
        instruction: "Do not copy. Analyze: Opening hook type (shock, pain, contrast, authority), emotional framing (fear, relief, aspiration), structure (problem → proof → payoff), and visual style (UGC, demo, lifestyle, before/after).",
        output: "5 rewritten hooks + angles tailored to your offer",
        time_estimate: "3 hours",
        tool_slug: "ad-copy-analyzer",
        tool_label: "Analyze patterns"
      },
      {
        title: "Generate Visual Prompts (Pattern-Matched)",
        instruction: "Describe the style and composition, preserve the pattern (not the asset), and generate variation automatically. Rule: Same structure, different execution.",
        output: "5 image prompts ready for generation",
        time_estimate: "2 hours",
        tool_slug: "image-prompt-generator",
        tool_label: "Generate prompts"
      },
      {
        title: "Create Your Ad Creatives",
        instruction: "Generate images using ChatGPT (DALL·E), Gemini, Grok, or any image LLM you trust. Make small variations: change background, change subject, change emotion. Do not over-iterate.",
        output: "5 ad creatives ready to launch",
        time_estimate: "3 hours"
      },
      {
        title: "Launch Controlled Tests",
        instruction: "Launch each creative at $3–$20/day with the same audience, same offer, and same landing page. Let ads run 3 days minimum or 1,000+ impressions.",
        output: "Clean initial performance data",
        time_estimate: "3 days"
      },
      {
        title: "Decide With Real Signals",
        instruction: "Use metrics correctly: CTR = creative filter, CPC + downstream action = scale signal. Rules: Kill ads under 1% CTR, iterate 1–2% CTR, scale ads that maintain CTR while CPC drops or stays stable. Never scale clickbait.",
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
      { slug: "image-prompt-generator", name: "Image Prompt Generator" }
    ],
    seo: {
      title: "Copy Competitor Ads That Work — Complete Workflow | VCM Suite",
      description: "Learn how to ethically reverse-engineer competitor ads that are already profitable. Stop guessing and start with proven patterns.",
      keywords: ["facebook ads", "competitor analysis", "ad copy", "marketing"]
    },
    isPublished: true,
    isIndexed: true
  },
  {
    id: "wf-3",
    slug: "validate-offer-fast",
    title: "Validate an Offer Before You Build It",
    pain_subtitle: "You're afraid of wasting months building something nobody wants.",
    cloud: "monetization",
    outcome_tag: "Validate Offer",
    difficulty: "Beginner",
    time_to_first_result: "3–7 days",
    why_this_works: [
      "Gets real market feedback before you invest time building",
      "Pre-selling proves demand with actual money, not just opinions",
      "Forces you to clarify your value proposition before overcomplicating",
      "Minimizes risk by testing cheaply and quickly"
    ],
    steps: [
      {
        title: "Write your offer in one sentence",
        instruction: "Complete this: 'I help [specific person] achieve [specific outcome] in [timeframe] using [method].'",
        output: "One-sentence offer statement",
        time_estimate: "30 minutes"
      },
      {
        title: "Identify where your audience hangs out",
        instruction: "List 5 online communities (subreddits, Facebook groups, Discord servers, forums) where your target customer asks questions.",
        output: "5 community links",
        time_estimate: "1 hour"
      },
      {
        title: "Create a simple landing page",
        instruction: "Build a one-page site explaining the problem, your solution, and a waitlist signup. No product needed yet.",
        output: "Live landing page with email capture",
        time_estimate: "2 hours"
      },
      {
        title: "Post valuable content that leads to your page",
        instruction: "Share insights related to your offer in those 5 communities. Mention you're building a solution and link to your waitlist.",
        output: "5 posts live with 50+ waitlist signups",
        time_estimate: "3 hours",
        tool_slug: "reach-grabber-tool",
        tool_label: "Boost reach"
      },
      {
        title: "Reach out for validation calls",
        instruction: "DM 20 waitlist signups offering a free 15-minute call to understand their problem better. Listen more than you talk.",
        output: "5+ completed calls with notes",
        time_estimate: "5 hours"
      },
      {
        title: "Pre-sell before building",
        instruction: "Offer early access at a discount to waitlist members. Set a clear deadline. Aim for 5–10 pre-orders.",
        output: "Pre-order revenue (proof of demand)",
        time_estimate: "2 days"
      }
    ],
    failure_points: [
      "Asking friends and family (they'll say yes to be nice)",
      "Treating signups as validation (only money proves demand)",
      "Making the offer too vague or broad",
      "Skipping validation calls because they feel uncomfortable",
      "Building after just one positive signal (need consistent patterns)",
      "Waiting for 'enough' data instead of making a decision",
      "Ignoring negative feedback because it hurts",
      "Pre-selling too cheaply (underpricing attracts wrong customers)"
    ],
    expected_outcome: "Within a week, you'll know if your idea has real demand. You'll either have pre-order revenue and confidence to build, or you'll have saved yourself months of wasted effort on the wrong idea.",
    tool_refs: [
      { slug: "reach-grabber-tool", name: "Reach Grabber" }
    ],
    seo: {
      title: "Validate Your Offer in 7 Days — Proven Workflow | VCM Suite",
      description: "Stop building products nobody wants. This 6-step workflow helps you validate any offer with real money before you invest time building.",
      keywords: ["validate idea", "pre-sell", "product validation", "market research"]
    },
    isPublished: true,
    isIndexed: true
  },
  {
    id: "wf-4",
    slug: "traffic-to-tool-funnel",
    title: "Turn Content Into an Evergreen Tool Funnel",
    pain_subtitle: "Your content gets views but doesn't convert into leads or sales.",
    cloud: "growth-distribution",
    outcome_tag: "Traffic",
    difficulty: "Intermediate",
    time_to_first_result: "2–6 weeks",
    why_this_works: [
      "Free tools attract visitors who are actively trying to solve problems (high intent)",
      "Tools create natural email capture opportunities without feeling salesy",
      "Evergreen SEO traffic compounds over time, unlike social posts that die quickly",
      "Positions you as the go-to resource in your niche"
    ],
    steps: [
      {
        title: "Identify your audience's #1 repeated task",
        instruction: "What do your readers do manually over and over? (Calculate something, format something, check something). That's your tool idea.",
        output: "One tool concept",
        time_estimate: "1 hour",
        tool_slug: "keyword-finder",
        tool_label: "Find search demand"
      },
      {
        title: "Validate search demand",
        instruction: "Check if people search for '[task] tool' or '[task] calculator'. Look for 500+ monthly searches with low competition.",
        output: "Keyword with volume data",
        time_estimate: "1 hour",
        tool_slug: "keyword-finder",
        tool_label: "Keyword research"
      },
      {
        title: "Build a simple version of the tool",
        instruction: "Create the minimum viable tool that solves the core problem. Use no-code builders or simple scripts. Perfection is the enemy.",
        output: "Working tool MVP",
        time_estimate: "4–8 hours"
      },
      {
        title: "Add email capture to unlock features",
        instruction: "Gate advanced features, results export, or saved history behind email signup. Make the core tool free.",
        output: "Tool with email gate",
        time_estimate: "1 hour"
      },
      {
        title: "Create SEO-optimized content around the tool",
        instruction: "Write a blog post targeting '[task] + tool' keywords. Embed the tool and explain how to use it with examples.",
        output: "Published article with embedded tool",
        time_estimate: "3 hours",
        tool_slug: "reach-grabber-tool",
        tool_label: "Optimize for SEO"
      },
      {
        title: "Set up automated email nurture",
        instruction: "Create a 5-email sequence that delivers more value, builds trust, and introduces your paid offers.",
        output: "Email sequence live",
        time_estimate: "4 hours"
      },
      {
        title: "Promote and build backlinks",
        instruction: "Share in relevant communities, reach out to bloggers who cover similar topics, and list on tool directories.",
        output: "10+ referring domains",
        time_estimate: "Ongoing",
        tool_slug: "internal-link-seo-audit",
        tool_label: "Audit links"
      }
    ],
    failure_points: [
      "Building a tool nobody searches for",
      "Overcomplicating the tool instead of shipping fast",
      "Gating too much (kills trust) or too little (kills conversions)",
      "Writing thin content that doesn't rank",
      "No email sequence means leads go cold",
      "Not promoting—SEO takes months without initial signals",
      "Giving up before the content ranks (usually 3–6 months)"
    ],
    expected_outcome: "You'll have an evergreen traffic asset that brings in qualified leads on autopilot. Expect 100–500 monthly visitors within 2–3 months, growing as SEO compounds, with 5–15% converting to email subscribers.",
    tool_refs: [
      { slug: "keyword-finder", name: "Keyword Finder" },
      { slug: "reach-grabber-tool", name: "Reach Grabber" },
      { slug: "internal-link-seo-audit", name: "Internal Link Audit" }
    ],
    seo: {
      title: "Turn Content Into a Tool Funnel — Traffic Workflow | VCM Suite",
      description: "Build an evergreen funnel that turns content into leads and sales. This workflow shows you how to create SEO tools that convert.",
      keywords: ["content marketing", "lead generation", "SEO tools", "traffic funnel"]
    },
    isPublished: true,
    isIndexed: true
  },
  {
    id: "wf-5",
    slug: "audience-no-money",
    title: "You Have an Audience, But No Monetization",
    pain_subtitle: "You've built followers but can't figure out how to turn attention into income.",
    cloud: "monetization",
    outcome_tag: "Recurring Income",
    difficulty: "Beginner",
    time_to_first_result: "2–4 weeks",
    why_this_works: [
      "Your audience already trusts you—that's the hardest part done",
      "Starts with your warmest segment instead of cold outreach",
      "Tests monetization with minimal risk before big investments",
      "Creates recurring revenue instead of one-time sales"
    ],
    steps: [
      {
        title: "Survey your audience",
        instruction: "Ask: 'What's your #1 challenge with [topic]?' and 'Would you pay for help with this?' Use Google Forms or a simple poll.",
        output: "Top 3 challenges your audience faces",
        time_estimate: "1 hour"
      },
      {
        title: "Identify your monetization model",
        instruction: "Choose based on audience size: <1K followers = services, 1K–10K = digital products, 10K+ = courses or memberships.",
        output: "Chosen monetization path",
        time_estimate: "30 minutes"
      },
      {
        title: "Create your first paid offer",
        instruction: "Package your expertise into the simplest format. A 1-hour coaching call, a PDF guide, or a mini-course. Start small.",
        output: "Offer ready to sell",
        time_estimate: "4–8 hours",
        tool_slug: "pdf-editor",
        tool_label: "Create deliverable"
      },
      {
        title: "Write a sales email sequence",
        instruction: "Draft 3 emails: problem agitation, solution introduction, and limited-time offer. Send to your warmest subscribers first.",
        output: "3-email sequence ready",
        time_estimate: "2 hours",
        tool_slug: "ad-copy-analyzer",
        tool_label: "Improve copy"
      },
      {
        title: "Launch to your warm audience",
        instruction: "Email your list, post on social, and DM your most engaged followers. Create urgency with a deadline or limited spots.",
        output: "First 5–10 sales",
        time_estimate: "1 week"
      },
      {
        title: "Collect testimonials and case studies",
        instruction: "Follow up with buyers for feedback. Screenshot wins and write up transformations for future marketing.",
        output: "3+ testimonials",
        time_estimate: "Ongoing"
      },
      {
        title: "Create a recurring offer",
        instruction: "Turn one-time buyers into recurring revenue with a membership, subscription, or ongoing service.",
        output: "Recurring revenue stream",
        time_estimate: "2 weeks",
        tool_slug: "reach-grabber-tool",
        tool_label: "Grow reach"
      }
    ],
    failure_points: [
      "Assuming what your audience wants instead of asking",
      "Pricing too low out of imposter syndrome",
      "Launching once without follow-up emails",
      "Not creating urgency (deadlines work)",
      "Ignoring your warmest fans in favor of cold traffic",
      "Trying to build the 'perfect' product before selling",
      "Giving up after slow initial response (your list might need warming)"
    ],
    expected_outcome: "Within 2–4 weeks, you'll have your first paying customers from your existing audience. You'll understand what they're willing to pay for and have a foundation for recurring revenue.",
    tool_refs: [
      { slug: "pdf-editor", name: "PDF Editor" },
      { slug: "ad-copy-analyzer", name: "Ad Copy Analyzer" },
      { slug: "reach-grabber-tool", name: "Reach Grabber" }
    ],
    seo: {
      title: "Monetize Your Audience — Creator Workflow | VCM Suite",
      description: "Turn your followers into paying customers. A step-by-step workflow for creators who have an audience but no income.",
      keywords: ["monetize audience", "creator economy", "recurring income", "sell to followers"]
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
