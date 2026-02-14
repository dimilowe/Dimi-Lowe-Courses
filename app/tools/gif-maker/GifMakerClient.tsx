'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Upload, Video, Image, Download, Loader2, RefreshCw, ChevronDown, ChevronUp, AlertCircle, Check, X } from 'lucide-react';
import ExploreMoreTools from '@/components/ExploreMoreTools';
import PostResultUpsell from '@/components/PostResultUpsell';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { useToolPresets, type ToolPresetRecord } from '@/lib/hooks/useToolPresets';
import { ToolPresetBar } from '@/components/presets/ToolPresetBar';
import { TOOL_QUICK_IMPORT_EVENT, type ToolQuickImportDetail } from '@/lib/workspace/toolQuickImport';
import { fileFromWorkspaceDrag } from '@/lib/workspace/workspaceDragImport';

type Mode = 'video' | 'images';

interface Settings {
  width: number;
  fps: number;
  duration: number;
  loop: boolean;
  startTime: number;
}

type GifMakerPresetJson = {
  mode: Mode;
  settings: Settings;
};

type GifMakerPresetRecord = ToolPresetRecord<GifMakerPresetJson>;

const defaultSettings: Settings = {
  width: 480,
  fps: 12,
  duration: 10,
  loop: true,
  startTime: 0,
};

async function imageFileToPngBlob(
  file: File,
  targetWidth?: number,
  targetHeight?: number
): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const outWidth = targetWidth || bitmap.width;
  const outHeight = targetHeight || bitmap.height;
  const canvas = document.createElement('canvas');
  canvas.width = outWidth;
  canvas.height = outHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');

  // Keep all frames identical size so GIF sequencing is deterministic.
  // Paint an opaque background so prior GIF frames cannot show through
  // in letterboxed regions when source aspect ratios differ.
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, outWidth, outHeight);
  const scale = Math.min(outWidth / bitmap.width, outHeight / bitmap.height);
  const drawW = Math.round(bitmap.width * scale);
  const drawH = Math.round(bitmap.height * scale);
  const dx = Math.round((outWidth - drawW) / 2);
  const dy = Math.round((outHeight - drawH) / 2);
  ctx.drawImage(bitmap, dx, dy, drawW, drawH);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('Failed to normalize image');
  return blob;
}

export default function GifMakerClient() {
  const [mode, setMode] = useState<Mode>('video');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [outputGif, setOutputGif] = useState<string | null>(null);
  const [outputSize, setOutputSize] = useState<string>('');
  const [outputDimensions, setOutputDimensions] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [showFaq, setShowFaq] = useState(false);
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false);
  const [presetName, setPresetName] = useState('');
  
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { presets, savingPreset, savePreset } = useToolPresets<GifMakerPresetJson>({
    toolId: 'gif-maker',
    originCloudId: 'creation',
  });

  const loadFFmpeg = useCallback(async () => {
    if (ffmpegRef.current) return ffmpegRef.current;
    
    const ffmpeg = new FFmpeg();
    
    ffmpeg.on('progress', ({ progress }) => {
      setProgress(Math.round(progress * 100));
    });

    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
    
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      workerURL: await toBlobURL(`https://unpkg.com/@ffmpeg/ffmpeg@0.12.10/dist/umd/814.ffmpeg.js`, 'text/javascript'),
    });
    
    ffmpegRef.current = ffmpeg;
    setFfmpegLoaded(true);
    return ffmpeg;
  }, []);

  useEffect(() => {
    loadFFmpeg().catch(console.error);
  }, [loadFFmpeg]);

  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
      imagePreviews.forEach(url => URL.revokeObjectURL(url));
      if (outputGif) URL.revokeObjectURL(outputGif);
    };
  }, [videoUrl, imagePreviews, outputGif]);

  const handleModeChange = (newMode: Mode) => {
    setMode(newMode);
    setVideoFile(null);
    setImageFiles([]);
    setVideoUrl(null);
    setImagePreviews([]);
    setOutputGif(null);
    setError('');
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 100 * 1024 * 1024) {
      setError('File too large. Maximum size is 100 MB.');
      return;
    }

    if (!file.type.startsWith('video/')) {
      setError('Please select a valid video file.');
      return;
    }

    setError('');
    setVideoFile(file);
    setOutputGif(null);
    
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoUrl(URL.createObjectURL(file));
  };

  const handleImagesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const oversizedFiles = files.filter(f => f.size > 100 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      setError('Some files are too large. Maximum size is 100 MB per file.');
      return;
    }

    const invalidFiles = files.filter(f => !f.type.startsWith('image/'));
    if (invalidFiles.length > 0) {
      setError('Please select only image files.');
      return;
    }

    setError('');
    setImageFiles((prev) => [...prev, ...files]);
    setOutputGif(null);

    setImagePreviews((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))]);
    e.target.value = '';
  };

  const handleUploadDrop = async (e: React.DragEvent, targetMode: Mode) => {
    e.preventDefault();

    const droppedFiles = Array.from(e.dataTransfer.files || []);
    if (droppedFiles.length > 0) {
      if (targetMode === 'video') {
        const droppedFile = droppedFiles[0];
        if (!droppedFile.type.startsWith('video/')) {
          setError('Please drop a video file in Video mode.');
          return;
        }
        setMode('video');
        setVideoFile(droppedFile);
        setOutputGif(null);
        setError('');
        if (videoUrl) URL.revokeObjectURL(videoUrl);
        setVideoUrl(URL.createObjectURL(droppedFile));
        return;
      }

      const invalid = droppedFiles.filter((f) => !f.type.startsWith('image/'));
      if (invalid.length > 0) {
        setError('Please drop image files in Images mode.');
        return;
      }
      setMode('images');
      setImageFiles((prev) => [...prev, ...droppedFiles]);
      setOutputGif(null);
      setError('');
      setImagePreviews((prev) => [...prev, ...droppedFiles.map((f) => URL.createObjectURL(f))]);
      return;
    }

    const imported = await fileFromWorkspaceDrag(e.dataTransfer);
    if (!imported) return;

    if (targetMode === 'video') {
      if (!imported.type.startsWith('video/')) return;
      setMode('video');
      setVideoFile(imported);
      setOutputGif(null);
      setError('');
      if (videoUrl) URL.revokeObjectURL(videoUrl);
      setVideoUrl(URL.createObjectURL(imported));
      return;
    }

    if (!imported.type.startsWith('image/')) return;
    setMode('images');
    setImageFiles((prev) => [...prev, imported]);
    setOutputGif(null);
    setError('');
    setImagePreviews((prev) => [...prev, URL.createObjectURL(imported)]);
  };

  useEffect(() => {
    const onQuickImport = (event: Event) => {
      const detail = (event as CustomEvent<ToolQuickImportDetail>).detail;
      const file = detail?.file;
      if (!file) return;

      if (file.type.startsWith('video/')) {
        setMode('video');
        setError('');
        setOutputGif(null);
        setVideoFile(file);
        if (videoUrl) URL.revokeObjectURL(videoUrl);
        setVideoUrl(URL.createObjectURL(file));
        return;
      }

      if (file.type.startsWith('image/')) {
        setMode('images');
        setError('');
        setOutputGif(null);
        setImageFiles((prev) => [...prev, file]);
        setImagePreviews((prev) => [...prev, URL.createObjectURL(file)]);
      }
    };

    window.addEventListener(TOOL_QUICK_IMPORT_EVENT, onQuickImport as EventListener);
    return () => window.removeEventListener(TOOL_QUICK_IMPORT_EVENT, onQuickImport as EventListener);
  }, [imagePreviews, videoUrl]);

  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const generateGif = async () => {
    if (mode === 'video' && !videoFile) {
      setError('Please upload a video first.');
      return;
    }
    if (mode === 'images' && imageFiles.length === 0) {
      setError('Please upload at least one image.');
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setError('');
    setOutputGif(null);

    try {
      setProgressMessage('Initializing...');
      const ffmpeg = await loadFFmpeg();

      if (mode === 'video') {
        setProgressMessage('Processing video...');
        
        const inputFileName = 'input' + (videoFile!.name.match(/\.[^.]+$/)?.[0] || '.mp4');
        await ffmpeg.writeFile(inputFileName, await fetchFile(videoFile!));

        setProgressMessage('Extracting frames...');
        
        const filters = [
          `fps=${settings.fps}`,
          `scale=${settings.width}:-1:flags=lanczos`,
          'split[s0][s1]',
          '[s0]palettegen=max_colors=256[p]',
          '[s1][p]paletteuse=dither=bayer:bayer_scale=5'
        ].join(',');

        const args = [
          '-i', inputFileName,
          '-ss', settings.startTime.toString(),
          '-t', settings.duration.toString(),
          '-vf', filters,
          '-loop', settings.loop ? '0' : '-1',
          'output.gif'
        ];

        setProgressMessage('Encoding GIF...');
        await ffmpeg.exec(args);

        const data = await ffmpeg.readFile('output.gif');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const blob = new Blob([(data as any).buffer || data], { type: 'image/gif' });
        
        if (outputGif) URL.revokeObjectURL(outputGif);
        const url = URL.createObjectURL(blob);
        setOutputGif(url);
        setOutputSize(formatFileSize(blob.size));

        const img = new window.Image();
        img.onload = () => {
          setOutputDimensions(`${img.width}x${img.height}`);
        };
        img.src = url;

        await ffmpeg.deleteFile(inputFileName);
        await ffmpeg.deleteFile('output.gif');

      } else {
        setProgressMessage('Processing images...');

        const normalizedFrameNames: string[] = [];
        const firstBitmap = await createImageBitmap(imageFiles[0]);
        const frameWidth = settings.width;
        const frameHeight = Math.max(2, Math.round((firstBitmap.height / firstBitmap.width) * frameWidth));
        firstBitmap.close();

        for (let i = 0; i < imageFiles.length; i++) {
          const frameName = `img${i.toString().padStart(4, '0')}.png`;
          const pngBlob = await imageFileToPngBlob(imageFiles[i], frameWidth, frameHeight);
          await ffmpeg.writeFile(frameName, await fetchFile(pngBlob));
          normalizedFrameNames.push(frameName);
        }

        setProgressMessage('Creating GIF...');

        const args = [
          '-framerate', '1',
          '-start_number', '0',
          '-i', 'img%04d.png',
          '-vf', `fps=${Math.max(1, settings.fps)},split[s0][s1],[s0]palettegen=max_colors=256[p],[s1][p]paletteuse=dither=bayer:bayer_scale=5`,
          '-loop', settings.loop ? '0' : '-1',
          'output.gif'
        ];

        setProgressMessage('Encoding GIF...');
        await ffmpeg.exec(args);

        const data = await ffmpeg.readFile('output.gif');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const byteArray = data as Uint8Array;
        if (!byteArray || byteArray.length === 0) {
          throw new Error('Generated GIF is empty');
        }
        const copied = Uint8Array.from(byteArray);
        const blob = new Blob([copied as unknown as BlobPart], { type: 'image/gif' });
        
        if (outputGif) URL.revokeObjectURL(outputGif);
        const url = URL.createObjectURL(blob);
        setOutputGif(url);
        setOutputSize(formatFileSize(blob.size));

        const img = new window.Image();
        img.onload = () => {
          setOutputDimensions(`${img.width}x${img.height}`);
        };
        img.src = url;

        for (const frameName of normalizedFrameNames) {
          await ffmpeg.deleteFile(frameName);
        }
        await ffmpeg.deleteFile('output.gif');
      }

      setProgressMessage('Complete!');
    } catch (err) {
      console.error('GIF generation error:', err);
      setError('Something went wrong while generating your GIF. Try a smaller file or lower width/FPS.');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadGif = () => {
    if (!outputGif) return;
    
    const a = document.createElement('a');
    a.href = outputGif;
    a.download = 'vcm-gif-maker-output.gif';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleSavePreset = async () => {
    const ok = await savePreset(presetName, { mode, settings });
    if (ok) setPresetName('');
  };

  const handleApplyPreset = (preset: GifMakerPresetRecord) => {
    const payload = preset?.preset_json;
    if (!payload?.settings) return;
    setMode(payload.mode === 'images' ? 'images' : 'video');
    setSettings({
      width: Math.min(1280, Math.max(120, payload.settings.width ?? defaultSettings.width)),
      fps: Math.min(30, Math.max(5, payload.settings.fps ?? defaultSettings.fps)),
      duration: Math.min(60, Math.max(1, payload.settings.duration ?? defaultSettings.duration)),
      loop: Boolean(payload.settings.loop),
      startTime: Math.max(0, payload.settings.startTime ?? defaultSettings.startTime),
    });
  };

  const hasInput = mode === 'video' ? !!videoFile : imageFiles.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link 
          href="/" 
          className="inline-flex items-center text-orange-600 hover:text-orange-700 mb-8 font-medium"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to VCM Suite
        </Link>

        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-medium mb-4">
            <Video className="w-4 h-4" />
            Free GIF Maker Tool
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Free GIF Maker – Video & Image to GIF Converter
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Convert your videos or images into shareable GIFs directly in your browser. 
            No watermark, no signup, completely free.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-red-800 font-medium">Error</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
            <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-600">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload Source</h2>
          
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => handleModeChange('video')}
              className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                mode === 'video'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Video className="w-5 h-5" />
              Video to GIF
            </button>
            <button
              onClick={() => handleModeChange('images')}
              className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                mode === 'images'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Image className="w-5 h-5" />
              Images to GIF
            </button>
          </div>

          {mode === 'video' ? (
            <div>
              <label className="block">
                <div
                  className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-purple-400 transition-colors cursor-pointer"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleUploadDrop(e, 'video')}
                >
                  <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium mb-1">
                    {videoFile ? videoFile.name : 'Click to upload a video'}
                  </p>
                  <p className="text-gray-400 text-sm">
                    Recommended: short clips under 15 seconds
                  </p>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleVideoUpload}
                    className="hidden"
                  />
                </div>
              </label>

              {videoUrl && (
                <div className="mt-4 rounded-xl overflow-hidden bg-black">
                  <video
                    ref={videoRef}
                    src={videoUrl}
                    controls
                    muted
                    autoPlay
                    loop
                    className="w-full max-h-[400px] object-contain"
                  />
                </div>
              )}
            </div>
          ) : (
            <div>
              <label className="block">
                <div
                  className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-purple-400 transition-colors cursor-pointer"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleUploadDrop(e, 'images')}
                >
                  <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium mb-1">
                    {imageFiles.length > 0 
                      ? `${imageFiles.length} images selected` 
                      : 'Click to upload images'}
                  </p>
                  <p className="text-gray-400 text-sm">
                    Tip: upload 3–20 images for best results
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImagesUpload}
                    className="hidden"
                  />
                </div>
              </label>

              {imagePreviews.length > 0 && (
                <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
                  {imagePreviews.map((preview, i) => (
                    <img
                      key={i}
                      src={preview}
                      alt={`Preview ${i + 1}`}
                      className="w-20 h-20 object-cover rounded-lg shrink-0 border border-gray-200"
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Settings</h2>
              <button
                onClick={resetSettings}
                className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1"
              >
                <RefreshCw className="w-4 h-4" />
                Reset
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Width (pixels)
                </label>
                <input
                  type="number"
                  min={120}
                  max={1280}
                  value={settings.width}
                  onChange={(e) => setSettings({ ...settings, width: Math.min(1280, Math.max(120, parseInt(e.target.value) || 120)) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
                <p className="text-xs text-gray-400 mt-1">120 – 1280 pixels</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  FPS (frames per second)
                </label>
                <input
                  type="number"
                  min={5}
                  max={30}
                  value={settings.fps}
                  onChange={(e) => setSettings({ ...settings, fps: Math.min(30, Math.max(5, parseInt(e.target.value) || 5)) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
                <p className="text-xs text-gray-400 mt-1">5 – 30 FPS (lower = smaller file)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration limit (seconds)
                </label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={settings.duration}
                  onChange={(e) => setSettings({ ...settings, duration: Math.min(60, Math.max(1, parseInt(e.target.value) || 1)) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
                <p className="text-xs text-gray-400 mt-1">Max duration for video clips</p>
              </div>

              {mode === 'video' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start time (seconds)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={settings.startTime}
                    onChange={(e) => setSettings({ ...settings, startTime: Math.max(0, parseInt(e.target.value) || 0) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                  <p className="text-xs text-gray-400 mt-1">Where to start in the video</p>
                </div>
              )}

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="loop"
                  checked={settings.loop}
                  onChange={(e) => setSettings({ ...settings, loop: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <label htmlFor="loop" className="text-sm font-medium text-gray-700">
                  Loop forever
                </label>
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
                lockedMessage="Subscribe to save GIF settings presets."
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Generate</h2>

            {!ffmpegLoaded && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-yellow-600" />
                <span className="text-sm text-yellow-700">Loading converter...</span>
              </div>
            )}

            <button
              onClick={generateGif}
              data-track-output="true"
              disabled={!hasInput || isProcessing || !ffmpegLoaded}
              className="w-full py-4 px-6 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Video className="w-5 h-5" />
                  Generate GIF
                </>
              )}
            </button>

            {isProcessing && (
              <div className="mt-4">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>{progressMessage}</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {outputGif && !isProcessing && (
              <div className="mt-6">
                <div className="rounded-xl overflow-hidden bg-gray-100 mb-4">
                  <img 
                    src={outputGif} 
                    alt="Generated GIF" 
                    className="w-full max-h-[300px] object-contain"
                  />
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Output: {outputDimensions} · {outputSize}</span>
                  </div>
                </div>

                <button
                  onClick={downloadGif}
                  data-track-output="true"
                  className="w-full py-3 px-6 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Download GIF
                </button>
                
                <PostResultUpsell />
              </div>
            )}

            {!hasInput && !isProcessing && !outputGif && (
              <p className="mt-4 text-center text-gray-400 text-sm">
                Upload a video or images to start
              </p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
          <button
            onClick={() => setShowFaq(!showFaq)}
            className="w-full flex items-center justify-between text-left"
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
            <div className="mt-6 space-y-4">
              <div className="border-b border-gray-100 pb-4">
                <h3 className="font-semibold text-gray-800 mb-2">Is this GIF maker free?</h3>
                <p className="text-gray-600 text-sm">
                  Yes! VCM GIF Maker is completely free to use with no limits. There's no signup required, 
                  no watermarks added to your GIFs, and no hidden fees.
                </p>
              </div>

              <div className="border-b border-gray-100 pb-4">
                <h3 className="font-semibold text-gray-800 mb-2">Does this GIF tool add a watermark?</h3>
                <p className="text-gray-600 text-sm">
                  No watermarks! Your GIFs are exported exactly as you create them, with no branding 
                  or watermarks added. They're yours to use however you want.
                </p>
              </div>

              <div className="border-b border-gray-100 pb-4">
                <h3 className="font-semibold text-gray-800 mb-2">Are my files uploaded to a server?</h3>
                <p className="text-gray-600 text-sm">
                  No! All processing happens directly in your browser. Your videos and images never 
                  leave your device, making this tool completely private and secure.
                </p>
              </div>

              <div className="border-b border-gray-100 pb-4">
                <h3 className="font-semibold text-gray-800 mb-2">Can I use this GIF maker for social media?</h3>
                <p className="text-gray-600 text-sm">
                  Absolutely! The GIFs you create are perfect for Twitter, Discord, Slack, iMessage, 
                  blogs, presentations, and anywhere else that supports animated GIFs.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 mb-2">What's the maximum file size?</h3>
                <p className="text-gray-600 text-sm">
                  You can upload videos up to 100 MB. For best results, we recommend keeping clips 
                  under 15 seconds and using the width/FPS settings to control output size.
                </p>
              </div>
            </div>
          )}
        </div>

        <ExploreMoreTools currentTool="/tools/gif-maker" />

        <div className="mt-12 bg-gradient-to-br from-purple-50 to-orange-50 rounded-2xl p-8 text-center border border-purple-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Power your creator business with VCM Suite
          </h2>
          <p className="text-gray-600 mb-6 max-w-xl mx-auto">
            VCM Suite offers free tools, systems, and apps for creators to grow, engage, 
            and monetize their creative business.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/tools"
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition-colors"
            >
              Explore More Free Creator Tools
            </Link>
            <Link
              href="https://vcmos.io"
              target="_blank"
              className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-colors"
            >
              Open VCM OS →
            </Link>
          </div>
        </div>

        <div className="text-center mt-12 pt-8 border-t border-gray-200">
          <p className="text-gray-500 text-sm">
            Free tool by{' '}
            <Link href="/" className="text-purple-600 hover:text-purple-700 font-medium">
              VCM Suite
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
