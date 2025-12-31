import { Metadata } from 'next';
import ImageToPromptClient from './ImageToPromptClient';
import ExploreMoreTools from '@/components/ExploreMoreTools';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import ToolServerGate from '@/components/entitlements/ToolServerGate';

export const metadata: Metadata = {
  title: 'Free Image to Prompt Generator | Reverse Image Prompt Builder',
  description: 'Upload any image and get multiple AI-generated prompt variations to recreate it. Includes layout-preserving mode, style shift, negative prompt, and detailed composition breakdown. Free, no login.',
  keywords: [
    'image to prompt',
    'image prompt generator',
    'reverse image prompt',
    'describe image for ai',
    'recreate image prompt',
    'prompt from image',
    'ai image description prompt',
    'image to text prompt',
    'negative prompt generator',
    'composition prompt',
    'midjourney prompt',
    'stable diffusion prompt',
    'dall-e prompt'
  ],
  openGraph: {
    title: 'Free Image to Prompt Generator | VCM Suite',
    description: 'Upload any image and get 5 AI-generated prompt variations to recreate it. Layout-preserving mode, style shifts, and detailed breakdowns included.',
    type: 'website'
  }
};

const faqs = [
  {
    question: 'What is an image to prompt generator?',
    answer: 'An image to prompt generator is a reverse-engineering tool that analyzes any image and creates text prompts you can use to recreate a similar image using AI image generators like Midjourney, DALL-E, or Stable Diffusion. Instead of describing what you want, you show the tool an existing image and it figures out the prompt for you.'
  },
  {
    question: 'How accurate is the layout-preserving mode?',
    answer: 'The layout-preserving mode analyzes the spatial composition of your image — foreground, midground, background, and subject positioning. It then embeds these spatial details into every prompt variant, ensuring the AI generator maintains the same composition. While no prompt can guarantee pixel-perfect recreation, this mode significantly improves spatial consistency.'
  },
  {
    question: 'Do you store uploaded images?',
    answer: 'No. Your images are processed entirely in memory on our servers and immediately discarded after generating prompts. We do not store, log, or retain any image data. Your privacy is protected.'
  },
  {
    question: 'What file formats are supported?',
    answer: 'We support PNG, JPG, JPEG, and WEBP formats up to 8MB. Images larger than 1536px on the longest edge are automatically downscaled to optimize processing without losing important details.'
  },
  {
    question: 'What is a negative prompt?',
    answer: 'A negative prompt tells AI image generators what to avoid in the output — things like blur, artifacts, unwanted elements, or specific styles you don\'t want. Our tool generates a tailored negative prompt based on your image analysis.'
  },
  {
    question: 'How do I recreate the same composition?',
    answer: 'Enable "Preserve exact layout/composition" before generating. This activates our layout analysis which maps foreground, midground, background, and subject positions. All 5 prompt variants will include this spatial information to maintain the same composition when used with AI generators.'
  },
  {
    question: 'How do I use the style shift option?',
    answer: 'Select a style from the dropdown (Anime, 3D Cartoon, Vintage Film, etc.) before generating. The "Style Shift" variant will apply that artistic style while keeping your subject and composition intact. It\'s perfect for seeing your image reimagined in different aesthetics.'
  },
  {
    question: 'Why does text sometimes change in generated images?',
    answer: 'AI image generators often "hallucinate" text — inventing words that look like text but say something different. Enable "Keep text exact" mode to reduce this. Our tool will describe visible text as literal quotes and avoid inventing new text content.'
  },
  {
    question: 'Can this work for logos or product photos?',
    answer: 'Yes! Use the preset buttons to optimize analysis. Select "Logo" for graphic designs, icons, and brand marks. Select "Product Photo" for e-commerce and catalog images. These presets adjust the analysis focus for better results.'
  },
  {
    question: 'Is it free?',
    answer: 'Yes, the Image to Prompt Generator is 100% free to use with no login required. We rate-limit usage to maintain service quality (30 requests per 10 minutes), but there\'s no payment or account needed.'
  },
  {
    question: 'What are the different prompt variants?',
    answer: 'We generate 5 variants: Faithful (closest match), Detailed (verbose with technical terms), Simplified (under 240 characters), Style Shift (your chosen artistic style), and Creative Remix (imaginative reinterpretation). Each serves a different use case.'
  },
  {
    question: 'What is the Prompt Quality Score?',
    answer: 'The Prompt Quality Score (0-100) measures how complete your generated prompts are. It checks for key elements: subject clarity, composition details, lighting description, color palette, camera/lens info, and negative prompts. Higher scores indicate more comprehensive, generator-ready prompts.'
  }
];

const softwareSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'VCM Image to Prompt Generator',
  applicationCategory: 'DesignApplication',
  operatingSystem: 'Web',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD'
  },
  description: 'Free tool to reverse-engineer AI image prompts from any image. Upload a photo and get 5 prompt variants with layout preservation, style shifting, and composition breakdown.',
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    ratingCount: '127'
  }
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map(faq => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer
    }
  }))
};

export default function ImageToPromptPage() {
  return (
    <ToolServerGate
      slug="image-to-prompt"
      toolName="Image to Prompt Generator"
      toolDescription="Upload any image and get AI-generated prompts to recreate it."
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
        <section className="pt-16 pb-8 px-4">
          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
              100% Free Prompt Generator
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Image to Prompt Generator
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-2">
              Upload any image and get 5 AI-generated prompts to recreate it. 
              Reverse-engineer prompts for Midjourney, DALL-E, Stable Diffusion, and more.
            </p>
            <p className="text-sm text-gray-500">
              Layout preservation, style shifting, negative prompts — no login required.
            </p>
          </div>
        </section>

        <section className="pb-16 px-4">
          <div className="max-w-6xl mx-auto">
            <ImageToPromptClient />
          </div>
        </section>

        <section className="py-16 px-4 bg-white">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              What Is an Image to Prompt Generator?
            </h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-lg text-gray-600 mb-4">
                An <strong>image to prompt generator</strong> is a reverse-engineering tool that analyzes any image 
                and creates text descriptions (prompts) you can use to recreate a similar image using AI image generators 
                like Midjourney, DALL-E, Stable Diffusion, or Leonardo AI.
              </p>
              <p className="text-gray-600 mb-4">
                Instead of spending hours trying to describe what you want in words, you simply upload an existing 
                image that captures the style, composition, or mood you&apos;re after. The tool does the hard work of 
                translating visual elements into prompt language that AI generators understand.
              </p>
              <p className="text-gray-600">
                This is especially useful for learning prompt engineering, recreating reference images, maintaining 
                visual consistency across projects, or simply understanding what makes certain images work.
              </p>
            </div>
          </div>
        </section>

        <section className="py-16 px-4 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              How It Works
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600 font-bold mb-4">1</div>
                <h3 className="font-semibold text-gray-900 mb-2">Upload Your Image</h3>
                <p className="text-gray-600 text-sm">
                  Drop or select any PNG, JPG, or WEBP image up to 8MB. Choose your settings like layout preservation and style shift.
                </p>
              </div>
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600 font-bold mb-4">2</div>
                <h3 className="font-semibold text-gray-900 mb-2">AI Analysis</h3>
                <p className="text-gray-600 text-sm">
                  Our AI examines composition, lighting, colors, subjects, mood, and spatial relationships to understand every detail.
                </p>
              </div>
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600 font-bold mb-4">3</div>
                <h3 className="font-semibold text-gray-900 mb-2">Get 5 Prompt Variants</h3>
                <p className="text-gray-600 text-sm">
                  Receive Faithful, Detailed, Simplified, Style Shift, and Remix prompts — plus negative prompts and composition breakdown.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 px-4 bg-white">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Preserve Exact Layout & Composition
            </h2>
            <p className="text-lg text-gray-600 mb-6">
              The <strong>layout preservation mode</strong> is what separates this tool from simple image captioning. 
              When enabled, it maps the spatial structure of your image:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Foreground</h4>
                <p className="text-sm text-gray-600">Elements closest to the viewer — the subjects that grab attention first.</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Midground</h4>
                <p className="text-sm text-gray-600">Supporting elements that provide context and depth.</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Background</h4>
                <p className="text-sm text-gray-600">The setting, environment, or backdrop that anchors the scene.</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Subject Position</h4>
                <p className="text-sm text-gray-600">Where the main subject sits — center, left-third, top, rule-of-thirds points, etc.</p>
              </div>
            </div>
            <p className="text-gray-600">
              All 5 prompt variants will embed this spatial information, giving AI generators the best chance 
              of maintaining the same composition when recreating the image.
            </p>
          </div>
        </section>

        <section className="py-16 px-4 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Keep Text Exact Mode
            </h2>
            <p className="text-lg text-gray-600 mb-4">
              AI image generators are notorious for &quot;hallucinating&quot; text — generating words that look like text 
              but say something completely different from the original.
            </p>
            <p className="text-gray-600 mb-4">
              The <strong>Keep Text Exact</strong> toggle solves this for screenshots, posters, signage, and UI designs. 
              When enabled, the tool:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Describes visible text as literal quotes only if clearly legible</li>
              <li>Uses placeholders like &quot;[unreadable text]&quot; for unclear content</li>
              <li>Focuses on typography style and layout instead of inventing text</li>
              <li>Reduces the chance of embarrassing text hallucinations in outputs</li>
            </ul>
          </div>
        </section>

        <section className="py-16 px-4 bg-white">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Understanding the 5 Prompt Variants
            </h2>
            <div className="space-y-4">
              <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
                <h3 className="font-semibold text-blue-900 mb-2">Faithful Recreation</h3>
                <p className="text-blue-800 text-sm">The closest match to your original image. Comprehensive but balanced — good for direct recreation.</p>
              </div>
              <div className="bg-purple-50 rounded-xl p-5 border border-purple-100">
                <h3 className="font-semibold text-purple-900 mb-2">Faithful + Super Detailed</h3>
                <p className="text-purple-800 text-sm">Extremely verbose with technical terms. Best for generators that benefit from long, specific prompts.</p>
              </div>
              <div className="bg-green-50 rounded-xl p-5 border border-green-100">
                <h3 className="font-semibold text-green-900 mb-2">Simplified</h3>
                <p className="text-green-800 text-sm">Short and clean, under 240 characters. Perfect for quick iterations or generators with length limits.</p>
              </div>
              <div className="bg-pink-50 rounded-xl p-5 border border-pink-100">
                <h3 className="font-semibold text-pink-900 mb-2">Style Shift</h3>
                <p className="text-pink-800 text-sm">Applies your chosen artistic style (Anime, Vintage Film, etc.) while maintaining subject and composition.</p>
              </div>
              <div className="bg-orange-50 rounded-xl p-5 border border-orange-100">
                <h3 className="font-semibold text-orange-900 mb-2">Creative Remix</h3>
                <p className="text-orange-800 text-sm">A creative reinterpretation that keeps the subject recognizable but adds imaginative flair.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 px-4 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Best Practices for Better Prompts
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-5 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-2">Use High-Quality Source Images</h3>
                <p className="text-gray-600 text-sm">Clear, well-lit images produce more accurate prompts. Blurry or low-resolution images limit what the AI can analyze.</p>
              </div>
              <div className="bg-white rounded-xl p-5 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-2">Match Presets to Content</h3>
                <p className="text-gray-600 text-sm">Select Portrait for faces, Product for e-commerce, Logo for graphics. This optimizes the analysis focus.</p>
              </div>
              <div className="bg-white rounded-xl p-5 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-2">Combine Variants</h3>
                <p className="text-gray-600 text-sm">Start with Faithful, then grab specific details from Detailed to create your perfect custom prompt.</p>
              </div>
              <div className="bg-white rounded-xl p-5 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-2">Always Include Negatives</h3>
                <p className="text-gray-600 text-sm">Don&apos;t skip the negative prompt. It&apos;s often the difference between good and great AI output.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 px-4 bg-white">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <details key={index} className="group bg-gray-50 rounded-xl border border-gray-200">
                  <summary className="flex items-center justify-between p-5 cursor-pointer list-none">
                    <h3 className="font-medium text-gray-900 pr-4">{faq.question}</h3>
                    <ChevronDown className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform flex-shrink-0" />
                  </summary>
                  <div className="px-5 pb-5">
                    <p className="text-gray-600">{faq.answer}</p>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 px-4 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <ExploreMoreTools currentTool="/tools/image-to-prompt" />
          </div>
        </section>

        <section className="py-8 px-4 bg-gray-100">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-sm text-gray-500">
              Your images are processed in memory and discarded immediately. No data is stored on our servers.
            </p>
          </div>
        </section>
      </main>
    </ToolServerGate>
  );
}
