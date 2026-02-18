import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Layers, FileCog } from "lucide-react";
import { getPseoPagesByBank } from "@/lib/pseo/pseoPagesRepo";

export const revalidate = 3600;

const HUB_PATH = "/tools/file-convert-bank";

export const metadata: Metadata = {
  title: "File Convert Bank - Format Conversion Query Library | VCM Suite",
  description:
    "Browse predictable conversion queries like WEBP to JPG, HEIC to JPG, M4A to MP3, and WAV to MIDI from one indexed hub.",
  alternates: {
    canonical: HUB_PATH,
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "File Convert Bank - Format Conversion Query Library",
    description: "A searchable hub of high-intent conversion query pages linked to practical tool workflows.",
    url: HUB_PATH,
    type: "website",
  },
};

function templateLabel(templateSlug: string): string {
  if (templateSlug === "file-convert-main") return "Convert Queries";
  if (templateSlug === "file-convert-converter") return "Converter Queries";
  if (templateSlug === "file-convert-how-to") return "How-To Queries";
  if (templateSlug === "file-convert-online") return "Online Converter Queries";
  if (templateSlug === "file-convert-best") return "Best Converter Queries";
  return "All Queries";
}

export default async function FileConvertBankPage() {
  const pages = await getPseoPagesByBank("file-convert", { indexedOnly: true });
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
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
            <FileCog className="h-4 w-4" />
            Programmatic File Convert Bank
          </div>
          <h1 className="mb-3 text-3xl font-bold text-gray-900">File Convert Bank</h1>
          <p className="text-gray-600">
            Predictable conversion-intent pages generated from format entities and phrase templates. Jump directly into the right tool workflow.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/tools/webp-to-jpg"
              className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Open Conversion Tool
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
            No generated bank pages yet. Run <code className="rounded bg-gray-100 px-1 py-0.5">npm run pseo:file-convert:generate</code>.
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
                      className="group rounded-xl border border-gray-200 p-4 transition hover:border-blue-300 hover:shadow-sm"
                    >
                      <div className="mb-2 text-sm text-gray-500">{String(page.body.category || "conversion")}</div>
                      <h3 className="mb-1 font-semibold text-gray-900 group-hover:text-blue-700">{page.h1}</h3>
                      <p className="text-sm text-gray-600">
                        {String(page.body.sourceFormat || "?")} → {String(page.body.targetFormat || "?")}
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
