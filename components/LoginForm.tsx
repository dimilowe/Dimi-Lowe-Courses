"use client";

import { ClerkAccessPrompt } from "@/components/auth/clerk-access-prompt";

export function LoginForm({ prefillEmail }: { prefillEmail?: string }) {
  return <ClerkAccessPrompt prefillEmail={prefillEmail} />;
}
