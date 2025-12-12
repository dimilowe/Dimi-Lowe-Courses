'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Upload, 
  Camera, 
  Loader2, 
  ExternalLink, 
  Search,
  Sparkles,
  ShoppingBag,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ImageIcon,
  Tag,
  AlertCircle
} from 'lucide-react';
import ExploreMoreTools from '@/components/ExploreMoreTools';
import PostResultUpsell from '@/components/PostResultUpsell';

interface DetectedItem {
  label: string;
  description: string;
  searchKeywords: string[];
}

interface ProductResult {
  title: string;
  price?: string;
  imageUrl?: string;
  source?: string;
  productUrl: string;
  externalSearchLink?: boolean;
  retailerGradient?: string;
}

interface AnalyzeResponse {
  items: Array<{
    detectedItem: DetectedItem;
    products: ProductResult[];
  }>;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export default function OutfitIdeasPage() {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showFaq, setShowFaq] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPG, PNG, or WebP)');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError('Image must be less than 5MB');
      return;
    }
    
    setError(null);
    setImage(file);
    setResults(null);
    
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(file));
    
    analyzeImage(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files?.[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, [preview]);

  const analyzeImage = async (file: File) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    const controller = new AbortController();
    abortControllerRef.current = controller;
    
    setIsAnalyzing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/tools/outfit-analyzer', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to analyze image');
      }

      const data: AnalyzeResponse = await response.json();
      setResults(data);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      if (abortControllerRef.current === controller) {
        setIsAnalyzing(false);
      }
    }
  };

  const clearImage = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (preview) URL.revokeObjectURL(preview);
    setImage(null);
    setPreview(null);
    setResults(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const faqs = [
    {
      q: "How does the outfit ideas finder work?",
      a: "Upload any outfit photo and our AI analyzes it to identify individual items like tops, pants, shoes, and accessories. For each item, we generate search keywords and find similar products from shopping sites so you can recreate the look."
    },
    {
      q: "Is this outfit finder free?",
      a: "Yes, the outfit ideas generator is 100% free to use. No signup or account required. Just upload a photo and get instant shopping suggestions."
    },
    {
      q: "What kind of photos work best?",
      a: "Clear, well-lit photos work best. Full-body outfit shots, Instagram fashion posts, celebrity looks, or Pinterest inspiration boards all work great. The AI can identify multiple items in a single photo."
    },
    {
      q: "Can I find similar items from any photo?",
      a: "Yes! You can upload screenshots from social media, photos from magazines, pictures of friends' outfits, or any fashion image. The AI will identify shoppable items and find similar products."
    },
    {
      q: "Are the product links accurate?",
      a: "We search major shopping sites to find visually similar products. Prices and availability may vary. We recommend verifying details on the merchant's website before purchasing."
    },
    {
      q: "Does this work for home decor and other items?",
      a: "While optimized for fashion and outfits, the AI can also identify other visual products like furniture, decor, gadgets, and accessories. Try it with any aesthetic photo!"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 mb-6 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to VCM Suite
        </Link>

        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-100 text-orange-700 text-sm font-medium mb-4">
            <Camera className="w-4 h-4" />
            Free AI Style Finder
          </span>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Outfit Ideas Generator – Shop Any Look
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Upload any outfit photo and instantly find similar items to shop. 
            Recreate celebrity looks, Pinterest inspiration, or your favorite Instagram styles with AI-powered product matching.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Upload className="w-5 h-5 text-orange-500" />
            Upload Outfit Photo
          </h2>
          
          {!preview ? (
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
                isDragging 
                  ? 'border-orange-500 bg-orange-50' 
                  : 'border-gray-300 hover:border-orange-400'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/jpg"
                onChange={handleInputChange}
                className="hidden"
              />
              <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-700 font-medium mb-2">
                Click to upload or drag and drop
              </p>
              <p className="text-gray-500 text-sm">
                JPG, PNG, or WebP. Max 5MB.
              </p>
            </div>
          ) : (
            <div className="relative">
              <img
                src={preview}
                alt="Uploaded outfit"
                className="w-full max-h-96 object-contain rounded-xl bg-gray-100"
              />
              <button
                onClick={clearImage}
                className="absolute top-3 right-3 px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-lg text-sm font-medium text-gray-700 hover:bg-white transition-colors shadow-sm"
              >
                Upload New
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {isAnalyzing && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-6 text-center">
            <Loader2 className="w-10 h-10 text-orange-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-700 font-medium">Analyzing your outfit...</p>
            <p className="text-gray-500 text-sm mt-1">Finding similar items to shop</p>
          </div>
        )}

        {results && results.items.length > 0 && (
          <div className="space-y-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-orange-500" />
              Found {results.items.length} Item{results.items.length !== 1 ? 's' : ''} to Shop
            </h2>
            
            {results.items.map((item, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.detectedItem.label}</h3>
                  <p className="text-gray-600 text-sm mb-3">{item.detectedItem.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {item.detectedItem.searchKeywords.slice(0, 5).map((keyword, i) => (
                      <span 
                        key={i}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs"
                      >
                        <Tag className="w-3 h-3" />
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {item.products.map((product, pIndex) => {
                    const gradientColors = product.retailerGradient?.split(',') || ['f97316', 'ea580c'];
                    const hasRealImage = product.imageUrl && !product.externalSearchLink && !product.retailerGradient;
                    
                    return (
                      <a
                        key={pIndex}
                        href={`/r?u=${encodeURIComponent(product.productUrl)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group bg-gray-50 rounded-xl p-3 hover:bg-gray-100 transition-all hover:scale-[1.02]"
                      >
                        {hasRealImage ? (
                          <div className="aspect-square bg-white rounded-lg mb-2 overflow-hidden">
                            <img
                              src={product.imageUrl}
                              alt={product.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          </div>
                        ) : (
                          <div 
                            className="aspect-square rounded-lg mb-2 flex flex-col items-center justify-center text-white relative overflow-hidden"
                            style={{
                              background: `linear-gradient(135deg, #${gradientColors[0]} 0%, #${gradientColors[1] || gradientColors[0]} 100%)`
                            }}
                          >
                            <ShoppingBag className="w-8 h-8 mb-1 opacity-90" />
                            <span className="text-xs font-semibold opacity-90">{product.source}</span>
                          </div>
                        )}
                        <p className="text-sm font-medium text-gray-900 line-clamp-2 mb-1 group-hover:text-orange-600 transition-colors">
                          {product.title}
                        </p>
                        {product.price && (
                          <p className="text-sm font-bold text-orange-600">{product.price}</p>
                        )}
                        <div className="flex items-center gap-1 text-xs text-gray-400 mt-2 group-hover:text-orange-500 transition-colors">
                          <ExternalLink className="w-3 h-3" />
                          Shop Now
                        </div>
                      </a>
                    );
                  })}
                </div>
              </div>
            ))}
            
            <PostResultUpsell />
          </div>
        )}

        {results && results.items.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-6 text-center">
            <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-700 font-medium">No shoppable items detected</p>
            <p className="text-gray-500 text-sm mt-1">Try uploading a clearer outfit photo with visible clothing items</p>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <button
            onClick={() => setShowFaq(!showFaq)}
            className="flex items-center justify-between w-full text-left"
          >
            <h2 className="text-xl font-bold text-gray-900">
              Frequently Asked Questions
            </h2>
            {showFaq ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>
          
          {showFaq && (
            <div className="mt-6 space-y-6">
              {faqs.map((faq, index) => (
                <div key={index}>
                  <h3 className="font-semibold text-gray-900 mb-2">{faq.q}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-8 mb-8 border border-orange-200">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-orange-500 rounded-xl">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                More Free Tools for Creators – VCM Suite
              </h2>
              <p className="text-gray-600 mb-4">
                VCM Suite offers free tools for creators and entrepreneurs. 
                From image converters to AI analyzers – everything you need to create and grow.
              </p>
              <Link
                href="/tools"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition-colors"
              >
                Browse All Tools
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-gray-100 rounded-2xl p-6 mb-8">
          <p className="text-gray-500 text-sm text-center">
            <strong>Disclaimer:</strong> Product matches are AI-generated suggestions. Prices and availability vary by retailer. 
            Always verify details before purchasing. VCM Suite is not affiliated with listed merchants.
          </p>
        </div>

        <ExploreMoreTools currentTool="/tools/outfit-ideas" />
      </div>
    </div>
  );
}
