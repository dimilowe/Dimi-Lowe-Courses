"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { 
  FileImage, 
  Type, 
  Palette, 
  Search, 
  GitBranch, 
  Smile, 
  Moon, 
  HeartHandshake,
  ArrowRight,
  Youtube,
  Box,
  Crosshair,
  Mic,
  FileBarChart,
  Network,
  ListCollapse,
  ShoppingBag,
  Flame,
  FilePen,
  StickyNote,
  X,
  Vote,
  LayoutGrid,
  RotateCcw,
  Merge,
  Instagram,
  Twitter,
  Linkedin,
  Video,
  Zap,
  Film,
  Ruler,
  Workflow,
  Sparkles
} from "lucide-react";

const tools = [
  { 
    name: "Prediction Center", 
    description: "Submit predictions about future events and vote YES or NO. See what the crowd thinks.",
    icon: Vote, 
    href: "/tools/prediction-center",
    category: "Community",
    iconBg: "bg-fuchsia-500"
  },
  { 
    name: "Calorie Deficit Calculator", 
    description: "Snap your food + Health app screenshot to see today's calorie surplus or deficit.",
    icon: Flame, 
    href: "/tools/calorie-deficit-calculator",
    category: "AI",
    iconBg: "bg-green-500"
  },
  { 
    name: "Outfit Ideas Generator", 
    description: "Upload outfit photos and find similar items to shop with AI.",
    icon: ShoppingBag, 
    href: "/tools/outfit-ideas",
    category: "AI",
    iconBg: "bg-pink-500"
  },
  { 
    name: "AI Thumbnail Coach", 
    description: "Analyze and optimize your YouTube thumbnails with AI.",
    icon: Youtube, 
    href: "/tools/ai-thumbnail-coach",
    category: "AI",
    iconBg: "bg-red-500"
  },
  { 
    name: "Logo Generator", 
    description: "Create AI-powered logos for your brand in seconds.",
    icon: Palette, 
    href: "/tools/logo-generator",
    category: "AI",
    iconBg: "bg-pink-500"
  },
  { 
    name: "Resource Box", 
    description: "Create shareable link collections for your bio.",
    icon: Box, 
    href: "/tools/resource-box",
    category: "Social",
    iconBg: "bg-orange-600"
  },
  { 
    name: "GIF Compressor", 
    description: "Compress GIF files to reduce size while maintaining quality.",
    icon: Zap, 
    href: "/tools/gif-compressor",
    category: "Image",
    iconBg: "bg-yellow-500"
  },
  { 
    name: "GIF Maker", 
    description: "Convert video or images to GIF directly in your browser.",
    icon: Film, 
    href: "/tools/gif-maker",
    category: "Image",
    iconBg: "bg-pink-600"
  },
  { 
    name: "HEIC to JPG Converter", 
    description: "Convert iPhone HEIC photos to JPG format online. Free, private, no upload.",
    icon: FileImage, 
    href: "/tools/heic-to-jpg",
    category: "Image",
    iconBg: "bg-rose-500"
  },
  { 
    name: "Image Compressor", 
    description: "Compress JPG, PNG, and WebP images with smart optimization.",
    icon: FileImage, 
    href: "/tools/image-compressor",
    category: "Image",
    iconBg: "bg-sky-500"
  },
  { 
    name: "Social Media Image Sizes", 
    description: "Complete guide to image dimensions for all social platforms with free resizer tools.",
    icon: Ruler, 
    href: "/tools/social-media-image-sizes",
    category: "Image",
    iconBg: "bg-violet-500"
  },
  { 
    name: "YouTube Thumbnail Resizer", 
    description: "Resize any image to the perfect YouTube thumbnail size (1280×720).",
    icon: Youtube, 
    href: "/tools/youtube-thumbnail-resizer",
    category: "Social",
    iconBg: "bg-red-500"
  },
  { 
    name: "Instagram Post Resizer", 
    description: "Resize images to the perfect Instagram post size (1080×1080).",
    icon: Instagram, 
    href: "/tools/instagram-post-resizer",
    category: "Social",
    iconBg: "bg-pink-500"
  },
  { 
    name: "Instagram Story Resizer", 
    description: "Resize images to the perfect Instagram Story size (1080×1920).",
    icon: Instagram, 
    href: "/tools/instagram-story-resizer",
    category: "Social",
    iconBg: "bg-gradient-to-r from-purple-500 to-pink-500"
  },
  { 
    name: "TikTok Cover Resizer", 
    description: "Resize images to the perfect TikTok video cover size (1080×1920).",
    icon: Video, 
    href: "/tools/tiktok-video-resizer",
    category: "Social",
    iconBg: "bg-black"
  },
  { 
    name: "Twitter/X Header Resizer", 
    description: "Resize images to the perfect Twitter/X header size (1500×500).",
    icon: Twitter, 
    href: "/tools/twitter-header-resizer",
    category: "Social",
    iconBg: "bg-sky-400"
  },
  { 
    name: "LinkedIn Banner Resizer", 
    description: "Resize images to the perfect LinkedIn banner size (1584×396).",
    icon: Linkedin, 
    href: "/tools/linkedin-banner-resizer",
    category: "Social",
    iconBg: "bg-blue-600"
  },
  { 
    name: "PDF Editor", 
    description: "Upload, rearrange, rotate, delete pages, and download your edited PDF.",
    icon: FilePen, 
    href: "/tools/pdf-editor",
    category: "Utilities",
    iconBg: "bg-red-500"
  },
  { 
    name: "Online Notepad", 
    description: "Write notes online with auto-save and AI-powered writing tools.",
    icon: StickyNote, 
    href: "/tools/online-notepad",
    category: "Writing",
    iconBg: "bg-amber-500"
  },
  { 
    name: "Word Counter", 
    description: "Count words, characters, sentences, and reading time.",
    icon: Type, 
    href: "/tools/word-counter",
    category: "Writing",
    iconBg: "bg-gray-500"
  },
  { 
    name: "Keyword Finder", 
    description: "Find low-competition SEO keywords for your content.",
    icon: Search, 
    href: "/tools/keyword-finder",
    category: "SEO",
    iconBg: "bg-blue-500"
  },
  { 
    name: "Reach Grabber Tool", 
    description: "AI-powered SEO optimizer for your blog posts and articles.",
    icon: Crosshair, 
    href: "/tools/reach-grabber-tool",
    category: "SEO",
    iconBg: "bg-red-400"
  },
  { 
    name: "AI Humanizer Free", 
    description: "Detect AI-written content and humanize it to sound natural.",
    icon: Palette, 
    href: "/tools/ai-humanizer-free",
    category: "AI",
    iconBg: "bg-indigo-500"
  },
  { 
    name: "Producer Tag Generator", 
    description: "Create custom AI voice tags for your beats and instrumentals.",
    icon: Mic, 
    href: "/tools/producer-tag-generator",
    category: "Audio",
    iconBg: "bg-purple-600"
  },
  { 
    name: "Ad Copy Analyzer", 
    description: "Analyze any ad copy and get scores, insights, and improved versions.",
    icon: FileBarChart, 
    href: "/tools/ad-copy-analyzer",
    category: "Marketing",
    iconBg: "bg-sky-600"
  },
  { 
    name: "Internal Link Audit", 
    description: "Find orphan pages and weak internal links to improve your SEO.",
    icon: Network, 
    href: "/tools/internal-link-seo-audit",
    category: "SEO",
    iconBg: "bg-lime-500"
  },
  { 
    name: "AI Summarizer", 
    description: "Summarize any text and extract key takeaways instantly.",
    icon: ListCollapse, 
    href: "/tools/summarizer",
    category: "Writing",
    iconBg: "bg-slate-500"
  },
  { 
    name: "Visualization Tool", 
    description: "Turn text into flowcharts, diagrams, and visual maps.",
    icon: Workflow, 
    href: "/tools/visualization",
    category: "Design",
    iconBg: "bg-cyan-600"
  },
  { 
    name: "Emoji Combos", 
    description: "Copy aesthetic emoji combinations for your social bios.",
    icon: Smile, 
    href: "/tools/emoji-combos",
    category: "Social",
    iconBg: "bg-yellow-400"
  },
  { 
    name: "Horoscope of the Day", 
    description: "Get your personalized AI-powered daily horoscope reading.",
    icon: Moon, 
    href: "/tools/horoscope-of-the-day",
    category: "Lifestyle",
    iconBg: "bg-indigo-400"
  },
  { 
    name: "Self-Love Affirmations", 
    description: "Daily AI-generated affirmations for self-love and confidence.",
    icon: HeartHandshake, 
    href: "/tools/affirmation-about-self-love",
    category: "Lifestyle",
    iconBg: "bg-rose-400"
  },
  { 
    name: "Photo Gallery Maker", 
    description: "Create multi-photo gallery layouts with grid, masonry, or horizontal strip options.",
    icon: LayoutGrid, 
    href: "/tools/photo-gallery-maker",
    category: "Image",
    iconBg: "bg-blue-400"
  },
  { 
    name: "YouTube Title Split-Test", 
    description: "A/B test your YouTube video titles with auto-rotation and CTR tracking.",
    icon: RotateCcw, 
    href: "/tools/youtube-title-split-test",
    category: "Social",
    iconBg: "bg-red-500"
  },
  { 
    name: "Name Combiner", 
    description: "Combine 2-3 names into creative mashups for couples or groups.",
    icon: Merge, 
    href: "/tools/name-combiner",
    category: "Social",
    iconBg: "bg-teal-400"
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
                {categoryTools.map((tool) => (
                  <Link 
                    key={tool.name} 
                    href={tool.href}
                    className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-orange-400 hover:shadow-lg transition-all group"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 ${tool.iconBg} rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110`}>
                        <tool.icon className="w-6 h-6 text-white" />
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
                ))}
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
