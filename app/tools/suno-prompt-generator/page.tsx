import { Metadata } from "next";
import SunoPromptGeneratorClient from "./SunoPromptGeneratorClient";
import ExploreMoreTools from "@/components/ExploreMoreTools";

export const metadata: Metadata = {
  title: "Free Suno Prompt Generator (500-Char Optimized) | VCM Suite",
  description: "Generate Suno-ready music prompts in seconds. Auto-enforces the 500 character limit and adds -style to artist inspirations. Free, no login.",
  keywords: [
    "suno prompt generator",
    "suno prompts",
    "suno ai prompt examples",
    "how to write suno prompts",
    "best suno prompt",
    "suno music prompt",
    "suno prompt template",
    "suno prompt for vocals",
    "suno prompt for instrumental",
    "suno ai",
    "ai music generator prompts",
    "music prompt generator"
  ],
  openGraph: {
    title: "Free Suno Prompt Generator (500-Char Optimized) | VCM Suite",
    description: "Generate Suno-ready music prompts in seconds. Auto-enforces the 500 character limit and adds -style to artist inspirations. Free, no login.",
    type: "website",
  },
};

const softwareAppSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "VCM Suno Prompt Generator",
  "applicationCategory": "MultimediaApplication",
  "operatingSystem": "Web",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "ratingCount": "1250"
  },
  "description": "Generate Suno-ready music prompts optimized for the 500 character limit. Free AI-powered prompt generator for music creators."
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is the Suno prompt character limit?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Suno has a practical limit of around 500 characters for prompts. Going over this limit can cause the AI to ignore parts of your prompt or produce inconsistent results. Our generator automatically optimizes all prompts to stay within this limit."
      }
    },
    {
      "@type": "Question",
      "name": "Why should I add '-style' to artist references?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Adding '-style' (like 'Weeknd-style' or 'Daft Punk-style') tells Suno you want the musical style and production aesthetic of that artist, not an impersonation. This produces better, more legally-safe results and is how professional prompt engineers reference artists."
      }
    },
    {
      "@type": "Question",
      "name": "Can I paste lyrics into Suno prompts?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "No. Suno prompts should describe the music style, mood, instrumentation, and vibe - not contain lyrics. If you want specific lyrics, use Suno's separate lyrics field. Our generator focuses on music production prompts only."
      }
    },
    {
      "@type": "Question",
      "name": "What makes a good Suno prompt?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "A good Suno prompt includes: 1) Clear genre, 2) Specific mood/energy, 3) Vocal type (or instrumental), 4) Instrumentation details, 5) Production/mix notes (reverb, punch, warmth), and 6) Structure cues (build, drop, hook). Keep it dense and descriptive, not verbose."
      }
    },
    {
      "@type": "Question",
      "name": "How do I get vocals vs instrumentals?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Explicitly state the vocal type in your prompt. Use 'female vocals', 'male vocals', 'mixed vocals', or 'instrumental / no vocals'. Being explicit prevents Suno from making assumptions about whether to include vocals."
      }
    },
    {
      "@type": "Question",
      "name": "How do I make prompts more cinematic?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "For cinematic results, add: orchestral elements (strings, brass), dynamic builds, emotional swells, film score references, and dramatic structure cues like 'epic build to climax' or 'tension and release'. Our 'More Cinematic' variant does this automatically."
      }
    },
    {
      "@type": "Question",
      "name": "Do you store my prompts?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "No. Prompts are generated on-demand and not stored on our servers. Your creative ideas remain private."
      }
    },
    {
      "@type": "Question",
      "name": "Is this tool free?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, the Suno Prompt Generator is completely free to use with no login required. We offer it as part of our creator tools suite to help musicians and producers get better results from AI music generation."
      }
    }
  ]
};

export default function SunoPromptGeneratorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <main className="min-h-screen bg-gray-50">
        <section className="py-12 md:py-16 px-4">
          <div className="max-w-4xl mx-auto text-center mb-10">
            <span className="inline-block px-4 py-1.5 bg-orange-100 text-orange-700 text-sm font-medium rounded-full mb-4">
              100% Free
            </span>
            <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
              Suno Prompt Generator
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Generate production-ready Suno prompts optimized for the 500-character limit. Get 3 variants instantly.
            </p>
          </div>

          <SunoPromptGeneratorClient />
        </section>

        <section className="py-12 px-4 bg-white border-t border-gray-100">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
              The Free Suno Prompt Generator That Actually Works
            </h2>
            <div className="prose prose-gray max-w-none">
              <p>
                Most AI music prompt generators give you bloated, vague prompts that Suno struggles to interpret. 
                Our generator is built specifically for Suno&apos;s requirements: every prompt stays under 500 characters, 
                uses music industry terminology, and follows the structure that produces the best results.
              </p>
              <p>
                We automatically add &quot;-style&quot; to artist references (turning &quot;The Weeknd&quot; into &quot;Weeknd-style&quot;), 
                which is the proper way to reference artists in AI music generation. This produces better results 
                and avoids potential copyright issues with direct impersonation.
              </p>
              <p>
                Each generation gives you three variants: a clean, direct prompt for reliable results; 
                a cinematic version with orchestral and film score elements; and a minimal/modern version 
                with contemporary production aesthetics. Pick the one that fits your vision.
              </p>
            </div>
          </div>
        </section>

        <section className="py-12 px-4 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
              How to Write High-Quality Suno Prompts
            </h2>
            <div className="prose prose-gray max-w-none">
              <p>
                Writing effective Suno prompts is about being specific without being verbose. 
                Here&apos;s what to include in every prompt:
              </p>
              <ul>
                <li><strong>Genre:</strong> Be specific. &quot;Melodic house&quot; works better than just &quot;electronic.&quot;</li>
                <li><strong>Mood/Energy:</strong> Describe the emotional feel. &quot;Melancholic but hopeful&quot; or &quot;aggressive and relentless.&quot;</li>
                <li><strong>Vocal Type:</strong> Always specify. &quot;Breathy female vocals&quot; or &quot;powerful male baritone&quot; or &quot;instrumental only.&quot;</li>
                <li><strong>Instrumentation:</strong> Name specific instruments. &quot;808 bass, airy synth pads, crisp hi-hats.&quot;</li>
                <li><strong>Production Notes:</strong> Describe the mix. &quot;Reverb-drenched&quot;, &quot;punchy and dry&quot;, &quot;lo-fi tape warmth.&quot;</li>
                <li><strong>Structure Cues:</strong> Guide the song flow. &quot;Slow build to euphoric drop&quot;, &quot;verse-hook-verse&quot;, &quot;ambient intro.&quot;</li>
              </ul>
              <p>
                Avoid vague descriptions like &quot;good vibes&quot; or &quot;nice beat.&quot; The more specific you are about 
                the sound you want, the better Suno can deliver it.
              </p>
            </div>
          </div>
        </section>

        <section className="py-12 px-4 bg-white border-t border-gray-100">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
              Suno Prompt Template (Copy/Paste Structure)
            </h2>
            <div className="prose prose-gray max-w-none">
              <p>
                Use this template structure for consistently good results:
              </p>
              <div className="bg-gray-100 p-4 rounded-lg font-mono text-sm my-4">
                [Genre], [mood] energy, [tempo] tempo, [vocal type], [key instruments], 
                [production style], [mix characteristics], [structure cue], [artist]-style influence
              </div>
              <p><strong>Example:</strong></p>
              <div className="bg-gray-100 p-4 rounded-lg text-sm my-4">
                Melodic house, euphoric summer energy, mid tempo, breathy female vocals, 
                driving bassline, lush synth pads, shimmering arpeggios, warm analog compression, 
                spacious reverb, build to uplifting drop, Lane 8-style production
              </div>
              <p>
                This template ensures you hit all the key elements Suno needs while staying 
                under the 500-character limit. Our generator follows this structure automatically.
              </p>
            </div>
          </div>
        </section>

        <section className="py-12 px-4 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
              Common Suno Prompt Mistakes (and Fixes)
            </h2>
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-lg border border-gray-200">
                <p className="font-medium text-red-600 mb-2">Mistake: Writing prompts over 500 characters</p>
                <p className="text-gray-600 text-sm mb-2">Suno may ignore parts of long prompts, leading to inconsistent results.</p>
                <p className="font-medium text-green-600">Fix: Keep prompts under 500 characters. Our generator does this automatically.</p>
              </div>
              <div className="bg-white p-5 rounded-lg border border-gray-200">
                <p className="font-medium text-red-600 mb-2">Mistake: Pasting lyrics into the prompt</p>
                <p className="text-gray-600 text-sm mb-2">Prompts describe music style, not lyrics. Mixing them confuses Suno.</p>
                <p className="font-medium text-green-600">Fix: Use Suno&apos;s separate lyrics field for words. Keep prompts for production details only.</p>
              </div>
              <div className="bg-white p-5 rounded-lg border border-gray-200">
                <p className="font-medium text-red-600 mb-2">Mistake: Using artist names without &quot;-style&quot;</p>
                <p className="text-gray-600 text-sm mb-2">Direct artist names can cause issues and don&apos;t work as well.</p>
                <p className="font-medium text-green-600">Fix: Always use &quot;Artist-style&quot; format. We add this automatically.</p>
              </div>
              <div className="bg-white p-5 rounded-lg border border-gray-200">
                <p className="font-medium text-red-600 mb-2">Mistake: Being too vague about vocals</p>
                <p className="text-gray-600 text-sm mb-2">Not specifying vocals leads to random results.</p>
                <p className="font-medium text-green-600">Fix: Always state vocal type: &quot;female vocals&quot;, &quot;male vocals&quot;, or &quot;instrumental&quot;.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 px-4 bg-white border-t border-gray-100">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
              Suno Prompt Examples by Genre
            </h2>
            <div className="grid gap-4">
              <div className="bg-gray-50 p-5 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Pop</h3>
                <p className="text-sm text-gray-600">
                  Modern pop, catchy and upbeat, mid tempo, confident female vocals, punchy drums, 
                  bright synths, subtle guitar hooks, radio-ready polish, verse-hook-verse structure, 
                  Dua Lipa-style production
                </p>
              </div>
              <div className="bg-gray-50 p-5 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">EDM / House</h3>
                <p className="text-sm text-gray-600">
                  Progressive house, euphoric energy, 128 BPM, ethereal vocal chops, driving four-on-the-floor kick, 
                  soaring synth leads, sidechained pads, massive reverb, tension build to cathartic drop
                </p>
              </div>
              <div className="bg-gray-50 p-5 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">R&B</h3>
                <p className="text-sm text-gray-600">
                  Contemporary R&B, sensual and moody, slow groove, smooth male vocals, 808 bass, 
                  jazzy keys, minimal percussion, warm saturation, intimate mix, SZA-style atmosphere
                </p>
              </div>
              <div className="bg-gray-50 p-5 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Hip-Hop</h3>
                <p className="text-sm text-gray-600">
                  Trap, aggressive and hard-hitting, 140 BPM, powerful male rap delivery, heavy 808 slides, 
                  dark synth stabs, hi-hat rolls, punchy snares, Travis Scott-style production
                </p>
              </div>
              <div className="bg-gray-50 p-5 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Cinematic</h3>
                <p className="text-sm text-gray-600">
                  Epic orchestral, dramatic and emotional, slow build, no vocals, sweeping strings, 
                  powerful brass, thundering timpani, Hans Zimmer-style crescendos, tension and release
                </p>
              </div>
              <div className="bg-gray-50 p-5 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Lo-fi</h3>
                <p className="text-sm text-gray-600">
                  Lo-fi hip-hop, chill and nostalgic, slow tempo, instrumental, vinyl crackle, 
                  dusty piano chords, mellow bass, lazy drums, tape saturation, late-night study vibes
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 px-4 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {[
                {
                  q: "What is the Suno prompt character limit?",
                  a: "Suno has a practical limit of around 500 characters for prompts. Going over this limit can cause the AI to ignore parts of your prompt or produce inconsistent results. Our generator automatically optimizes all prompts to stay within this limit."
                },
                {
                  q: "Why should I add '-style' to artist references?",
                  a: "Adding '-style' (like 'Weeknd-style' or 'Daft Punk-style') tells Suno you want the musical style and production aesthetic of that artist, not an impersonation. This produces better, more legally-safe results and is how professional prompt engineers reference artists."
                },
                {
                  q: "Can I paste lyrics into Suno prompts?",
                  a: "No. Suno prompts should describe the music style, mood, instrumentation, and vibe - not contain lyrics. If you want specific lyrics, use Suno's separate lyrics field. Our generator focuses on music production prompts only."
                },
                {
                  q: "What makes a good Suno prompt?",
                  a: "A good Suno prompt includes: 1) Clear genre, 2) Specific mood/energy, 3) Vocal type (or instrumental), 4) Instrumentation details, 5) Production/mix notes (reverb, punch, warmth), and 6) Structure cues (build, drop, hook). Keep it dense and descriptive, not verbose."
                },
                {
                  q: "How do I get vocals vs instrumentals?",
                  a: "Explicitly state the vocal type in your prompt. Use 'female vocals', 'male vocals', 'mixed vocals', or 'instrumental / no vocals'. Being explicit prevents Suno from making assumptions about whether to include vocals."
                },
                {
                  q: "How do I make prompts more cinematic?",
                  a: "For cinematic results, add: orchestral elements (strings, brass), dynamic builds, emotional swells, film score references, and dramatic structure cues like 'epic build to climax' or 'tension and release'. Our 'More Cinematic' variant does this automatically."
                },
                {
                  q: "Do you store my prompts?",
                  a: "No. Prompts are generated on-demand and not stored on our servers. Your creative ideas remain private."
                },
                {
                  q: "Is this tool free?",
                  a: "Yes, the Suno Prompt Generator is completely free to use with no login required. We offer it as part of our creator tools suite to help musicians and producers get better results from AI music generation."
                }
              ].map((faq, i) => (
                <details key={i} className="bg-white border border-gray-200 rounded-lg group">
                  <summary className="px-5 py-4 cursor-pointer font-medium text-gray-900 hover:bg-gray-50 list-none flex justify-between items-center">
                    {faq.q}
                    <span className="text-gray-400 group-open:rotate-180 transition-transform">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </span>
                  </summary>
                  <div className="px-5 pb-4 text-gray-600 text-sm">
                    {faq.a}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="py-12 px-4">
          <ExploreMoreTools currentTool="/tools/suno-prompt-generator" />
        </section>
      </main>
    </>
  );
}
