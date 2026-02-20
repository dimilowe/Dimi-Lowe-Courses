"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AuthModal } from "@/components/auth-modal";
import { useRouter } from "next/navigation";

interface Product {
  id: string;
  slug: string;
  name: string;
  type: string;
  price_type: string;
  price: number;
  stripe_price_id: string;
  external_url?: string | null;
}

interface OrderBumpOffer {
  id: string;
  name: string;
  price: number;
  headline?: string;
  description?: string;
  cta_label?: string;
}

interface ClaimButtonProps {
  product: Product;
  orderBump?: OrderBumpOffer | null;
}

export function ClaimButton({ product, orderBump = null }: ClaimButtonProps) {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [includeOrderBump, setIncludeOrderBump] = useState(false);
  const router = useRouter();

  const isFree = product.price_type === "free";
  const hasExternalUrl = product.external_url && product.external_url.trim() !== "";
  const canOpenExternalDirectly = product.type === "app" && hasExternalUrl;
  const productPriceCents = Number(product.price || 0);
  const orderBumpPriceCents = Number(orderBump?.price || 0);
  const showOrderBump = Boolean(orderBump) && orderBumpPriceCents > 0 && !isFree && !canOpenExternalDirectly;
  const totalCents = productPriceCents + (showOrderBump && includeOrderBump ? orderBumpPriceCents : 0);

  const handleClick = async () => {
    // If it's an app with an external URL, redirect there
    if (canOpenExternalDirectly && product.external_url) {
      window.open(product.external_url, '_blank');
      return;
    }
    
    if (isFree) {
      setShowAuthModal(true);
    } else {
      setLoading(true);
      try {
        const payload: Record<string, string> = { productId: product.id };
        if (showOrderBump && includeOrderBump && orderBump) {
          payload.orderBumpProductId = orderBump.id;
        }

        const response = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || "Failed to start checkout");
        }

        if (data.url) {
          window.location.href = data.url;
        } else {
          throw new Error("No checkout URL returned");
        }
      } catch (error) {
        console.error("Checkout error:", error);
        alert(error instanceof Error ? error.message : "Checkout failed");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleAuthSuccess = async (userId: string) => {
    try {
      const response = await fetch("/api/claim-free", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, userId }),
      });

      if (response.ok) {
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Claim error:", error);
    }
  };

  return (
    <>
      {showOrderBump && orderBump && (
        <label className="flex items-start gap-3 rounded-lg border border-orange-200 bg-orange-50/60 p-3 cursor-pointer">
          <input
            type="checkbox"
            checked={includeOrderBump}
            onChange={(e) => setIncludeOrderBump(e.target.checked)}
            className="mt-1 h-4 w-4 accent-orange-500"
          />
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {orderBump.headline || `Add ${orderBump.name} for $${(orderBumpPriceCents / 100).toFixed(2)}`}
            </p>
            <p className="text-xs text-gray-700 mt-1">
              {orderBump.cta_label || "Add this to my order"}
            </p>
            {orderBump.description && (
              <p className="text-xs text-gray-600 mt-1 line-clamp-2">{orderBump.description}</p>
            )}
          </div>
        </label>
      )}
      <Button
        size="lg"
        className={`w-full ${canOpenExternalDirectly || !isFree ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-gray-900 font-semibold' : ''}`}
        onClick={handleClick}
        disabled={loading}
      >
        {loading
          ? "Processing..."
          : canOpenExternalDirectly
            ? "Check It Out"
            : isFree
              ? "Get it Free"
              : showOrderBump && includeOrderBump
                ? `Buy Now - $${(totalCents / 100).toFixed(2)}`
                : "Buy Now"}
      </Button>

      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleAuthSuccess}
        />
      )}
    </>
  );
}
