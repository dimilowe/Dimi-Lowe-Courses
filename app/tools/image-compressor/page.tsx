'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { Upload, FileImage, Download, ArrowRight, Check, Zap, Globe, Mail, HardDrive, Image as ImageIcon, ChevronDown, ChevronUp } from 'lucide-react';
import ExploreMoreTools from '@/components/ExploreMoreTools';
import PostResultUpsell from '@/components/PostResultUpsell';
import { useToolPresets, type ToolPresetRecord } from '@/lib/hooks/useToolPresets';
import { ToolPresetBar } from '@/components/presets/ToolPresetBar';
import { TOOL_QUICK_IMPORT_EVENT, type ToolQuickImportDetail } from '@/lib/workspace/toolQuickImport';
import { fileFromWorkspaceDrag } from '@/lib/workspace/workspaceDragImport';

type CompressionLevel = 'light' | 'balanced' | 'max';

interface CompressionResult {
  jobId: string;
  originalSize: number;
  compressedSize: number;
  reduction: number;
  originalSizeFormatted: string;
  compressedSizeFormatted: string;
  outputFormat: string;
  remaining: number;
}

type ImageCompressorPresetJson = {
  level: CompressionLevel;
};

type ImageCompressorPresetRecord = ToolPresetRecord<ImageCompressorPresetJson>;

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

export default function ImageCompressorPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [level, setLevel] = useState<CompressionLevel>('balanced');
  const [isCompressing, setIsCompressing] = useState(false);
  const [result, setResult] = useState<CompressionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [presetName, setPresetName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { presets, savingPreset, savePreset } = useToolPresets<ImageCompressorPresetJson>({
    toolId: 'image-compressor',
    originCloudId: 'file',
  });

  const resetUpload = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileSelect = useCallback((selectedFile: File) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = selectedFile.name.toLowerCase().slice(selectedFile.name.lastIndexOf('.'));
    
    if (!allowedTypes.includes(selectedFile.type) && !allowedExtensions.includes(ext)) {
      setError('Please upload a JPG, PNG, or WebP image');
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size exceeds 10MB limit');
      return;
    }

    setFile(selectedFile);
    setError(null);
    setResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(selectedFile);
  }, []);

































































































































  useEffect(() => {
    const onQuickImport = (event: Event) => {
      const detail = (event as CustomEvent<ToolQuickImportDetail>).detail;
      if (!detail?.file || !detail.file.type.startsWith("image/")) return;
      handleFileSelect(detail.file);
    };
    window.addEventListener(TOOL_QUICK_IMPORT_EVENT, onQuickImport as EventListener);
    return () => window.removeEventListener(TOOL_QUICK_IMPORT_EVENT, onQuickImport as EventListener);
  }, [handleFileSelect]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
      return;
    }

    const imported = await fileFromWorkspaceDrag(e.dataTransfer);
    if (imported && imported.type.startsWith('image/')) {
      handleFileSelect(imported);
    }
  };

  const handleCompress = async () => {
    if (!file) return;

    setIsCompressing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('level', level);

      const response = await fetch('/api/image-compress', {
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
    if (!result) return;
    window.location.href = `/api/image-download/${result.jobId}`;
  };

  const handleSavePreset = async () => {
    const ok = await savePreset(presetName, { level });
    if (ok) setPresetName('');
  };

  const handleApplyPreset = (preset: ImageCompressorPresetRecord) => {
    if (!preset?.preset_json?.level) return;
    setLevel(preset.preset_json.level);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "VCM Image Compressor",
            "applicationCategory": "MultimediaApplication",
            "operatingSystem": "Web",
            "description": "Compress images online for free. Reduce JPG, PNG, and WebP file size instantly with no watermark or sign-up. Fast image compressor for web, social, and uploads.",
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
                "name": "Does this tool add a watermark?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "No. Your compressed images are completely clean with no watermarks, logos, or branding added."
                }
              },
              {
                "@type": "Question",
                "name": "Is there a file size limit?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes, the maximum file size is 10MB per image. For larger files, consider resizing before compression."
                }
              },
              {
                "@type": "Question",
                "name": "Is this tool really free?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes! You can compress up to 20 images per hour completely free. No sign-up required."
                }
              },
              {
                "@type": "Question",
                "name": "Does compression reduce quality?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Compression involves a trade-off between file size and quality. Light compression preserves the most quality, while Maximum compression achieves the smallest file size with some visible quality reduction. Balanced mode offers the best of both worlds for most use cases."
                }
              }
            ]
          })
        }}
      />

      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Free Image Compressor
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Reduce JPG/PNG Size Online
          </p>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Upload an image and instantly reduce its file size without losing visible quality.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 mb-12">
          {!result ? (
            <>
              <label
                htmlFor="image-upload"
                tabIndex={0}
                role="button"
                aria-label="Upload image file. Drag and drop or click to browse. Accepts JPG, PNG, and WebP files up to 10MB."
                className={`relative block w-full p-12 border-2 border-dashed rounded-xl cursor-pointer transition-all text-center focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
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
                  id="image-upload"
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                  onChange={handleInputChange}
                  className="sr-only"
                  aria-describedby="file-constraints"
                />
                
                {file ? (
                  <div className="space-y-3">
                    {preview && (
                      <div className="mx-auto w-32 h-32 rounded-lg overflow-hidden border border-gray-200">
                        <img 
                          src={preview} 
                          alt="Preview" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
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
                        Drag & drop your image here
                      </p>
                      <p className="text-gray-500">or click to browse</p>
                    </div>
                    <p id="file-constraints" className="text-sm text-gray-400">
                      JPG, PNG, WebP up to 10MB
                    </p>
                  </div>
                )}
              </label>

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

              <div className="mt-6">
                <ToolPresetBar
                  presetName={presetName}
                  onPresetNameChange={setPresetName}
                  onSave={handleSavePreset}
                  saving={savingPreset}
                  presets={presets}
                  onApply={handleApplyPreset}
                  lockedMessage="Subscribe to save your favorite compression preset."
                />
              </div>

              {error && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  {error}
                </div>
              )}

              <button
                onClick={handleCompress}
                disabled={!file || isCompressing}
                className={`mt-8 w-full py-4 px-6 rounded-lg font-semibold text-lg transition-all ${
                  file && !isCompressing
                    ? 'bg-orange-500 hover:bg-orange-600 text-gray-900'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isCompressing ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Compressing...
                  </span>
                ) : (
                  'Compress Image'
                )}
              </button>
            </>
          ) : (
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-10 h-10 text-green-600" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Compression Complete!
              </h2>
              
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500 mb-1">Original Size</p>
                  <p className="text-xl font-bold text-gray-900">{result.originalSizeFormatted}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500 mb-1">Compressed Size</p>
                  <p className="text-xl font-bold text-green-600">{result.compressedSizeFormatted}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500 mb-1">Reduced By</p>
                  <p className="text-xl font-bold text-orange-600">{result.reduction}%</p>
                </div>
              </div>
              
              <button
                onClick={handleDownload}
                data-track-output="true"
                data-output-url={result ? `/api/image-download/${result.jobId}` : undefined}
                data-output-name={file ? `compressed-${file.name}` : "compressed-image.jpg"}
                className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-gray-900 font-semibold py-4 px-8 rounded-lg text-lg transition-all"
              >
                <Download className="w-5 h-5" />
                Download Compressed Image
              </button>
              
              <button
                onClick={resetUpload}
                className="block mx-auto mt-4 text-gray-500 hover:text-gray-700 underline"
              >
                Compress another image
              </button>
              
              <p className="mt-6 text-sm text-gray-500">
                Need an even smaller file? Try running Maximum compression or resize the image before upload.
              </p>
              
              <PostResultUpsell />
            </div>
          )}
        </div>

        <div className="bg-gray-900 rounded-2xl p-8 md:p-12 text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Turn Your Images Into Money
          </h2>
          <p className="text-gray-300 mb-6 max-w-xl mx-auto">
            Use APE (Auto Paywall Everything) to gate your best images behind tips, subscriptions, or one-time unlocks.
          </p>
          <Link
            href="/product/ape"
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-gray-900 font-semibold py-3 px-6 rounded-lg transition-all"
          >
            Learn About APE
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        <article className="prose prose-stone max-w-none">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            What is an Image Compressor?
          </h2>
          <p className="text-gray-600 mb-6">
            An image compressor is a tool that reduces the file size of digital images while maintaining acceptable visual quality. It works by removing unnecessary data and optimizing how the image is encoded. Modern compression algorithms can achieve significant file size reductions, often 50-80%, with minimal visible quality loss. This makes images faster to load, easier to share, and cheaper to store.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Why Compress an Image?
          </h2>
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            <div className="flex items-start gap-3 p-4 bg-white rounded-lg border border-gray-200">
              <Zap className="w-6 h-6 text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-gray-900">Faster Loading</h3>
                <p className="text-sm text-gray-600">Smaller images load faster, improving user experience and reducing bounce rates on websites.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-white rounded-lg border border-gray-200">
              <Globe className="w-6 h-6 text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-gray-900">Better SEO</h3>
                <p className="text-sm text-gray-600">Google rewards fast-loading pages. Optimized images directly impact your search rankings.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-white rounded-lg border border-gray-200">
              <Mail className="w-6 h-6 text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-gray-900">Email & Uploads</h3>
                <p className="text-sm text-gray-600">Many platforms limit file sizes. Compressed images fit within email and upload restrictions.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-white rounded-lg border border-gray-200">
              <HardDrive className="w-6 h-6 text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-gray-900">Storage Savings</h3>
                <p className="text-sm text-gray-600">Reduce storage costs and save disk space by compressing your image library.</p>
              </div>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            How to Use This Free Image Compressor
          </h2>
          <ol className="list-decimal list-inside space-y-3 text-gray-600 mb-8">
            <li><strong>Upload your image</strong> - Drag and drop or click to select a JPG, PNG, or WebP file (up to 10MB)</li>
            <li><strong>Choose compression level</strong> - Select Light for best quality, Balanced for optimal results, or Maximum for smallest file size</li>
            <li><strong>Click Compress Image</strong> - Our server processes your image in seconds</li>
            <li><strong>Download your optimized image</strong> - Save the compressed file to your device</li>
          </ol>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Supported Image Formats
          </h2>
          <div className="flex gap-4 mb-8">
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200">
              <ImageIcon className="w-5 h-5 text-orange-500" />
              <span className="font-medium">JPG/JPEG</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200">
              <ImageIcon className="w-5 h-5 text-orange-500" />
              <span className="font-medium">PNG</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200">
              <ImageIcon className="w-5 h-5 text-orange-500" />
              <span className="font-medium">WebP</span>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>
          <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
            <FAQItem 
              question="Does this tool add a watermark?"
              answer="No. Your compressed images are completely clean with no watermarks, logos, or branding added. The output is exactly what you uploaded, just smaller."
            />
            <FAQItem 
              question="Is there a file size limit?"
              answer="Yes, the maximum file size is 10MB per image. For larger files, consider resizing before uploading or using desktop software for batch processing."
            />
            <FAQItem 
              question="Is this tool really free?"
              answer="Yes! You can compress up to 20 images per hour completely free. No sign-up, no credit card, no hidden fees. We make money through our premium products, not this tool."
            />
            <FAQItem 
              question="Does compression reduce quality?"
              answer="Compression involves a trade-off between file size and quality. Light compression preserves the most quality (barely noticeable difference). Balanced mode offers the best of both worlds for most use cases. Maximum compression achieves the smallest file size but may show some quality reduction in detailed areas."
            />
            <FAQItem 
              question="What happens to my images after compression?"
              answer="Your images are automatically deleted from our servers within 10 minutes. We don't store, share, or analyze your files. Your privacy is protected."
            />
            <FAQItem 
              question="Can I compress multiple images at once?"
              answer="Currently, our tool processes one image at a time. For batch compression needs, consider using desktop software or contact us about our enterprise solutions."
            />
          </div>

          <ExploreMoreTools currentTool="/tools/image-compressor" />
        </article>
      </main>
    </div>
  );
}
