import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ClaimButton } from "@/components/claim-button";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { ProductRecommendations } from "@/components/product-recommendations";
import {
  extractSalesPageMeta,
  type SalesPageFaqItem,
  type SalesPagePainPoint,
  type SalesPageStep,
} from "@/lib/products/salesPageTemplate";

interface TemplateProduct {
  id: string;
  slug: string;
  name: string;
  description: string;
  thumbnail_url: string | null;
  type: string;
  price_type: string;
  price: number;
  stripe_price_id: string;
  external_url?: string | null;
  meta: unknown;
}

interface TemplateOrderBump {
  id: string;
  name: string;
  price: number;
  headline?: string;
  description?: string;
  cta_label?: string;
}

interface IncludedBundleProduct {
  id: number;
  slug: string;
  name: string;
  type: string;
  visibility: string | null;
}

interface LongformOfferTemplateProps {
  product: TemplateProduct;
  orderBump: TemplateOrderBump | null;
  includedBundleProducts?: IncludedBundleProduct[];
}

function defaultPromisePoints(productName: string) {
  return [
    `Get started with ${productName} quickly`,
    "Clear next-step guidance",
    "Simple daily flow that is easy to stick with",
    "Designed for mobile-first use",
    "Built to create consistency, not complexity",
    "Actionable outcomes instead of busywork",
  ];
}

function defaultPainPoints(productName: string): SalesPagePainPoint[] {
  return [
    {
      title: "Most systems are too complicated",
      problem: "When setup takes too long, people quit before momentum starts.",
      solution: `${productName} gives a simple flow you can follow in minutes.`,
    },
    {
      title: "Progress gets hard to track",
      problem: "Data and notes end up scattered across apps and files.",
      solution: "Keep your key actions and outcomes in one clear place.",
    },
    {
      title: "Without accountability, consistency fades",
      problem: "Even strong plans break down when life gets busy.",
      solution: "Use a tighter loop with clear goals and visible wins.",
    },
  ];
}

function defaultSteps(productName: string): SalesPageStep[] {
  return [
    {
      label: "Step One",
      title: "Set your starting point",
      description: "Capture where you are now and define your baseline clearly.",
    },
    {
      label: "Step Two",
      title: "Run the daily flow",
      description: `Use ${productName} each day to create consistent progress signals.`,
    },
    {
      label: "Step Three",
      title: "Review and improve weekly",
      description: "Use trends and summaries to sharpen your next week.",
    },
  ];
}

function defaultFeatureBullets(productName: string) {
  return [
    "Simple setup in minutes",
    "Mobile-friendly from day one",
    "Fast weekly review flow",
    "Clear priorities and next actions",
    "Designed for repeatable consistency",
    "Progress visibility without clutter",
    `Built around ${productName} outcomes`,
    "No unnecessary complexity",
  ];
}

function defaultFaq(productName: string): SalesPageFaqItem[] {
  return [
    {
      question: "How fast can I start?",
      answer: `Most members can start using ${productName} right away after joining.`,
    },
    {
      question: "Is this beginner-friendly?",
      answer: "Yes. The flow is designed to be simple, clear, and easy to follow.",
    },
    {
      question: "How do I access what I purchased?",
      answer: "Your Dashboard gives membership content access, and Workspace stores your files.",
    },
    {
      question: "Can I download resources?",
      answer: "Yes. Any included files and resource links are provided on your course page.",
    },
  ];
}

function toMetaFeatures(meta: unknown): string[] {
  if (typeof meta !== "object" || meta === null || Array.isArray(meta)) return [];
  const raw = (meta as Record<string, unknown>).features;
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item.length > 0);
}

export function LongformOfferTemplate({
  product,
  orderBump,
  includedBundleProducts = [],
}: LongformOfferTemplateProps) {
  const salesMeta = extractSalesPageMeta(product.meta);
  const isFree = product.price_type === "free";
  const isMembership = product.price_type === "membership";
  const theme = {
    primary: salesMeta?.theme?.primary_color || "#f97316",
    accent: salesMeta?.theme?.accent_color || "#7c2d12",
    surface: salesMeta?.theme?.surface_color || "#fff7ed",
    text: salesMeta?.theme?.text_color || "#111827",
    mutedText: salesMeta?.theme?.muted_text_color || "#4b5563",
  };
  const saveButtonProduct = {
    id: product.id,
    slug: product.slug,
    name: product.name,
    type: product.type,
    price: product.price,
    thumbnail_url: product.thumbnail_url || undefined,
  };

  const heroHeadline =
    salesMeta?.hero_headline || `Get Better Results With ${product.name}`;
  const heroSubheadline =
    salesMeta?.hero_subheadline ||
    product.description ||
    "A streamlined offer page designed to help buyers take action with confidence.";
  const heroSupportingText =
    salesMeta?.hero_supporting_text ||
    "Simple setup, strong clarity, and a consistent flow that is easy to keep using.";
  const guaranteeText =
    salesMeta?.guarantee_text || "30-day money-back guarantee.";
  const heroImageUrl = salesMeta?.hero_image_url || product.thumbnail_url || "";

  const promisePoints =
    salesMeta?.promise_points && salesMeta.promise_points.length > 0
      ? salesMeta.promise_points
      : defaultPromisePoints(product.name);
  const painPoints =
    salesMeta?.pain_points && salesMeta.pain_points.length > 0
      ? salesMeta.pain_points
      : defaultPainPoints(product.name);
  const steps =
    salesMeta?.steps && salesMeta.steps.length > 0
      ? salesMeta.steps
      : defaultSteps(product.name);
  const featureBulletsRaw =
    salesMeta?.feature_bullets && salesMeta.feature_bullets.length > 0
      ? salesMeta.feature_bullets
      : defaultFeatureBullets(product.name);
  const metaFeatures = toMetaFeatures(product.meta);
  const featureBullets = Array.from(new Set([...featureBulletsRaw, ...metaFeatures])).filter(Boolean);
  const faq =
    salesMeta?.faq && salesMeta.faq.length > 0 ? salesMeta.faq : defaultFaq(product.name);

  return (
    <div
      className="bg-gradient-to-b from-white via-orange-50/30 to-white"
      style={{ color: theme.text }}
    >
      <div className="mx-auto max-w-6xl px-4 py-10 md:py-16">
        <section className="text-center">
          <Badge
            variant="outline"
            className="capitalize"
            style={{ borderColor: theme.primary, color: theme.accent }}
          >
            {product.type}
          </Badge>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight md:text-6xl">
            {heroHeadline}
          </h1>
          <p className="mx-auto mt-6 max-w-4xl text-xl leading-relaxed md:text-2xl" style={{ color: theme.mutedText }}>
            {heroSubheadline}
          </p>
          <p className="mx-auto mt-4 max-w-3xl text-base md:text-lg" style={{ color: theme.mutedText }}>
            {heroSupportingText}
          </p>
        </section>

        <section className="mt-10 grid gap-8 lg:grid-cols-[1.35fr_1fr]">
          <Card className="overflow-hidden border-gray-200">
            <div className="grid gap-0 md:grid-cols-2">
              <div className="bg-gray-50 p-3">
                {heroImageUrl ? (
                  <img
                    src={heroImageUrl}
                    alt={product.name}
                    className="h-full w-full rounded-md object-contain"
                  />
                ) : (
                  <div className="flex h-full min-h-[260px] items-center justify-center rounded-md bg-white text-sm text-gray-400">
                    Add a thumbnail in admin
                  </div>
                )}
              </div>
              <div className="p-6">
                <h2 className="text-2xl font-bold">What you get</h2>
                <ul className="mt-4 space-y-3">
                  {promisePoints.map((point, idx) => (
                    <li key={`${point}-${idx}`} className="flex gap-2" style={{ color: theme.mutedText }}>
                      <span className="mt-1 h-2 w-2 rounded-full" style={{ backgroundColor: theme.primary }} />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>

          <Card className="sticky top-24 h-fit border-orange-200 shadow-sm">
            <div className="p-6">
              <p className="text-center text-4xl font-bold">
                {isFree ? "Free" : isMembership ? "Included with membership" : `$${(product.price / 100).toFixed(2)}`}
              </p>
              {isMembership && (
                <p className="mt-2 text-center text-sm" style={{ color: theme.mutedText }}>
                  Join for $49/month to access this and every other course, download, and digital product.
                </p>
              )}
              <div className="mt-5 space-y-3">
                <ClaimButton product={product} orderBump={orderBump} />
                <AddToCartButton product={saveButtonProduct} />
              </div>
              <p className="mt-4 text-center text-xs" style={{ color: theme.mutedText }}>
                {guaranteeText}
              </p>
            </div>
          </Card>
        </section>

        <section className="mt-16">
          <h2 className="text-center text-4xl font-bold tracking-tight md:text-5xl">
            Why most people stall out
          </h2>
          <div className="mt-8 space-y-4">
            {painPoints.map((item, idx) => (
              <Card key={`${item.title}-${idx}`} className="rounded-2xl border-gray-200 p-6 md:p-8">
                <h3 className="text-2xl font-bold" style={{ color: theme.accent }}>{item.title}</h3>
                <p className="mt-3 text-xl" style={{ color: theme.mutedText }}>{item.problem}</p>
                {item.solution && (
                  <p className="mt-4 text-xl font-semibold">✓ {item.solution}</p>
                )}
              </Card>
            ))}
          </div>
        </section>

        <section className="mt-16">
          <h2 className="text-center text-4xl font-bold tracking-tight md:text-5xl">
            A clear 3-step flow
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {steps.map((step, idx) => (
              <Card key={`${step.title}-${idx}`} className="rounded-2xl border-gray-200 p-6">
                <p className="text-xs font-bold uppercase tracking-[0.24em]" style={{ color: theme.primary }}>
                  {step.label || `Step ${idx + 1}`}
                </p>
                <h3 className="mt-3 text-3xl font-bold leading-tight">{step.title}</h3>
                <p className="mt-4 text-lg" style={{ color: theme.mutedText }}>{step.description}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="mt-16 rounded-2xl border border-gray-200 bg-white p-6 md:p-10">
          <h2 className="text-center text-4xl font-bold tracking-tight md:text-5xl">
            What {product.name} gives you
          </h2>
          <div className="mt-8 grid gap-3 md:grid-cols-2">
            {featureBullets.map((item, idx) => (
              <div key={`${item}-${idx}`} className="flex gap-3 rounded-lg border border-gray-100 p-3">
                <span className="mt-1 h-2 w-2 rounded-full" style={{ backgroundColor: theme.primary }} />
                <span className="text-lg">{item}</span>
              </div>
            ))}
          </div>
        </section>

        {includedBundleProducts.length > 0 && (
          <section className="mt-16 rounded-2xl border border-gray-200 bg-white p-6 md:p-10">
            <h2 className="text-center text-4xl font-bold tracking-tight md:text-5xl">
              Included Modules
            </h2>
            <div className="mt-8 grid gap-3 md:grid-cols-2">
              {includedBundleProducts.map((item) => (
                <div key={item.id} className="rounded-lg border border-gray-100 p-4">
                  <p className="text-lg font-semibold">{item.name}</p>
                  <p className="mt-1 text-sm capitalize" style={{ color: theme.mutedText }}>
                    {item.type}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="mt-16">
          <h2 className="text-center text-4xl font-bold tracking-tight md:text-5xl">FAQ</h2>
          <div className="mt-8 space-y-3">
            {faq.map((item, idx) => (
              <details key={`${item.question}-${idx}`} className="rounded-xl border border-gray-200 bg-white p-5">
                <summary className="cursor-pointer text-lg font-semibold">
                  {item.question}
                </summary>
                <p className="mt-3" style={{ color: theme.mutedText }}>{item.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="mt-16 rounded-2xl border p-8 text-center" style={{ borderColor: theme.primary, backgroundColor: theme.surface }}>
          <p className="text-3xl font-bold md:text-5xl">{guaranteeText}</p>
          <div className="mx-auto mt-6 max-w-xl space-y-3">
            <ClaimButton product={product} orderBump={orderBump} />
            <AddToCartButton product={saveButtonProduct} />
          </div>
        </section>

        <div className="mt-14">
          <ProductRecommendations currentProductId={product.id} productType={product.type} />
        </div>
      </div>
    </div>
  );
}
