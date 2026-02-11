"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, X, ArrowRight } from "lucide-react";
import { getToolUI } from "@/lib/ui/get-tool-ui";

const tools = [
  { 
    name: "Prediction Center", 
    description: "Submit predictions about future events and vote YES or NO. See what the crowd thinks.",
    slug: "prediction-center",
    href: "/tools/prediction-center",
    category: "Community",
    engine: "community"
  },
  { 
    name: "Calorie Deficit Calculator", 
    description: "Snap your food + Health app screenshot to see today's calorie surplus or deficit.",
    slug: "calorie-deficit-calculator",
    href: "/tools/calorie-deficit-calculator",
    category: "AI",
    engine: "ai-analysis"
  },
  { 
    name: "Outfit Ideas Generator", 
    description: "Upload outfit photos and find similar items to shop with AI.",
    slug: "outfit-ideas",
    href: "/tools/outfit-ideas",
    category: "AI",
    engine: "outfit"
  },
  { 
    name: "AI Thumbnail Coach", 
    description: "Analyze and optimize your YouTube thumbnails with AI.",
    slug: "ai-thumbnail-coach",
    href: "/tools/ai-thumbnail-coach",
    category: "AI",
    engine: "ai-analysis"
  },
  { 
    name: "Logo Generator", 
    description: "Create AI-powered logos for your brand in seconds.",
    slug: "logo-generator",
    href: "/tools/logo-generator",
    category: "AI",
    engine: "ai-generate"
  },
  { 
    name: "Resource Box", 
    description: "Create shareable link collections for your bio.",
    slug: "resource-box",
    href: "/tools/resource-box",
    category: "Social",
    engine: "standalone"
  },
  { 
    name: "GIF Compressor", 
    description: "Compress GIF files to reduce size while maintaining quality.",
    slug: "gif-compressor",
    href: "/tools/gif-compressor",
    category: "Image",
    engine: "image-compress"
  },
  { 
    name: "GIF Maker", 
    description: "Convert video or images to GIF directly in your browser.",
    slug: "gif-maker",
    href: "/tools/gif-maker",
    category: "Image",
    engine: "image-convert"
  },
  { 
    name: "HEIC to JPG Converter", 
    description: "Convert iPhone HEIC photos to JPG format online. Free, private, no upload.",
    slug: "heic-to-jpg",
    href: "/tools/heic-to-jpg",
    category: "Image",
    engine: "image-convert"
  },
  {
    name: "M4A to MP3 Conversion",
    description: "Convert M4A audio to MP3 online with bitrate options and instant download.",
    slug: "m4a-to-mp3-conversion",
    href: "/tools/m4a-to-mp3-conversion",
    category: "Audio",
    engine: "file-convert"
  },
  { 
    name: "Image Compressor", 
    description: "Compress JPG, PNG, and WebP images with smart optimization.",
    slug: "image-compressor",
    href: "/tools/image-compressor",
    category: "Image",
    engine: "image-compress"
  },
  { 
    name: "Social Media Image Sizes", 
    description: "Complete guide to image dimensions for all social platforms with free resizer tools.",
    slug: "social-media-image-sizes",
    href: "/tools/social-media-image-sizes",
    category: "Image",
    engine: "static"
  },
  { 
    name: "YouTube Thumbnail Resizer", 
    description: "Resize any image to the perfect YouTube thumbnail size (1280×720).",
    slug: "youtube-thumbnail-resizer",
    href: "/tools/youtube-thumbnail-resizer",
    category: "Social",
    engine: "platform-resizer"
  },
  { 
    name: "Instagram Post Resizer", 
    description: "Resize images to the perfect Instagram post size (1080×1080).",
    slug: "instagram-post-resizer",
    href: "/tools/instagram-post-resizer",
    category: "Social",
    engine: "platform-resizer"
  },
  { 
    name: "Instagram Story Resizer", 
    description: "Resize images to the perfect Instagram Story size (1080×1920).",
    slug: "instagram-story-resizer",
    href: "/tools/instagram-story-resizer",
    category: "Social",
    engine: "platform-resizer"
  },
  { 
    name: "TikTok Cover Resizer", 
    description: "Resize images to the perfect TikTok video cover size (1080×1920).",
    slug: "tiktok-video-resizer",
    href: "/tools/tiktok-video-resizer",
    category: "Social",
    engine: "platform-resizer"
  },
  { 
    name: "Twitter/X Header Resizer", 
    description: "Resize images to the perfect Twitter/X header size (1500×500).",
    slug: "twitter-header-resizer",
    href: "/tools/twitter-header-resizer",
    category: "Social",
    engine: "platform-resizer"
  },
  { 
    name: "LinkedIn Banner Resizer", 
    description: "Resize images to the perfect LinkedIn banner size (1584×396).",
    slug: "linkedin-banner-resizer",
    href: "/tools/linkedin-banner-resizer",
    category: "Social",
    engine: "platform-resizer"
  },
  { 
    name: "PDF Editor", 
    description: "Upload, rearrange, rotate, delete pages, and download your edited PDF.",
    slug: "pdf-editor",
    href: "/tools/pdf-editor",
    category: "Utilities",
    engine: "file-edit"
  },
  { 
    name: "Online Notepad", 
    description: "Write notes online with auto-save and AI-powered writing tools.",
    slug: "online-notepad",
    href: "/tools/online-notepad",
    category: "Writing",
    engine: "standalone"
  },
  { 
    name: "Word Counter", 
    description: "Count words, characters, sentences, and reading time.",
    slug: "word-counter",
    href: "/tools/word-counter",
    category: "Writing",
    engine: "text-analysis"
  },
  { 
    name: "Keyword Finder", 
    description: "Find low-competition SEO keywords for your content.",
    slug: "keyword-finder",
    href: "/tools/keyword-finder",
    category: "SEO",
    engine: "ai-analysis"
  },
  { 
    name: "Reach Grabber Tool", 
    description: "AI-powered SEO optimizer for your blog posts and articles.",
    slug: "reach-grabber-tool",
    href: "/tools/reach-grabber-tool",
    category: "SEO",
    engine: "ai-analysis"
  },
  { 
    name: "AI Humanizer Free", 
    description: "Detect AI-written content and humanize it to sound natural.",
    slug: "ai-humanizer-free",
    href: "/tools/ai-humanizer-free",
    category: "AI",
    engine: "ai-analysis"
  },
  { 
    name: "Producer Tag Generator", 
    description: "Create custom AI voice tags for your beats and instrumentals.",
    slug: "producer-tag-generator",
    href: "/tools/producer-tag-generator",
    category: "Audio",
    engine: "ai-generate"
  },
  { 
    name: "Ad Copy Analyzer", 
    description: "Analyze any ad copy and get scores, insights, and improved versions.",
    slug: "ad-copy-analyzer",
    href: "/tools/ad-copy-analyzer",
    category: "Marketing",
    engine: "ai-analysis"
  },
  { 
    name: "Internal Link Audit", 
    description: "Find orphan pages and weak internal links to improve your SEO.",
    slug: "internal-link-seo-audit",
    href: "/tools/internal-link-seo-audit",
    category: "SEO",
    engine: "ai-analysis"
  },
  { 
    name: "AI Summarizer", 
    description: "Summarize any text and extract key takeaways instantly.",
    slug: "summarizer",
    href: "/tools/summarizer",
    category: "Writing",
    engine: "ai-analysis"
  },
  { 
    name: "Visualization Tool", 
    description: "Turn text into flowcharts, diagrams, and visual maps.",
    slug: "visualization",
    href: "/tools/visualization",
    category: "Design",
    engine: "ai-generate"
  },
  { 
    name: "Emoji Combos", 
    description: "Copy aesthetic emoji combinations for your social bios.",
    slug: "emoji-combos",
    href: "/tools/emoji-combos",
    category: "Social",
    engine: "community"
  },
  { 
    name: "Horoscope of the Day", 
    description: "Get your personalized AI-powered daily horoscope reading.",
    slug: "horoscope-of-the-day",
    href: "/tools/horoscope-of-the-day",
    category: "Lifestyle",
    engine: "ai-generate"
  },
  { 
    name: "Self-Love Affirmations", 
    description: "Daily AI-generated affirmations for self-love and confidence.",
    slug: "affirmation-about-self-love",
    href: "/tools/affirmation-about-self-love",
    category: "Lifestyle",
    engine: "ai-generate"
  },
  { 
    name: "Photo Gallery Maker", 
    description: "Create multi-photo gallery layouts with grid, masonry, or horizontal strip options.",
    slug: "photo-gallery-maker",
    href: "/tools/photo-gallery-maker",
    category: "Image",
    engine: "standalone"
  },
  { 
    name: "YouTube Title Split-Test", 
    description: "A/B test your YouTube video titles with auto-rotation and CTR tracking.",
    slug: "youtube-title-split-test",
    href: "/tools/youtube-title-split-test",
    category: "Social",
    engine: "standalone"
  },
  { 
    name: "Name Combiner", 
    description: "Combine 2-3 names into creative mashups for couples or groups.",
    slug: "name-combiner",
    href: "/tools/name-combiner",
    category: "Social",
    engine: "text-transform"
  },
];

const allCategories = [...new Set(tools.map(t => t.category))];

export default function ToolsClient() {
  const [searchQuery, setSearchQuery] = useState("");
  
  const filteredTools = useMemo(() => {
    if (!searchQuery.trim()) return tools;
    const query = searchQuery.toLowerCase();
    return tools.filter(tool => 
      tool.name.toLowerCase().includes(query) ||
      tool.description.toLowerCase().includes(query) ||
      tool.category.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const categories = useMemo(() => {
    if (!searchQuery.trim()) return allCategories;
    return [...new Set(filteredTools.map(t => t.category))];
  }, [searchQuery, filteredTools]);

  const clearSearch = () => {
    setSearchQuery("");
  };
  
  return (
    <>
      <div className="mb-10">
        <div className="relative max-w-lg mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tools..."
            className="w-full pl-12 pr-12 py-4 rounded-full border border-gray-200 bg-gray-50 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 focus:bg-white transition-all text-base shadow-sm"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        {searchQuery && (
          <p className="text-center text-sm text-gray-500 mt-3">
            {filteredTools.length} {filteredTools.length === 1 ? 'tool' : 'tools'} found
          </p>
        )}
      </div>

      {filteredTools.length > 0 ? (
        categories.map((category) => {
          const categoryTools = filteredTools.filter(t => t.category === category);
          if (categoryTools.length === 0) return null;
          
          return (
            <div key={category} className="mb-12">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                {category}
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryTools.map((tool) => {
                  const { icon: Icon, bg } = getToolUI({ slug: tool.slug, engine: tool.engine });
                  return (
                    <Link 
                      key={tool.name} 
                      href={tool.href}
                      className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-orange-400 hover:shadow-lg transition-all group"
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 group-hover:text-orange-500 transition-colors mb-1">
                            {tool.name}
                          </h3>
                          <p className="text-sm text-gray-600 line-clamp-2">{tool.description}</p>
                        </div>
                      </div>
                      <div className="mt-4 flex justify-end">
                        <span className="text-orange-500 text-sm font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          Use Tool <ArrowRight className="w-4 h-4" />
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })
      ) : (
        <div className="text-center py-16">
          <p className="text-gray-500 text-lg">No tools found matching "{searchQuery}"</p>
          <button
            onClick={clearSearch}
            className="mt-4 text-orange-500 hover:text-orange-600 font-medium"
          >
            Clear search
          </button>
        </div>
      )}
    </>
  );
}
