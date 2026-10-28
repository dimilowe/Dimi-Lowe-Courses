"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { shadcn } from "@clerk/themes";
import type { ReactNode } from "react";

const appearance = {
  baseTheme: shadcn,
  variables: {
    colorPrimary: "#f97316",
    colorForeground: "#111827",
    colorMutedForeground: "#6b7280",
    colorBackground: "#ffffff",
    colorInput: "#ffffff",
    colorInputForeground: "#111827",
    colorDanger: "#dc2626",
    colorNeutral: "#d1d5db",
    fontFamily: "Inter, sans-serif",
    borderRadius: "0.75rem",
  },
  elements: {
    cardBox: {
      width: "100%",
      maxWidth: "440px",
      borderRadius: "16px",
      overflow: "hidden",
      boxShadow: "0 12px 36px rgba(17, 24, 39, 0.10)",
    },
    logoImage: {
      height: "40px",
    },
    headerTitle: {
      color: "#111827",
      fontWeight: "700",
    },
    headerSubtitle: {
      color: "#6b7280",
    },
    formFieldLabel: {
      color: "#374151",
      fontWeight: "600",
    },
    formFieldInput: {
      borderColor: "#d1d5db",
      color: "#111827",
    },
    formButtonPrimary: {
      backgroundColor: "#f97316",
      color: "#ffffff",
    },
    footerActionText: {
      color: "#6b7280",
    },
    footerActionLink: {
      color: "#ea580c",
      fontWeight: "600",
    },
    socialButtonsBlockButtonText: {
      color: "#111827",
      fontWeight: "600",
    },
    dividerText: {
      color: "#6b7280",
    },
  },
};

export function ClerkAuthProvider({
  children,
  publishableKey,
  proxyUrl,
}: {
  children: ReactNode;
  publishableKey: string;
  proxyUrl?: string;
}) {
  return (
    <ClerkProvider
      publishableKey={publishableKey}
      proxyUrl={proxyUrl}
      appearance={appearance}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
    >
      {children}
    </ClerkProvider>
  );
}
