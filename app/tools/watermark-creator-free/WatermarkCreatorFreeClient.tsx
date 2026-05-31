"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Download, Image as ImageIcon, Type, Upload } from "lucide-react";
import { useToolPresets, type ToolPresetRecord } from "@/lib/hooks/useToolPresets";
import { ToolPresetBar } from "@/components/presets/ToolPresetBar";
import { TOOL_QUICK_IMPORT_EVENT, type ToolQuickImportDetail } from "@/lib/workspace/toolQuickImport";
import { fileFromWorkspaceDrag } from "@/lib/workspace/workspaceDragImport";

type Position =
  | "top-left"
  | "top-center"
  | "top-right"
  | "center-left"
  | "center"
  | "center-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

type WatermarkStyle = "single" | "diagonal-repeat" | "grid-repeat" | "document-security";

type WatermarkPresetJson = {
  mode?: "text" | "image";
  text?: string;
  fontSize?: number;
  color?: string;
  opacity?: number;
  rotation?: number;
  padding?: number;
  position?: Position;
  watermarkStyle?: WatermarkStyle;
  imageScale?: number;
  outputFormat?: "png" | "jpeg";
  jpegQuality?: number;
};

type WatermarkToolPreset = ToolPresetRecord<WatermarkPresetJson>;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });
}

function getPosition(
  position: Position,
  canvasWidth: number,
  canvasHeight: number,
  elementWidth: number,
  elementHeight: number,
  padding: number
) {
  const xMap: Record<string, number> = {
    left: padding,
    center: (canvasWidth - elementWidth) / 2,
    right: canvasWidth - elementWidth - padding,
  };
  const yMap: Record<string, number> = {
    top: padding,
    center: (canvasHeight - elementHeight) / 2,
    bottom: canvasHeight - elementHeight - padding,
  };

  if (position === "center") {
    return { x: xMap.center, y: yMap.center };
  }
  const [verticalRaw, horizontalRaw] = position.split("-");
  const vertical = verticalRaw || "center";
  const horizontal = horizontalRaw || "center";
  return {
    x: xMap[horizontal] ?? xMap.center,
    y: yMap[vertical] ?? yMap.center,
  };
}

export default function WatermarkCreatorFreeClient() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const baseUrlRef = useRef<string | null>(null);
  const watermarkUrlRef = useRef<string | null>(null);

  const [baseImageUrl, setBaseImageUrl] = useState<string | null>(null);
  const [watermarkImageUrl, setWatermarkImageUrl] = useState<string | null>(null);
  const [mode, setMode] = useState<"text" | "image">("text");

  const [text, setText] = useState("© Your Brand");
  const [fontSize, setFontSize] = useState(48);
  const [color, setColor] = useState("#ffffff");
  const [opacity, setOpacity] = useState(0.68);
  const [rotation, setRotation] = useState(0);
  const [padding, setPadding] = useState(24);
  const [position, setPosition] = useState<Position>("center");
  const [watermarkStyle, setWatermarkStyle] = useState<WatermarkStyle>("single");
  const [imageScale, setImageScale] = useState(0.22);
  const [outputFormat, setOutputFormat] = useState<"png" | "jpeg">("png");
  const [jpegQuality, setJpegQuality] = useState(0.92);
  const [isDraggingBase, setIsDraggingBase] = useState(false);
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [canSavePresets, setCanSavePresets] = useState(false);
  const { presets, savingPreset, savePreset } = useToolPresets<WatermarkPresetJson>({
    toolId: "watermark-creator-free",
    originCloudId: "creation",
  });

  useEffect(() => {
    async function fetchCapabilities() {
      try {
        const res = await fetch("/api/user/subscription-capabilities");
        if (!res.ok) return;
        const data = await res.json();
        setCanSavePresets(Boolean(data?.canSavePresets));
      } catch {
        setCanSavePresets(false);
      }
    }

    fetchCapabilities();
  }, []);

  const canDownload = useMemo(() => {
    if (!baseImageUrl) return false;
    if (mode === "text") return Boolean(text.trim());
    return Boolean(watermarkImageUrl);
  }, [baseImageUrl, mode, text, watermarkImageUrl]);

  useEffect(() => {
    return () => {
      if (baseUrlRef.current) URL.revokeObjectURL(baseUrlRef.current);
      if (watermarkUrlRef.current) URL.revokeObjectURL(watermarkUrlRef.current);
    };
  }, []);

  useEffect(() => {
    let isCancelled = false;

    async function drawPreview() {
      const canvas = canvasRef.current;
      if (!canvas || !baseImageUrl) return;

      const base = await loadImage(baseImageUrl);
      if (isCancelled) return;

      const maxWidth = 1400;
      const maxHeight = 1400;
      const ratio = Math.min(maxWidth / base.width, maxHeight / base.height, 1);
      const width = Math.round(base.width * ratio);
      const height = Math.round(base.height * ratio);

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(base, 0, 0, width, height);
      ctx.globalAlpha = opacity;

      if (mode === "text") {
        const fontPx = Math.max(14, Math.round(fontSize * ratio));
        ctx.fillStyle = color;
        ctx.font = `700 ${fontPx}px Arial, Helvetica, sans-serif`;
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";

        const textWidth = Math.max(1, ctx.measureText(text).width);
        const textHeight = fontPx * 1.2;
        const scaledPadding = Math.max(8, Math.round(padding * ratio));

        const drawTextMark = (cx: number, cy: number, rotateDeg: number) => {
          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate((rotateDeg * Math.PI) / 180);
          // Add outline + subtle shadow so watermark is visible over light and dark areas.
          ctx.strokeStyle = "rgba(0,0,0,0.55)";
          ctx.lineWidth = Math.max(1, fontPx * 0.08);
          ctx.shadowColor = "rgba(0,0,0,0.35)";
          ctx.shadowBlur = Math.max(2, fontPx * 0.08);
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 1;
          ctx.strokeText(text, 0, 0);
          ctx.fillText(text, 0, 0);
          ctx.restore();
        };

        if (watermarkStyle === "single") {
          const { x, y } = getPosition(position, width, height, textWidth, textHeight, scaledPadding);
          drawTextMark(x + textWidth / 2, y + textHeight / 2, rotation);
        } else {
          const spacingX = Math.max(90, textWidth * (watermarkStyle === "document-security" ? 1.8 : 2.2));
          const spacingY = Math.max(70, textHeight * (watermarkStyle === "document-security" ? 2.1 : 2.5));
          const baseAngle = watermarkStyle === "grid-repeat" ? rotation : rotation || -28;

          for (let row = -1, y = -textHeight; y <= height + textHeight; row++, y += spacingY) {
            const offset =
              watermarkStyle === "diagonal-repeat" || watermarkStyle === "document-security"
                ? (row % 2 === 0 ? 0 : spacingX / 2)
                : 0;

            for (let x = -textWidth + offset; x <= width + textWidth; x += spacingX) {
              drawTextMark(x + textWidth / 2, y + textHeight / 2, baseAngle);
            }
          }
        }
      } else if (watermarkImageUrl) {
        const wm = await loadImage(watermarkImageUrl);
        if (isCancelled) return;

        const targetWidth = Math.max(36, Math.round(width * imageScale));
        const targetHeight = Math.round((wm.height / wm.width) * targetWidth);
        const scaledPadding = Math.max(8, Math.round(padding * ratio));

        const drawImageMark = (cx: number, cy: number, rotateDeg: number) => {
          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate((rotateDeg * Math.PI) / 180);
          ctx.drawImage(wm, -targetWidth / 2, -targetHeight / 2, targetWidth, targetHeight);
          ctx.restore();
        };

        if (watermarkStyle === "single") {
          const { x, y } = getPosition(position, width, height, targetWidth, targetHeight, scaledPadding);
          drawImageMark(x + targetWidth / 2, y + targetHeight / 2, rotation);
        } else {
          const spacingX = Math.max(80, targetWidth * (watermarkStyle === "document-security" ? 1.5 : 1.8));
          const spacingY = Math.max(70, targetHeight * (watermarkStyle === "document-security" ? 1.6 : 2));
          const baseAngle = watermarkStyle === "grid-repeat" ? rotation : rotation || -25;

          for (let row = -1, y = -targetHeight; y <= height + targetHeight; row++, y += spacingY) {
            const offset =
              watermarkStyle === "diagonal-repeat" || watermarkStyle === "document-security"
                ? (row % 2 === 0 ? 0 : spacingX / 2)
                : 0;

            for (let x = -targetWidth + offset; x <= width + targetWidth; x += spacingX) {
              drawImageMark(x + targetWidth / 2, y + targetHeight / 2, baseAngle);
            }
          }
        }
      }

      ctx.globalAlpha = 1;
    }

    drawPreview().catch((error) => {
      console.error("Preview render error:", error);
    });

    return () => {
      isCancelled = true;
    };
  }, [
    baseImageUrl,
    mode,
    text,
    fontSize,
    color,
    opacity,
    rotation,
    padding,
    position,
    watermarkStyle,
    imageScale,
    watermarkImageUrl,
  ]);

  const onBaseImageUpload = (file: File | undefined) => {
    if (!file) return;
    if (baseUrlRef.current) URL.revokeObjectURL(baseUrlRef.current);
    const url = URL.createObjectURL(file);
    baseUrlRef.current = url;
    setBaseImageUrl(url);
  };

  const onWatermarkImageUpload = (file: File | undefined) => {
    if (!file) return;
    if (watermarkUrlRef.current) URL.revokeObjectURL(watermarkUrlRef.current);
    const url = URL.createObjectURL(file);
    watermarkUrlRef.current = url;
    setWatermarkImageUrl(url);
  };

  const onDropBase = async (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDraggingBase(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) {
      onBaseImageUpload(dropped);
      return;
    }
    const imported = await fileFromWorkspaceDrag(e.dataTransfer);
    if (imported && imported.type.startsWith("image/")) onBaseImageUpload(imported);
  };

  const onDropLogo = async (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDraggingLogo(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) {
      onWatermarkImageUpload(dropped);
      return;
    }
    const imported = await fileFromWorkspaceDrag(e.dataTransfer);
    if (imported && imported.type.startsWith("image/")) onWatermarkImageUpload(imported);
  };

  useEffect(() => {
    const onQuickImport = (event: Event) => {
      const detail = (event as CustomEvent<ToolQuickImportDetail>).detail;
      if (!detail?.file || !detail.file.type.startsWith("image/")) return;
      onBaseImageUpload(detail.file);
    };
    window.addEventListener(TOOL_QUICK_IMPORT_EVENT, onQuickImport as EventListener);
    return () => window.removeEventListener(TOOL_QUICK_IMPORT_EVENT, onQuickImport as EventListener);
  }, []);

  const downloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas || !canDownload) return;

    const mime = outputFormat === "png" ? "image/png" : "image/jpeg";
    const quality = outputFormat === "jpeg" ? jpegQuality : undefined;
    const dataUrl = canvas.toDataURL(mime, quality);
    const outputName = `watermark-creator-free.${outputFormat === "jpeg" ? "jpg" : "png"}`;

    if (typeof window !== "undefined") {
      fetch(dataUrl)
        .then((res) => res.blob())
        .then((blob) => {
          window.dispatchEvent(
            new CustomEvent("vcm:tool-output-ready", {
              detail: {
                mode: "image",
                type: "uploaded_image",
                title: outputName,
                blob,
                fileName: outputName,
              },
            }),
          );
        })
        .catch(() => {});
    }

    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = outputName;
    a.click();
  };

  const handleSavePreset = async () => {
    const didSave = await savePreset(presetName, {
      mode,
      text,
      fontSize,
      color,
      opacity,
      rotation,
      padding,
      position,
      watermarkStyle,
      imageScale,
      outputFormat,
      jpegQuality,
    });
    if (didSave) {
      setPresetName("");
    }
  };

  const applyPreset = (preset: WatermarkToolPreset) => {
    const p = preset.preset_json || {};
    if (p.mode) setMode(p.mode);
    if (p.text !== undefined) setText(p.text);
    if (typeof p.fontSize === "number") setFontSize(p.fontSize);
    if (p.color) setColor(p.color);
    if (typeof p.opacity === "number") setOpacity(p.opacity);
    if (typeof p.rotation === "number") setRotation(p.rotation);
    if (typeof p.padding === "number") setPadding(p.padding);
    if (p.position) setPosition(p.position);
    if (p.watermarkStyle) setWatermarkStyle(p.watermarkStyle);
    if (typeof p.imageScale === "number") setImageScale(p.imageScale);
    if (p.outputFormat) setOutputFormat(p.outputFormat);
    if (typeof p.jpegQuality === "number") setJpegQuality(p.jpegQuality);
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="grid lg:grid-cols-[360px_1fr] gap-6">
        <div className="rounded-2xl bg-white border border-gray-200 p-5 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Base image</label>
            <div className="mt-2">
              <label
                className={`flex items-center justify-center gap-2 h-12 rounded-lg border border-dashed text-sm font-medium cursor-pointer transition-colors ${
                  isDraggingBase
                    ? "border-orange-400 bg-orange-50 text-orange-700"
                    : "border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100"
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingBase(true);
                }}
                onDragLeave={() => setIsDraggingBase(false)}
                onDrop={onDropBase}
              >
                <Upload className="w-4 h-4" />
                {isDraggingBase ? "Drop image here" : "Upload or drop image"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => onBaseImageUpload(e.target.files?.[0])}
                />
              </label>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Watermark type</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMode("text")}
                className={`h-10 rounded-lg border text-sm font-semibold transition-colors ${
                  mode === "text"
                    ? "border-orange-500 bg-orange-50 text-orange-700"
                    : "border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span className="inline-flex items-center gap-1.5">
                  <Type className="w-4 h-4" />
                  Text
                </span>
              </button>
              <button
                type="button"
                onClick={() => setMode("image")}
                className={`h-10 rounded-lg border text-sm font-semibold transition-colors ${
                  mode === "image"
                    ? "border-orange-500 bg-orange-50 text-orange-700"
                    : "border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span className="inline-flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4" />
                  Logo
                </span>
              </button>
            </div>
          </div>

          {mode === "text" ? (
            <>
              <div>
                <label className="text-sm font-medium text-gray-700">Watermark text</label>
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="mt-1 w-full h-10 rounded-lg border border-gray-300 px-3 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Size</label>
                  <input
                    type="number"
                    min={12}
                    max={180}
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value || 48))}
                    className="mt-1 w-full h-10 rounded-lg border border-gray-300 px-3 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Color</label>
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="mt-1 w-full h-10 rounded-lg border border-gray-300 px-2"
                  />
                </div>
              </div>
            </>
          ) : (
            <div>
              <label className="text-sm font-medium text-gray-700">Watermark logo</label>
              <div className="mt-2">
                <label
                  className={`flex items-center justify-center gap-2 h-12 rounded-lg border border-dashed text-sm font-medium cursor-pointer transition-colors ${
                    isDraggingLogo
                      ? "border-orange-400 bg-orange-50 text-orange-700"
                      : "border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100"
                  }`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingLogo(true);
                  }}
                  onDragLeave={() => setIsDraggingLogo(false)}
                  onDrop={onDropLogo}
                >
                  <Upload className="w-4 h-4" />
                  {isDraggingLogo ? "Drop logo here" : "Upload or drop logo"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => onWatermarkImageUpload(e.target.files?.[0])}
                  />
                </label>
              </div>
              <div className="mt-3">
                <label className="text-sm font-medium text-gray-700">Logo scale ({Math.round(imageScale * 100)}%)</label>
                <input
                  type="range"
                  min={0.08}
                  max={0.6}
                  step={0.01}
                  value={imageScale}
                  onChange={(e) => setImageScale(Number(e.target.value))}
                  className="mt-1 w-full"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-gray-700">Watermark style</label>
            <select
              value={watermarkStyle}
              onChange={(e) => setWatermarkStyle(e.target.value as WatermarkStyle)}
              className="mt-1 w-full h-10 rounded-lg border border-gray-300 px-3 text-sm"
            >
              <option value="single">Single placement</option>
              <option value="diagonal-repeat">Diagonal repeat</option>
              <option value="grid-repeat">Grid repeat</option>
              <option value="document-security">Document security pattern</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Position</label>
            <select
              value={position}
              onChange={(e) => setPosition(e.target.value as Position)}
              className="mt-1 w-full h-10 rounded-lg border border-gray-300 px-3 text-sm"
              disabled={watermarkStyle !== "single"}
            >
              <option value="top-left">Top Left</option>
              <option value="top-center">Top Center</option>
              <option value="top-right">Top Right</option>
              <option value="center-left">Center Left</option>
              <option value="center">Center</option>
              <option value="center-right">Center Right</option>
              <option value="bottom-left">Bottom Left</option>
              <option value="bottom-center">Bottom Center</option>
              <option value="bottom-right">Bottom Right</option>
            </select>
            {watermarkStyle !== "single" && (
              <p className="text-xs text-gray-500 mt-1">Position is used only for Single placement style.</p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Opacity ({Math.round(opacity * 100)}%)</label>
            <input
              type="range"
              min={0.05}
              max={1}
              step={0.01}
              value={opacity}
              onChange={(e) => setOpacity(Number(e.target.value))}
              className="mt-1 w-full"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700">Rotation</label>
              <input
                type="number"
                min={-180}
                max={180}
                value={rotation}
                onChange={(e) => setRotation(Number(e.target.value || 0))}
                className="mt-1 w-full h-10 rounded-lg border border-gray-300 px-3 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Padding</label>
              <input
                type="number"
                min={0}
                max={200}
                value={padding}
                onChange={(e) => setPadding(Number(e.target.value || 24))}
                className="mt-1 w-full h-10 rounded-lg border border-gray-300 px-3 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700">Output</label>
              <select
                value={outputFormat}
                onChange={(e) => setOutputFormat(e.target.value as "png" | "jpeg")}
                className="mt-1 w-full h-10 rounded-lg border border-gray-300 px-3 text-sm"
              >
                <option value="png">PNG</option>
                <option value="jpeg">JPG</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">
                JPG Quality ({Math.round(jpegQuality * 100)}%)
              </label>
              <input
                type="range"
                min={0.5}
                max={1}
                step={0.01}
                value={jpegQuality}
                onChange={(e) => setJpegQuality(Number(e.target.value))}
                className="mt-1 w-full"
                disabled={outputFormat !== "jpeg"}
              />
            </div>
          </div>

          <ToolPresetBar
            presetName={presetName}
            onPresetNameChange={setPresetName}
            onSave={handleSavePreset}
            saving={savingPreset}
            presets={presets}
            onApply={applyPreset}
            canSave={canSavePresets}
            lockedMessage="Preset saving is part of the $49/mo All Access membership."
          />
          {mode === "image" && (
            <p className="text-xs text-gray-500 -mt-2">
              Note: logo file uploads are local to your browser session and are not stored in presets.
            </p>
          )}

          <button
            type="button"
            onClick={downloadImage}
            data-track-output="true"
            disabled={!canDownload}
            className={`w-full h-11 rounded-lg font-semibold inline-flex items-center justify-center gap-2 transition-colors ${
              canDownload
                ? "bg-orange-500 hover:bg-orange-600 text-white"
                : "bg-gray-200 text-gray-500 cursor-not-allowed"
            }`}
          >
            <Download className="w-4 h-4" />
            Download Watermarked Image
          </button>
        </div>

        <div className="rounded-2xl bg-white border border-gray-200 p-4 md:p-5">
          <p className="text-sm text-gray-500 mb-3">
            Preview (processed locally in your browser)
          </p>
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 min-h-[360px] flex items-center justify-center overflow-auto">
            {baseImageUrl ? (
              <canvas ref={canvasRef} className="max-w-full h-auto" />
            ) : (
              <div className="text-center p-8">
                <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Upload a base image to start creating your watermark</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
