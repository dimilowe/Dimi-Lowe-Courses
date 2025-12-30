export type Motive = 'fear' | 'status' | 'insider';
export type Verdict = 'red' | 'yellow' | 'green';

export interface GateResult {
  gate: string;
  passed: boolean;
  verdict: Verdict;
  reason: string;
  metrics?: Record<string, number | string>;
}

export interface EvaluationResult {
  verdict: Verdict;
  reason: string;
  instruction: string;
  metrics?: Record<string, number | string>;
  gateResults?: GateResult[];
}

export function parseYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export function computeMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : Math.floor((sorted[mid - 1] + sorted[mid]) / 2);
}

export function gate1_outlier(
  targetViews: number,
  recentViews: number[]
): GateResult {
  const medianViews = computeMedian(recentViews);
  const threshold = medianViews * 5;
  
  if (targetViews >= threshold) {
    return {
      gate: 'Outlier Validation',
      passed: true,
      verdict: 'green',
      reason: 'Video escaped channel median.'
    };
  }
  
  return {
    gate: 'Outlier Validation',
    passed: false,
    verdict: 'red',
    reason: 'This video did not escape the channel median.',
    metrics: {
      median_views: medianViews,
      target_views: targetViews,
      required_threshold: threshold
    }
  };
}

const MOTIVE_KEYWORDS: Record<Motive, string[]> = {
  fear: [
    'avoid', 'mistake', 'wrong', 'fail', 'danger', 'risk', 'warning', 'never',
    'stop', 'don\'t', 'careful', 'problem', 'issue', 'error', 'bad', 'worst',
    'scam', 'trap', 'lose', 'losing', 'lost', 'hurt', 'pain', 'scary'
  ],
  status: [
    'best', 'top', 'pro', 'elite', 'advanced', 'master', 'expert', 'premium',
    'exclusive', 'secret', 'wealthy', 'rich', 'success', 'successful', 'winner',
    'first', 'ahead', 'better', 'upgrade', 'level up', 'boss', 'luxury'
  ],
  insider: [
    'insider', 'secret', 'hidden', 'nobody knows', 'few people', 'they don\'t want',
    'truth', 'real', 'actually', 'really', 'behind the scenes', 'exposed',
    'reveal', 'discovered', 'found out', 'leaked', 'confidential', 'exclusive'
  ]
};

export function gate2_motive(
  title: string,
  description: string,
  transcript: string,
  selectedMotive: Motive
): GateResult {
  const text = `${title} ${description} ${transcript}`.toLowerCase();
  
  const scores: Record<Motive, number> = {
    fear: 0,
    status: 0,
    insider: 0
  };
  
  for (const motive of Object.keys(MOTIVE_KEYWORDS) as Motive[]) {
    for (const keyword of MOTIVE_KEYWORDS[motive]) {
      const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      const matches = text.match(regex);
      if (matches) {
        scores[motive] += matches.length;
      }
    }
  }
  
  const selectedScore = scores[selectedMotive];
  const otherMotives = (Object.keys(scores) as Motive[]).filter(m => m !== selectedMotive);
  const maxOtherScore = Math.max(...otherMotives.map(m => scores[m]));
  
  const THRESHOLD = 3;
  
  if (selectedScore >= THRESHOLD && selectedScore > maxOtherScore + 1) {
    return {
      gate: 'Click Motive Sharpness',
      passed: true,
      verdict: 'green',
      reason: 'Dominant click motive detected.'
    };
  }
  
  return {
    gate: 'Click Motive Sharpness',
    passed: false,
    verdict: 'yellow',
    reason: 'No dominant motive detected. Packaging is blunt.',
    metrics: {
      fear_score: scores.fear,
      status_score: scores.status,
      insider_score: scores.insider
    }
  };
}

const PAIN_KEYWORDS = [
  'problem', 'issue', 'struggle', 'frustrated', 'annoying', 'hate', 'difficult',
  'hard', 'stuck', 'confused', 'overwhelmed', 'failing', 'broken', 'wrong',
  'mistake', 'pain', 'hurt', 'suffer', 'nightmare', 'disaster'
];

const PROXIMITY_KEYWORDS = [
  'i tested', 'i tried', 'i found', 'i discovered', 'i learned', 'i saw',
  'my experience', 'when i', 'after i', 'the data shows', 'research shows',
  'studies show', 'evidence', 'proof', 'results', 'worked for me', 'years ago'
];

const REWARD_KEYWORDS = [
  'you\'ll learn', 'you\'ll discover', 'you\'ll see', 'you\'ll understand',
  'by the end', 'i\'ll show you', 'i\'ll reveal', 'i\'ll teach', 'i\'ll explain',
  'the result', 'the solution', 'the answer', 'how to fix', 'how to solve',
  'step by step', 'exactly how', 'the secret', 'the key', 'what works'
];

export function gate3_contract(transcript: string): GateResult {
  const words = transcript.split(/\s+/);
  const first120Words = words.slice(0, 120).join(' ').toLowerCase();
  
  let pillars = 0;
  const pillarDetails: string[] = [];
  
  const hasPain = PAIN_KEYWORDS.some(k => first120Words.includes(k));
  if (hasPain) {
    pillars++;
    pillarDetails.push('Named Pain');
  }
  
  const hasProximity = PROXIMITY_KEYWORDS.some(k => first120Words.includes(k));
  if (hasProximity) {
    pillars++;
    pillarDetails.push('Established Proximity');
  }
  
  const hasReward = REWARD_KEYWORDS.some(k => first120Words.includes(k));
  if (hasReward) {
    pillars++;
    pillarDetails.push('Future Reward');
  }
  
  if (pillars === 3) {
    return {
      gate: 'Retention Contract Check',
      passed: true,
      verdict: 'green',
      reason: 'Retention contract intact.'
    };
  }
  
  if (pillars === 2) {
    return {
      gate: 'Retention Contract Check',
      passed: false,
      verdict: 'yellow',
      reason: 'Retention contract is weak. One pillar missing.',
      metrics: {
        pillars_found: pillars,
        pillars_detected: pillarDetails.join(', ') || 'None'
      }
    };
  }
  
  return {
    gate: 'Retention Contract Check',
    passed: false,
    verdict: 'red',
    reason: 'The retention contract is incomplete.',
    metrics: {
      pillars_found: pillars,
      pillars_detected: pillarDetails.join(', ') || 'None'
    }
  };
}

const ESCALATION_PHRASES = [
  'but here\'s where', 'this is the part', 'here\'s the twist', 'what people miss',
  'here\'s the thing', 'but wait', 'now here\'s', 'the real', 'but actually'
];

const PROOF_PHRASES = [
  'look at this', 'the data', 'when i tested', 'here\'s what happened',
  'numbers show', 'the results', 'as you can see', 'proof is', 'evidence shows'
];

const CONTRAST_PHRASES = [
  'compare that to', 'most people think', 'but in reality', 'instead of',
  'on the other hand', 'unlike', 'the difference', 'versus', 'whereas'
];

export function gate4_semanticDensity(transcript: string): GateResult {
  const text = transcript.toLowerCase();
  let resets = 0;
  
  const allPhrases = [...ESCALATION_PHRASES, ...PROOF_PHRASES, ...CONTRAST_PHRASES];
  
  for (const phrase of allPhrases) {
    const regex = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const matches = text.match(regex);
    if (matches) {
      resets += matches.length;
    }
  }
  
  const words = transcript.split(/\s+/).length;
  const estimatedSeconds = Math.max(60, Math.floor(words / 2.5));
  const resetsPerMinute = Math.round((resets / estimatedSeconds) * 60);
  
  if (resets >= 4) {
    return {
      gate: 'Semantic Density Check',
      passed: true,
      verdict: 'green',
      reason: 'Adequate semantic resets detected.'
    };
  }
  
  if (resets === 3) {
    return {
      gate: 'Semantic Density Check',
      passed: false,
      verdict: 'yellow',
      reason: 'Density is marginal. Pattern may not hold AVD.',
      metrics: {
        semantic_resets: resets,
        resets_per_minute: resetsPerMinute
      }
    };
  }
  
  return {
    gate: 'Semantic Density Check',
    passed: false,
    verdict: 'red',
    reason: 'Information density is insufficient to hold AVD.',
    metrics: {
      semantic_resets: resets,
      resets_per_minute: resetsPerMinute
    }
  };
}

export function runAllGates(
  targetViews: number,
  recentViews: number[],
  title: string,
  description: string,
  transcript: string,
  motive: Motive
): EvaluationResult {
  const results: GateResult[] = [];
  
  const gate1 = gate1_outlier(targetViews, recentViews);
  results.push(gate1);
  if (gate1.verdict === 'red') {
    return {
      verdict: 'red',
      reason: gate1.reason,
      instruction: 'Do not make this video.',
      metrics: gate1.metrics,
      gateResults: results
    };
  }
  
  const gate2 = gate2_motive(title, description, transcript, motive);
  results.push(gate2);
  
  const gate3 = gate3_contract(transcript);
  results.push(gate3);
  if (gate3.verdict === 'red') {
    return {
      verdict: 'red',
      reason: gate3.reason,
      instruction: 'Do not make this video.',
      metrics: gate3.metrics,
      gateResults: results
    };
  }
  
  const gate4 = gate4_semanticDensity(transcript);
  results.push(gate4);
  if (gate4.verdict === 'red') {
    return {
      verdict: 'red',
      reason: gate4.reason,
      instruction: 'Do not make this video.',
      metrics: gate4.metrics,
      gateResults: results
    };
  }
  
  const hasYellow = results.some(r => r.verdict === 'yellow');
  if (hasYellow) {
    const yellowGate = results.find(r => r.verdict === 'yellow')!;
    return {
      verdict: 'yellow',
      reason: yellowGate.reason,
      instruction: 'Rewrite before production.',
      metrics: yellowGate.metrics,
      gateResults: results
    };
  }
  
  return {
    verdict: 'green',
    reason: 'All gates passed. Pattern geometry validated.',
    instruction: 'Time investment is rational.',
    gateResults: results
  };
}
