import { ICON_REGISTRY, isIconKey, type IconKey } from "./icon-registry";
import type { LucideIcon } from "lucide-react";
import type { EngineType } from "@/data/toolsRegistry";

type EngineTheme = {
  iconKey: IconKey;
  bg: string;
};

export const ENGINE_THEMES: Record<string, EngineTheme> = {
  "platform-resizer": { iconKey: "fileImage", bg: "bg-purple-500" },
  "image-compress": { iconKey: "fileImage", bg: "bg-sky-500" },
  "image-convert": { iconKey: "fileImage", bg: "bg-rose-500" },
  "text-transform": { iconKey: "type", bg: "bg-gray-500" },
  "text-analysis": { iconKey: "type", bg: "bg-gray-500" },
  "calculator": { iconKey: "calculator", bg: "bg-green-500" },
  "ai-analysis": { iconKey: "sparkles", bg: "bg-indigo-500" },
  "ai-generate": { iconKey: "sparkles", bg: "bg-violet-500" },
  "file-convert": { iconKey: "fileArchive", bg: "bg-sky-500" },
  "file-edit": { iconKey: "filePen", bg: "bg-red-500" },
  "zip": { iconKey: "fileArchive", bg: "bg-sky-500" },
  "community": { iconKey: "barChart2", bg: "bg-fuchsia-500" },
  "static": { iconKey: "wrench", bg: "bg-gray-500" },
  "standalone": { iconKey: "wrench", bg: "bg-orange-500" },
  "outfit": { iconKey: "shoppingBag", bg: "bg-pink-500" },
  "price-engine": { iconKey: "barChart", bg: "bg-blue-500" },
  "default": { iconKey: "sparkles", bg: "bg-orange-500" },
};

const TOOL_ICON_MAP: Record<string, { iconKey: IconKey; bg: string }> = {
  "youtube-thumbnail-resizer": { iconKey: "youtube", bg: "bg-red-500" },
  "ai-thumbnail-coach": { iconKey: "youtube", bg: "bg-red-500" },
  "youtube-thumbnail-analyzer": { iconKey: "youtube", bg: "bg-red-400" },
  "youtube-title-split-test": { iconKey: "rotateCcw", bg: "bg-red-500" },
  "instagram-post-resizer": { iconKey: "instagram", bg: "bg-pink-500" },
  "instagram-story-resizer": { iconKey: "instagram", bg: "bg-gradient-to-r from-purple-500 to-pink-500" },
  "instagram-bio-analyzer": { iconKey: "instagram", bg: "bg-pink-500" },
  "instagram-cta-analyzer": { iconKey: "instagram", bg: "bg-fuchsia-400" },
  "instagram-caption-analyzer": { iconKey: "instagram", bg: "bg-fuchsia-500" },
  "instagram-hashtags-analyzer": { iconKey: "instagram", bg: "bg-purple-500" },
  "instagram-hook-analyzer": { iconKey: "instagram", bg: "bg-rose-500" },
  "instagram-thumbnail-analyzer": { iconKey: "instagram", bg: "bg-orange-500" },
  "tiktok-video-resizer": { iconKey: "video", bg: "bg-black" },
  "tiktok-cta-analyzer": { iconKey: "video", bg: "bg-gray-800" },
  "tiktok-caption-analyzer": { iconKey: "video", bg: "bg-violet-500" },
  "tiktok-hashtags-analyzer": { iconKey: "video", bg: "bg-pink-500" },
  "tiktok-hook-analyzer": { iconKey: "video", bg: "bg-cyan-500" },
  "tiktok-thumbnail-analyzer": { iconKey: "video", bg: "bg-red-500" },
  "twitter-header-resizer": { iconKey: "twitter", bg: "bg-sky-400" },
  "twitter-bio-analyzer": { iconKey: "twitter", bg: "bg-sky-400" },
  "twitter-cta-analyzer": { iconKey: "twitter", bg: "bg-blue-500" },
  "twitter-caption-analyzer": { iconKey: "twitter", bg: "bg-indigo-500" },
  "linkedin-banner-resizer": { iconKey: "linkedin", bg: "bg-blue-600" },
  "linkedin-bio-analyzer": { iconKey: "linkedin", bg: "bg-blue-600" },
  "linkedin-cta-analyzer": { iconKey: "linkedin", bg: "bg-indigo-500" },
  "linkedin-caption-analyzer": { iconKey: "linkedin", bg: "bg-sky-500" },
  "linkedin-hashtags-analyzer": { iconKey: "linkedin", bg: "bg-cyan-500" },
  "linkedin-hook-analyzer": { iconKey: "linkedin", bg: "bg-teal-500" },
  "facebook-thumbnail-analyzer": { iconKey: "target", bg: "bg-blue-500" },
  "prediction-center": { iconKey: "barChart2", bg: "bg-fuchsia-500" },
  "calorie-deficit-calculator": { iconKey: "flame", bg: "bg-green-500" },
  "calorie-counter-bmi": { iconKey: "heart", bg: "bg-rose-500" },
  "calorie-counter-free": { iconKey: "calculator", bg: "bg-green-500" },
  "calorie-counter-walking": { iconKey: "footprints", bg: "bg-green-500" },
  "calorie-counter-treadmill": { iconKey: "dumbbell", bg: "bg-green-500" },
  "calorie-counter-steps": { iconKey: "footprints", bg: "bg-green-500" },
  "calorie-counter-maintenance": { iconKey: "calculator", bg: "bg-green-500" },
  "calorie-counter-best": { iconKey: "calculator", bg: "bg-green-500" },
  "401k-retirement-calculator": { iconKey: "piggyBank", bg: "bg-blue-500" },
  "loan-estimator-home": { iconKey: "home", bg: "bg-blue-500" },
  "ups-shipping-cost": { iconKey: "package", bg: "bg-amber-600" },
  "estimator-for-car-repair": { iconKey: "car", bg: "bg-gray-600" },
  "outfit-ideas": { iconKey: "shoppingBag", bg: "bg-pink-500" },
  "logo-generator": { iconKey: "palette", bg: "bg-pink-500" },
  "resource-box": { iconKey: "package", bg: "bg-orange-600" },
  "gif-compressor": { iconKey: "zap", bg: "bg-yellow-500" },
  "gif-maker": { iconKey: "clapperboard", bg: "bg-pink-600" },
  "heic-to-jpg": { iconKey: "fileImage", bg: "bg-rose-500" },
  "image-compressor": { iconKey: "fileImage", bg: "bg-sky-500" },
  "social-media-image-sizes": { iconKey: "maximize", bg: "bg-violet-500" },
  "pdf-editor": { iconKey: "filePen", bg: "bg-red-500" },
  "online-notepad": { iconKey: "stickyNote", bg: "bg-amber-500" },
  "word-counter": { iconKey: "type", bg: "bg-gray-500" },
  "keyword-finder": { iconKey: "search", bg: "bg-blue-500" },
  "reach-grabber-tool": { iconKey: "target", bg: "bg-red-400" },
  "ai-humanizer-free": { iconKey: "palette", bg: "bg-indigo-500" },
  "producer-tag-generator": { iconKey: "music", bg: "bg-purple-600" },
  "ad-copy-analyzer": { iconKey: "barChart", bg: "bg-sky-600" },
  "internal-link-seo-audit": { iconKey: "globe", bg: "bg-lime-500" },
  "summarizer": { iconKey: "list", bg: "bg-slate-500" },
  "visualization": { iconKey: "gitBranch", bg: "bg-cyan-600" },
  "emoji-combos": { iconKey: "smile", bg: "bg-yellow-400" },
  "horoscope-of-the-day": { iconKey: "moon", bg: "bg-indigo-400" },
  "affirmation-about-self-love": { iconKey: "heart", bg: "bg-rose-400" },
  "photo-gallery-maker": { iconKey: "layoutGrid", bg: "bg-blue-400" },
  "name-combiner": { iconKey: "gitMerge", bg: "bg-teal-400" },
  "zip-file-creator": { iconKey: "fileArchive", bg: "bg-sky-500" },
  "weather-prediction": { iconKey: "cloudSun", bg: "bg-sky-400" },
  "maker-quotes-generator": { iconKey: "sparkles", bg: "bg-amber-400" },
  "universal-shopping-cart": { iconKey: "shoppingCart", bg: "bg-emerald-500" },
};

type ToolLike = {
  slug?: string;
  engine?: string | EngineType | null;
  iconKey?: unknown;
};

export interface ToolUI {
  icon: LucideIcon;
  bg: string;
  iconKey: IconKey;
}

export function getToolUI(tool: ToolLike): ToolUI {
  const slug = tool.slug ?? "";
  
  if (slug && TOOL_ICON_MAP[slug]) {
    const mapped = TOOL_ICON_MAP[slug];
    return {
      icon: ICON_REGISTRY[mapped.iconKey],
      bg: mapped.bg,
      iconKey: mapped.iconKey,
    };
  }
  
  if (isIconKey(tool.iconKey)) {
    const engine = tool.engine ?? "default";
    const theme = ENGINE_THEMES[engine] ?? ENGINE_THEMES.default;
    return {
      icon: ICON_REGISTRY[tool.iconKey],
      bg: theme.bg,
      iconKey: tool.iconKey,
    };
  }
  
  const engine = tool.engine ?? "default";
  const theme = ENGINE_THEMES[engine] ?? ENGINE_THEMES.default;
  return {
    icon: ICON_REGISTRY[theme.iconKey],
    bg: theme.bg,
    iconKey: theme.iconKey,
  };
}

export function getToolIconComponent(tool: ToolLike): LucideIcon {
  return getToolUI(tool).icon;
}

export function getToolIconBg(tool: ToolLike): string {
  return getToolUI(tool).bg;
}
