'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Upload, 
  Loader2, 
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ImageIcon,
  AlertCircle,
  Flame,
  Activity,
  TrendingDown,
  TrendingUp,
  Minus,
  Apple,
  Smartphone,
  Scale,
  Sparkles,
  Calculator,
  Info
} from 'lucide-react';
import ExploreMoreTools from '@/components/ExploreMoreTools';
import PostResultUpsell from '@/components/PostResultUpsell';

interface FoodItem {
  name: string;
  estimatedCalories: number;
}

interface FoodAnalysis {
  estimatedCalories: number;
  confidence: number;
  description: string;
  items: FoodItem[];
}

interface HealthAnalysis {
  activeCalories: number | null;
  totalCalories: number | null;
  note: string;
}

interface WeeklyProjection {
  netCalories: number;
  changeKg: number;
  changeLbs: number;
  projectionMessage: string;
}

interface Summary {
  netCalories: number;
  status: 'deficit' | 'surplus' | 'even' | 'unknown';
  dailyMessage: string;
  weeklyProjection?: WeeklyProjection;
}

interface CalorieResult {
  food: FoodAnalysis;
  health?: HealthAnalysis;
  summary: Summary;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export default function CalorieDeficitCalculatorClient() {
  const [foodImage, setFoodImage] = useState<File | null>(null);
  const [healthImage, setHealthImage] = useState<File | null>(null);
  const [foodPreview, setFoodPreview] = useState<string | null>(null);
  const [healthPreview, setHealthPreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<CalorieResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDraggingFood, setIsDraggingFood] = useState(false);
  const [isDraggingHealth, setIsDraggingHealth] = useState(false);
  const [showFaq, setShowFaq] = useState(false);
  const foodInputRef = useRef<HTMLInputElement>(null);
  const healthInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleFoodSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPG, PNG, or WebP)');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError('Image must be less than 5MB');
      return;
    }
    
    setError(null);
    setFoodImage(file);
    setResults(null);
    
    if (foodPreview) URL.revokeObjectURL(foodPreview);
    setFoodPreview(URL.createObjectURL(file));
  };

  const handleHealthSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPG, PNG, or WebP)');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError('Image must be less than 5MB');
      return;
    }
    
    setError(null);
    setHealthImage(file);
    setResults(null);
    
    if (healthPreview) URL.revokeObjectURL(healthPreview);
    setHealthPreview(URL.createObjectURL(file));
  };

  const handleFoodDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFood(true);
  }, []);

  const handleFoodDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFood(false);
  }, []);

  const handleFoodDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFood(false);
    if (e.dataTransfer.files?.[0]) {
      handleFoodSelect(e.dataTransfer.files[0]);
    }
  }, [foodPreview]);

  const handleHealthDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingHealth(true);
  }, []);

  const handleHealthDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingHealth(false);
  }, []);

  const handleHealthDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingHealth(false);
    if (e.dataTransfer.files?.[0]) {
      handleHealthSelect(e.dataTransfer.files[0]);
    }
  }, [healthPreview]);

  const analyzeCalories = async () => {
    if (!foodImage) {
      setError('Please upload a photo of your meal first');
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    const controller = new AbortController();
    abortControllerRef.current = controller;
    
    setIsAnalyzing(true);
    setError(null);
    setResults(null);

    try {
      const formData = new FormData();
      formData.append('foodImage', foodImage);
      if (healthImage) {
        formData.append('healthScreenshot', healthImage);
      }

      const response = await fetch('/api/tools/calorie-deficit-calculator', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to analyze images');
      }

      const data: CalorieResult = await response.json();
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

  const clearAll = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (foodPreview) URL.revokeObjectURL(foodPreview);
    if (healthPreview) URL.revokeObjectURL(healthPreview);
    setFoodImage(null);
    setHealthImage(null);
    setFoodPreview(null);
    setHealthPreview(null);
    setResults(null);
    setError(null);
    if (foodInputRef.current) foodInputRef.current.value = '';
    if (healthInputRef.current) healthInputRef.current.value = '';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'deficit': return 'bg-green-100 text-green-800 border-green-200';
      case 'surplus': return 'bg-red-100 text-red-800 border-red-200';
      case 'even': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-orange-100 text-orange-800 border-orange-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'deficit': return <TrendingDown className="w-5 h-5" />;
      case 'surplus': return <TrendingUp className="w-5 h-5" />;
      default: return <Minus className="w-5 h-5" />;
    }
  };

  const faqs = [
    {
      q: "What is a calorie deficit?",
      a: "A calorie deficit occurs when you burn more calories than you consume. This is essential for weight loss - your body taps into stored fat for energy when in a deficit. A deficit of 500 calories per day typically results in about 1 pound of weight loss per week."
    },
    {
      q: "How accurate is this AI calorie counter?",
      a: "Our AI provides estimates based on visual analysis of your food photos. While it can identify common foods and portion sizes, accuracy varies. Use it as a helpful guide, not a precise measurement. For medical or serious dietary planning, consult a nutritionist."
    },
    {
      q: "Do I have to upload a Health app screenshot?",
      a: "No, the Health screenshot is optional. If you only upload a food photo, we'll estimate the meal's calories. Adding a Health screenshot lets us calculate your actual deficit or surplus based on calories burned."
    },
    {
      q: "Can I use this for bulking (calorie surplus)?",
      a: "Absolutely! This tool calculates both deficits and surpluses. If you're trying to gain muscle mass, a calorie surplus is necessary. The tool will show you exactly how much you're over your burn rate."
    },
    {
      q: "What Health apps work with this tool?",
      a: "Any screenshot showing calories burned works - iPhone Health app, Fitbit, Apple Watch, Samsung Health, Garmin, MyFitnessPal, or any fitness tracker. Just make sure the calorie numbers are visible in the screenshot."
    },
    {
      q: "Is this calorie deficit calculator free?",
      a: "Yes, this AI calorie deficit calculator is 100% free to use. No signup, no subscription, no limits. Just upload your photos and get instant results."
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
            <Flame className="w-4 h-4" />
            Free AI Calorie Counter
          </span>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            AI Calorie Deficit Calculator
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Snap your food + Health app screenshot to see today's surplus or deficit in seconds.
            Track your calorie balance with AI-powered food recognition.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-100">
            <Calculator className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg font-semibold text-gray-900">How It Works</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Apple className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">1. Upload Meal Photo</h3>
                <p className="text-sm text-gray-500">Take a photo of your food</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Smartphone className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">2. Add Health Screenshot</h3>
                <p className="text-sm text-gray-500">Optional: calories burned</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Scale className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">3. Get Your Deficit</h3>
                <p className="text-sm text-gray-500">See surplus or deficit</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Apple className="w-5 h-5 text-orange-500" />
              1. Upload Meal Photo
              <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Required</span>
            </h2>
            
            {!foodPreview ? (
              <div
                className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${
                  isDraggingFood 
                    ? 'border-orange-500 bg-orange-50' 
                    : 'border-gray-300 hover:border-orange-400'
                }`}
                onDragOver={handleFoodDragOver}
                onDragLeave={handleFoodDragLeave}
                onDrop={handleFoodDrop}
                onClick={() => foodInputRef.current?.click()}
              >
                <input
                  ref={foodInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/jpg,image/heic"
                  onChange={(e) => e.target.files?.[0] && handleFoodSelect(e.target.files[0])}
                  className="hidden"
                />
                <ImageIcon className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-700 font-medium mb-1">
                  Click or drag to upload
                </p>
                <p className="text-gray-500 text-sm">
                  Photo of your meal
                </p>
              </div>
            ) : (
              <div className="relative">
                <img
                  src={foodPreview}
                  alt="Food photo"
                  className="w-full h-48 object-cover rounded-xl bg-gray-100"
                />
                <button
                  onClick={() => {
                    if (foodPreview) URL.revokeObjectURL(foodPreview);
                    setFoodImage(null);
                    setFoodPreview(null);
                    setResults(null);
                    if (foodInputRef.current) foodInputRef.current.value = '';
                  }}
                  className="absolute top-2 right-2 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-lg text-xs font-medium text-gray-700 hover:bg-white transition-colors shadow-sm"
                >
                  Change
                </button>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-orange-500" />
              2. Health Screenshot
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Optional</span>
            </h2>
            
            {!healthPreview ? (
              <div
                className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${
                  isDraggingHealth 
                    ? 'border-orange-500 bg-orange-50' 
                    : 'border-gray-300 hover:border-orange-400'
                }`}
                onDragOver={handleHealthDragOver}
                onDragLeave={handleHealthDragLeave}
                onDrop={handleHealthDrop}
                onClick={() => healthInputRef.current?.click()}
              >
                <input
                  ref={healthInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/jpg,image/heic"
                  onChange={(e) => e.target.files?.[0] && handleHealthSelect(e.target.files[0])}
                  className="hidden"
                />
                <Smartphone className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-700 font-medium mb-1">
                  Click or drag to upload
                </p>
                <p className="text-gray-500 text-sm">
                  Health/Fitness app screenshot
                </p>
              </div>
            ) : (
              <div className="relative">
                <img
                  src={healthPreview}
                  alt="Health screenshot"
                  className="w-full h-48 object-cover rounded-xl bg-gray-100"
                />
                <button
                  onClick={() => {
                    if (healthPreview) URL.revokeObjectURL(healthPreview);
                    setHealthImage(null);
                    setHealthPreview(null);
                    setResults(null);
                    if (healthInputRef.current) healthInputRef.current.value = '';
                  }}
                  className="absolute top-2 right-2 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-lg text-xs font-medium text-gray-700 hover:bg-white transition-colors shadow-sm"
                >
                  Change
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 mb-6">
          <button
            onClick={analyzeCalories}
            disabled={!foodImage || isAnalyzing}
            className="flex-1 py-3 px-6 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Calculating...
              </>
            ) : (
              <>
                <Calculator className="w-5 h-5" />
                Calculate My Deficit
              </>
            )}
          </button>
          {(foodImage || healthImage) && (
            <button
              onClick={clearAll}
              className="px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {results && (
          <div className="space-y-4 mb-6" aria-live="polite">
            <div className={`rounded-2xl border-2 p-6 ${getStatusColor(results.summary.status)}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  {getStatusIcon(results.summary.status)}
                  Today's Status
                </h3>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold uppercase ${getStatusColor(results.summary.status)}`}>
                  {results.summary.status === 'deficit' ? 'Calorie Deficit' :
                   results.summary.status === 'surplus' ? 'Calorie Surplus' :
                   results.summary.status === 'even' ? 'Roughly Even' : 'Unknown'}
                </span>
              </div>
              <div className="text-4xl font-bold mb-3">
                {results.summary.netCalories > 0 ? '+' : ''}{results.summary.netCalories} kcal
              </div>
              <p className="text-sm opacity-80">{results.summary.dailyMessage}</p>
              
              {results.summary.weeklyProjection && (
                <div className="mt-4 pt-4 border-t border-current/20">
                  <p className="text-sm font-medium">
                    Weekly Projection: {results.summary.weeklyProjection.changeLbs > 0 ? '+' : ''}{results.summary.weeklyProjection.changeLbs.toFixed(2)} lbs 
                    ({results.summary.weeklyProjection.changeKg > 0 ? '+' : ''}{results.summary.weeklyProjection.changeKg.toFixed(2)} kg)
                  </p>
                  <p className="text-xs opacity-70 mt-1">{results.summary.weeklyProjection.projectionMessage}</p>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Apple className="w-5 h-5 text-orange-500" />
                Food Estimate
              </h3>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-3xl font-bold text-gray-900">{results.food.estimatedCalories} kcal</div>
                  <p className="text-sm text-gray-500">{results.food.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">Confidence</div>
                  <div className="text-lg font-semibold text-orange-600">{Math.round(results.food.confidence * 100)}%</div>
                </div>
              </div>
              
              {results.food.items.length > 0 && (
                <div className="border-t border-gray-100 pt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Breakdown</h4>
                  <div className="space-y-2">
                    {results.food.items.map((item, index) => (
                      <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-700">{item.name}</span>
                        <span className="font-medium text-gray-900">{item.estimatedCalories} kcal</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {results.health && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-orange-500" />
                  Calories Burned
                </h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="p-4 bg-green-50 rounded-xl">
                    <div className="text-sm text-green-700 mb-1">Active Calories</div>
                    <div className="text-2xl font-bold text-green-800">
                      {results.health.activeCalories !== null ? `${results.health.activeCalories} kcal` : 'N/A'}
                    </div>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-xl">
                    <div className="text-sm text-blue-700 mb-1">Total Calories</div>
                    <div className="text-2xl font-bold text-blue-800">
                      {results.health.totalCalories !== null ? `${results.health.totalCalories} kcal` : 'N/A'}
                    </div>
                  </div>
                </div>
                {results.health.note && (
                  <div className="flex items-start gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                    <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    {results.health.note}
                  </div>
                )}
              </div>
            )}
            
            <PostResultUpsell />
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
            <strong>Disclaimer:</strong> This calorie counter provides AI-generated estimates for informational purposes only. 
            Results may not be accurate and should not replace professional medical or nutritional advice. 
            Consult a healthcare provider for personalized dietary guidance.
          </p>
        </div>

        <ExploreMoreTools currentTool="/tools/calorie-deficit-calculator" />
      </div>
    </div>
  );
}
