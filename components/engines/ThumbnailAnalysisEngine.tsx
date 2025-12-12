"use client";

import { EngineComponentProps } from "@/lib/engineRegistry";
import { useUIStore } from "@/lib/state/uiStore";
import ThumbnailCoachClient from "@/app/tools/ai-thumbnail-coach/ThumbnailCoachClient";
import { Lock, Sparkles } from "lucide-react";

const VARIANT_CONFIG = {
  youtube: {
    title: "AI YouTube Thumbnail Coach",
    heroBadge: "Free AI-Powered Thumbnail Analyzer",
    heroCopy:
      "Upload your thumbnail and get instant AI analysis with actionable feedback. Then chat with your AI coach for deeper optimization help.",
  },
  instagram: {
    title: "AI Instagram Thumbnail Analyzer",
    heroBadge: "Free AI Instagram Thumbnail Analyzer",
    heroCopy:
      "Upload your Instagram post or Reel cover and get instant AI feedback for scroll-stopping performance.",
  },
  tiktok: {
    title: "AI TikTok Thumbnail Analyzer",
    heroBadge: "Free AI TikTok Thumbnail Analyzer",
    heroCopy:
      "Optimize your TikTok covers for maximum thumb-stopping power on the For You page.",
  },
  twitter: {
    title: "AI Twitter/X Thumbnail Analyzer",
    heroBadge: "Free AI X Thumbnail Analyzer",
    heroCopy:
      "Analyze card images and promo graphics for maximum feed visibility on X.",
  },
  facebook: {
    title: "AI Facebook Thumbnail Analyzer",
    heroBadge: "Free AI Facebook Thumbnail Analyzer",
    heroCopy:
      "Optimize Facebook video and post thumbnails for higher engagement.",
  },
  linkedin: {
    title: "AI LinkedIn Thumbnail Analyzer",
    heroBadge: "Free AI LinkedIn Thumbnail Analyzer",
    heroCopy:
      "Make LinkedIn carousel and video thumbnails stand out in the feed.",
  },
  pinterest: {
    title: "AI Pinterest Pin Analyzer",
    heroBadge: "Free AI Pinterest Pin Analyzer",
    heroCopy:
      "Analyze your pin creatives for saves, clicks, and outbound traffic.",
  },
} as const;

type VariantKey = keyof typeof VARIANT_CONFIG;

const exampleAnalyses = [
  {
    title: "Gaming Channel Thumbnail",
    grade: "B+",
    avgScore: 78,
    verdict: "Strong subject focus but text could be larger for mobile viewing.",
    strengths: ["Clear subject", "Good color contrast", "Expressive face"],
    improvements: ["Increase text size 20%", "Add subtle shadow behind text"],
  },
  {
    title: "Tutorial Video Thumbnail",
    grade: "A-",
    avgScore: 85,
    verdict: "Excellent clarity and composition. Minor improvements possible.",
    strengths: ["Very readable text", "Clean composition", "Strong intrigue"],
    improvements: ["Add more emotion", "Consider bolder color scheme"],
  },
  {
    title: "Vlog Thumbnail",
    grade: "C+",
    avgScore: 62,
    verdict: "Background is too busy and competes with the subject.",
    strengths: ["Good facial expression", "Interesting concept"],
    improvements: ["Simplify background", "Add text overlay", "Increase contrast"],
  },
];

const features = [
  { name: "Thumbnail Clarity Score", description: "Measures if your message is instantly clear in 1 second" },
  { name: "Text Readability Analysis", description: "Tests if text is readable at mobile YouTube sizes" },
  { name: "Mobile Preview Testing", description: "Evaluates how your thumbnail appears on small screens" },
  { name: "CTR Prediction Insights", description: "AI-powered analysis of click-through potential" },
  { name: "Detailed Coaching Feedback", description: "Specific, actionable suggestions for improvement" },
  { name: "Emotion & Intrigue Scoring", description: "Measures the emotional impact and curiosity factor" },
  { name: "Composition Analysis", description: "Evaluates layout, balance, and visual hierarchy" },
  { name: "AI Chat Consultant", description: "Ask follow-up questions and get personalized advice" },
];

const faqs = [
  {
    q: "What is the ideal thumbnail size?",
    a: "For YouTube, the ideal thumbnail size is 1280 x 720 pixels with a 16:9 aspect ratio. Our analyzer works with any common image format up to 5MB.",
  },
  {
    q: "Does my thumbnail affect performance?",
    a: "Yes. Platforms heavily weigh click-through rate (CTR). A strong thumbnail that earns more clicks gets shown to more viewers.",
  },
  {
    q: "How can I increase CTR?",
    a: "Use high-contrast colors, make text readable on mobile, include expressive faces when possible, create a curiosity gap, and test multiple variations.",
  },
  {
    q: "How much text should be on a thumbnail?",
    a: "Keep it to 3-5 words max. Text should complement your title, not repeat it. Use large, bold fonts that remain readable at very small sizes.",
  },
  {
    q: "Can AI analyze my thumbnail?",
    a: "Yes. This tool uses AI vision to score clarity, intrigue, emotion, contrast, readability, and composition, plus it gives specific suggestions.",
  },
  {
    q: "Why is my thumbnail blurry?",
    a: "Usually from low resolution, heavy compression, or re-saving JPEGs. Always upload at 1280x720+ and use PNG for graphics-heavy designs.",
  },
];

export default function ThumbnailAnalysisEngine({ tool, canUsePro, entitlementsLoading }: EngineComponentProps) {
  const variant = (tool?.preset as VariantKey | undefined) ?? "youtube";
  const cfg = VARIANT_CONFIG[variant] ?? VARIANT_CONFIG.youtube;
  const { openUpgradeModal, openAuthModal } = useUIStore();

  const title = tool?.name || cfg.title;
  const description = tool?.description || cfg.heroCopy;

  const isLocked = !canUsePro && !entitlementsLoading;

  const handleUpgradeClick = () => {
    if (canUsePro === undefined) {
      openAuthModal();
    } else {
      openUpgradeModal("heavyTools", "pro");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-full text-orange-600 text-sm font-medium mb-6">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            {cfg.heroBadge}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {title}
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {description}
          </p>
        </div>

        {isLocked ? (
          <div className="max-w-xl mx-auto">
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200 rounded-2xl p-8 text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Lock className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                AI Analysis is Pro-Only
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Upgrade to Pro to unlock AI-powered thumbnail analysis with detailed scoring, 
                actionable feedback, and chat-based coaching.
              </p>
              <button
                onClick={handleUpgradeClick}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-amber-600 transition-all shadow-lg shadow-orange-500/25"
              >
                <Sparkles className="w-5 h-5" />
                Upgrade to Pro
              </button>
              <p className="text-sm text-gray-500 mt-4">
                Preview the interface below to see what you get
              </p>
            </div>

            <div className="mt-8 opacity-50 pointer-events-none select-none">
              <ThumbnailCoachClient />
            </div>
          </div>
        ) : (
          <ThumbnailCoachClient />
        )}

        <section className="mt-20 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            The Free Thumbnail Analyzer That Actually Helps
          </h2>
          <div className="prose prose-lg text-gray-700 space-y-4">
            <p>
              Stop guessing whether your thumbnail will perform. Our free{" "}
              <strong>AI thumbnail analyzer</strong> gives you instant, actionable feedback on clarity, composition,
              text readability, and emotional impact—so you can optimize for maximum click-through rate (CTR).
            </p>
            <p>
              Unlike basic template generators, this <strong>thumbnail checker</strong> analyzes your actual design and
              tells you exactly what&apos;s working and what needs improvement. You get six metric scores plus
              concrete suggestions you can implement right away.
            </p>
            <p>
              Platforms reward high CTR with more impressions. A compelling, mobile-readable, emotionally engaging
              thumbnail can easily double your views. Use this{" "}
              <strong>free thumbnail analysis</strong> tool before publishing so every video gets its best chance to win.
            </p>
          </div>
        </section>

        <section className="mt-20">
          <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">
            See How the Thumbnail Analyzer Works
          </h2>
          <p className="text-gray-600 text-center mb-10 max-w-2xl mx-auto">
            Here&apos;s the kind of feedback you can expect: scores, grades, and specific suggestions for improving
            your thumbnails.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {exampleAnalyses.map((example, i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="aspect-video bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center overflow-hidden">
                  <div className="text-gray-400 text-sm">Example Thumbnail</div>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">{example.title}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-orange-600">
                        {example.grade}
                      </span>
                      <span className="text-sm text-gray-500">
                        ({example.avgScore}/100)
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{example.verdict}</p>
                  <div className="space-y-2">
                    <div>
                      <span className="text-xs font-semibold text-green-600 uppercase">
                        Strengths:
                      </span>
                      <ul className="text-xs text-gray-600 mt-1">
                        {example.strengths.map((s, j) => (
                          <li key={j} className="flex items-center gap-1">
                            <span className="text-green-500">✓</span> {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-orange-600 uppercase">
                        Improve:
                      </span>
                      <ul className="text-xs text-gray-600 mt-1">
                        {example.improvements.map((s, j) => (
                          <li key={j} className="flex items-center gap-1">
                            <span className="text-orange-500">→</span> {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-20">
          <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">
            Free Features Included in This Thumbnail Analyzer
          </h2>
          <p className="text-gray-600 text-center mb-10 max-w-2xl mx-auto">
            Everything you need to create high-CTR thumbnails, completely free.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((feature, i) => (
              <div
                key={i}
                className="bg-white rounded-xl p-5 border border-gray-200 hover:border-orange-400 hover:shadow-md transition-all"
              >
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mb-3">
                  <svg
                    className="w-5 h-5 text-orange-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  {feature.name}
                </h3>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-20 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Thumbnail Optimization FAQ
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <details
                key={i}
                className="group bg-white rounded-xl border border-gray-200 overflow-hidden"
              >
                <summary className="flex items-center justify-between cursor-pointer px-6 py-4 font-semibold text-gray-900 hover:bg-gray-50">
                  {faq.q}
                  <svg
                    className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </summary>
                <div className="px-6 pb-4 text-gray-700">{faq.a}</div>
              </details>
            ))}
          </div>
        </section>

        <div className="mt-16 text-center">
          <p className="text-sm text-gray-500">
            Powered by advanced AI vision analysis. Your thumbnails are not stored.
          </p>
        </div>
      </div>
    </div>
  );
}
