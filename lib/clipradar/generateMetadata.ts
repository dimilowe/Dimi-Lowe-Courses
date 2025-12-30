import { ScoredSegment, ClipCategory } from "./types";

export function determineCategory(segment: ScoredSegment): ClipCategory {
  const { emotionHits, eventHits, audienceHits, educationalHits } = segment.features;
  
  const lower = segment.text.toLowerCase();
  const hasRageSignals = lower.includes("what the") || lower.includes("are you kidding") ||
    lower.includes("broken") || lower.includes("cheating") || lower.includes("bs") ||
    (segment.text.match(/[!?]{2,}/g) || []).length > 0;

  if (hasRageSignals && segment.features.punctCount >= 4) {
    return "rage";
  }

  if (educationalHits >= 2) {
    return "educational";
  }

  if (audienceHits >= 2 && emotionHits >= 1) {
    return "funny";
  }

  if (eventHits >= 1 && emotionHits >= 1) {
    return "hype";
  }

  if (emotionHits >= 2 || eventHits >= 2) {
    return "highlight";
  }

  if (audienceHits >= 1) {
    return "funny";
  }

  return "unknown";
}

const TITLE_TEMPLATES: Record<ClipCategory, string[]> = {
  hype: [
    "The play that broke the game",
    "You won't believe this happened",
    "Peak gaming moment right here"
  ],
  funny: [
    "Chat lost it at this moment",
    "When the content writes itself",
    "The audience went wild"
  ],
  rage: [
    "The moment sanity left the building",
    "Absolutely unhinged reaction",
    "Peak gamer rage achieved"
  ],
  educational: [
    "Here's the secret to winning",
    "Pro tip that changes everything",
    "The strategy nobody knows about"
  ],
  highlight: [
    "This clip is going viral",
    "The moment everyone's talking about",
    "Highlight reel material"
  ],
  unknown: [
    "Clip-worthy moment",
    "Don't miss this part",
    "Key moment from the stream"
  ]
};

const CAPTION_TEMPLATES: Record<ClipCategory, string[]> = {
  hype: ["INSANE PLAY", "CLUTCH MODE"],
  funny: ["CHAT WENT CRAZY", "COMEDY GOLD"],
  rage: ["TILTED", "PURE RAGE"],
  educational: ["PRO TIP", "LEARN THIS"],
  highlight: ["HIGHLIGHT", "MUST SEE"],
  unknown: ["CLIP THIS", "KEY MOMENT"]
};

export function generateTitles(category: ClipCategory): string[] {
  return [...TITLE_TEMPLATES[category]];
}

export function generateCaptions(category: ClipCategory): string[] {
  return [...CAPTION_TEMPLATES[category]];
}

export function generateMetadata(segment: ScoredSegment): {
  category: ClipCategory;
  titles: string[];
  captions: string[];
} {
  const category = determineCategory(segment);
  return {
    category,
    titles: generateTitles(category),
    captions: generateCaptions(category)
  };
}
