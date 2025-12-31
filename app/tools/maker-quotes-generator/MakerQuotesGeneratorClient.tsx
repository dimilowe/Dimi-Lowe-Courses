"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, Quote, Copy, Check, Shuffle, Tag, MessageSquare, FileText, RotateCcw, Lightbulb, Rocket, Flame, GraduationCap, Zap } from "lucide-react";
import MonetizationBar from "@/components/MonetizationBar";
import PostResultUpsell from "@/components/PostResultUpsell";

interface QuoteData {
  text: string;
  author?: string;
  tags: string[];
  tone: string[];
}

const BASE_QUOTES: QuoteData[] = [
  { text: "Makers aren't waiting for permission; they're busy building the future.", tags: ["creativity", "entrepreneurship", "innovation"], tone: ["motivational"] },
  { text: "Every failed prototype is data, not defeat.", tags: ["failure", "persistence"], tone: ["serious", "motivational"] },
  { text: "The best products are born from problems no one else wanted to solve.", tags: ["innovation", "entrepreneurship"], tone: ["serious"] },
  { text: "Ship it. Learn from it. Improve it. Repeat.", tags: ["innovation", "persistence"], tone: ["punchy", "motivational"] },
  { text: "Your first version will embarrass you. Ship it anyway.", tags: ["failure", "creativity"], tone: ["funny", "motivational"] },
  { text: "Ideas are free. Execution is everything.", tags: ["entrepreneurship", "innovation"], tone: ["punchy", "serious"] },
  { text: "Build in public. Fail in public. Win in public.", tags: ["entrepreneurship", "persistence"], tone: ["motivational", "punchy"] },
  { text: "Creativity is connecting dots others don't see.", tags: ["creativity", "innovation"], tone: ["serious", "motivational"] },
  { text: "The garage startup of today is the empire of tomorrow.", tags: ["entrepreneurship", "persistence"], tone: ["motivational"] },
  { text: "Don't wait for inspiration. Create on a schedule.", tags: ["creativity", "persistence"], tone: ["serious", "punchy"] },
  { text: "Every creator was once a beginner who refused to quit.", tags: ["persistence", "creativity"], tone: ["motivational"] },
  { text: "The market rewards builders, not dreamers.", tags: ["entrepreneurship", "innovation"], tone: ["serious", "punchy"] },
  { text: "Your side project could be someone's main solution.", tags: ["entrepreneurship", "creativity"], tone: ["motivational"] },
  { text: "Innovation isn't about new ideas—it's about new execution.", tags: ["innovation", "entrepreneurship"], tone: ["serious"] },
  { text: "Build things that make you proud, not just things that sell.", tags: ["creativity", "entrepreneurship"], tone: ["motivational", "serious"] },
  { text: "Constraints breed creativity. Embrace the limits.", tags: ["creativity", "innovation"], tone: ["serious", "motivational"] },
  { text: "The best time to start was yesterday. The second best time is now.", tags: ["persistence", "entrepreneurship"], tone: ["motivational", "punchy"] },
  { text: "Perfection is procrastination in disguise.", tags: ["creativity", "failure"], tone: ["funny", "punchy"] },
  { text: "Make something. Break something. Learn everything.", tags: ["failure", "creativity"], tone: ["punchy", "motivational"] },
  { text: "Your competition isn't other makers—it's your own hesitation.", tags: ["entrepreneurship", "persistence"], tone: ["motivational", "serious"] },
  { text: "Great products solve problems. Legendary products create movements.", tags: ["innovation", "entrepreneurship"], tone: ["motivational", "serious"] },
  { text: "The only failed project is the one you never started.", tags: ["failure", "persistence"], tone: ["motivational"] },
  { text: "Iterate until it's irresistible.", tags: ["innovation", "persistence"], tone: ["punchy"] },
  { text: "Every 'overnight success' had a decade of quiet work behind it.", tags: ["persistence", "entrepreneurship"], tone: ["serious"] },
  { text: "The world needs what only you can create.", tags: ["creativity", "entrepreneurship"], tone: ["motivational"] },
  { text: "Good enough shipped beats perfect in your head.", tags: ["innovation", "failure"], tone: ["punchy", "funny"] },
  { text: "Build for your users, not for your ego.", tags: ["entrepreneurship", "innovation"], tone: ["serious", "punchy"] },
  { text: "Creativity without action is just daydreaming.", tags: ["creativity", "persistence"], tone: ["serious", "punchy"] },
  { text: "The maker's path is paved with rejected ideas and refused shortcuts.", tags: ["persistence", "failure"], tone: ["serious", "motivational"] },
  { text: "Start ugly. Finish strong. Learn always.", tags: ["failure", "persistence"], tone: ["punchy", "motivational"] },
  { text: "Revenue is the ultimate validation.", tags: ["entrepreneurship", "innovation"], tone: ["punchy", "serious"] },
  { text: "Create the product you wish existed.", tags: ["creativity", "innovation"], tone: ["motivational"] },
  { text: "Makers ask 'how can I?' instead of 'why should I?'", tags: ["creativity", "entrepreneurship"], tone: ["serious", "motivational"] },
  { text: "Your mess is your message. Share the journey.", tags: ["failure", "entrepreneurship"], tone: ["motivational"] },
  { text: "Build fast. Learn faster. Pivot fastest.", tags: ["innovation", "failure"], tone: ["punchy"] },
  { text: "The difference between a hobby and a business is persistence.", tags: ["entrepreneurship", "persistence"], tone: ["serious"] },
  { text: "Every 'no' brings you closer to 'yes'.", tags: ["persistence", "failure"], tone: ["motivational"] },
  { text: "Make it work. Make it right. Make it fast.", tags: ["innovation", "persistence"], tone: ["punchy", "serious"] },
  { text: "Creators create. Everything else is commentary.", tags: ["creativity", "persistence"], tone: ["punchy"] },
  { text: "Your next iteration is someone's life-changing solution.", tags: ["innovation", "entrepreneurship"], tone: ["motivational"] },
  { text: "Done is the engine of more.", tags: ["persistence", "creativity"], tone: ["punchy"] },
  { text: "Small daily improvements compound into massive results.", tags: ["persistence", "innovation"], tone: ["motivational", "serious"] },
  { text: "The best feedback comes from real users, not imaginary critics.", tags: ["entrepreneurship", "innovation"], tone: ["serious"] },
  { text: "Think like an artist. Execute like an engineer.", tags: ["creativity", "innovation"], tone: ["serious", "motivational"] },
  { text: "Your limitations are your secret weapons.", tags: ["creativity", "failure"], tone: ["motivational"] },
  { text: "Build in weekends. Scale in decades.", tags: ["entrepreneurship", "persistence"], tone: ["serious"] },
  { text: "Imposter syndrome is just excitement in a scary costume.", tags: ["failure", "creativity"], tone: ["funny", "motivational"] },
  { text: "The market doesn't care about your roadmap. Ship value.", tags: ["entrepreneurship", "innovation"], tone: ["punchy", "serious"] },
  { text: "Every maker needs a maker friend. Find yours.", tags: ["creativity", "persistence"], tone: ["motivational"] },
  { text: "Build bridges between problems and solutions.", tags: ["innovation", "creativity"], tone: ["motivational", "serious"] },
  { text: "The future belongs to the curious and the persistent.", tags: ["persistence", "innovation"], tone: ["motivational"] },
  { text: "Your portfolio is your proof. Keep building.", tags: ["creativity", "entrepreneurship"], tone: ["motivational", "punchy"] },
  { text: "Embrace the pivot. It's not failure—it's intelligence.", tags: ["failure", "entrepreneurship"], tone: ["motivational", "serious"] },
  { text: "Make things that outlive you.", tags: ["creativity", "innovation"], tone: ["serious", "motivational"] },
  { text: "The gap between amateur and pro is showing up daily.", tags: ["persistence", "creativity"], tone: ["serious", "punchy"] },
  { text: "Innovation is saying 'yes, and...' to every problem.", tags: ["innovation", "creativity"], tone: ["motivational"] },
  { text: "Code, design, write, build—just don't sit still.", tags: ["creativity", "persistence"], tone: ["punchy", "motivational"] },
  { text: "Your unique perspective is your unfair advantage.", tags: ["creativity", "entrepreneurship"], tone: ["motivational"] },
  { text: "Launch before you're ready. You'll never feel ready.", tags: ["failure", "entrepreneurship"], tone: ["punchy", "motivational"] },
  { text: "The real competition is who ships more experiments.", tags: ["innovation", "persistence"], tone: ["serious"] },
  { text: "The best way to predict the future is to invent it.", author: "Alan Kay", tags: ["innovation", "creativity"], tone: ["motivational", "serious"] },
  { text: "Done is better than perfect.", author: "Sheryl Sandberg", tags: ["persistence", "entrepreneurship"], tone: ["punchy"] },
  { text: "Move fast and break things.", author: "Mark Zuckerberg", tags: ["innovation", "failure"], tone: ["punchy"] },
  { text: "Stay hungry. Stay foolish.", author: "Steve Jobs", tags: ["creativity", "entrepreneurship"], tone: ["motivational", "punchy"] },
  { text: "Fail fast, fail often.", author: "Silicon Valley Proverb", tags: ["failure", "innovation"], tone: ["punchy"] },
  { text: "If you're not embarrassed by the first version of your product, you've launched too late.", author: "Reid Hoffman", tags: ["failure", "entrepreneurship"], tone: ["serious"] },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs", tags: ["creativity", "persistence"], tone: ["motivational"] },
  { text: "Make something people want.", author: "Y Combinator", tags: ["entrepreneurship", "innovation"], tone: ["punchy", "serious"] },
  { text: "Genius is one percent inspiration and ninety-nine percent perspiration.", author: "Thomas Edison", tags: ["persistence", "creativity"], tone: ["serious"] },
  { text: "Whether you think you can or you can't, you're right.", author: "Henry Ford", tags: ["persistence", "entrepreneurship"], tone: ["motivational"] },
  { text: "I have not failed. I've just found 10,000 ways that won't work.", author: "Thomas Edison", tags: ["failure", "persistence"], tone: ["motivational", "serious"] },
  { text: "The secret to getting ahead is getting started.", author: "Mark Twain", tags: ["persistence", "entrepreneurship"], tone: ["motivational", "punchy"] },
  { text: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs", tags: ["innovation", "entrepreneurship"], tone: ["serious"] },
  { text: "Your most unhappy customers are your greatest source of learning.", author: "Bill Gates", tags: ["failure", "entrepreneurship"], tone: ["serious"] },
  { text: "Ideas are worthless. Execution is everything.", author: "Scott Adams", tags: ["innovation", "entrepreneurship"], tone: ["punchy", "serious"] },
];

const themes = [
  { value: "creativity", label: "Creativity", icon: Lightbulb },
  { value: "persistence", label: "Persistence", icon: Flame },
  { value: "innovation", label: "Innovation", icon: Rocket },
  { value: "entrepreneurship", label: "Entrepreneurship", icon: Zap },
  { value: "failure", label: "Failure & Learning", icon: GraduationCap },
];

const tones = [
  { value: "motivational", label: "Motivational" },
  { value: "serious", label: "Serious" },
  { value: "funny", label: "Funny" },
  { value: "punchy", label: "Short & Punchy" },
];

const formats = [
  { value: "quote", label: "Quote Only" },
  { value: "author", label: "Quote + Author" },
  { value: "caption", label: "Social Caption" },
];

interface GeneratedQuote {
  displayText: string;
  rawQuote: string;
  author?: string;
}

export default function MakerQuotesGeneratorClient() {
  const [theme, setTheme] = useState("creativity");
  const [tone, setTone] = useState("motivational");
  const [format, setFormat] = useState("quote");
  const [count, setCount] = useState(5);
  const [quotes, setQuotes] = useState<GeneratedQuote[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);

  const generateQuotes = () => {
    let filtered = BASE_QUOTES.filter(q => 
      q.tags.includes(theme) && q.tone.includes(tone)
    );

    if (filtered.length < count) {
      filtered = BASE_QUOTES.filter(q => 
        q.tags.includes(theme) || q.tone.includes(tone)
      );
    }

    if (filtered.length < count) {
      filtered = [...BASE_QUOTES];
    }

    const shuffled = [...filtered].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, count);

    const generated: GeneratedQuote[] = selected.map(q => {
      let displayText = q.text;
      
      if (format === "author" && q.author) {
        displayText = `"${q.text}" — ${q.author}`;
      } else if (format === "caption") {
        displayText = `${q.text} #maker #creator #builder`;
      }

      return {
        displayText,
        rawQuote: q.text,
        author: q.author,
      };
    });

    setQuotes(generated);
    setHasGenerated(true);

    setTimeout(() => {
      document.getElementById("results")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const resetForm = () => {
    setTheme("creativity");
    setTone("motivational");
    setFormat("quote");
    setCount(5);
    setQuotes([]);
    setHasGenerated(false);
  };

  const ThemeIcon = themes.find(t => t.value === theme)?.icon || Lightbulb;

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What is a maker quotes generator?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "A maker quotes generator is a tool that creates inspiring quotes specifically for creators, builders, and entrepreneurs. It helps you find the perfect words for social media posts, thumbnails, captions, and content that resonates with the maker community."
        }
      },
      {
        "@type": "Question",
        "name": "How do I use maker quotes for social media?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Use maker quotes as Instagram captions, Twitter posts, LinkedIn updates, or TikTok overlays. Choose quotes that match your content theme and add relevant hashtags like #maker, #creator, or #builder to increase reach."
        }
      },
      {
        "@type": "Question",
        "name": "Can I use these quotes for commercial purposes?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Most original quotes in this generator are created for makers and are free to use. For attributed quotes from famous figures, they are short excerpts commonly used for inspiration and fall under fair use for personal and educational content."
        }
      },
      {
        "@type": "Question",
        "name": "What themes are available in the maker quotes generator?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "The generator offers five themes: Creativity (for artistic inspiration), Persistence (for staying motivated), Innovation (for disruption and new ideas), Entrepreneurship (for business builders), and Failure & Learning (for resilience quotes)."
        }
      },
      {
        "@type": "Question",
        "name": "How can I make my content stand out with quotes?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Pair quotes with relevant visuals, use consistent branding, and choose quotes that authentically represent your journey. Mix famous quotes with original maker insights to create a unique content style that resonates with your audience."
        }
      },
      {
        "@type": "Question",
        "name": "What's the best format for sharing maker quotes?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "For social media, use the 'Social Caption' format which adds relevant hashtags. For YouTube thumbnails or posters, use 'Quote Only' for cleaner visuals. For blog posts or articles, use 'Quote + Author' to give proper attribution."
        }
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      
      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <MonetizationBar />
        
        <div className="max-w-4xl mx-auto px-4 py-12">
          <Link
            href="/tools"
            className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 mb-8 text-sm font-medium"
          >
            ← Back to Tools
          </Link>

          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
              <Sparkles className="w-4 h-4" />
              Free Quote Generator
            </span>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Maker Quotes Generator – Inspiring Quotes for Creators
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Use this <strong>maker quotes generator</strong> to create inspiring quotes for creators, builders, and entrepreneurs. Perfect for social posts, thumbnails, and captions.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-orange-100 p-2 rounded-lg">
                  <Quote className="w-5 h-5 text-orange-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Quote Generator</h2>
              </div>
              <button
                onClick={resetForm}
                className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Tag className="w-4 h-4 text-gray-400" />
                  Theme
                </label>
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
                >
                  {themes.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <MessageSquare className="w-4 h-4 text-gray-400" />
                  Tone
                </label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
                >
                  {tones.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <FileText className="w-4 h-4 text-gray-400" />
                  Format
                </label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
                >
                  {formats.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Shuffle className="w-4 h-4 text-gray-400" />
                  How Many Quotes?
                </label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={count}
                  onChange={(e) => setCount(Math.min(20, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </div>

            <button
              onClick={generateQuotes}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              Generate Quotes
            </button>
          </div>

          <div id="results" className="mb-12">
            {!hasGenerated ? (
              <div className="bg-gray-50 rounded-2xl border border-gray-200 p-8 text-center">
                <Quote className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Choose your options above and generate your first maker quotes.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Your Generated Quotes ({quotes.length})
                </h2>
                <div className="grid gap-4">
                  {quotes.map((quote, index) => (
                    <div
                      key={index}
                      className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
                    >
                      <p className="text-gray-800 text-lg leading-relaxed mb-4">
                        {quote.displayText}
                      </p>
                      <div className="flex items-center justify-between">
                        {quote.author && format !== "author" && (
                          <span className="text-sm text-gray-500">— {quote.author}</span>
                        )}
                        <div className="flex gap-2 ml-auto">
                          <button
                            onClick={() => copyToClipboard(quote.displayText, index)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                              copiedIndex === index
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                            }`}
                          >
                            {copiedIndex === index ? (
                              <>
                                <Check className="w-4 h-4" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4" />
                                Copy
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <PostResultUpsell />

          <div className="mt-16 bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              What Are Maker Quotes?
            </h2>
            <p className="text-gray-600 mb-6">
              <strong>Maker quotes</strong> are inspiring phrases crafted specifically for creators, builders, entrepreneurs, and anyone who makes things. Unlike generic motivational quotes, maker quotes speak directly to the challenges of building products, launching businesses, and creating art. They celebrate the messy reality of making—the failures, pivots, late nights, and breakthrough moments.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              How to Use Maker Quotes in Your Content
            </h2>
            <ul className="space-y-2 text-gray-600 mb-8">
              <li className="flex items-start gap-2">
                <span className="text-orange-500 mt-1">•</span>
                <span><strong>YouTube Thumbnails:</strong> Add bold quotes to thumbnails to increase click-through rates</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500 mt-1">•</span>
                <span><strong>Instagram Captions:</strong> Pair quotes with behind-the-scenes photos of your work</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500 mt-1">•</span>
                <span><strong>TikTok Hooks:</strong> Use punchy quotes as video openers or text overlays</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500 mt-1">•</span>
                <span><strong>Twitter/X Posts:</strong> Share quotes with your own commentary or experience</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500 mt-1">•</span>
                <span><strong>LinkedIn Updates:</strong> Professional quotes for career and entrepreneurship content</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500 mt-1">•</span>
                <span><strong>Blog Posts:</strong> Use quotes as section openers or conclusion emphasis</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500 mt-1">•</span>
                <span><strong>Posters & Merch:</strong> Print quotes on products for your community</span>
              </li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Famous Maker & Creator Quotes
            </h2>
            <p className="text-gray-600 mb-4">
              Throughout history, makers and innovators have shared wisdom about the creative process. Here are some timeless favorites:
            </p>
            <div className="grid md:grid-cols-2 gap-3">
              {[
                '"The best way to predict the future is to invent it." — Alan Kay',
                '"Done is better than perfect." — Sheryl Sandberg',
                '"Stay hungry. Stay foolish." — Steve Jobs',
                '"Move fast and break things." — Mark Zuckerberg',
                '"Make something people want." — Y Combinator',
                '"The only way to do great work is to love what you do." — Steve Jobs',
                '"Innovation distinguishes between a leader and a follower." — Steve Jobs',
                '"Genius is 1% inspiration and 99% perspiration." — Thomas Edison',
                '"Whether you think you can or you can\'t, you\'re right." — Henry Ford',
                '"I have not failed. I\'ve just found 10,000 ways that won\'t work." — Thomas Edison',
                '"The secret to getting ahead is getting started." — Mark Twain',
                '"Your most unhappy customers are your greatest source of learning." — Bill Gates',
                '"If you\'re not embarrassed by your first version, you launched too late." — Reid Hoffman',
                '"Ideas are worthless. Execution is everything." — Scott Adams',
                '"Fail fast, fail often." — Silicon Valley Proverb',
              ].map((quote, i) => (
                <div key={i} className="bg-gray-50 p-4 rounded-lg text-gray-700 text-sm">
                  {quote}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-12 bg-orange-50 rounded-2xl p-6 md:p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Related Articles
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Link
                href="/mbb/how-makers-use-quotes"
                className="bg-white rounded-xl p-5 border border-orange-200 hover:border-orange-400 transition-colors"
              >
                <h3 className="font-semibold text-gray-900 mb-2">How Makers Use Quotes for Content</h3>
                <p className="text-sm text-gray-600">Learn strategies for incorporating quotes into your creator content strategy.</p>
              </Link>
              <Link
                href="/mbb/famous-quotes-for-creators"
                className="bg-white rounded-xl p-5 border border-orange-200 hover:border-orange-400 transition-colors"
              >
                <h3 className="font-semibold text-gray-900 mb-2">Famous Quotes for Creators & Builders</h3>
                <p className="text-sm text-gray-600">Explore the most inspiring quotes from legendary makers throughout history.</p>
              </Link>
            </div>
          </div>

          <div className="mt-12 space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Frequently Asked Questions About the Maker Quotes Generator
            </h2>
            
            <details className="bg-white rounded-xl border border-gray-200 p-5 group">
              <summary className="font-semibold text-gray-900 cursor-pointer list-none flex items-center justify-between">
                What is a maker quotes generator?
                <span className="text-orange-500 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="mt-3 text-gray-600">
                A maker quotes generator creates inspiring quotes specifically for creators, builders, and entrepreneurs. It helps you find the perfect words for social posts, thumbnails, and content that resonates with the maker community.
              </p>
            </details>

            <details className="bg-white rounded-xl border border-gray-200 p-5 group">
              <summary className="font-semibold text-gray-900 cursor-pointer list-none flex items-center justify-between">
                How do I use maker quotes for social media?
                <span className="text-orange-500 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="mt-3 text-gray-600">
                Use maker quotes as Instagram captions, Twitter posts, LinkedIn updates, or TikTok overlays. Choose quotes that match your content theme and add relevant hashtags to increase reach.
              </p>
            </details>

            <details className="bg-white rounded-xl border border-gray-200 p-5 group">
              <summary className="font-semibold text-gray-900 cursor-pointer list-none flex items-center justify-between">
                Can I use these quotes for commercial purposes?
                <span className="text-orange-500 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="mt-3 text-gray-600">
                Most original quotes in this generator are created for makers and are free to use. Attributed quotes from famous figures are short excerpts commonly used for inspiration.
              </p>
            </details>

            <details className="bg-white rounded-xl border border-gray-200 p-5 group">
              <summary className="font-semibold text-gray-900 cursor-pointer list-none flex items-center justify-between">
                What themes are available?
                <span className="text-orange-500 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="mt-3 text-gray-600">
                The generator offers five themes: Creativity, Persistence, Innovation, Entrepreneurship, and Failure & Learning. Each theme provides quotes tailored to that specific aspect of the maker journey.
              </p>
            </details>

            <details className="bg-white rounded-xl border border-gray-200 p-5 group">
              <summary className="font-semibold text-gray-900 cursor-pointer list-none flex items-center justify-between">
                How can I make my content stand out with quotes?
                <span className="text-orange-500 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="mt-3 text-gray-600">
                Pair quotes with relevant visuals, use consistent branding, and choose quotes that authentically represent your journey. Mix famous quotes with original maker insights for a unique content style.
              </p>
            </details>

            <details className="bg-white rounded-xl border border-gray-200 p-5 group">
              <summary className="font-semibold text-gray-900 cursor-pointer list-none flex items-center justify-between">
                What's the best format for sharing maker quotes?
                <span className="text-orange-500 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="mt-3 text-gray-600">
                For social media, use the "Social Caption" format with hashtags. For thumbnails or posters, use "Quote Only" for cleaner visuals. For blogs, use "Quote + Author" for proper attribution.
              </p>
            </details>
          </div>

          <div className="mt-12 text-center text-sm text-gray-500">
            <p>Generated quotes are for inspiration only. Always make sure your content reflects your own voice.</p>
            <p className="mt-1">Tool by creators, for creators.</p>
          </div>
        </div>
      </main>
    </>
  );
}
