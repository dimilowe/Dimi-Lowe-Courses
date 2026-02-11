import Link from "next/link";
import { Wrench } from "lucide-react";

const tools = [
  { name: "Calorie Calculator", href: "/tools/calorie-deficit-calculator" },
  { name: "Outfit Ideas", href: "/tools/outfit-ideas" },
  { name: "Logo Generator", href: "/tools/logo-generator" },
  { name: "PDF Editor", href: "/tools/pdf-editor" },
  { name: "Keyword Finder", href: "/tools/keyword-finder" },
  { name: "Image Compressor", href: "/tools/image-compressor" },
  { name: "GIF Compressor", href: "/tools/gif-compressor" },
  { name: "GIF Maker", href: "/tools/gif-maker" },
  { name: "HEIC to JPG", href: "/tools/heic-to-jpg" },
  { name: "M4A to MP3", href: "/tools/m4a-to-mp3-conversion" },
  { name: "Emoji Combos", href: "/tools/emoji-combos" },
  { name: "Thumbnail Coach", href: "/tools/ai-thumbnail-coach" },
  { name: "Visualization", href: "/tools/visualization" },
  { name: "Affirmations", href: "/tools/affirmation-about-self-love" },
  { name: "Horoscope", href: "/tools/horoscope-of-the-day" },
  { name: "Ad Copy Analyzer", href: "/tools/ad-copy-analyzer" },
  { name: "Internal Link Audit", href: "/tools/internal-link-seo-audit" },
  { name: "AI Summarizer", href: "/tools/summarizer" },
  { name: "Online Notepad", href: "/tools/online-notepad" },
  { name: "Prediction Center", href: "/tools/prediction-center" },
  { name: "Name Combiner", href: "/tools/name-combiner" },
  { name: "AI Humanizer", href: "/tools/ai-humanizer-free" },
  { name: "Reach Grabber", href: "/tools/reach-grabber-tool" },
  { name: "Producer Tag", href: "/tools/producer-tag-generator" },
  { name: "Word Counter", href: "/tools/word-counter" },
  { name: "Resource Box", href: "/tools/resource-box" },
];

export default function SidebarTools() {
  const displayTools = tools.slice(0, 8);
  
  return (
    <div className="bg-white rounded-lg border-2 border-orange-500 overflow-hidden">
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-3">
        <div className="flex items-center gap-2">
          <Wrench className="w-5 h-5 text-white" />
          <h3 className="text-lg font-bold text-white">Free Creator Tools</h3>
        </div>
      </div>
      <div className="p-4">
        <p className="text-sm text-gray-600 mb-3">
          Explore our suite of free tools for creators.
        </p>
        <div className="flex flex-wrap gap-2 mb-4">
          {displayTools.map((tool) => (
            <Link 
              key={tool.href}
              href={tool.href} 
              className="px-3 py-1.5 bg-gray-100 hover:bg-orange-100 hover:text-orange-700 text-gray-700 rounded-full text-xs font-medium transition-colors"
            >
              {tool.name}
            </Link>
          ))}
        </div>
        <Link 
          href="/tools" 
          className="block w-full text-center px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors"
        >
          View All {tools.length}+ Tools
        </Link>
      </div>
    </div>
  );
}
