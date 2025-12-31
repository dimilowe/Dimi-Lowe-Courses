'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Sparkles, Star, Moon, Sun, Loader2, RefreshCw } from 'lucide-react';
import ExploreMoreTools from '@/components/ExploreMoreTools';
import PostResultUpsell from '@/components/PostResultUpsell';

const ZODIAC_SIGNS = [
  { name: 'Aries', symbol: '♈', dates: 'Mar 21 - Apr 19', element: 'fire' },
  { name: 'Taurus', symbol: '♉', dates: 'Apr 20 - May 20', element: 'earth' },
  { name: 'Gemini', symbol: '♊', dates: 'May 21 - Jun 20', element: 'air' },
  { name: 'Cancer', symbol: '♋', dates: 'Jun 21 - Jul 22', element: 'water' },
  { name: 'Leo', symbol: '♌', dates: 'Jul 23 - Aug 22', element: 'fire' },
  { name: 'Virgo', symbol: '♍', dates: 'Aug 23 - Sep 22', element: 'earth' },
  { name: 'Libra', symbol: '♎', dates: 'Sep 23 - Oct 22', element: 'air' },
  { name: 'Scorpio', symbol: '♏', dates: 'Oct 23 - Nov 21', element: 'water' },
  { name: 'Sagittarius', symbol: '♐', dates: 'Nov 22 - Dec 21', element: 'fire' },
  { name: 'Capricorn', symbol: '♑', dates: 'Dec 22 - Jan 19', element: 'earth' },
  { name: 'Aquarius', symbol: '♒', dates: 'Jan 20 - Feb 18', element: 'air' },
  { name: 'Pisces', symbol: '♓', dates: 'Feb 19 - Mar 20', element: 'water' },
];

const TONES = [
  { id: 'sweet', label: 'Sweet', emoji: '🌸', description: 'Warm & encouraging' },
  { id: 'sassy', label: 'Sassy', emoji: '💅', description: 'Witty & playful' },
  { id: 'brutal', label: 'Brutal', emoji: '🔥', description: 'No-BS honesty' },
];

export default function HoroscopeOfTheDayClient() {
  const [selectedSign, setSelectedSign] = useState<string | null>(null);
  const [selectedTone, setSelectedTone] = useState<string>('sassy');
  const [horoscope, setHoroscope] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastReading, setLastReading] = useState<{ sign: string; tone: string } | null>(null);

  const getHoroscope = async () => {
    if (!selectedSign) {
      setError('Please select your zodiac sign');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/horoscope', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sign: selectedSign,
          tone: selectedTone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get horoscope');
      }

      setHoroscope(data.horoscope);
      setLastReading({ sign: selectedSign, tone: selectedTone });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The stars are buffering. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getElementColor = (element: string) => {
    switch (element) {
      case 'fire': return 'from-orange-500 to-red-500';
      case 'earth': return 'from-green-600 to-emerald-700';
      case 'air': return 'from-sky-400 to-blue-500';
      case 'water': return 'from-blue-500 to-indigo-600';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  const getTodayFormatted = () => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        name: 'Real AF Horoscope – Horoscope of the Day',
        applicationCategory: 'LifestyleApplication',
        operatingSystem: 'Web',
        description: 'Get your real AF horoscope of the day. Choose your zodiac sign and let our brutally honest AI generator give you today\'s no-BS reading.',
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
            name: 'Is this horoscope of the day accurate?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Our AI-generated horoscopes are designed for entertainment and self-reflection. They provide thought-provoking insights based on zodiac archetypes, but should be taken as fun guidance rather than literal predictions.',
            },
          },
          {
            '@type': 'Question',
            name: 'How often does the horoscope of the day update?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Each unique combination of zodiac sign and tone generates a new horoscope once per day. The reading stays the same throughout the day, then refreshes at midnight UTC.',
            },
          },
          {
            '@type': 'Question',
            name: 'Is this daily horoscope free?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes! Our horoscope of the day generator is completely free to use. No signup required, no limits on how many readings you can get.',
            },
          },
          {
            '@type': 'Question',
            name: 'Can I get a new horoscope if I don\'t like today\'s?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'The same sign + tone combination gives the same reading all day. Try a different tone (Sweet, Sassy, or Brutal) for a fresh perspective, or check back tomorrow for a new reading.',
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

      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-100 to-amber-100 text-orange-700 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
              <Star className="w-4 h-4" />
              {getTodayFormatted()}
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Horoscope of the Day
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Get your real AF horoscope of the day. Choose your zodiac sign and tone, then let our brutally honest AI give you today's no-BS reading.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 md:p-8 mb-8">
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                1. Choose Your Zodiac Sign
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {ZODIAC_SIGNS.map((sign) => (
                  <button
                    key={sign.name}
                    onClick={() => setSelectedSign(sign.name.toLowerCase())}
                    className={`relative p-3 rounded-xl border-2 transition-all ${
                      selectedSign === sign.name.toLowerCase()
                        ? 'border-orange-500 bg-orange-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-2xl mb-1">
                      {sign.symbol}
                    </div>
                    <div className="text-xs font-medium text-gray-700">{sign.name}</div>
                    <div className="text-[10px] text-gray-400">{sign.dates}</div>
                    {selectedSign === sign.name.toLowerCase() && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                        <Sparkles className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                2. Choose Your Tone
              </label>
              <div className="grid grid-cols-3 gap-3">
                {TONES.map((tone) => (
                  <button
                    key={tone.id}
                    onClick={() => setSelectedTone(tone.id)}
                    className={`p-4 rounded-xl border-2 transition-all text-center ${
                      selectedTone === tone.id
                        ? 'border-orange-500 bg-orange-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-2xl mb-1">{tone.emoji}</div>
                    <div className="font-semibold text-gray-800">{tone.label}</div>
                    <div className="text-xs text-gray-500">{tone.description}</div>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={getHoroscope}
              disabled={isLoading || !selectedSign}
              className={`w-full py-4 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-3 ${
                isLoading || !selectedSign
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg hover:shadow-xl'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Consulting the cosmos...
                </>
              ) : (
                <>
                  <Moon className="w-5 h-5" />
                  Get Today's Horoscope
                </>
              )}
            </button>

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-center">
                {error}
              </div>
            )}
          </div>

          {horoscope && lastReading && (
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-xl p-6 md:p-8 mb-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full opacity-10">
                <div className="absolute top-4 left-4 text-6xl">✨</div>
                <div className="absolute bottom-4 right-4 text-6xl">🌙</div>
              </div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">
                      {ZODIAC_SIGNS.find(s => s.name.toLowerCase() === lastReading.sign)?.symbol}
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg capitalize">
                        {lastReading.sign}'s Horoscope
                      </h3>
                      <p className="text-gray-400 text-sm capitalize">
                        {lastReading.tone} Tone • {getTodayFormatted()}
                      </p>
                    </div>
                  </div>
                  <span className="text-2xl">
                    {TONES.find(t => t.id === lastReading.tone)?.emoji}
                  </span>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-xl p-5">
                  <p className="text-white text-lg leading-relaxed whitespace-pre-wrap">
                    {horoscope}
                  </p>
                </div>
                <p className="text-gray-400 text-sm text-center mt-4">
                  Same sign + tone gets the same reading all day. New day, new chaos. ✨
                </p>
              </div>
              
              <PostResultUpsell />
            </div>
          )}

          <div className="space-y-12 mt-16">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                What Is a Horoscope of the Day?
              </h2>
              <p className="text-gray-600 leading-relaxed">
                A horoscope of the day is a personalized daily reading based on your zodiac sign. Unlike generic weekly or monthly horoscopes, a daily horoscope offers specific guidance for the next 24 hours. People have been checking their daily horoscope for centuries, seeking insight, entertainment, and a moment of reflection each morning. Our AI-powered horoscope of the day takes this tradition into the modern age with readings that are brutally honest, surprisingly accurate, and never boring.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                How Our Real AF Horoscope of the Day Generator Works
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl p-5 border border-gray-200">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold mb-3">1</div>
                  <h3 className="font-semibold text-gray-800 mb-2">Choose Your Sign</h3>
                  <p className="text-sm text-gray-600">Select your zodiac sign from the 12 options. Not sure? Pick based on your birthday.</p>
                </div>
                <div className="bg-white rounded-xl p-5 border border-gray-200">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold mb-3">2</div>
                  <h3 className="font-semibold text-gray-800 mb-2">Pick Your Tone</h3>
                  <p className="text-sm text-gray-600">Want encouragement? Go Sweet. Need a reality check? Choose Brutal. Feeling playful? Sassy's your vibe.</p>
                </div>
                <div className="bg-white rounded-xl p-5 border border-gray-200">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold mb-3">3</div>
                  <h3 className="font-semibold text-gray-800 mb-2">Get Your Reading</h3>
                  <p className="text-sm text-gray-600">Our AI generates a unique horoscope of the day for your sign + tone. It stays the same all day so everyone gets the same cosmic energy.</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Why Daily Horoscopes Hit So Hard
              </h2>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <Sun className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" />
                  <div>
                    <strong className="text-gray-800">Reflection & Self-Awareness</strong>
                    <p className="text-gray-600 text-sm">Daily horoscopes create a moment to pause and check in with yourself.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" />
                  <div>
                    <strong className="text-gray-800">Entertainment Value</strong>
                    <p className="text-gray-600 text-sm">Let's be honest – they're fun. Especially when they're brutally honest.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Moon className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" />
                  <div>
                    <strong className="text-gray-800">Daily Ritual</strong>
                    <p className="text-gray-600 text-sm">Checking your horoscope of the day becomes a grounding morning routine.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Star className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" />
                  <div>
                    <strong className="text-gray-800">Conversation Starter</strong>
                    <p className="text-gray-600 text-sm">Share your reading with friends and watch the chaos unfold.</p>
                  </div>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                FAQ – Horoscope of the Day
              </h2>
              <div className="space-y-4">
                <div className="bg-white rounded-xl p-5 border border-gray-200">
                  <h3 className="font-semibold text-gray-800 mb-2">Is this horoscope of the day accurate?</h3>
                  <p className="text-gray-600 text-sm">Our AI-generated horoscopes are designed for entertainment and self-reflection. They provide thought-provoking insights based on zodiac archetypes, but should be taken as fun guidance rather than literal predictions.</p>
                </div>
                <div className="bg-white rounded-xl p-5 border border-gray-200">
                  <h3 className="font-semibold text-gray-800 mb-2">How often does the horoscope of the day update?</h3>
                  <p className="text-gray-600 text-sm">Each unique combination of zodiac sign and tone generates a new horoscope once per day. The reading stays the same throughout the day, then refreshes at midnight UTC.</p>
                </div>
                <div className="bg-white rounded-xl p-5 border border-gray-200">
                  <h3 className="font-semibold text-gray-800 mb-2">Is this daily horoscope free?</h3>
                  <p className="text-gray-600 text-sm">Yes! Our horoscope of the day generator is completely free to use. No signup required, no limits on how many readings you can get.</p>
                </div>
                <div className="bg-white rounded-xl p-5 border border-gray-200">
                  <h3 className="font-semibold text-gray-800 mb-2">Can I get a new horoscope if I don't like today's?</h3>
                  <p className="text-gray-600 text-sm">The same sign + tone combination gives the same reading all day. Try a different tone (Sweet, Sassy, or Brutal) for a fresh perspective, or check back tomorrow for a new reading.</p>
                </div>
                <div className="bg-white rounded-xl p-5 border border-gray-200">
                  <h3 className="font-semibold text-gray-800 mb-2">What makes this horoscope of the day different?</h3>
                  <p className="text-gray-600 text-sm">Most daily horoscopes are generic and forgettable. Our Real AF horoscope uses AI to generate readings that are specific, memorable, and honest – sometimes brutally so. Plus, you choose your tone based on what kind of cosmic energy you need today.</p>
                </div>
              </div>
            </section>
          </div>

          <ExploreMoreTools currentTool="/tools/horoscope-of-the-day" />

          <div className="text-center mt-12 pt-8 border-t border-gray-200">
            <p className="text-gray-500 text-sm">
              Free tool by{' '}
              <Link href="/" className="text-orange-600 hover:text-orange-700 font-medium">
                VCM Suite
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
