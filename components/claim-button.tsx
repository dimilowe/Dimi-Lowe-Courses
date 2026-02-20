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

interface ClaimButtonProps {
  product: Product;
}

export function ClaimButton({ product }: ClaimButtonProps) {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const isFree = product.price_type === "free";
  const hasExternalUrl = product.external_url && product.external_url.trim() !== "";
  const canOpenExternalDirectly = product.type === "app" && hasExternalUrl;

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
        const response = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: product.id }),
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
      <Button
        size="lg"
        className={`w-full ${canOpenExternalDirectly || !isFree ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-gray-900 font-semibold' : ''}`}
        onClick={handleClick}
        disabled={loading}
      >
        {loading ? "Processing..." : canOpenExternalDirectly ? "Check It Out" : isFree ? "Get it Free" : "Buy Now"}
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
