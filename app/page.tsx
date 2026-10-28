import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "VCM Suite - Creator Store",
  description: "Shop subscriptions, courses, apps, downloads, freebies, and more.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "VCM Suite - Creator Store",
    description: "Shop subscriptions, courses, apps, downloads, freebies, and more.",
    url: "/",
    type: "website",
    siteName: "VCM Suite",
  },
};

export const revalidate = 300;

export default function HomePage() {
  redirect("/store");
}
