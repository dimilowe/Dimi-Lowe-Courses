"use client";

import { ClerkAccessPrompt } from "@/components/auth/clerk-access-prompt";

export function SignupForm({ prefillEmail }: { prefillEmail?: string }) {
  return <ClerkAccessPrompt mode="sign-up" prefillEmail={prefillEmail} />;
}
