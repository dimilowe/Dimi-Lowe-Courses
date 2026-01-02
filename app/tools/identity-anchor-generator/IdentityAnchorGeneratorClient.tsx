"use client";

import { useState, useRef, useCallback } from "react";
import { STYLE_PRESETS, StylePreset, MAX_CONCEPT_ATTEMPTS, MAX_ANCHOR_ATTEMPTS } from "@/lib/identityAnchor/types";

type Step = "describe" | "concept" | "lock" | "save";

function LoadingOverlay({ message }: { message: string }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-md mx-4 text-center shadow-2xl">
        <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Generating...</h3>
        <p className="text-gray-600">{message}</p>
        <p className="text-sm text-gray-400 mt-4">This may take 15-30 seconds</p>
      </div>
    </div>
  );
}

interface ConceptResult {
  job_id: string;
  concept_image_key: string;
  concept_image_base64: string;
  concept_attempts: number;
}

interface LockResult {
  job_id: string;
  anchors: {
    front: string;
    profile: string;
    action: string;
  };
  anchor_base64s: {
    front: string;
    profile: string;
    action: string;
  };
  anchor_attempts: number;
}

export default function IdentityAnchorGeneratorClient() {
  const [step, setStep] = useState<Step>("describe");
  const [characterDescription, setCharacterDescription] = useState("");
  const [sceneDescription, setSceneDescription] = useState("");
  const [stylePreset, setStylePreset] = useState<StylePreset>("anime_cinematic_v1");
  
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [imageLoadKey, setImageLoadKey] = useState(0);
  
  const [conceptResult, setConceptResult] = useState<ConceptResult | null>(null);
  const [lockResult, setLockResult] = useState<LockResult | null>(null);
  const [packId, setPackId] = useState<string | null>(null);
  const [packName, setPackName] = useState("");
  
  const [isDragging, setIsDragging] = useState(false);
  const [isUploaded, setIsUploaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const steps: { key: Step; label: string; number: number }[] = [
    { key: "describe", label: "Describe", number: 1 },
    { key: "concept", label: "Concept", number: 2 },
    { key: "lock", label: "Lock Identity", number: 3 },
    { key: "save", label: "Save Pack", number: 4 },
  ];

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  const handleFileUpload = async (file: File) => {
    if (!characterDescription.trim()) {
      setError("Please describe your character before uploading");
      return;
    }

    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setError("Please upload a PNG, JPEG, or WebP image");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("File too large. Maximum size is 10MB");
      return;
    }

    setIsLoading(true);
    setLoadingMessage("Uploading your concept image...");
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("character_description", characterDescription);
      if (sceneDescription) formData.append("scene_description", sceneDescription);
      formData.append("style_preset", stylePreset);

      const response = await fetch("/api/tools/identity-anchor-generator/upload-concept", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!data.ok) {
        throw new Error(data.error || "Failed to upload image");
      }

      setConceptResult({
        job_id: data.job_id,
        concept_image_key: data.concept_image_key,
        concept_image_base64: data.concept_image_base64,
        concept_attempts: 0,
      });
      setIsUploaded(true);
      setImageLoadKey(prev => prev + 1);
      setStep("concept");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
    }
  };

  const generateConcept = async (regenerate = false) => {
    if (!characterDescription.trim()) {
      setError("Please describe your character");
      return;
    }

    setIsLoading(true);
    setLoadingMessage(regenerate ? "Regenerating your character concept..." : "Creating your character concept with AI...");
    setError(null);
    setIsUploaded(false);

    try {
      const response = await fetch("/api/tools/identity-anchor-generator/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "concept",
          job_id: regenerate ? conceptResult?.job_id : undefined,
          inputs: {
            character_description: characterDescription,
            scene_description: sceneDescription || undefined,
            style_preset: stylePreset,
          },
        }),
      });

      const data = await response.json();
      if (!data.ok) {
        throw new Error(data.error || "Failed to generate concept");
      }

      setConceptResult({
        job_id: data.job_id,
        concept_image_key: data.concept_image_key,
        concept_image_base64: data.concept_image_base64,
        concept_attempts: data.concept_attempts,
      });
      setImageLoadKey(prev => prev + 1);
      setStep("concept");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
    }
  };

  const lockIdentity = async (regenerate = false) => {
    if (!conceptResult) {
      setError("Generate a concept first");
      return;
    }

    setIsLoading(true);
    setLoadingMessage(regenerate ? "Regenerating anchor poses..." : "Generating 3 anchor poses (front, profile, action)...");
    setError(null);

    try {
      const response = await fetch("/api/tools/identity-anchor-generator/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "lock",
          job_id: regenerate ? lockResult?.job_id : conceptResult.job_id,
          inputs: {
            character_description: characterDescription,
            scene_description: sceneDescription || undefined,
            style_preset: stylePreset,
            concept_image_key: conceptResult.concept_image_key,
          },
        }),
      });

      const data = await response.json();
      if (!data.ok) {
        throw new Error(data.error || "Failed to generate anchors");
      }

      setLockResult({
        job_id: data.job_id,
        anchors: data.anchors,
        anchor_base64s: data.anchor_base64s,
        anchor_attempts: data.anchor_attempts,
      });
      setImageLoadKey(prev => prev + 1);
      setStep("lock");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
    }
  };

  const savePack = async () => {
    if (!lockResult) {
      setError("Lock identity first");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/tools/identity-anchor-generator/save-pack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_id: lockResult.job_id,
          name: packName || undefined,
        }),
      });

      const data = await response.json();
      if (!data.ok) {
        throw new Error(data.error || "Failed to save pack");
      }

      setPackId(data.character_pack_id);
      setStep("save");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getImageUrl = (type: "concept" | "front" | "profile" | "action") => {
    if (type === "concept" && conceptResult?.concept_image_base64) {
      return `data:image/png;base64,${conceptResult.concept_image_base64}`;
    }
    if (lockResult?.anchor_base64s) {
      const base64 = lockResult.anchor_base64s[type as "front" | "profile" | "action"];
      if (base64) {
        return `data:image/png;base64,${base64}`;
      }
    }
    return null;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {isLoading && loadingMessage && <LoadingOverlay message={loadingMessage} />}
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          VCM Identity Anchor Generator
        </h1>
        <p className="text-gray-600">
          Create a character concept, then lock their identity into three anchor poses for consistent AI video.
        </p>
      </div>

      <div className="flex items-center justify-between mb-8 bg-gray-50 rounded-xl p-4">
        {steps.map((s, idx) => (
          <div key={s.key} className="flex items-center">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
              step === s.key 
                ? "bg-orange-500 text-white" 
                : steps.findIndex(x => x.key === step) > idx 
                  ? "bg-green-500 text-white"
                  : "bg-gray-200 text-gray-500"
            }`}>
              {steps.findIndex(x => x.key === step) > idx ? "✓" : s.number}
            </div>
            <span className={`ml-2 text-sm font-medium ${
              step === s.key ? "text-gray-900" : "text-gray-500"
            }`}>
              {s.label}
            </span>
            {idx < steps.length - 1 && (
              <div className="w-12 h-0.5 bg-gray-200 mx-4" />
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {step === "describe" && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Character Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={characterDescription}
              onChange={(e) => setCharacterDescription(e.target.value)}
              placeholder="A young woman with silver hair, green eyes, wearing a black leather jacket with a silver dog tag necklace..."
              className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
            <p className="mt-1 text-sm text-gray-500">
              Describe your character's appearance in detail. This becomes the identity spec.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Scene Description (Optional)
            </label>
            <textarea
              value={sceneDescription}
              onChange={(e) => setSceneDescription(e.target.value)}
              placeholder="Neon-lit cyberpunk city street at night..."
              className="w-full h-24 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
            <p className="mt-1 text-sm text-gray-500">
              Optional scene context for the concept. Anchors use neutral backgrounds.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Style Preset
            </label>
            <select
              value={stylePreset}
              onChange={(e) => setStylePreset(e.target.value as StylePreset)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              {STYLE_PRESETS.map((preset) => (
                <option key={preset.value} value={preset.value}>
                  {preset.label} - {preset.description}
                </option>
              ))}
            </select>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-sm text-gray-500">Choose one</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <button
                onClick={() => generateConcept(false)}
                disabled={isLoading || !characterDescription.trim()}
                className="py-4 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white font-semibold rounded-lg transition-colors"
              >
                {isLoading ? "Generating..." : "Generate with AI"}
              </button>
              
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleFileDrop}
                onClick={() => characterDescription.trim() && fileInputRef.current?.click()}
                className={`py-4 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${
                  isDragging 
                    ? "border-orange-500 bg-orange-50" 
                    : characterDescription.trim()
                      ? "border-gray-300 hover:border-orange-400 hover:bg-orange-50"
                      : "border-gray-200 bg-gray-50 cursor-not-allowed"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className={`font-medium ${characterDescription.trim() ? "text-gray-700" : "text-gray-400"}`}>
                  <svg className="w-6 h-6 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Upload Your Own
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Drop image or click to browse
                </p>
              </div>
            </div>
            
            <p className="text-center text-sm text-gray-500 mt-4">
              Tip: Generate your concept in ChatGPT for better photorealism, then upload it here
            </p>
          </div>
        </div>
      )}

      {step === "concept" && conceptResult && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Character Concept</h2>
            {isUploaded && (
              <span className="inline-block mb-3 px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                Uploaded Image
              </span>
            )}
            <div className="inline-block rounded-xl overflow-hidden shadow-lg">
              <img
                src={getImageUrl("concept")!}
                alt="Character concept"
                className="max-w-md w-full h-auto"
              />
            </div>
            {!isUploaded && (
              <p className="mt-4 text-sm text-gray-500">
                Attempts: {conceptResult.concept_attempts} / {MAX_CONCEPT_ATTEMPTS}
              </p>
            )}
          </div>

          <div className="flex gap-4">
            {!isUploaded ? (
              <button
                onClick={() => generateConcept(true)}
                disabled={isLoading || conceptResult.concept_attempts >= MAX_CONCEPT_ATTEMPTS}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-100 disabled:text-gray-400 text-gray-700 font-medium rounded-lg transition-colors"
              >
                {isLoading ? "Regenerating..." : "Regenerate"}
              </button>
            ) : (
              <button
                onClick={() => { setStep("describe"); setConceptResult(null); setIsUploaded(false); }}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
              >
                Upload Different Image
              </button>
            )}
            <button
              onClick={() => lockIdentity(false)}
              disabled={isLoading}
              className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white font-semibold rounded-lg transition-colors"
            >
              {isLoading ? "Locking..." : "Lock Identity"}
            </button>
          </div>

          <button
            onClick={() => setStep("describe")}
            className="w-full py-2 text-gray-500 hover:text-gray-700 text-sm"
          >
            ← Back to description
          </button>
        </div>
      )}

      {step === "lock" && lockResult && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Identity Locked</h2>
            <p className="text-gray-600 mb-6">
              Three anchor poses generated for consistent character appearance.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {(["front", "profile", "action"] as const).map((pose) => (
              <div key={pose} className="text-center">
                <div className="rounded-lg overflow-hidden shadow-md mb-2">
                  <img
                    src={getImageUrl(pose)!}
                    alt={`${pose} pose`}
                    className="w-full h-auto"
                  />
                </div>
                <span className="text-sm font-medium text-gray-700 capitalize">
                  {pose}
                </span>
              </div>
            ))}
          </div>

          <p className="text-center text-sm text-gray-500">
            Anchor attempts: {lockResult.anchor_attempts} / {MAX_ANCHOR_ATTEMPTS}
          </p>

          <div className="flex gap-4">
            <button
              onClick={() => lockIdentity(true)}
              disabled={isLoading || lockResult.anchor_attempts >= MAX_ANCHOR_ATTEMPTS}
              className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-100 disabled:text-gray-400 text-gray-700 font-medium rounded-lg transition-colors"
            >
              {isLoading ? "Regenerating..." : "Regenerate Anchors"}
            </button>
            <button
              onClick={() => setStep("save")}
              disabled={isLoading}
              className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white font-semibold rounded-lg transition-colors"
            >
              Save Character Pack
            </button>
          </div>

          <button
            onClick={() => setStep("concept")}
            className="w-full py-2 text-gray-500 hover:text-gray-700 text-sm"
          >
            ← Back to concept
          </button>
        </div>
      )}

      {step === "save" && !packId && lockResult && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Save Character Pack</h2>
            <p className="text-gray-600 mb-6">
              Give your character a name and save the pack for use in Motion Compiler.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Character Name (Optional)
            </label>
            <input
              type="text"
              value={packName}
              onChange={(e) => setPackName(e.target.value)}
              placeholder="Luna, Cyborg Girl, etc."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          <button
            onClick={savePack}
            disabled={isLoading}
            className="w-full py-4 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white font-semibold rounded-lg transition-colors"
          >
            {isLoading ? "Saving..." : "Save Character Pack"}
          </button>

          <button
            onClick={() => setStep("lock")}
            className="w-full py-2 text-gray-500 hover:text-gray-700 text-sm"
          >
            ← Back to anchors
          </button>
        </div>
      )}

      {step === "save" && packId && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Character Pack Saved!</h2>
            <p className="text-gray-600 mb-4">
              Your character is ready for use in VCM Motion Compiler.
            </p>
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-500 mb-1">Pack ID</p>
              <code className="text-sm font-mono text-gray-900 break-all">{packId}</code>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            {(["front", "profile", "action"] as const).map((pose) => (
              <div key={pose} className="text-center">
                <div className="rounded-lg overflow-hidden shadow-md">
                  <img
                    src={getImageUrl(pose)!}
                    alt={`${pose} pose`}
                    className="w-full h-auto"
                  />
                </div>
              </div>
            ))}
          </div>

          <a
            href={`/tools/vcm-motion-compiler?character_pack_id=${packId}`}
            className="block w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg text-center transition-colors"
          >
            Use in Motion Compiler →
          </a>

          <button
            onClick={() => {
              setStep("describe");
              setConceptResult(null);
              setLockResult(null);
              setPackId(null);
              setPackName("");
              setIsUploaded(false);
            }}
            className="w-full py-2 text-gray-500 hover:text-gray-700 text-sm"
          >
            Create Another Character
          </button>
        </div>
      )}
    </div>
  );
}
