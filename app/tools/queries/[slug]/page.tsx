import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { getAllIndexedPseoPages, getPseoPageBySlug } from "@/lib/pseo/pseoPagesRepo";
import { getSiteUrl } from "@/lib/site-url";

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const indexedPages = await getAllIndexedPseoPages();
  return indexedPages.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPseoPageBySlug(slug);
  const fallbackCanonical = `/tools/queries/${slug}`;

  if (!page) {
    return {
      title: "Query Not Found | VCM Suite",
      robots: { index: false, follow: false },
      alternates: { canonical: fallbackCanonical },
    };
  }

  return {
    title: page.title,
    description: page.metaDescription,
    alternates: {
      canonical: page.canonical || fallbackCanonical,
    },
    robots: page.isIndexed
      ? { index: true, follow: true }
      : { index: false, follow: false },
    openGraph: {
      title: page.title,
      description: page.metaDescription,
      type: "website",
      url: `${getSiteUrl()}${page.canonical || fallbackCanonical}`,
    },
  };
}

function formatTemplateLabel(templateSlug: string): string {
  const cleaned = templateSlug
    .replace(/^file-convert-/, "")
    .replace(/^image-size-/, "");
  if (cleaned === "main") return "Primary";
  if (cleaned === "converter") return "Converter";
  if (cleaned === "how-to") return "How To";
  return cleaned
    .split("-")
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

function bankDisplayName(bankSlug: string): string {
  if (bankSlug === "image-size") return "Image Size Bank";
  if (bankSlug === "file-convert") return "File Convert Bank";
  return "Query Bank";
}

function bankCtaLabel(bankSlug: string): string {
  if (bankSlug === "image-size") return "Resize This Format Now";
  if (bankSlug === "file-convert") return "Open Converter Workflow";
  return "Open Tool";
}

export default async function QueryLeafPage({ params }: PageProps) {
  const { slug } = await params;
  const page = await getPseoPageBySlug(slug);

  if (!page) {
    notFound();
  }

  const siblings = await Promise.all(
    page.siblingSlugs.slice(0, 6).map(async (siblingSlug) => getPseoPageBySlug(siblingSlug))
  );
  const resolvedSiblings = siblings.filter(
    (sibling): sibling is NonNullable<typeof sibling> => Boolean(sibling)
  );

  const faq = Array.isArray(page.body.faq) ? page.body.faq : [];
  const isImageSize = page.bankSlug === "image-size";
  const pixels = String(page.body.pixels || `${page.body.width || "?"}x${page.body.height || "?"}`);
  const sourceFormat = String(page.body.sourceFormat || "?");
  const targetFormat = String(page.body.targetFormat || "?");
  const category = String(page.body.category || "conversion");

  const faqSchema =
    faq.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faq.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: item.answer,
            },
          })),
        }
      : null;

  return (
    <>
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 px-4 py-10">
        <div className="mx-auto max-w-3xl">
          <Link href={page.hubPath} className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-orange-600">
            <ArrowLeft className="h-4 w-4" />
            Back to {bankDisplayName(page.bankSlug)}
          </Link>

          <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-3 text-sm font-medium text-orange-600">{formatTemplateLabel(page.templateSlug)} Query</div>
            <h1 className="mb-3 text-3xl font-bold text-gray-900">{page.h1}</h1>
            <p className="mb-5 text-gray-700">{page.intro}</p>

            {isImageSize ? (
              <>
                <div className="grid gap-3 rounded-xl bg-gray-50 p-4 md:grid-cols-3">
                  <div>
                    <div className="text-xs uppercase tracking-wide text-gray-500">Pixel Size</div>
                    <div className="mt-1 text-lg font-semibold text-gray-900">{pixels}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wide text-gray-500">Aspect Ratio</div>
                    <div className="mt-1 text-lg font-semibold text-gray-900">{String(page.body.aspectRatio || "N/A")}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wide text-gray-500">Platform</div>
                    <div className="mt-1 text-lg font-semibold text-gray-900">{String(page.body.platform || "N/A")}</div>
                  </div>
                </div>
                <div className="mt-5 rounded-xl border border-orange-200 bg-orange-50 p-4">
                  <h2 className="text-sm font-semibold text-gray-900">Safe-Area Guidance</h2>
                  <p className="mt-1 text-sm text-gray-700">
                    {String(page.body.safeAreaTips || "Keep key text centered and away from UI overlays.")}
                  </p>
                  <p className="mt-2 text-xs text-gray-500">{String(page.body.notes || "")}</p>
                </div>
              </>
            ) : (
              <>
                <div className="grid gap-3 rounded-xl bg-gray-50 p-4 md:grid-cols-3">
                  <div>
                    <div className="text-xs uppercase tracking-wide text-gray-500">Source Format</div>
                    <div className="mt-1 text-lg font-semibold text-gray-900">{sourceFormat}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wide text-gray-500">Target Format</div>
                    <div className="mt-1 text-lg font-semibold text-gray-900">{targetFormat}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wide text-gray-500">Category</div>
                    <div className="mt-1 text-lg font-semibold text-gray-900">{category}</div>
                  </div>
                </div>
                <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-4">
                  <h2 className="text-sm font-semibold text-gray-900">Conversion Notes</h2>
                  <p className="mt-1 text-sm text-gray-700">{String(page.body.bestFor || "Use this path for practical, compatibility-first conversion.")}</p>
                  <p className="mt-2 text-xs text-gray-500">{String(page.body.notes || "")}</p>
                </div>
              </>
            )}

            <div className="mt-6">
              <Link
                href={`/tools/${page.toolSlug}`}
                className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600"
              >
                {bankCtaLabel(page.bankSlug)}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </article>

          {resolvedSiblings.length > 0 && (
            <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="mb-3 text-lg font-semibold text-gray-900">Related Query Pages</h2>
              <div className="grid gap-2 md:grid-cols-2">
                {resolvedSiblings.map((sibling) => (
                  <Link
                    key={sibling.slug}
                    href={sibling.urlPath}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:border-orange-300 hover:text-orange-700"
                  >
                    {sibling.h1}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {faq.length > 0 && (
            <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Frequently Asked Questions</h2>
              <div className="space-y-3">
                {faq.map((item) => (
                  <div key={item.question} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                    <h3 className="font-medium text-gray-900">{item.question}</h3>
                    <p className="mt-1 text-sm text-gray-700">{item.answer}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
