"use client";

interface LivePainPoint {
  title: string;
  problem: string;
  solution?: string;
}

interface LiveStep {
  label?: string;
  title: string;
  description: string;
}

interface LongformOfferLivePreviewProps {
  productName: string;
  productType: string;
  productDescription: string;
  priceCents: number;
  isFree: boolean;
  thumbnailUrl?: string;
  heroImageUrl?: string;
  heroHeadline?: string;
  heroSubheadline?: string;
  heroSupportingText?: string;
  promisePoints: string[];
  painPoints: LivePainPoint[];
  steps: LiveStep[];
  featureBullets: string[];
  guaranteeText?: string;
  primaryColor: string;
  accentColor: string;
  surfaceColor: string;
  textColor: string;
  mutedTextColor: string;
}

export function LongformOfferLivePreview({
  productName,
  productType,
  productDescription,
  priceCents,
  isFree,
  thumbnailUrl,
  heroImageUrl,
  heroHeadline,
  heroSubheadline,
  heroSupportingText,
  promisePoints,
  painPoints,
  steps,
  featureBullets,
  guaranteeText,
  primaryColor,
  accentColor,
  surfaceColor,
  textColor,
  mutedTextColor,
}: LongformOfferLivePreviewProps) {
  const effectiveHeroHeadline = heroHeadline || `Get Better Results With ${productName || "Your Product"}`;
  const effectiveHeroSubheadline =
    heroSubheadline ||
    productDescription ||
    "A streamlined offer page designed to help buyers take action with confidence.";
  const effectiveHeroSupportingText =
    heroSupportingText || "Simple setup, strong clarity, and a consistent flow that is easy to keep using.";
  const effectiveGuarantee = guaranteeText || "30-day money-back guarantee.";
  const effectiveHeroImage = heroImageUrl || thumbnailUrl || "";

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Live Sales Preview</p>
        <span className="rounded-full border border-gray-200 px-2 py-1 text-xs text-gray-500">/products/slug</span>
      </div>

      <div
        className="max-h-[72vh] overflow-auto rounded-lg border border-gray-200 bg-gradient-to-b from-white via-orange-50/30 to-white p-4"
        style={{ color: textColor }}
      >
        <section className="text-center">
          <span
            className="inline-block rounded-full border px-3 py-1 text-xs font-medium capitalize"
            style={{ borderColor: primaryColor, color: accentColor }}
          >
            {productType || "product"}
          </span>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight">{effectiveHeroHeadline}</h2>
          <p className="mx-auto mt-3 max-w-3xl text-lg" style={{ color: mutedTextColor }}>
            {effectiveHeroSubheadline}
          </p>
          <p className="mx-auto mt-2 max-w-2xl text-sm" style={{ color: mutedTextColor }}>
            {effectiveHeroSupportingText}
          </p>
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-[1.35fr_1fr]">
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <div className="grid md:grid-cols-2">
              <div className="bg-gray-50 p-2">
                {effectiveHeroImage ? (
                  <img src={effectiveHeroImage} alt={productName} className="h-full w-full rounded-md object-contain" />
                ) : (
                  <div className="flex min-h-[160px] items-center justify-center rounded-md border border-dashed border-gray-300 text-xs text-gray-500">
                    No image selected
                  </div>
                )}
              </div>
              <div className="p-4">
                <p className="text-lg font-bold">What you get</p>
                <ul className="mt-2 space-y-2">
                  {promisePoints.slice(0, 6).map((item, idx) => (
                    <li key={`${item}-${idx}`} className="flex items-start gap-2 text-sm" style={{ color: mutedTextColor }}>
                      <span className="mt-1 h-2 w-2 rounded-full" style={{ backgroundColor: primaryColor }} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-center text-3xl font-bold">{isFree ? "Free" : `$${(priceCents / 100).toFixed(2)}`}</p>
            <button className="mt-4 w-full rounded-md px-3 py-2 text-sm font-semibold text-white" style={{ backgroundColor: primaryColor }}>
              Buy Now
            </button>
            <button className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-600">
              Save for Later
            </button>
            <p className="mt-3 text-center text-xs" style={{ color: mutedTextColor }}>
              {effectiveGuarantee}
            </p>
          </div>
        </section>

        <section className="mt-8">
          <h3 className="text-center text-2xl font-bold">Why most people stall out</h3>
          <div className="mt-3 space-y-3">
            {painPoints.filter((item) => item.title || item.problem).map((item, idx) => (
              <div key={`${item.title}-${idx}`} className="rounded-lg border border-gray-200 bg-white p-4">
                <p className="text-lg font-semibold" style={{ color: accentColor }}>{item.title || `Pain Point ${idx + 1}`}</p>
                <p className="mt-1 text-sm" style={{ color: mutedTextColor }}>{item.problem || "Describe the core problem."}</p>
                {item.solution && <p className="mt-2 text-sm font-medium">✓ {item.solution}</p>}
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8">
          <h3 className="text-center text-2xl font-bold">A clear 3-step flow</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            {steps.slice(0, 3).map((step, idx) => (
              <div key={`${step.title}-${idx}`} className="rounded-lg border border-gray-200 bg-white p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: primaryColor }}>
                  {step.label || `Step ${idx + 1}`}
                </p>
                <p className="mt-2 text-lg font-semibold">{step.title || "Step title"}</p>
                <p className="mt-1 text-sm" style={{ color: mutedTextColor }}>
                  {step.description || "Step description goes here."}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-lg border p-4" style={{ borderColor: primaryColor, backgroundColor: surfaceColor }}>
          <h3 className="text-center text-2xl font-bold">What {productName || "this product"} gives you</h3>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {featureBullets.slice(0, 8).map((item, idx) => (
              <div key={`${item}-${idx}`} className="flex gap-2 rounded-md bg-white p-2">
                <span className="mt-1 h-2 w-2 rounded-full" style={{ backgroundColor: primaryColor }} />
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
