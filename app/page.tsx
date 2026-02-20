import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "VCM Suite Closed",
  description: "VCM Suite is now closed. Thank you for your support over the years.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "VCM Suite Closed",
    description: "VCM Suite is now closed. Thank you for your support over the years.",
    url: "/",
    type: "website",
    siteName: "VCM Suite",
  },
};

export const revalidate = 300;

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white px-6 py-24">
      <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
        <h1 className="text-3xl font-bold text-gray-900 md:text-4xl">
          VCM Suite is now closed.
          <br />
          Thank you for your support over the years.
        </h1>
      </div>
    </main>
  );
}
