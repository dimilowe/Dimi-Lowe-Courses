"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CLOUDS, type CloudConfig } from "@/lib/clouds";
import { CLOUD_THEMES, type CloudId } from "@/lib/cloudTheme";
import { Check, Loader2, CheckCircle, XCircle, LogIn } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Tier = {
  id: "starter" | "basic" | "pro" | "global_pro";
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
  {
    id: "global_pro",
    name: "Global Pro",
    price: "$195 / mo",
    badge: "All clouds",
    description: "Pro access to every cloud. One subscription.",
    gradient: "from-indigo-500 to-purple-600",
    features: [
      "Pro tier on all 10 clouds",
      "Full AI tools everywhere",
      "Maximum limits",
      "Priority processing",
      "Best value for power users",
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

function PricingPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [tier, setTier] = useState<string | null>(null);
  const [cloud, setCloud] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const isGlobalPro = tier === "global_pro";
  const ready = isGlobalPro || (tier && cloud);

  useEffect(() => {
    fetch('/api/auth/session', {
      method: 'GET',
      credentials: 'include',
    })
      .then((res) => {
        if (!res.ok) {
          setIsLoggedIn(false);
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data) {
          setIsLoggedIn(data.isLoggedIn === true);
        }
      })
      .catch(() => {
        setIsLoggedIn(false);
      });
  }, []);

  useEffect(() => {
    if (searchParams.get("success") === "1") {
      setMessage({ type: "success", text: "Subscription successful! Your cloud is now active." });
    } else if (searchParams.get("canceled") === "1") {
      setMessage({ type: "error", text: "Checkout was canceled. You can try again when ready." });
    }
    
    const planParam = searchParams.get("plan");
    const cloudParam = searchParams.get("cloud");
    if (planParam && TIERS.some(t => t.id === planParam)) {
      setTier(planParam);
    }
    if (cloudParam && CLOUDS.some(c => c.slug === cloudParam)) {
      setCloud(cloudParam);
    }
  }, [searchParams]);

  const buildLoginRedirect = () => {
    let redirectUrl = "/pricing";
    const params = new URLSearchParams();
    if (tier) params.set("plan", tier);
    if (cloud && !isGlobalPro) params.set("cloud", cloud);
    if (params.toString()) {
      redirectUrl += "?" + params.toString();
    }
    return `/login?next=${encodeURIComponent(redirectUrl)}`;
  };

  const handleSignIn = () => {
    setShowAuthModal(false);
    router.push(buildLoginRedirect());
  };

  const handleSubscribe = async () => {
    if (!ready) return;

    if (isLoggedIn === null) {
      return;
    }

    if (isLoggedIn === false) {
      setShowAuthModal(true);
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      let body: Record<string, string>;
      
      if (isGlobalPro) {
        body = { type: "global" };
      } else {
        const cloudId = cloud!.replace(/_/g, "-");
        body = { type: "cloud", cloudId, tier: tier! };
      }
      
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error: any) {
      console.error("Checkout error:", error);
      const errorMessage = error instanceof Error ? error.message : "Something went wrong. Please try again.";
      setMessage({ 
        type: "error", 
        text: errorMessage 
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-6xl mx-auto px-4 py-12 pb-32">
        {message && (
          <div className={`mb-8 p-4 rounded-xl flex items-center gap-3 ${
            message.type === "success" 
              ? "bg-green-50 border border-green-200 text-green-800"
              : "bg-red-50 border border-red-200 text-red-800"
          }`}>
            {message.type === "success" ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600" />
            )}
            <span className="font-medium">{message.text}</span>
          </div>
        )}

        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-zinc-900">
            Simple pricing. Real power.
          </h1>
          <p className="mt-4 text-xl text-zinc-600 max-w-2xl mx-auto">
            All tools work free. Plans remove limits, unlock memory, workflows, and AI.
          </p>
        </div>

        <section>
          <h2 className="text-2xl font-bold text-zinc-900 mb-6">
            Choose a plan
          </h2>
          <div className="grid md:grid-cols-4 gap-4">
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

        {!isGlobalPro && (
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
        )}
      </div>

      <div className="fixed bottom-0 inset-x-0 border-t border-zinc-200 bg-white/95 backdrop-blur-sm shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="text-sm text-zinc-700">
            <span className="font-medium">Selected:</span>{" "}
            <span className={tier ? "text-purple-600 font-semibold" : "text-zinc-400"}>
              {tier ? TIERS.find(t => t.id === tier)?.name : "No plan"}
            </span>
            {" • "}
            <span className={isGlobalPro || cloud ? "text-purple-600 font-semibold" : "text-zinc-400"}>
              {isGlobalPro ? "All Clouds" : (cloud ? CLOUDS.find(c => c.slug === cloud)?.name.replace("VCM ", "").replace(" Cloud", "") : "No cloud")}
            </span>
          </div>

          <button
            onClick={handleSubscribe}
            disabled={!ready || isLoading || isLoggedIn === null}
            className={`px-6 py-3 rounded-xl font-semibold transition flex items-center gap-2 ${
              ready && !isLoading && isLoggedIn !== null
                ? "bg-gradient-to-r from-purple-500 to-violet-600 text-white hover:opacity-90 shadow-md"
                : "bg-zinc-200 text-zinc-400 cursor-not-allowed"
            }`}
          >
            {(isLoading || isLoggedIn === null) && <Loader2 className="w-4 h-4 animate-spin" />}
            {isLoading ? "Redirecting..." : isLoggedIn === null ? "Loading..." : "Subscribe"}
          </button>
        </div>
      </div>

      <Dialog open={showAuthModal} onOpenChange={setShowAuthModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LogIn className="w-5 h-5" />
              Sign in required
            </DialogTitle>
            <DialogDescription>
              You must be signed in to start a subscription.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowAuthModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSignIn} className="bg-gradient-to-r from-purple-500 to-violet-600 hover:opacity-90">
              Sign in
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    }>
      <PricingPageContent />
    </Suspense>
  );
}
