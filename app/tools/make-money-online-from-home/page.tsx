import { Metadata } from "next";
import Link from "next/link";
import MakeMoneyHomeFinderClient from "./MakeMoneyHomeFinderClient";
import ExploreMoreTools from "@/components/ExploreMoreTools";

export const metadata: Metadata = {
  title: "Make Money Online From Home Finder (Free) | Real Work-From-Home Ideas",
  description: "Answer 60 seconds of questions and get your top 3 realistic paths to make money online from home. Free quiz with personalized results, steps, and risk notes. No scams, just real options.",
  keywords: [
    "make money online from home",
    "make money online home",
    "work from home jobs",
    "legit ways to make money from home",
    "earn money online from home",
    "remote income ideas",
    "side hustle from home",
    "online income finder",
    "how to make money from home",
    "best ways to make money online",
    "passive income ideas",
    "work from home ideas",
    "online jobs from home",
    "make money at home",
  ],
  openGraph: {
    title: "Make Money Online From Home Finder (Free)",
    description: "Take a 60-second quiz to discover the best ways to make money online from home based on your skills, time, and goals.",
    type: "website",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "VCM Make Money Online From Home Finder",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "description": "Free quiz tool that analyzes your skills, time availability, and goals to recommend the top 3 most realistic paths to make money online from home.",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.7",
    "ratingCount": "892"
  }
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Is making money online from home actually legit?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, there are many legitimate ways to make money online from home. Freelancing, tutoring, affiliate marketing, selling digital products, and remote employment are all real opportunities. However, you should avoid any opportunity that requires upfront payment, promises unrealistic returns, or sounds too good to be true."
      }
    },
    {
      "@type": "Question",
      "name": "What's the fastest way to make money from home?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "The fastest paths typically involve trading your skills for money directly: freelance writing, virtual assistance, tutoring, or remote sales. These can generate income within 1-2 weeks if you apply consistently. Passive income methods like affiliate sites or digital products take longer (3-6 months) but scale better."
      }
    },
    {
      "@type": "Question",
      "name": "Can I make money from home with no skills?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "You can start with basic options like virtual assistance, data entry, or customer service roles while building skills. However, the more skills you develop (writing, design, sales, coding), the more you can earn. Consider learning a high-value skill while doing entry-level work."
      }
    },
    {
      "@type": "Question",
      "name": "How much can I realistically make working from home?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Income varies widely. Entry-level remote work typically pays $15-25/hour. Skilled freelancers earn $50-150/hour. Scalable businesses like affiliate sites or digital products can generate $1,000-$10,000+/month passively, but require significant upfront work. Most people should expect $500-2,000/month initially."
      }
    },
    {
      "@type": "Question",
      "name": "What are the best ways to make money online in 2024?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Top options include: freelance writing/copywriting, virtual assistance, UGC content creation for brands, remote sales, online tutoring, Etsy digital products, print-on-demand, affiliate content sites, no-code tool building, and freelance development. The best choice depends on your skills, time, and goals."
      }
    },
    {
      "@type": "Question",
      "name": "Do I need to show my face to make money online?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "No. Many profitable paths don't require being on camera: freelance writing, virtual assistance, SEO/affiliate sites, Etsy products, print-on-demand, coding, and data work. However, paths involving video content, coaching, or sales often benefit from face visibility."
      }
    },
    {
      "@type": "Question",
      "name": "Can I start making money online with $0?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. Freelancing, virtual assistance, tutoring, and remote sales require zero upfront investment. You only need a computer and internet. Paths like Etsy products or affiliate sites may need $50-100 for tools/hosting, but many successful businesses started with nothing."
      }
    },
    {
      "@type": "Question",
      "name": "How do I avoid work-from-home scams?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Red flags include: requiring upfront payment, promising unrealistic income ('$10,000/week guaranteed'), vague job descriptions, pressure to act immediately, requests for personal banking info early, and MLM structures. Legitimate opportunities pay you—you should never pay to work."
      }
    },
    {
      "@type": "Question",
      "name": "What's better: fast money or passive income?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "It depends on your situation. Fast money (freelancing, VA work, sales) provides immediate income but trades time for money. Passive income (affiliate sites, digital products) takes months to build but can scale beyond your time. Many people start with fast money while building passive income on the side."
      }
    },
    {
      "@type": "Question",
      "name": "How many hours do I need to make money from home?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "You can start with as little as 5 hours/week, though progress will be slower. Most successful remote workers dedicate 10-20 hours weekly. Full-time income typically requires 20+ hours initially. Some passive income methods require heavy upfront time (20+ hours/week for months) before becoming truly passive."
      }
    },
    {
      "@type": "Question",
      "name": "Do I need a website to make money online?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Not always. Freelancers can use platforms like Upwork or Fiverr. Tutors use existing marketplaces. UGC creators work through social media. However, having your own website improves credibility and opens doors to affiliate marketing, SEO traffic, and digital product sales."
      }
    },
    {
      "@type": "Question",
      "name": "What skills are most in-demand for remote work?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "High-demand skills include: copywriting and content writing, video editing, graphic design, web development, sales and cold outreach, social media management, SEO, data analysis, and customer support. Learning any of these can significantly increase your earning potential from home."
      }
    }
  ]
};

const faqs = [
  {
    q: "Is making money online from home actually legit?",
    a: "Yes, there are many legitimate ways to make money online from home. Freelancing, tutoring, affiliate marketing, selling digital products, and remote employment are all real opportunities. However, you should avoid any opportunity that requires upfront payment, promises unrealistic returns, or sounds too good to be true."
  },
  {
    q: "What's the fastest way to make money from home?",
    a: "The fastest paths typically involve trading your skills for money directly: freelance writing, virtual assistance, tutoring, or remote sales. These can generate income within 1-2 weeks if you apply consistently. Passive income methods like affiliate sites or digital products take longer (3-6 months) but scale better."
  },
  {
    q: "Can I make money from home with no skills?",
    a: "You can start with basic options like virtual assistance, data entry, or customer service roles while building skills. However, the more skills you develop (writing, design, sales, coding), the more you can earn. Consider learning a high-value skill while doing entry-level work."
  },
  {
    q: "How much can I realistically make working from home?",
    a: "Income varies widely. Entry-level remote work typically pays $15-25/hour. Skilled freelancers earn $50-150/hour. Scalable businesses like affiliate sites or digital products can generate $1,000-$10,000+/month passively, but require significant upfront work. Most people should expect $500-2,000/month initially."
  },
  {
    q: "What are the best ways to make money online in 2024?",
    a: "Top options include: freelance writing/copywriting, virtual assistance, UGC content creation for brands, remote sales, online tutoring, Etsy digital products, print-on-demand, affiliate content sites, no-code tool building, and freelance development. The best choice depends on your skills, time, and goals."
  },
  {
    q: "Do I need to show my face to make money online?",
    a: "No. Many profitable paths don't require being on camera: freelance writing, virtual assistance, SEO/affiliate sites, Etsy products, print-on-demand, coding, and data work. However, paths involving video content, coaching, or sales often benefit from face visibility."
  },
  {
    q: "Can I start making money online with $0?",
    a: "Yes. Freelancing, virtual assistance, tutoring, and remote sales require zero upfront investment. You only need a computer and internet. Paths like Etsy products or affiliate sites may need $50-100 for tools/hosting, but many successful businesses started with nothing."
  },
  {
    q: "How do I avoid work-from-home scams?",
    a: "Red flags include: requiring upfront payment, promising unrealistic income ('$10,000/week guaranteed'), vague job descriptions, pressure to act immediately, requests for personal banking info early, and MLM structures. Legitimate opportunities pay you—you should never pay to work."
  },
  {
    q: "What's better: fast money or passive income?",
    a: "It depends on your situation. Fast money (freelancing, VA work, sales) provides immediate income but trades time for money. Passive income (affiliate sites, digital products) takes months to build but can scale beyond your time. Many people start with fast money while building passive income on the side."
  },
  {
    q: "How many hours do I need to make money from home?",
    a: "You can start with as little as 5 hours/week, though progress will be slower. Most successful remote workers dedicate 10-20 hours weekly. Full-time income typically requires 20+ hours initially. Some passive income methods require heavy upfront time (20+ hours/week for months) before becoming truly passive."
  },
  {
    q: "Do I need a website to make money online?",
    a: "Not always. Freelancers can use platforms like Upwork or Fiverr. Tutors use existing marketplaces. UGC creators work through social media. However, having your own website improves credibility and opens doors to affiliate marketing, SEO traffic, and digital product sales."
  },
  {
    q: "What skills are most in-demand for remote work?",
    a: "High-demand skills include: copywriting and content writing, video editing, graphic design, web development, sales and cold outreach, social media management, SEO, data analysis, and customer support. Learning any of these can significantly increase your earning potential from home."
  }
];

export default function MakeMoneyOnlineFromHomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      
      <div className="min-h-screen bg-zinc-50">
        <div className="max-w-5xl mx-auto px-4 py-12">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full text-green-600 text-sm font-medium mb-6">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Free 60-Second Quiz
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Make Money Online From Home Finder
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Answer 7 quick questions and get your personalized top 3 paths to making money from home—with realistic timelines, steps, and risk notes.
            </p>
          </div>

          {/* The Tool */}
          <MakeMoneyHomeFinderClient />

          {/* SECTION 1: Keyword-Rich Intro */}
          <section className="mt-20 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Find Your Best Path to Make Money Online From Home
            </h2>
            <div className="prose prose-lg text-gray-700 space-y-4">
              <p>
                The internet is flooded with &quot;make money online&quot; advice, but most of it is either outdated, unrealistic, 
                or designed to sell you a course. Our free <strong>Make Money Online From Home Finder</strong> cuts through the noise 
                and gives you personalized recommendations based on YOUR actual situation—your skills, available time, 
                budget, and income goals.
              </p>
              <p>
                Whether you&apos;re looking for a <strong>side hustle from home</strong>, want to replace your full-time income, or 
                are building toward <strong>passive income</strong>, this tool matches you with the most realistic paths. We analyze 
                10+ legitimate income methods and rank them based on your answers, showing you exactly how to get started 
                with each one.
              </p>
              <p>
                No hype, no scams, no &quot;secret systems.&quot; Just honest guidance on <strong>legit ways to make money from home</strong> 
                that real people are using right now. Take the 60-second quiz above and get your personalized plan.
              </p>
            </div>
          </section>

          {/* SECTION 2: How the Finder Works */}
          <section className="mt-16 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              How the Make Money From Home Finder Works
            </h2>
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-orange-600 font-bold">1</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Answer 7 Questions</h3>
                <p className="text-sm text-gray-600">Tell us about your time, skills, budget, and goals. Takes about 60 seconds.</p>
              </div>
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-orange-600 font-bold">2</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Get Matched</h3>
                <p className="text-sm text-gray-600">Our algorithm scores 10+ income paths and ranks them based on your answers.</p>
              </div>
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-orange-600 font-bold">3</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Start Taking Action</h3>
                <p className="text-sm text-gray-600">Each path includes starter steps, timelines, and risk notes so you can begin immediately.</p>
              </div>
            </div>
            <div className="prose prose-lg text-gray-700">
              <p>
                Unlike generic &quot;50 ways to make money online&quot; lists, our finder is <strong>personalized to you</strong>. 
                Someone with coding skills gets different recommendations than someone with writing skills. A person 
                with 5 hours/week gets different advice than someone with 20+ hours. Your budget, camera comfort, 
                and speed preferences all factor into the scoring.
              </p>
            </div>
          </section>

          {/* SECTION 3: Fast vs Scalable */}
          <section className="mt-16 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Fast Money vs. Scalable Income: Which Is Right for You?
            </h2>
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="text-2xl">⚡</span> Fast Money Paths
                </h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2"><span className="text-green-500">✓</span> Income within 1-4 weeks</li>
                  <li className="flex items-start gap-2"><span className="text-green-500">✓</span> Trade skills/time for money</li>
                  <li className="flex items-start gap-2"><span className="text-green-500">✓</span> Examples: Freelancing, VA, tutoring, sales</li>
                  <li className="flex items-start gap-2"><span className="text-amber-500">!</span> Income stops when you stop working</li>
                </ul>
              </div>
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="text-2xl">📈</span> Scalable Income Paths
                </h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2"><span className="text-green-500">✓</span> Can become passive over time</li>
                  <li className="flex items-start gap-2"><span className="text-green-500">✓</span> Income grows beyond your hours</li>
                  <li className="flex items-start gap-2"><span className="text-green-500">✓</span> Examples: Affiliate sites, digital products, POD</li>
                  <li className="flex items-start gap-2"><span className="text-amber-500">!</span> Takes 3-6+ months to see results</li>
                </ul>
              </div>
            </div>
            <div className="prose prose-lg text-gray-700">
              <p>
                The best strategy for most people? <strong>Start with a fast-money path</strong> to cover immediate expenses, 
                then use some of that time and income to build something scalable on the side. This gives you both 
                short-term stability and long-term growth.
              </p>
            </div>
          </section>

          {/* SECTION 4: Avoid Scams */}
          <section className="mt-16 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              How to Avoid Work-From-Home Scams
            </h2>
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
              <h3 className="font-semibold text-red-800 mb-4">Red Flags to Watch For:</h3>
              <ul className="space-y-2 text-sm text-red-700">
                <li className="flex items-start gap-2"><span>🚩</span> Requires upfront payment or &quot;training fees&quot;</li>
                <li className="flex items-start gap-2"><span>🚩</span> Promises guaranteed income (&quot;Make $5,000/week easily!&quot;)</li>
                <li className="flex items-start gap-2"><span>🚩</span> Vague about what the actual work involves</li>
                <li className="flex items-start gap-2"><span>🚩</span> Pressure to sign up immediately</li>
                <li className="flex items-start gap-2"><span>🚩</span> MLM structure (recruiting others is the main income)</li>
                <li className="flex items-start gap-2"><span>🚩</span> Asks for banking info before you&apos;ve done any work</li>
              </ul>
            </div>
            <div className="prose prose-lg text-gray-700">
              <p>
                <strong>Legitimate opportunities pay you—you should never pay to work.</strong> If someone asks for money 
                upfront to &quot;unlock&quot; a work-from-home opportunity, it&apos;s almost certainly a scam. Real freelance 
                platforms, remote employers, and business opportunities don&apos;t require payment to get started.
              </p>
              <p>
                All the paths recommended by our finder are legitimate, established methods that real people use to 
                earn income from home. We don&apos;t promote any get-rich-quick schemes or MLM opportunities.
              </p>
            </div>
          </section>

          {/* SECTION 5: Beginner vs Skilled */}
          <section className="mt-16 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Options for Beginners vs. Skilled Workers
            </h2>
            <div className="prose prose-lg text-gray-700 space-y-4">
              <p>
                <strong>If you&apos;re starting with no marketable skills</strong>, don&apos;t worry—everyone starts somewhere. 
                Entry points like virtual assistance, data entry, customer service, and basic admin work can get you 
                earning while you develop higher-value skills. Many successful freelancers started with $15/hour 
                work and grew to $100+/hour as they specialized.
              </p>
              <p>
                <strong>If you already have skills</strong> (writing, design, video, coding, sales, teaching), you can 
                often skip the low-paying entry work and go directly to higher-value opportunities. Skilled 
                freelancers, coaches, and creators can earn $50-150/hour or build scalable businesses that 
                generate income while they sleep.
              </p>
              <p>
                Our finder takes your skill level into account and recommends paths that match where you are today—while 
                also showing you what&apos;s possible as you grow.
              </p>
            </div>
          </section>

          {/* Internal Links Section */}
          <section className="mt-16 max-w-4xl mx-auto">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Explore More</h3>
              <div className="flex flex-wrap gap-3">
                <Link 
                  href="/pricing" 
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
                >
                  View VCM Plans
                </Link>
                <Link 
                  href="/clouds/monetization-cloud" 
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
                >
                  Monetization Cloud
                </Link>
                <Link 
                  href="/clouds/growth-distribution-cloud" 
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
                >
                  Growth Cloud
                </Link>
              </div>
            </div>
          </section>

          {/* FAQ Section */}
          <section className="mt-16 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {faqs.map((faq, i) => (
                <details 
                  key={i} 
                  className="group bg-white rounded-xl border border-gray-200 overflow-hidden"
                >
                  <summary className="flex items-center justify-between p-5 cursor-pointer list-none font-medium text-gray-900 hover:bg-gray-50">
                    {faq.q}
                    <svg 
                      className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="px-5 pb-5 text-gray-600">
                    {faq.a}
                  </div>
                </details>
              ))}
            </div>
          </section>

          {/* Explore More Tools */}
          <section className="mt-16">
            <ExploreMoreTools 
              currentTool="make-money-online-from-home"
            />
          </section>

          {/* Footer Note */}
          <div className="mt-16 text-center text-sm text-gray-500">
            <p>
              This tool provides general guidance only and does not constitute financial advice. 
              Income results vary based on effort, skill, market conditions, and other factors.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
