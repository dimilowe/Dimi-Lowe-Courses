"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Check, Loader2, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";

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
  name: "Dimi Lowe All Access",
  price: "$49 / mo",
  badge: "Single plan",
  description: "One subscription for every course, download, digital product, tool save feature, and workstation unlock.",
  gradient: "from-emerald-500 to-teal-600",
  features: [
    "Access every course on the site",
    "Access every paid digital product and download",
    "Open any tool output in Image, PDF, or Audio Workstations",
    "Build modular workstation layouts with drag-and-drop widgets",
    "Save presets for tools",
    "Save outputs to Workspace",
    "Export clean files without VCM watermark",
    "Works across all clouds and tools",
    "Cancel anytime",
  ],
};

const VALUE_STACK = [
  {
    title: "One payment unlocks the full library",
    detail:
      "Members can access every course, download, template, and digital product without buying each one separately.",
  },
  {
    title: "Keep learning without checkout friction",
    detail:
      "Open the next course or resource directly from your dashboard as new content gets added.",
  },
  {
    title: "Tools and workstations stay included",
    detail:
      "All-access also keeps the existing save features, clean exports, presets, and workspace storage.",
  },
];

const COMPARISON_ROWS = [
  { label: "Access all courses", free: "No", pro: "Yes" },
  { label: "Access all paid downloads/products", free: "No", pro: "Yes" },
  { label: "Use all tools", free: "Yes", pro: "Yes" },
  { label: "Use Image/PDF/Audio Workstations", free: "Yes", pro: "Yes" },
  { label: "Modular widget editing", free: "Yes", pro: "Yes" },
  { label: "Export with VCM watermark", free: "Yes", pro: "Yes" },
  { label: "Export clean (no watermark)", free: "No", pro: "Yes" },
  { label: "Save tool presets", free: "No", pro: "Yes" },
  { label: "Save outputs to Workspace", free: "No", pro: "Yes" },
  { label: "Access from any device after login", free: "Limited", pro: "Yes" },
  { label: "Monthly price", free: "$0", pro: "$49" },
];

const FAQS = [
  {
    q: "What does the membership include?",
    a: "All courses, paid downloads, digital products, clean exports, saved presets, and workspace saving are included while your subscription is active.",
  },
  {
    q: "What happens if I cancel?",
    a: "You can cancel anytime. Your plan will not renew, and free usage remains available.",
  },
  {
    q: "Do I still buy courses individually?",
    a: "No. The membership is designed to replace individual course and digital product purchases.",
  },
];

const PROOF_STATS = [
  { label: "Tools available today", value: "100+" },
  { label: "Workstation modes", value: "3" },
  { label: "Cost per day", value: "~$1.63" },
];

const TESTIMONIALS = [
  {
    quote:
      "It is easier to join once and use whatever course or resource I need that week.",
    role: "Creator member",
  },
  {
    quote:
      "The membership makes the library feel like a working toolkit instead of a store checkout.",
    role: "Freelancer",
  },
  {
    quote:
      "New content showing up inside the same membership is what makes it worth keeping.",
    role: "Weekly power user",
  },
];

function PricingPageContent() {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [checkoutEmail, setCheckoutEmail] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionChecking, setSessionChecking] = useState(false);
  const [copiedSessionId, setCopiedSessionId] = useState(false);

  useEffect(() => {
    const checkoutSessionId = searchParams.get("session_id");
    setSessionId(checkoutSessionId);

    if (searchParams.get("success") === "1") {
      setMessage({
        type: "success",
        text: "Subscription successful. Finish account setup to activate all-access content and member features.",
      });
    } else if (searchParams.get("canceled") === "1") {
      setMessage({ type: "error", text: "Checkout was canceled. You can try again anytime." });
    }

    if (searchParams.get("success") === "1" && checkoutSessionId) {
      setSessionChecking(true);
      fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: checkoutSessionId }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data?.email) {
            setCheckoutEmail(data.email);
          }
        })
        .catch(() => {
          setCheckoutEmail(null);
        })
        .finally(() => {
          setSessionChecking(false);
        });
    }
  }, [searchParams]);

  const handleSubscribe = async () => {
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

  const handleCopySessionId = async () => {
    if (!sessionId) return;
    try {
      await navigator.clipboard.writeText(sessionId);
      setCopiedSessionId(true);
      setTimeout(() => setCopiedSessionId(false), 1500);
    } catch (error) {
      console.error("Failed to copy session id:", error);
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

        {searchParams.get("success") === "1" && (
          <div className="mb-8 p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-900">
            <p className="font-semibold">Activate your subscription</p>
            <p className="text-sm mt-1">
              {sessionChecking
                ? "Confirming checkout details..."
                : checkoutEmail
                ? `Use this exact email to sign in or create your account: ${checkoutEmail}`
                : "Use the same email you entered in Stripe checkout when signing in or creating your account."}
            </p>
            {sessionId && (
              <div className="mt-3 space-y-3">
                <div className="flex items-start gap-2">
                  <p className="flex-1 text-xs font-mono break-all bg-white/60 border border-emerald-200 rounded-md px-2 py-1">
                    Checkout Session ID: {sessionId}
                  </p>
                  <button
                    type="button"
                    onClick={handleCopySessionId}
                    className="inline-flex items-center rounded-md border border-emerald-300 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors"
                  >
                    {copiedSessionId ? "Copied" : "Copy"}
                  </button>
                </div>
                <Link
                  href={`/dashboard?session_id=${encodeURIComponent(sessionId)}`}
                  className="inline-flex items-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
                >
                  Continue to Account Setup
                </Link>
              </div>
            )}
          </div>
        )}

        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-zinc-900">Simple pricing. Clear value.</h1>
          <p className="mt-4 text-xl text-zinc-600 max-w-2xl mx-auto">
            One $49/month membership unlocks the full content library plus clean exports, saving, presets, and workspace features.
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

        <section className="mt-10">
          <h3 className="text-2xl font-bold text-zinc-900 mb-4">Quick proof</h3>
          <div className="grid md:grid-cols-3 gap-4">
            {PROOF_STATS.map((item) => (
              <div key={item.label} className="rounded-xl bg-white border border-zinc-200 p-5">
                <p className="text-3xl font-bold text-zinc-900">{item.value}</p>
                <p className="text-sm text-zinc-600 mt-1">{item.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <h3 className="text-2xl font-bold text-zinc-900 mb-4">Why people upgrade</h3>
          <div className="grid md:grid-cols-3 gap-4">
            {VALUE_STACK.map((item) => (
              <div key={item.title} className="rounded-xl bg-white border border-zinc-200 p-4">
                <p className="font-semibold text-zinc-900">{item.title}</p>
                <p className="text-sm text-zinc-600 mt-2">{item.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <h3 className="text-2xl font-bold text-zinc-900 mb-4">Free vs All Access</h3>
          <div className="rounded-2xl bg-white border border-zinc-200 overflow-hidden">
            <div className="grid grid-cols-3 bg-zinc-100 text-sm font-semibold text-zinc-700">
              <div className="px-4 py-3">Feature</div>
              <div className="px-4 py-3 text-center">Free</div>
              <div className="px-4 py-3 text-center">All Access</div>
            </div>
            {COMPARISON_ROWS.map((row) => (
              <div key={row.label} className="grid grid-cols-3 border-t border-zinc-100 text-sm">
                <div className="px-4 py-3 text-zinc-700">{row.label}</div>
                <div className="px-4 py-3 text-center text-zinc-600">{row.free}</div>
                <div className="px-4 py-3 text-center font-semibold text-emerald-700">{row.pro}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <h3 className="text-2xl font-bold text-zinc-900 mb-4">Who this is for</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="rounded-xl bg-white border border-zinc-200 p-4">
              <p className="font-semibold text-zinc-900">Weekly creators</p>
              <p className="text-sm text-zinc-600 mt-2">You want courses, resources, and tools available whenever the next project comes up.</p>
            </div>
            <div className="rounded-xl bg-white border border-zinc-200 p-4">
              <p className="font-semibold text-zinc-900">Freelancers & agencies</p>
              <p className="text-sm text-zinc-600 mt-2">You want the full library plus clean, non-watermarked exports and reusable setup for client delivery.</p>
            </div>
            <div className="rounded-xl bg-white border border-zinc-200 p-4">
              <p className="font-semibold text-zinc-900">Skill builders</p>
              <p className="text-sm text-zinc-600 mt-2">You want to move through multiple courses and resources without separate purchases.</p>
            </div>
          </div>
        </section>

        <section className="mt-10">
          <h3 className="text-2xl font-bold text-zinc-900 mb-4">What users say</h3>
          <div className="grid md:grid-cols-3 gap-4">
            {TESTIMONIALS.map((item) => (
              <div key={item.quote} className="rounded-xl bg-white border border-zinc-200 p-4">
                <p className="text-sm text-zinc-700">&ldquo;{item.quote}&rdquo;</p>
                <p className="text-xs text-zinc-500 mt-3">{item.role}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
          <h3 className="text-2xl font-bold text-zinc-900">If you want more than one product, this pays for itself</h3>
          <p className="mt-2 text-zinc-700">
            Instead of buying courses and downloads one by one, members get the full content library for one monthly price.
          </p>
          <button
            onClick={handleSubscribe}
            disabled={isLoading}
            className={`mt-4 px-5 py-2.5 rounded-lg font-semibold transition ${
              !isLoading
                ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:opacity-90"
                : "bg-zinc-200 text-zinc-400 cursor-not-allowed"
            }`}
          >
            {isLoading ? "Redirecting..." : "Start All Access"}
          </button>
        </section>

        <section className="mt-10 pb-8">
          <h3 className="text-2xl font-bold text-zinc-900 mb-4">Questions before subscribing?</h3>
          <div className="space-y-3">
            {FAQS.map((item) => (
              <div key={item.q} className="rounded-xl bg-white border border-zinc-200 p-4">
                <p className="font-semibold text-zinc-900">{item.q}</p>
                <p className="text-sm text-zinc-600 mt-1">{item.a}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10 pb-8 rounded-2xl bg-zinc-900 text-white p-6">
          <h3 className="text-2xl font-bold">Start with one plan. Cancel anytime.</h3>
          <p className="text-zinc-300 mt-2">
            Get every current course and digital product, plus new eligible content added to the library while your membership is active.
          </p>
          <button
            onClick={handleSubscribe}
            disabled={isLoading}
            className={`mt-4 px-5 py-2.5 rounded-lg font-semibold transition ${
              !isLoading
                ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:opacity-90"
                : "bg-zinc-700 text-zinc-400 cursor-not-allowed"
            }`}
          >
            {isLoading ? "Redirecting..." : "Subscribe to All Access"}
          </button>
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
            disabled={isLoading}
            className={`px-6 py-3 rounded-xl font-semibold transition flex items-center gap-2 ${
              !isLoading
                ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:opacity-90 shadow-md"
                : "bg-zinc-200 text-zinc-400 cursor-not-allowed"
            }`}
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isLoading ? "Redirecting..." : "Subscribe"}
          </button>
        </div>
      </div>
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
