import { TranscriptSegment, ScoredSegment, ClipStyle, SegmentFeatures } from "./types";

const EMOTION_WORDS = new Set([
  "no way", "let's go", "holy", "insane", "bro", "wtf", "omg", "clutch", "crazy",
  "yo", "wow", "nah", "bruh", "are you kidding", "i'm done", "this game", "oh my god",
  "what the", "unbelievable", "legendary", "goated", "cracked", "sick", "dude",
  "hell yeah", "let's goo", "yooo", "sheesh", "fire", "massive", "huge", "godlike",
  "no shot", "that's nuts", "are you serious", "i can't believe", "destroyed"
]);

const EVENT_WORDS = new Set([
  "killed", "downed", "knocked", "headshot", "ace", "1v", "wipe", "team wipe",
  "win", "won", "gg", "final", "last", "rank", "promo", "overtime", "plant",
  "defuse", "zone", "circle", "boss", "clutched", "squad wipe", "victory",
  "elimination", "triple", "quad", "multi", "spree", "streak", "flawless",
  "perfect", "mvp", "champion", "first blood", "double kill", "triple kill"
]);

const AUDIENCE_PHRASES = new Set([
  "watch this", "look at this", "listen", "clip that", "you're not gonna believe",
  "did you see that", "chat", "guys", "look look", "wait wait", "oh no", "here we go",
  "check this out", "ready", "let me show you", "this is it", "pay attention"
]);

const EDUCATIONAL_WORDS = new Set([
  "here's how", "do this", "tip", "strategy", "trick", "tutorial", "guide",
  "learn", "technique", "secret", "method", "step", "first", "then", "always",
  "never", "remember", "important", "key", "basically", "essentially", "so what you do"
]);

const RAGE_PHRASES = new Set([
  "what the hell", "are you kidding me", "this is bs", "ridiculous", "broken",
  "cheating", "hacker", "trash", "garbage", "stupid", "hate this", "done with",
  "uninstall", "scam", "rigged", "unfair", "lag", "bs", "bull"
]);

function countMatches(text: string, wordSet: Set<string>): number {
  const lower = text.toLowerCase();
  let count = 0;
  for (const phrase of wordSet) {
    if (lower.includes(phrase)) count++;
  }
  return count;
}

function calculatePunctScore(text: string): number {
  const exclamations = (text.match(/!/g) || []).length;
  const questions = (text.match(/\?/g) || []).length;
  return Math.min((exclamations * 2 + questions), 10);
}

function calculatePaceScore(text: string, duration: number): number {
  if (duration <= 0) return 0;
  const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
  const wps = wordCount / duration;
  if (wps > 4) return 10;
  if (wps > 3) return 7;
  if (wps > 2) return 4;
  return 0;
}

function calculateRepetitionScore(text: string): number {
  const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const counts: Record<string, number> = {};
  for (const word of words) {
    counts[word] = (counts[word] || 0) + 1;
  }
  const repetitions = Object.values(counts).filter(c => c >= 2).length;
  return Math.min(repetitions * 2, 6);
}

interface StyleWeights {
  emotion: number;
  event: number;
  audience: number;
  educational: number;
  rage: number;
  punct: number;
  pace: number;
  repetition: number;
}

const STYLE_WEIGHTS: Record<ClipStyle, StyleWeights> = {
  balanced: {
    emotion: 18,
    event: 12,
    audience: 16,
    educational: 8,
    rage: 10,
    punct: 1,
    pace: 1,
    repetition: 1
  },
  hype: {
    emotion: 24,
    event: 18,
    audience: 14,
    educational: 4,
    rage: 8,
    punct: 1.5,
    pace: 1.5,
    repetition: 1
  },
  funny: {
    emotion: 20,
    event: 10,
    audience: 22,
    educational: 4,
    rage: 12,
    punct: 1,
    pace: 0.8,
    repetition: 1.2
  },
  rage: {
    emotion: 16,
    event: 8,
    audience: 12,
    educational: 2,
    rage: 28,
    punct: 2,
    pace: 1,
    repetition: 1
  },
  educational: {
    emotion: 8,
    event: 6,
    audience: 12,
    educational: 30,
    rage: 2,
    punct: 0.5,
    pace: 0.8,
    repetition: 0.5
  }
};

export function scoreSegment(
  segment: TranscriptSegment,
  style: ClipStyle
): ScoredSegment {
  const weights = STYLE_WEIGHTS[style];
  const duration = segment.end - segment.start;

  const emotionHits = countMatches(segment.text, EMOTION_WORDS);
  const eventHits = countMatches(segment.text, EVENT_WORDS);
  const audienceHits = countMatches(segment.text, AUDIENCE_PHRASES);
  const educationalHits = countMatches(segment.text, EDUCATIONAL_WORDS);
  const rageHits = countMatches(segment.text, RAGE_PHRASES);

  const punctScore = calculatePunctScore(segment.text);
  const paceWps = duration > 0 ? segment.text.split(/\s+/).length / duration : 0;
  const paceScore = calculatePaceScore(segment.text, duration);
  const repetitionScore = calculateRepetitionScore(segment.text);

  let score = 0;
  score += emotionHits * weights.emotion;
  score += eventHits * weights.event;
  score += audienceHits * weights.audience;
  score += educationalHits * weights.educational;
  score += rageHits * weights.rage;
  score += punctScore * weights.punct;
  score += paceScore * weights.pace;
  score += repetitionScore * weights.repetition;

  score = Math.min(Math.max(score, 0), 100);

  const reasons: string[] = [];
  if (emotionHits > 0) reasons.push(`Emotion (${emotionHits})`);
  if (eventHits > 0) reasons.push(`Event (${eventHits})`);
  if (audienceHits > 0) reasons.push(`Audience call (${audienceHits})`);
  if (educationalHits > 0) reasons.push(`Educational (${educationalHits})`);
  if (rageHits > 0) reasons.push(`Rage (${rageHits})`);
  if (punctScore >= 4) reasons.push("High energy punctuation");
  if (paceScore >= 7) reasons.push("Fast pacing");
  if (repetitionScore >= 4) reasons.push("Emphasis through repetition");

  const features: SegmentFeatures = {
    emotionHits,
    eventHits,
    audienceHits,
    educationalHits,
    paceWps: Math.round(paceWps * 100) / 100,
    punctCount: punctScore,
    repetitionScore
  };

  return {
    ...segment,
    score: Math.round(score),
    reasons,
    features
  };
}

export function scoreTranscript(
  segments: TranscriptSegment[],
  style: ClipStyle
): ScoredSegment[] {
  const scored = segments.map(s => scoreSegment(s, style));

  for (let i = 0; i < scored.length; i++) {
    const current = scored[i];
    const hasEmotion = current.features.emotionHits > 0;
    const hasEvent = current.features.eventHits > 0;

    if (hasEmotion || hasEvent) {
      let neighborBonus = false;
      for (let j = Math.max(0, i - 3); j <= Math.min(scored.length - 1, i + 3); j++) {
        if (j === i) continue;
        const neighbor = scored[j];
        const timeDiff = Math.abs(neighbor.start - current.start);
        if (timeDiff <= 12) {
          const neighborHasEmotion = neighbor.features.emotionHits > 0;
          const neighborHasEvent = neighbor.features.eventHits > 0;
          if ((hasEmotion && neighborHasEvent) || (hasEvent && neighborHasEmotion)) {
            neighborBonus = true;
            break;
          }
        }
      }

      if (neighborBonus) {
        current.score = Math.min(Math.round(current.score * 1.15), 100);
        if (!current.reasons.includes("Reaction stack bonus")) {
          current.reasons.push("Reaction stack bonus");
        }
      }
    }
  }

  return scored;
}
