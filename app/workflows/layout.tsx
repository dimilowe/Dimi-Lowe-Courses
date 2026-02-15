import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Creator Workflows | VCM Suite",
  description:
    "Step-by-step creator workflows for growth, monetization, and content execution inside VCM Suite.",
  alternates: {
    canonical: "/workflows",
  },
  openGraph: {
    title: "Creator Workflows | VCM Suite",
    description:
      "Practical workflow playbooks to help creators ship faster and grow consistently.",
    url: "/workflows",
    type: "website",
  },
};

export default function WorkflowsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
