'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calculator, Info, RefreshCw, ChevronDown, ChevronUp, Flame, Bell, QrCode, ArrowRight, BookOpen } from 'lucide-react';
import { ToolForRenderer } from '@/lib/cms/getCmsToolBySlug';

interface CalculatorEngineProps {
  tool: ToolForRenderer;
}

interface FAQ {
  question: string;
  answer: string;
}

interface MetricPreset {
  label: string;
  badgeLabel: string;
  explanation: string;
  inputs: { key: string; label: string; placeholder: string; suffix?: string }[];
  formula: (values: Record<string, number>) => number;
  resultLabel: string;
  resultSuffix: string;
  goodRange?: string;
  contentGuide: string;
  faqs: FAQ[];
}

const YOUTUBE_METRIC_PRESETS: Record<string, MetricPreset> = {
  'ctr': {
    label: 'Click-Through Rate',
    badgeLabel: 'CTR',
    explanation: 'Click-Through Rate (CTR) measures how often viewers click on your video after seeing the thumbnail. A higher CTR means your thumbnail and title are compelling viewers to watch.',
    inputs: [
      { key: 'clicks', label: 'Clicks', placeholder: 'e.g., 1500' },
      { key: 'impressions', label: 'Impressions', placeholder: 'e.g., 50000' },
    ],
    formula: (v) => (v.clicks / v.impressions) * 100,
    resultLabel: 'CTR',
    resultSuffix: '%',
    goodRange: 'A good YouTube CTR is typically 4-10%. Top performers often see 10%+.',
    contentGuide: `## Understanding YouTube Click-Through Rate (CTR) in 2025

### What Is CTR and Why It Matters
Click-Through Rate measures the percentage of viewers who click on your video after seeing the thumbnail in their feed. It's calculated by dividing clicks by impressions and multiplying by 100. CTR is one of the most critical metrics for YouTube success because it directly influences how often YouTube recommends your content.

### 2025 CTR Benchmarks by Niche

**High CTR Niches (8-15%+):**
- Entertainment and reaction videos
- Drama and commentary content
- Trending topic coverage
- Celebrity and pop culture

**Average CTR Niches (4-8%):**
- Gaming and Let's Plays
- Vlogs and lifestyle
- Product reviews
- How-to tutorials

**Lower CTR Niches (2-5%):**
- Educational deep-dives
- Documentary-style content
- Niche technical topics
- Long-form analysis

### Factors That Influence CTR

**Thumbnail Design:**
Thumbnails account for roughly 80% of CTR performance. Key elements include: high-contrast colors, expressive faces (especially eyes), readable text (3-5 words max), and clear visual hierarchy. Avoid cluttered designs.

**Title Optimization:**
Titles should create curiosity without clickbait. Use numbers, power words, and emotional triggers. Front-load important keywords. Aim for 50-60 characters.

**Audience Match:**
CTR depends heavily on who sees your video. If YouTube shows your content to the wrong audience, CTR drops—even with great thumbnails.

### CTR vs. Total Views Trade-off
Higher CTR doesn't always mean more views. As YouTube expands your audience reach, CTR naturally decreases. A video with 5% CTR and 1 million impressions outperforms one with 15% CTR and 50,000 impressions. Focus on the balance.

### Tools to Improve CTR
Use A/B testing tools to compare thumbnail variations. YouTube's built-in thumbnail test feature (available in Studio) lets you test up to 3 versions. External tools like Nudge can add interactive elements that boost engagement.`,
    faqs: [
      {
        question: 'What is a good YouTube CTR?',
        answer: 'A good YouTube CTR typically ranges from 4-10%. However, this varies by niche. Educational content often sees 2-6%, while entertainment can reach 8-15%. New channels might see lower CTRs as YouTube tests your content with different audiences.',
      },
      {
        question: 'How can I improve my YouTube CTR?',
        answer: 'Focus on creating compelling thumbnails with bright colors, expressive faces, and readable text. Write titles that spark curiosity without being clickbait. A/B test different thumbnails using YouTube\'s built-in feature or tools like Nudge.',
      },
      {
        question: 'Does CTR affect YouTube algorithm?',
        answer: 'Yes, CTR is one of the key signals YouTube uses to determine if your content is worth recommending. Higher CTR combined with good retention tells YouTube your content delivers on its promise.',
      },
      {
        question: 'Why is my YouTube CTR dropping?',
        answer: 'CTR often drops when YouTube expands your audience reach. This is normal - as your video is shown to less targeted viewers, fewer will click. Focus on maintaining a balance between CTR and total impressions.',
      },
    ],
  },
  'cpm': {
    label: 'CPM (Revenue per 1K Views)',
    badgeLabel: 'CPM',
    explanation: 'CPM (Cost Per Mille) represents how much you earn per 1,000 monetized video views. Higher CPM indicates better ad revenue performance.',
    inputs: [
      { key: 'revenue', label: 'Total Revenue ($)', placeholder: 'e.g., 500' },
      { key: 'views', label: 'Monetized Views (in thousands)', placeholder: 'e.g., 100' },
    ],
    formula: (v) => v.revenue / v.views,
    resultLabel: 'CPM',
    resultSuffix: ' USD',
    goodRange: 'Average YouTube CPM ranges from $1-5. Finance, tech, and B2B niches can see $10-50+.',
    contentGuide: `## YouTube CPM Deep Dive: Maximizing Ad Revenue in 2025

### How YouTube CPM Works
CPM (Cost Per Mille) represents what advertisers pay per 1,000 ad impressions on your videos. Your actual earnings are approximately 55% of the CPM after YouTube's 45% cut. A $10 CPM means you earn roughly $5.50 per 1,000 monetized views.

### 2025 CPM Rates by Niche

**Premium CPM ($15-50+):**
- Finance and investing
- Business and B2B
- Legal and insurance
- Real estate
- Enterprise software

**Mid-Tier CPM ($5-15):**
- Technology reviews
- Health and wellness
- Education and courses
- Marketing and entrepreneurship

**Lower CPM ($1-5):**
- Gaming and entertainment
- Vlogs and lifestyle
- Comedy and pranks
- Music and covers

### Factors That Affect Your CPM

**Audience Geography:**
US, UK, Canada, and Australia viewers command 3-10x higher CPMs than viewers from developing nations. A channel with 80% US audience will earn dramatically more than one with 80% India audience.

**Seasonality:**
Q4 (October-December) sees CPMs spike 30-100% as advertisers increase holiday spending. January typically sees the lowest CPMs of the year.

**Video Length:**
Videos over 8 minutes can include mid-roll ads, often doubling or tripling effective CPM. Longer watch sessions = more ad opportunities.

**Content Category:**
Brand-safe, advertiser-friendly content earns higher CPMs. Videos with sensitive topics may get limited or no ads.

### CPM vs RPM: Understanding the Difference
CPM is what advertisers pay. RPM (Revenue Per Mille) is what you actually earn per 1,000 total views (not just monetized views). RPM is typically 40-70% of CPM because not all views are monetized.

### Strategies to Increase CPM
Create content targeting high-value demographics. Focus on US/UK audiences. Make longer videos (8+ min) for mid-roll eligibility. Stay brand-safe. Post during Q4 for maximum rates. Target keywords advertisers bid highly on.`,
    faqs: [
      {
        question: 'What affects YouTube CPM rates?',
        answer: 'CPM varies by niche (finance/tech pay more), audience location (US/UK viewers = higher CPM), time of year (Q4 is highest), and video length (8+ min videos allow mid-roll ads). Advertiser demand in your category is the biggest factor.',
      },
      {
        question: 'Why is my CPM so low?',
        answer: 'Low CPM usually means: audience in lower-paying regions, content not attractive to advertisers, videos too short for mid-roll ads, or off-season timing. Niches like gaming and vlogs typically have lower CPMs than business or finance.',
      },
      {
        question: 'How can I increase my YouTube CPM?',
        answer: 'Create longer videos (8+ minutes) for mid-roll ads, target high-CPM topics, grow your US/UK audience, post during Q4 when ad spend peaks, and ensure your content is brand-safe for premium advertisers.',
      },
      {
        question: 'What is the difference between CPM and RPM?',
        answer: 'CPM is what advertisers pay per 1,000 ad impressions. RPM (Revenue Per Mille) is what you actually earn per 1,000 views after YouTube\'s 45% cut. RPM is typically 40-60% of CPM.',
      },
    ],
  },
  'avg-view-duration': {
    label: 'Average View Duration',
    badgeLabel: 'AVD',
    explanation: 'Average View Duration shows how long viewers typically watch your videos. It\'s calculated by dividing total watch time by total views.',
    inputs: [
      { key: 'totalWatchTime', label: 'Total Watch Time (minutes)', placeholder: 'e.g., 50000' },
      { key: 'views', label: 'Total Views', placeholder: 'e.g., 10000' },
    ],
    formula: (v) => v.totalWatchTime / v.views,
    resultLabel: 'Avg Duration',
    resultSuffix: ' min',
    goodRange: 'Aim for 50%+ of your video length. For a 10-min video, 5+ minutes is solid.',
    contentGuide: `## Average View Duration: The Metric That Drives YouTube Growth

### What Average View Duration Tells You
Average View Duration (AVD) measures how many minutes viewers watch your video on average. Unlike retention percentage, AVD gives you an absolute number. A 10-minute video with 5 minutes AVD and a 20-minute video with 5 minutes AVD have the same AVD but very different retention rates.

### Why AVD Matters for the Algorithm
YouTube's goal is to maximize time spent on platform. Videos with high AVD contribute more to this goal, earning more algorithmic favor. A video that holds viewers for 8 minutes generates more ad revenue potential than one that holds for 2 minutes.

### AVD Benchmarks by Content Type

**High AVD Content (60%+ of length):**
- Tutorial walkthroughs
- Documentary-style content
- Storytelling videos
- Compelling narratives

**Average AVD (40-60%):**
- Product reviews
- Commentary videos
- Gaming content
- Vlogs

**Lower AVD (20-40%):**
- Music videos (viewers replay specific sections)
- Quick tips compilations
- News and updates

### The Hook-Retain-Payoff Framework

**First 30 Seconds (Hook):**
Your most critical window. Preview the value, create curiosity, and prove the video is worth watching. Avoid long intros, logos, or unnecessary context.

**Middle Sections (Retain):**
Use pattern interrupts every 30-60 seconds: visual changes, tone shifts, B-roll, graphics, or new talking points. Each section should promise and deliver micro-value.

**Final Section (Payoff):**
Deliver your main promise. End strong with a call-to-action. Consider end screens to keep viewers on your channel.

### Common AVD Killers
Long intros, off-topic tangents, repetitive content, low energy sections, technical issues (audio/video quality), and unfulfilled promises in thumbnails/titles.

### Improving AVD Over Time
Study your retention graphs in YouTube Analytics. Identify exact timestamps where viewers drop off. Create content that addresses those weak points. Test different video structures. Short-form creators transitioning to long-form often need to relearn pacing.`,
    faqs: [
      {
        question: 'What is a good average view duration on YouTube?',
        answer: 'A good average view duration is typically 50% or more of your video length. For a 10-minute video, aim for 5+ minutes. However, this varies - tutorials may have lower AVD as viewers leave once they learn what they need.',
      },
      {
        question: 'How do I increase average view duration?',
        answer: 'Hook viewers in the first 30 seconds, use pattern interrupts every 30-60 seconds, promise and deliver value throughout, avoid long intros, and use chapters to help viewers navigate. End screens can also extend watch time.',
      },
      {
        question: 'Does average view duration affect recommendations?',
        answer: 'Yes, AVD is crucial for YouTube recommendations. Videos with high AVD signal quality content to the algorithm. YouTube wants to keep viewers on the platform, so it promotes videos that hold attention.',
      },
      {
        question: 'Why is my view duration low on Shorts?',
        answer: 'Shorts AVD works differently - viewers swipe quickly, so even 5-10 seconds can be good for a 30-second Short. Focus on immediate hooks and quick payoffs for Shorts content.',
      },
    ],
  },
  'retention': {
    label: 'Audience Retention Rate',
    badgeLabel: 'Retention',
    explanation: 'Audience Retention measures what percentage of your video viewers watch on average. It\'s one of the most important metrics for YouTube algorithm success.',
    inputs: [
      { key: 'avgDuration', label: 'Avg View Duration (seconds)', placeholder: 'e.g., 180' },
      { key: 'videoLength', label: 'Video Length (seconds)', placeholder: 'e.g., 600' },
    ],
    formula: (v) => (v.avgDuration / v.videoLength) * 100,
    resultLabel: 'Retention',
    resultSuffix: '%',
    goodRange: 'Aim for 40-60% retention. Top videos often achieve 70%+.',
    contentGuide: `## Audience Retention: YouTube's Most Important Algorithm Signal

### What Is Audience Retention?
Audience Retention measures the percentage of your video that viewers watch on average. If your 10-minute video has 50% retention, viewers watch an average of 5 minutes. YouTube Studio provides both absolute retention (percentage) and relative retention (compared to similar videos).

### Why Retention Trumps All Other Metrics
YouTube has stated that watch time and retention are the primary signals for recommendations. High retention tells YouTube: "This content delivers on its promise and keeps people engaged." Videos with strong retention get pushed to more viewers through suggested videos and browse features.

### 2025 Retention Benchmarks

**Exceptional (60-80%+):**
- Short, highly focused tutorials
- Compelling storytelling
- Viral entertainment

**Good (40-60%):**
- Standard YouTube content
- Educational videos
- Reviews and commentary

**Below Average (20-40%):**
- Overly long content
- Mismatched expectations
- Poor pacing

### Reading Your Retention Graph

**The First 30-Second Drop:**
Nearly all videos see a significant drop in the first 30 seconds. This is normal. The goal is to minimize this drop with a strong hook.

**Mid-Video Valleys:**
Identify specific timestamps where viewers leave. These reveal pacing issues, boring sections, or unmet expectations.

**End Retention:**
If retention increases near the end, viewers may be seeking a specific answer. Consider restructuring content.

### The Retention-CTR Connection
High CTR with low retention signals clickbait—YouTube will reduce impressions. High CTR with high retention signals quality content worth promoting. The combination matters more than either metric alone.

### Strategies for Better Retention

**Structure:** Promise early, deliver throughout, payoff at the end.
**Pacing:** Change visuals/energy every 30-60 seconds.
**Editing:** Cut ruthlessly. Every second must earn its place.
**Hooks:** Start with the most compelling part of your content.
**Chapters:** Help viewers navigate to what they need.`,
    faqs: [
      {
        question: 'What is a good retention rate on YouTube?',
        answer: '40-60% retention is considered good for most content. Educational videos might see 30-50%, while highly engaging entertainment can reach 60-80%. The key is improving relative to your own past performance.',
      },
      {
        question: 'How does retention affect my videos?',
        answer: 'Retention is the #1 signal YouTube uses for recommendations. High retention = more suggested video placements = more views. A video with 50% retention will typically outperform one with 30% retention.',
      },
      {
        question: 'What causes retention drops?',
        answer: 'Common causes: long intros, unfulfilled promises, pacing issues, off-topic tangents, low energy sections, and natural stopping points. Use YouTube Analytics retention graph to identify exactly where viewers leave.',
      },
      {
        question: 'Is 50% retention good for YouTube Shorts?',
        answer: 'For Shorts, retention works differently since videos are so short. Aim for 80%+ retention on Shorts - viewers who watch to the end are more likely to engage and see your content again.',
      },
    ],
  },
  'clicks-per-impression': {
    label: 'Clicks per Impression Ratio',
    badgeLabel: 'CPI',
    explanation: 'Clicks per Impression shows the raw ratio of how many viewers clicked after seeing your video. This helps analyze thumbnail performance.',
    inputs: [
      { key: 'clicks', label: 'Total Clicks', placeholder: 'e.g., 1500' },
      { key: 'impressions', label: 'Total Impressions', placeholder: 'e.g., 50000' },
    ],
    formula: (v) => v.clicks / v.impressions,
    resultLabel: 'Ratio',
    resultSuffix: '',
    goodRange: 'A ratio of 0.04-0.10 (4-10%) is typical. Higher is better.',
    contentGuide: `## Clicks Per Impression: Raw Performance Data for Your Thumbnails

### Understanding Clicks vs Impressions
Every time YouTube shows your thumbnail to a potential viewer, that's an impression. When someone clicks on your video, that's a click. The ratio between these two numbers reveals how effective your thumbnail and title combination is at converting browsers into viewers.

### Why Track Raw Ratios?
While CTR (percentage) is the standard metric, tracking raw click-to-impression ratios helps you understand absolute performance. A 0.05 ratio means 1 in 20 people who see your thumbnail click on it. This framing can help you visualize real human behavior.

### Where Impressions Come From

**Home/Browse (40-60% of impressions):**
YouTube's algorithm decides to show your video on the homepage or browse features. This audience is often unfamiliar with your content.

**Suggested Videos (20-40%):**
Your video appears next to related content. These viewers are primed for your topic but may not know you.

**Search (5-20%):**
Viewers actively searching for your keywords. High intent, but competitive placement.

**Subscriptions/Notifications (5-15%):**
Your existing audience. Usually highest conversion rate.

### Analyzing Your Ratio by Source
Different traffic sources have different expected ratios. Subscriber impressions should convert at 2-3x the rate of browse impressions. If your subscription ratio is low, your core audience may be losing interest.

### The Impression Threshold Effect
YouTube tests your content with small impression batches first. If early click ratios are strong, you get more impressions. If weak, the test stops. First-hour performance often determines a video's trajectory.

### Improving Your Ratio

**Thumbnail Clarity:**
Can viewers understand what your video is about in 0.5 seconds? If not, simplify.

**Title Synergy:**
Title and thumbnail should work together but not repeat information. Each should add context the other doesn't provide.

**Niche Targeting:**
The more specific your audience targeting, the higher your ratio potential. Broad content gets lower ratios because it's shown to less relevant viewers.

### When Low Ratios Are Acceptable
Viral content often has lower ratios because YouTube shows it to massive audiences. A 2% ratio with 10 million impressions dramatically outperforms a 15% ratio with 10,000 impressions.`,
    faqs: [
      {
        question: 'How is clicks per impression different from CTR?',
        answer: 'They measure the same thing but are expressed differently. CTR is a percentage (e.g., 5%), while clicks per impression is a decimal ratio (e.g., 0.05). Both help you understand thumbnail and title performance.',
      },
      {
        question: 'Why track impressions separately from views?',
        answer: 'Impressions show how often YouTube displayed your thumbnail. Views only count actual watches. The gap between them reveals your thumbnail\'s effectiveness at converting browsers into viewers.',
      },
      {
        question: 'What counts as an impression on YouTube?',
        answer: 'An impression is counted when your thumbnail is shown for at least 1 second and at least 50% visible. This includes home page, search results, suggested videos, and subscriptions feed.',
      },
      {
        question: 'Can I have too many impressions?',
        answer: 'More impressions are generally good, but if clicks don\'t follow, your CTR drops. YouTube may reduce impressions if low CTR signals your content isn\'t resonating with the audience it\'s being shown to.',
      },
    ],
  },
};

const CONTENT_TYPE_LABELS: Record<string, string> = {
  'longform': 'Long-Form',
  'shorts': 'Shorts',
};

function getMetricFromPreset(preset: string | undefined): string {
  if (!preset) return 'ctr';
  const parts = preset.split('-');
  if (parts.length > 0 && ['ctr', 'cpm', 'rpm', 'watchtime', 'avgviews', 'impressions'].includes(parts[parts.length - 1])) {
    return parts[parts.length - 1];
  }
  return 'ctr';
}

function FAQItem({ faq, isOpen, onToggle }: { faq: FAQ; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border-b border-gray-200 last:border-0">
      <button
        onClick={onToggle}
        className="w-full py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors px-1"
      >
        <span className="font-medium text-gray-900 pr-4">{faq.question}</span>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
        )}
      </button>
      {isOpen && (
        <div className="pb-4 px-1 text-gray-600 text-sm leading-relaxed">
          {faq.answer}
        </div>
      )}
    </div>
  );
}

function FAQSection({ faqs, metric }: { faqs: FAQ[]; metric: string }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="mt-10">
      <h2 className="text-xl font-bold text-gray-900 mb-4">
        Frequently Asked Questions
      </h2>
      <div className="bg-white rounded-xl border p-4">
        {faqs.map((faq, index) => (
          <FAQItem
            key={index}
            faq={faq}
            isOpen={openIndex === index}
            onToggle={() => setOpenIndex(openIndex === index ? null : index)}
          />
        ))}
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: faqs.map((faq) => ({
              '@type': 'Question',
              name: faq.question,
              acceptedAnswer: {
                '@type': 'Answer',
                text: faq.answer,
              },
            })),
          }),
        }}
      />
    </section>
  );
}

function ContentGuide({ content }: { content: string }) {
  const renderMarkdown = (text: string) => {
    const lines = text.trim().split('\n');
    const elements: React.ReactNode[] = [];
    let currentList: string[] = [];
    let inBoldSection = false;
    let boldSectionTitle = '';
    let boldSectionItems: string[] = [];

    const flushList = () => {
      if (currentList.length > 0) {
        elements.push(
          <ul key={`list-${elements.length}`} className="space-y-1 mb-4 ml-4">
            {currentList.map((item, i) => (
              <li key={i} className="text-gray-600 text-sm flex items-start gap-2">
                <span className="text-orange-500 mt-0.5">•</span>
                <span dangerouslySetInnerHTML={{ __html: formatBold(item) }} />
              </li>
            ))}
          </ul>
        );
        currentList = [];
      }
    };

    const flushBoldSection = () => {
      if (boldSectionTitle && boldSectionItems.length > 0) {
        elements.push(
          <div key={`bold-section-${elements.length}`} className="mb-4">
            <p className="font-semibold text-gray-800 mb-2">{boldSectionTitle}</p>
            <ul className="space-y-1 ml-4">
              {boldSectionItems.map((item, i) => (
                <li key={i} className="text-gray-600 text-sm flex items-start gap-2">
                  <span className="text-orange-500 mt-0.5">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        );
        boldSectionTitle = '';
        boldSectionItems = [];
        inBoldSection = false;
      }
    };

    const formatBold = (text: string) => {
      return text.replace(/\*\*([^*]+)\*\*/g, '<strong class="text-gray-800">$1</strong>');
    };

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      if (trimmedLine.startsWith('## ')) {
        flushList();
        flushBoldSection();
        elements.push(
          <h2 key={`h2-${index}`} className="text-xl font-bold text-gray-900 mb-4 mt-6 first:mt-0">
            {trimmedLine.replace('## ', '')}
          </h2>
        );
      } else if (trimmedLine.startsWith('### ')) {
        flushList();
        flushBoldSection();
        elements.push(
          <h3 key={`h3-${index}`} className="text-lg font-semibold text-gray-800 mb-3 mt-5">
            {trimmedLine.replace('### ', '')}
          </h3>
        );
      } else if (trimmedLine.match(/^\*\*[^*]+:\*\*$/)) {
        flushList();
        flushBoldSection();
        boldSectionTitle = trimmedLine.replace(/\*\*/g, '');
        inBoldSection = true;
      } else if (trimmedLine.startsWith('- ') && inBoldSection) {
        boldSectionItems.push(trimmedLine.replace('- ', ''));
      } else if (trimmedLine.startsWith('- ')) {
        flushBoldSection();
        currentList.push(trimmedLine.replace('- ', ''));
      } else if (trimmedLine === '') {
        flushList();
        if (!inBoldSection) flushBoldSection();
      } else {
        flushList();
        flushBoldSection();
        elements.push(
          <p 
            key={`p-${index}`} 
            className="text-gray-600 text-sm leading-relaxed mb-3"
            dangerouslySetInnerHTML={{ __html: formatBold(trimmedLine) }}
          />
        );
      }
    });

    flushList();
    flushBoldSection();
    return elements;
  };

  return (
    <section className="mt-10 bg-white rounded-xl border p-6 md:p-8">
      <div className="prose prose-sm max-w-none">
        {renderMarkdown(content)}
      </div>
    </section>
  );
}

function RelatedCalculators({ cluster, currentSlug }: { cluster: string; currentSlug: string }) {
  const siblingTools = [
    { slug: 'youtube-ctr-longform-calculator', name: 'CTR Calculator (Longform)' },
    { slug: 'youtube-ctr-shorts-calculator', name: 'CTR Calculator (Shorts)' },
    { slug: 'youtube-cpm-longform-calculator', name: 'CPM Calculator (Longform)' },
    { slug: 'youtube-cpm-shorts-calculator', name: 'CPM Calculator (Shorts)' },
    { slug: 'youtube-retention-longform-calculator', name: 'Retention Calculator (Longform)' },
    { slug: 'youtube-retention-shorts-calculator', name: 'Retention Calculator (Shorts)' },
    { slug: 'youtube-avg-view-duration-longform-calculator', name: 'Avg View Duration (Longform)' },
    { slug: 'youtube-avg-view-duration-shorts-calculator', name: 'Avg View Duration (Shorts)' },
    { slug: 'youtube-clicks-per-impression-longform-calculator', name: 'Clicks/Impression (Longform)' },
    { slug: 'youtube-clicks-per-impression-shorts-calculator', name: 'Clicks/Impression (Shorts)' },
  ].filter((t) => t.slug !== currentSlug);

  return (
    <section className="mt-10">
      <h2 className="text-xl font-bold text-gray-900 mb-4">
        Other YouTube Metric Calculators
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {siblingTools.slice(0, 6).map((tool) => (
          <Link
            key={tool.slug}
            href={`/tools/${tool.slug}`}
            className="p-3 bg-white border rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors text-sm font-medium text-gray-700 hover:text-orange-700"
          >
            {tool.name}
          </Link>
        ))}
      </div>
      <div className="mt-4 text-center">
        <Link
          href={`/tools/clusters/${cluster}`}
          className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium text-sm"
        >
          View all {cluster.replace(/-/g, ' ')} tools
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}

function RelatedArticles({ cluster }: { cluster: string }) {
  const articles = [
    { slug: 'what-is-a-good-youtube-ctr', title: 'What Is a Good YouTube CTR?' },
    { slug: 'how-to-improve-youtube-retention', title: 'How to Improve YouTube Retention' },
    { slug: 'youtube-cpm-rates-explained', title: 'YouTube CPM Rates Explained' },
  ];

  return (
    <section className="mt-10">
      <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <BookOpen className="w-5 h-5 text-orange-500" />
        Related Articles
      </h2>
      <div className="space-y-3">
        {articles.map((article) => (
          <Link
            key={article.slug}
            href={`/tools/clusters/${cluster}/${article.slug}`}
            className="block p-4 bg-white border rounded-lg hover:border-orange-300 hover:shadow-sm transition-all group"
          >
            <span className="font-medium text-gray-800 group-hover:text-orange-700">
              {article.title}
            </span>
            <span className="block text-xs text-gray-400 mt-1">Read article →</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function PostResultUpsell() {
  return (
    <div className="mt-10 p-6 bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 border border-orange-200 rounded-2xl">
      <div className="flex items-center gap-2 mb-4">
        <Flame className="w-5 h-5 text-orange-500" />
        <h3 className="text-lg font-bold text-gray-900">Turn These Numbers Into Growth</h3>
      </div>
      <p className="text-gray-600 text-sm mb-4">
        Understanding your metrics is step one. Now take action with tools designed to boost your performance.
      </p>
      
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white/80 backdrop-blur rounded-xl p-4 border border-orange-100">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Nudge</h4>
              <p className="text-sm text-gray-600 mt-1">
                Boost CTR and retention with smart overlays that guide viewers.
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white/80 backdrop-blur rounded-xl p-4 border border-orange-100">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <QrCode className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">QR Social</h4>
              <p className="text-sm text-gray-600 mt-1">
                Convert viewers into followers with one scannable link.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/products/nudge"
          className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium rounded-xl transition-all group shadow-md hover:shadow-lg"
        >
          Try Nudge
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </Link>
        <Link
          href="/products/qrsocial"
          className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-medium rounded-xl transition-all group shadow-md hover:shadow-lg"
        >
          Get QR Social
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
}

function ToolSchema({ tool, preset }: { tool: ToolForRenderer; preset: MetricPreset }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: tool.name,
    description: tool.description || preset.explanation,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    publisher: {
      '@type': 'Organization',
      name: 'VCM Suite',
      url: 'https://vcmsuite.com',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export default function CalculatorEngine({ tool }: CalculatorEngineProps) {
  const metric = getMetricFromPreset(tool.preset);
  const preset = YOUTUBE_METRIC_PRESETS[metric] || YOUTUBE_METRIC_PRESETS['ctr'];
  
  const [values, setValues] = useState<Record<string, string>>({});
  const [result, setResult] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setResult(null);
    setError(null);
  };

  const calculate = () => {
    const numericValues: Record<string, number> = {};
    
    for (const input of preset.inputs) {
      const val = parseFloat(values[input.key] || '0');
      if (isNaN(val) || val < 0) {
        setError(`Please enter a valid number for ${input.label}`);
        return;
      }
      numericValues[input.key] = val;
    }

    const divisorKey = preset.inputs[1]?.key;
    if (divisorKey && numericValues[divisorKey] === 0) {
      setError(`${preset.inputs[1].label} cannot be zero`);
      return;
    }

    try {
      const calcResult = preset.formula(numericValues);
      setResult(Math.round(calcResult * 100) / 100);
      setError(null);
    } catch {
      setError('Calculation error. Please check your inputs.');
    }
  };

  const reset = () => {
    setValues({});
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <ToolSchema tool={tool} preset={preset} />
      
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link
          href="/tools"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-orange-600 mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Tools
        </Link>

        <article>
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-8 text-white">
              <div className="flex items-center gap-3 mb-3">
                <Calculator className="w-8 h-8" />
                <span className="px-2 py-0.5 bg-white/20 rounded text-sm font-medium">
                  {preset.badgeLabel}
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold">{tool.name}</h1>
              {tool.description && (
                <p className="mt-2 text-orange-100 text-lg">{tool.description}</p>
              )}
            </div>

            <div className="p-6">
              <div className="flex items-start gap-2 p-4 bg-blue-50 rounded-lg mb-6">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-800">{preset.explanation}</p>
                  {preset.goodRange && (
                    <p className="text-xs text-blue-600 mt-2 font-medium">{preset.goodRange}</p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                {preset.inputs.map((input) => (
                  <div key={input.key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {input.label}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        placeholder={input.placeholder}
                        value={values[input.key] || ''}
                        onChange={(e) => handleInputChange(input.key, e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      />
                      {input.suffix && (
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                          {input.suffix}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {error && (
                <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  onClick={calculate}
                  className="flex-1 px-6 py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Calculate {preset.resultLabel}
                </button>
                <button
                  onClick={reset}
                  className="px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  title="Reset"
                >
                  <RefreshCw className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {result !== null && (
                <div className="mt-6 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                  <div className="text-sm text-green-700 mb-1">{preset.resultLabel}</div>
                  <div className="text-4xl font-bold text-green-800">
                    {result.toLocaleString()}{preset.resultSuffix}
                  </div>
                  {preset.goodRange && (
                    <div className="text-xs text-green-600 mt-2">{preset.goodRange}</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {tool.interlinkParent && (
            <div className="mt-6 p-4 bg-white rounded-lg border text-center">
              <p className="text-sm text-gray-600">
                This tool is part of the{' '}
                <Link
                  href={`/tools/clusters/${tool.interlinkParent}`}
                  className="text-orange-600 hover:text-orange-700 font-medium"
                >
                  {tool.interlinkParent.replace(/-/g, ' ')}
                </Link>{' '}
                topic cluster.
              </p>
            </div>
          )}

          <ContentGuide content={preset.contentGuide} />

          <PostResultUpsell />

          <FAQSection faqs={preset.faqs} metric={metric} />

          {tool.interlinkParent && (
            <>
              <RelatedCalculators cluster={tool.interlinkParent} currentSlug={tool.slug} />
              <RelatedArticles cluster={tool.interlinkParent} />
            </>
          )}
        </article>
      </div>
    </div>
  );
}
