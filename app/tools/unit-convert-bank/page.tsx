import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Layers, Scale } from "lucide-react";
import { getPseoPagesByBank } from "@/lib/pseo/pseoPagesRepo";

export const revalidate = 3600;

const HUB_PATH = "/tools/unit-convert-bank";

export const metadata: Metadata = {
  title: "Unit Convert Bank - High-Intent Conversion Query Library | VCM Suite",
  description:
    "Browse predictable unit conversion queries like cm to inches, kg to lbs, miles to km, and Celsius to Fahrenheit from one indexed hub.",
  alternates: {
    canonical: HUB_PATH,
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Unit Convert Bank - High-Intent Conversion Query Library",
    description: "A searchable hub of unit conversion query pages with direct calculator-oriented workflows.",
    url: HUB_PATH,
    type: "website",
  },
};

function templateLabel(templateSlug: string): string {
  if (templateSlug === "unit-convert-main") return "Conversion Queries";
  if (templateSlug === "unit-convert-converter") return "Converter Queries";
  if (templateSlug === "unit-convert-how-to") return "How-To Queries";
  if (templateSlug === "unit-convert-formula") return "Formula Queries";
  if (templateSlug === "unit-convert-chart") return "Chart Queries";
  return "All Queries";
}

export default async function UnitConvertBankPage() {
  const pages = await getPseoPagesByBank("unit-convert", { indexedOnly: true });
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
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700">
            <Scale className="h-4 w-4" />
            Programmatic Unit Convert Bank
          </div>
          <h1 className="mb-3 text-3xl font-bold text-gray-900">Unit Convert Bank</h1>
          <p className="text-gray-600">
            Predictable conversion-intent pages generated from common unit pairs and phrase templates. Use this hub
            to cover long-tail conversion queries at scale.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/tools/all"
              className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
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
            No generated bank pages yet. Run <code className="rounded bg-gray-100 px-1 py-0.5">npm run pseo:unit-convert:generate</code>.
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
                      className="group rounded-xl border border-gray-200 p-4 transition hover:border-emerald-300 hover:shadow-sm"
                    >
                      <div className="mb-2 text-sm text-gray-500">{String(page.body.category || "conversion")}</div>
                      <h3 className="mb-1 font-semibold text-gray-900 group-hover:text-emerald-700">{page.h1}</h3>
                      <p className="text-sm text-gray-600">
                        {String(page.body.sourceUnit || "?")} to {String(page.body.targetUnit || "?")}
                      </p>
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
