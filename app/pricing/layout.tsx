import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing | VCM Suite",
  description:
    "One simple VCM Suite subscription: keep tools free, unlock saving presets and workspace outputs across the platform.",
  alternates: {
    canonical: "/pricing",
  },
  openGraph: {
    title: "Pricing | VCM Suite",
    description:
      "One simple subscription to save presets and workspace outputs across all tools.",
    url: "/pricing",
    type: "website",
  },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
