"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Search, X, Wrench, FileImage, FileText, MessageCircleQuestion, Sparkles, Crosshair, Palette, Type, Mic, Youtube, Box, Flame, FileArchive, Vote, Rocket, ShoppingBag, HeartHandshake, FilePen, RotateCcw, Smile, Moon, Merge, LayoutGrid, Instagram, Twitter, Linkedin, Video, Zap, StickyNote, Network, FileBarChart, Film, Ruler, Workflow, ListCollapse } from "lucide-react";

interface FeaturedTool {
  slug: string;
  title: string;
  engine: string;
}

const defaultTools = [
  { slug: "zip-file-creator", title: "ZIP File Creator", engine: "file-utility" },
  { slug: "prediction-center", title: "Prediction Center", engine: "community" },
  { slug: "calorie-deficit-calculator", title: "Calorie Deficit Calculator", engine: "calorie-calculator" },
  { slug: "ai-thumbnail-coach", title: "Thumbnail Coach", engine: "ai-analysis" },
  { slug: "gif-compressor", title: "GIF Compressor", engine: "file-utility" },
  { slug: "gif-maker", title: "GIF Maker", engine: "file-utility" },
  { slug: "heic-to-jpg", title: "HEIC to JPG", engine: "file-utility" },
  { slug: "image-compressor", title: "Image Compressor", engine: "file-utility" },
  { slug: "online-notepad", title: "Online Notepad", engine: "file-utility" },
  { slug: "word-counter", title: "Word Counter", engine: "word-counter" },
  { slug: "logo-generator", title: "Logo Generator", engine: "logo-generator" },
  { slug: "keyword-finder", title: "Keyword Finder", engine: "ai-analysis" },
  { slug: "reach-grabber-tool", title: "Reach Grabber", engine: "reach-grabber" },
  { slug: "ai-humanizer-free", title: "AI Humanizer", engine: "ai-analysis" },
  { slug: "producer-tag-generator", title: "Producer Tag", engine: "producer-tag" },
  { slug: "ad-copy-analyzer", title: "Ad Copy Analyzer", engine: "ai-analysis" },
  { slug: "summarizer", title: "AI Summarizer", engine: "ai-analysis" },
  { slug: "emoji-combos", title: "Emoji Combos", engine: "community" },
  { slug: "horoscope-of-the-day", title: "Daily Horoscope", engine: "ai-generate" },
  { slug: "youtube-title-split-test", title: "YouTube Title Split-Test", engine: "youtube-tool" },
];

const toolIcons: Record<string, { icon: React.ComponentType<{ className?: string }>; bg: string }> = {
  "zip-file-creator": { icon: FileArchive, bg: "bg-sky-500" },
  "prediction-center": { icon: Vote, bg: "bg-fuchsia-500" },
  "calorie-deficit-calculator": { icon: Flame, bg: "bg-green-500" },
  "ai-thumbnail-coach": { icon: Sparkles, bg: "bg-indigo-500" },
  "gif-compressor": { icon: Zap, bg: "bg-yellow-500" },
  "gif-maker": { icon: Film, bg: "bg-pink-600" },
  "heic-to-jpg": { icon: RotateCcw, bg: "bg-rose-500" },
  "image-compressor": { icon: FileImage, bg: "bg-sky-500" },
  "online-notepad": { icon: StickyNote, bg: "bg-amber-500" },
  "word-counter": { icon: Type, bg: "bg-gray-500" },
  "logo-generator": { icon: Palette, bg: "bg-pink-500" },
  "keyword-finder": { icon: Search, bg: "bg-blue-500" },
  "reach-grabber-tool": { icon: Crosshair, bg: "bg-red-400" },
  "ai-humanizer-free": { icon: Palette, bg: "bg-indigo-500" },
  "producer-tag-generator": { icon: Mic, bg: "bg-purple-600" },
  "ad-copy-analyzer": { icon: FileBarChart, bg: "bg-sky-600" },
  "summarizer": { icon: ListCollapse, bg: "bg-slate-500" },
  "emoji-combos": { icon: Smile, bg: "bg-yellow-400" },
  "horoscope-of-the-day": { icon: Moon, bg: "bg-indigo-400" },
  "youtube-title-split-test": { icon: RotateCcw, bg: "bg-red-500" },
  "youtube-thumbnail-resizer": { icon: Youtube, bg: "bg-red-500" },
  "youtube-thumbnail-analyzer": { icon: Youtube, bg: "bg-red-400" },
  "calorie-counter-bmi": { icon: HeartHandshake, bg: "bg-rose-500" },
  "internal-link-seo-audit": { icon: Network, bg: "bg-lime-500" },
  "facebook-thumbnail-analyzer": { icon: Crosshair, bg: "bg-blue-500" },
  "resource-box": { icon: Box, bg: "bg-orange-600" },
  "social-media-image-sizes": { icon: Ruler, bg: "bg-violet-500" },
  "photo-gallery-maker": { icon: LayoutGrid, bg: "bg-blue-400" },
  "name-combiner": { icon: Merge, bg: "bg-teal-400" },
  "affirmation-about-self-love": { icon: HeartHandshake, bg: "bg-rose-400" },
  "visualization": { icon: Workflow, bg: "bg-cyan-600" },
  "maker-quotes-generator": { icon: Sparkles, bg: "bg-amber-400" },
  "instagram-bio-analyzer": { icon: Instagram, bg: "bg-pink-500" },
  "instagram-cta-analyzer": { icon: Instagram, bg: "bg-fuchsia-400" },
  "instagram-caption-analyzer": { icon: Instagram, bg: "bg-fuchsia-500" },
  "instagram-hashtags-analyzer": { icon: Instagram, bg: "bg-purple-500" },
  "instagram-hook-analyzer": { icon: Instagram, bg: "bg-rose-500" },
  "instagram-thumbnail-analyzer": { icon: Instagram, bg: "bg-orange-500" },
  "linkedin-bio-analyzer": { icon: Linkedin, bg: "bg-blue-600" },
  "linkedin-cta-analyzer": { icon: Linkedin, bg: "bg-indigo-500" },
  "linkedin-caption-analyzer": { icon: Linkedin, bg: "bg-sky-500" },
  "linkedin-hashtags-analyzer": { icon: Linkedin, bg: "bg-cyan-500" },
  "linkedin-hook-analyzer": { icon: Linkedin, bg: "bg-teal-500" },
  "tiktok-cta-analyzer": { icon: Video, bg: "bg-gray-800" },
  "tiktok-caption-analyzer": { icon: Video, bg: "bg-violet-500" },
  "tiktok-hashtags-analyzer": { icon: Video, bg: "bg-pink-500" },
  "tiktok-hook-analyzer": { icon: Video, bg: "bg-cyan-500" },
  "tiktok-thumbnail-analyzer": { icon: Video, bg: "bg-red-500" },
  "twitter-bio-analyzer": { icon: Twitter, bg: "bg-sky-400" },
  "twitter-cta-analyzer": { icon: Twitter, bg: "bg-blue-500" },
  "twitter-caption-analyzer": { icon: Twitter, bg: "bg-indigo-500" },
};

const engineIcons: Record<string, { icon: React.ComponentType<{ className?: string }>; bg: string }> = {
  "platform-resizer": { icon: FileImage, bg: "bg-purple-500" },
  "ai-analysis": { icon: Sparkles, bg: "bg-indigo-500" },
  "ai-generate": { icon: Moon, bg: "bg-violet-500" },
  "file-utility": { icon: FileArchive, bg: "bg-sky-500" },
  "calorie-calculator": { icon: Flame, bg: "bg-green-500" },
  "outfit-engine": { icon: ShoppingBag, bg: "bg-pink-500" },
  "community": { icon: Vote, bg: "bg-fuchsia-500" },
  "word-counter": { icon: Type, bg: "bg-gray-500" },
  "logo-generator": { icon: Palette, bg: "bg-pink-500" },
  "producer-tag": { icon: Mic, bg: "bg-purple-600" },
  "youtube-tool": { icon: Youtube, bg: "bg-red-500" },
  "resource-box": { icon: Box, bg: "bg-orange-600" },
  "reach-grabber": { icon: Crosshair, bg: "bg-red-400" },
  "default": { icon: Wrench, bg: "bg-orange-500" },
};

function getIconForTool(slug: string, engine: string) {
  return toolIcons[slug] || engineIcons[engine] || engineIcons["default"];
}

const ITEMS_PER_PAGE = 24;

export default function FreeToolsCarousel() {
  const [tools, setTools] = useState<FeaturedTool[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  
  useEffect(() => {
    async function loadTools() {
      try {
        const res = await fetch("/api/featured-tools");
        const data = await res.json();
        const featuredTools = data.tools || [];
        setTools(featuredTools.length > 0 ? featuredTools : defaultTools);
      } catch (error) {
        console.error("Failed to load featured tools:", error);
        setTools(defaultTools);
      } finally {
        setIsLoading(false);
      }
    }
    loadTools();
  }, []);

  const filteredTools = useMemo(() => {
    if (!searchQuery.trim()) return tools;
    const query = searchQuery.toLowerCase();
    return tools.filter(tool => 
      tool.title.toLowerCase().includes(query)
    );
  }, [searchQuery, tools]);
  
  const totalPages = Math.ceil(filteredTools.length / ITEMS_PER_PAGE);
  const startIndex = currentPage * ITEMS_PER_PAGE;
  const currentTools = filteredTools.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  
  const goToPrev = () => {
    if (currentPage > 0) setCurrentPage(currentPage - 1);
  };
  
  const goToNext = () => {
    if (currentPage < totalPages - 1) setCurrentPage(currentPage + 1);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setCurrentPage(0);
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full mx-auto" />
        <p className="text-gray-500 mt-4">Loading tools...</p>
      </div>
    );
  }

  
  return (
    <div className="relative">
      <div className="mb-6">
        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(0);
            }}
            placeholder="Search tools..."
            className="w-full pl-12 pr-10 py-3 rounded-full border border-gray-200 bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all"
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
          <p className="text-center text-sm text-gray-500 mt-2">
            {filteredTools.length} {filteredTools.length === 1 ? 'tool' : 'tools'} found
          </p>
        )}
      </div>

      {currentTools.length > 0 ? (
        <div 
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4 transition-opacity duration-300"
        >
          {currentTools.map((tool) => {
            const { icon: Icon, bg } = getIconForTool(tool.slug, tool.engine);
            return (
              <Link 
                key={tool.slug} 
                href={`/tools/${tool.slug}`}
                className="bg-white rounded-2xl p-5 md:p-6 border border-gray-200 hover:border-orange-400 hover:shadow-lg transition-all text-center group"
              >
                <div className={`w-14 h-14 md:w-16 md:h-16 ${bg} rounded-xl flex items-center justify-center mx-auto mb-3 transition-transform group-hover:scale-110`}>
                  <Icon className="w-7 h-7 md:w-8 md:h-8 text-white" />
                </div>
                <span className="text-sm md:text-base font-medium text-gray-800 line-clamp-2">{tool.title}</span>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500">No tools found matching "{searchQuery}"</p>
          <button
            onClick={clearSearch}
            className="mt-3 text-orange-500 hover:text-orange-600 text-sm font-medium"
          >
            Clear search
          </button>
        </div>
      )}
      
      {totalPages > 1 && !searchQuery && (
        <div className="flex items-center justify-center gap-4 mt-8">
          <button
            onClick={goToPrev}
            disabled={currentPage === 0}
            className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all ${
              currentPage === 0
                ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                : 'border-gray-300 text-gray-600 hover:border-orange-400 hover:text-orange-500 hover:bg-orange-50'
            }`}
            aria-label="Previous page"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentPage(index)}
                className={`h-2.5 rounded-full transition-all ${
                  currentPage === index 
                    ? 'w-8 bg-orange-500' 
                    : 'w-2.5 bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`Go to page ${index + 1}`}
              />
            ))}
          </div>
          
          <button
            onClick={goToNext}
            disabled={currentPage === totalPages - 1}
            className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all ${
              currentPage === totalPages - 1
                ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                : 'border-gray-300 text-gray-600 hover:border-orange-400 hover:text-orange-500 hover:bg-orange-50'
            }`}
            aria-label="Next page"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
