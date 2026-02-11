'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import {
  ArrowLeft,
  Upload,
  Music,
  Download,
  Loader2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import ExploreMoreTools from '@/components/ExploreMoreTools';
import PostResultUpsell from '@/components/PostResultUpsell';

type Bitrate = '128' | '192' | '320';

const MAX_FILE_SIZE = 200 * 1024 * 1024;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function M4aToMp3ConversionClient() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [bitrate, setBitrate] = useState<Bitrate>('192');
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [convertedBlob, setConvertedBlob] = useState<Blob | null>(null);
  const [convertedUrl, setConvertedUrl] = useState<string | null>(null);
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const ffmpegRef = useRef<FFmpeg | null>(null);

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
      workerURL: await toBlobURL('https://unpkg.com/@ffmpeg/ffmpeg@0.12.10/dist/umd/814.ffmpeg.js', 'text/javascript'),
    });

    ffmpegRef.current = ffmpeg;
    setFfmpegLoaded(true);
    return ffmpeg;
  }, []);

  useEffect(() => {
    loadFFmpeg().catch((err) => {
      console.error(err);
      setError('Failed to load converter engine. Refresh and try again.');
    });
  }, [loadFFmpeg]);

  useEffect(() => {
    return () => {
      if (convertedUrl) URL.revokeObjectURL(convertedUrl);
    };
  }, [convertedUrl]);

  const validateAndSetFile = (selected: File) => {
    const ext = selected.name.split('.').pop()?.toLowerCase();
    const allowedMime = [
      'audio/mp4',
      'audio/x-m4a',
      'audio/m4a',
      'video/mp4',
    ];
    if (ext !== 'm4a' && !allowedMime.includes(selected.type)) {
      setError('Please upload an M4A file.');
      return;
    }
    if (selected.size > MAX_FILE_SIZE) {
      setError('File too large. Max size is 200MB.');
      return;
    }

    setFile(selected);
    setError(null);
    setConvertedBlob(null);
    if (convertedUrl) {
      URL.revokeObjectURL(convertedUrl);
      setConvertedUrl(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) validateAndSetFile(selected);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) validateAndSetFile(dropped);
  };

  const convert = async () => {
    if (!file) {
      setError('Upload an M4A file first.');
      return;
    }

    setIsConverting(true);
    setProgress(0);
    setError(null);

    try {
      const ffmpeg = await loadFFmpeg();
      const inputName = `input.${file.name.split('.').pop() || 'm4a'}`;
      const outputName = 'output.mp3';

      await ffmpeg.writeFile(inputName, await fetchFile(file));
      await ffmpeg.exec([
        '-i',
        inputName,
        '-vn',
        '-codec:a',
        'libmp3lame',
        '-b:a',
        `${bitrate}k`,
        outputName,
      ]);

      const data = await ffmpeg.readFile(outputName);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const blob = new Blob([(data as any).buffer || data], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);

      setConvertedBlob(blob);
      if (convertedUrl) URL.revokeObjectURL(convertedUrl);
      setConvertedUrl(url);

      await ffmpeg.deleteFile(inputName);
      await ffmpeg.deleteFile(outputName);
    } catch (err) {
      console.error(err);
      setError('Conversion failed. Try another M4A file.');
    } finally {
      setIsConverting(false);
    }
  };

  const download = () => {
    if (!convertedBlob || !file) return;
    const base = file.name.replace(/\.[^.]+$/, '');
    const a = document.createElement('a');
    a.href = convertedUrl!;
    a.download = `${base}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const reset = () => {
    setFile(null);
    setError(null);
    setConvertedBlob(null);
    if (convertedUrl) {
      URL.revokeObjectURL(convertedUrl);
      setConvertedUrl(null);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <Link href="/" className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to VCM Suite
        </Link>

        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-full text-sm font-medium mb-4">
            <Music className="w-4 h-4" />
            Free Audio Converter
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">M4A to MP3 Conversion Tool</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Convert M4A to MP3 in your browser. Choose bitrate, preview the MP3, and download instantly.
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 md:p-8 mb-10">
          <div className="space-y-5">
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragEnter={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                file || isDragging ? 'border-orange-500 bg-orange-50' : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".m4a,audio/mp4,audio/x-m4a,audio/m4a"
                onChange={handleFileChange}
                className="hidden"
              />
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-orange-500" />
                  <p className="font-medium text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-500">({formatBytes(file.size)})</p>
                </div>
              ) : (
                <>
                  <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-700 font-medium">
                    {isDragging ? 'Drop your M4A file here' : 'Drag & drop or click to upload M4A'}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">Max 200MB</p>
                </>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">MP3 Bitrate</label>
                <select
                  value={bitrate}
                  onChange={(e) => setBitrate(e.target.value as Bitrate)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="128">128 kbps (smaller file)</option>
                  <option value="192">192 kbps (balanced)</option>
                  <option value="320">320 kbps (highest quality)</option>
                </select>
              </div>
              <div className="flex items-end gap-3">
                <button
                  onClick={convert}
                  disabled={!file || isConverting || !ffmpegLoaded}
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white font-bold px-4 py-3 rounded-xl transition-colors"
                >
                  {isConverting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Music className="w-5 h-5" />}
                  {isConverting ? `Converting ${progress}%` : 'Convert to MP3'}
                </button>
                <button
                  onClick={reset}
                  className="inline-flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reset
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 px-4 py-3 rounded-xl">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {convertedUrl && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-5">
                <p className="font-semibold text-gray-900 mb-3">Your MP3 is ready</p>
                <audio controls src={convertedUrl} className="w-full mb-4" />
                <button
                  onClick={download}
                  className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-3 rounded-xl"
                >
                  <Download className="w-5 h-5" />
                  Download MP3
                </button>
              </div>
            )}
          </div>
        </div>

        <PostResultUpsell />
        <ExploreMoreTools currentTool="/tools/m4a-to-mp3-conversion" />
      </div>
    </main>
  );
}
