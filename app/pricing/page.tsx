"use client";

import { useState } from "react";
import Link from "next/link";
import { CLOUDS, type CloudConfig } from "@/lib/clouds";
import { CLOUD_THEMES, type CloudId } from "@/lib/cloudTheme";
import { Check } from "lucide-react";

type Tier = {
  id: "starter" | "basic" | "pro";
  name: string;
  price: string;
  description: string;
  features: string[];
  badge?: string;
  gradient: string;
};

const TIERS: Tier[] = [
  {
    id: "starter",
    name: "Starter",
    price: "$9.99 / mo",
    badge: "Best entry",
    description: "Remove friction. Export. Save progress.",
    gradient: "from-zinc-500 to-zinc-600",
    features: [
      "Exports unlocked",
      "No watermark",
      "Limited memory",
      "Limited workflows",
      "Basic heavy tools",
      "No AI",
    ],
  },
  {
    id: "basic",
    name: "Basic",
    price: "$29 / mo",
    badge: "For serious creators",
    description: "Power tools and higher limits.",
    gradient: "from-purple-500 to-violet-600",
    features: [
      "Full memory",
      "Heavier tools",
      "Chained workflows",
      "High usage limits",
      "No AI",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "$59 / mo",
    badge: "Full sauce",
    description: "Everything unlocked, including AI.",
    gradient: "from-orange-500 to-amber-500",
    features: [
      "Everything in Basic",
      "Full AI tools",
      "Advanced AI workflows",
      "Priority processing",
    ],
  },
];

function getCloudGradient(slug: string): string {
  const cloudId = slug.replace(/_/g, "-") as CloudId;
  const theme = CLOUD_THEMES[cloudId];
  return theme?.heroBg || "from-purple-500 to-violet-600";
}

function getCloudIcon(slug: string) {
  const cloudId = slug.replace(/_/g, "-") as CloudId;
  const theme = CLOUD_THEMES[cloudId];
  return theme?.icon;
}

export default function PricingPage() {
  const [tier, setTier] = useState<string | null>(null);
  const [cloud, setCloud] = useState<string | null>(null);

  const ready = tier && cloud;

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-6xl mx-auto px-4 py-12 pb-32">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-zinc-900">
            Simple pricing. Real power.
          </h1>
          <p className="mt-4 text-xl text-zinc-600 max-w-2xl mx-auto">
            All tools work free. Plans remove limits, unlock memory, workflows, and AI.
          </p>
        </div>

        {/* Tiers */}
        <section>
          <h2 className="text-2xl font-bold text-zinc-900 mb-6">
            Choose a plan
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {TIERS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTier(t.id)}
                className={`text-left rounded-2xl p-6 bg-white transition relative overflow-hidden ${
                  tier === t.id
                    ? "ring-2 ring-purple-500 shadow-lg"
                    : "border border-zinc-200 hover:shadow-md"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold text-zinc-900">{t.name}</div>
                    <div className="text-3xl font-bold mt-2 text-zinc-900">{t.price}</div>
                  </div>
                  {t.badge && (
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full bg-gradient-to-r ${t.gradient} text-white`}>
                      {t.badge}
                    </span>
                  )}
                </div>

                <p className="mt-3 text-sm text-zinc-600">{t.description}</p>

                <ul className="mt-4 space-y-2 text-sm text-zinc-700">
                  {t.features.map((f, i) => (
                    <li key={i} className="flex gap-2 items-center">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                {tier === t.id && (
                  <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${t.gradient}`} />
                )}
              </button>
            ))}
          </div>
        </section>

        {/* Clouds */}
        <section className="mt-14">
          <h2 className="text-2xl font-bold text-zinc-900 mb-6">
            Choose a cloud
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {CLOUDS.map((c) => {
              const gradient = getCloudGradient(c.slug);
              const IconComponent = getCloudIcon(c.slug);
              const isSelected = cloud === c.slug;
              
              return (
                <button
                  key={c.slug}
                  onClick={() => setCloud(c.slug)}
                  className={`text-left rounded-2xl p-4 bg-white transition relative overflow-hidden ${
                    isSelected
                      ? "ring-2 ring-purple-500 shadow-lg"
                      : "border border-zinc-200 hover:shadow-md"
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-3 shadow-md`}>
                    {IconComponent && <IconComponent className="w-6 h-6 text-white" />}
                  </div>
                  <div className="font-semibold text-zinc-900 text-sm">{c.name.replace("VCM ", "").replace(" Cloud", "")}</div>
                  <p className="mt-1 text-xs text-zinc-500 line-clamp-2">{c.shortDescription}</p>
                  
                  {isSelected && (
                    <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient}`} />
                  )}
                </button>
              );
            })}
          </div>
        </section>
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 inset-x-0 border-t border-zinc-200 bg-white/95 backdrop-blur-sm shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="text-sm text-zinc-700">
            <span className="font-medium">Selected:</span>{" "}
            <span className={tier ? "text-purple-600 font-semibold" : "text-zinc-400"}>
              {tier ? TIERS.find(t => t.id === tier)?.name : "No plan"}
            </span>
            {" • "}
            <span className={cloud ? "text-purple-600 font-semibold" : "text-zinc-400"}>
              {cloud ? CLOUDS.find(c => c.slug === cloud)?.name.replace("VCM ", "").replace(" Cloud", "") : "No cloud"}
            </span>
          </div>

          <Link
            href={
              ready
                ? `/subscribe?tier=${tier}&cloud=${cloud}`
                : "#"
            }
            className={`px-6 py-3 rounded-xl font-semibold transition ${
              ready
                ? "bg-gradient-to-r from-purple-500 to-violet-600 text-white hover:opacity-90 shadow-md"
                : "bg-zinc-200 text-zinc-400 pointer-events-none"
            }`}
          >
            Subscribe
          </Link>
        </div>
      </div>
    </div>
  );
}
