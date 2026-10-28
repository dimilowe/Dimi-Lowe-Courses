"use client";

import { ClerkAccessPrompt } from "@/components/auth/clerk-access-prompt";
import { Button } from "@/components/ui/button";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (userId: string) => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  if (!isOpen) return null;
  const next = typeof window === "undefined"
    ? "/dashboard"
    : `${window.location.pathname}${window.location.search}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-label="Sign in">
      <div className="w-full max-w-md">
        <ClerkAccessPrompt next={next} />
        <Button className="mt-3 w-full bg-white" variant="outline" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
