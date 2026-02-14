'use client';

import { useState, useCallback, useRef } from 'react';
import { 
  Upload, 
  Image as ImageIcon, 
  Loader2, 
  Copy, 
  Check, 
  RefreshCw, 
  X,
  Sparkles,
  Layout,
  Type,
  Lock,
  ChevronDown,
  FileText,
  Layers,
  Target
} from 'lucide-react';
import { useToolPresets, type ToolPresetRecord } from '@/lib/hooks/useToolPresets';
import { ToolPresetBar } from '@/components/presets/ToolPresetBar';
import {
  StyleShiftOptions,
  PresetOptions,
  calculatePromptQualityScore,
  getScoreGrade,
  formatBundleCopy,
  type StyleShift,
  type PresetId,
  type ImageToPromptResponse,
  type Variant
} from '@/lib/image-to-prompt/types';

export default function ImageToPromptClient() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImageToPromptResponse | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [preserveLayout, setPreserveLayout] = useState(true);
  const [keepTextExact, setKeepTextExact] = useState(false);
  const [subjectLock, setSubjectLock] = useState(true);
  const [styleShift, setStyleShift] = useState<StyleShift>('None');
  const [preset, setPreset] = useState<PresetId>('none');
  const [presetName, setPresetName] = useState('');
  const { presets: savedPresets, savingPreset, savePreset } = useToolPresets<{
    preserveLayout?: boolean;
    keepTextExact?: boolean;
    subjectLock?: boolean;
    styleShift?: StyleShift;
    preset?: PresetId;
  }>({
    toolId: 'image-to-prompt',
    originCloudId: 'creation',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((selectedFile: File) => {
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(selectedFile.type)) {
      setError('Invalid file type. Supported: PNG, JPG, JPEG, WEBP');
      return;
    }
    if (selectedFile.size > 8 * 1024 * 1024) {
      setError('File too large. Maximum size is 8MB');
      return;
    }
    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
    setError(null);
    setResult(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFileSelect(droppedFile);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleClear = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleGenerate = async () => {
    if (!file) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('preserveLayout', preserveLayout.toString());
      formData.append('keepTextExact', keepTextExact.toString());
      formData.append('subjectLock', subjectLock.toString());
      formData.append('styleShift', styleShift);
      formData.append('preset', preset);

      const res = await fetch('/api/image-to-prompt', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate prompts');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async (variantId: string) => {
    if (!file || !result) return;
    
    setRegeneratingId(variantId);
    
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('variantId', variantId);
      formData.append('preserveLayout', preserveLayout.toString());
      formData.append('keepTextExact', keepTextExact.toString());
      formData.append('subjectLock', subjectLock.toString());
      formData.append('styleShift', styleShift);
      formData.append('preset', preset);
      formData.append('subjectDescription', result.details.subject);

      const res = await fetch('/api/image-to-prompt/regenerate', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to regenerate prompt');
      }

      setResult(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          variants: prev.variants.map(v => 
            v.id === variantId ? { ...data, id: variantId as Variant['id'] } : v
          )
        };
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to regenerate');
    } finally {
      setRegeneratingId(null);
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const copyBundle = async () => {
    if (!result) return;
    const bundle = formatBundleCopy(result.variants, result.negative_prompt, result.details);
    await copyToClipboard(bundle, 'bundle');
  };

  const handleSavePreset = async () => {
    const didSave = await savePreset(presetName, {
      preserveLayout,
      keepTextExact,
      subjectLock,
      styleShift,
      preset,
    });
    if (didSave) {
      setPresetName('');
    }
  };

  const applySavedPreset = (
    savedPreset: ToolPresetRecord<{
      preserveLayout?: boolean;
      keepTextExact?: boolean;
      subjectLock?: boolean;
      styleShift?: StyleShift;
      preset?: PresetId;
    }>
  ) => {
    const p = savedPreset.preset_json || {};
    if (typeof p.preserveLayout === 'boolean') setPreserveLayout(p.preserveLayout);
    if (typeof p.keepTextExact === 'boolean') setKeepTextExact(p.keepTextExact);
    if (typeof p.subjectLock === 'boolean') setSubjectLock(p.subjectLock);
    if (p.styleShift) setStyleShift(p.styleShift);
    if (p.preset) setPreset(p.preset);
  };

  const qualityScore = result ? calculatePromptQualityScore(result.details, result.negative_prompt) : 0;
  const scoreGrade = result ? getScoreGrade(qualityScore) : '';

  return (
    <div className="space-y-6">
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2 flex items-center justify-center gap-2 text-sm text-emerald-700">
        <Lock className="w-4 h-4" />
        Runs in your browser. No data stored on our servers.
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => !preview && fileInputRef.current?.click()}
            className={`
              relative border-2 border-dashed rounded-xl p-8 text-center transition-all
              ${preview ? 'border-gray-300 bg-gray-50' : 'border-gray-300 hover:border-orange-400 hover:bg-orange-50 cursor-pointer'}
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              className="hidden"
            />
            
            {preview ? (
              <div className="relative">
                <img src={preview} alt="Preview" className="max-h-64 mx-auto rounded-lg" />
                <button
                  onClick={(e) => { e.stopPropagation(); handleClear(); }}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="py-8">
                <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 font-medium mb-1">Drop your image here</p>
                <p className="text-sm text-gray-500">or click to upload</p>
                <p className="text-xs text-gray-400 mt-2">PNG, JPG, WEBP up to 8MB</p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Image Type Preset</label>
              <div className="flex flex-wrap gap-2">
                {PresetOptions.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPreset(p.id)}
                    className={`px-3 py-1.5 text-sm rounded-lg border transition-all ${
                      preset === p.id
                        ? 'bg-orange-500 text-white border-orange-500'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-orange-400'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={preserveLayout}
                  onChange={(e) => setPreserveLayout(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                />
                <Layout className="w-4 h-4 text-gray-500 group-hover:text-orange-500" />
                <span className="text-sm text-gray-700">Preserve exact layout/composition</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={keepTextExact}
                  onChange={(e) => setKeepTextExact(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                />
                <Type className="w-4 h-4 text-gray-500 group-hover:text-orange-500" />
                <span className="text-sm text-gray-700">Keep text exact (if any)</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={subjectLock}
                  onChange={(e) => setSubjectLock(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                />
                <Target className="w-4 h-4 text-gray-500 group-hover:text-orange-500" />
                <span className="text-sm text-gray-700">Subject lock (keep subject identical)</span>
              </label>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Style Shift</label>
              <div className="relative">
                <select
                  value={styleShift}
                  onChange={(e) => setStyleShift(e.target.value as StyleShift)}
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg appearance-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  {StyleShiftOptions.map((style) => (
                    <option key={style} value={style}>{style}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <ToolPresetBar
              presetName={presetName}
              onPresetNameChange={setPresetName}
              onSave={handleSavePreset}
              saving={savingPreset}
              presets={savedPresets}
              onApply={applySavedPreset}
            />

            <button
              onClick={handleGenerate}
              data-track-output="true"
              disabled={!file || loading}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 px-6 rounded-lg font-medium hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing Image...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate Prompts
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-semibold text-gray-900">Generated Prompts</h2>
              <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-lg">
                <span className="text-sm text-gray-600">Prompt Quality:</span>
                <span className={`font-bold ${
                  qualityScore >= 80 ? 'text-green-600' :
                  qualityScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {qualityScore}/100 ({scoreGrade})
                </span>
              </div>
            </div>
            <button
              onClick={copyBundle}
              data-track-output="true"
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              {copiedId === 'bundle' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              Copy Bundle
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {result.variants.map((variant) => (
              <VariantCard
                key={variant.id}
                variant={variant}
                copiedId={copiedId}
                regeneratingId={regeneratingId}
                onCopy={copyToClipboard}
                onRegenerate={handleRegenerate}
              />
            ))}

            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                    <X className="w-4 h-4 text-red-600" />
                  </div>
                  <h3 className="font-medium text-gray-900">Negative Prompt</h3>
                </div>
                <button
                  onClick={() => copyToClipboard(result.negative_prompt, 'negative')}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {copiedId === 'negative' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">{result.negative_prompt}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-orange-500" />
              Image Details Breakdown
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(result.details).map(([key, value]) => (
                <div key={key} className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">
                    {key.replace(/_/g, ' ')}
                  </p>
                  <p className="text-sm text-gray-700">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {result.layout_map && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Layers className="w-5 h-5 text-orange-500" />
                Layout Map
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">Aspect Ratio</p>
                  <p className="text-sm text-gray-700 font-medium">{result.layout_map.aspect_ratio}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">Subject Position</p>
                  <p className="text-sm text-gray-700">{result.layout_map.subject_position}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">Foreground</p>
                  <p className="text-sm text-gray-700">{result.layout_map.foreground}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">Midground</p>
                  <p className="text-sm text-gray-700">{result.layout_map.midground}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">Background</p>
                  <p className="text-sm text-gray-700">{result.layout_map.background}</p>
                </div>
                {result.layout_map.notable_objects_positions.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs font-medium text-gray-500 uppercase mb-1">Notable Objects</p>
                    <div className="space-y-1">
                      {result.layout_map.notable_objects_positions.map((obj, i) => (
                        <p key={i} className="text-sm text-gray-700">
                          <span className="font-medium">{obj.object}</span>: {obj.position}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function VariantCard({
  variant,
  copiedId,
  regeneratingId,
  onCopy,
  onRegenerate
}: {
  variant: Variant;
  copiedId: string | null;
  regeneratingId: string | null;
  onCopy: (text: string, id: string) => void;
  onRegenerate: (id: string) => void;
}) {
  const icons: Record<string, React.ReactNode> = {
    faithful: <ImageIcon className="w-4 h-4 text-blue-600" />,
    detailed: <FileText className="w-4 h-4 text-purple-600" />,
    simplified: <Sparkles className="w-4 h-4 text-green-600" />,
    style_shift: <Layers className="w-4 h-4 text-pink-600" />,
    remix: <RefreshCw className="w-4 h-4 text-orange-600" />
  };

  const colors: Record<string, string> = {
    faithful: 'bg-blue-100',
    detailed: 'bg-purple-100',
    simplified: 'bg-green-100',
    style_shift: 'bg-pink-100',
    remix: 'bg-orange-100'
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 ${colors[variant.id]} rounded-lg flex items-center justify-center`}>
            {icons[variant.id]}
          </div>
          <h3 className="font-medium text-gray-900 text-sm">{variant.title}</h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onRegenerate(variant.id)}
            disabled={regeneratingId === variant.id}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            title="Regenerate this variant"
          >
            <RefreshCw className={`w-4 h-4 ${regeneratingId === variant.id ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => onCopy(variant.prompt, variant.id)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {copiedId === variant.id ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>
      <p className="text-sm text-gray-600 leading-relaxed line-clamp-6">{variant.prompt}</p>
      {variant.id === 'simplified' && (
        <p className="text-xs text-gray-400 mt-2">{variant.prompt.length}/240 chars</p>
      )}
    </div>
  );
}
