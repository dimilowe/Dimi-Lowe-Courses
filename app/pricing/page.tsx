"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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

type Plan = {
  id: "global";
  name: string;
  price: string;
  description: string;
  features: string[];
  badge?: string;
  gradient: string;
};

const GLOBAL_PLAN: Plan = {
  id: "global",
  name: "VCM Pro Save",
  price: "$11 / mo",
  badge: "Single plan",
  description: "One subscription for your whole account.",
  gradient: "from-emerald-500 to-teal-600",
  features: [
    "Save presets for tools",
    "Save outputs to Workspace",
    "Works across all clouds and tools",
    "Cancel anytime",
  ],
};

function PricingPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    fetch("/api/auth/session", {
      method: "GET",
      credentials: "include",
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
      setMessage({
        type: "success",
        text: "Subscription successful. Preset and Workspace saving are now unlocked.",
      });
    } else if (searchParams.get("canceled") === "1") {
      setMessage({ type: "error", text: "Checkout was canceled. You can try again anytime." });
    }
  }, [searchParams]);

  const buildLoginRedirect = () => {
    const redirectUrl = "/pricing";
    return `/login?next=${encodeURIComponent(redirectUrl)}`;
  };

  const handleSignIn = () => {
    setShowAuthModal(false);
    router.push(buildLoginRedirect());
  };

  const handleSubscribe = async () => {
    if (isLoggedIn === null) return;

    if (isLoggedIn === false) {
      setShowAuthModal(true);
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "global" }),
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
    } catch (error) {
      console.error("Checkout error:", error);
      const errorMessage = error instanceof Error ? error.message : "Something went wrong. Please try again.";
      setMessage({ type: "error", text: errorMessage });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-4xl mx-auto px-4 py-12 pb-32">
        {message && (
          <div
            className={`mb-8 p-4 rounded-xl flex items-center gap-3 ${
              message.type === "success"
                ? "bg-green-50 border border-green-200 text-green-800"
                : "bg-red-50 border border-red-200 text-red-800"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600" />
            )}
            <span className="font-medium">{message.text}</span>
          </div>
        )}

        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-zinc-900">Simple pricing. Clear value.</h1>
          <p className="mt-4 text-xl text-zinc-600 max-w-2xl mx-auto">
            Free users can use tools. Subscribers unlock saving.
          </p>
        </div>

        <section>
          <h2 className="text-2xl font-bold text-zinc-900 mb-6">Global subscription</h2>
          <div className="rounded-2xl p-6 bg-white border border-zinc-200 shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-semibold text-zinc-900">{GLOBAL_PLAN.name}</div>
                <div className="text-4xl font-bold mt-2 text-zinc-900">{GLOBAL_PLAN.price}</div>
              </div>
              {GLOBAL_PLAN.badge && (
                <span className={`text-xs font-semibold px-3 py-1 rounded-full bg-gradient-to-r ${GLOBAL_PLAN.gradient} text-white`}>
                  {GLOBAL_PLAN.badge}
                </span>
              )}
            </div>

            <p className="mt-3 text-sm text-zinc-600">{GLOBAL_PLAN.description}</p>

            <ul className="mt-5 space-y-2 text-sm text-zinc-700">
              {GLOBAL_PLAN.features.map((feature) => (
                <li key={feature} className="flex gap-2 items-center">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>

            <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${GLOBAL_PLAN.gradient}`} />
          </div>
        </section>
      </div>

      <div className="fixed bottom-0 inset-x-0 border-t border-zinc-200 bg-white/95 backdrop-blur-sm shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="text-sm text-zinc-700">
            <span className="font-medium">Selected:</span>{" "}
            <span className="text-emerald-700 font-semibold">{GLOBAL_PLAN.name}</span>
          </div>

          <button
            onClick={handleSubscribe}
            disabled={isLoading || isLoggedIn === null}
            className={`px-6 py-3 rounded-xl font-semibold transition flex items-center gap-2 ${
              !isLoading && isLoggedIn !== null
                ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:opacity-90 shadow-md"
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
            <DialogDescription>You must be signed in to start a subscription.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowAuthModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSignIn} className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-90">
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
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        </div>
      }
    >
      <PricingPageContent />
    </Suspense>
  );
}
