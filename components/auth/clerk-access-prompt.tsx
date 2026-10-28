"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { buildAuthFlowUrl } from "@/lib/auth/clerkRedirect";

export function ClerkAccessPrompt({
  mode = "sign-in",
  prefillEmail,
  next = "/dashboard",
}: {
  mode?: "sign-in" | "sign-up";
  prefillEmail?: string;
  next?: string;
}) {
  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle>{mode === "sign-in" ? "Access your account" : "Create your account"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600">
          {prefillEmail
            ? `Use ${prefillEmail} when signing in or creating your account to access your purchase.`
            : "Sign in securely with Google or your email to access your products and membership."}
        </p>
        <Link
          href={buildAuthFlowUrl(mode === "sign-in" ? "/sign-in" : "/sign-up", next, null)}
          className={`${buttonVariants()} w-full bg-orange-500 hover:bg-orange-600`}
        >
          {mode === "sign-in" ? "Continue to sign in" : "Continue to sign up"}
        </Link>
        <p className="text-xs text-gray-500">
          Existing customer? Create your new sign-in with the same email you used for your purchases.
        </p>
      </CardContent>
    </Card>
  );
}
