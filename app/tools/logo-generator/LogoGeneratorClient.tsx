'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, Download, AlertCircle, Loader2, Send, User, Bot } from 'lucide-react';
import ExploreMoreTools from '@/components/ExploreMoreTools';
import PostResultUpsell from '@/components/PostResultUpsell';

interface Logo {
  base64: string;
  variant: number;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  logos?: Logo[];
}

export default function LogoGeneratorClient() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm your logo design assistant. Describe the logo you want and I'll create 4 unique variations for you. Be specific about colors, style, icons, and mood you're going for."
    }
  ]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateLogos = async () => {
    const userMessage = input.trim();
    if (!userMessage) return;

    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/logo-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: userMessage,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate logos');
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Here are 4 logo variations based on your description. Click any logo to download it as a PNG. Want something different? Just describe what you'd like to change!",
        logos: data.logos
      }]);
      setRemaining(data.remaining);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Sorry, I couldn't generate logos: ${err instanceof Error ? err.message : 'Something went wrong'}. Please try again.`
      }]);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadLogo = (base64: string, variant: number) => {
    const fileName = `logo-design-v${variant}.png`;
    if (typeof window !== "undefined") {
      try {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        const blob = new Blob([bytes], { type: "image/png" });
        window.dispatchEvent(
          new CustomEvent("vcm:tool-output-ready", {
            detail: {
              mode: "image",
              type: "uploaded_image",
              title: fileName,
              blob,
              fileName,
            },
          }),
        );
      } catch {}
    }
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${base64}`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      generateLogos();
    }
  };

  const trackCTAClick = async () => {
    try {
      await fetch('/api/logo-generate/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: 'cta_click' }),
      });
    } catch {
    }
  };

  const examplePrompts = [
    "A minimalist tech startup logo with a blue gradient, featuring an abstract 'S' shape",
    "Vintage coffee shop logo with warm brown tones, a coffee cup icon, and elegant script font",
    "Bold fitness brand logo in red and black with a lion silhouette, modern and aggressive",
    "Playful children's education logo with bright rainbow colors and a smiling book character"
  ];

  return (
    <>
      
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Free AI Logo Generator",
            "applicationCategory": "DesignApplication",
            "operatingSystem": "Any",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "description": "AI-powered logo generator with chat interface. Describe your vision and get 4 unique logo designs instantly.",
            "featureList": [
              "AI chat-based logo generation",
              "Natural language input",
              "4 unique variations per request",
              "Instant PNG downloads",
              "No watermarks",
              "No signup required"
            ]
          })
        }}
      />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
            Free AI Logo Generator
          </h1>
          <p className="text-lg text-gray-600">
            Describe your vision. Get 4 unique logo designs instantly.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden mb-8">
          <div className="h-[500px] overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.role === 'user' ? 'bg-orange-500' : 'bg-gray-800'
                }`}>
                  {message.role === 'user' ? (
                    <User className="w-4 h-4 text-white" />
                  ) : (
                    <Bot className="w-4 h-4 text-white" />
                  )}
                </div>
                <div className={`flex-1 ${message.role === 'user' ? 'text-right' : ''}`}>
                  <div className={`inline-block px-4 py-3 rounded-2xl max-w-[85%] ${
                    message.role === 'user' 
                      ? 'bg-orange-500 text-gray-900' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                  
                  {message.logos && message.logos.length > 0 && (
                    <>
                      <div className="grid grid-cols-2 gap-3 mt-4 max-w-lg">
                        {message.logos.map((logo) => (
                          <div
                            key={logo.variant}
                            className="bg-white rounded-xl border border-gray-200 p-3 hover:border-orange-400 hover:shadow-md transition-all cursor-pointer group"
                            onClick={() => downloadLogo(logo.base64, logo.variant)}
                            data-track-output="true"
                          >
                            <div className="aspect-square bg-gray-50 rounded-lg overflow-hidden mb-2">
                              <img
                                src={`data:image/png;base64,${logo.base64}`}
                                alt={`Logo variant ${logo.variant}`}
                                className="w-full h-full object-contain"
                              />
                            </div>
                            <div className="flex items-center justify-center gap-1 text-xs text-gray-500 group-hover:text-orange-600 transition-colors">
                              <Download className="w-3 h-3" />
                              <span>Download</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4">
                        <PostResultUpsell />
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
            
            {isGenerating && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="inline-block px-4 py-3 rounded-2xl bg-gray-100">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating your logos...
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {messages.length === 1 && (
            <div className="px-4 pb-3">
              <p className="text-xs text-gray-500 mb-2">Try an example:</p>
              <div className="flex flex-wrap gap-2">
                {examplePrompts.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => setInput(prompt)}
                    className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors truncate max-w-[200px]"
                  >
                    {prompt.slice(0, 40)}...
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="border-t border-gray-200 p-4">
            {error && (
              <div className="flex items-center gap-2 p-2 mb-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}
            
            <div className="flex gap-3">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe your logo... e.g., 'A modern tech company logo with blue gradients and an abstract mountain shape'"
                rows={2}
                disabled={isGenerating}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-gray-900 text-sm resize-none disabled:bg-gray-50"
              />
              <button
                onClick={generateLogos}
                disabled={isGenerating || !input.trim()}
                className={`px-4 rounded-xl transition-all flex items-center justify-center ${
                  isGenerating || !input.trim()
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-orange-500 hover:bg-orange-600 text-gray-900'
                }`}
              >
                {isGenerating ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
            
            {remaining !== null && (
              <p className="text-center text-xs text-gray-500 mt-2">
                {remaining} generations remaining this hour
              </p>
            )}
          </div>
        </div>

        <div className="bg-gray-900 rounded-2xl p-8 md:p-10 text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
            Need a Complete Brand?
          </h2>
          <p className="text-gray-300 mb-5 max-w-xl mx-auto">
            A logo is just the start. Get landing pages, email sequences, and payment processing—all done for you.
          </p>
          <Link
            href="/store"
            onClick={trackCTAClick}
            className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-gray-900 font-semibold rounded-full transition-all"
          >
            <Sparkles className="w-5 h-5" />
            Explore APE Funnels
          </Link>
        </div>

        <div className="prose prose-stone max-w-none">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            How to Use This AI Logo Generator
          </h2>
          <p className="text-gray-600 mb-6">
            Just describe what you want in natural language. Be specific about colors, style, imagery, and mood. The AI understands context like "modern tech startup" or "cozy coffee shop" and creates designs that match your vision.
          </p>

          <h3 className="text-xl font-bold text-gray-900 mb-3 mt-8">
            Tips for Better Results
          </h3>
          <ul className="list-disc list-inside text-gray-600 mb-6 space-y-2">
            <li><strong>Be specific about colors</strong> - "Navy blue and gold" works better than "blue"</li>
            <li><strong>Mention the industry</strong> - "Tech startup" or "bakery" gives helpful context</li>
            <li><strong>Describe the mood</strong> - "Professional and trustworthy" or "fun and playful"</li>
            <li><strong>Include icon ideas</strong> - "With a mountain shape" or "featuring a coffee cup"</li>
            <li><strong>Specify the style</strong> - "Minimalist", "vintage", "bold", or "elegant"</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-10">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-5 mb-10">
            <div className="bg-gray-50 rounded-xl p-5">
              <h3 className="font-semibold text-gray-900 mb-2">Is this logo generator free?</h3>
              <p className="text-gray-600 text-sm">
                Yes! You get 5 free logo generation sessions per hour. Each session creates 4 unique variations. No signup, no credit card, no watermarks.
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-5">
              <h3 className="font-semibold text-gray-900 mb-2">Can I use these logos commercially?</h3>
              <p className="text-gray-600 text-sm">
                Yes, logos are yours to use. For important branding, we recommend having a professional refine the AI-generated concept.
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-5">
              <h3 className="font-semibold text-gray-900 mb-2">What format are the downloads?</h3>
              <p className="text-gray-600 text-sm">
                High-quality PNG files at 1024x1024 pixels, suitable for web and many print applications.
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-5">
              <h3 className="font-semibold text-gray-900 mb-2">Why chat-based instead of form fields?</h3>
              <p className="text-gray-600 text-sm">
                Natural language lets you describe exactly what you envision—colors, mood, icons, style—all in your own words without being limited to predefined options.
              </p>
            </div>
          </div>
        </div>
      </main>

      <div className="max-w-4xl mx-auto px-4 mt-12">
        <ExploreMoreTools currentTool="/tools/logo-generator" />
      </div>

      <footer className="border-t border-gray-200 py-8 mt-12">
        <div className="max-w-4xl mx-auto px-4 text-center text-sm text-gray-500">
          <p>Part of the VCM creator tools. Need a full brand kit? Try APE Funnels.</p>
        </div>
      </footer>
    </>
  );
}
