import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "VCM Suite - Creator Store",
  description: "Shop creator apps, downloads, templates, and resources.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "VCM Suite - Creator Store",
    description: "Shop creator apps, downloads, templates, and resources.",
    url: "/",
    type: "website",
    siteName: "VCM Suite",
  },
};

export const revalidate = 300;

export default function HomePage() {
  redirect("/store");
}
