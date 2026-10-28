import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing | VCM Suite",
  description:
    "Explore VCM Suite membership courses, apps, downloads, and resources.",
  alternates: {
    canonical: "/pricing",
  },
  openGraph: {
    title: "Pricing | VCM Suite",
    description:
      "One subscription for included courses, apps, downloads, and resources.",
    url: "/pricing",
    type: "website",
  },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
