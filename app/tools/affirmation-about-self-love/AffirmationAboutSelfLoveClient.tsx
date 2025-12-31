'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Heart, Sparkles, Loader2, Copy, Check, Calendar } from 'lucide-react';
import ExploreMoreTools from '@/components/ExploreMoreTools';
import PostResultUpsell from '@/components/PostResultUpsell';

const AREAS = [
  { id: 'body', label: 'Body & Health', emoji: '💪', description: 'Physical self-acceptance' },
  { id: 'money', label: 'Money & Worth', emoji: '💰', description: 'Financial confidence' },
  { id: 'career', label: 'Career & Purpose', emoji: '🚀', description: 'Professional growth' },
  { id: 'relationships', label: 'Relationships', emoji: '💕', description: 'Healthy boundaries' },
  { id: 'creativity', label: 'Creativity', emoji: '🎨', description: 'Creative confidence' },
  { id: 'general', label: 'General Self-Love', emoji: '✨', description: 'Overall self-worth' },
];

const TONES = [
  { id: 'gentle', label: 'Gentle', emoji: '🌸', description: 'Warm & nurturing' },
  { id: 'hype', label: 'Hype', emoji: '🔥', description: 'Energetic & empowering' },
  { id: 'brutal', label: 'Brutal', emoji: '💀', description: 'Tough love, no BS' },
];

const EXAMPLE_AFFIRMATIONS = [
  "I am allowed to take up space without apologizing for it.",
  "I don't need to earn rest. I deserve it just because I exist.",
  "I am worthy of love that doesn't require me to shrink myself.",
  "I release the need to be perfect to be valuable.",
  "I trust my gut, even when it's inconvenient for others.",
  "I am not too much. I am exactly the right amount.",
  "I deserve relationships where I don't have to beg for the bare minimum.",
  "I am allowed to change my mind without owing anyone an explanation.",
  "I celebrate my small wins because they matter.",
  "I am learning to love the parts of me I was taught to hide.",
  "I am not responsible for other people's reactions to my boundaries.",
  "I give myself permission to outgrow versions of me that no longer fit.",
  "I am worthy of success that doesn't require my burnout.",
  "I choose peace over being right.",
  "I am allowed to rest before I'm completely exhausted.",
  "I trust myself to handle whatever comes my way.",
  "I am not defined by my productivity or my output.",
  "I deserve to be chosen, not just tolerated.",
  "I am becoming the person I needed when I was younger.",
  "I release the need to explain myself to people who don't want to understand.",
  "I am allowed to have needs and express them clearly.",
  "I honor my energy by saying no to what drains me.",
  "I am worthy of spaces where I feel safe to be myself.",
  "I choose to speak to myself with kindness, even when I mess up.",
  "I am enough, even on the days I don't feel like it.",
];

function getFormattedDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function AffirmationAboutSelfLoveClient() {
  const [selectedArea, setSelectedArea] = useState<string>('general');
  const [selectedTone, setSelectedTone] = useState<string>('hype');
  const [affirmation, setAffirmation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const fetchDailyAffirmation = async (area: string, tone: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/affirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ area, tone }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get daily affirmation');
      }

      setAffirmation(data.affirmations[0]);
      setHasLoaded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDailyAffirmation(selectedArea, selectedTone);
  }, []);

  const handleAreaChange = (area: string) => {
    setSelectedArea(area);
    fetchDailyAffirmation(area, selectedTone);
  };

  const handleToneChange = (tone: string) => {
    setSelectedTone(tone);
    fetchDailyAffirmation(selectedArea, tone);
  };

  const copyAffirmation = async () => {
    if (!affirmation) return;
    await navigator.clipboard.writeText(affirmation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const selectedAreaData = AREAS.find(a => a.id === selectedArea);
  const selectedToneData = TONES.find(t => t.id === selectedTone);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        name: 'Daily Self-Love Affirmation Generator',
        applicationCategory: 'LifestyleApplication',
        operatingSystem: 'Web',
        description: 'Get your daily affirmation about self love. A new personalized affirmation every day based on your focus area and preferred tone.',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'What is an affirmation about self love?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'An affirmation about self love is a positive statement you repeat to yourself to build self-worth, confidence, and self-acceptance. Unlike generic affirmations, self-love affirmations focus specifically on how you relate to yourself.',
            },
          },
          {
            '@type': 'Question',
            name: 'Do self love affirmations actually work?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Research shows that affirmations can help rewire thought patterns over time, especially when the affirmations feel believable and are practiced consistently. The key is using affirmations that resonate with you, not ones that feel fake.',
            },
          },
          {
            '@type': 'Question',
            name: 'How often should I use self love affirmations?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Daily practice is ideal. Many people find it helpful to repeat affirmations in the morning, before bed, or during moments of self-doubt. Even 2-3 minutes of intentional practice can make a difference.',
            },
          },
          {
            '@type': 'Question',
            name: 'Why do some affirmations feel cringey or fake?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Affirmations feel fake when they\'re too far from your current beliefs. The trick is to use affirmations that feel like a stretch but still believable. Our generator creates grounded, realistic affirmations that feel authentic.',
            },
          },
          {
            '@type': 'Question',
            name: 'Why does my affirmation stay the same all day?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Your daily affirmation is designed to stay consistent throughout the day so you can practice and internalize it. A new affirmation is generated at midnight UTC each day. This encourages deeper reflection rather than constantly seeking new affirmations.',
            },
          },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-rose-100 to-pink-100 text-rose-700 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
              <Heart className="w-4 h-4" />
              Free Daily Self-Love Tool
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Affirmation About Self Love
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Get your daily affirmation about self love. Choose your focus area and tone, and receive a personalized affirmation to carry with you all day. A new affirmation awaits you each morning.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 md:p-8 mb-8">
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                1. What area do you want to focus on today?
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {AREAS.map((area) => (
                  <button
                    key={area.id}
                    onClick={() => handleAreaChange(area.id)}
                    disabled={isLoading}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      selectedArea === area.id
                        ? 'border-rose-500 bg-rose-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="text-2xl mb-1">{area.emoji}</div>
                    <div className="font-semibold text-gray-800 text-sm">{area.label}</div>
                    <div className="text-xs text-gray-500">{area.description}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                2. Choose your tone
              </label>
              <div className="grid grid-cols-3 gap-3">
                {TONES.map((tone) => (
                  <button
                    key={tone.id}
                    onClick={() => handleToneChange(tone.id)}
                    disabled={isLoading}
                    className={`p-4 rounded-xl border-2 transition-all text-center ${
                      selectedTone === tone.id
                        ? 'border-rose-500 bg-rose-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="text-2xl mb-1">{tone.emoji}</div>
                    <div className="font-semibold text-gray-800">{tone.label}</div>
                    <div className="text-xs text-gray-500">{tone.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-center">
                {error}
              </div>
            )}
          </div>

          {isLoading && !hasLoaded && (
            <div className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl shadow-xl p-8 mb-8">
              <div className="flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
                <p className="text-white/80 text-center">Finding today's affirmation for you...</p>
              </div>
            </div>
          )}

          {affirmation && (
            <div className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl shadow-xl p-6 md:p-8 mb-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
              
              <div className="relative">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2 text-white/80 text-sm">
                    <Calendar className="w-4 h-4" />
                    {getFormattedDate()}
                  </div>
                  <div className="flex items-center gap-2 text-white/80 text-sm">
                    <span>{selectedAreaData?.emoji}</span>
                    <span>{selectedAreaData?.label}</span>
                    <span className="text-white/50">•</span>
                    <span>{selectedToneData?.emoji}</span>
                    <span>{selectedToneData?.label}</span>
                  </div>
                </div>

                <div className="text-center mb-6">
                  <h2 className="text-white/80 text-sm font-medium uppercase tracking-wider mb-4">
                    Today's Affirmation About Self Love
                  </h2>
                  <div className="relative">
                    {isLoading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/10 rounded-xl">
                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                      </div>
                    )}
                    <p className={`text-white text-2xl md:text-3xl font-medium leading-relaxed ${isLoading ? 'opacity-30' : ''}`}>
                      "{affirmation}"
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={copyAffirmation}
                    className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-all text-sm font-medium"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy Affirmation
                      </>
                    )}
                  </button>
                </div>

                <p className="text-white/60 text-sm text-center mt-6">
                  Repeat this to yourself throughout the day. Come back tomorrow for a fresh affirmation.
                </p>
              </div>
            </div>
          )}

          {affirmation && (
            <PostResultUpsell />
          )}

          <div className="bg-gradient-to-r from-rose-100 to-pink-100 rounded-2xl p-6 md:p-8 mb-8 text-center">
            <Sparkles className="w-8 h-8 text-rose-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Why Daily Affirmations Work
            </h3>
            <p className="text-gray-600 text-sm max-w-xl mx-auto">
              Consistency is the key to rewiring thought patterns. By focusing on one affirmation per day, you give yourself time to truly absorb and practice it. Come back each morning for a fresh affirmation about self love tailored to your needs.
            </p>
          </div>

          <div className="space-y-12 mt-16">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                What Is an Affirmation About Self Love?
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                An affirmation about self love is a positive statement you repeat to yourself to build self-worth, confidence, and self-acceptance. Unlike generic positive affirmations, self-love affirmations focus specifically on how you relate to yourself — your boundaries, your worth, and your right to take up space.
              </p>
              <p className="text-gray-600 leading-relaxed">
                The best affirmations about self love aren't fluffy or fake. They're grounded in reality, feel believable, and help you slowly rewire negative thought patterns. Our daily generator creates modern, honest affirmations that feel like something you'd actually say to yourself — not something from a cheesy motivational poster.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                25 Example Affirmations About Self Love
              </h2>
              <p className="text-gray-600 mb-4">
                Here are 25 powerful affirmations about self love to inspire your daily practice:
              </p>
              <div className="grid md:grid-cols-2 gap-3">
                {EXAMPLE_AFFIRMATIONS.map((aff, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-lg p-4 border border-gray-200 hover:border-rose-200 hover:shadow-sm transition-all"
                  >
                    <p className="text-gray-700 text-sm">"{aff}"</p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                How to Use Your Daily Self Love Affirmation
              </h2>
              <div className="space-y-4">
                <div className="bg-white rounded-xl p-5 border border-gray-200">
                  <h3 className="font-semibold text-gray-800 mb-2">1. Read it first thing in the morning</h3>
                  <p className="text-gray-600 text-sm">Start your day by reading your daily affirmation about self love. Say it out loud if you can — hearing your own voice reinforces the message.</p>
                </div>
                <div className="bg-white rounded-xl p-5 border border-gray-200">
                  <h3 className="font-semibold text-gray-800 mb-2">2. Write it down</h3>
                  <p className="text-gray-600 text-sm">Copy your affirmation into a journal or on a sticky note. The act of writing engages different parts of your brain and deepens the impact.</p>
                </div>
                <div className="bg-white rounded-xl p-5 border border-gray-200">
                  <h3 className="font-semibold text-gray-800 mb-2">3. Return to it during hard moments</h3>
                  <p className="text-gray-600 text-sm">When self-doubt creeps in, pull up your daily affirmation. Having the same message all day creates consistency and builds neural pathways.</p>
                </div>
                <div className="bg-white rounded-xl p-5 border border-gray-200">
                  <h3 className="font-semibold text-gray-800 mb-2">4. Reflect on it before bed</h3>
                  <p className="text-gray-600 text-sm">End your day by revisiting your affirmation. Consider how it showed up in your day and what it meant to you.</p>
                </div>
                <div className="bg-white rounded-xl p-5 border border-gray-200">
                  <h3 className="font-semibold text-gray-800 mb-2">5. Come back tomorrow</h3>
                  <p className="text-gray-600 text-sm">A new affirmation about self love awaits you each morning. Building this daily ritual creates lasting change over time.</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                FAQ: Daily Affirmation About Self Love
              </h2>
              <div className="space-y-4">
                <div className="bg-white rounded-xl p-5 border border-gray-200">
                  <h3 className="font-semibold text-gray-800 mb-2">What is an affirmation about self love?</h3>
                  <p className="text-gray-600 text-sm">An affirmation about self love is a positive statement you repeat to yourself to build self-worth and self-acceptance. These affirmations focus on your relationship with yourself — your boundaries, confidence, and inherent value as a person.</p>
                </div>
                <div className="bg-white rounded-xl p-5 border border-gray-200">
                  <h3 className="font-semibold text-gray-800 mb-2">Why does my affirmation stay the same all day?</h3>
                  <p className="text-gray-600 text-sm">Your daily affirmation is designed to be consistent throughout the day so you can truly practice and internalize it. Research shows that repetition is key to changing thought patterns. A new affirmation is generated at midnight UTC.</p>
                </div>
                <div className="bg-white rounded-xl p-5 border border-gray-200">
                  <h3 className="font-semibold text-gray-800 mb-2">Do self love affirmations actually work?</h3>
                  <p className="text-gray-600 text-sm">Research shows that affirmations can help rewire thought patterns over time, especially when the affirmations feel believable and are practiced consistently. The key is using affirmations that resonate with you, not ones that feel fake or forced.</p>
                </div>
                <div className="bg-white rounded-xl p-5 border border-gray-200">
                  <h3 className="font-semibold text-gray-800 mb-2">Can I switch focus areas during the day?</h3>
                  <p className="text-gray-600 text-sm">Absolutely! Each combination of focus area and tone has its own daily affirmation. Feel free to explore different combinations — each one will stay consistent throughout the day.</p>
                </div>
                <div className="bg-white rounded-xl p-5 border border-gray-200">
                  <h3 className="font-semibold text-gray-800 mb-2">When does my affirmation refresh?</h3>
                  <p className="text-gray-600 text-sm">A new affirmation about self love is generated for each focus area and tone combination at midnight UTC each day. Come back tomorrow for a fresh message to carry with you.</p>
                </div>
              </div>
            </section>
          </div>

          <ExploreMoreTools currentTool="/tools/affirmation-about-self-love" />

          <div className="text-center mt-12 pt-8 border-t border-gray-200">
            <p className="text-gray-500 text-sm">
              Free daily tool by{' '}
              <Link href="/" className="text-rose-600 hover:text-rose-700 font-medium">
                VCM Suite
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
