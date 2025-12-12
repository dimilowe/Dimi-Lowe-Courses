export type ToolCategory = 
  | "creator"
  | "image"
  | "video"
  | "writing"
  | "social"
  | "business"
  | "file"
  | "calculators"
  | "utilities"
  | "ai";

export type ToolTag = 
  | "trending"
  | "new"
  | "creator"
  | "image"
  | "video"
  | "writing"
  | "social"
  | "file"
  | "business"
  | "calculators"
  | "utilities"
  | "ai";

export type EngineType =
  | "platform-resizer"
  | "image-compress"
  | "image-convert"
  | "text-transform"
  | "text-analysis"
  | "calculator"
  | "ai-analysis"
  | "ai-generate"
  | "file-convert"
  | "file-edit"
  | "zip"
  | "community"
  | "static"
  | "standalone"
  | "outfit"
  | "price-engine";

export type InputType = "image" | "text" | "url" | "file" | "number" | "selection" | "none" | "multi";
export type OutputType = "image" | "text" | "file" | "download" | "analysis" | "display" | "interactive";
export type SearchIntent = "informational" | "action" | "transactional";

export interface Tool {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: ToolCategory;
  tags: ToolTag[];
  icon: string;
  iconBg: string;
  priority: number;
  isNew?: boolean;
  isTrending?: boolean;
  isMBB?: boolean;
  engineType: EngineType;
  inputType: InputType;
  outputType: OutputType;
  relatedTools: string[];
  relatedArticles: string[];
  primaryKeyword?: string;
  secondaryKeywords?: string[];
  searchIntent?: SearchIntent;
  pillarSlug?: string;
  clusterSlug?: string;
  recommendedTools?: string[];
  recommendedArticles?: string[];
}

export const CATEGORY_INFO: Record<ToolCategory, { label: string; description: string; emoji: string }> = {
  creator: {
    label: "Creator Tools",
    description: "Essential tools for content creators and influencers",
    emoji: "⭐"
  },
  image: {
    label: "Image & Media Tools",
    description: "Edit, resize, compress, and convert images",
    emoji: "📸"
  },
  video: {
    label: "Video Tools",
    description: "Edit, crop, and optimize video content",
    emoji: "🎥"
  },
  writing: {
    label: "Writing & Text Tools",
    description: "Write, edit, and format text content",
    emoji: "📝"
  },
  social: {
    label: "Social Media Tools",
    description: "Optimize content for social platforms",
    emoji: "📱"
  },
  business: {
    label: "Business Tools",
    description: "Calculate ROI, pricing, and business metrics",
    emoji: "📊"
  },
  file: {
    label: "File Tools",
    description: "Convert and manage PDF and document files",
    emoji: "📂"
  },
  calculators: {
    label: "Calculators",
    description: "Financial, health, and utility calculators",
    emoji: "🔢"
  },
  utilities: {
    label: "Utilities",
    description: "Random generators, converters, and handy tools",
    emoji: "🧩"
  },
  ai: {
    label: "AI Tools",
    description: "AI-powered analysis and generation tools",
    emoji: "🔮"
  }
};

export const TAG_INFO: Record<ToolTag, { label: string; emoji: string }> = {
  trending: { label: "Trending", emoji: "✨" },
  new: { label: "New", emoji: "🆕" },
  creator: { label: "Creator Tools", emoji: "⭐" },
  image: { label: "Image Tools", emoji: "📸" },
  video: { label: "Video Tools", emoji: "🎥" },
  writing: { label: "Writing", emoji: "📝" },
  social: { label: "Social Media", emoji: "📱" },
  file: { label: "File Tools", emoji: "📂" },
  business: { label: "Business", emoji: "📊" },
  calculators: { label: "Calculators", emoji: "🔢" },
  utilities: { label: "Utilities", emoji: "🧩" },
  ai: { label: "AI Tools", emoji: "🔮" }
};

export const toolsRegistry: Tool[] = [
  {
    id: "youtube-thumbnail-resizer",
    name: "YouTube Thumbnail Resizer",
    slug: "youtube-thumbnail-resizer",
    description: "Resize any image to the perfect YouTube thumbnail size (1280×720)",
    category: "creator",
    tags: ["creator", "social", "image", "trending"],
    icon: "Youtube",
    iconBg: "bg-red-500",
    priority: 100,
    isTrending: true,
    engineType: "platform-resizer",
    inputType: "image",
    outputType: "image",
    relatedTools: ["instagram-post-resizer", "tiktok-video-resizer", "ai-thumbnail-coach"],
    relatedArticles: ["youtube-thumbnail-size", "youtube-thumbnail-dimensions"]
  },
  {
    id: "ai-thumbnail-coach",
    name: "AI Thumbnail Coach",
    slug: "ai-thumbnail-coach",
    description: "Analyze and optimize your YouTube thumbnails with AI",
    category: "creator",
    tags: ["creator", "ai", "trending"],
    icon: "Youtube",
    iconBg: "bg-red-500",
    priority: 95,
    isTrending: true,
    engineType: "ai-analysis",
    inputType: "image",
    outputType: "analysis",
    relatedTools: ["youtube-thumbnail-resizer", "logo-generator"],
    relatedArticles: ["youtube-thumbnail-size"]
  },
  {
    id: "instagram-post-resizer",
    name: "Instagram Post Resizer",
    slug: "instagram-post-resizer",
    description: "Resize images to the perfect Instagram post size (1080×1080)",
    category: "creator",
    tags: ["creator", "social", "image"],
    icon: "Instagram",
    iconBg: "bg-pink-500",
    priority: 90,
    engineType: "platform-resizer",
    inputType: "image",
    outputType: "image",
    relatedTools: ["instagram-story-resizer", "youtube-thumbnail-resizer", "twitter-header-resizer"],
    relatedArticles: ["instagram-post-dimensions-guide", "instagram-post-design-tips"],
    primaryKeyword: "instagram post size",
    secondaryKeywords: ["instagram image dimensions", "instagram photo size 2024", "1080x1080 resizer", "instagram square size"],
    searchIntent: "action",
    pillarSlug: "social-media-image-sizes",
    clusterSlug: "instagram-image-tools",
    recommendedTools: ["instagram-story-resizer", "image-compressor", "heic-to-jpg"],
    recommendedArticles: ["instagram-post-dimensions-guide", "instagram-post-design-tips"]
  },
  {
    id: "instagram-story-resizer",
    name: "Instagram Story Resizer",
    slug: "instagram-story-resizer",
    description: "Resize images to the perfect Instagram Story size (1080×1920)",
    category: "creator",
    tags: ["creator", "social", "image"],
    icon: "Instagram",
    iconBg: "bg-gradient-to-r from-purple-500 to-pink-500",
    priority: 89,
    engineType: "platform-resizer",
    inputType: "image",
    outputType: "image",
    relatedTools: ["instagram-post-resizer", "tiktok-video-resizer"],
    relatedArticles: ["instagram-story-dimensions-guide", "instagram-story-design-tips"],
    primaryKeyword: "instagram story dimensions",
    searchIntent: "transactional",
    pillarSlug: "social-media-image-sizes"
  },
  {
    id: "tiktok-video-resizer",
    name: "TikTok Cover Resizer",
    slug: "tiktok-video-resizer",
    description: "Resize images to the perfect TikTok video cover size (1080×1920)",
    category: "creator",
    tags: ["creator", "social", "image"],
    icon: "Video",
    iconBg: "bg-black",
    priority: 88,
    engineType: "platform-resizer",
    inputType: "image",
    outputType: "image",
    relatedTools: ["instagram-story-resizer", "youtube-thumbnail-resizer"],
    relatedArticles: ["tiktok-cover-dimensions-guide", "tiktok-cover-design-tips"],
    primaryKeyword: "tiktok video cover size",
    searchIntent: "transactional",
    pillarSlug: "social-media-image-sizes"
  },
  {
    id: "youtube-title-split-test",
    name: "YouTube Title Split-Test",
    slug: "youtube-title-split-test",
    description: "A/B test your YouTube video titles with auto-rotation and CTR tracking",
    category: "creator",
    tags: ["creator", "social"],
    icon: "RotateCcw",
    iconBg: "bg-red-500",
    priority: 85,
    engineType: "standalone",
    inputType: "text",
    outputType: "interactive",
    relatedTools: ["youtube-thumbnail-resizer", "ai-thumbnail-coach"],
    relatedArticles: []
  },
  {
    id: "emoji-combos",
    name: "Emoji Combos",
    slug: "emoji-combos",
    description: "Copy aesthetic emoji combinations for your social bios",
    category: "creator",
    tags: ["creator", "social"],
    icon: "Smile",
    iconBg: "bg-yellow-400",
    priority: 80,
    engineType: "community",
    inputType: "selection",
    outputType: "text",
    relatedTools: ["resource-box", "name-combiner"],
    relatedArticles: []
  },
  {
    id: "photo-gallery-maker",
    name: "Photo Gallery Maker",
    slug: "photo-gallery-maker",
    description: "Create multi-photo gallery layouts with grid, masonry, or horizontal strip options",
    category: "creator",
    tags: ["creator", "image"],
    icon: "Images",
    iconBg: "bg-indigo-500",
    priority: 78,
    engineType: "standalone",
    inputType: "image",
    outputType: "image",
    relatedTools: ["image-compressor", "instagram-post-resizer"],
    relatedArticles: []
  },
  {
    id: "horoscope-of-the-day",
    name: "Daily Horoscope",
    slug: "horoscope-of-the-day",
    description: "Get your personalized AI-powered daily horoscope reading",
    category: "creator",
    tags: ["creator", "ai"],
    icon: "Star",
    iconBg: "bg-purple-400",
    priority: 75,
    engineType: "ai-generate",
    inputType: "selection",
    outputType: "text",
    relatedTools: ["affirmation-about-self-love"],
    relatedArticles: []
  },
  {
    id: "name-combiner",
    name: "Name Combiner",
    slug: "name-combiner",
    description: "Combine 2-3 names into creative mashups for couples or groups",
    category: "creator",
    tags: ["creator", "utilities"],
    icon: "Users",
    iconBg: "bg-cyan-500",
    priority: 70,
    engineType: "text-transform",
    inputType: "text",
    outputType: "text",
    relatedTools: ["emoji-combos"],
    relatedArticles: []
  },
  {
    id: "social-media-image-sizes",
    name: "Image Size Guide",
    slug: "social-media-image-sizes",
    description: "Complete guide to image dimensions for all social platforms",
    category: "creator",
    tags: ["creator", "social", "image"],
    icon: "Images",
    iconBg: "bg-orange-500",
    priority: 65,
    engineType: "static",
    inputType: "none",
    outputType: "display",
    relatedTools: ["youtube-thumbnail-resizer", "instagram-post-resizer", "twitter-header-resizer"],
    relatedArticles: []
  },
  {
    id: "resource-box",
    name: "Resource Box",
    slug: "resource-box",
    description: "Create shareable link collections for your bio",
    category: "creator",
    tags: ["creator", "social"],
    icon: "LayoutGrid",
    iconBg: "bg-teal-500",
    priority: 60,
    engineType: "standalone",
    inputType: "multi",
    outputType: "interactive",
    relatedTools: ["emoji-combos"],
    relatedArticles: []
  },
  {
    id: "image-compressor",
    name: "Image Compressor",
    slug: "image-compressor",
    description: "Compress JPG, PNG, and WebP images with smart optimization",
    category: "image",
    tags: ["image", "trending"],
    icon: "FileImage",
    iconBg: "bg-sky-500",
    priority: 90,
    isTrending: true,
    engineType: "image-compress",
    inputType: "image",
    outputType: "download",
    relatedTools: ["gif-compressor", "heic-to-jpg"],
    relatedArticles: []
  },
  {
    id: "heic-to-jpg",
    name: "HEIC to JPG Converter",
    slug: "heic-to-jpg",
    description: "Convert iPhone HEIC photos to JPG format online. Free, private, no upload.",
    category: "image",
    tags: ["image", "file"],
    icon: "FileImage",
    iconBg: "bg-rose-500",
    priority: 85,
    engineType: "image-convert",
    inputType: "image",
    outputType: "download",
    relatedTools: ["image-compressor", "gif-maker"],
    relatedArticles: []
  },
  {
    id: "gif-compressor",
    name: "GIF Compressor",
    slug: "gif-compressor",
    description: "Compress GIF files to reduce size while maintaining quality",
    category: "image",
    tags: ["image"],
    icon: "FileImage",
    iconBg: "bg-violet-500",
    priority: 80,
    engineType: "image-compress",
    inputType: "image",
    outputType: "download",
    relatedTools: ["image-compressor", "gif-maker"],
    relatedArticles: []
  },
  {
    id: "gif-maker",
    name: "GIF Maker",
    slug: "gif-maker",
    description: "Convert video or images to GIF directly in your browser",
    category: "image",
    tags: ["image", "video"],
    icon: "FileImage",
    iconBg: "bg-fuchsia-500",
    priority: 78,
    engineType: "image-convert",
    inputType: "multi",
    outputType: "download",
    relatedTools: ["gif-compressor", "heic-to-jpg"],
    relatedArticles: []
  },
  {
    id: "twitter-header-resizer",
    name: "Twitter/X Header Resizer",
    slug: "twitter-header-resizer",
    description: "Resize images to the perfect Twitter/X header size (1500×500)",
    category: "social",
    tags: ["social", "image"],
    icon: "Twitter",
    iconBg: "bg-sky-400",
    priority: 85,
    engineType: "platform-resizer",
    inputType: "image",
    outputType: "image",
    relatedTools: ["linkedin-banner-resizer", "youtube-thumbnail-resizer"],
    relatedArticles: ["twitter-header-size"]
  },
  {
    id: "linkedin-banner-resizer",
    name: "LinkedIn Banner Resizer",
    slug: "linkedin-banner-resizer",
    description: "Resize images to the perfect LinkedIn banner size (1584×396)",
    category: "social",
    tags: ["social", "image"],
    icon: "Linkedin",
    iconBg: "bg-blue-600",
    priority: 80,
    engineType: "platform-resizer",
    inputType: "image",
    outputType: "image",
    relatedTools: ["twitter-header-resizer", "instagram-post-resizer"],
    relatedArticles: ["linkedin-banner-size"]
  },
  {
    id: "word-counter",
    name: "Word Counter",
    slug: "word-counter",
    description: "Count words, characters, sentences, and reading time",
    category: "writing",
    tags: ["writing"],
    icon: "Type",
    iconBg: "bg-gray-500",
    priority: 85,
    engineType: "text-analysis",
    inputType: "text",
    outputType: "analysis",
    relatedTools: ["online-notepad", "summarizer"],
    relatedArticles: []
  },
  {
    id: "online-notepad",
    name: "Online Notepad",
    slug: "online-notepad",
    description: "Write notes online with auto-save and AI-powered writing tools",
    category: "writing",
    tags: ["writing", "ai"],
    icon: "StickyNote",
    iconBg: "bg-amber-500",
    priority: 80,
    engineType: "standalone",
    inputType: "text",
    outputType: "text",
    relatedTools: ["word-counter", "summarizer"],
    relatedArticles: []
  },
  {
    id: "summarizer",
    name: "AI Summarizer",
    slug: "summarizer",
    description: "Summarize any text and extract key takeaways instantly",
    category: "writing",
    tags: ["writing", "ai"],
    icon: "FileText",
    iconBg: "bg-yellow-500",
    priority: 78,
    engineType: "ai-analysis",
    inputType: "text",
    outputType: "text",
    relatedTools: ["word-counter", "ai-humanizer-free"],
    relatedArticles: []
  },
  {
    id: "maker-quotes-generator",
    name: "Maker Quotes Generator",
    slug: "maker-quotes-generator",
    description: "Generate inspiring quotes for creators, builders, and entrepreneurs",
    category: "writing",
    tags: ["writing", "creator"],
    icon: "Quote",
    iconBg: "bg-orange-500",
    priority: 70,
    isMBB: true,
    engineType: "ai-generate",
    inputType: "selection",
    outputType: "text",
    relatedTools: ["affirmation-about-self-love", "horoscope-of-the-day"],
    relatedArticles: ["maker-quotes-generator"]
  },
  {
    id: "pdf-editor",
    name: "PDF Editor",
    slug: "pdf-editor",
    description: "Upload, rearrange, rotate, delete pages, and download your edited PDF",
    category: "file",
    tags: ["file"],
    icon: "FilePen",
    iconBg: "bg-red-500",
    priority: 90,
    engineType: "file-edit",
    inputType: "file",
    outputType: "download",
    relatedTools: ["image-compressor"],
    relatedArticles: []
  },
  {
    id: "calorie-counter-bmi",
    name: "BMI & Calorie Calculator",
    slug: "calorie-counter-bmi",
    description: "Combined BMI + daily calorie calculator with weight goal suggestions",
    category: "calculators",
    tags: ["calculators", "trending"],
    icon: "Calculator",
    iconBg: "bg-green-500",
    priority: 90,
    isTrending: true,
    isMBB: true,
    engineType: "calculator",
    inputType: "number",
    outputType: "analysis",
    relatedTools: ["calorie-counter-free", "calorie-counter-maintenance", "calorie-counter-walking"],
    relatedArticles: ["calorie-counter-bmi"]
  },
  {
    id: "calorie-counter-free",
    name: "Free Calorie Counter",
    slug: "calorie-counter-free",
    description: "100% free online calorie calculator. Track daily food intake.",
    category: "calculators",
    tags: ["calculators"],
    icon: "Calculator",
    iconBg: "bg-green-500",
    priority: 88,
    isMBB: true,
    engineType: "calculator",
    inputType: "number",
    outputType: "analysis",
    relatedTools: ["calorie-counter-bmi", "calorie-counter-best"],
    relatedArticles: ["calorie-counter-free"]
  },
  {
    id: "calorie-counter-walking",
    name: "Walking Calorie Calculator",
    slug: "calorie-counter-walking",
    description: "Calculate calories burned from walking based on duration, weight, and intensity",
    category: "calculators",
    tags: ["calculators"],
    icon: "Footprints",
    iconBg: "bg-green-500",
    priority: 85,
    isMBB: true,
    engineType: "calculator",
    inputType: "number",
    outputType: "analysis",
    relatedTools: ["calorie-counter-steps", "calorie-counter-treadmill"],
    relatedArticles: ["calorie-counter-walking"]
  },
  {
    id: "calorie-counter-treadmill",
    name: "Treadmill Calorie Counter",
    slug: "calorie-counter-treadmill",
    description: "MET-based treadmill calorie calculator with speed, incline, and duration",
    category: "calculators",
    tags: ["calculators"],
    icon: "Dumbbell",
    iconBg: "bg-green-500",
    priority: 84,
    isMBB: true,
    engineType: "calculator",
    inputType: "number",
    outputType: "analysis",
    relatedTools: ["calorie-counter-walking", "calorie-counter-steps"],
    relatedArticles: ["calorie-counter-treadmill"]
  },
  {
    id: "calorie-counter-steps",
    name: "Steps to Calories Calculator",
    slug: "calorie-counter-steps",
    description: "Convert steps walked into estimated calories burned",
    category: "calculators",
    tags: ["calculators"],
    icon: "Footprints",
    iconBg: "bg-green-500",
    priority: 82,
    isMBB: true,
    engineType: "calculator",
    inputType: "number",
    outputType: "analysis",
    relatedTools: ["calorie-counter-walking", "calorie-counter-treadmill"],
    relatedArticles: ["calorie-counter-steps"]
  },
  {
    id: "calorie-counter-maintenance",
    name: "Maintenance Calories Calculator",
    slug: "calorie-counter-maintenance",
    description: "Calculate your TDEE and maintenance calories using Mifflin-St Jeor formula",
    category: "calculators",
    tags: ["calculators"],
    icon: "Calculator",
    iconBg: "bg-green-500",
    priority: 80,
    isMBB: true,
    engineType: "calculator",
    inputType: "number",
    outputType: "analysis",
    relatedTools: ["calorie-counter-bmi", "calorie-counter-free"],
    relatedArticles: ["calorie-counter-maintenance"]
  },
  {
    id: "calorie-counter-best",
    name: "Best Calorie Counter",
    slug: "calorie-counter-best",
    description: "Daily intake vs target calculator with comparison of top calorie counters",
    category: "calculators",
    tags: ["calculators"],
    icon: "Calculator",
    iconBg: "bg-green-500",
    priority: 78,
    isMBB: true,
    engineType: "calculator",
    inputType: "number",
    outputType: "analysis",
    relatedTools: ["calorie-counter-free", "calorie-counter-bmi"],
    relatedArticles: ["calorie-counter-best"]
  },
  {
    id: "401k-retirement-calculator",
    name: "401k Retirement Estimator",
    slug: "401k-retirement-calculator",
    description: "Project 401k balance at retirement with year-by-year projection",
    category: "calculators",
    tags: ["calculators", "business"],
    icon: "PiggyBank",
    iconBg: "bg-blue-500",
    priority: 75,
    isMBB: true,
    engineType: "calculator",
    inputType: "number",
    outputType: "analysis",
    relatedTools: ["loan-estimator-home"],
    relatedArticles: ["401k-retirement-calculator"]
  },
  {
    id: "loan-estimator-home",
    name: "Home Loan Estimator",
    slug: "loan-estimator-home",
    description: "Calculate monthly mortgage payments, total interest, and home loan costs",
    category: "calculators",
    tags: ["calculators", "business"],
    icon: "Home",
    iconBg: "bg-blue-500",
    priority: 72,
    isMBB: true,
    engineType: "calculator",
    inputType: "number",
    outputType: "analysis",
    relatedTools: ["401k-retirement-calculator"],
    relatedArticles: ["loan-estimator-home"]
  },
  {
    id: "ups-shipping-cost",
    name: "UPS Shipping Estimator",
    slug: "ups-shipping-cost",
    description: "Calculate estimated UPS shipping costs based on weight, dimensions, and distance",
    category: "calculators",
    tags: ["calculators", "business"],
    icon: "Package",
    iconBg: "bg-amber-600",
    priority: 70,
    isMBB: true,
    engineType: "calculator",
    inputType: "number",
    outputType: "analysis",
    relatedTools: ["estimator-for-car-repair"],
    relatedArticles: ["ups-shipping-cost"]
  },
  {
    id: "estimator-for-car-repair",
    name: "Car Repair Estimator",
    slug: "estimator-for-car-repair",
    description: "Calculate car repair costs based on repair type, severity, and location",
    category: "calculators",
    tags: ["calculators"],
    icon: "Car",
    iconBg: "bg-gray-600",
    priority: 68,
    isMBB: true,
    engineType: "calculator",
    inputType: "selection",
    outputType: "analysis",
    relatedTools: ["ups-shipping-cost"],
    relatedArticles: ["estimator-for-car-repair"]
  },
  {
    id: "visualization",
    name: "Visualization Tool",
    slug: "visualization",
    description: "Turn text into flowcharts, diagrams, and visual maps",
    category: "utilities",
    tags: ["utilities", "ai"],
    icon: "GitBranch",
    iconBg: "bg-amber-500",
    priority: 80,
    engineType: "ai-generate",
    inputType: "text",
    outputType: "display",
    relatedTools: ["summarizer"],
    relatedArticles: []
  },
  {
    id: "weather-prediction",
    name: "Weather Prediction",
    slug: "weather-prediction",
    description: "Instant weather forecast with current conditions and 7-day prediction",
    category: "utilities",
    tags: ["utilities"],
    icon: "CloudSun",
    iconBg: "bg-sky-400",
    priority: 75,
    isMBB: true,
    engineType: "standalone",
    inputType: "text",
    outputType: "display",
    relatedTools: ["prediction-center"],
    relatedArticles: ["weather-prediction"]
  },
  {
    id: "prediction-center",
    name: "Prediction Center",
    slug: "prediction-center",
    description: "Submit predictions about future events and vote YES or NO",
    category: "utilities",
    tags: ["utilities"],
    icon: "TrendingUp",
    iconBg: "bg-purple-500",
    priority: 70,
    engineType: "community",
    inputType: "text",
    outputType: "interactive",
    relatedTools: ["weather-prediction"],
    relatedArticles: []
  },
  {
    id: "calorie-deficit-calculator",
    name: "Calorie Deficit Calculator",
    slug: "calorie-deficit-calculator",
    description: "Snap your food + Health app screenshot to see today's calorie balance",
    category: "ai",
    tags: ["ai", "trending", "new"],
    icon: "Flame",
    iconBg: "bg-green-500",
    priority: 95,
    isTrending: true,
    isNew: true,
    engineType: "ai-analysis",
    inputType: "image",
    outputType: "analysis",
    relatedTools: ["calorie-counter-bmi", "calorie-counter-free"],
    relatedArticles: ["best-free-calorie-counters", "calorie-counter-mistakes"],
    primaryKeyword: "calorie deficit calculator",
    searchIntent: "transactional",
    pillarSlug: "health-fitness-calculators"
  },
  {
    id: "outfit-ideas",
    name: "Outfit Ideas Generator",
    slug: "outfit-ideas",
    description: "Upload outfit photos and find similar items to shop with AI",
    category: "ai",
    tags: ["ai", "new"],
    icon: "ShoppingBag",
    iconBg: "bg-pink-500",
    priority: 90,
    isNew: true,
    engineType: "ai-analysis",
    inputType: "image",
    outputType: "display",
    relatedTools: ["logo-generator"],
    relatedArticles: []
  },
  {
    id: "logo-generator",
    name: "Logo Generator",
    slug: "logo-generator",
    description: "Create AI-powered logos for your brand in seconds",
    category: "ai",
    tags: ["ai", "creator"],
    icon: "Palette",
    iconBg: "bg-pink-500",
    priority: 88,
    engineType: "ai-generate",
    inputType: "text",
    outputType: "image",
    relatedTools: ["ai-thumbnail-coach", "producer-tag-generator"],
    relatedArticles: []
  },
  {
    id: "ai-humanizer-free",
    name: "AI Humanizer Free",
    slug: "ai-humanizer-free",
    description: "Detect AI-written content and humanize it to sound natural",
    category: "ai",
    tags: ["ai", "writing"],
    icon: "Palette",
    iconBg: "bg-indigo-500",
    priority: 85,
    engineType: "ai-analysis",
    inputType: "text",
    outputType: "text",
    relatedTools: ["summarizer", "word-counter"],
    relatedArticles: []
  },
  {
    id: "keyword-finder",
    name: "Keyword Finder",
    slug: "keyword-finder",
    description: "Find low-competition SEO keywords for your content",
    category: "ai",
    tags: ["ai", "business"],
    icon: "Search",
    iconBg: "bg-blue-500",
    priority: 82,
    engineType: "ai-analysis",
    inputType: "text",
    outputType: "analysis",
    relatedTools: ["reach-grabber-tool", "internal-link-seo-audit"],
    relatedArticles: []
  },
  {
    id: "reach-grabber-tool",
    name: "Reach Grabber Tool",
    slug: "reach-grabber-tool",
    description: "AI-powered SEO optimizer for your blog posts and articles",
    category: "ai",
    tags: ["ai", "business"],
    icon: "Target",
    iconBg: "bg-orange-500",
    priority: 80,
    engineType: "ai-analysis",
    inputType: "text",
    outputType: "analysis",
    relatedTools: ["keyword-finder", "ad-copy-analyzer"],
    relatedArticles: []
  },
  {
    id: "ad-copy-analyzer",
    name: "Ad Copy Analyzer",
    slug: "ad-copy-analyzer",
    description: "Analyze any ad copy and get scores, insights, and improved versions",
    category: "ai",
    tags: ["ai", "business"],
    icon: "Megaphone",
    iconBg: "bg-cyan-500",
    priority: 78,
    engineType: "ai-analysis",
    inputType: "text",
    outputType: "analysis",
    relatedTools: ["reach-grabber-tool", "keyword-finder"],
    relatedArticles: []
  },
  {
    id: "internal-link-seo-audit",
    name: "Internal Link Audit",
    slug: "internal-link-seo-audit",
    description: "Find orphan pages and weak internal links to improve your SEO",
    category: "ai",
    tags: ["ai", "business"],
    icon: "Link2",
    iconBg: "bg-emerald-500",
    priority: 75,
    engineType: "ai-analysis",
    inputType: "url",
    outputType: "analysis",
    relatedTools: ["keyword-finder", "reach-grabber-tool"],
    relatedArticles: []
  },
  {
    id: "producer-tag-generator",
    name: "Producer Tag Generator",
    slug: "producer-tag-generator",
    description: "Create custom AI voice tags for your beats and instrumentals",
    category: "ai",
    tags: ["ai", "creator"],
    icon: "Music",
    iconBg: "bg-green-500",
    priority: 70,
    engineType: "ai-generate",
    inputType: "text",
    outputType: "download",
    relatedTools: ["logo-generator"],
    relatedArticles: []
  },
  {
    id: "affirmation-about-self-love",
    name: "Self-Love Affirmations",
    slug: "affirmation-about-self-love",
    description: "Daily AI-generated affirmations for self-love and confidence",
    category: "ai",
    tags: ["ai"],
    icon: "Heart",
    iconBg: "bg-pink-400",
    priority: 65,
    engineType: "ai-generate",
    inputType: "selection",
    outputType: "text",
    relatedTools: ["horoscope-of-the-day", "maker-quotes-generator"],
    relatedArticles: ["affirmation-about-self-love"]
  }
];

export const CATEGORY_ORDER: ToolCategory[] = [
  "creator",
  "image",
  "video",
  "writing",
  "social",
  "business",
  "file",
  "calculators",
  "utilities",
  "ai"
];

export function getToolsByCategory(category: ToolCategory): Tool[] {
  return toolsRegistry
    .filter(tool => tool.category === category)
    .sort((a, b) => b.priority - a.priority);
}

export function getToolsByTag(tag: ToolTag): Tool[] {
  return toolsRegistry
    .filter(tool => tool.tags.includes(tag))
    .sort((a, b) => b.priority - a.priority);
}

export function getTrendingTools(): Tool[] {
  return toolsRegistry
    .filter(tool => tool.isTrending)
    .sort((a, b) => b.priority - a.priority);
}

export function getNewTools(): Tool[] {
  return toolsRegistry
    .filter(tool => tool.isNew)
    .sort((a, b) => b.priority - a.priority);
}

export function searchTools(query: string): Tool[] {
  const q = query.toLowerCase().trim();
  if (!q) return toolsRegistry.sort((a, b) => b.priority - a.priority);
  
  return toolsRegistry
    .filter(tool => 
      tool.name.toLowerCase().includes(q) ||
      tool.description.toLowerCase().includes(q) ||
      tool.tags.some(tag => tag.toLowerCase().includes(q))
    )
    .sort((a, b) => {
      const aNameMatch = a.name.toLowerCase().includes(q) ? 1 : 0;
      const bNameMatch = b.name.toLowerCase().includes(q) ? 1 : 0;
      if (aNameMatch !== bNameMatch) return bNameMatch - aNameMatch;
      return b.priority - a.priority;
    });
}

export function getAllToolsAlphabetically(): Tool[] {
  return [...toolsRegistry].sort((a, b) => a.name.localeCompare(b.name));
}

export function getToolCount(): number {
  return toolsRegistry.length;
}
