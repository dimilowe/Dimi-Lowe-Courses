"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function ClerkAuthComplete({
  next,
  claimProductId,
}: {
  next: string;
  claimProductId: string | null;
}) {
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function completeSignIn() {
      try {
        const syncResponse = await fetch("/api/auth/sync", {
          method: "POST",
          credentials: "include",
        });
        const syncData = await syncResponse.json();
        if (!syncResponse.ok) {
          throw new Error(syncData.error || "Could not finish signing in.");
        }

        if (claimProductId) {
          const claimResponse = await fetch("/api/claim-free", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ productId: claimProductId }),
          });
          const claimData = await claimResponse.json();
          if (!claimResponse.ok) {
            throw new Error(claimData.error || "Could not claim this product.");
          }
        }

        // Claim any anonymous purchases associated with the signed-in email.
        await fetch("/api/auth/claim-purchases", {
          method: "POST",
          credentials: "include",
        });

        if (!cancelled) router.replace(next);
      } catch (cause) {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : "Could not finish signing in.");
        }
      }
    }

    void completeSignIn();
    return () => {
      cancelled = true;
    };
  }, [claimProductId, next, router]);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 text-center">
      {error ? (
        <>
          <h1 className="text-2xl font-bold text-gray-900">We couldn&apos;t finish signing in</h1>
          <p className="mt-3 text-sm text-red-600">{error}</p>
          <a className="mt-6 font-medium text-orange-600 hover:text-orange-700" href="/sign-in">
            Return to sign in
          </a>
        </>
      ) : (
        <>
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-200 border-t-orange-600" />
          <p className="mt-4 text-gray-600">Finishing your sign in…</p>
        </>
      )}
    </main>
  );
}
