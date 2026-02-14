"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Download, Sparkles, Clock, TrendingUp, AlertTriangle } from "lucide-react";

type TimePerWeek = "<5" | "5-10" | "10-20" | "20+";
type SkillLevel = "none" | "basic" | "intermediate" | "advanced";
type Skill = "writing" | "design" | "video" | "sales" | "coding" | "fitness" | "teaching" | "admin" | "art";
type IncomeGoal = "$500" | "$2000" | "$5000+";
type SpeedVsScale = "fast" | "balanced" | "scalable";
type CameraComfort = "no" | "maybe" | "yes";
type StartupBudget = "$0" | "<$100" | "$500+";

interface Answers {
  timePerWeek: TimePerWeek | null;
  skillLevel: SkillLevel | null;
  skills: Skill[];
  incomeGoal: IncomeGoal | null;
  speedVsScale: SpeedVsScale | null;
  cameraComfort: CameraComfort | null;
  startupBudget: StartupBudget | null;
}

interface IncomePath {
  id: string;
  title: string;
  whyItFits: string;
  timeToFirstDollar: string;
  scalability: "low" | "medium" | "high";
  steps: string[];
  riskNote: string;
  requiredSkills: Skill[];
  minTime: number;
  minBudget: number;
  needsCamera: boolean;
  speedType: SpeedVsScale;
}

const INCOME_PATHS: IncomePath[] = [
  {
    id: "freelance-writing",
    title: "Freelance Writing",
    whyItFits: "Turn your writing skills into income with blog posts, articles, and copy for businesses.",
    timeToFirstDollar: "1-2 weeks",
    scalability: "medium",
    steps: [
      "Create 3 writing samples in your niche (tech, health, finance, etc.)",
      "Set up profiles on Upwork, Contently, and ProBlogger",
      "Apply to 5-10 gigs daily with personalized pitches"
    ],
    riskNote: "Income can be inconsistent until you build recurring clients.",
    requiredSkills: ["writing"],
    minTime: 5,
    minBudget: 0,
    needsCamera: false,
    speedType: "fast"
  },
  {
    id: "virtual-assistant",
    title: "Virtual Assistant / Admin Support",
    whyItFits: "Help businesses with admin tasks, scheduling, email management, and data entry.",
    timeToFirstDollar: "1-2 weeks",
    scalability: "low",
    steps: [
      "List all admin skills you have (email, calendar, spreadsheets, CRM)",
      "Create a simple service menu with hourly rates ($15-35/hr)",
      "Apply on Belay, Time Etc, or post in Facebook VA groups"
    ],
    riskNote: "Income is limited by your hours; hard to scale without hiring.",
    requiredSkills: ["admin"],
    minTime: 10,
    minBudget: 0,
    needsCamera: false,
    speedType: "fast"
  },
  {
    id: "remote-sales",
    title: "Remote Sales / Appointment Setting",
    whyItFits: "High earning potential for people who can communicate and close deals.",
    timeToFirstDollar: "2-4 weeks",
    scalability: "high",
    steps: [
      "Learn basic sales frameworks (SPIN, Challenger, consultative selling)",
      "Apply to companies hiring remote SDRs or appointment setters",
      "Practice cold calling scripts until you're comfortable with rejection"
    ],
    riskNote: "Commission-based roles can have volatile income months.",
    requiredSkills: ["sales"],
    minTime: 20,
    minBudget: 0,
    needsCamera: true,
    speedType: "fast"
  },
  {
    id: "tutoring-coaching",
    title: "Online Tutoring / Coaching",
    whyItFits: "Monetize your knowledge by teaching others one-on-one or in groups.",
    timeToFirstDollar: "1-2 weeks",
    scalability: "medium",
    steps: [
      "Identify your teachable skill (academic subject, fitness, music, etc.)",
      "Set up a profile on Wyzant, Varsity Tutors, or Coach.me",
      "Offer a free intro session to get your first reviews"
    ],
    riskNote: "Scheduling can be demanding; burnout risk with too many clients.",
    requiredSkills: ["teaching"],
    minTime: 5,
    minBudget: 0,
    needsCamera: true,
    speedType: "fast"
  },
  {
    id: "ugc-content",
    title: "UGC Short-Form Content Creator",
    whyItFits: "Brands pay creators to make authentic-looking content for their products.",
    timeToFirstDollar: "2-4 weeks",
    scalability: "high",
    steps: [
      "Study top UGC examples on TikTok and Instagram Reels",
      "Create a portfolio with 3-5 sample videos (use products you own)",
      "Pitch brands directly via email or join UGC platforms like Billo"
    ],
    riskNote: "Saturated market; need to stand out with unique style.",
    requiredSkills: ["video"],
    minTime: 10,
    minBudget: 0,
    needsCamera: true,
    speedType: "balanced"
  },
  {
    id: "affiliate-seo",
    title: "Affiliate Content Site (SEO)",
    whyItFits: "Build a website that earns passive income from product recommendations.",
    timeToFirstDollar: "3-6 months",
    scalability: "high",
    steps: [
      "Pick a niche you know (tech gadgets, home fitness, pet products)",
      "Set up a WordPress site and write 20+ SEO-optimized articles",
      "Apply to affiliate programs (Amazon Associates, ShareASale)"
    ],
    riskNote: "Takes months to see results; Google algorithm changes are risky.",
    requiredSkills: ["writing"],
    minTime: 10,
    minBudget: 100,
    needsCamera: false,
    speedType: "scalable"
  },
  {
    id: "etsy-digital",
    title: "Etsy Digital Products",
    whyItFits: "Create once, sell forever with printables, templates, and digital downloads.",
    timeToFirstDollar: "2-4 weeks",
    scalability: "high",
    steps: [
      "Research top-selling digital products in your skill area",
      "Create 5-10 products using Canva (planners, invitations, wall art)",
      "Optimize listings with keywords and run Etsy ads to start"
    ],
    riskNote: "Competitive marketplace; need unique designs to stand out.",
    requiredSkills: ["design", "art"],
    minTime: 10,
    minBudget: 50,
    needsCamera: false,
    speedType: "balanced"
  },
  {
    id: "print-on-demand",
    title: "Print-on-Demand Store",
    whyItFits: "Sell custom t-shirts, mugs, and merch without holding inventory.",
    timeToFirstDollar: "1-2 months",
    scalability: "high",
    steps: [
      "Choose a niche with passionate buyers (dog lovers, nurses, gamers)",
      "Create 20+ designs using Canva or hire on Fiverr",
      "Set up shop on Printful + Etsy or your own Shopify store"
    ],
    riskNote: "Low margins (10-20%); need volume or premium pricing.",
    requiredSkills: ["design", "art"],
    minTime: 10,
    minBudget: 50,
    needsCamera: false,
    speedType: "scalable"
  },
  {
    id: "nocode-tools",
    title: "No-Code Micro Tools",
    whyItFits: "Build simple web tools or apps without coding using no-code platforms.",
    timeToFirstDollar: "1-3 months",
    scalability: "high",
    steps: [
      "Learn a no-code platform (Bubble, Glide, Softr)",
      "Identify a small problem to solve (calculator, directory, booking)",
      "Build MVP, validate with users, then monetize with ads or subscriptions"
    ],
    riskNote: "Learning curve is real; not truly 'no work' despite the name.",
    requiredSkills: [],
    minTime: 10,
    minBudget: 100,
    needsCamera: false,
    speedType: "scalable"
  },
  {
    id: "coding-freelance",
    title: "Freelance Developer / Contract Coding",
    whyItFits: "High-paying remote work building websites, apps, and software.",
    timeToFirstDollar: "1-4 weeks",
    scalability: "high",
    steps: [
      "Build a portfolio with 3-5 projects showcasing your skills",
      "Create profiles on Toptal, Gun.io, or Upwork",
      "Network in developer communities and ask for referrals"
    ],
    riskNote: "Feast-or-famine cycle; need to constantly market yourself.",
    requiredSkills: ["coding"],
    minTime: 20,
    minBudget: 0,
    needsCamera: false,
    speedType: "fast"
  }
];

function scorePath(path: IncomePath, answers: Answers): number {
  let score = 50;

  const timeMap: Record<TimePerWeek, number> = { "<5": 5, "5-10": 10, "10-20": 15, "20+": 25 };
  const userTime = answers.timePerWeek ? timeMap[answers.timePerWeek] : 10;
  if (userTime >= path.minTime) score += 15;
  else if (userTime >= path.minTime * 0.5) score += 5;
  else score -= 10;

  const budgetMap: Record<StartupBudget, number> = { "$0": 0, "<$100": 75, "$500+": 500 };
  const userBudget = answers.startupBudget ? budgetMap[answers.startupBudget] : 0;
  if (userBudget >= path.minBudget) score += 10;
  else score -= 15;

  if (path.needsCamera) {
    if (answers.cameraComfort === "yes") score += 10;
    else if (answers.cameraComfort === "maybe") score += 0;
    else score -= 20;
  } else {
    if (answers.cameraComfort === "no") score += 5;
  }

  if (answers.speedVsScale === path.speedType) score += 15;
  else if (answers.speedVsScale === "balanced") score += 5;

  const hasRequiredSkill = path.requiredSkills.length === 0 || 
    path.requiredSkills.some(skill => answers.skills.includes(skill));
  if (hasRequiredSkill) score += 20;
  else score -= 10;

  const skillLevelMap: Record<SkillLevel, number> = { none: 0, basic: 1, intermediate: 2, advanced: 3 };
  const userSkillLevel = answers.skillLevel ? skillLevelMap[answers.skillLevel] : 0;
  if (path.requiredSkills.length > 0 && userSkillLevel >= 1) score += 5 * userSkillLevel;

  const incomeMap: Record<IncomeGoal, number> = { "$500": 1, "$2000": 2, "$5000+": 3 };
  const userIncomeGoal = answers.incomeGoal ? incomeMap[answers.incomeGoal] : 1;
  const scalabilityMap: Record<string, number> = { low: 1, medium: 2, high: 3 };
  if (scalabilityMap[path.scalability] >= userIncomeGoal) score += 10;

  return Math.max(0, Math.min(100, score));
}

const QUESTIONS = [
  { key: "timePerWeek", title: "How many hours per week can you commit?", type: "single" },
  { key: "skillLevel", title: "What's your overall skill level?", type: "single" },
  { key: "skills", title: "Which skills do you have? (Select all that apply)", type: "multi" },
  { key: "incomeGoal", title: "What's your monthly income goal?", type: "single" },
  { key: "speedVsScale", title: "Do you want fast money or long-term scale?", type: "single" },
  { key: "cameraComfort", title: "Are you comfortable on camera?", type: "single" },
  { key: "startupBudget", title: "What's your startup budget?", type: "single" },
];

const OPTIONS: Record<string, { value: string; label: string }[]> = {
  timePerWeek: [
    { value: "<5", label: "Less than 5 hours" },
    { value: "5-10", label: "5-10 hours" },
    { value: "10-20", label: "10-20 hours" },
    { value: "20+", label: "20+ hours" },
  ],
  skillLevel: [
    { value: "none", label: "No experience" },
    { value: "basic", label: "Basic knowledge" },
    { value: "intermediate", label: "Intermediate" },
    { value: "advanced", label: "Advanced/Expert" },
  ],
  skills: [
    { value: "writing", label: "Writing" },
    { value: "design", label: "Design" },
    { value: "video", label: "Video" },
    { value: "sales", label: "Sales" },
    { value: "coding", label: "Coding" },
    { value: "fitness", label: "Fitness" },
    { value: "teaching", label: "Teaching" },
    { value: "admin", label: "Admin" },
    { value: "art", label: "Art" },
  ],
  incomeGoal: [
    { value: "$500", label: "$500/month" },
    { value: "$2000", label: "$2,000/month" },
    { value: "$5000+", label: "$5,000+/month" },
  ],
  speedVsScale: [
    { value: "fast", label: "Fast money (income ASAP)" },
    { value: "balanced", label: "Balanced approach" },
    { value: "scalable", label: "Long-term scale (passive income)" },
  ],
  cameraComfort: [
    { value: "no", label: "No, prefer off-camera" },
    { value: "maybe", label: "Maybe, if needed" },
    { value: "yes", label: "Yes, I'm comfortable" },
  ],
  startupBudget: [
    { value: "$0", label: "$0 (completely free)" },
    { value: "<$100", label: "Under $100" },
    { value: "$500+", label: "$500+" },
  ],
};

export default function MakeMoneyHomeFinderClient() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({
    timePerWeek: null,
    skillLevel: null,
    skills: [],
    incomeGoal: null,
    speedVsScale: null,
    cameraComfort: null,
    startupBudget: null,
  });
  const [showResults, setShowResults] = useState(false);
  const [rankedPaths, setRankedPaths] = useState<{ path: IncomePath; score: number }[]>([]);

  const currentQuestion = QUESTIONS[step];
  const isMulti = currentQuestion?.type === "multi";
  const options = OPTIONS[currentQuestion?.key];

  const canProceed = () => {
    if (!currentQuestion) return false;
    const key = currentQuestion.key as keyof Answers;
    if (isMulti) return (answers[key] as Skill[]).length > 0;
    return answers[key] !== null;
  };

  const handleSelect = (value: string) => {
    const key = currentQuestion.key as keyof Answers;
    if (isMulti) {
      const current = answers[key] as Skill[];
      const newValue = current.includes(value as Skill)
        ? current.filter(v => v !== value)
        : [...current, value as Skill];
      setAnswers({ ...answers, [key]: newValue });
    } else {
      setAnswers({ ...answers, [key]: value });
    }
  };

  const handleNext = () => {
    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      const scored = INCOME_PATHS.map(path => ({
        path,
        score: scorePath(path, answers)
      })).sort((a, b) => b.score - a.score);
      setRankedPaths(scored);
      setShowResults(true);
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleReset = () => {
    setStep(0);
    setAnswers({
      timePerWeek: null,
      skillLevel: null,
      skills: [],
      incomeGoal: null,
      speedVsScale: null,
      cameraComfort: null,
      startupBudget: null,
    });
    setShowResults(false);
    setRankedPaths([]);
  };

  const handleExport = () => {
    const top3 = rankedPaths.slice(0, 3);
    const honorable = rankedPaths.slice(3, 5);
    
    let content = "=== YOUR PERSONALIZED MAKE MONEY FROM HOME PLAN ===\n\n";
    content += "YOUR ANSWERS:\n";
    content += `- Time per week: ${answers.timePerWeek}\n`;
    content += `- Skill level: ${answers.skillLevel}\n`;
    content += `- Skills: ${answers.skills.join(", ") || "None selected"}\n`;
    content += `- Income goal: ${answers.incomeGoal}\n`;
    content += `- Preference: ${answers.speedVsScale}\n`;
    content += `- Camera comfort: ${answers.cameraComfort}\n`;
    content += `- Startup budget: ${answers.startupBudget}\n\n`;
    
    content += "=== TOP 3 RECOMMENDED PATHS ===\n\n";
    top3.forEach((item, i) => {
      content += `#${i + 1}: ${item.path.title} (Score: ${item.score}/100)\n`;
      content += `Why it fits: ${item.path.whyItFits}\n`;
      content += `Time to first $: ${item.path.timeToFirstDollar}\n`;
      content += `Scalability: ${item.path.scalability}\n`;
      content += `Steps:\n`;
      item.path.steps.forEach((s, j) => {
        content += `  ${j + 1}. ${s}\n`;
      });
      content += `Risk note: ${item.path.riskNote}\n\n`;
    });
    
    if (honorable.length > 0) {
      content += "=== HONORABLE MENTIONS ===\n";
      honorable.forEach(item => {
        content += `- ${item.path.title}: ${item.path.whyItFits}\n`;
      });
    }
    
    content += "\n\nGenerated by VCM Make Money Online From Home Finder";
    
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "my-money-making-plan.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (showResults) {
    const top3 = rankedPaths.slice(0, 3);
    const honorable = rankedPaths.slice(3, 5);

    return (
      <div className="space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full text-green-600 text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            Your Personalized Plan is Ready
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Top 3 Paths for You</h2>
          <p className="text-gray-600">Based on your answers, here are the most realistic ways to make money from home.</p>
        </div>

        <div className="grid gap-6">
          {top3.map((item, index) => (
            <div 
              key={item.path.id}
              className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white ${
                    index === 0 ? "bg-orange-500" : index === 1 ? "bg-gray-600" : "bg-amber-600"
                  }`}>
                    #{index + 1}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{item.path.title}</h3>
                    <p className="text-sm text-gray-600">{item.path.whyItFits}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-orange-600">{item.score}</div>
                  <div className="text-xs text-gray-500">match score</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">First $: <strong>{item.path.timeToFirstDollar}</strong></span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">Scalability: <strong className="capitalize">{item.path.scalability}</strong></span>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Starter Steps:</h4>
                <ol className="space-y-2">
                  {item.path.steps.map((s, i) => (
                    <li key={i} className="flex gap-2 text-sm text-gray-700">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-medium">
                        {i + 1}
                      </span>
                      {s}
                    </li>
                  ))}
                </ol>
              </div>

              <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800">{item.path.riskNote}</p>
              </div>
            </div>
          ))}
        </div>

        {honorable.length > 0 && (
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="font-semibold text-gray-900 mb-3">Honorable Mentions</h3>
            <div className="space-y-3">
              {honorable.map(item => (
                <div key={item.path.id} className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-gray-800">{item.path.title}</span>
                    <span className="text-gray-500 text-sm ml-2">— {item.path.whyItFits}</span>
                  </div>
                  <span className="text-sm text-gray-500">Score: {item.score}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-center gap-4">
          <button
            onClick={handleExport}
            data-track-output="true"
            className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export Plan
          </button>
          <button
            onClick={handleReset}
            className="px-6 py-3 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Start Over
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-600">Step {step + 1} of {QUESTIONS.length}</span>
          <span className="text-sm text-gray-400">{Math.round(((step + 1) / QUESTIONS.length) * 100)}% complete</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-orange-500 transition-all duration-300"
            style={{ width: `${((step + 1) / QUESTIONS.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900 mb-6">{currentQuestion.title}</h2>

        <div className={`grid gap-3 ${isMulti ? "grid-cols-3" : "grid-cols-1"}`}>
          {options.map(opt => {
            const key = currentQuestion.key as keyof Answers;
            const isSelected = isMulti 
              ? (answers[key] as Skill[]).includes(opt.value as Skill)
              : answers[key] === opt.value;

            return (
              <button
                key={opt.value}
                onClick={() => handleSelect(opt.value)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  isSelected
                    ? "border-orange-500 bg-orange-50 text-orange-700"
                    : "border-gray-200 hover:border-gray-300 text-gray-700"
                } ${isMulti ? "text-center text-sm" : ""}`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        <div className="flex justify-between mt-8">
          <button
            onClick={handleBack}
            disabled={step === 0}
            className="flex items-center gap-1 px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
          <button
            onClick={handleNext}
            disabled={!canProceed()}
            className="flex items-center gap-1 px-6 py-2 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {step === QUESTIONS.length - 1 ? "Get My Plan" : "Next"}
            {step < QUESTIONS.length - 1 && <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
