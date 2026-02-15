'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Upload, Download, Image as ImageIcon, Settings, ChevronDown, ChevronUp, Loader2, CheckCircle2, XCircle, FileImage, Package, Sparkles, ArrowRight } from 'lucide-react';
import ExploreMoreTools from '@/components/ExploreMoreTools';
import PostResultUpsell from '@/components/PostResultUpsell';
import { useToolPresets, type ToolPresetRecord } from '@/lib/hooks/useToolPresets';
import { ToolPresetBar } from '@/components/presets/ToolPresetBar';

interface FileItem {
  id: string;
  file: File;
  name: string;
  size: number;
  status: 'ready' | 'converting' | 'done' | 'error';
  error?: string;
  convertedBlob?: Blob;
  convertedUrl?: string;
}

interface Settings {
  quality: number;
  resizeMode: 'original' | 'resize';
  maxSize: number;
}

type HeicPresetJson = Settings;
type HeicPresetRecord = ToolPresetRecord<HeicPresetJson>;

const defaultSettings: Settings = {
  quality: 85,
  resizeMode: 'original',
  maxSize: 2000,
};

const MAX_FILES = 20;
const MAX_FILE_SIZE = 25 * 1024 * 1024;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function HeicToJpgPage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isConverting, setIsConverting] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [showFaq, setShowFaq] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [conversionComplete, setConversionComplete] = useState(false);
  const [presetName, setPresetName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { presets, savingPreset, savePreset } = useToolPresets<HeicPresetJson>({
    toolId: 'heic-to-jpg',
    originCloudId: 'file',
  });

  const validateFiles = (fileList: FileList | File[]): FileItem[] => {
    const validFiles: FileItem[] = [];
    const filesArray = Array.from(fileList);
    
    for (let i = 0; i < Math.min(filesArray.length, MAX_FILES - files.length); i++) {
      const file = filesArray[i];
      const isHeic = file.name.toLowerCase().endsWith('.heic') || 
                     file.name.toLowerCase().endsWith('.heif') ||
                     file.type === 'image/heic' || 
                     file.type === 'image/heif';
      
      if (!isHeic) continue;
      if (file.size > MAX_FILE_SIZE) continue;
      
      validFiles.push({
        id: `${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        name: file.name,
        size: file.size,
        status: 'ready',
      });
    }
    
    return validFiles;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = validateFiles(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
      setConversionComplete(false);
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
    
    if (e.dataTransfer.files) {
      const newFiles = validateFiles(e.dataTransfer.files);
      setFiles(prev => [...prev, ...newFiles]);
      setConversionComplete(false);
    }
  }, [files.length]);

  const resizeImage = (blob: Blob, maxSize: number, quality: number): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      const url = URL.createObjectURL(blob);
      
      img.onload = () => {
        URL.revokeObjectURL(url);
        
        let { width, height } = img;
        
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = Math.round((height / width) * maxSize);
            width = maxSize;
          } else {
            width = Math.round((width / height) * maxSize);
            height = maxSize;
          }
        }
        
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (result) => {
            if (result) {
              resolve(result);
            } else {
              reject(new Error('Failed to create blob'));
            }
          },
          'image/jpeg',
          quality / 100
        );
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };
      
      img.src = url;
    });
  };

  const convertFile = async (fileItem: FileItem): Promise<FileItem> => {
    try {
      const heic2any = (await import('heic2any')).default;
      const convertedBlob = await heic2any({
        blob: fileItem.file,
        toType: 'image/jpeg',
        quality: settings.quality / 100,
      });
      
      let finalBlob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
      
      if (settings.resizeMode === 'resize') {
        finalBlob = await resizeImage(finalBlob, settings.maxSize, settings.quality);
      }
      
      const convertedUrl = URL.createObjectURL(finalBlob);
      
      return {
        ...fileItem,
        status: 'done',
        convertedBlob: finalBlob,
        convertedUrl,
      };
    } catch (error) {
      return {
        ...fileItem,
        status: 'error',
        error: 'Could not decode this HEIC file. Try another image.',
      };
    }
  };

  const handleConvert = async () => {
    if (files.length === 0 || isConverting) return;
    
    setIsConverting(true);
    setConversionComplete(false);
    
    const updatedFiles = [...files];
    
    for (let i = 0; i < updatedFiles.length; i++) {
      if (updatedFiles[i].status === 'done') continue;
      
      setCurrentIndex(i);
      updatedFiles[i] = { ...updatedFiles[i], status: 'converting' };
      setFiles([...updatedFiles]);
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      updatedFiles[i] = await convertFile(updatedFiles[i]);
      setFiles([...updatedFiles]);
    }
    
    setIsConverting(false);
    setConversionComplete(true);
  };

  const downloadFile = (fileItem: FileItem) => {
    if (!fileItem.convertedBlob) return;
    const outputName = fileItem.name.replace(/\.(heic|heif)$/i, '.jpg');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('vcm:tool-output-ready', {
          detail: {
            mode: 'image',
            type: 'uploaded_image',
            title: outputName,
            blob: fileItem.convertedBlob,
            fileName: outputName,
          },
        }),
      );
    }
    const link = document.createElement('a');
    link.href = fileItem.convertedUrl!;
    link.download = outputName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadAllAsZip = async () => {
    const completedFiles = files.filter(f => f.status === 'done' && f.convertedBlob);
    if (completedFiles.length === 0) return;
    
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    
    completedFiles.forEach(fileItem => {
      const jpgName = fileItem.name.replace(/\.(heic|heif)$/i, '.jpg');
      zip.file(jpgName, fileItem.convertedBlob!);
    });
    
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(zipBlob);
    link.download = 'converted-images.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const removeFile = (id: string) => {
    setFiles(prev => {
      const file = prev.find(f => f.id === id);
      if (file?.convertedUrl) {
        URL.revokeObjectURL(file.convertedUrl);
      }
      return prev.filter(f => f.id !== id);
    });
  };

  const clearAll = () => {
    files.forEach(f => {
      if (f.convertedUrl) URL.revokeObjectURL(f.convertedUrl);
    });
    setFiles([]);
    setConversionComplete(false);
  };

  const handleSavePreset = async () => {
    const ok = await savePreset(presetName, settings);
    if (ok) setPresetName('');
  };

  const handleApplyPreset = (preset: HeicPresetRecord) => {
    const payload = preset?.preset_json;
    if (!payload) return;
    setSettings({
      quality: Math.min(100, Math.max(50, payload.quality ?? defaultSettings.quality)),
      resizeMode: payload.resizeMode === 'resize' ? 'resize' : 'original',
      maxSize: Math.min(4000, Math.max(500, payload.maxSize ?? defaultSettings.maxSize)),
    });
    setShowSettings(true);
  };

  const totalSize = files.reduce((acc, f) => acc + f.size, 0);
  const completedCount = files.filter(f => f.status === 'done').length;
  const errorCount = files.filter(f => f.status === 'error').length;

  const faqs = [
    {
      q: "Is this HEIC to JPG converter free?",
      a: "Yes, this tool is 100% free to use. Convert unlimited HEIC photos to JPG format without any cost, watermarks, or signup required. Whether you're converting a single iPhone photo or batch processing dozens of images, it's completely free."
    },
    {
      q: "Are my HEIC photos uploaded to a server?",
      a: "No, your photos never leave your device. This heic u jpg converter runs entirely in your browser using client-side processing. Your images are converted locally on your computer, ensuring complete privacy and security."
    },
    {
      q: "Does this converter add a watermark?",
      a: "No watermarks are ever added to your converted images. The JPG files you download are clean, high-quality versions of your original HEIC photos, ready to use on any platform."
    },
    {
      q: "Why do iPhone photos use HEIC instead of JPG?",
      a: "Apple introduced HEIC (High Efficiency Image Container) format because it offers better compression than JPG while maintaining image quality. This means iPhone photos take up less storage space. However, HEIC isn't universally supported, which is why tools to convert heic u jpg are so useful for sharing photos online or with non-Apple users."
    },
    {
      q: "Can I convert multiple HEIC files at once?",
      a: "Yes! This batch heic u jpg converter lets you upload and convert up to 20 HEIC files simultaneously. After conversion, you can download them individually or as a single ZIP file for convenience."
    },
    {
      q: "What quality settings should I use?",
      a: "For most uses, the default quality of 85% provides an excellent balance between file size and image quality. If you need the highest quality for printing, increase to 100%. For web or social media use, 75-85% is typically sufficient."
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
            <ImageIcon className="w-4 h-4" />
            Free HEIC Converter Tool
          </span>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Free HEIC to JPG Converter – Online & Private
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Convert your iPhone HEIC photos to universally compatible JPG format directly in your browser. 
            No upload to servers, no watermark, no signup required. Perfect for sharing on social media, 
            blogs, and websites.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Upload className="w-5 h-5 text-orange-500" />
            Upload HEIC Photos
          </h2>
          
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
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
              accept=".heic,.heif,image/heic,image/heif"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <FileImage className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-700 font-medium mb-2">
              Click to upload or drag and drop HEIC files here
            </p>
            <p className="text-gray-500 text-sm">
              Up to {MAX_FILES} files, max {formatFileSize(MAX_FILE_SIZE)} each
            </p>
          </div>

          {files.length > 0 && (
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-gray-600">
                {files.length} file{files.length !== 1 ? 's' : ''} · {formatFileSize(totalSize)}
              </span>
              <button
                onClick={clearAll}
                className="text-red-600 hover:text-red-700 font-medium"
              >
                Clear All
              </button>
            </div>
          )}
        </div>

        {files.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Selected Files</h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {files.map((fileItem) => (
                <div 
                  key={fileItem.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <FileImage className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {fileItem.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(fileItem.size)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {fileItem.status === 'ready' && (
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-200 text-gray-700">
                        Ready
                      </span>
                    )}
                    {fileItem.status === 'converting' && (
                      <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-700 flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Converting
                      </span>
                    )}
                    {fileItem.status === 'done' && (
                      <>
                        <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Done
                        </span>
                        <button
                          onClick={() => downloadFile(fileItem)}
                          className="text-xs px-3 py-1 rounded-full bg-orange-500 text-white hover:bg-orange-600 transition-colors"
                        >
                          Download
                        </button>
                      </>
                    )}
                    {fileItem.status === 'error' && (
                      <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700 flex items-center gap-1" title={fileItem.error}>
                        <XCircle className="w-3 h-3" />
                        Error
                      </span>
                    )}
                    <button
                      onClick={() => removeFile(fileItem.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center justify-between w-full text-left"
          >
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Settings className="w-5 h-5 text-orange-500" />
              Conversion Settings
            </h3>
            {showSettings ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>
          
          {showSettings && (
            <div className="mt-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Output Quality: {settings.quality}%
                </label>
                <input
                  type="range"
                  min="50"
                  max="100"
                  value={settings.quality}
                  onChange={(e) => setSettings(prev => ({ ...prev, quality: parseInt(e.target.value) }))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Smaller file</span>
                  <span>Higher quality</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Output Size
                </label>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="resizeMode"
                      checked={settings.resizeMode === 'original'}
                      onChange={() => setSettings(prev => ({ ...prev, resizeMode: 'original' }))}
                      className="w-4 h-4 text-orange-500 accent-orange-500"
                    />
                    <span className="text-gray-700">Original size</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="resizeMode"
                      checked={settings.resizeMode === 'resize'}
                      onChange={() => setSettings(prev => ({ ...prev, resizeMode: 'resize' }))}
                      className="w-4 h-4 text-orange-500 accent-orange-500"
                    />
                    <span className="text-gray-700">Resize by longest side</span>
                    {settings.resizeMode === 'resize' && (
                      <input
                        type="number"
                        min="500"
                        max="4000"
                        value={settings.maxSize}
                        onChange={(e) => setSettings(prev => ({ ...prev, maxSize: parseInt(e.target.value) || 2000 }))}
                        className="w-24 px-3 py-1 border border-gray-300 rounded-lg text-sm"
                      />
                    )}
                    {settings.resizeMode === 'resize' && <span className="text-gray-500 text-sm">px</span>}
                  </label>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6">
            <ToolPresetBar
              presetName={presetName}
              onPresetNameChange={setPresetName}
              onSave={handleSavePreset}
              saving={savingPreset}
              presets={presets}
              onApply={handleApplyPreset}
              lockedMessage="Subscribe to save HEIC conversion presets."
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <button
            onClick={handleConvert}
            data-track-output="true"
            disabled={files.length === 0 || isConverting}
            className="flex-1 px-6 py-4 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {isConverting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Converting {currentIndex + 1} of {files.length}...
              </>
            ) : (
              <>
                <ImageIcon className="w-5 h-5" />
                Convert to JPG
              </>
            )}
          </button>
          
          {completedCount > 1 && (
            <button
              onClick={downloadAllAsZip}
              data-track-output="true"
              className="px-6 py-4 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
            >
              <Package className="w-5 h-5" />
              Download All as ZIP
            </button>
          )}
        </div>

        {conversionComplete && (
          <>
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
              <p className="text-green-800 font-medium">
                Converted {completedCount} of {files.length} file{files.length !== 1 ? 's' : ''} successfully.
                {errorCount > 0 && (
                  <span className="text-red-600 ml-2">
                    {errorCount} file{errorCount !== 1 ? 's' : ''} failed.
                  </span>
                )}
              </p>
            </div>
            <PostResultUpsell />
          </>
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
                VCM Suite offers free tools, systems, and apps to help creators grow and monetize their work. 
                From image tools and GIF utilities to marketing analyzers and SEO helpers – everything you need 
                to build your creative business.
              </p>
              <Link 
                href="/tools"
                className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition-colors"
              >
                Explore VCM Suite Tools
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        <ExploreMoreTools currentTool="heic-to-jpg" />
      </div>
    </div>
  );
}
