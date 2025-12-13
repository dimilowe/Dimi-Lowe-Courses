import Link from "next/link";

const tools = [
  { name: "Calorie Deficit Calculator", href: "/tools/calorie-deficit-calculator" },
  { name: "Outfit Ideas", href: "/tools/outfit-ideas" },
  { name: "AI Logo Generator", href: "/tools/logo-generator" },
  { name: "PDF Editor", href: "/tools/pdf-editor" },
  { name: "Keyword Finder", href: "/tools/keyword-finder" },
  { name: "Image Compressor", href: "/tools/image-compressor" },
  { name: "GIF Compressor", href: "/tools/gif-compressor" },
  { name: "GIF Maker", href: "/tools/gif-maker" },
  { name: "HEIC to JPG", href: "/tools/heic-to-jpg" },
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
  { name: "Ideas Hub", href: "/ideas" },
  { name: "VCM Answers", href: "/answers" },
];

interface ExploreMoreToolsProps {
  currentTool?: string;
}

export default function ExploreMoreTools({ currentTool }: ExploreMoreToolsProps) {
  const filteredTools = currentTool 
    ? tools.filter(tool => tool.href !== currentTool)
    : tools;

  return (
    <section className="mt-16 gradient-border rounded-2xl p-8 text-center bg-white">
      <h2 className="text-2xl font-bold text-gradient mb-3">
        Explore More Free Creator Tools
      </h2>
      <p className="text-gray-500 mb-6">
        VCM Suite offers a complete ecosystem of free tools for content creators and entrepreneurs.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        {filteredTools.map((tool) => (
          <Link 
            key={tool.href}
            href={tool.href} 
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
          >
            {tool.name}
          </Link>
        ))}
        <Link 
          href="/vcm-os" 
          className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Join VCM OS Waitlist →
        </Link>
      </div>
    </section>
  );
}
