import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { getCmsToolBySlug } from '@/lib/cms/getCmsToolBySlug';
import { getPillarBySlug } from '@/lib/cms/getPillarBySlug';
import { isEngineSupported } from '@/lib/engineRegistry';
import ToolPageClient from './ToolPageClient';
import { FreeToolsBlock } from '@/components/FreeToolsBlock';
import { ToolBreadcrumb } from '@/components/tools/ToolBreadcrumb';
import UpgradeWall from '@/components/entitlements/UpgradeWall';
import { getServerGate } from '@/lib/entitlements/getServerGate';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const tool = await getCmsToolBySlug(slug, { includeDrafts: false });

  if (!tool) {
    return { title: 'Tool Not Found | VCM Suite' };
  }

  const seoTitle = tool.seo?.metaTitle || `${tool.name} | Free Creator Tool | VCM Suite`;
  const seoDescription = tool.seo?.metaDescription || tool.description || `Use ${tool.name} for free. Part of VCM Suite creator tools.`;
  const seoKeywords = tool.seo?.keywords?.join(', ');

  return {
    title: seoTitle,
    description: seoDescription,
    keywords: seoKeywords,
    openGraph: {
      title: tool.name,
      description: seoDescription,
      type: 'website',
    },
  };
}

export default async function ToolPage({ params }: PageProps) {
  const { slug } = await params;
  const tool = await getCmsToolBySlug(slug, { includeDrafts: true });

  if (!tool) {
    return notFound();
  }

  const { gate } = await getServerGate({ slug });
  
  if (!gate.allowed) {
    return (
      <UpgradeWall
        gate={gate}
        toolName={tool.name}
        toolDescription={tool.description}
      />
    );
  }

  const hasEngine = isEngineSupported(tool.engine);
  
  const pillar = tool.pillarSlug ? await getPillarBySlug(tool.pillarSlug) : null;

  return (
    <>
      <div className="max-w-4xl mx-auto px-4 pt-6">
        <ToolBreadcrumb 
          toolName={tool.name} 
          pillar={pillar ? { slug: pillar.slug, title: pillar.title } : null} 
        />
      </div>
      <ToolPageClient tool={tool} hasEngine={hasEngine} />
      <div className="px-4 pb-12">
        <FreeToolsBlock currentSlug={tool.slug} />
      </div>
    </>
  );
}
