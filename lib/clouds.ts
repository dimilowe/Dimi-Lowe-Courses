export type CloudSlug =
  | "creation"
  | "video"
  | "writing_seo"
  | "file_data"
  | "monetization"
  | "intelligence"
  | "music_performance"
  | "growth_distribution"
  | "shopping"
  | "advertising"
  | "gaming"
  | "ecommerce";

export const DEPRECATED_CLOUD_SLUGS = new Set<CloudSlug>(['file_data', 'monetization']);

export type CloudConfig = {
  slug: CloudSlug;
  name: string;
  shortDescription: string;
  productSlug: string;
};

export const CLOUDS: CloudConfig[] = [
  {
    slug: "creation",
    name: "VCM AI Creation Cloud",
    shortDescription: "AI-powered image, design, and visual creation workflows.",
    productSlug: "vcm-creation-cloud",
  },
  {
    slug: "video",
    name: "VCM AI Video Cloud",
    shortDescription: "Short-form editing, hooks, subtitles, and script analysis.",
    productSlug: "vcm-video-cloud",
  },
  {
    slug: "writing_seo",
    name: "VCM AI Writing & SEO Cloud",
    shortDescription: "SEO articles, clusters, rewriters, and SERP domination.",
    productSlug: "vcm-writing-seo-cloud",
  },
  {
    slug: "intelligence",
    name: "VCM AI Intelligence Cloud",
    shortDescription: "Semantic search, recommendations, signals, and automations.",
    productSlug: "vcm-intelligence-cloud",
  },
  {
    slug: "music_performance",
    name: "VCM Music & Performance Cloud",
    shortDescription: "Stems, Tracetune, filters, and performance tooling.",
    productSlug: "vcm-music-performance-cloud",
  },
  {
    slug: "growth_distribution",
    name: "VCM Distribution & Growth Cloud",
    shortDescription: "Hashtags, comments system, distribution, and funnel rails.",
    productSlug: "vcm-growth-distribution-cloud",
  },
  {
    slug: "shopping",
    name: "VCM Shopping Cloud",
    shortDescription: "Tools for outfits, styling, shopping boards, lookbooks, product mixing, and shoppable content.",
    productSlug: "vcm-shopping-cloud",
  },
  {
    slug: "advertising",
    name: "VCM Advertising Cloud",
    shortDescription: "Tools for paid reach, ads, campaign testing, funnels, optimizations, and marketing workflows.",
    productSlug: "vcm-advertising-cloud",
  },
  {
    slug: "gaming",
    name: "VCM Gaming Cloud",
    shortDescription: "Gaming content creation, streaming tools, and esports workflows.",
    productSlug: "vcm-gaming-cloud",
  },
  {
    slug: "ecommerce",
    name: "VCM Ecommerce Cloud",
    shortDescription: "Product listings, store optimization, and commerce workflows.",
    productSlug: "vcm-ecommerce-cloud",
  },
];

const DEPRECATED_CLOUD_CONFIGS: CloudConfig[] = [
  {
    slug: "file_data",
    name: "VCM File & Data Cloud",
    shortDescription: "Files, PDFs, compression, conversion, and structured data flows.",
    productSlug: "vcm-file-data-cloud",
  },
  {
    slug: "monetization",
    name: "VCM Creator Monetization Cloud",
    shortDescription: "APE, OfferRail, Upsell Exchange, QR Social, and ad rails.",
    productSlug: "vcm-monetization-cloud",
  },
];

export const CLOUD_CONFIG_BY_SLUG: Record<CloudSlug, CloudConfig> =
  [...CLOUDS, ...DEPRECATED_CLOUD_CONFIGS].reduce((acc, cloud) => {
    acc[cloud.slug] = cloud;
    return acc;
  }, {} as Record<CloudSlug, CloudConfig>);
