export const IMAGE_SIZE_BANK_SLUG = "image-size";
export const IMAGE_SIZE_BANK_HUB_PATH = "/tools/image-size-bank";
export const IMAGE_SIZE_TOOL_SLUG = "social-media-image-sizes";

export type ImageSizeTemplate = {
  slug: string;
  phrase: string;
  phraseSlug: string;
  titlePattern: string;
  descriptionPattern: string;
  introPattern: string;
};

export type ImageSizeEntity = {
  key: string;
  name: string;
  platform: string;
  assetType: string;
  width: number;
  height: number;
  aspectRatio: string;
  safeAreaTips: string;
  notes: string;
  priority: number;
};

type BaseImageSizePlacement = Omit<ImageSizeEntity, "priority">;

type ImageSizeVariant = {
  slugSuffix: string;
  nameSuffix: string;
  assetTypeSuffix: string;
  safeAreaPrefix: string;
  notesSuffix: string;
};

const baseImageSizePlacements: BaseImageSizePlacement[] = [
  {
    key: "instagram-story",
    name: "Instagram Story",
    platform: "Instagram",
    assetType: "Story",
    width: 1080,
    height: 1920,
    aspectRatio: "9:16",
    safeAreaTips: "Keep text and logos centered; avoid top and bottom UI overlays.",
    notes: "Most Story placements honor full 9:16 vertical layout.",
  },
  {
    key: "instagram-post-square",
    name: "Instagram Post (Square)",
    platform: "Instagram",
    assetType: "Feed Post",
    width: 1080,
    height: 1080,
    aspectRatio: "1:1",
    safeAreaTips: "Use high-contrast center composition for feed and profile grid consistency.",
    notes: "Square remains the safest cross-device post format.",
  },
  {
    key: "instagram-reel-cover",
    name: "Instagram Reel Cover",
    platform: "Instagram",
    assetType: "Reel Cover",
    width: 1080,
    height: 1920,
    aspectRatio: "9:16",
    safeAreaTips: "Keep headline text away from lower UI controls.",
    notes: "Cover preview in profile grid is center-cropped.",
  },
  {
    key: "youtube-thumbnail",
    name: "YouTube Thumbnail",
    platform: "YouTube",
    assetType: "Thumbnail",
    width: 1280,
    height: 720,
    aspectRatio: "16:9",
    safeAreaTips: "Prioritize large readable text and high-contrast focal subject.",
    notes: "Keep important elements inside a center-safe zone for small previews.",
  },
  {
    key: "youtube-channel-banner",
    name: "YouTube Channel Banner",
    platform: "YouTube",
    assetType: "Channel Art",
    width: 2560,
    height: 1440,
    aspectRatio: "16:9",
    safeAreaTips: "Critical text should remain in the 1546x423 center safe area.",
    notes: "Desktop, TV, and mobile crop differently, so center-safe is mandatory.",
  },
  {
    key: "tiktok-video",
    name: "TikTok Video",
    platform: "TikTok",
    assetType: "Video Frame",
    width: 1080,
    height: 1920,
    aspectRatio: "9:16",
    safeAreaTips: "Avoid placing text under caption and action-bar regions.",
    notes: "Vertical full-screen ratio is standard for feed placement.",
  },
  {
    key: "facebook-cover-photo",
    name: "Facebook Cover Photo",
    platform: "Facebook",
    assetType: "Cover",
    width: 851,
    height: 315,
    aspectRatio: "2.7:1",
    safeAreaTips: "Center key elements to avoid profile-image overlap and mobile crop.",
    notes: "Desktop and mobile display areas differ.",
  },
  {
    key: "facebook-post-image",
    name: "Facebook Post Image",
    platform: "Facebook",
    assetType: "Feed Post",
    width: 1200,
    height: 630,
    aspectRatio: "1.91:1",
    safeAreaTips: "Use broad horizontal composition for ad and feed compatibility.",
    notes: "Widely used for link previews and organic posts.",
  },
  {
    key: "twitter-header",
    name: "X (Twitter) Header",
    platform: "X",
    assetType: "Profile Header",
    width: 1500,
    height: 500,
    aspectRatio: "3:1",
    safeAreaTips: "Leave left-side breathing room to avoid profile-image overlap.",
    notes: "High-contrast horizontal design performs best.",
  },
  {
    key: "linkedin-banner",
    name: "LinkedIn Banner",
    platform: "LinkedIn",
    assetType: "Profile Banner",
    width: 1584,
    height: 396,
    aspectRatio: "4:1",
    safeAreaTips: "Keep logos and headlines centered away from profile photo zone.",
    notes: "Professional layouts should avoid tiny low-contrast text.",
  },
  {
    key: "linkedin-post-image",
    name: "LinkedIn Post Image",
    platform: "LinkedIn",
    assetType: "Feed Post",
    width: 1200,
    height: 627,
    aspectRatio: "1.91:1",
    safeAreaTips: "Use simple visual hierarchy for mobile scroll readability.",
    notes: "Recommended for shared post cards.",
  },
  {
    key: "pinterest-pin",
    name: "Pinterest Pin",
    platform: "Pinterest",
    assetType: "Standard Pin",
    width: 1000,
    height: 1500,
    aspectRatio: "2:3",
    safeAreaTips: "Place text center-top and avoid tiny footer labels.",
    notes: "Tall vertical format helps feed real estate.",
  },
  {
    key: "snapchat-ad",
    name: "Snapchat Ad",
    platform: "Snapchat",
    assetType: "Ad Creative",
    width: 1080,
    height: 1920,
    aspectRatio: "9:16",
    safeAreaTips: "Reserve bottom space for CTA and interface overlays.",
    notes: "Keep the focal product or person near center.",
  },
  {
    key: "threads-post",
    name: "Threads Post Image",
    platform: "Threads",
    assetType: "Feed Post",
    width: 1080,
    height: 1350,
    aspectRatio: "4:5",
    safeAreaTips: "Center visuals to protect against feed crop variants.",
    notes: "4:5 tends to maximize vertical real estate in feed.",
  },
  {
    key: "whatsapp-status",
    name: "WhatsApp Status",
    platform: "WhatsApp",
    assetType: "Status",
    width: 1080,
    height: 1920,
    aspectRatio: "9:16",
    safeAreaTips: "Avoid edge text and keep key copy in the central safe zone.",
    notes: "Status behaves similarly to Story-style placement.",
  },
  {
    key: "twitch-profile-banner",
    name: "Twitch Profile Banner",
    platform: "Twitch",
    assetType: "Channel Banner",
    width: 1200,
    height: 480,
    aspectRatio: "5:2",
    safeAreaTips: "Keep text high-contrast and centered for mixed display widths.",
    notes: "Use minimal clutter and prioritize stream branding.",
  },
  {
    key: "twitch-offline-banner",
    name: "Twitch Offline Banner",
    platform: "Twitch",
    assetType: "Offline Screen",
    width: 1920,
    height: 1080,
    aspectRatio: "16:9",
    safeAreaTips: "Center message and social handles for TV and desktop clarity.",
    notes: "Optimize for large-screen readability.",
  },
  {
    key: "shopify-product-image",
    name: "Shopify Product Image",
    platform: "Shopify",
    assetType: "Product Photo",
    width: 2048,
    height: 2048,
    aspectRatio: "1:1",
    safeAreaTips: "Maintain even margins around product to support zoom and crop.",
    notes: "Square high-res images support storefront zoom behavior.",
  },
  {
    key: "etsy-listing-photo",
    name: "Etsy Listing Photo",
    platform: "Etsy",
    assetType: "Listing Photo",
    width: 2000,
    height: 2000,
    aspectRatio: "1:1",
    safeAreaTips: "Keep product centered and avoid edge text overlays.",
    notes: "Uniform squares improve shop-grid consistency.",
  },
  {
    key: "amazon-product-image",
    name: "Amazon Product Image",
    platform: "Amazon",
    assetType: "Main Product Image",
    width: 2000,
    height: 2000,
    aspectRatio: "1:1",
    safeAreaTips: "Use clean background and maximize product occupancy.",
    notes: "High-resolution images improve zoom and detail experience.",
  },
  {
    key: "spotify-podcast-cover",
    name: "Spotify Podcast Cover",
    platform: "Spotify",
    assetType: "Cover Art",
    width: 3000,
    height: 3000,
    aspectRatio: "1:1",
    safeAreaTips: "Use large typography for readability on mobile mini-cards.",
    notes: "Square format with high-res export is recommended.",
  },
  {
    key: "apple-podcast-cover",
    name: "Apple Podcast Cover",
    platform: "Apple Podcasts",
    assetType: "Cover Art",
    width: 3000,
    height: 3000,
    aspectRatio: "1:1",
    safeAreaTips: "Avoid tiny subtitle text and prioritize clear brand mark.",
    notes: "Podcast apps often display covers at small sizes.",
  },
  {
    key: "google-display-ad-medium-rectangle",
    name: "Google Display Ad (Medium Rectangle)",
    platform: "Google Ads",
    assetType: "Display Ad",
    width: 300,
    height: 250,
    aspectRatio: "6:5",
    safeAreaTips: "Keep CTA visible with strong top-to-bottom hierarchy.",
    notes: "One of the most common display placements.",
  },
  {
    key: "google-display-ad-leaderboard",
    name: "Google Display Ad (Leaderboard)",
    platform: "Google Ads",
    assetType: "Display Ad",
    width: 728,
    height: 90,
    aspectRatio: "8.09:1",
    safeAreaTips: "Use short copy and one dominant visual anchor.",
    notes: "Horizontal ad unit common for web placements.",
  },
];

const imageSizeVariants: ImageSizeVariant[] = [
  {
    slugSuffix: "",
    nameSuffix: "",
    assetTypeSuffix: "",
    safeAreaPrefix: "",
    notesSuffix: "",
  },
  {
    slugSuffix: "ads",
    nameSuffix: " for Ads",
    assetTypeSuffix: " (Ad Campaign)",
    safeAreaPrefix: "Reserve extra edge padding for ad overlays and CTA controls. ",
    notesSuffix: " Validate preview crops in ad manager before launch.",
  },
  {
    slugSuffix: "business",
    nameSuffix: " for Business Pages",
    assetTypeSuffix: " (Business)",
    safeAreaPrefix: "Keep brand marks and headline text in the center-safe area. ",
    notesSuffix: " Prioritize legibility and offer clarity for business audiences.",
  },
  {
    slugSuffix: "creator",
    nameSuffix: " for Creator Brands",
    assetTypeSuffix: " (Creator)",
    safeAreaPrefix: "Protect face framing and key text from interface overlays. ",
    notesSuffix: " Keep visual identity consistent across channel touchpoints.",
  },
  {
    slugSuffix: "mobile-safe",
    nameSuffix: " Mobile Safe Area",
    assetTypeSuffix: " (Mobile Safe)",
    safeAreaPrefix: "Keep all critical design elements inside the central 80% safe zone. ",
    notesSuffix: " Test on smaller displays before publishing at scale.",
  },
];

function buildImageSizeEntities(): ImageSizeEntity[] {
  const entities: ImageSizeEntity[] = [];
  let priority = 1;

  for (const placement of baseImageSizePlacements) {
    for (const variant of imageSizeVariants) {
      entities.push({
        key: variant.slugSuffix ? `${placement.key}-${variant.slugSuffix}` : placement.key,
        name: `${placement.name}${variant.nameSuffix}`,
        platform: placement.platform,
        assetType: `${placement.assetType}${variant.assetTypeSuffix}`,
        width: placement.width,
        height: placement.height,
        aspectRatio: placement.aspectRatio,
        safeAreaTips: `${variant.safeAreaPrefix}${placement.safeAreaTips}`.trim(),
        notes: `${placement.notes}${variant.notesSuffix}`.trim(),
        priority,
      });
      priority += 1;
    }
  }

  return entities;
}

export const imageSizeTemplates: ImageSizeTemplate[] = [
  {
    slug: "size",
    phrase: "{entity} size",
    phraseSlug: "size",
    titlePattern: "{entity} Size ({width}x{height}) | Free Resizer + Safe Area Tips",
    descriptionPattern:
      "Use the exact {entity} size ({width}x{height}, {aspectRatio}) with safe-area guidance and a free online image resizer workflow.",
    introPattern:
      "{entity} size is {width}x{height} pixels ({aspectRatio}). Use these exact dimensions for cleaner uploads, better crop behavior, and consistent rendering across devices.",
  },
  {
    slug: "dimensions",
    phrase: "{entity} dimensions",
    phraseSlug: "dimensions",
    titlePattern: "{entity} Dimensions: {width} x {height} Pixels (Updated Guide)",
    descriptionPattern:
      "Find accurate {entity} dimensions in pixels: {width} x {height} ({aspectRatio}). Includes formatting notes and a free resizing workflow.",
    introPattern:
      "The recommended {entity} dimensions are {width} x {height} pixels with an {aspectRatio} aspect ratio. Matching this baseline reduces blur, stretch artifacts, and unintended crops.",
  },
  {
    slug: "aspect-ratio",
    phrase: "{entity} aspect ratio",
    phraseSlug: "aspect-ratio",
    titlePattern: "{entity} Aspect Ratio ({aspectRatio}) + Pixel Size Reference",
    descriptionPattern:
      "{entity} aspect ratio is {aspectRatio}. Use the matching pixel size ({width}x{height}) and safe-zone notes to publish without quality loss.",
    introPattern:
      "{entity} uses an {aspectRatio} aspect ratio, typically rendered at {width} x {height} pixels. Match ratio first, then scale to target pixels for the most reliable output quality.",
  },
  {
    slug: "resolution",
    phrase: "{entity} resolution",
    phraseSlug: "resolution",
    titlePattern: "{entity} Resolution ({width}x{height}) | Pixel Reference",
    descriptionPattern:
      "Use the correct {entity} resolution at {width}x{height} pixels with aspect-ratio context and safe-area alignment guidance.",
    introPattern:
      "{entity} resolution is usually {width} by {height} pixels. Using this resolution with the right composition strategy helps preserve clarity after platform compression.",
  },
  {
    slug: "pixel-size",
    phrase: "{entity} pixel size",
    phraseSlug: "pixel-size",
    titlePattern: "{entity} Pixel Size: {width}x{height} (Quick Sizing Guide)",
    descriptionPattern:
      "Get the exact {entity} pixel size ({width}x{height}) plus practical guidance to keep text and focal elements inside safe zones.",
    introPattern:
      "The standard {entity} pixel size is {width}x{height}. Keep important visual elements inside safe margins so output remains readable across device previews.",
  },
  {
    slug: "recommended-size",
    phrase: "recommended {entity} size",
    phraseSlug: "recommended-size",
    titlePattern: "Recommended {entity} Size ({width}x{height}) + Safe Area Notes",
    descriptionPattern:
      "See the recommended {entity} size at {width}x{height} with aspect-ratio guidance and publishing notes for cleaner output.",
    introPattern:
      "The recommended {entity} size is {width}x{height} at an {aspectRatio} ratio. Use this standard to minimize recropping and keep brand elements stable across placements.",
  },
  {
    slug: "safe-area-size",
    phrase: "{entity} safe area size",
    phraseSlug: "safe-area-size",
    titlePattern: "{entity} Safe Area Size ({width}x{height}) | Placement Guide",
    descriptionPattern:
      "Use this {entity} safe area size guide with exact pixels ({width}x{height}) and practical overlay-avoidance tips.",
    introPattern:
      "For {entity}, start from {width}x{height} and then design within a conservative safe area to reduce collisions with interface overlays and dynamic crop behavior.",
  },
  {
    slug: "image-specs",
    phrase: "{entity} image specs",
    phraseSlug: "image-specs",
    titlePattern: "{entity} Image Specs ({width}x{height}, {aspectRatio})",
    descriptionPattern:
      "Review {entity} image specs including pixel dimensions ({width}x{height}), aspect ratio, and safe-area guidance for stable exports.",
    introPattern:
      "{entity} image specs typically center on {width}x{height} pixels and an {aspectRatio} ratio. Following these specs helps your visual system scale across channels without distortion.",
  },
  {
    slug: "size-guide",
    phrase: "{entity} size guide",
    phraseSlug: "size-guide",
    titlePattern: "{entity} Size Guide: {width}x{height} + Aspect Ratio Notes",
    descriptionPattern:
      "Use this {entity} size guide with exact dimensions, ratio context, and safe-area recommendations for reliable publishing.",
    introPattern:
      "This {entity} size guide covers {width}x{height} pixels, ratio best practices, and safe-area decisions so you can publish visuals that stay consistent across screen sizes.",
  },
];

export const imageSizeEntities: ImageSizeEntity[] = buildImageSizeEntities();
