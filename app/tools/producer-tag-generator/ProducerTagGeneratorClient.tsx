'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { 
  Music, 
  Upload, 
  Loader2, 
  Download, 
  AlertCircle,
  Mic,
  Sparkles,
  Volume2,
  Clock,
  CheckCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import ExploreMoreTools from '@/components/ExploreMoreTools';
import PostResultUpsell from '@/components/PostResultUpsell';
import { useToolPresets, type ToolPresetRecord } from '@/lib/hooks/useToolPresets';
import { ToolPresetBar } from '@/components/presets/ToolPresetBar';

type Mode = 'custom' | 'upload';
type VoiceId = 'female_soft' | 'male_hype' | 'robotic' | 'female_warm' | 'male_deep';
type ProducerTagPresetJson = {
  mode: Mode;
  phrase: string;
  voiceId: VoiceId;
  intervalSeconds: number;
  tagVolumeDb: number;
  sourceVolumeDb: number;
};
type ProducerTagPresetRecord = ToolPresetRecord<ProducerTagPresetJson>;

const VOICE_OPTIONS: { id: VoiceId; label: string; description: string }[] = [
  { id: 'female_soft', label: 'Female Soft', description: 'Smooth and subtle' },
  { id: 'male_hype', label: 'Male Hype', description: 'Energetic and bold' },
  { id: 'robotic', label: 'Robotic', description: 'Futuristic effect' },
  { id: 'female_warm', label: 'Female Warm', description: 'Friendly and inviting' },
  { id: 'male_deep', label: 'Male Deep', description: 'Low and powerful' },
];

export default function ProducerTagGeneratorClient() {
  const [file, setFile] = useState<File | null>(null);
  const [tagFile, setTagFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [tagDragActive, setTagDragActive] = useState(false);
  const [mode, setMode] = useState<Mode>('custom');
  const [phrase, setPhrase] = useState('');
  const [voiceId, setVoiceId] = useState<VoiceId>('female_soft');
  const [intervalSeconds, setIntervalSeconds] = useState(15);
  const [tagVolumeDb, setTagVolumeDb] = useState(-3);
  const [sourceVolumeDb, setSourceVolumeDb] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPreviewingTag, setIsPreviewingTag] = useState(false);
  const [isPreviewingMix, setIsPreviewingMix] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [trackDuration, setTrackDuration] = useState<number | null>(null);
  const [customTagPreviewUrl, setCustomTagPreviewUrl] = useState<string | null>(null);
  const [customPreviewVoiceId, setCustomPreviewVoiceId] = useState<VoiceId | null>(null);
  const [customPreviewPhrase, setCustomPreviewPhrase] = useState<string>('');
  const [uploadedTagPreviewUrl, setUploadedTagPreviewUrl] = useState<string | null>(null);
  const [mixPreviewUrl, setMixPreviewUrl] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [presetName, setPresetName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tagFileInputRef = useRef<HTMLInputElement>(null);
  const { presets, savingPreset, savePreset } = useToolPresets<ProducerTagPresetJson>({
    toolId: 'producer-tag-generator',
    originCloudId: 'music',
  });

  const validateAndSetFile = (selectedFile: File) => {
    if (selectedFile.size > 200 * 1024 * 1024) {
      setError('File too large. Maximum size is 200MB.');
      return;
    }
    const ext = selectedFile.name.split('.').pop()?.toLowerCase();
    if (!['mp3', 'wav'].includes(ext || '')) {
      setError('Invalid file type. Only MP3 and WAV files are supported.');
      return;
    }
    setFile(selectedFile);
    setError(null);
    setDownloadUrl(null);
    setTrackDuration(null);

    const objectUrl = URL.createObjectURL(selectedFile);
    const audio = new Audio(objectUrl);
    audio.preload = 'metadata';
    audio.onloadedmetadata = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        setTrackDuration(audio.duration);
      }
      URL.revokeObjectURL(objectUrl);
    };
    audio.onerror = () => {
      URL.revokeObjectURL(objectUrl);
    };
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      validateAndSetFile(selectedFile);
    }
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      validateAndSetFile(droppedFile);
    }
  };

  const handleTagFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    validateAndSetTagFile(selectedFile);
  };

  const validateAndSetTagFile = (selectedFile: File) => {
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('Tag snippet too large. Maximum size is 10MB.');
      return;
    }
    const ext = selectedFile.name.split('.').pop()?.toLowerCase();
    if (!['mp3', 'wav'].includes(ext || '')) {
      setError('Tag snippet must be MP3 or WAV.');
      return;
    }
    setTagFile(selectedFile);
    setError(null);
    setDownloadUrl(null);
  };

  const handleTagDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === 'dragenter' || e.type === 'dragover') {
      setTagDragActive(true);
    } else if (e.type === 'dragleave') {
      setTagDragActive(false);
    }
  };

  const handleTagDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setTagDragActive(false);

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      validateAndSetTagFile(droppedFile);
    }
  };

  const handlePreviewCustomTag = async () => {
    if (!phrase.trim()) {
      setError('Enter a producer tag phrase to preview.');
      return;
    }

    setIsPreviewingTag(true);
    setError(null);

    try {
      const response = await fetch('/api/producer-tag/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phrase,
          voiceId,
        }),
      });

      if (!response.ok) {
        let message = 'Failed to generate tag preview.';
        try {
          const errorData = await response.json();
          message = errorData?.error || message;
        } catch {}
        throw new Error(message);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setCustomTagPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
      setCustomPreviewVoiceId(voiceId);
      setCustomPreviewPhrase(phrase.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to preview tag');
    } finally {
      setIsPreviewingTag(false);
    }
  };

  useEffect(() => {
    if (!customTagPreviewUrl) return;
    if (customPreviewVoiceId !== voiceId || customPreviewPhrase !== phrase.trim()) {
      URL.revokeObjectURL(customTagPreviewUrl);
      setCustomTagPreviewUrl(null);
      setCustomPreviewVoiceId(null);
      setCustomPreviewPhrase('');
    }
  }, [voiceId, phrase, customTagPreviewUrl, customPreviewVoiceId, customPreviewPhrase]);

  useEffect(() => {
    if (!tagFile) {
      setUploadedTagPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      return;
    }

    const url = URL.createObjectURL(tagFile);
    setUploadedTagPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [tagFile]);

  useEffect(() => {
    return () => {
      if (customTagPreviewUrl) URL.revokeObjectURL(customTagPreviewUrl);
      if (uploadedTagPreviewUrl) URL.revokeObjectURL(uploadedTagPreviewUrl);
      if (mixPreviewUrl) URL.revokeObjectURL(mixPreviewUrl);
    };
  }, [customTagPreviewUrl, uploadedTagPreviewUrl, mixPreviewUrl]);

  useEffect(() => {
    if (!mixPreviewUrl) return;
    URL.revokeObjectURL(mixPreviewUrl);
    setMixPreviewUrl(null);
  }, [file, tagFile, mode, phrase, voiceId, intervalSeconds, tagVolumeDb, sourceVolumeDb]);

  const timestampPreview = useMemo(() => {
    if (!trackDuration || !Number.isFinite(trackDuration) || trackDuration <= 0) {
      return [];
    }

    const points: number[] = [];
    for (let t = 2; t < trackDuration; t += intervalSeconds) {
      points.push(t);
    }
    if (points.length === 0) {
      points.push(Math.min(2, trackDuration / 2));
    }
    return points;
  }, [trackDuration, intervalSeconds]);

  const formatTime = (seconds: number) => {
    const total = Math.max(0, Math.floor(seconds));
    const mins = Math.floor(total / 60);
    const secs = total % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePreviewMix = async () => {
    if (!file) {
      setError('Please upload an audio file first.');
      return;
    }
    if (mode === 'custom' && !phrase.trim()) {
      setError('Please enter your producer tag phrase.');
      return;
    }
    if (mode === 'upload' && !tagFile) {
      setError('Please upload a tag snippet (MP3 or WAV).');
      return;
    }

    setIsPreviewingMix(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('mode', mode);
      formData.append('intervalSeconds', intervalSeconds.toString());
      formData.append('tagVolumeDb', tagVolumeDb.toString());
      formData.append('sourceVolumeDb', sourceVolumeDb.toString());
      formData.append('phrase', phrase);
      formData.append('voiceId', voiceId);
      if (tagFile) {
        formData.append('tagFile', tagFile);
      }

      const response = await fetch('/api/producer-tag/mix-preview', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        let message = 'Failed to generate mix preview.';
        try {
          const data = await response.json();
          message = data?.error || message;
        } catch {}
        throw new Error(message);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setMixPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate mix preview');
    } finally {
      setIsPreviewingMix(false);
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      setError('Please upload an audio file first.');
      return;
    }

    if (mode === 'custom' && !phrase.trim()) {
      setError('Please enter your producer tag phrase.');
      return;
    }
    if (mode === 'upload' && !tagFile) {
      setError('Please upload a tag snippet (MP3 or WAV).');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setDownloadUrl(null);
    setStatus('Uploading your audio...');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('mode', mode);
      formData.append('intervalSeconds', intervalSeconds.toString());
      formData.append('tagVolumeDb', tagVolumeDb.toString());
      formData.append('sourceVolumeDb', sourceVolumeDb.toString());
      formData.append('phrase', phrase);
      formData.append('voiceId', voiceId);
      if (tagFile) {
        formData.append('tagFile', tagFile);
      }

      setStatus('Processing your audio with producer tag...');

      const response = await fetch('/api/producer-tag', {
        method: 'POST',
        body: formData,
      });

      const contentType = response.headers.get('content-type') || '';
      const isJson = contentType.includes('application/json');
      const data = isJson ? await response.json() : null;
      const textBody = isJson ? '' : await response.text();

      if (!response.ok) {
        const fromServer = data?.error || textBody;
        const fallbackMessage = `Request failed (${response.status}). The processing worker may have timed out.`;
        throw new Error((fromServer && String(fromServer).slice(0, 200)) || fallbackMessage);
      }

      setDownloadUrl(data.downloadUrl);
      setStatus('Your tagged audio is ready!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setStatus('');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSavePreset = async () => {
    const ok = await savePreset(presetName, {
      mode,
      phrase,
      voiceId,
      intervalSeconds,
      tagVolumeDb,
      sourceVolumeDb,
    });
    if (ok) setPresetName('');
  };

  const handleApplyPreset = (preset: ProducerTagPresetRecord) => {
    const payload = preset?.preset_json;
    if (!payload) return;
    setMode(payload.mode === 'upload' ? 'upload' : 'custom');
    setPhrase(payload.phrase ?? '');
    if (payload.voiceId && VOICE_OPTIONS.some((voice) => voice.id === payload.voiceId)) {
      setVoiceId(payload.voiceId);
    }
    setIntervalSeconds(Math.max(5, Math.min(60, payload.intervalSeconds ?? 15)));
    setSourceVolumeDb(Math.max(-20, Math.min(6, payload.sourceVolumeDb ?? 0)));
    setTagVolumeDb(Math.max(-20, Math.min(6, payload.tagVolumeDb ?? -3)));
    setShowAdvanced(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <Link href="/" className="text-orange-500 hover:text-orange-600 text-sm font-medium">
            ← Back to VCM Suite
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <section className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-orange-50 text-orange-600 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Music className="w-4 h-4" />
            Free Producer Tag Tool
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Free Producer Tag Generator
          </h1>
          
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Create a custom <strong>producer tag</strong> voice or upload your own tag snippet to protect your beats and vocals. 
            Upload your audio, choose your tag style, and download your tagged track in seconds.
          </p>
        </section>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 md:p-8 mb-12">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Upload Your Beat or Vocal
              </label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
                  ${file || dragActive ? 'border-orange-500 bg-orange-50' : 'border-gray-300 hover:border-gray-400'}`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".mp3,.wav"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {file ? (
                  <div className="flex items-center justify-center gap-3">
                    <CheckCircle className="w-6 h-6 text-orange-500" />
                    <span className="font-medium text-gray-900">{file.name}</span>
                    <span className="text-sm text-gray-500">
                      ({(file.size / 1024 / 1024).toFixed(1)} MB)
                    </span>
                  </div>
                ) : (
                  <>
                    <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 font-medium">
                      {dragActive ? 'Drop your MP3 or WAV here' : 'Drag & drop or click to upload MP3 or WAV'}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">Max 200MB</p>
                  </>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Tag Mode
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setMode('custom')}
                  className={`p-4 rounded-xl border-2 text-left transition-all
                    ${mode === 'custom' 
                      ? 'border-orange-500 bg-orange-50' 
                      : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <Sparkles className={`w-5 h-5 mb-2 ${mode === 'custom' ? 'text-orange-500' : 'text-gray-400'}`} />
                  <p className="font-semibold text-gray-900">Custom AI Voice</p>
                  <p className="text-sm text-gray-500">Create your own tag</p>
                </button>
                <button
                  onClick={() => setMode('upload')}
                  className={`p-4 rounded-xl border-2 text-left transition-all
                    ${mode === 'upload' 
                      ? 'border-orange-500 bg-orange-50' 
                      : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <Mic className={`w-5 h-5 mb-2 ${mode === 'upload' ? 'text-orange-500' : 'text-gray-400'}`} />
                  <p className="font-semibold text-gray-900">Upload Tag Snippet</p>
                  <p className="text-sm text-gray-500">Use your own voice drop</p>
                </button>
              </div>
            </div>

            {mode === 'custom' ? (
              <>
                <div>
                  <label htmlFor="phrase" className="block text-sm font-semibold text-gray-700 mb-2">
                    Your Producer Tag Phrase
                  </label>
                  <input
                    id="phrase"
                    type="text"
                    value={phrase}
                    onChange={(e) => setPhrase(e.target.value)}
                    placeholder='e.g. "Dimi Lowe Exclusive" or "Produced by Metro"'
                    maxLength={100}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">{phrase.length}/100 characters</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Voice Style
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {VOICE_OPTIONS.map((voice) => (
                      <button
                        key={voice.id}
                        onClick={() => setVoiceId(voice.id)}
                        className={`p-3 rounded-xl border-2 text-left transition-all
                          ${voiceId === voice.id 
                            ? 'border-orange-500 bg-orange-50' 
                            : 'border-gray-200 hover:border-gray-300'}`}
                      >
                        <p className="font-medium text-gray-900">{voice.label}</p>
                        <p className="text-xs text-gray-500">{voice.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={handlePreviewCustomTag}
                      disabled={isPreviewingTag}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-black disabled:opacity-60"
                    >
                      {isPreviewingTag ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4" />}
                      Preview AI Tag
                    </button>
                    <p className="text-xs text-gray-500">Preview uses your phrase + selected voice.</p>
                  </div>
                  {customTagPreviewUrl && (
                    <>
                      <p className="text-xs text-gray-500 mt-3">
                        Preview clip: <strong>{VOICE_OPTIONS.find((v) => v.id === customPreviewVoiceId)?.label || 'Selected voice'}</strong>
                      </p>
                      <audio controls src={customTagPreviewUrl} className="w-full mt-2" />
                    </>
                  )}
                </div>
              </>
            ) : (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Upload Tag Snippet (MP3 or WAV)
                </label>
                <div
                  onClick={() => tagFileInputRef.current?.click()}
                  onDragEnter={handleTagDrag}
                  onDragOver={handleTagDrag}
                  onDragLeave={handleTagDrag}
                  onDrop={handleTagDrop}
                  className={`border-2 border-dashed rounded-xl p-4 cursor-pointer transition-colors ${
                    tagFile || tagDragActive ? 'border-orange-500 bg-orange-50' : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <input
                    ref={tagFileInputRef}
                    type="file"
                    accept=".mp3,.wav"
                    onChange={handleTagFileChange}
                    className="hidden"
                  />
                  {tagFile ? (
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-gray-900 truncate">{tagFile.name}</p>
                      <p className="text-sm text-gray-500 whitespace-nowrap">
                        {(tagFile.size / 1024 / 1024).toFixed(1)} MB
                      </p>
                    </div>
                  ) : (
                    <p className="text-gray-600">
                      {tagDragActive
                        ? 'Drop your tag snippet here'
                        : 'Drag & drop or click to upload your tag snippet (recommended: under 5 seconds, max 10MB)'}
                    </p>
                  )}
                </div>
                {uploadedTagPreviewUrl && (
                  <audio controls src={uploadedTagPreviewUrl} className="w-full mt-3" />
                )}
              </div>
            )}

            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
              <p className="text-sm font-semibold text-gray-900 mb-1">Tag Placement Preview</p>
              {trackDuration ? (
                <>
                  <p className="text-xs text-gray-600 mb-3">
                    Track length: {formatTime(trackDuration)}. Tags start near 0:02, then every {intervalSeconds}s.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {timestampPreview.slice(0, 24).map((t, index) => (
                      <span key={`${t}-${index}`} className="px-2.5 py-1 rounded-full text-xs bg-white border border-orange-300 text-gray-700">
                        {formatTime(t)}
                      </span>
                    ))}
                    {timestampPreview.length > 24 && (
                      <span className="px-2.5 py-1 rounded-full text-xs bg-white border border-orange-300 text-gray-700">
                        +{timestampPreview.length - 24} more
                      </span>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-xs text-gray-600">
                  Upload a track to see exact tag timestamps.
                </p>
              )}
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={handlePreviewMix}
                  disabled={isPreviewingMix || isProcessing || !file}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-black disabled:opacity-60"
                >
                  {isPreviewingMix ? <Loader2 className="w-4 h-4 animate-spin" /> : <Music className="w-4 h-4" />}
                  Preview Full Mix
                </button>
                <p className="text-xs text-gray-500">Renders about 30 seconds using your current settings.</p>
              </div>
              {mixPreviewUrl && (
                <audio controls src={mixPreviewUrl} className="w-full mt-3" />
              )}
            </div>

            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
            >
              {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              Advanced Settings
            </button>

            {showAdvanced && (
              <div className="grid md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-xl">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Tag Interval (seconds)
                  </label>
                  <input
                    type="number"
                    value={intervalSeconds}
                    onChange={(e) => setIntervalSeconds(Math.max(5, Math.min(60, parseInt(e.target.value) || 15)))}
                    min={5}
                    max={60}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">How often the tag plays (5-60 seconds)</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Music className="w-4 h-4" />
                    Original Track Volume (dB)
                  </label>
                  <input
                    type="number"
                    value={sourceVolumeDb}
                    onChange={(e) => {
                      const parsed = parseInt(e.target.value, 10);
                      const safe = Number.isNaN(parsed) ? 0 : parsed;
                      setSourceVolumeDb(Math.max(-20, Math.min(6, safe)));
                    }}
                    min={-20}
                    max={6}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Lower this if your tag gets buried in the mix</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Volume2 className="w-4 h-4" />
                    Tag Volume (dB)
                  </label>
                  <input
                    type="number"
                    value={tagVolumeDb}
                    onChange={(e) => {
                      const parsed = parseInt(e.target.value, 10);
                      const safe = Number.isNaN(parsed) ? -3 : parsed;
                      setTagVolumeDb(Math.max(-20, Math.min(6, safe)));
                    }}
                    min={-20}
                    max={6}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Set to 0 to +6 dB for stronger tags</p>
                </div>
                <div className="md:col-span-3 text-xs text-gray-600">
                  Quick mix tip: start with <strong>Track -3 dB</strong> and <strong>Tag +3 dB</strong>, then adjust.
                </div>
              </div>
            )}

            <ToolPresetBar
              presetName={presetName}
              onPresetNameChange={setPresetName}
              onSave={handleSavePreset}
              saving={savingPreset}
              presets={presets}
              onApply={handleApplyPreset}
              lockedMessage="Subscribe to save producer tag presets."
            />

            {error && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-3 rounded-xl">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <button
              onClick={handleSubmit}
              data-track-output="true"
              disabled={isProcessing || !file}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {status}
                </>
              ) : (
                <>
                  <Music className="w-5 h-5" />
                  Generate Producer Tag
                </>
              )}
            </button>

            {downloadUrl && (
              <>
                <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                  <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
                  <p className="font-semibold text-gray-900 mb-4">Your tagged track is ready!</p>
                  <a
                    href={downloadUrl}
                    download
                    data-track-output="true"
                    data-output-url={downloadUrl}
                    data-output-name={file ? `tagged-${file.name.replace(/\.[^.]+$/, "")}.wav` : "tagged-audio.wav"}
                    className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
                  >
                    <Download className="w-5 h-5" />
                    Download Tagged Audio
                  </a>
                  <p className="text-xs text-gray-500 mt-3">Link expires in 30 minutes</p>
                </div>
                <PostResultUpsell />
              </>
            )}
          </div>
        </div>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            How This Producer Tag Generator Works
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-orange-600 font-bold">1</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Upload Your Beat</h3>
              <p className="text-sm text-gray-600">
                Upload any MP3 or WAV file up to 200MB. Works with beats, instrumentals, vocals, and full songs.
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-orange-600 font-bold">2</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Choose Your Tag</h3>
              <p className="text-sm text-gray-600">
                Create a custom producer tag with AI voice generation, or use our pre-made VCM Suite tags.
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-orange-600 font-bold">3</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Download & Use</h3>
              <p className="text-sm text-gray-600">
                Download your tagged audio with producer tags placed at your chosen intervals throughout the track.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-gray-50 rounded-2xl p-6 md:p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            What is a Producer Tag?
          </h2>
          <div className="prose prose-gray max-w-none">
            <p>
              A <strong>producer tag</strong> is an audio signature or voice drop that music producers place in their beats 
              and instrumentals. It's a short audio clip—usually the producer's name or brand—that identifies who made 
              the beat. Producer tags are essential for protecting your work and building brand recognition in the music industry.
            </p>
            <h3>Why Producers Use Tags</h3>
            <p>
              There are several important reasons why every beat maker should use a producer tag:
            </p>
            <ul>
              <li><strong>Prevent Theft:</strong> Tags make it harder for people to steal and claim your beats as their own.</li>
              <li><strong>Brand Building:</strong> Hearing your producer tag helps artists and listeners remember your name.</li>
              <li><strong>Professionalism:</strong> Tags show that you take your craft seriously as a producer.</li>
              <li><strong>Watermarking:</strong> Tags protect your beat previews before the customer purchases the lease.</li>
            </ul>
            <h3>How Our Producer Tag Generator Works</h3>
            <p>
              Our free <strong>producer tag voice generator</strong> uses AI technology to create custom voice tags. Simply 
              type your producer name or phrase, choose a voice style, and we'll generate a professional-sounding tag. 
              The tool then places your producer tag at regular intervals throughout your beat, creating a fully tagged 
              preview ready to upload to your beat store or social media.
            </p>
            <p>
              Whether you need to <strong>make your own producer tag</strong> for the first time or want to refresh your 
              existing sound, this tool gives you professional results in seconds—completely free.
            </p>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Is this producer tag generator really free?</h3>
              <p className="text-sm text-gray-600">
                Yes! Our producer tag generator is completely free to use. You can create custom AI voice tags 
                and download your tagged beats at no cost. We limit usage to 5 tags per hour to keep the service 
                free for everyone.
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-2">What audio formats are supported?</h3>
              <p className="text-sm text-gray-600">
                You can upload MP3 and WAV files up to 200MB. The processed output is always delivered as a 
                high-quality MP3 file at 192kbps, perfect for beat stores and streaming platforms.
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Can I use the custom voice tags commercially?</h3>
              <p className="text-sm text-gray-600">
                Absolutely! The producer tags you create are yours to use however you want—in your beats, 
                on streaming platforms, in your beat store, and anywhere else. There are no licensing restrictions.
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-2">How do I get a producer tag download without the beat?</h3>
              <p className="text-sm text-gray-600">
                Currently, this tool outputs the full tagged beat. For just the tag audio file itself, try 
                uploading a very short silent audio clip—the tag will be added and you can extract it from 
                the output.
              </p>
            </div>
          </div>
        </section>

        <ExploreMoreTools currentTool="producer-tag-generator" />
      </main>

      <footer className="border-t border-gray-200 bg-white py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} VCM Suite. All rights reserved.</p>
          <p className="mt-2">
            Free producer tag generator powered by AI voice technology.
          </p>
        </div>
      </footer>
    </div>
  );
}
