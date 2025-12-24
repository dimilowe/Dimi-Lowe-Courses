"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Search, 
  ArrowRight, 
  FileImage, 
  Type, 
  Palette, 
  Star, 
  Heart, 
  Smile, 
  GitBranch, 
  Zap, 
  QrCode, 
  Flame, 
  MessageCircleQuestion, 
  Users, 
  TrendingUp, 
  Rocket, 
  ShoppingBag, 
  FilePen, 
  LayoutGrid, 
  Youtube, 
  StickyNote, 
  Target, 
  Sparkles, 
  Music, 
  Megaphone, 
  Link2, 
  FileText,
  Instagram,
  Video,
  RotateCcw,
  Moon,
  Merge,
  Ruler,
  Box,
  Film,
  Twitter,
  Linkedin,
  ListCollapse,
  Calculator,
  Footprints,
  Dumbbell,
  PiggyBank,
  Home,
  Package,
  Car,
  Wrench,
  LucideIcon
} from "lucide-react";
import { toolsRegistry } from "@/data/toolsRegistry";

const iconMap: Record<string, LucideIcon> = {
  FileImage,
  Type,
  Palette,
  Star,
  Heart,
  Smile,
  GitBranch,
  Zap,
  QrCode,
  Flame,
  MessageCircleQuestion,
  Users,
  TrendingUp,
  Rocket,
  ShoppingBag,
  FilePen,
  LayoutGrid,
  Youtube,
  StickyNote,
  Target,
  Sparkles,
  Music,
  Megaphone,
  Link2,
  FileText,
  Instagram,
  Video,
  RotateCcw,
  Moon,
  Merge,
  Ruler,
  Box,
  Film,
  Twitter,
  Linkedin,
  ListCollapse,
  Calculator,
  Footprints,
  Dumbbell,
  PiggyBank,
  Home,
  Package,
  Car,
  Search,
  Wrench
};

const staticSuggestions = [
  { name: "VCM Answers", href: "/answers", icon: MessageCircleQuestion },
  { name: "Ideas Hub", href: "/ideas", icon: Rocket },
  { name: "QR Social", href: "/product/qrsocial", icon: QrCode },
  { name: "C-Score", href: "/product/cscorecals", icon: Flame },
  { name: "APE", href: "https://ape.vcm.fyi", icon: Zap },
  { name: "Blog", href: "/blog", icon: Type },
  { name: "Store", href: "/store", icon: Palette },
];

const toolSuggestions = [...toolsRegistry]
  .sort((a, b) => b.priority - a.priority)
  .map(tool => ({
    name: tool.name,
    href: `/tools/${tool.slug}`,
    icon: iconMap[tool.icon] || Wrench
  }));

const allSuggestions = [...toolSuggestions, ...staticSuggestions];

export function HeroSearch() {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const filteredSuggestions = query.length > 0
    ? allSuggestions.filter(s => 
        s.name.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 10)
    : allSuggestions.slice(0, 6);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => 
        prev < filteredSuggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && filteredSuggestions[selectedIndex]) {
        const selected = filteredSuggestions[selectedIndex];
        if (selected.href.startsWith("http")) {
          window.open(selected.href, "_blank");
        } else {
          router.push(selected.href);
        }
        setIsOpen(false);
        setQuery("");
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const handleSelect = (suggestion: typeof allSuggestions[0]) => {
    if (suggestion.href.startsWith("http")) {
      window.open(suggestion.href, "_blank");
    } else {
      router.push(suggestion.href);
    }
    setIsOpen(false);
    setQuery("");
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <div className="relative">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search tools, products, resources..."
          className="w-full pl-14 pr-16 py-5 text-base bg-white border-2 border-gray-200 rounded-full shadow-lg focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100 transition-all"
        />
        <button 
          onClick={() => {
            if (filteredSuggestions.length > 0) {
              handleSelect(filteredSuggestions[0]);
            }
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 bg-orange-500 hover:bg-orange-600 rounded-full flex items-center justify-center transition-colors shadow-md"
        >
          <ArrowRight className="w-5 h-5 text-white" />
        </button>
      </div>

      {isOpen && filteredSuggestions.length > 0 && (
        <div 
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden"
        >
          <div className="py-2">
            {filteredSuggestions.map((suggestion, index) => (
              <button
                key={suggestion.name}
                onClick={() => handleSelect(suggestion)}
                className={`w-full flex items-center gap-3 px-5 py-3 text-left transition-colors ${
                  index === selectedIndex 
                    ? "bg-orange-50 text-orange-700" 
                    : "hover:bg-gray-50"
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  index === selectedIndex ? "bg-orange-100" : "bg-gray-100"
                }`}>
                  <suggestion.icon className={`w-4 h-4 ${
                    index === selectedIndex ? "text-orange-600" : "text-gray-500"
                  }`} />
                </div>
                <span className="font-medium text-gray-800">{suggestion.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
