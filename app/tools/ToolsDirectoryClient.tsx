"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { 
  Search, 
  ArrowRight,
  X,
  Youtube,
  Instagram,
  Twitter,
  Linkedin,
  Video,
  FileImage,
  Type,
  Palette,
  GitBranch,
  Smile,
  Star,
  Heart,
  LayoutGrid,
  Target,
  Music,
  Megaphone,
  Link2,
  FileText,
  ShoppingBag,
  Flame,
  FilePen,
  StickyNote,
  TrendingUp,
  Images,
  RotateCcw,
  Users,
  Calculator,
  PiggyBank,
  Home,
  Package,
  Car,
  CloudSun,
  Footprints,
  Dumbbell,
  Quote,
  LucideIcon
} from "lucide-react";
import { 
  CATEGORY_INFO, 
  TAG_INFO,
  type ToolCategory,
  type ToolTag
} from "@/data/toolsRegistry";
import type { DirectoryTool as Tool } from "@/lib/tools/getToolsForDirectory";

const CREATOR_CATEGORIES: ToolCategory[] = [
  "creator",
  "image",
  "video",
  "writing",
  "social",
  "ai"
];

const MBB_CATEGORIES: ToolCategory[] = [
  "calculators",
  "business",
  "file",
  "utilities"
];

const ICON_MAP: Record<string, LucideIcon> = {
  Youtube,
  Instagram,
  Twitter,
  Linkedin,
  Video,
  FileImage,
  Type,
  Palette,
  GitBranch,
  Smile,
  Star,
  Heart,
  LayoutGrid,
  Target,
  Music,
  Megaphone,
  Link2,
  FileText,
  ShoppingBag,
  Flame,
  FilePen,
  StickyNote,
  TrendingUp,
  Images,
  RotateCcw,
  Users,
  Calculator,
  PiggyBank,
  Home,
  Package,
  Car,
  CloudSun,
  Footprints,
  Dumbbell,
  Quote,
  Search
};

const TAG_ORDER: ToolTag[] = [
  "trending",
  "new",
  "creator",
  "image",
  "video",
  "writing",
  "social",
  "file",
  "business",
  "calculators",
  "utilities",
  "ai"
];

function ToolCard({ tool }: { tool: Tool }) {
  const Icon = ICON_MAP[tool.icon] || Star;
  
  return (
    <Link 
      href={`/tools/${tool.slug}`}
      className="group relative bg-white rounded-2xl p-5 border border-gray-100 hover:border-orange-300 hover:shadow-lg transition-all duration-200"
    >
      <div className="flex flex-col items-center text-center">
        <div className={`w-14 h-14 ${tool.iconBg} rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110 shadow-sm`}>
          <Icon className="w-7 h-7 text-white" />
        </div>
        <h3 className="font-semibold text-gray-900 group-hover:text-orange-500 transition-colors text-sm leading-tight">
          {tool.name}
        </h3>
        {(tool.isNew || tool.isTrending) && (
          <div className="mt-2 flex gap-1">
            {tool.isNew && (
              <span className="text-[10px] font-medium bg-green-100 text-green-700 px-1.5 py-0.5 rounded">NEW</span>
            )}
            {tool.isTrending && (
              <span className="text-[10px] font-medium bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">HOT</span>
            )}
          </div>
        )}
      </div>
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 rounded-2xl">
        <span className="text-orange-500 font-medium text-sm flex items-center gap-1">
          Open Tool <ArrowRight className="w-4 h-4" />
        </span>
      </div>
    </Link>
  );
}

function CategorySection({ category, tools, showViewAll = true }: { category: ToolCategory; tools: Tool[]; showViewAll?: boolean }) {
  const info = CATEGORY_INFO[category];
  const displayTools = tools.slice(0, 8);
  
  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <span>{info.emoji}</span>
          {info.label}
        </h2>
        {showViewAll && tools.length > 8 && (
          <Link 
            href={`/tools?category=${category}`}
            className="text-sm text-orange-500 hover:text-orange-600 font-medium flex items-center gap-1"
          >
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {displayTools.map(tool => (
          <ToolCard key={tool.id} tool={tool} />
        ))}
      </div>
    </section>
  );
}

interface ToolsDirectoryClientProps {
  tools: Tool[];
}

export default function ToolsDirectoryClient({ tools }: ToolsDirectoryClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTag, setActiveTag] = useState<ToolTag | null>(null);
  
  const toolCount = tools.length;
  
  const getToolsByCategory = (category: ToolCategory) => 
    tools.filter(t => t.category === category);
  
  const filteredTools = useMemo(() => {
    let filteredList = [...tools];
    
    if (activeTag) {
      if (activeTag === "trending") {
        filteredList = filteredList.filter(t => t.isTrending);
      } else if (activeTag === "new") {
        filteredList = filteredList.filter(t => t.isNew);
      } else {
        filteredList = filteredList.filter(t => t.tags.includes(activeTag));
      }
    }
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      
      const scoredTools = filteredList
        .map(t => {
          let score = 0;
          const nameLower = t.name.toLowerCase();
          const descLower = t.description.toLowerCase();
          
          if (nameLower === q) {
            score += 100;
          } else if (nameLower.startsWith(q)) {
            score += 80;
          } else if (nameLower.includes(q)) {
            score += 50;
          }
          
          if (t.tags.some(tag => tag === q)) {
            score += 30;
          } else if (t.tags.some(tag => tag.includes(q))) {
            score += 15;
          }
          
          if (descLower.includes(q)) {
            score += 10;
          }
          
          if (t.isTrending) score += 5;
          if (t.isNew) score += 3;
          
          const isCreatorTool = CREATOR_CATEGORIES.includes(t.category);
          if (isCreatorTool) score += 20;
          
          return { tool: t, score };
        })
        .filter(item => item.score > 0)
        .sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          return b.tool.priority - a.tool.priority;
        })
        .map(item => item.tool);
      
      return scoredTools;
    }
    
    return filteredList.sort((a, b) => b.priority - a.priority);
  }, [tools, searchQuery, activeTag]);
  
  const isFiltering = searchQuery.trim() || activeTag;
  
  const clearFilters = () => {
    setSearchQuery("");
    setActiveTag(null);
  };
  
  return (
    <div>
      <div className="mb-8">
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${toolCount}+ tools...`}
            className="w-full pl-14 pr-12 py-4 rounded-full border border-gray-200 bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all text-base shadow-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
      
      <div className="mb-10 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 pb-2 min-w-max justify-center">
          {TAG_ORDER.map(tag => {
            const info = TAG_INFO[tag];
            const isActive = activeTag === tag;
            return (
              <button
                key={tag}
                onClick={() => setActiveTag(isActive ? null : tag)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                  isActive 
                    ? "bg-orange-500 text-white shadow-md" 
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {info.emoji} {info.label}
              </button>
            );
          })}
        </div>
      </div>
      
      {isFiltering && (
        <div className="mb-8 flex items-center justify-between">
          <p className="text-gray-600">
            Found <span className="font-semibold text-gray-900">{filteredTools.length}</span> {filteredTools.length === 1 ? 'tool' : 'tools'}
            {activeTag && <span className="text-orange-500"> in {TAG_INFO[activeTag].label}</span>}
          </p>
          <button
            onClick={clearFilters}
            className="text-sm text-orange-500 hover:text-orange-600 font-medium"
          >
            Clear filters
          </button>
        </div>
      )}
      
      {isFiltering ? (
        filteredTools.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-12">
            {filteredTools.map(tool => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg mb-4">No tools found matching your criteria</p>
            <button
              onClick={clearFilters}
              className="text-orange-500 hover:text-orange-600 font-medium"
            >
              Clear filters
            </button>
          </div>
        )
      ) : (
        <>
          {CREATOR_CATEGORIES.map(category => {
            const tools = getToolsByCategory(category);
            if (tools.length === 0) return null;
            return (
              <CategorySection 
                key={category} 
                category={category} 
                tools={tools}
              />
            );
          })}
          
          <div className="mt-16 mb-12 border-t pt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">More Free Tools</h2>
            <p className="text-gray-500 text-center mb-8">Calculators, estimators, and utilities</p>
          </div>
          
          {MBB_CATEGORIES.map(category => {
            const tools = getToolsByCategory(category);
            if (tools.length === 0) return null;
            return (
              <CategorySection 
                key={category} 
                category={category} 
                tools={tools}
              />
            );
          })}
          
          <div className="mt-16 text-center border-t pt-12">
            <Link 
              href="/tools/all"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-orange-500 font-medium transition-colors"
            >
              <span>Browse the full list of {toolCount}+ tools</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
