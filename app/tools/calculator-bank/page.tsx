import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Layers, Calculator } from "lucide-react";
import { getPseoPagesByBank } from "@/lib/pseo/pseoPagesRepo";

export const revalidate = 3600;

const HUB_PATH = "/tools/calculator-bank";

export const metadata: Metadata = {
  title: "Calculator Bank - High-Intent Calculator Query Library | VCM Suite",
  description:
    "Browse calculator-intent queries across health, finance, business, and logistics from one indexed bank hub.",
  alternates: {
    canonical: HUB_PATH,
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Calculator Bank - High-Intent Calculator Query Library",
    description: "A searchable bank of calculator-intent pages with direct links to practical tool workflows.",
    url: HUB_PATH,
    type: "website",
  },
};

function templateLabel(templateSlug: string): string {
  if (templateSlug === "calculator-intent-main") return "Calculator Queries";
  if (templateSlug === "calculator-intent-free") return "Free Calculator Queries";
  if (templateSlug === "calculator-intent-how-to") return "How-To Queries";
  return "All Queries";
}

export default async function CalculatorBankPage() {
  const pages = await getPseoPagesByBank("calculator-intent", { indexedOnly: true });
  const groups = new Map<string, typeof pages>();
  for (const page of pages) {
    const group = groups.get(page.templateSlug) || [];
    group.push(page);
    groups.set(page.templateSlug, group);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-700">
            <Calculator className="h-4 w-4" />
            Programmatic Calculator Bank
          </div>
          <h1 className="mb-3 text-3xl font-bold text-gray-900">Calculator Bank</h1>
          <p className="text-gray-600">
            Predictable calculator-intent pages generated from repeatable templates and intent entities. Use this hub to
            target broad top-of-funnel calculator searches while routing users into your calculator tools.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/tools/all"
              className="inline-flex items-center gap-2 rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
            >
              Open Calculator Tools
              <ArrowRight className="h-4 w-4" />
            </Link>
            <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm text-gray-700">
              <Layers className="h-4 w-4" />
              {pages.length} indexed pages
            </div>
          </div>
        </div>

        {groups.size === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-600">
            No generated bank pages yet. Run{" "}
            <code className="rounded bg-gray-100 px-1 py-0.5">npm run pseo:calculator-intent:generate</code>.
          </div>
        ) : (
          <div className="space-y-6">
            {[...groups.entries()].map(([templateSlug, items]) => (
              <section key={templateSlug} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <h2 className="mb-4 text-xl font-semibold text-gray-900">{templateLabel(templateSlug)}</h2>
                <div className="grid gap-3 md:grid-cols-2">
                  {items.map((page) => (
                    <Link
                      key={page.slug}
                      href={page.urlPath}
                      className="group rounded-xl border border-gray-200 p-4 transition hover:border-amber-300 hover:shadow-sm"
                    >
                      <div className="mb-2 text-sm text-gray-500">{String(page.body.topic || "calculator")}</div>
                      <h3 className="mb-1 font-semibold text-gray-900 group-hover:text-amber-700">{page.h1}</h3>
                      <p className="text-sm text-gray-600">{String(page.body.primaryOutput || "Calculator output")}</p>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
