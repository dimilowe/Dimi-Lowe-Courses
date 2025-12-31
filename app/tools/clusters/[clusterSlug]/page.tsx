import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Wrench, BookOpen, List, Table } from "lucide-react";
import { notFound } from "next/navigation";
import { CLUSTER_REGISTRY, getClusterById } from "@/data/clusterRegistry";
import { CATEGORY_INFO } from "@/data/toolsRegistry";
import { getToolsForCluster } from "@/lib/tools/getToolsForDirectory";

interface PageProps {
  params: Promise<{ clusterSlug: string }>;
}

interface ReferenceRow {
  platform: string;
  size: string;
  aspectRatio: string;
  use?: string;
}

interface ClusterReferenceData {
  tableTitle: string;
  columns: string[];
  rows: ReferenceRow[];
  faqs: { question: string; answer: string }[];
  howTo?: { name: string; steps: string[] };
}

const CLUSTER_REFERENCE_DATA: Record<string, ClusterReferenceData> = {
  "social-media-image-sizes": {
    tableTitle: "Social Media Image Size Quick Reference",
    columns: ["Platform", "Ideal Size", "Aspect Ratio", "Use"],
    rows: [
      { platform: "Instagram Post", size: "1080×1080", aspectRatio: "1:1", use: "Feed posts" },
      { platform: "Instagram Story", size: "1080×1920", aspectRatio: "9:16", use: "Stories & Reels" },
      { platform: "TikTok Cover", size: "1080×1920", aspectRatio: "9:16", use: "Video thumbnails" },
      { platform: "YouTube Thumbnail", size: "1280×720", aspectRatio: "16:9", use: "Video thumbnails" },
      { platform: "Twitter/X Header", size: "1500×500", aspectRatio: "3:1", use: "Profile banner" },
      { platform: "LinkedIn Banner", size: "1584×396", aspectRatio: "4:1", use: "Profile cover" },
      { platform: "Facebook Cover", size: "820×312", aspectRatio: "2.63:1", use: "Page banner" },
      { platform: "Pinterest Pin", size: "1000×1500", aspectRatio: "2:3", use: "Standard pins" },
    ],
    faqs: [
      { question: "What is the best image size for Instagram posts?", answer: "The ideal Instagram post size is 1080×1080 pixels with a 1:1 aspect ratio. This square format displays perfectly in feeds without cropping." },
      { question: "What size should YouTube thumbnails be?", answer: "YouTube thumbnails should be 1280×720 pixels with a 16:9 aspect ratio. The minimum width is 640 pixels, and files should be under 2MB in JPG, GIF, or PNG format." },
      { question: "What are the TikTok video dimensions?", answer: "TikTok videos and covers should be 1080×1920 pixels with a 9:16 vertical aspect ratio. This full-screen format maximizes engagement on mobile devices." },
      { question: "How do I resize images for multiple social platforms?", answer: "Use our free resizing tools to quickly convert any image to the exact dimensions needed for each platform. Upload once, export to multiple sizes." },
    ],
    howTo: {
      name: "How to Resize Images for Social Media",
      steps: [
        "Upload your original image to the resizer tool",
        "Select your target platform (Instagram, YouTube, TikTok, etc.)",
        "Preview the cropped result with the correct dimensions",
        "Download your optimized image ready to post"
      ]
    }
  },
  "health-fitness-calculators": {
    tableTitle: "Calorie Burn Quick Reference",
    columns: ["Activity", "Calories/Hour*", "Intensity", "Use"],
    rows: [
      { platform: "Walking (3 mph)", size: "280-320", aspectRatio: "Low", use: "Daily activity" },
      { platform: "Jogging (5 mph)", size: "480-560", aspectRatio: "Moderate", use: "Cardio workout" },
      { platform: "Running (8 mph)", size: "800-950", aspectRatio: "High", use: "Intense cardio" },
      { platform: "Cycling (12 mph)", size: "400-500", aspectRatio: "Moderate", use: "Low impact" },
      { platform: "Swimming", size: "400-700", aspectRatio: "Moderate-High", use: "Full body" },
      { platform: "HIIT Training", size: "500-800", aspectRatio: "High", use: "Fat burning" },
      { platform: "Weight Training", size: "200-400", aspectRatio: "Moderate", use: "Muscle building" },
      { platform: "Yoga", size: "180-300", aspectRatio: "Low", use: "Flexibility" },
    ],
    faqs: [
      { question: "How many calories should I eat to lose weight?", answer: "To lose weight, you need a calorie deficit of 300-500 calories per day. Use our calorie calculator to find your maintenance calories, then subtract 300-500 for sustainable weight loss of 0.5-1 lb per week." },
      { question: "What is a calorie deficit?", answer: "A calorie deficit occurs when you consume fewer calories than your body burns. This forces your body to use stored fat for energy, resulting in weight loss." },
      { question: "How do I calculate my maintenance calories?", answer: "Your maintenance calories (TDEE) depend on your age, weight, height, gender, and activity level. Our calculator uses the Mifflin-St Jeor equation for accurate results." },
      { question: "How many steps burn 500 calories?", answer: "On average, about 10,000-12,000 steps burn approximately 400-500 calories, depending on your weight, pace, and terrain." },
    ],
    howTo: {
      name: "How to Calculate Your Daily Calorie Needs",
      steps: [
        "Enter your age, weight, height, and gender",
        "Select your activity level (sedentary to very active)",
        "Get your maintenance calories (TDEE)",
        "Subtract 300-500 for weight loss, or add 300-500 for muscle gain"
      ]
    }
  },
  "financial-calculators": {
    tableTitle: "Retirement Savings Milestones",
    columns: ["Age", "Target Savings*", "Monthly Contribution", "Use"],
    rows: [
      { platform: "Age 25", size: "0.5x salary", aspectRatio: "10-15%", use: "Start early" },
      { platform: "Age 30", size: "1x salary", aspectRatio: "15%", use: "Building foundation" },
      { platform: "Age 35", size: "2x salary", aspectRatio: "15-20%", use: "Growth phase" },
      { platform: "Age 40", size: "3x salary", aspectRatio: "20%", use: "Accelerate" },
      { platform: "Age 45", size: "4x salary", aspectRatio: "20-25%", use: "Catch-up time" },
      { platform: "Age 50", size: "5x salary", aspectRatio: "25%+", use: "Max contributions" },
      { platform: "Age 55", size: "7x salary", aspectRatio: "Max", use: "Final push" },
      { platform: "Age 65", size: "10x salary", aspectRatio: "N/A", use: "Retirement ready" },
    ],
    faqs: [
      { question: "How much should I have saved for retirement by age 30?", answer: "A common guideline is to have 1x your annual salary saved by age 30. If you earn $50,000, aim for $50,000 in retirement savings by 30." },
      { question: "What is the 401(k) contribution limit?", answer: "For 2024, the 401(k) contribution limit is $23,000 for those under 50, and $30,500 for those 50 and older (including catch-up contributions)." },
      { question: "How does compound interest work in a 401(k)?", answer: "Compound interest means you earn returns on both your original contributions and previous earnings. Over 30+ years, this can turn modest monthly contributions into substantial wealth." },
      { question: "Should I pay off debt or invest in my 401(k)?", answer: "Generally, contribute enough to get your employer match (free money), then pay off high-interest debt (>7%), then max out retirement accounts." },
    ],
    howTo: {
      name: "How to Calculate Your Retirement Savings Goal",
      steps: [
        "Enter your current age and target retirement age",
        "Input your current savings and expected contributions",
        "Adjust for expected investment returns (typically 6-8%)",
        "See your projected retirement balance and monthly income"
      ]
    }
  },
  "ai-content-tools": {
    tableTitle: "AI Content Analysis Features",
    columns: ["Tool", "What It Analyzes", "Output", "Use"],
    rows: [
      { platform: "Thumbnail Coach", size: "YouTube thumbnails", aspectRatio: "Score + tips", use: "CTR optimization" },
      { platform: "Ad Copy Analyzer", size: "Marketing copy", aspectRatio: "Effectiveness score", use: "Better conversions" },
      { platform: "SEO Audit", size: "Internal links", aspectRatio: "Link map", use: "SEO improvement" },
      { platform: "Reach Grabber", size: "Hook strength", aspectRatio: "Engagement prediction", use: "Viral potential" },
      { platform: "Summarizer", size: "Long-form content", aspectRatio: "Key points", use: "Quick insights" },
      { platform: "AI Humanizer", size: "AI-generated text", aspectRatio: "Natural rewrite", use: "Authenticity" },
    ],
    faqs: [
      { question: "How can AI improve my YouTube thumbnails?", answer: "AI analyzes successful thumbnails for patterns in color contrast, face visibility, text placement, and emotional triggers, then provides specific recommendations to increase click-through rates." },
      { question: "What makes good ad copy?", answer: "Effective ad copy has a strong hook, clear value proposition, social proof, urgency, and a compelling call-to-action. Our analyzer scores each element and suggests improvements." },
      { question: "Why is internal linking important for SEO?", answer: "Internal links help search engines understand your site structure, distribute page authority, and keep users engaged longer—all signals that improve rankings." },
      { question: "Can AI-written content be detected?", answer: "Detection tools look for patterns common in AI text. Our humanizer tool rewrites content to sound more natural while preserving your message." },
    ],
    howTo: {
      name: "How to Analyze Your Content with AI",
      steps: [
        "Choose the type of content you want to analyze",
        "Upload your content (image, text, or URL)",
        "Wait for AI to process and score your content",
        "Review recommendations and implement improvements"
      ]
    }
  },
  "image-tools": {
    tableTitle: "Image Format Comparison",
    columns: ["Format", "Best For", "Compression", "Use"],
    rows: [
      { platform: "JPEG/JPG", size: "Photos", aspectRatio: "Lossy", use: "Web photos, social" },
      { platform: "PNG", size: "Graphics, logos", aspectRatio: "Lossless", use: "Transparency needed" },
      { platform: "WebP", size: "Modern web", aspectRatio: "Both", use: "Fastest loading" },
      { platform: "GIF", size: "Animations", aspectRatio: "Limited colors", use: "Simple animations" },
      { platform: "HEIC", size: "iPhone photos", aspectRatio: "Efficient", use: "Apple devices only" },
      { platform: "SVG", size: "Vector graphics", aspectRatio: "Scalable", use: "Icons, logos" },
    ],
    faqs: [
      { question: "What's the best format for web images?", answer: "WebP offers the best balance of quality and file size for modern browsers. Use JPEG for photos and PNG for graphics with transparency as fallbacks." },
      { question: "How much can I compress an image without losing quality?", answer: "JPEG images can typically be compressed to 60-80% quality with minimal visible loss. Our smart compression finds the optimal balance automatically." },
      { question: "Why won't my HEIC files upload to websites?", answer: "HEIC is an Apple-specific format not widely supported on the web. Convert to JPEG or PNG using our free converter for universal compatibility." },
      { question: "What size should images be for fast website loading?", answer: "Aim for under 200KB per image. Use appropriate dimensions (don't upload 4000px images for 400px displays) and modern compression." },
    ],
    howTo: {
      name: "How to Compress Images Without Quality Loss",
      steps: [
        "Upload your image (supports JPEG, PNG, WebP, GIF)",
        "Choose your compression level or use smart auto-compression",
        "Preview the result and compare file sizes",
        "Download your optimized image"
      ]
    }
  },
  "creator-inspiration": {
    tableTitle: "Daily Motivation Resources",
    columns: ["Resource", "Type", "Frequency", "Use"],
    rows: [
      { platform: "Self-Love Affirmations", size: "Text + audio", aspectRatio: "Daily", use: "Morning routine" },
      { platform: "Daily Horoscope", size: "Personalized", aspectRatio: "Daily", use: "Daily guidance" },
      { platform: "Visualization", size: "Guided", aspectRatio: "As needed", use: "Goal setting" },
      { platform: "Emoji Combos", size: "Creative", aspectRatio: "Instant", use: "Social posts" },
      { platform: "Creator Quotes", size: "Inspirational", aspectRatio: "Daily", use: "Motivation" },
    ],
    faqs: [
      { question: "Do daily affirmations actually work?", answer: "Research shows that positive affirmations can reduce stress, improve problem-solving, and boost self-esteem when practiced consistently. They help rewire negative thought patterns." },
      { question: "How do I start a morning affirmation routine?", answer: "Pick 3-5 affirmations that resonate with your goals, say them aloud each morning with feeling, and visualize yourself embodying these qualities. Consistency is key." },
      { question: "Can visualization help achieve goals?", answer: "Visualization activates the same neural pathways as actually performing actions. Athletes, entrepreneurs, and creators use it to build confidence and mental rehearse success." },
      { question: "How do I stay motivated as a content creator?", answer: "Combine regular affirmations, clear goals, a supportive community, and celebrating small wins. Our tools provide daily inspiration to keep you on track." },
    ],
    howTo: {
      name: "How to Build a Daily Affirmation Practice",
      steps: [
        "Choose affirmations aligned with your creator goals",
        "Set a consistent time (morning recommended)",
        "Say affirmations aloud with conviction and feeling",
        "Visualize success while repeating each affirmation"
      ]
    }
  }
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { clusterSlug } = await params;
  const cluster = getClusterById(clusterSlug);
  
  if (!cluster) {
    return { title: "Cluster Not Found" };
  }

  return {
    title: `${cluster.pillarTitle} | VCM Suite`,
    description: cluster.pillarDescription,
    keywords: [cluster.primaryKeyword, ...cluster.relatedKeywords],
    openGraph: {
      title: cluster.pillarTitle,
      description: cluster.pillarDescription,
      type: "website",
    },
    robots: "index, follow",
  };
}

export function generateStaticParams() {
  return Object.keys(CLUSTER_REGISTRY).map((clusterSlug) => ({
    clusterSlug,
  }));
}

export default async function ClusterPillarPage({ params }: PageProps) {
  const { clusterSlug } = await params;
  const cluster = getClusterById(clusterSlug);

  if (!cluster) {
    notFound();
  }

  const tools = await getToolsForCluster(clusterSlug, cluster.toolSlugs);

  const referenceData = CLUSTER_REFERENCE_DATA[clusterSlug];

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": cluster.pillarTitle,
    "description": cluster.pillarDescription,
    "mainEntity": {
      "@type": "ItemList",
      "name": cluster.pillarTitle,
      "numberOfItems": tools.length,
      "itemListElement": tools.map((tool, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "SoftwareApplication",
          "name": tool.name,
          "description": tool.description,
          "url": `https://vcmsuite.com/tools/${tool.slug}`,
          "applicationCategory": "WebApplication",
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
          }
        }
      }))
    }
  };

  const faqSchema = referenceData?.faqs ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": referenceData.faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  } : null;

  const howToSchema = referenceData?.howTo ? {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": referenceData.howTo.name,
    "step": referenceData.howTo.steps.map((step, index) => ({
      "@type": "HowToStep",
      "position": index + 1,
      "text": step
    }))
  } : null;

  const tableOfContents = [
    { id: "tools", label: "Tools in This Collection", icon: Wrench },
    ...(referenceData ? [{ id: "reference", label: "Quick Reference", icon: Table }] : []),
    ...(cluster.articleSlugs.length > 0 ? [{ id: "articles", label: "Related Articles", icon: BookOpen }] : []),
    ...(referenceData?.faqs ? [{ id: "faq", label: "Frequently Asked Questions", icon: List }] : []),
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
      {howToSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
        />
      )}
      
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Link 
              href="/tools" 
              className="inline-flex items-center gap-2 text-gray-600 hover:text-orange-500 font-medium mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Tools Explorer
            </Link>
            
            <div className="mb-2 text-sm text-orange-600 font-medium uppercase tracking-wide">
              Tool Collection
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {cluster.pillarTitle}
            </h1>
            
            <p className="text-lg text-gray-600 max-w-2xl">
              {cluster.pillarDescription}
            </p>
          </div>

          <nav className="mb-10 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-3 text-sm font-medium text-gray-500 uppercase tracking-wide">
              <List className="w-4 h-4" />
              Table of Contents
            </div>
            <ul className="grid sm:grid-cols-2 gap-2">
              {tableOfContents.map((item) => (
                <li key={item.id}>
                  <a 
                    href={`#${item.id}`}
                    className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                  >
                    <item.icon className="w-4 h-4 text-orange-500" />
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <section id="tools" className="mb-12 scroll-mt-20">
            <div className="flex items-center gap-2 mb-6">
              <Wrench className="w-5 h-5 text-orange-500" />
              <h2 className="text-xl font-bold text-gray-900">
                Tools in This Collection ({tools.length})
              </h2>
            </div>
            
            <div className="grid gap-4">
              {tools.map((tool) => (
                <Link
                  key={tool.slug}
                  href={`/tools/${tool.slug}`}
                  className="group flex items-center justify-between p-5 bg-white rounded-xl border border-gray-200 hover:border-orange-300 hover:shadow-md transition-all"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 group-hover:text-orange-600 transition-colors mb-1">
                      {tool.name}
                    </h3>
                    <p className="text-sm text-gray-500 line-clamp-1">
                      {tool.description}
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-orange-500 transition-colors flex-shrink-0 ml-4" />
                </Link>
              ))}
            </div>
          </section>

          {referenceData && (
            <section id="reference" className="mb-12 scroll-mt-20">
              <div className="flex items-center gap-2 mb-6">
                <Table className="w-5 h-5 text-orange-500" />
                <h2 className="text-xl font-bold text-gray-900">
                  {referenceData.tableTitle}
                </h2>
              </div>
              
              <div className="overflow-x-auto bg-white rounded-xl border border-gray-200 shadow-sm">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {referenceData.columns.map((col, idx) => (
                        <th key={idx} className="px-4 py-3 text-sm font-semibold text-gray-700">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {referenceData.rows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-900">{row.platform}</td>
                        <td className="px-4 py-3 text-gray-600 font-mono text-sm">{row.size}</td>
                        <td className="px-4 py-3 text-gray-600">{row.aspectRatio}</td>
                        {row.use && <td className="px-4 py-3 text-gray-500 text-sm">{row.use}</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                * Values are approximate and may vary based on individual factors.
              </p>
            </section>
          )}

          {referenceData?.howTo && (
            <section className="mb-12 p-6 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                {referenceData.howTo.name}
              </h3>
              <ol className="space-y-3">
                {referenceData.howTo.steps.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-7 h-7 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {idx + 1}
                    </span>
                    <span className="text-gray-700 pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {cluster.articleSlugs.length > 0 && (
            <section id="articles" className="mb-12 scroll-mt-20">
              <div className="flex items-center gap-2 mb-6">
                <BookOpen className="w-5 h-5 text-orange-500" />
                <h2 className="text-xl font-bold text-gray-900">
                  Related Articles ({cluster.articleSlugs.length})
                </h2>
              </div>
              
              <div className="grid gap-3">
                {cluster.articleSlugs.map((articleSlug) => (
                  <Link
                    key={articleSlug}
                    href={`/blog/${articleSlug}`}
                    className="group flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:border-orange-300 hover:shadow-sm transition-all"
                  >
                    <span className="font-medium text-gray-700 group-hover:text-orange-600 transition-colors">
                      {articleSlug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
                    </span>
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-orange-500 transition-colors" />
                  </Link>
                ))}
              </div>
            </section>
          )}

          {referenceData?.faqs && (
            <section id="faq" className="mb-12 scroll-mt-20">
              <div className="flex items-center gap-2 mb-6">
                <List className="w-5 h-5 text-orange-500" />
                <h2 className="text-xl font-bold text-gray-900">
                  Frequently Asked Questions
                </h2>
              </div>
              
              <div className="space-y-4">
                {referenceData.faqs.map((faq, idx) => (
                  <details 
                    key={idx} 
                    className="group bg-white rounded-xl border border-gray-200 overflow-hidden"
                  >
                    <summary className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50 transition-colors">
                      <h3 className="font-semibold text-gray-900 pr-4">{faq.question}</h3>
                      <span className="flex-shrink-0 text-orange-500 group-open:rotate-180 transition-transform">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </span>
                    </summary>
                    <div className="px-5 pb-5 text-gray-600 border-t border-gray-100 pt-4">
                      {faq.answer}
                    </div>
                  </details>
                ))}
              </div>
            </section>
          )}

          <section className="p-8 bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl border border-orange-200">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Build Your Creator Business
              </h2>
              <p className="text-gray-600 mb-6 max-w-lg mx-auto">
                Join VCM OS to access premium creator tools, resources, and a community of ambitious creators.
              </p>
              <Link
                href="https://vcmos.io"
                target="_blank"
                className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-full transition-colors"
              >
                Open VCM OS
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </section>

          <div className="mt-12 text-center">
            <Link 
              href="/tools" 
              className="inline-flex items-center gap-2 text-gray-600 hover:text-orange-500 font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Browse All Tools
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
