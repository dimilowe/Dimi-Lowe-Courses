"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type OfferProduct = {
  id: string;
  slug: string;
  name: string;
  description: string;
  headline?: string;
  cta_label?: string;
  thumbnail_url: string | null;
  price: number;
};

type OfferResponse = {
  offers: {
    sourceProduct: { id: string; slug: string; name: string };
    upsell: OfferProduct | null;
    downsell: OfferProduct | null;
  } | null;
};

type Stage = "loading" | "upsell" | "downsell" | "error";

interface OfferFlowClientProps {
  sessionId?: string;
}

export function OfferFlowClient({ sessionId }: OfferFlowClientProps) {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("loading");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offers, setOffers] = useState<OfferResponse["offers"]>(null);

  const activeOffer = useMemo(() => {
    if (!offers) return null;
    if (stage === "upsell") return offers.upsell;
    if (stage === "downsell") return offers.downsell;
    return null;
  }, [offers, stage]);

  const goToDashboard = () => {
    const qp = new URLSearchParams();
    qp.set("success", "true");
    if (sessionId) qp.set("session_id", sessionId);
    router.replace(`/dashboard?${qp.toString()}`);
  };

  useEffect(() => {
    if (!sessionId) {
      router.replace("/dashboard");
      return;
    }

    let cancelled = false;

    const loadOffers = async () => {
      try {
        const response = await fetch("/api/offers/resolve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
        const data = (await response.json()) as OfferResponse | { error?: string };
        if (!response.ok) {
          throw new Error((data as { error?: string }).error || "Failed to load offers");
        }
        if (cancelled) return;

        const resolved = (data as OfferResponse).offers;
        setOffers(resolved);

        if (resolved?.upsell) {
          setStage("upsell");
          return;
        }
        if (resolved?.downsell) {
          setStage("downsell");
          return;
        }
        goToDashboard();
      } catch (err) {
        if (cancelled) return;
        setStage("error");
        setError(err instanceof Error ? err.message : "Failed to load offers");
      }
    };

    void loadOffers();

    return () => {
      cancelled = true;
    };
  }, [router, sessionId]);

  const handleAcceptOffer = async () => {
    if (!activeOffer) return;
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: activeOffer.id }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Failed to start checkout");
      }
      if (!data.url) {
        throw new Error("No checkout URL returned");
      }
      window.location.href = data.url as string;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start checkout");
      setIsSubmitting(false);
    }
  };

  const handleDecline = () => {
    if (!offers) {
      goToDashboard();
      return;
    }

    if (stage === "upsell" && offers.downsell) {
      setStage("downsell");
      return;
    }

    goToDashboard();
  };

  if (stage === "loading") {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-3xl font-bold text-gray-900">Final Step</h1>
          <p className="text-gray-600 mt-3">Loading your special offer...</p>
        </div>
      </div>
    );
  }

  if (stage === "error" || !activeOffer) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Card className="max-w-2xl mx-auto p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Offer unavailable</h1>
          <p className="text-sm text-red-600 mb-6">{error || "We couldn't load your offer."}</p>
          <Button onClick={goToDashboard} className="bg-orange-500 hover:bg-orange-600 text-black">
            Continue to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  const headline =
    activeOffer.headline ||
    (stage === "upsell" ? `Wait! Add ${activeOffer.name}` : `One last option: ${activeOffer.name}`);
  const ctaLabel = activeOffer.cta_label || "Yes, add this";
  const declineLabel = stage === "upsell" && offers?.downsell ? "No thanks, show a lower-cost option" : "No thanks";

  return (
    <div className="container mx-auto px-4 py-12">
      <Card className="max-w-3xl mx-auto overflow-hidden border-orange-200">
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4">
          <p className="text-xs font-semibold tracking-wide text-black/80 uppercase">
            {stage === "upsell" ? "Special Upsell Offer" : "Downsell Offer"}
          </p>
          <h1 className="text-2xl font-bold text-black mt-1">{headline}</h1>
        </div>

        <div className="p-6 space-y-5">
          {activeOffer.thumbnail_url && (
            <div className="rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
              <img
                src={activeOffer.thumbnail_url}
                alt={activeOffer.name}
                className="w-full max-h-80 object-contain mx-auto"
              />
            </div>
          )}

          <div>
            <h2 className="text-xl font-semibold text-gray-900">{activeOffer.name}</h2>
            {activeOffer.description && (
              <p className="text-gray-600 mt-2 whitespace-pre-line">{activeOffer.description}</p>
            )}
          </div>

          <div className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-3">
            <p className="text-sm text-gray-700">Add this to your purchase now:</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              ${(activeOffer.price / 100).toFixed(2)}
            </p>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="grid gap-3 md:grid-cols-2">
            <Button
              onClick={() => void handleAcceptOffer()}
              disabled={isSubmitting}
              className="bg-orange-500 hover:bg-orange-600 text-black font-semibold"
            >
              {isSubmitting ? "Processing..." : ctaLabel}
            </Button>
            <Button variant="outline" onClick={handleDecline} disabled={isSubmitting}>
              {declineLabel}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

