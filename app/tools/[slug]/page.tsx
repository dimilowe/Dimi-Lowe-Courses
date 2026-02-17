import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { getAllCmsTools, getCmsToolBySlug } from '@/lib/cms/getCmsToolBySlug';
import { getPillarBySlug } from '@/lib/cms/getPillarBySlug';
import { isEngineSupported } from '@/lib/engineRegistry';
import ToolPageClient from './ToolPageClient';
import { FreeToolsBlock } from '@/components/FreeToolsBlock';
import { ToolBreadcrumb } from '@/components/tools/ToolBreadcrumb';
import { ToolInterlinks } from '@/components/tools/ToolInterlinks';
import { getToolBySlug } from '@/lib/toolsRepo';
import { getSiteUrl } from '@/lib/site-url';
import { getToolIndexDecision } from '@/lib/seo/toolIndexGate';
import { getCanonicalToolPath, normalizeToolSlug } from '@/lib/seo/urlNormalization';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 3600;

export async function generateStaticParams() {
  const tools = await getAllCmsTools({ includeDrafts: false });
  return tools.map((tool) => ({ slug: tool.slug }));
}

function inferToolType(slug: string): string {
  if (slug.includes('calculator')) return 'calculator';
  if (slug.includes('converter')) return 'converter';
  if (slug.includes('compressor')) return 'compressor';
  if (slug.includes('generator')) return 'generator';
  if (slug.includes('editor')) return 'editor';
  if (slug.includes('analyzer')) return 'analyzer';
  if (slug.includes('finder')) return 'finder';
  if (slug.includes('detector')) return 'detector';
  if (slug.includes('maker')) return 'maker';
  return 'tool';
}

function buildFallbackSeoTitle(toolName: string, slug: string): string {
  const toolType = inferToolType(slug);
  return `${toolName} - Free Online ${toolType[0].toUpperCase()}${toolType.slice(1)} | VCM Suite`;
}

function buildFallbackSeoDescription(toolName: string, slug: string): string {
  const toolType = inferToolType(slug);
  return `Use ${toolName} online for free. Fast browser-based ${toolType} for creators with no install required.`;
}

function buildFallbackKeywords(slug: string, toolName: string): string {
  const phrase = slug.replace(/-/g, ' ');
  const toolType = inferToolType(slug);
  return `${phrase}, ${toolName.toLowerCase()}, free ${toolType}, online ${toolType}, ${phrase} free`;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug: rawSlug } = await params;
  const slug = normalizeToolSlug(rawSlug);
  const tool = await getCmsToolBySlug(slug, { includeDrafts: true });
  const canonical = getCanonicalToolPath(slug);

  if (!tool) {
    return {
      title: 'Tool Not Found | VCM Suite',
      robots: { index: false, follow: false },
      alternates: { canonical },
    };
  }

  const seoTitle = tool.seo?.metaTitle || buildFallbackSeoTitle(tool.name, slug);
  const seoDescription = tool.seo?.metaDescription || tool.description || buildFallbackSeoDescription(tool.name, slug);
  const seoKeywords = tool.seo?.keywords?.join(', ') || buildFallbackKeywords(slug, tool.name);
  const baseUrl = getSiteUrl();
  const indexDecision = await getToolIndexDecision(tool);
  const shouldIndex = indexDecision.shouldIndex;
  const resolvedCanonical = indexDecision.canonicalPath;

  return {
    title: seoTitle,
    description: seoDescription,
    keywords: seoKeywords,
    robots: shouldIndex ? { index: true, follow: true } : { index: false, follow: false },
    alternates: { canonical: resolvedCanonical },
    openGraph: {
      title: seoTitle,
      description: seoDescription,
      url: `${baseUrl}${resolvedCanonical}`,
      type: 'website',
    },
  };
}

export default async function ToolPage({ params }: PageProps) {
  const { slug: rawSlug } = await params;
  const slug = normalizeToolSlug(rawSlug);
  const [cmsTool, dbTool] = await Promise.all([
    getCmsToolBySlug(slug, { includeDrafts: true }),
    getToolBySlug(slug)
  ]);

  if (!cmsTool) {
    return notFound();
  }

  const tool = {
    ...cmsTool,
    requiredClouds: dbTool?.requiredClouds ?? [],
    requiredTier: dbTool?.requiredTier ?? 'free',
  };

  const hasEngine = isEngineSupported(tool.engine);
  
  const pillar = tool.pillarSlug ? await getPillarBySlug(tool.pillarSlug) : null;
  const baseUrl = getSiteUrl();
  const toolUrl = `${baseUrl}/tools/${tool.slug}`;

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: baseUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Tools',
        item: `${baseUrl}/tools`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: tool.name,
        item: toolUrl,
      },
    ],
  };

  const softwareSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: tool.name,
    applicationCategory: 'WebApplication',
    operatingSystem: 'Web Browser',
    description: tool.description,
    url: toolUrl,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    publisher: {
      '@type': 'Organization',
      name: 'VCM Suite',
      url: baseUrl,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />
      <div className="max-w-4xl mx-auto px-4 pt-6">
        <ToolBreadcrumb 
          toolName={tool.name} 
          pillar={pillar ? { slug: pillar.slug, title: pillar.title } : null} 
        />
      </div>
      <ToolPageClient tool={tool} hasEngine={hasEngine} />
      <ToolInterlinks
        currentSlug={tool.slug}
        toolName={tool.name}
        interlinkParent={tool.interlinkParent}
        interlinkSiblings={tool.interlinkSiblings}
        interlinkTools={tool.interlinkTools}
      />
      <div className="px-4 pb-12">
        <FreeToolsBlock currentSlug={tool.slug} />
      </div>
    </>
  );
}
