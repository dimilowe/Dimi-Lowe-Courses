'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Upload, Download, FileImage, Zap, Shield, Clock, ChevronDown, ChevronUp, Bookmark, Check, Loader2 } from 'lucide-react';
import ExploreMoreTools from '@/components/ExploreMoreTools';
import PostResultUpsell from '@/components/PostResultUpsell';

type CompressionLevel = 'light' | 'balanced' | 'max';

interface CompressionResult {
  jobId: string;
  originalSize: number;
  compressedSize: number;
  reduction: number;
  originalSizeFormatted: string;
  compressedSizeFormatted: string;
  remaining: number;
}

export default function GifCompressorPage() {
  const [file, setFile] = useState<File | null>(null);
  const [level, setLevel] = useState<CompressionLevel>('balanced');
  const [isCompressing, setIsCompressing] = useState(false);
  const [result, setResult] = useState<CompressionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'image/gif' || droppedFile.name.toLowerCase().endsWith('.gif')) {
        setFile(droppedFile);
        setResult(null);
        setError(null);
        setSaved(false);
      } else {
        setError('Please upload a GIF file only.');
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === 'image/gif' || selectedFile.name.toLowerCase().endsWith('.gif')) {
        setFile(selectedFile);
        setResult(null);
        setError(null);
        setSaved(false);
      } else {
        setError('Please upload a GIF file only.');
      }
    }
  };

  const handleCompress = async () => {
    if (!file) return;

    setIsCompressing(true);
    setError(null);
    setResult(null);
    setSaved(false);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('level', level);

      const response = await fetch('/api/gif-compress', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Compression failed');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleDownload = () => {
    if (result) {
      window.location.href = `/api/gif-download/${result.jobId}`;
    }
  };

  const resetUpload = () => {
    setFile(null);
    setResult(null);
    setError(null);
    setSaved(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSaveToWorkspace = async () => {
    if (!result || !file || saving || saved) return;
    setSaving(true);
    try {
      const response = await fetch('/api/workspace/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Compressed: ${file.name}`,
          type: 'file_output',
          cloud_id: 'media',
          tool_id: 'gif-compressor',
          preview_text: `${result.originalSizeFormatted} → ${result.compressedSizeFormatted} (${result.reduction}% reduction)`,
          payload_json: {
            originalName: file.name,
            originalSize: result.originalSize,
            compressedSize: result.compressedSize,
            reduction: result.reduction,
            jobId: result.jobId,
            level,
          },
        }),
      });

      if (response.ok) {
        setSaved(true);
      } else {
        const data = await response.json();
        if (data.error === 'Unauthorized') {
          alert('Please sign in to save to your workspace');
        } else {
          alert('Failed to save. Please try again.');
        }
      }
    } catch (err) {
      console.error('Failed to save to workspace:', err);
      alert('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const faqs = [
    {
      question: 'Does this add a watermark to my GIF?',
      answer: 'No, VCM GIF Compressor never adds watermarks to your files. Your compressed GIFs are 100% clean and ready to use anywhere.'
    },
    {
      question: 'Is there a file size limit?',
      answer: 'Yes, the maximum file size is 10MB. This ensures fast processing and covers most GIF use cases. For larger files, consider breaking them into shorter clips.'
    },
    {
      question: 'Is this tool completely free to use?',
      answer: 'Yes, this GIF compressor is completely free. You can compress up to 20 GIFs per hour without any sign-up or payment required.'
    },
    {
      question: 'Does compression reduce quality?',
      answer: 'Compression involves a trade-off between file size and quality. Our "Light" setting preserves maximum quality, while "Max Compression" prioritizes smaller file size. The "Balanced" setting offers the best of both worlds for most use cases.'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-gray-50 to-white py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
              Free GIF Compressor
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Reduce GIF file size online instantly. No watermarks, no sign-up, completely free.
            </p>
          </div>

          {/* Upload Area */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 mb-8">
            {!result ? (
              <>
                {/* Drag & Drop Zone */}
                <label
                  htmlFor="gif-upload"
                  role="button"
                  tabIndex={0}
                  aria-label={file ? `Selected file: ${file.name}. Press Enter to choose a different file.` : 'Upload a GIF file. Press Enter or drag and drop.'}
                  className={`block cursor-pointer border-2 border-dashed rounded-xl p-12 text-center transition-all focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
                    dragActive 
                      ? 'border-orange-500 bg-orange-50' 
                      : file 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-gray-300 hover:border-orange-500 hover:bg-gray-50'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      fileInputRef.current?.click();
                    }
                  }}
                >
                  <input
                    ref={fileInputRef}
                    id="gif-upload"
                    type="file"
                    accept=".gif,image/gif"
                    onChange={handleFileSelect}
                    className="sr-only"
                    aria-describedby="file-constraints"
                  />
                  
                  {file ? (
                    <div className="space-y-3">
                      <FileImage className="w-16 h-16 mx-auto text-green-600" />
                      <p className="text-lg font-medium text-gray-900">{file.name}</p>
                      <p className="text-gray-500">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                      <button 
                        onClick={(e) => { e.stopPropagation(); resetUpload(); }}
                        className="text-sm text-gray-500 hover:text-gray-700 underline"
                      >
                        Choose different file
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Upload className="w-16 h-16 mx-auto text-gray-400" />
                      <div>
                        <p className="text-lg font-medium text-gray-700">
                          Drag & drop your GIF here
                        </p>
                        <p className="text-gray-500">or click to browse</p>
                      </div>
                      <p id="file-constraints" className="text-sm text-gray-400">Maximum file size: 10MB</p>
                    </div>
                  )}
                </label>

                {/* Compression Level */}
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Compression Level
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'light', label: 'Light', desc: 'Best quality' },
                      { value: 'balanced', label: 'Balanced', desc: 'Recommended' },
                      { value: 'max', label: 'Maximum', desc: 'Smallest file' }
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setLevel(option.value as CompressionLevel)}
                        className={`p-4 rounded-lg border-2 transition-all text-left ${
                          level === option.value
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <span className="font-medium text-gray-900 block">{option.label}</span>
                        <span className="text-sm text-gray-500">{option.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    {error}
                  </div>
                )}

                {/* Compress Button */}
                <Button
                  onClick={handleCompress}
                  disabled={!file || isCompressing}
                  className="w-full mt-6 bg-orange-500 hover:bg-orange-600 text-white py-6 text-lg font-semibold disabled:opacity-50"
                >
                  {isCompressing ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Compressing...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Zap className="w-5 h-5" />
                      Compress GIF
                    </span>
                  )}
                </Button>
              </>
            ) : (
              /* Results Section */
              <div className="text-center space-y-6">
                <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Compression Complete!</h2>
                  <p className="text-gray-600">Your GIF has been successfully compressed</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 py-6">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">Original Size</p>
                    <p className="text-xl font-bold text-gray-900">{result.originalSizeFormatted}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">Compressed Size</p>
                    <p className="text-xl font-bold text-green-600">{result.compressedSizeFormatted}</p>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">Size Reduced</p>
                    <p className="text-xl font-bold text-orange-600">{result.reduction}%</p>
                  </div>
                </div>

                {/* Download and Save Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    onClick={handleDownload}
                    className="bg-orange-500 hover:bg-orange-600 text-white py-6 px-12 text-lg font-semibold"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    Download Compressed GIF
                  </Button>
                  
                  <Button
                    onClick={handleSaveToWorkspace}
                    disabled={saving || saved}
                    variant="outline"
                    className={`py-6 px-8 text-lg font-semibold border-2 ${
                      saved 
                        ? 'border-green-500 text-green-600 bg-green-50' 
                        : 'border-orange-500 text-orange-600 hover:bg-orange-50'
                    }`}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : saved ? (
                      <>
                        <Check className="w-5 h-5 mr-2" />
                        Saved to Workspace
                      </>
                    ) : (
                      <>
                        <Bookmark className="w-5 h-5 mr-2" />
                        Save to Workspace
                      </>
                    )}
                  </Button>
                </div>

                {/* Tip */}
                <p className="text-sm text-gray-500 mt-4">
                  Tip: Re-upload the same GIF with "Maximum" compression if you need an even smaller file.
                </p>

                {/* Compress Another */}
                <button
                  onClick={resetUpload}
                  className="text-orange-600 hover:text-orange-700 font-medium"
                >
                  Compress Another GIF
                </button>
                
                <PostResultUpsell />
              </div>
            )}
          </div>

          {/* APE CTA */}
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-8 text-white">
            <h3 className="text-xl font-bold mb-2">Turn Your GIFs Into Money</h3>
            <p className="text-gray-300 mb-4">
              Use APE (Auto Paywall Everything) to gate your best GIFs and animations behind tips, subscriptions, or one-time unlocks.
            </p>
            <Link href="/product/ape">
              <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                Learn About APE
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Why Choose VCM GIF Compressor?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-14 h-14 mx-auto bg-orange-100 rounded-xl flex items-center justify-center mb-4">
                <Zap className="w-7 h-7 text-orange-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Lightning Fast</h3>
              <p className="text-gray-600">Compress GIFs in seconds with our optimized processing engine.</p>
            </div>
            <div className="text-center p-6">
              <div className="w-14 h-14 mx-auto bg-orange-100 rounded-xl flex items-center justify-center mb-4">
                <Shield className="w-7 h-7 text-orange-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">No Watermarks</h3>
              <p className="text-gray-600">Your compressed GIFs are 100% clean and ready for any use.</p>
            </div>
            <div className="text-center p-6">
              <div className="w-14 h-14 mx-auto bg-orange-100 rounded-xl flex items-center justify-center mb-4">
                <Clock className="w-7 h-7 text-orange-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Always Free</h3>
              <p className="text-gray-600">No sign-up required. Compress up to 20 GIFs per hour for free.</p>
            </div>
          </div>
        </div>
      </section>

      {/* SEO Content Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-3xl prose prose-stone prose-lg">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">What is a GIF Compressor?</h2>
          <p>
            A GIF compressor is a tool that reduces the file size of GIF images while maintaining visual quality. GIFs (Graphics Interchange Format) are widely used for animations, memes, and short video clips across the internet. However, GIF files can become quite large, making them slow to load and difficult to share on platforms with file size restrictions.
          </p>
          <p>
            Our free online GIF compressor uses advanced algorithms including palette optimization and frame rate adjustment to significantly reduce file sizes. Unlike simple image compressors, a dedicated GIF tool understands the unique structure of animated GIFs and applies specialized techniques to minimize size without destroying the animation quality.
          </p>

          <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-6">Why Compress a GIF?</h2>
          <p>
            There are several compelling reasons to compress your GIF files:
          </p>
          <ul>
            <li><strong>Faster Loading:</strong> Smaller GIFs load faster on websites and social media, improving user experience and SEO performance.</li>
            <li><strong>Platform Compatibility:</strong> Many platforms like Discord, Slack, and email services have file size limits. Compressed GIFs fit within these restrictions.</li>
            <li><strong>Reduced Bandwidth:</strong> Smaller files mean less data usage for both you and your audience, especially important for mobile users.</li>
            <li><strong>Better Sharing:</strong> Compressed GIFs are easier to share via messaging apps, forums, and social platforms.</li>
            <li><strong>Storage Savings:</strong> Save space on your devices and cloud storage by reducing GIF file sizes.</li>
          </ul>

          <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-6">How to Use This Free GIF Compressor</h2>
          <p>
            Compressing your GIF is quick and easy with our online tool:
          </p>
          <ol>
            <li><strong>Upload Your GIF:</strong> Drag and drop your GIF file into the upload area, or click to browse your files. We accept GIFs up to 10MB in size.</li>
            <li><strong>Choose Compression Level:</strong> Select from three options: Light (best quality), Balanced (recommended for most uses), or Maximum (smallest file size).</li>
            <li><strong>Click Compress:</strong> Hit the "Compress GIF" button and wait a few seconds while our tool processes your file.</li>
            <li><strong>Download:</strong> Once complete, download your compressed GIF. We'll show you the before and after file sizes so you can see exactly how much space you saved.</li>
          </ol>

          <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-6">Features of VCM GIF Compressor</h2>
          <ul>
            <li><strong>Three Compression Levels:</strong> Choose the perfect balance between quality and file size for your specific needs.</li>
            <li><strong>No Watermarks:</strong> Your compressed GIFs are completely clean - we never add logos or watermarks.</li>
            <li><strong>No Sign-up Required:</strong> Start compressing immediately without creating an account or providing personal information.</li>
            <li><strong>Privacy First:</strong> Your files are automatically deleted after download - we don't store your GIFs.</li>
            <li><strong>Mobile Friendly:</strong> Works perfectly on smartphones and tablets for on-the-go compression.</li>
            <li><strong>Fast Processing:</strong> Most GIFs are compressed in under 30 seconds using our optimized ffmpeg processing.</li>
          </ul>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between"
                >
                  <span className="font-medium text-gray-900">{faq.question}</span>
                  {openFaq === index ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  )}
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-4 text-gray-600">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Explore More Tools */}
      <div className="container mx-auto px-4 py-8">
        <ExploreMoreTools currentTool="/tools/gif-compressor" />
      </div>

      {/* Bottom CTA */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Compress Your GIF?</h2>
          <p className="text-gray-400 mb-8 max-w-xl mx-auto">
            It&apos;s free, fast, and requires no sign-up. Start compressing now!
          </p>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-lg font-semibold transition-colors"
          >
            Compress a GIF Now
          </button>
        </div>
      </section>
    </div>
  );
}
