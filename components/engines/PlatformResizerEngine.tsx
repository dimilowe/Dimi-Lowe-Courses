'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, Upload, Download, Image as ImageIcon, Loader2, 
  AlertCircle, CheckCircle, ChevronDown, ChevronUp, ArrowRight,
  Flame, Bell, QrCode, BookOpen, Youtube, Instagram, Video, Linkedin
} from 'lucide-react';
import { ToolForRenderer } from '@/lib/cms/getCmsToolBySlug';
import { PRESETS_BY_SLUG, PlatformImagePreset, platformImagePresets } from '@/data/platformImagePresets';
import { useUIStore } from '@/lib/state/uiStore';

interface PlatformResizerEngineProps {
  tool: ToolForRenderer;
}

const PLATFORM_ICONS: Record<string, React.ElementType> = {
  youtube: Youtube,
  instagram: Instagram,
  tiktok: Video,
  twitter: () => <span className="font-bold text-sm">X</span>,
  linkedin: Linkedin,
};

const PLATFORM_COLORS: Record<string, string> = {
  youtube: 'from-red-500 to-red-600',
  instagram: 'from-pink-500 to-purple-600',
  tiktok: 'from-gray-900 to-gray-800',
  twitter: 'from-sky-500 to-sky-600',
  linkedin: 'from-blue-600 to-blue-700',
};

interface FAQ {
  question: string;
  answer: string;
}

function FAQItem({ faq, isOpen, onToggle }: { faq: FAQ; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border-b border-gray-200 last:border-0">
      <button
        onClick={onToggle}
        className="w-full py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors px-1"
      >
        <span className="font-medium text-gray-900 pr-4">{faq.question}</span>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
        )}
      </button>
      {isOpen && (
        <div className="pb-4 px-1 text-gray-600 text-sm leading-relaxed">
          {faq.answer}
        </div>
      )}
    </div>
  );
}

function FAQSection({ faqs }: { faqs: FAQ[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="mt-10">
      <h2 className="text-xl font-bold text-gray-900 mb-4">
        Frequently Asked Questions
      </h2>
      <div className="bg-white rounded-xl border p-4">
        {faqs.map((faq, index) => (
          <FAQItem
            key={index}
            faq={faq}
            isOpen={openIndex === index}
            onToggle={() => setOpenIndex(openIndex === index ? null : index)}
          />
        ))}
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: faqs.map((faq) => ({
              '@type': 'Question',
              name: faq.question,
              acceptedAnswer: {
                '@type': 'Answer',
                text: faq.answer,
              },
            })),
          }),
        }}
      />
    </section>
  );
}

function PlatformGuide({ content }: { content: string }) {
  const renderMarkdown = (text: string) => {
    const lines = text.trim().split('\n');
    const elements: React.ReactNode[] = [];
    let currentList: string[] = [];
    let inBoldSection = false;
    let boldSectionTitle = '';
    let boldSectionItems: string[] = [];

    const flushList = () => {
      if (currentList.length > 0) {
        elements.push(
          <ul key={`list-${elements.length}`} className="space-y-1 mb-4 ml-4">
            {currentList.map((item, i) => (
              <li key={i} className="text-gray-600 text-sm flex items-start gap-2">
                <span className="text-orange-500 mt-0.5">•</span>
                <span dangerouslySetInnerHTML={{ __html: formatBold(item) }} />
              </li>
            ))}
          </ul>
        );
        currentList = [];
      }
    };

    const flushBoldSection = () => {
      if (boldSectionTitle && boldSectionItems.length > 0) {
        elements.push(
          <div key={`bold-section-${elements.length}`} className="mb-4">
            <p className="font-semibold text-gray-800 mb-2">{boldSectionTitle}</p>
            <ul className="space-y-1 ml-4">
              {boldSectionItems.map((item, i) => (
                <li key={i} className="text-gray-600 text-sm flex items-start gap-2">
                  <span className="text-orange-500 mt-0.5">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        );
        boldSectionTitle = '';
        boldSectionItems = [];
        inBoldSection = false;
      }
    };

    const formatBold = (text: string) => {
      return text.replace(/\*\*([^*]+)\*\*/g, '<strong class="text-gray-800">$1</strong>');
    };

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      if (trimmedLine.startsWith('## ')) {
        flushList();
        flushBoldSection();
        elements.push(
          <h2 key={`h2-${index}`} className="text-xl font-bold text-gray-900 mb-4 mt-6 first:mt-0">
            {trimmedLine.replace('## ', '')}
          </h2>
        );
      } else if (trimmedLine.startsWith('### ')) {
        flushList();
        flushBoldSection();
        elements.push(
          <h3 key={`h3-${index}`} className="text-lg font-semibold text-gray-800 mb-3 mt-5">
            {trimmedLine.replace('### ', '')}
          </h3>
        );
      } else if (trimmedLine.match(/^\*\*[^*]+:\*\*$/)) {
        flushList();
        flushBoldSection();
        boldSectionTitle = trimmedLine.replace(/\*\*/g, '');
        inBoldSection = true;
      } else if (trimmedLine.startsWith('- ') && inBoldSection) {
        boldSectionItems.push(trimmedLine.replace('- ', ''));
      } else if (trimmedLine.startsWith('- ')) {
        flushBoldSection();
        currentList.push(trimmedLine.replace('- ', ''));
      } else if (trimmedLine === '') {
        flushList();
        if (!inBoldSection) flushBoldSection();
      } else {
        flushList();
        flushBoldSection();
        elements.push(
          <p 
            key={`p-${index}`} 
            className="text-gray-600 text-sm leading-relaxed mb-3"
            dangerouslySetInnerHTML={{ __html: formatBold(trimmedLine) }}
          />
        );
      }
    });

    flushList();
    flushBoldSection();
    return elements;
  };

  return (
    <section className="mt-10 bg-white rounded-xl border p-6 md:p-8">
      <div className="prose prose-sm max-w-none">
        {renderMarkdown(content)}
      </div>
    </section>
  );
}

function RelatedResizers({ currentSlug, relatedSlugs }: { currentSlug: string; relatedSlugs: string[] }) {
  const relatedPresets = relatedSlugs
    .filter(slug => slug !== currentSlug)
    .map(slug => PRESETS_BY_SLUG[slug])
    .filter(Boolean)
    .slice(0, 5);

  if (relatedPresets.length === 0) {
    const fallbackPresets = platformImagePresets.filter(p => p.slug !== currentSlug).slice(0, 5);
    return <RelatedResizersGrid presets={fallbackPresets} />;
  }

  return <RelatedResizersGrid presets={relatedPresets} />;
}

function RelatedResizersGrid({ presets }: { presets: PlatformImagePreset[] }) {
  return (
    <section className="mt-10">
      <h2 className="text-xl font-bold text-gray-900 mb-4">
        More Image Resizers
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {presets.map((preset) => {
          const IconComponent = PLATFORM_ICONS[preset.platformId] || ImageIcon;
          const bgColor = PLATFORM_COLORS[preset.platformId] || 'from-gray-500 to-gray-600';

          return (
            <Link
              key={preset.slug}
              href={`/tools/${preset.slug}`}
              className="flex flex-col items-center p-4 bg-white border border-gray-200 rounded-xl hover:border-orange-300 hover:shadow-md transition-all group"
            >
              <div className={`w-10 h-10 bg-gradient-to-br ${bgColor} rounded-lg flex items-center justify-center mb-2`}>
                <IconComponent className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm font-medium text-gray-800 text-center group-hover:text-orange-600">
                {preset.name.replace(' Resizer', '')}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {preset.width}×{preset.height}
              </p>
            </Link>
          );
        })}
      </div>
      <div className="mt-4 text-center">
        <Link
          href="/tools/social-media-image-sizes"
          className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium text-sm"
        >
          View all social media image sizes
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}

function RelatedArticles({ articleSlugs }: { articleSlugs: string[] }) {
  if (articleSlugs.length === 0) return null;

  const articles = articleSlugs.map(slug => ({
    slug,
    title: slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  }));

  return (
    <section className="mt-10">
      <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <BookOpen className="w-5 h-5 text-orange-500" />
        Related Guides
      </h2>
      <div className="space-y-3">
        {articles.map((article) => (
          <Link
            key={article.slug}
            href={`/mbb/${article.slug}`}
            className="block p-4 bg-white border rounded-lg hover:border-orange-300 hover:shadow-sm transition-all group"
          >
            <span className="font-medium text-gray-800 group-hover:text-orange-700">
              {article.title}
            </span>
            <span className="block text-xs text-gray-400 mt-1">Read guide →</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function PostResultUpsell({ platformId }: { platformId: string }) {
  return (
    <div className="mt-10 p-6 bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 border border-orange-200 rounded-2xl">
      <div className="flex items-center gap-2 mb-4">
        <Flame className="w-5 h-5 text-orange-500" />
        <h3 className="text-lg font-bold text-gray-900">Turn This Image Into Real Engagement</h3>
      </div>
      <p className="text-gray-600 text-sm mb-4">
        A perfectly sized image is just the start. Maximize your reach with tools designed to boost clicks and conversions.
      </p>
      
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white/80 backdrop-blur rounded-xl p-4 border border-orange-100">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Nudge</h4>
              <p className="text-sm text-gray-600 mt-1">
                Boost CTR with smart overlays that guide viewers to click.
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white/80 backdrop-blur rounded-xl p-4 border border-orange-100">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <QrCode className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">QR Social</h4>
              <p className="text-sm text-gray-600 mt-1">
                Capture every viewer with one universal QR identity.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/products/nudge"
          className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium rounded-xl transition-all group shadow-md hover:shadow-lg"
        >
          Try Nudge
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </Link>
        <Link
          href="/products/qrsocial"
          className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-medium rounded-xl transition-all group shadow-md hover:shadow-lg"
        >
          Get QR Social
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
}

function ToolSchema({ tool, preset }: { tool: ToolForRenderer; preset: PlatformImagePreset }) {
  const toolUrl = `https://vcmsuite.com/tools/${tool.slug}`;
  
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: tool.name || preset.name,
    description: tool.description || preset.seo.description,
    url: toolUrl,
    applicationCategory: 'MultimediaApplication',
    applicationSubCategory: 'Image Editor',
    operatingSystem: 'Any',
    browserRequirements: 'Requires JavaScript. Requires HTML5.',
    featureList: [
      `Resize images to ${preset.width}x${preset.height} pixels`,
      `${preset.aspectRatioLabel} aspect ratio`,
      `Support for ${preset.outputFormats.join(', ').toUpperCase()} formats`,
      'No signup required',
      'Free to use',
      'Works on mobile and desktop',
    ],
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
    publisher: {
      '@type': 'Organization',
      name: 'VCM Suite',
      url: 'https://vcmsuite.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://vcmsuite.com/logo.png',
      },
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '127',
      bestRating: '5',
      worstRating: '1',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

function ResizerUI({ preset }: { preset: PlatformImagePreset }) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [originalPreviewUrl, setOriginalPreviewUrl] = useState<string | null>(null);
  const [resizedBlobUrl, setResizedBlobUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { openAuthModal, openUpgradeModal } = useUIStore();

  const processFile = (file: File) => {
    setError(null);
    setSuccess(false);
    setResizedBlobUrl(null);

    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > preset.maxFileSizeMB) {
      setError(`File too large. Maximum size is ${preset.maxFileSizeMB}MB`);
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setOriginalPreviewUrl(url);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleResize = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setError(null);
    setSuccess(false);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('presetId', preset.id);

      const response = await fetch('/api/platform-image/resize', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        if (response.status === 401 && errorData.error === 'AUTH_REQUIRED') {
          openAuthModal();
          return;
        }
        
        if (response.status === 403 && errorData.error === 'UPGRADE_REQUIRED') {
          openUpgradeModal(errorData.feature || 'export', errorData.requiredTier || 'starter');
          return;
        }
        
        throw new Error(errorData.error || 'Failed to resize image');
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      setResizedBlobUrl(blobUrl);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resize image');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setOriginalPreviewUrl(null);
    setResizedBlobUrl(null);
    setError(null);
    setSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      {!selectedFile ? (
        <label 
          className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-all ${
            isDragging 
              ? 'border-orange-500 bg-orange-50 scale-[1.02]' 
              : 'border-gray-300 hover:border-orange-400 hover:bg-orange-50/50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className={`w-12 h-12 mb-3 transition-colors ${isDragging ? 'text-orange-500' : 'text-gray-400'}`} />
            <p className="mb-2 text-lg font-medium text-gray-700">
              {isDragging ? 'Drop your image here' : 'Drag & drop or click to upload'}
            </p>
            <p className="text-sm text-gray-500">
              PNG, JPG, or WebP up to {preset.maxFileSizeMB}MB
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleFileSelect}
          />
        </label>
      ) : (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                Original Image
              </h3>
              <div className="relative bg-gray-100 rounded-lg overflow-hidden aspect-video flex items-center justify-center">
                {originalPreviewUrl && (
                  <img
                    src={originalPreviewUrl}
                    alt="Original"
                    className="max-w-full max-h-full object-contain"
                  />
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)}MB)
              </p>
            </div>

            <div>
              <h3 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Resized Image ({preset.width}×{preset.height})
              </h3>
              <div 
                className="relative bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center"
                style={{ aspectRatio: `${preset.width}/${preset.height}` }}
              >
                {resizedBlobUrl ? (
                  <img
                    src={resizedBlobUrl}
                    alt="Resized"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-gray-400 text-center p-4">
                    <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Click "Resize" to see preview</p>
                  </div>
                )}
                {preset.ui.showSafeZoneOverlay && resizedBlobUrl && (
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-4 border-2 border-dashed border-white/50 rounded-lg" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 text-green-600 bg-green-50 border border-green-200 rounded-lg p-3">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">Image resized successfully! Click download to save.</p>
            </div>
          )}

          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={handleResize}
              disabled={isProcessing}
              className="flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <ImageIcon className="w-5 h-5" />
                  Resize Image
                </>
              )}
            </button>

            {resizedBlobUrl && (
              <a
                href={resizedBlobUrl}
                download={`${preset.id}-${preset.width}x${preset.height}.jpg`}
                className="flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors"
              >
                <Download className="w-5 h-5" />
                Download Resized Image
              </a>
            )}

            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors"
            >
              Upload New Image
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MissingPresetFallback({ tool }: { tool: ToolForRenderer }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link
          href="/tools"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-orange-600 mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Tools
        </Link>
        
        <div className="bg-white rounded-xl border p-8 text-center">
          <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{tool.name}</h1>
          <p className="text-gray-600">
            This resizer is coming soon. Check back later for this tool.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PlatformResizerEngine({ tool }: PlatformResizerEngineProps) {
  const preset = PRESETS_BY_SLUG[tool.slug];
  
  if (!preset) {
    return <MissingPresetFallback tool={tool} />;
  }

  const IconComponent = PLATFORM_ICONS[preset.platformId] || ImageIcon;
  const gradientColor = PLATFORM_COLORS[preset.platformId] || 'from-orange-500 to-orange-600';

  return (
    <div className="min-h-screen bg-gray-50">
      <ToolSchema tool={tool} preset={preset} />
      
      <div className="max-w-5xl mx-auto px-4 py-12">
        <Link
          href="/tools"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-orange-600 mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Tools
        </Link>

        <article>
          <div className={`bg-gradient-to-r ${gradientColor} rounded-xl px-6 py-8 text-white mb-8`}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <IconComponent className="w-6 h-6" />
              </div>
              <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
                {preset.platformLabel}
              </span>
              <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
                {preset.surfaceLabel}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">{preset.seo.h1}</h1>
            <p className="text-white/90 text-lg max-w-2xl">{preset.seo.intro}</p>
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-white/80">
              <span className="flex items-center gap-1">
                <span className="font-semibold text-white">{preset.width}×{preset.height}</span> pixels
              </span>
              <span>•</span>
              <span>Aspect Ratio: <span className="font-semibold text-white">{preset.aspectRatioLabel}</span></span>
              <span>•</span>
              <span>Max file: <span className="font-semibold text-white">{preset.maxFileSizeMB}MB</span></span>
            </div>
          </div>

          {preset.ui.notes && preset.ui.notes.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-orange-800 mb-2">Pro Tips:</h3>
              <ul className="space-y-1">
                {preset.ui.notes.map((note, index) => (
                  <li key={index} className="text-sm text-orange-700 flex items-start gap-2">
                    <span className="text-orange-500 mt-0.5">•</span>
                    {note}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <ResizerUI preset={preset} />

          <PlatformGuide content={preset.seo.platformGuide} />

          {tool.interlinkParent && (
            <div className="mt-6 p-4 bg-white rounded-lg border text-center">
              <p className="text-sm text-gray-600">
                This tool is part of the{' '}
                <Link
                  href={`/tools/clusters/${tool.interlinkParent}`}
                  className="text-orange-600 hover:text-orange-700 font-medium"
                >
                  {tool.interlinkParent.replace(/-/g, ' ')}
                </Link>{' '}
                topic cluster.
              </p>
            </div>
          )}

          <PostResultUpsell platformId={preset.platformId} />

          <FAQSection faqs={preset.seo.faq} />

          <RelatedResizers currentSlug={tool.slug} relatedSlugs={preset.relatedToolSlugs} />

          <RelatedArticles articleSlugs={preset.relatedArticleSlugs} />
        </article>
      </div>
    </div>
  );
}
