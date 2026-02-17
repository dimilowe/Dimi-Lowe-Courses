import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Layers, FileText } from "lucide-react";
import { getPseoPagesByBank } from "@/lib/pseo/pseoPagesRepo";

export const revalidate = 3600;

const HUB_PATH = "/tools/pdf-task-bank";

export const metadata: Metadata = {
  title: "PDF Task Bank - Merge, Split, Edit Query Library | VCM Suite",
  description:
    "Browse high-intent PDF task queries like merge PDF files, split PDF pages, and edit PDF online from one indexed hub.",
  alternates: {
    canonical: HUB_PATH,
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "PDF Task Bank - Merge, Split, Edit Query Library",
    description: "A searchable bank of practical PDF task pages linked to direct tool workflows.",
    url: HUB_PATH,
    type: "website",
  },
};

function templateLabel(templateSlug: string): string {
  if (templateSlug === "pdf-task-main") return "Task Queries";
  if (templateSlug === "pdf-task-tool") return "Tool Queries";
  if (templateSlug === "pdf-task-how-to") return "How-To Queries";
  return "All Queries";
}

export default async function PdfTaskBankPage() {
  const pages = await getPseoPagesByBank("pdf-task", { indexedOnly: true });
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
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-rose-100 px-3 py-1 text-sm font-medium text-rose-700">
            <FileText className="h-4 w-4" />
            Programmatic PDF Task Bank
          </div>
          <h1 className="mb-3 text-3xl font-bold text-gray-900">PDF Task Bank</h1>
          <p className="text-gray-600">
            Query pages built from repeatable PDF intents like merge, split, and edit. Use this hub to cover practical
            long-tail workflows and route users into your PDF toolset.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/tools/pdf-editor"
              className="inline-flex items-center gap-2 rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
            >
              Open PDF Tool
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
            No generated bank pages yet. Run <code className="rounded bg-gray-100 px-1 py-0.5">npm run pseo:pdf-task:generate</code>.
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
                      className="group rounded-xl border border-gray-200 p-4 transition hover:border-rose-300 hover:shadow-sm"
                    >
                      <div className="mb-2 text-sm text-gray-500">{String(page.body.category || "pdf workflow")}</div>
                      <h3 className="mb-1 font-semibold text-gray-900 group-hover:text-rose-700">{page.h1}</h3>
                      <p className="text-sm text-gray-600">{String(page.body.outputType || "PDF output")}</p>
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
