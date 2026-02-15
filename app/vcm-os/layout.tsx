import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "VCM OS Waitlist | VCM Suite",
  description:
    "Join the VCM OS waitlist for early access to the creator operating system.",
  alternates: {
    canonical: "/vcm-os",
  },
  openGraph: {
    title: "VCM OS Waitlist | VCM Suite",
    description:
      "Join the waitlist for early access to VCM OS, the creator operating system.",
    url: "/vcm-os",
    type: "website",
  },
};

export default function VcmOsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
