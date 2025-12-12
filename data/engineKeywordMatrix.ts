import type { EngineType } from "@/engines";
import type { SearchIntent } from "./toolsRegistry";

export type ToolSegment = "creator" | "social" | "utility" | "finance" | "health" | "mbb";
export type ToolPriority = "primary" | "secondary" | "experimental";

export interface KeywordModifier {
  id: string;
  label: string;
  variations: string[];
}

export interface EngineKeywordMatrix {
  engineId: EngineType;
  segment: ToolSegment;
  baseKeywords: string[];
  platformModifiers: KeywordModifier[];
  dimensionModifiers: KeywordModifier[];
  intentModifiers: KeywordModifier[];
  formatModifiers: KeywordModifier[];
  generateCombinations: () => ToolSkin[];
}

export interface ToolSkin {
  slug: string;
  name: string;
  engineType: EngineType;
  segment: ToolSegment;
  priority: ToolPriority;
  isIndexed: boolean;
  primaryKeyword: string;
  secondaryKeywords: string[];
  searchIntent: SearchIntent;
  h1: string;
  metaDescription: string;
  introCopy: string;
  dimensions?: { width: number; height: number };
  aspectRatio?: string;
  clusterSlug?: string;
}

const PRIMARY_PLATFORMS = ["instagram", "instagram-story", "tiktok", "youtube", "twitter", "linkedin"];

export const PLATFORM_RESIZER_MATRIX: EngineKeywordMatrix = {
  engineId: "platform-resizer",
  segment: "social",
  baseKeywords: ["resize image", "image resizer", "photo resizer", "crop image", "resize photo"],
  
  platformModifiers: [
    { id: "instagram", label: "Instagram", variations: ["instagram", "ig", "insta"] },
    { id: "instagram-story", label: "Instagram Story", variations: ["instagram story", "ig story", "insta story"] },
    { id: "instagram-reel", label: "Instagram Reel", variations: ["instagram reel", "ig reel", "reels"] },
    { id: "tiktok", label: "TikTok", variations: ["tiktok", "tik tok"] },
    { id: "youtube", label: "YouTube", variations: ["youtube", "yt"] },
    { id: "youtube-shorts", label: "YouTube Shorts", variations: ["youtube shorts", "yt shorts"] },
    { id: "twitter", label: "Twitter/X", variations: ["twitter", "x", "twitter header"] },
    { id: "linkedin", label: "LinkedIn", variations: ["linkedin", "li"] },
    { id: "linkedin-company", label: "LinkedIn Company", variations: ["linkedin company", "linkedin business"] },
    { id: "facebook", label: "Facebook", variations: ["facebook", "fb"] },
    { id: "facebook-cover", label: "Facebook Cover", variations: ["facebook cover", "fb cover"] },
    { id: "pinterest", label: "Pinterest", variations: ["pinterest", "pin"] },
    { id: "snapchat", label: "Snapchat", variations: ["snapchat", "snap"] },
    { id: "discord", label: "Discord", variations: ["discord"] },
    { id: "twitch", label: "Twitch", variations: ["twitch"] },
    { id: "blog", label: "Blog", variations: ["blog", "wordpress", "medium"] },
    { id: "email", label: "Email", variations: ["email", "newsletter", "mailchimp"] },
  ],
  
  dimensionModifiers: [
    { id: "1080x1080", label: "1080×1080", variations: ["1080x1080", "1080 x 1080", "square"] },
    { id: "1080x1920", label: "1080×1920", variations: ["1080x1920", "1080 x 1920", "vertical", "portrait"] },
    { id: "1920x1080", label: "1920×1080", variations: ["1920x1080", "1920 x 1080", "horizontal", "landscape", "hd"] },
    { id: "1280x720", label: "1280×720", variations: ["1280x720", "1280 x 720", "720p", "hd thumbnail"] },
    { id: "1500x500", label: "1500×500", variations: ["1500x500", "1500 x 500", "twitter banner"] },
    { id: "1584x396", label: "1584×396", variations: ["1584x396", "1584 x 396", "linkedin banner"] },
    { id: "1000x1500", label: "1000×1500", variations: ["1000x1500", "1000 x 1500", "pinterest pin"] },
    { id: "820x312", label: "820×312", variations: ["820x312", "820 x 312", "facebook cover"] },
    { id: "2560x1440", label: "2560×1440", variations: ["2560x1440", "2560 x 1440", "youtube banner", "channel art"] },
  ],
  
  intentModifiers: [
    { id: "resize", label: "Resize", variations: ["resize", "resizer", "resize for"] },
    { id: "crop", label: "Crop", variations: ["crop", "cropper", "crop for"] },
    { id: "convert", label: "Convert", variations: ["convert", "converter", "change size"] },
    { id: "optimize", label: "Optimize", variations: ["optimize", "best size", "perfect size"] },
    { id: "free", label: "Free", variations: ["free", "free online", "online free"] },
  ],
  
  formatModifiers: [
    { id: "1:1", label: "Square", variations: ["1:1", "square", "1 to 1"] },
    { id: "4:5", label: "Portrait", variations: ["4:5", "4 to 5", "portrait"] },
    { id: "9:16", label: "Vertical", variations: ["9:16", "9 to 16", "vertical", "story"] },
    { id: "16:9", label: "Landscape", variations: ["16:9", "16 to 9", "widescreen", "landscape"] },
    { id: "4:3", label: "Standard", variations: ["4:3", "4 to 3", "standard"] },
    { id: "2:3", label: "Pinterest", variations: ["2:3", "2 to 3", "pinterest ratio"] },
  ],
  
  generateCombinations(): ToolSkin[] {
    const skins: ToolSkin[] = [];
    
    const platformConfigs: Record<string, { width: number; height: number; aspectRatio: string; compatibleDimensions: string[] }> = {
      "instagram": { width: 1080, height: 1080, aspectRatio: "1:1", compatibleDimensions: ["1080x1080"] },
      "instagram-story": { width: 1080, height: 1920, aspectRatio: "9:16", compatibleDimensions: ["1080x1920"] },
      "instagram-reel": { width: 1080, height: 1920, aspectRatio: "9:16", compatibleDimensions: ["1080x1920"] },
      "tiktok": { width: 1080, height: 1920, aspectRatio: "9:16", compatibleDimensions: ["1080x1920"] },
      "youtube": { width: 1280, height: 720, aspectRatio: "16:9", compatibleDimensions: ["1280x720", "1920x1080"] },
      "youtube-shorts": { width: 1080, height: 1920, aspectRatio: "9:16", compatibleDimensions: ["1080x1920"] },
      "twitter": { width: 1500, height: 500, aspectRatio: "3:1", compatibleDimensions: ["1500x500"] },
      "linkedin": { width: 1584, height: 396, aspectRatio: "4:1", compatibleDimensions: ["1584x396"] },
      "linkedin-company": { width: 1128, height: 191, aspectRatio: "6:1", compatibleDimensions: [] },
      "facebook": { width: 1200, height: 630, aspectRatio: "1.91:1", compatibleDimensions: [] },
      "facebook-cover": { width: 820, height: 312, aspectRatio: "2.63:1", compatibleDimensions: ["820x312"] },
      "pinterest": { width: 1000, height: 1500, aspectRatio: "2:3", compatibleDimensions: ["1000x1500"] },
      "snapchat": { width: 1080, height: 1920, aspectRatio: "9:16", compatibleDimensions: ["1080x1920"] },
      "discord": { width: 680, height: 240, aspectRatio: "17:6", compatibleDimensions: [] },
      "twitch": { width: 1200, height: 480, aspectRatio: "2.5:1", compatibleDimensions: [] },
      "blog": { width: 1200, height: 630, aspectRatio: "1.91:1", compatibleDimensions: [] },
      "email": { width: 600, height: 400, aspectRatio: "3:2", compatibleDimensions: [] },
    };
    
    for (const platform of this.platformModifiers) {
      const config = platformConfigs[platform.id];
      if (!config) continue;
      
      const baseSlug = `${platform.id}-resizer`;
      const baseName = `${platform.label} Image Resizer`;
      const basePrimaryKeyword = `${platform.variations[0]} image size`;
      
      const isPrimary = PRIMARY_PLATFORMS.includes(platform.id);
      
      skins.push({
        slug: baseSlug,
        name: baseName,
        engineType: "platform-resizer",
        segment: "social",
        priority: isPrimary ? "primary" : "secondary",
        isIndexed: isPrimary,
        clusterSlug: "social-media-image-sizes",
        primaryKeyword: basePrimaryKeyword,
        secondaryKeywords: [
          `resize image for ${platform.variations[0]}`,
          `${platform.variations[0]} photo size`,
          `${platform.variations[0]} dimensions`,
          `${config.width}x${config.height} resizer`,
          `${platform.label.toLowerCase()} image resizer free`,
        ],
        searchIntent: "action",
        h1: `${platform.label} Image Resizer`,
        metaDescription: `Resize images to ${config.width}×${config.height} pixels for ${platform.label}. Free online tool, no signup required.`,
        introCopy: `Upload any image and resize it to the perfect ${platform.label} dimensions (${config.width}×${config.height}) instantly.`,
        dimensions: { width: config.width, height: config.height },
        aspectRatio: config.aspectRatio,
      });
      
      for (const intent of this.intentModifiers) {
        if (intent.id === "resize") continue;
        
        const intentSlug = `${platform.id}-${intent.id}`;
        const intentName = `${platform.label} Image ${intent.label}`;
        
        skins.push({
          slug: intentSlug,
          name: intentName,
          engineType: "platform-resizer",
          segment: "social",
          priority: "experimental",
          isIndexed: false,
          clusterSlug: "social-media-image-sizes",
          primaryKeyword: `${intent.variations[0]} image for ${platform.variations[0]}`,
          secondaryKeywords: [
            `${platform.variations[0]} ${intent.id}`,
            `${intent.id} ${platform.variations[0]} image`,
            `${intent.variations[1] || intent.variations[0]} ${platform.label.toLowerCase()}`,
          ],
          searchIntent: "action",
          h1: `${intent.label} Images for ${platform.label}`,
          metaDescription: `${intent.label} your images for ${platform.label} (${config.width}×${config.height}). Free online tool.`,
          introCopy: `${intent.label} any image to the perfect ${platform.label} dimensions instantly.`,
          dimensions: { width: config.width, height: config.height },
          aspectRatio: config.aspectRatio,
        });
      }
      
      for (const format of this.formatModifiers) {
        if (format.id === config.aspectRatio) continue;
        
        const formatSlug = `${platform.id}-${format.id.replace(":", "-")}-resizer`;
        const formatName = `${platform.label} ${format.label} Resizer`;
        
        skins.push({
          slug: formatSlug,
          name: formatName,
          engineType: "platform-resizer",
          segment: "social",
          priority: "experimental",
          isIndexed: false,
          clusterSlug: "social-media-image-sizes",
          primaryKeyword: `${platform.variations[0]} ${format.variations[0]} image`,
          secondaryKeywords: [
            `${format.label.toLowerCase()} ${platform.variations[0]}`,
            `${platform.label.toLowerCase()} ${format.variations[0]} size`,
            `resize ${format.variations[0]} for ${platform.variations[0]}`,
          ],
          searchIntent: "action",
          h1: `${platform.label} ${format.label} Image Resizer`,
          metaDescription: `Resize images to ${format.label} (${format.variations[0]}) for ${platform.label}. Free online tool.`,
          introCopy: `Create ${format.label.toLowerCase()} images optimized for ${platform.label}.`,
          aspectRatio: format.id,
        });
      }
    }
    
    for (const dimension of this.dimensionModifiers) {
      const [w, h] = dimension.id.split("x").map(Number);
      const dimensionSlug = `image-resizer-${dimension.id}`;
      
      skins.push({
        slug: dimensionSlug,
        name: `${dimension.label} Image Resizer`,
        engineType: "platform-resizer",
        segment: "utility",
        priority: "secondary",
        isIndexed: false,
        primaryKeyword: `resize image to ${dimension.id}`,
        secondaryKeywords: [
          `${dimension.id} image resizer`,
          `${dimension.label.toLowerCase()} resizer`,
          `make image ${dimension.id}`,
          ...dimension.variations,
        ],
        searchIntent: "action",
        h1: `Resize Images to ${dimension.label}`,
        metaDescription: `Resize any image to ${dimension.label} pixels. Free online ${dimension.id} resizer, no signup required.`,
        introCopy: `Upload any image and resize it to exactly ${w}×${h} pixels instantly.`,
        dimensions: { width: w, height: h },
      });
    }
    
    return skins;
  }
};

const HEALTH_CALCULATORS = ["calorie-deficit", "bmi", "tdee", "macro", "sleep"];
const FINANCE_CALCULATORS = ["401k-retirement", "mortgage", "compound-interest", "loan", "car-payment", "rent-vs-buy", "paycheck", "inflation", "retirement"];

export const CALCULATOR_MATRIX: EngineKeywordMatrix = {
  engineId: "calculator",
  segment: "mbb",
  baseKeywords: ["calculator", "estimator", "calculate", "estimate"],
  
  platformModifiers: [],
  dimensionModifiers: [],
  
  intentModifiers: [
    { id: "free", label: "Free", variations: ["free", "free online", "online"] },
    { id: "accurate", label: "Accurate", variations: ["accurate", "precise", "exact"] },
  ],
  
  formatModifiers: [],
  
  generateCombinations(): ToolSkin[] {
    const calculatorTypes: { id: string; name: string; keyword: string; desc: string; segment: ToolSegment; cluster: string; isIndexed: boolean }[] = [
      { id: "calorie-deficit", name: "Calorie Deficit", keyword: "calorie deficit calculator", desc: "Calculate your daily calorie deficit for weight loss", segment: "health", cluster: "health-fitness-calculators", isIndexed: true },
      { id: "401k-retirement", name: "401k Retirement", keyword: "401k calculator", desc: "Project your 401k growth until retirement", segment: "finance", cluster: "financial-calculators", isIndexed: true },
      { id: "mortgage", name: "Mortgage", keyword: "mortgage calculator", desc: "Calculate monthly mortgage payments", segment: "finance", cluster: "financial-calculators", isIndexed: false },
      { id: "bmi", name: "BMI", keyword: "bmi calculator", desc: "Calculate your body mass index", segment: "health", cluster: "health-fitness-calculators", isIndexed: false },
      { id: "tdee", name: "TDEE", keyword: "tdee calculator", desc: "Calculate total daily energy expenditure", segment: "health", cluster: "health-fitness-calculators", isIndexed: false },
      { id: "macro", name: "Macro", keyword: "macro calculator", desc: "Calculate daily macronutrient targets", segment: "health", cluster: "health-fitness-calculators", isIndexed: false },
      { id: "compound-interest", name: "Compound Interest", keyword: "compound interest calculator", desc: "Calculate compound interest growth", segment: "finance", cluster: "financial-calculators", isIndexed: false },
      { id: "loan", name: "Loan", keyword: "loan calculator", desc: "Calculate loan payments and total interest", segment: "finance", cluster: "financial-calculators", isIndexed: false },
      { id: "tip", name: "Tip", keyword: "tip calculator", desc: "Calculate tip amounts and split bills", segment: "utility", cluster: "", isIndexed: false },
      { id: "percentage", name: "Percentage", keyword: "percentage calculator", desc: "Calculate percentages and percent changes", segment: "utility", cluster: "", isIndexed: false },
      { id: "age", name: "Age", keyword: "age calculator", desc: "Calculate age from birthdate", segment: "utility", cluster: "", isIndexed: false },
      { id: "gpa", name: "GPA", keyword: "gpa calculator", desc: "Calculate grade point average", segment: "utility", cluster: "", isIndexed: false },
      { id: "pregnancy", name: "Pregnancy Due Date", keyword: "pregnancy calculator", desc: "Calculate due date and pregnancy milestones", segment: "health", cluster: "health-fitness-calculators", isIndexed: false },
      { id: "ovulation", name: "Ovulation", keyword: "ovulation calculator", desc: "Calculate ovulation and fertility windows", segment: "health", cluster: "health-fitness-calculators", isIndexed: false },
      { id: "sleep", name: "Sleep", keyword: "sleep calculator", desc: "Calculate optimal bedtime and wake time", segment: "health", cluster: "health-fitness-calculators", isIndexed: false },
      { id: "car-payment", name: "Car Payment", keyword: "car payment calculator", desc: "Calculate monthly car loan payments", segment: "finance", cluster: "financial-calculators", isIndexed: false },
      { id: "rent-vs-buy", name: "Rent vs Buy", keyword: "rent vs buy calculator", desc: "Compare renting vs buying a home", segment: "finance", cluster: "financial-calculators", isIndexed: false },
      { id: "paycheck", name: "Paycheck", keyword: "paycheck calculator", desc: "Calculate net pay after taxes", segment: "finance", cluster: "financial-calculators", isIndexed: false },
      { id: "inflation", name: "Inflation", keyword: "inflation calculator", desc: "Calculate purchasing power over time", segment: "finance", cluster: "financial-calculators", isIndexed: false },
      { id: "retirement", name: "Retirement", keyword: "retirement calculator", desc: "Calculate retirement savings needs", segment: "finance", cluster: "financial-calculators", isIndexed: false },
    ];
    
    return calculatorTypes.map(calc => ({
      slug: `${calc.id}-calculator`,
      name: `${calc.name} Calculator`,
      engineType: "calculator" as const,
      segment: calc.segment,
      priority: calc.isIndexed ? "primary" as const : "secondary" as const,
      isIndexed: calc.isIndexed,
      clusterSlug: calc.cluster || undefined,
      primaryKeyword: calc.keyword,
      secondaryKeywords: [
        `${calc.keyword} free`,
        `${calc.keyword} online`,
        `best ${calc.keyword}`,
        `accurate ${calc.keyword}`,
      ],
      searchIntent: "action" as SearchIntent,
      h1: `${calc.name} Calculator`,
      metaDescription: `${calc.desc}. Free online ${calc.name.toLowerCase()} calculator, no signup required.`,
      introCopy: `${calc.desc} with our free, easy-to-use calculator.`,
    }));
  }
};

export const AI_ANALYSIS_MATRIX: EngineKeywordMatrix = {
  engineId: "ai-analysis",
  segment: "creator",
  baseKeywords: ["analyzer", "analysis", "check", "audit", "review"],
  
  platformModifiers: [],
  dimensionModifiers: [],
  formatModifiers: [],
  
  intentModifiers: [
    { id: "ai", label: "AI", variations: ["ai", "ai-powered", "artificial intelligence"] },
    { id: "free", label: "Free", variations: ["free", "free online"] },
  ],
  
  generateCombinations(): ToolSkin[] {
    const analyzerTypes: { id: string; name: string; keyword: string; desc: string; isIndexed: boolean }[] = [
      { id: "thumbnail", name: "YouTube Thumbnail", keyword: "youtube thumbnail analyzer", desc: "Analyze YouTube thumbnails for CTR optimization", isIndexed: true },
      { id: "ad-copy", name: "Ad Copy", keyword: "ad copy analyzer", desc: "Analyze advertising copy effectiveness", isIndexed: true },
      { id: "headline", name: "Headline", keyword: "headline analyzer", desc: "Analyze headline strength and emotional impact", isIndexed: false },
      { id: "seo", name: "SEO", keyword: "seo analyzer", desc: "Analyze on-page SEO factors", isIndexed: false },
      { id: "readability", name: "Readability", keyword: "readability analyzer", desc: "Analyze text readability and grade level", isIndexed: false },
      { id: "sentiment", name: "Sentiment", keyword: "sentiment analyzer", desc: "Analyze text sentiment and emotion", isIndexed: false },
      { id: "grammar", name: "Grammar", keyword: "grammar checker", desc: "Check grammar and spelling errors", isIndexed: false },
      { id: "plagiarism", name: "Plagiarism", keyword: "plagiarism checker", desc: "Check content for plagiarism", isIndexed: false },
      { id: "email", name: "Email", keyword: "email analyzer", desc: "Analyze email subject lines and content", isIndexed: false },
      { id: "resume", name: "Resume", keyword: "resume analyzer", desc: "Analyze resume strength and ATS compatibility", isIndexed: false },
    ];
    
    return analyzerTypes.map(analyzer => ({
      slug: `${analyzer.id}-analyzer`,
      name: `${analyzer.name} Analyzer`,
      engineType: "ai-analysis" as const,
      segment: "creator" as const,
      priority: analyzer.isIndexed ? "primary" as const : "secondary" as const,
      isIndexed: analyzer.isIndexed,
      clusterSlug: "ai-content-tools",
      primaryKeyword: analyzer.keyword,
      secondaryKeywords: [
        `${analyzer.keyword} free`,
        `ai ${analyzer.keyword}`,
        `best ${analyzer.keyword}`,
      ],
      searchIntent: "action" as SearchIntent,
      h1: `${analyzer.name} Analyzer`,
      metaDescription: `${analyzer.desc}. Free AI-powered ${analyzer.name.toLowerCase()} analyzer.`,
      introCopy: `${analyzer.desc} with our AI-powered analysis tool.`,
    }));
  }
};

export const ENGINE_KEYWORD_MATRICES: Record<EngineType, EngineKeywordMatrix | null> = {
  "platform-resizer": PLATFORM_RESIZER_MATRIX,
  "calculator": CALCULATOR_MATRIX,
  "ai-analysis": AI_ANALYSIS_MATRIX,
  "image-compress": null,
  "image-convert": null,
  "text-transform": null,
  "text-analysis": null,
  "ai-generate": null,
  "file-convert": null,
  "file-edit": null,
  "community": null,
  "static": null,
  "standalone": null,
  "zip": null,
  "outfit": null,
  "price-engine": null,
};

export function getAllToolSkinsForEngine(engineId: EngineType): ToolSkin[] {
  const matrix = ENGINE_KEYWORD_MATRICES[engineId];
  if (!matrix) return [];
  return matrix.generateCombinations();
}

export function getTotalPotentialTools(): number {
  return Object.values(ENGINE_KEYWORD_MATRICES)
    .filter(m => m !== null)
    .reduce((total, matrix) => total + matrix!.generateCombinations().length, 0);
}

let _skinRegistry: Map<string, ToolSkin> | null = null;
let _allSkins: ToolSkin[] | null = null;

function buildSkinRegistry(): Map<string, ToolSkin> {
  if (_skinRegistry) return _skinRegistry;
  
  _skinRegistry = new Map();
  for (const matrix of Object.values(ENGINE_KEYWORD_MATRICES)) {
    if (!matrix) continue;
    for (const skin of matrix.generateCombinations()) {
      _skinRegistry.set(skin.slug, skin);
    }
  }
  return _skinRegistry;
}

function getAllSkins(): ToolSkin[] {
  if (_allSkins) return _allSkins;
  
  _allSkins = [];
  for (const matrix of Object.values(ENGINE_KEYWORD_MATRICES)) {
    if (!matrix) continue;
    _allSkins.push(...matrix.generateCombinations());
  }
  return _allSkins;
}

export function getAllToolSkins(): ToolSkin[] {
  return getAllSkins();
}

export function getToolSkinBySlug(slug: string): ToolSkin | undefined {
  return buildSkinRegistry().get(slug);
}

export function getAllIndexedSkins(): ToolSkin[] {
  return getAllSkins().filter(skin => skin.isIndexed);
}

export function getSkinsBySegment(segment: ToolSegment): ToolSkin[] {
  return getAllSkins().filter(skin => skin.segment === segment);
}

export function getSkinsByCluster(clusterSlug: string): ToolSkin[] {
  return getAllSkins().filter(skin => skin.clusterSlug === clusterSlug);
}

export function getCreatorSkins(): ToolSkin[] {
  return getAllSkins().filter(skin => 
    skin.segment === "creator" || skin.segment === "social"
  );
}

export function getMBBSkins(): ToolSkin[] {
  return getAllSkins().filter(skin => 
    skin.segment === "mbb" || skin.segment === "health" || skin.segment === "finance" || skin.segment === "utility"
  );
}

export function searchSkins(query: string): ToolSkin[] {
  const q = query.toLowerCase();
  return getAllSkins().filter(skin => 
    skin.primaryKeyword.toLowerCase().includes(q) ||
    skin.secondaryKeywords.some(kw => kw.toLowerCase().includes(q)) ||
    skin.name.toLowerCase().includes(q)
  );
}
