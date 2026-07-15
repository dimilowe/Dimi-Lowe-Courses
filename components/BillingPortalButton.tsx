"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function BillingPortalButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const openBillingPortal = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/billing/portal", {
        method: "POST",
        credentials: "include",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to open subscription management.");
      }
      if (!data.url) {
        throw new Error("Stripe did not return a billing portal URL.");
      }

      window.location.assign(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant="outline"
        className="w-full border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
        disabled={loading}
        onClick={openBillingPortal}
      >
        {loading ? "Opening Subscription Management..." : "Manage or Cancel Subscription"}
      </Button>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <p className="text-xs text-muted-foreground">
        You will be taken securely to Stripe to cancel your plan, update your payment method, or view billing history.
      </p>
    </div>
  );
}
