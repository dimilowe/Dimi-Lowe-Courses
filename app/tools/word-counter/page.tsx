'use client';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { 
  FileText, 
  Type, 
  AlignLeft, 
  Clock, 
  BookOpen, 
  Hash, 
  Copy, 
  Trash2, 
  Check,
  ArrowRight,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import ExploreMoreTools from '@/components/ExploreMoreTools';
import PostResultUpsell from '@/components/PostResultUpsell';

const STOP_WORDS = new Set([
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
  'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
  'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
  'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what',
  'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me',
  'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take',
  'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other',
  'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also',
  'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way',
  'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us',
  'is', 'are', 'was', 'were', 'been', 'being', 'has', 'had', 'does', 'did',
  'am', 'more', 'very', 'such', 'too', 'own', 'same', 'much', 'may', 'must'
]);

interface TextStats {
  words: number;
  characters: number;
  charactersNoSpaces: number;
  sentences: number;
  paragraphs: number;
  readingTime: { minutes: number; seconds: number };
  readingLevel: string;
  gradeLevel: number | null;
}

interface KeywordFrequency {
  word: string;
  count: number;
  percentage: number;
}

function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (word.length <= 2) return 1;
  
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');
  
  const syllables = word.match(/[aeiouy]{1,2}/g);
  return syllables ? syllables.length : 1;
}

function countTotalSyllables(text: string): number {
  const words = text.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/).filter(w => w.length > 0);
  return words.reduce((total, word) => total + countSyllables(word), 0);
}

function calculateStats(text: string): TextStats {
  const trimmedText = text.trim();
  
  const wordList = trimmedText ? trimmedText.split(/\s+/).filter(w => w.length > 0) : [];
  const words = wordList.length;
  const characters = text.length;
  const charactersNoSpaces = text.replace(/\s/g, '').length;
  
  const sentences = trimmedText 
    ? trimmedText.split(/[.!?]+/).filter(s => s.trim().length > 0).length 
    : 0;
  
  const paragraphs = trimmedText 
    ? trimmedText.split(/\n\s*\n/).filter(p => p.trim().length > 0).length 
    : 0;
  
  const totalSeconds = Math.round((words / 200) * 60);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  
  let readingLevel = 'N/A';
  let gradeLevel: number | null = null;
  
  if (words >= 10 && sentences > 0) {
    const totalSyllables = countTotalSyllables(trimmedText);
    const avgWordsPerSentence = words / sentences;
    const avgSyllablesPerWord = totalSyllables / words;
    
    const fleschKincaid = 0.39 * avgWordsPerSentence + 11.8 * avgSyllablesPerWord - 15.59;
    gradeLevel = Math.round(fleschKincaid * 10) / 10;
    
    if (gradeLevel <= 5) readingLevel = 'Very Easy (Grade 5 or below)';
    else if (gradeLevel <= 6) readingLevel = 'Easy (Grade 6)';
    else if (gradeLevel <= 8) readingLevel = 'Fairly Easy (Grade 7-8)';
    else if (gradeLevel <= 10) readingLevel = 'Standard (Grade 9-10)';
    else if (gradeLevel <= 12) readingLevel = 'Fairly Difficult (Grade 11-12)';
    else readingLevel = 'Difficult (College level)';
  }
  
  return {
    words,
    characters,
    charactersNoSpaces,
    sentences,
    paragraphs: paragraphs || (trimmedText ? 1 : 0),
    readingTime: { minutes, seconds },
    readingLevel,
    gradeLevel
  };
}

function calculateKeywordDensity(text: string): KeywordFrequency[] {
  const cleanText = text.toLowerCase().replace(/[^\w\s]/g, '');
  const words = cleanText.split(/\s+/).filter(w => w.length >= 3 && !STOP_WORDS.has(w));
  
  if (words.length === 0) return [];
  
  const frequency: Record<string, number> = {};
  words.forEach(word => {
    frequency[word] = (frequency[word] || 0) + 1;
  });
  
  const totalWords = words.length;
  
  return Object.entries(frequency)
    .map(([word, count]) => ({
      word,
      count,
      percentage: Math.round((count / totalWords) * 1000) / 10
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

function StatCard({ icon: Icon, value, label }: { icon: any; value: string | number; label: string }) {
  return (
    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-orange-100 rounded-lg">
          <Icon className="w-5 h-5 text-orange-600" />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-sm text-gray-500">{label}</p>
        </div>
      </div>
    </div>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="border-b border-gray-200 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
      >
        <span className="font-medium text-gray-900">{question}</span>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
        )}
      </button>
      {isOpen && (
        <div className="pb-4 text-gray-600">
          {answer}
        </div>
      )}
    </div>
  );
}

export default function WordCounterPage() {
  const [text, setText] = useState('');
  const [copied, setCopied] = useState(false);

  const stats = useMemo(() => calculateStats(text), [text]);
  const keywords = useMemo(() => calculateKeywordDensity(text), [text]);

  const handleClear = useCallback(() => {
    setText('');
  }, []);

  const handleCopy = useCallback(async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.error('Failed to copy');
    }
  }, [text]);

  const formatReadingTime = (time: { minutes: number; seconds: number }) => {
    if (time.minutes === 0 && time.seconds === 0) return '0 sec';
    if (time.minutes === 0) return `${time.seconds} sec`;
    if (time.seconds === 0) return `${time.minutes} min`;
    return `${time.minutes} min ${time.seconds} sec`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "VCM Word Counter Tool",
            "applicationCategory": "UtilitiesApplication",
            "operatingSystem": "Web",
            "description": "Free online word counter tool. Instantly count words, characters, sentences, paragraphs, and reading time. No ads, no sign-up, completely free.",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            }
          })
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "Is this word counter tool free?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes, this word counter is 100% free with no ads, no sign-up, and no usage limits. Use it as much as you need."
                }
              },
              {
                "@type": "Question",
                "name": "How is reading time calculated?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Reading time is calculated assuming an average reading speed of 200 words per minute, which is typical for adult readers."
                }
              },
              {
                "@type": "Question",
                "name": "What does reading level mean?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Reading level indicates how easy or difficult your text is to read. It's based on sentence length and word complexity. 'Easy' means most people can understand it, while 'Difficult' means it may require more education to comprehend."
                }
              },
              {
                "@type": "Question",
                "name": "Is my text saved or stored?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "No. All processing happens in your browser. Your text is never sent to any server or stored anywhere."
                }
              }
            ]
          })
        }}
      />

      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Free Word Counter Tool
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Online Word & Character Counter
          </p>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Paste your text and instantly see word count, character count, reading time, and more. No ads, no sign-up.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 md:p-8 mb-8">
          <label htmlFor="text-input" className="block text-sm font-medium text-gray-700 mb-2">
            Paste or type your text below
          </label>
          <textarea
            id="text-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Start typing or paste your text here..."
            className="w-full min-h-[220px] p-4 border border-gray-300 rounded-xl resize-y focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-gray-900 placeholder-gray-400"
          />
          
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleClear}
              disabled={!text}
              className={`flex items-center gap-2 px-5 py-2 rounded-full font-semibold transition-all ${
                text 
                  ? 'bg-gray-200 hover:bg-gray-300 text-gray-700' 
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Trash2 className="w-4 h-4" />
              Clear Text
            </button>
            <button
              onClick={handleCopy}
              disabled={!text}
              className={`flex items-center gap-2 px-5 py-2 rounded-full font-semibold transition-all ${
                text 
                  ? 'bg-orange-500 hover:bg-orange-600 text-gray-900' 
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy Text'}
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            <StatCard icon={FileText} value={stats.words} label="Words" />
            <StatCard icon={Type} value={stats.characters} label="Characters" />
            <StatCard icon={Hash} value={stats.charactersNoSpaces} label="Characters (no spaces)" />
            <StatCard icon={AlignLeft} value={stats.sentences} label="Sentences" />
            <StatCard icon={BookOpen} value={stats.paragraphs} label="Paragraphs" />
            <StatCard icon={Clock} value={formatReadingTime(stats.readingTime)} label="Reading Time" />
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <span className="text-sm font-medium text-gray-600">Reading Level</span>
                {stats.gradeLevel !== null && (
                  <span className="ml-2 text-xs text-gray-500">
                    (Flesch-Kincaid Grade: {stats.gradeLevel})
                  </span>
                )}
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                stats.readingLevel.includes('Very Easy') || stats.readingLevel.includes('Easy (Grade') 
                  ? 'bg-green-100 text-green-700'
                  : stats.readingLevel.includes('Fairly Easy') || stats.readingLevel.includes('Standard')
                    ? 'bg-orange-100 text-orange-700'
                    : stats.readingLevel === 'N/A'
                      ? 'bg-gray-100 text-gray-500'
                      : 'bg-orange-100 text-orange-700'
              }`}>
                {stats.readingLevel}
              </span>
            </div>
          </div>

          {stats.words > 0 && <PostResultUpsell />}
        </div>

        {keywords.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 md:p-8 mb-12">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Keyword Density</h2>
            <p className="text-sm text-gray-500 mb-4">Top keywords by frequency (excluding common words)</p>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">Word</th>
                    <th className="text-center py-2 px-3 text-sm font-medium text-gray-600">Count</th>
                    <th className="text-right py-2 px-3 text-sm font-medium text-gray-600">Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {keywords.map((kw, index) => (
                    <tr key={kw.word} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                      <td className="py-2 px-3 text-gray-900 font-medium">{kw.word}</td>
                      <td className="py-2 px-3 text-center text-gray-600">{kw.count}</td>
                      <td className="py-2 px-3 text-right text-gray-600">{kw.percentage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="bg-gray-900 rounded-2xl p-8 md:p-12 text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Turn Your Writing Into Money
          </h2>
          <p className="text-gray-300 mb-6 max-w-xl mx-auto">
            Use APE (Auto Paywall Everything) to instantly gate your best articles, emails, and guides behind tips, subscriptions, or one-time unlocks.
          </p>
          <Link
            href="/products/ape"
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-gray-900 font-semibold py-3 px-6 rounded-lg transition-all"
          >
            Learn About APE
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        <article className="prose prose-stone max-w-none">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            What Is a Word Counter Tool?
          </h2>
          <p className="text-gray-600 mb-6">
            A word counter tool is a simple utility that analyzes your text and provides detailed statistics about its content. It counts words, characters, sentences, and paragraphs while also calculating useful metrics like reading time and readability level. Writers, students, content creators, and professionals use word counters to meet specific requirements, optimize their content, and improve readability.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Why Use an Online Word Counter?
          </h2>
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            <div className="flex items-start gap-3 p-4 bg-white rounded-lg border border-gray-200">
              <FileText className="w-6 h-6 text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-gray-900">Meet Word Limits</h3>
                <p className="text-sm text-gray-600">Stay within assignment, submission, or publication limits for essays, articles, and applications.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-white rounded-lg border border-gray-200">
              <Type className="w-6 h-6 text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-gray-900">Optimize Social Posts</h3>
                <p className="text-sm text-gray-600">Keep Twitter/X posts under 280 characters, Instagram captions readable, and YouTube descriptions optimized.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-white rounded-lg border border-gray-200">
              <BookOpen className="w-6 h-6 text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-gray-900">Improve Readability</h3>
                <p className="text-sm text-gray-600">Use reading level analysis to ensure your content matches your target audience's comprehension level.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-white rounded-lg border border-gray-200">
              <Clock className="w-6 h-6 text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-gray-900">Estimate Reading Time</h3>
                <p className="text-sm text-gray-600">Know how long your blog posts, scripts, or presentations will take to read or deliver.</p>
              </div>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            How to Use This Free Word Counter Tool
          </h2>
          <ol className="list-decimal list-inside space-y-3 text-gray-600 mb-8">
            <li><strong>Paste or type your text</strong> into the text area above</li>
            <li><strong>Watch the stats update instantly</strong> as you type or paste</li>
            <li><strong>Review reading time and level</strong> to adjust your content for your audience</li>
            <li><strong>Check keyword density</strong> to see which words appear most frequently</li>
            <li><strong>Copy your text</strong> when you're done editing</li>
          </ol>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Understanding the Statistics
          </h2>
          <div className="space-y-4 mb-8">
            <div className="p-4 bg-white rounded-lg border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-1">Word Count</h3>
              <p className="text-sm text-gray-600">The total number of words in your text, separated by spaces. This is the most commonly requested metric for assignments and submissions.</p>
            </div>
            <div className="p-4 bg-white rounded-lg border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-1">Character Count</h3>
              <p className="text-sm text-gray-600">Total characters including spaces (useful for general length) and excluding spaces (often used for SMS limits and certain platforms).</p>
            </div>
            <div className="p-4 bg-white rounded-lg border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-1">Sentences & Paragraphs</h3>
              <p className="text-sm text-gray-600">Sentences are counted by periods, question marks, and exclamation points. Paragraphs are separated by blank lines.</p>
            </div>
            <div className="p-4 bg-white rounded-lg border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-1">Reading Time</h3>
              <p className="text-sm text-gray-600">Calculated at 200 words per minute, which is the average adult reading speed. Useful for blog posts, presentations, and video scripts.</p>
            </div>
            <div className="p-4 bg-white rounded-lg border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-1">Reading Level</h3>
              <p className="text-sm text-gray-600">Based on a simplified Flesch-Kincaid formula. "Easy" text uses short sentences and simple words. "Difficult" text uses longer sentences and complex vocabulary.</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>
          <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200 mb-8">
            <FAQItem 
              question="Is this word counter tool free?"
              answer="Yes, this word counter is 100% free with no ads, no sign-up, and no usage limits. Use it as much as you need for any project."
            />
            <FAQItem 
              question="How is reading time calculated?"
              answer="Reading time is calculated assuming an average reading speed of 200 words per minute, which is typical for adult readers. This gives you a reliable estimate for blog posts, presentations, and scripts."
            />
            <FAQItem 
              question="What does reading level mean?"
              answer="Reading level indicates how easy or difficult your text is to read. It's based on sentence length and word complexity using the Flesch-Kincaid formula. 'Easy' means most people can understand it, while 'Difficult' means it may require more education to comprehend."
            />
            <FAQItem 
              question="Is my text saved or stored?"
              answer="No. All processing happens entirely in your browser. Your text is never sent to any server, stored anywhere, or shared with anyone. Your privacy is completely protected."
            />
            <FAQItem 
              question="What is keyword density?"
              answer="Keyword density shows which meaningful words appear most frequently in your text. Common words like 'the', 'and', 'is' are excluded. This is useful for SEO and ensuring you're emphasizing the right topics."
            />
            <FAQItem 
              question="Can I use this for any language?"
              answer="This tool works best with English text. While it will count words and characters in any language, the reading level and keyword analysis are optimized for English."
            />
          </div>
        </article>

        <ExploreMoreTools currentTool="/tools/word-counter" />

        <footer className="text-center text-sm text-gray-500 mt-12 pt-8 border-t border-gray-200">
          <p>Part of the VCM creator tool stack. Build, monetize, and grow with APE & VCM OS.</p>
        </footer>
      </main>
    </div>
  );
}
