import Link from "next/link";
import { getAllCmsTools } from "@/lib/tools";

interface ToolInterlinksProps {
  currentSlug: string;
  toolName: string;
  interlinkParent?: string | null;
  interlinkSiblings?: string[];
  interlinkTools?: string[];
}

export async function ToolInterlinks({
  currentSlug,
  toolName,
  interlinkParent,
  interlinkSiblings,
  interlinkTools,
}: ToolInterlinksProps) {
  const allTools = await getAllCmsTools();
  const toolMap = new Map(allTools.map((t) => [t.slug, t.title || t.slug]));

  const prioritized = Array.from(
    new Set([...(interlinkTools || []), ...(interlinkSiblings || [])])
  ).filter((slug) => slug !== currentSlug && toolMap.has(slug));

  const fallback = allTools
    .map((t) => t.slug)
    .filter((slug) => slug !== currentSlug && !prioritized.includes(slug))
    .slice(0, 8);

  const relatedSlugs = [...prioritized.slice(0, 8), ...fallback].slice(0, 8);

  if (!relatedSlugs.length && !interlinkParent) return null;

  return (
    <section className="max-w-4xl mx-auto px-4 mt-10">
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="text-xl font-bold text-gray-900">Related Tools</h2>
        <p className="text-sm text-gray-600 mt-1">
          Keep your workflow moving after using {toolName}.
        </p>

        {interlinkParent && (
          <div className="mt-4">
            <Link
              href={`/tools/clusters/${interlinkParent}`}
              className="inline-flex items-center rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-sm font-medium text-orange-700 hover:bg-orange-100 transition-colors"
            >
              Explore more in {interlinkParent.replace(/-/g, " ")}
            </Link>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {relatedSlugs.map((slug) => (
            <Link
              key={slug}
              href={`/tools/${slug}`}
              className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
            >
              {toolMap.get(slug)}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
