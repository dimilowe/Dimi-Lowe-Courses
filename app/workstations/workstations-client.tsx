"use client";

import { DragEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, FileText, Image as ImageIcon, Music2, Pause, Play, Upload, X, Undo2, Redo2, Square, Type, Layers, Trash2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { getToolUI } from "@/lib/ui/get-tool-ui";
import { getWorkspaceDragPayload, WORKSPACE_DRAG_MIME } from "@/lib/workspace/workspaceDragImport";

type WorkstationMode = "pdf" | "image" | "audio";

type ToolOption = {
  slug: string;
  name: string;
  icon: string;
};

type WidgetInstance = {
  id: string;
  toolSlug: string;
  toolName: string;
  toolIcon?: string;
};

type RackWidgetSettings = {
  enabled: boolean;
  low: number;
  mid: number;
  high: number;
};

type PedalboardKind =
  | "pitch-shift"
  | "reverb"
  | "delay"
  | "compressor"
  | "limiter"
  | "high-pass"
  | "low-pass"
  | "bitcrusher"
  | "effect-chain"
  | "vocal-chain";

type AnalysisKind = "key-detector" | "chord-finder" | "melody-extractor" | "audio-to-midi";

type RackRunOutput = {
  id: string;
  moduleName: string;
  summary: string;
  links: Array<{ label: string; href: string }>;
};

type UploadedAsset = {
  localId: string;
  id?: string;
  title: string;
  src: string;
  status: "uploaded" | "local";
  type: "pdf" | "image" | "audio";
};

type WorkstationsClientProps = {
  isLoggedIn: boolean;
};

const MODE_KEYWORDS: Record<WorkstationMode, string[]> = {
  audio: ["audio", "vocal", "music", "midi", "chord", "pitch", "beat", "pedalboard", "song", "voice"],
  image: ["image", "photo", "thumbnail", "logo", "gif", "compress", "resize", "visual", "emoji", "design"],
  pdf: ["pdf", "document", "ocr", "split", "merge", "convert", "doc"],
};

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function matchesMode(tool: ToolOption, mode: WorkstationMode) {
  const hay = `${tool.slug} ${tool.name}`.toLowerCase();
  return MODE_KEYWORDS[mode].some((kw) => hay.includes(kw));
}

async function readErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const data = await res.json();
    if (data && typeof data.error === "string" && data.error.trim()) return data.error;
  } catch {}
  return fallback;
}

async function uploadToWorkspace(file: File): Promise<{ id?: string; title: string; src: string }> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("cloud_id", "file-data");
  const res = await fetch("/api/workspace/upload", { method: "POST", body: formData });
  if (!res.ok) throw new Error(await readErrorMessage(res, `Failed to upload ${file.name}`));
  const data = await res.json();
  return {
    id: data?.id ? String(data.id) : undefined,
    title: String(data?.title || file.name),
    src: typeof data?.file_url === "string" && data.file_url.trim() ? data.file_url : data?.id ? `/workspace/${data.id}` : "/workspace",
  };
}

function makeLocalAsset(file: File, type: UploadedAsset["type"]): UploadedAsset {
  return { localId: makeId(), title: file.name, src: URL.createObjectURL(file), status: "local", type };
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.crossOrigin = "anonymous";
    img.src = src;
  });
}

function stripFileExt(name: string): string {
  return name.replace(/\.[a-z0-9]{2,6}$/i, "");
}

function triggerDownloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

async function fetchCanExportClean(): Promise<boolean> {
  try {
    const res = await fetch("/api/user/subscription-capabilities", { cache: "no-store" });
    if (!res.ok) return false;
    const data = await res.json();
    return Boolean(data?.isLoggedIn && data?.canSaveWorkspace);
  } catch {
    return false;
  }
}

function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const numFrames = buffer.length;
  const bitsPerSample = 16;
  const blockAlign = numChannels * (bitsPerSample / 8);
  const byteRate = sampleRate * blockAlign;
  const dataSize = numFrames * blockAlign;
  const wavSize = 44 + dataSize;
  const arrayBuffer = new ArrayBuffer(wavSize);
  const view = new DataView(arrayBuffer);

  const writeString = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(36, "data");
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < numFrames; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, buffer.getChannelData(ch)[i] || 0));
      const s = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, s, true);
      offset += 2;
    }
  }
  return new Blob([arrayBuffer], { type: "audio/wav" });
}

function ModeCard({
  title,
  description,
  icon,
  onClick,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="text-left rounded-2xl border border-gray-200 bg-white p-6 hover:border-orange-300 hover:shadow-sm transition-all">
      <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
      <p className="text-sm text-gray-600 mt-2">{description}</p>
    </button>
  );
}

function WidgetLibrary({
  mode,
  tools,
}: {
  mode: WorkstationMode;
  tools: ToolOption[];
}) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const modeTools = tools.filter((t) => matchesMode(t, mode));
    const builtIns: ToolOption[] =
      mode === "pdf"
          ? [
              { slug: "studio-pdf-zoom-in", name: "Zoom In", icon: "SearchPlus" },
              { slug: "studio-pdf-zoom-out", name: "Zoom Out", icon: "SearchMinus" },
              { slug: "studio-pdf-rotate", name: "Rotate 90", icon: "RotateCw" },
              { slug: "studio-pdf-invert", name: "Invert Theme", icon: "Contrast" },
            ]
          : mode === "audio"
            ? [
                { slug: "studio-audio-gain-up", name: "Gain Up", icon: "Volume2" },
                { slug: "studio-audio-gain-down", name: "Gain Down", icon: "Volume1" },
                { slug: "studio-audio-toggle-lowpass", name: "Toggle Low-Pass", icon: "SlidersHorizontal" },
              ]
            : [];
    const baseTools = modeTools.length > 0 ? modeTools : tools.slice(0, 20);
    const base = [...builtIns, ...baseTools];
    const term = q.trim().toLowerCase();
    if (!term) return base;
    return base.filter((t) => t.slug.toLowerCase().includes(term) || t.name.toLowerCase().includes(term));
  }, [mode, q, tools]);

  return (
    <aside className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
      <h3 className="font-semibold text-gray-900">Tool Widgets</h3>
      <p className="text-xs text-gray-500">Drag a tool into the workstation canvas.</p>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tools..." className="w-full border rounded-lg px-3 py-2 text-sm" />
      <div className="space-y-2 max-h-[560px] overflow-auto">
        {filtered.map((tool) => (
          <div
            key={tool.slug}
            draggable
            onDragStart={(e) => e.dataTransfer.setData("application/x-tool-widget", JSON.stringify({ slug: tool.slug, name: tool.name }))}
            className="rounded-lg border border-gray-200 px-3 py-2 cursor-grab active:cursor-grabbing bg-white hover:border-orange-300"
          >
            <p className="text-sm font-medium text-gray-900 truncate">{tool.name}</p>
            <p className="text-xs text-gray-500 truncate">/{tool.slug}</p>
          </div>
        ))}
      </div>
    </aside>
  );
}

function WidgetDock({
  widgets,
  onRemove,
}: {
  widgets: WidgetInstance[];
  onRemove: (id: string) => void;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-gray-900">Active Widgets</h4>
        <span className="text-xs text-gray-500">{widgets.length}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {widgets.length === 0 && <p className="text-sm text-gray-500">No widgets yet. Drag tools into the canvas.</p>}
        {widgets.map((w) => (
          <div key={w.id} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-2 py-1.5 bg-gray-50">
            <Link href={`/tools/${w.toolSlug}`} className="text-xs text-gray-800 hover:text-orange-600">
              {w.toolName}
            </Link>
            <button onClick={() => onRemove(w.id)} className="text-gray-400 hover:text-red-600">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function PdfStudio({
  onBack,
  isLoggedIn,
  tools,
  preloadPdf,
}: {
  onBack: () => void;
  isLoggedIn: boolean;
  tools: ToolOption[];
  preloadPdf?: { src?: string | null; title?: string | null; itemId?: string | null };
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const lastPreloadKeyRef = useRef<string | null>(null);
  const [docs, setDocs] = useState<UploadedAsset[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const [widgets, setWidgets] = useState<WidgetInstance[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [pdfZoom, setPdfZoom] = useState(1);
  const [pdfRotate, setPdfRotate] = useState(0);
  const [pdfInvert, setPdfInvert] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [canExportClean, setCanExportClean] = useState(false);

  function removeWidget(id: string) {
    setWidgets((prev) => prev.filter((w) => w.id !== id));
  }

  function onDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(true);
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    const raw = e.dataTransfer.getData("application/x-tool-widget");
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as { slug: string; name: string };
      setWidgets((prev) => [...prev, { id: makeId(), toolSlug: parsed.slug, toolName: parsed.name }]);
    } catch {}
  }

  function runWidget(widget: WidgetInstance) {
    const slug = widget.toolSlug.toLowerCase();
    if (slug.includes("studio-pdf-zoom-in")) {
      setPdfZoom((v) => Math.min(2.5, v + 0.15));
      return;
    }
    if (slug.includes("studio-pdf-zoom-out")) {
      setPdfZoom((v) => Math.max(0.5, v - 0.15));
      return;
    }
    if (slug.includes("studio-pdf-rotate")) {
      setPdfRotate((v) => (v + 90) % 360);
      return;
    }
    if (slug.includes("studio-pdf-invert")) {
      setPdfInvert((v) => !v);
      return;
    }
    setNotice(`${widget.toolName} is added, but in-canvas execution is not wired yet.`);
  }

  async function onUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setNotice(null);
    try {
      const next: UploadedAsset[] = [];
      let fallbackCount = 0;
      for (const file of Array.from(files)) {
        if (file.type !== "application/pdf") continue;
        if (!isLoggedIn) {
          next.push(makeLocalAsset(file, "pdf"));
          continue;
        }
        try {
          const uploaded = await uploadToWorkspace(file);
          next.push({ localId: makeId(), ...uploaded, status: "uploaded", type: "pdf" });
        } catch {
          next.push(makeLocalAsset(file, "pdf"));
          fallbackCount += 1;
        }
      }
      setDocs((prev) => [...next, ...prev]);
      setActiveIndex(0);
      if (!isLoggedIn) setNotice("Guest mode: PDFs stay local in this browser session.");
      if (fallbackCount > 0) setNotice(`Cloud upload failed for ${fallbackCount} PDF file(s). Imported locally instead.`);
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Upload failed");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const activeDoc = docs[activeIndex];

  useEffect(() => {
    const preloadKey = `${preloadPdf?.itemId || ""}::${preloadPdf?.src || ""}`;
    if (!preloadPdf || (!preloadPdf.src && !preloadPdf.itemId)) return;
    if (lastPreloadKeyRef.current === preloadKey) return;
    const currentPreload = preloadPdf;

    let cancelled = false;
    async function run() {
      let src = currentPreload.src || "";
      if (!src && currentPreload.itemId) {
        try {
          const res = await fetch(`/api/workspace/items/${encodeURIComponent(currentPreload.itemId)}`, { cache: "no-store" });
          if (res.ok) {
            const data = await res.json();
            if (typeof data?.file_url === "string") src = data.file_url;
          }
        } catch {}
      }
      if (!src || cancelled) return;
      lastPreloadKeyRef.current = preloadKey;
      const title = currentPreload.title?.trim() || "Imported PDF";

      setDocs((prev) => {
        const existingIndex = prev.findIndex((d) => d.src === src);
        if (existingIndex >= 0) {
          setActiveIndex(existingIndex);
          return prev;
        }
        setActiveIndex(0);
        return [
          {
            localId: currentPreload.itemId || makeId(),
            id: currentPreload.itemId || undefined,
            title,
            src,
            status: currentPreload.itemId ? "uploaded" : "local",
            type: "pdf",
          },
          ...prev,
        ];
      });
      setNotice(`Loaded: ${title}`);
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [preloadPdf?.itemId, preloadPdf?.src, preloadPdf?.title]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      const allowed = await fetchCanExportClean();
      if (!cancelled) setCanExportClean(allowed);
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  async function exportPdf() {
    if (!activeDoc?.src || exporting) return;
    setExporting(true);
    setNotice(null);
    try {
      const res = await fetch(activeDoc.src);
      if (!res.ok) throw new Error("Unable to load PDF for export.");
      const sourceBlob = await res.blob();
      let outputBlob = sourceBlob;

      if (!canExportClean) {
        const { PDFDocument, StandardFonts, rgb, degrees } = await import("pdf-lib");
        const bytes = await sourceBlob.arrayBuffer();
        const pdf = await PDFDocument.load(bytes);
        const font = await pdf.embedFont(StandardFonts.HelveticaBold);
        for (const page of pdf.getPages()) {
          const { width, height } = page.getSize();
          for (let y = -height * 0.4; y < height * 1.4; y += 140) {
            for (let x = -width * 0.4; x < width * 1.4; x += 280) {
              page.drawText("Made with VCM Suite • vcmsuite.com", {
                x,
                y,
                size: 16,
                rotate: degrees(-28),
                color: rgb(0.12, 0.12, 0.18),
                opacity: 0.12,
                font,
              });
            }
          }
          page.drawRectangle({
            x: width - 230,
            y: 16,
            width: 214,
            height: 28,
            color: rgb(0.1, 0.12, 0.16),
            opacity: 0.78,
          });
          page.drawText("Made with VCM Suite", {
            x: width - 220,
            y: 24,
            size: 13,
            color: rgb(1, 1, 1),
            font,
          });
        }
        const pdfBytes = await pdf.save();
        const pdfArrayBuffer = pdfBytes.buffer.slice(
          pdfBytes.byteOffset,
          pdfBytes.byteOffset + pdfBytes.byteLength
        ) as ArrayBuffer;
        outputBlob = new Blob([pdfArrayBuffer], { type: "application/pdf" });
      }

      const base = stripFileExt(activeDoc.title || "workstation-document");
      triggerDownloadBlob(outputBlob, `${base}${canExportClean ? "" : "-vcm-watermarked"}.pdf`);
      setNotice(
        canExportClean
          ? "Exported clean PDF."
          : "Exported watermarked PDF. Subscribe to remove watermark exports.",
      );
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Export failed.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-4">
      <button onClick={onBack} className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"><ArrowLeft className="h-4 w-4" /> Back</button>
      <div className="rounded-xl border border-gray-200 bg-white p-3 flex items-center justify-between">
        <div className="text-sm font-medium text-gray-900">PDF Workstation</div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportPdf}
            data-track-output="true"
            disabled={!activeDoc || exporting}
            className="text-xs border rounded-lg px-3 py-1.5 inline-flex items-center gap-1 disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" /> {exporting ? "Exporting..." : "Export"}
          </button>
          <button onClick={() => inputRef.current?.click()} className="text-xs border rounded-lg px-3 py-1.5 inline-flex items-center gap-1"><Upload className="h-3.5 w-3.5" /> Open PDF</button>
        </div>
      </div>
      <input ref={inputRef} type="file" accept="application/pdf" multiple className="hidden" onChange={(e) => onUpload(e.target.files)} />
      {notice && <div className="rounded-lg border border-blue-200 bg-blue-50 text-blue-800 px-4 py-2 text-sm">{notice}</div>}

      <div className="grid grid-cols-1 xl:grid-cols-[260px_1fr] gap-4">
        <WidgetLibrary mode="pdf" tools={tools} />
        <div className="space-y-4">
          <div onDragOver={onDragOver} onDragLeave={() => setDragOver(false)} onDrop={onDrop} className={`rounded-xl border-2 border-dashed p-4 ${dragOver ? "border-orange-300 bg-orange-50" : "border-gray-200 bg-white"}`}>
            <p className="text-sm text-gray-600 mb-2">Drop PDF widgets here</p>
            <div className="rounded-xl border border-gray-200 bg-white p-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-gray-900">Active Widgets</h4>
                <span className="text-xs text-gray-500">{widgets.length}</span>
              </div>
              <div className="space-y-2">
                {widgets.length === 0 && <p className="text-sm text-gray-500">No widgets yet. Drag tools into the canvas.</p>}
                {widgets.map((w) => (
                  <div key={w.id} className="rounded-lg border border-gray-200 px-3 py-2 flex items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{w.toolName}</p>
                      <p className="text-xs text-gray-500 truncate">/{w.toolSlug}</p>
                    </div>
                    <button onClick={() => runWidget(w)} className="text-xs border rounded px-2 py-1">Run</button>
                    <button onClick={() => removeWidget(w.id)} className="text-gray-400 hover:text-red-600"><X className="h-3.5 w-3.5" /></button>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              View state: zoom {Math.round(pdfZoom * 100)}% | rotation {pdfRotate}deg | {pdfInvert ? "inverted" : "normal"}
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[220px_1fr] gap-4">
            <aside className="rounded-xl border border-gray-200 bg-white p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Documents</h3>
              <div className="space-y-2 max-h-[560px] overflow-auto">
                {docs.length === 0 && <p className="text-sm text-gray-500">Open a PDF to begin.</p>}
                {docs.map((doc, idx) => (
                  <button key={`${doc.title}-${idx}`} onClick={() => setActiveIndex(idx)} className={`w-full text-left rounded-lg border px-3 py-2 text-sm ${idx === activeIndex ? "border-orange-300 bg-orange-50" : "border-gray-200"}`}>
                    {doc.title}
                  </button>
                ))}
              </div>
            </aside>
            <main className="rounded-xl border border-gray-200 bg-gray-100 p-4 min-h-[620px]">
              {!activeDoc && <div className="h-full rounded-lg border-2 border-dashed border-gray-300 bg-white flex items-center justify-center text-gray-500">PDF Canvas</div>}
              {activeDoc && (
                <div className="w-full h-[760px] overflow-auto rounded-lg border bg-white">
                  <div
                    style={{
                      transform: `scale(${pdfZoom}) rotate(${pdfRotate}deg)`,
                      transformOrigin: "top center",
                      filter: pdfInvert ? "invert(1) hue-rotate(180deg)" : "none",
                    }}
                  >
                    <iframe src={activeDoc.src} className="w-full h-[760px] rounded-lg bg-white" title={activeDoc.title} />
                  </div>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}

function ImageStudio({
  onBack,
  isLoggedIn,
  tools,
  preloadImage,
}: {
  onBack: () => void;
  isLoggedIn: boolean;
  tools: ToolOption[];
  preloadImage?: { src?: string | null; title?: string | null; itemId?: string | null };
}) {
  type CanvasItem = {
    id: string;
    type: "image" | "text" | "shape";
    x: number;
    y: number;
    w: number;
    h: number;
    rotation: number;
    opacity: number;
    color: string;
    shapeKind?: "rectangle" | "square" | "circle" | "triangle" | "line" | "pill" | "diamond" | "star";
    text?: string;
    fontSize?: number;
    fontFamily?: string;
    src?: string;
    zIndex: number;
  };
  type CanvasPage = {
    id: string;
    items: CanvasItem[];
  };
  type WidgetNode = {
    id: string;
    toolSlug: string;
    toolName: string;
    toolIcon?: string;
    x: number;
    y: number;
  };
  const FONT_OPTIONS = [
    "Inter",
    "Poppins",
    "Montserrat",
    "Open Sans",
    "Roboto",
    "Nunito",
    "Lora",
    "Merriweather",
    "Playfair Display",
    "Oswald",
    "Arial",
    "Helvetica",
    "Georgia",
    "Times New Roman",
    "Verdana",
    "Trebuchet MS",
    "Courier New",
    "Impact",
  ];

  const inputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const propertiesBarRef = useRef<HTMLDivElement>(null);
  const widgetBarRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    id: string;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    snapshot: CanvasItem[];
  } | null>(null);
  const widgetDragRef = useRef<{
    id: string;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);
  const resizeRef = useRef<{
    id: string;
    dir: "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    originW: number;
    originH: number;
    originFontSize?: number;
    snapshot: CanvasItem[];
  } | null>(null);
  const widgetWindowInteractionRef = useRef<{
    kind: "move" | "resize";
    corner?: "nw" | "ne" | "sw" | "se";
    startX: number;
    startY: number;
    startRect: { x: number; y: number; w: number; h: number };
  } | null>(null);
  const lastPreloadKeyRef = useRef<string | null>(null);

  const [assets, setAssets] = useState<UploadedAsset[]>([]);
  const [uploadsOpen, setUploadsOpen] = useState(false);
  const [elementsOpen, setElementsOpen] = useState(false);
  const [elementsQuery, setElementsQuery] = useState("");
  const [widgets, setWidgets] = useState<WidgetInstance[]>([]);
  const [widgetNodes, setWidgetNodes] = useState<WidgetNode[]>([]);
  const [widgetCanvasDragOver, setWidgetCanvasDragOver] = useState(false);
  const [activeWidget, setActiveWidget] = useState<WidgetInstance | null>(null);
  const [isWidgetWindowCollapsed, setIsWidgetWindowCollapsed] = useState(false);
  const [widgetOutputUrl, setWidgetOutputUrl] = useState("");
  const [widgetOutputs, setWidgetOutputs] = useState<Array<{ id: string; widgetId: string; title: string; src: string }>>([]);
  const [widgetWindow, setWidgetWindow] = useState({ x: 24, y: 200, w: 520, h: 720 });
  const [widgetMenuOpen, setWidgetMenuOpen] = useState(false);
  const [widgetQuery, setWidgetQuery] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  const [canvasSize, setCanvasSize] = useState({ w: 800, h: 500 });
  const [pages, setPages] = useState<CanvasPage[]>([{ id: makeId(), items: [] }]);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [undoStack, setUndoStack] = useState<CanvasItem[][]>([]);
  const [redoStack, setRedoStack] = useState<CanvasItem[][]>([]);
  const [exporting, setExporting] = useState(false);
  const [canExportClean, setCanExportClean] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [exportPreviewUrl, setExportPreviewUrl] = useState<string | null>(null);
  const [exportPreviewLoading, setExportPreviewLoading] = useState(false);
  const [exportPreviewWatermarked, setExportPreviewWatermarked] = useState(true);

  const canvasItems = pages[activePageIndex]?.items || [];
  const selected = useMemo(() => canvasItems.find((i) => i.id === selectedId) || null, [canvasItems, selectedId]);
  const imageTools = useMemo(() => {
    const base = tools;
    const q = widgetQuery.trim().toLowerCase();
    if (!q) return base;
    return base.filter((t) => t.slug.toLowerCase().includes(q) || t.name.toLowerCase().includes(q));
  }, [tools, widgetQuery]);
  const elementPresets = useMemo(
    () =>
      [
        { key: "rectangle", label: "Rectangle", w: 180, h: 120 },
        { key: "square", label: "Square", w: 140, h: 140 },
        { key: "circle", label: "Circle", w: 140, h: 140 },
        { key: "triangle", label: "Triangle", w: 180, h: 140 },
        { key: "line", label: "Line", w: 220, h: 10 },
        { key: "pill", label: "Pill", w: 200, h: 70 },
        { key: "diamond", label: "Diamond", w: 150, h: 150 },
        { key: "star", label: "Star", w: 160, h: 160 },
      ].filter((p) => p.label.toLowerCase().includes(elementsQuery.trim().toLowerCase())),
    [elementsQuery],
  );

  function renderElementPresetPreview(kind: NonNullable<CanvasItem["shapeKind"]>) {
    const color = "#7c3aed";
    if (kind === "line") {
      return <div className="w-20 h-2 rounded bg-violet-600" />;
    }
    if (kind === "triangle") {
      return <div className="w-14 h-12 bg-violet-600" style={{ clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)" }} />;
    }
    if (kind === "diamond") {
      return <div className="w-12 h-12 bg-violet-600 rotate-45 rounded-sm" />;
    }
    if (kind === "star") {
      return (
        <div
          className="w-14 h-14 bg-violet-600"
          style={{ clipPath: "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)" }}
        />
      );
    }
    return (
      <div
        className="bg-violet-600"
        style={{
          width: kind === "rectangle" ? 70 : 56,
          height: kind === "pill" ? 28 : kind === "rectangle" ? 44 : 56,
          borderRadius: kind === "circle" || kind === "pill" ? 9999 : 8,
          backgroundColor: color,
        }}
      />
    );
  }

  useEffect(() => {
    if (typeof document === "undefined") return;
    const id = "vcm-workstation-google-fonts";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Montserrat:wght@400;600;700&family=Merriweather:wght@400;700&family=Lora:wght@400;700&family=Nunito:wght@400;600;700&family=Open+Sans:wght@400;600;700&family=Oswald:wght@400;600;700&family=Playfair+Display:wght@400;700&family=Poppins:wght@400;600;700&family=Roboto:wght@400;500;700&display=swap";
    document.head.appendChild(link);
  }, []);

  function setActivePageItems(next: CanvasItem[] | ((prev: CanvasItem[]) => CanvasItem[])) {
    setPages((prev) =>
      prev.map((page, idx) => {
        if (idx !== activePageIndex) return page;
        const nextItems = typeof next === "function" ? (next as (prev: CanvasItem[]) => CanvasItem[])(page.items) : next;
        return { ...page, items: nextItems };
      }),
    );
  }

  function commit(next: CanvasItem[]) {
    setUndoStack((prev) => [...prev, canvasItems]);
    setRedoStack([]);
    setActivePageItems(next);
  }

  function updateSelected(patch: Partial<CanvasItem>) {
    if (!selected) return;
    commit(canvasItems.map((i) => (i.id === selected.id ? { ...i, ...patch } : i)));
  }

  function addShape(shapeKind: CanvasItem["shapeKind"] = "rectangle", w = 180, h = 120) {
    const z = canvasItems.length + 1;
    commit([
      ...canvasItems,
      { id: makeId(), type: "shape", shapeKind, x: 120, y: 110, w, h, rotation: 0, opacity: 1, color: "#7c3aed", zIndex: z },
    ]);
  }

  function addText() {
    const z = canvasItems.length + 1;
    commit([
      ...canvasItems,
      { id: makeId(), type: "text", x: 130, y: 130, w: 260, h: 70, rotation: 0, opacity: 1, color: "#1b1c1f", text: "Edit this text", fontSize: 40, fontFamily: "Inter", zIndex: z },
    ]);
  }

  function addImageAsset(asset: UploadedAsset) {
    const z = canvasItems.length + 1;
    commit([
      ...canvasItems,
      { id: makeId(), type: "image", x: 80, y: 80, w: 260, h: 180, rotation: 0, opacity: 1, color: "#ffffff", src: asset.src, zIndex: z },
    ]);
    setUploadsOpen(false);
  }

  useEffect(() => {
    const preloadKey = `${preloadImage?.itemId || ""}::${preloadImage?.src || ""}`;
    if (!preloadImage || (!preloadImage.src && !preloadImage.itemId)) return;
    if (lastPreloadKeyRef.current === preloadKey) return;
    const currentPreload = preloadImage;

    let cancelled = false;
    async function run() {
      let src = currentPreload.src || "";
      if (!src && currentPreload.itemId) {
        try {
          const res = await fetch(`/api/workspace/items/${encodeURIComponent(currentPreload.itemId)}`, { cache: "no-store" });
          if (res.ok) {
            const data = await res.json();
            if (typeof data?.file_url === "string") src = data.file_url;
          }
        } catch {}
      }
      if (!src || cancelled) return;
      lastPreloadKeyRef.current = preloadKey;
      const title = currentPreload.title?.trim() || "Imported image";
      const asset: UploadedAsset = {
        localId: currentPreload.itemId || makeId(),
        id: currentPreload.itemId || undefined,
        title,
        src,
        status: "uploaded",
        type: "image",
      };
      setAssets((prev) => {
        if (prev.some((a) => a.src === src)) return prev;
        return [asset, ...prev];
      });
      addImageAsset(asset);
      setNotice(`Loaded: ${title}`);
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [preloadImage?.itemId, preloadImage?.src, preloadImage?.title]);

  useEffect(() => {
    let cancelled = false;
    async function loadCapabilities() {
      try {
        const res = await fetch("/api/user/subscription-capabilities", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        setCanExportClean(Boolean(data?.isLoggedIn && data?.canSaveWorkspace));
      } catch {}
    }
    void loadCapabilities();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (exportPreviewUrl) URL.revokeObjectURL(exportPreviewUrl);
    };
  }, [exportPreviewUrl]);

  async function buildCanvasExportBlob(includeWatermark: boolean): Promise<Blob> {
    const out = document.createElement("canvas");
    out.width = canvasSize.w;
    out.height = canvasSize.h;
    const ctx = out.getContext("2d");
    if (!ctx) throw new Error("Canvas export is unavailable in this browser.");

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, out.width, out.height);

    const sorted = [...canvasItems].sort((a, b) => a.zIndex - b.zIndex);
    for (const item of sorted) {
      ctx.save();
      ctx.globalAlpha = item.opacity;
      ctx.translate(item.x + item.w / 2, item.y + item.h / 2);
      ctx.rotate((item.rotation * Math.PI) / 180);

      if (item.type === "image" && item.src) {
        try {
          const img = await loadImageElement(item.src);
          const iw = img.naturalWidth || img.width;
          const ih = img.naturalHeight || img.height;
          const scale = Math.min(item.w / iw, item.h / ih);
          const dw = iw * scale;
          const dh = ih * scale;
          ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
        } catch {}
      } else if (item.type === "shape") {
        ctx.fillStyle = item.color;
        const x = -item.w / 2;
        const y = -item.h / 2;
        const w = item.w;
        const h = item.h;
        if (item.shapeKind === "line") {
          ctx.fillRect(x, y + h / 2 - 2, w, 4);
        } else if (item.shapeKind === "triangle") {
          ctx.beginPath();
          ctx.moveTo(x + w / 2, y);
          ctx.lineTo(x, y + h);
          ctx.lineTo(x + w, y + h);
          ctx.closePath();
          ctx.fill();
        } else if (item.shapeKind === "diamond") {
          ctx.beginPath();
          ctx.moveTo(x + w / 2, y);
          ctx.lineTo(x + w, y + h / 2);
          ctx.lineTo(x + w / 2, y + h);
          ctx.lineTo(x, y + h / 2);
          ctx.closePath();
          ctx.fill();
        } else if (item.shapeKind === "star") {
          const cx = x + w / 2;
          const cy = y + h / 2;
          const outer = Math.min(w, h) / 2;
          const inner = outer * 0.45;
          ctx.beginPath();
          for (let i = 0; i < 10; i++) {
            const r = i % 2 === 0 ? outer : inner;
            const a = -Math.PI / 2 + (i * Math.PI) / 5;
            const px = cx + Math.cos(a) * r;
            const py = cy + Math.sin(a) * r;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.fill();
        } else {
          const radius = item.shapeKind === "circle" || item.shapeKind === "pill" ? Math.min(w, h) / 2 : 8;
          ctx.beginPath();
          ctx.moveTo(x + radius, y);
          ctx.lineTo(x + w - radius, y);
          ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
          ctx.lineTo(x + w, y + h - radius);
          ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
          ctx.lineTo(x + radius, y + h);
          ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
          ctx.lineTo(x, y + radius);
          ctx.quadraticCurveTo(x, y, x + radius, y);
          ctx.closePath();
          ctx.fill();
        }
      } else if (item.type === "text") {
        const fontSize = item.fontSize || 30;
        const lineHeight = Math.max(12, Math.round(fontSize * 1.12));
        const text = item.text || "";
        ctx.fillStyle = item.color;
        ctx.font = `${fontSize}px ${item.fontFamily || "Inter"}, sans-serif`;
        ctx.textBaseline = "top";
        const maxWidth = Math.max(10, item.w);
        const words = text.split(/\s+/);
        const lines: string[] = [];
        let line = "";
        for (const word of words) {
          const next = line ? `${line} ${word}` : word;
          if (ctx.measureText(next).width <= maxWidth || !line) {
            line = next;
          } else {
            lines.push(line);
            line = word;
          }
        }
        if (line) lines.push(line);
        const startX = -item.w / 2;
        const startY = -item.h / 2;
        lines.forEach((ln, idx) => {
          const y = startY + idx * lineHeight;
          if (y > startY + item.h - lineHeight) return;
          ctx.fillText(ln, startX, y, maxWidth);
        });
      }
      ctx.restore();
    }

    if (includeWatermark) {
      ctx.save();
      ctx.globalAlpha = 0.16;
      ctx.fillStyle = "#1b1c1f";
      ctx.font = "700 22px Inter, Arial, sans-serif";
      ctx.rotate((-22 * Math.PI) / 180);
      for (let y = -out.height; y < out.height * 1.8; y += 170) {
        for (let x = -out.width; x < out.width * 1.8; x += 360) {
          ctx.fillText("Made with VCM Suite • vcmsuite.com", x, y);
        }
      }
      ctx.restore();

      const badgeW = 292;
      const badgeH = 38;
      const bx = out.width - badgeW - 16;
      const by = out.height - badgeH - 16;
      ctx.save();
      ctx.fillStyle = "rgba(17,24,39,0.86)";
      ctx.beginPath();
      ctx.roundRect(bx, by, badgeW, badgeH, 10);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.font = "600 16px Inter, Arial, sans-serif";
      ctx.textBaseline = "middle";
      ctx.fillText("Made with VCM Suite", bx + 14, by + badgeH / 2);
      ctx.restore();
    }

    const blob = await new Promise<Blob | null>((resolve) => out.toBlob(resolve, "image/png"));
    if (!blob) throw new Error("Failed to generate export.");
    return blob;
  }

  async function openExportMenu() {
    if (exportMenuOpen) {
      setExportMenuOpen(false);
      return;
    }
    const useWatermark = !canExportClean;
    setExportPreviewWatermarked(useWatermark);
    setExportMenuOpen(true);
    setExportPreviewLoading(true);
    setNotice(null);
    try {
      const blob = await buildCanvasExportBlob(useWatermark);
      const url = URL.createObjectURL(blob);
      setExportPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Export preview failed.");
    } finally {
      setExportPreviewLoading(false);
    }
  }

  async function downloadWatermarkedExport() {
    if (exporting) return;
    setExporting(true);
    setNotice(null);
    try {
      const blob = await buildCanvasExportBlob(true);
      triggerDownloadBlob(blob, `vcm-workstation-${Date.now()}-watermarked.png`);
      setNotice("Downloaded watermarked export.");
      setExportMenuOpen(false);
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Export failed.");
    } finally {
      setExporting(false);
    }
  }

  async function downloadCleanExport() {
    if (exporting || !canExportClean) return;
    setExporting(true);
    setNotice(null);
    try {
      const blob = await buildCanvasExportBlob(false);
      triggerDownloadBlob(blob, `vcm-workstation-${Date.now()}.png`);
      setNotice("Downloaded clean export.");
      setExportMenuOpen(false);
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Export failed.");
    } finally {
      setExporting(false);
    }
  }

  function bringToFront(id: string) {
    const maxZ = Math.max(1, ...canvasItems.map((i) => i.zIndex));
    commit(canvasItems.map((i) => (i.id === id ? { ...i, zIndex: maxZ + 1 } : i)));
  }

  function sendToBack(id: string) {
    const minZ = Math.min(...canvasItems.map((i) => i.zIndex));
    commit(canvasItems.map((i) => (i.id === id ? { ...i, zIndex: minZ - 1 } : i)));
  }

  function deleteSelected() {
    if (!selected) return;
    commit(canvasItems.filter((i) => i.id !== selected.id));
    setSelectedId(null);
  }

  function addWidget(tool: ToolOption) {
    const next = { id: makeId(), toolSlug: tool.slug, toolName: tool.name, toolIcon: tool.icon };
    setWidgets((prev) => [...prev, next]);
    openWidgetWindow(next);
    setWidgetMenuOpen(false);
    setWidgetQuery("");
  }

  function removeWidget(id: string) {
    setWidgets((prev) => {
      const removed = prev.find((w) => w.id === id);
      if (removed) {
        setWidgetNodes((nodes) => nodes.filter((n) => n.toolSlug !== removed.toolSlug));
        setWidgetOutputs((outs) => outs.filter((o) => o.widgetId !== removed.id));
      }
      return prev.filter((w) => w.id !== id);
    });
    setActiveWidget((current) => (current?.id === id ? null : current));
    setIsWidgetWindowCollapsed(false);
  }

  function removeWidgetNode(id: string) {
    setWidgetNodes((prev) => prev.filter((n) => n.id !== id));
  }

  function onCanvasWidgetDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setWidgetCanvasDragOver(false);
    const workspacePayload = getWorkspaceDragPayload(e.dataTransfer);
    if (workspacePayload?.fileUrl && canvasRef.current) {
      const isImageType =
        workspacePayload.type.includes("image") ||
        /\.(png|jpe?g|webp|gif|svg|bmp|avif)$/i.test(workspacePayload.title);
      if (isImageType) {
        const scale = zoom / 100;
        const rect = canvasRef.current.getBoundingClientRect();
        const dropX = (e.clientX - rect.left) / scale;
        const dropY = (e.clientY - rect.top) / scale;
        const z = canvasItems.length + 1;
        commit([
          ...canvasItems,
          {
            id: makeId(),
            type: "image",
            x: Math.max(8, Math.min(canvasSize.w - 260, dropX - 130)),
            y: Math.max(8, Math.min(canvasSize.h - 180, dropY - 90)),
            w: 260,
            h: 180,
            rotation: 0,
            opacity: 1,
            color: "#ffffff",
            src: workspacePayload.fileUrl,
            zIndex: z,
          },
        ]);
        setNotice(`Added from Recent Files: ${workspacePayload.title}`);
      } else {
        setNotice("Only image files can be dropped onto the image canvas.");
      }
      return;
    }
    const outputRaw = e.dataTransfer.getData("application/x-vcm-image-output");
    if (outputRaw && canvasRef.current) {
      try {
        const parsed = JSON.parse(outputRaw) as { src: string; title?: string };
        if (parsed.src) {
          const scale = zoom / 100;
          const rect = canvasRef.current.getBoundingClientRect();
          const dropX = (e.clientX - rect.left) / scale;
          const dropY = (e.clientY - rect.top) / scale;
          const z = canvasItems.length + 1;
          commit([
            ...canvasItems,
            {
              id: makeId(),
              type: "image",
              x: Math.max(8, Math.min(canvasSize.w - 260, dropX - 130)),
              y: Math.max(8, Math.min(canvasSize.h - 180, dropY - 90)),
              w: 260,
              h: 180,
              rotation: 0,
              opacity: 1,
              color: "#ffffff",
              src: parsed.src,
              zIndex: z,
            },
          ]);
          setNotice(`Placed output on canvas${parsed.title ? `: ${parsed.title}` : ""}`);
          return;
        }
      } catch {}
    }
    const raw = e.dataTransfer.getData("application/x-tool-widget");
    if (!raw || !canvasRef.current) return;
    try {
      const parsed = JSON.parse(raw) as { slug: string; name: string; icon?: string };
      const scale = zoom / 100;
      const rect = canvasRef.current.getBoundingClientRect();
      const dropX = (e.clientX - rect.left) / scale;
      const dropY = (e.clientY - rect.top) / scale;
      const x = Math.max(8, Math.min(canvasSize.w - 220, dropX - 100));
      const y = Math.max(8, Math.min(canvasSize.h - 56, dropY - 20));
      setWidgetNodes((prev) => [
        ...prev,
        { id: makeId(), toolSlug: parsed.slug, toolName: parsed.name, toolIcon: parsed.icon, x, y },
      ]);
      setNotice(`Added widget node: ${parsed.name}`);
    } catch {}
  }

  function addWidgetOutputFromUrl() {
    if (!activeWidget) return;
    const src = widgetOutputUrl.trim();
    if (!src) return;
    setWidgetOutputs((prev) => [
      ...prev,
      { id: makeId(), widgetId: activeWidget.id, title: `${activeWidget.toolName} Output`, src },
    ]);
    setWidgetOutputUrl("");
  }

  function openWidgetWindow(widget: WidgetInstance) {
    if (activeWidget?.id === widget.id) {
      if (isWidgetWindowCollapsed) setIsWidgetWindowCollapsed(false);
      return;
    }
    setIsWidgetWindowCollapsed(false);
    setActiveWidget(widget);
    if (typeof window === "undefined") return;
    const desiredW = 360;
    const gap = 8;
    const propertiesRect = propertiesBarRef.current?.getBoundingClientRect();
    const widgetBarRect = widgetBarRef.current?.getBoundingClientRect();
    const topOffset = propertiesRect ? propertiesRect.bottom + gap : 208;
    const bottomLimit = widgetBarRect ? widgetBarRect.top - gap : window.innerHeight - gap;
    const maxW = Math.max(360, window.innerWidth - 16);
    const w = Math.min(desiredW, maxW);
    const h = Math.max(280, bottomLimit - topOffset);
    const x = Math.max(8, window.innerWidth - w - 8);
    const y = Math.max(72, topOffset);
    setWidgetWindow({ x, y, w, h });
  }

  function startWidgetWindowMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!activeWidget) return;
    e.preventDefault();
    widgetWindowInteractionRef.current = {
      kind: "move",
      startX: e.clientX,
      startY: e.clientY,
      startRect: { x: widgetWindow.x, y: widgetWindow.y, w: widgetWindow.w, h: widgetWindow.h },
    };
  }

  function startWidgetWindowResize(e: React.MouseEvent<HTMLDivElement>, corner: "nw" | "ne" | "sw" | "se") {
    if (!activeWidget) return;
    e.preventDefault();
    e.stopPropagation();
    widgetWindowInteractionRef.current = {
      kind: "resize",
      corner,
      startX: e.clientX,
      startY: e.clientY,
      startRect: { x: widgetWindow.x, y: widgetWindow.y, w: widgetWindow.w, h: widgetWindow.h },
    };
  }

  function undo() {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setUndoStack((s) => s.slice(0, -1));
    setRedoStack((r) => [...r, canvasItems]);
    setActivePageItems(prev);
  }

  function redo() {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack((s) => s.slice(0, -1));
    setUndoStack((u) => [...u, canvasItems]);
    setActivePageItems(next);
  }

  function addPage() {
    setPages((prev) => {
      const next = [...prev, { id: makeId(), items: [] }];
      setActivePageIndex(next.length - 1);
      return next;
    });
    setSelectedId(null);
    setUndoStack([]);
    setRedoStack([]);
  }

  useEffect(() => {
    function onMove(e: MouseEvent) {
      const d = dragRef.current;
      if (d) {
        const scale = zoom / 100;
        const dx = (e.clientX - d.startX) / scale;
        const dy = (e.clientY - d.startY) / scale;
        setActivePageItems((prev) => prev.map((i) => (i.id === d.id ? { ...i, x: d.originX + dx, y: d.originY + dy } : i)));
      }
      const wd = widgetDragRef.current;
      if (wd) {
        const scale = zoom / 100;
        const dx = (e.clientX - wd.startX) / scale;
        const dy = (e.clientY - wd.startY) / scale;
        setWidgetNodes((prev) =>
          prev.map((n) =>
            n.id === wd.id
              ? {
                  ...n,
                  x: Math.max(8, Math.min(canvasSize.w - 220, wd.originX + dx)),
                  y: Math.max(8, Math.min(canvasSize.h - 56, wd.originY + dy)),
                }
              : n,
          ),
        );
      }
      const r = resizeRef.current;
      if (r) {
        const scale = zoom / 100;
        const dx = (e.clientX - r.startX) / scale;
        const dy = (e.clientY - r.startY) / scale;
        const minSize = 20;
        setActivePageItems((prev) =>
          prev.map((i) => {
            if (i.id !== r.id) return i;
            let x = r.originX;
            let y = r.originY;
            let w = r.originW;
            let h = r.originH;

            if (r.dir.includes("e")) w = r.originW + dx;
            if (r.dir.includes("s")) h = r.originH + dy;
            if (r.dir.includes("w")) {
              w = r.originW - dx;
              x = r.originX + dx;
            }
            if (r.dir.includes("n")) {
              h = r.originH - dy;
              y = r.originY + dy;
            }

            if (w < minSize) {
              if (r.dir.includes("w")) x -= minSize - w;
              w = minSize;
            }
            if (h < minSize) {
              if (r.dir.includes("n")) y -= minSize - h;
              h = minSize;
            }
            if (i.type === "text") {
              // Make text size directly follow the resized box so dragging borders is always visible.
              const textLen = Math.max(1, (i.text || "").length);
              const widthFit = (w / textLen) * 1.8;
              const heightFit = h * 0.8;
              const nextFontSize = Math.max(8, Math.min(240, Math.round(Math.min(widthFit, heightFit))));
              return { ...i, x, y, w, h, fontSize: nextFontSize };
            }
            return { ...i, x, y, w, h };
          }),
        );
      }
      const win = widgetWindowInteractionRef.current;
      if (win && typeof window !== "undefined") {
        const minW = 360;
        const minH = 280;
        const maxX = window.innerWidth - 8;
        const maxY = window.innerHeight - 8;
        const dx = e.clientX - win.startX;
        const dy = e.clientY - win.startY;
        if (win.kind === "move") {
          const x = Math.min(Math.max(8, win.startRect.x + dx), maxX - win.startRect.w);
          const y = Math.min(Math.max(72, win.startRect.y + dy), maxY - win.startRect.h);
          setWidgetWindow((prev) => ({ ...prev, x, y }));
        } else if (win.kind === "resize" && win.corner) {
          let x = win.startRect.x;
          let y = win.startRect.y;
          let w = win.startRect.w;
          let h = win.startRect.h;
          if (win.corner === "se") {
            w = win.startRect.w + dx;
            h = win.startRect.h + dy;
          } else if (win.corner === "sw") {
            x = win.startRect.x + dx;
            w = win.startRect.w - dx;
            h = win.startRect.h + dy;
          } else if (win.corner === "ne") {
            y = win.startRect.y + dy;
            h = win.startRect.h - dy;
            w = win.startRect.w + dx;
          } else if (win.corner === "nw") {
            x = win.startRect.x + dx;
            y = win.startRect.y + dy;
            w = win.startRect.w - dx;
            h = win.startRect.h - dy;
          }
          if (w < minW) {
            if (win.corner === "nw" || win.corner === "sw") x -= minW - w;
            w = minW;
          }
          if (h < minH) {
            if (win.corner === "nw" || win.corner === "ne") y -= minH - h;
            h = minH;
          }
          const maxW = window.innerWidth - 16;
          const maxH = window.innerHeight - 80;
          w = Math.min(w, maxW);
          h = Math.min(h, maxH);
          x = Math.min(Math.max(8, x), window.innerWidth - w - 8);
          y = Math.min(Math.max(72, y), window.innerHeight - h - 8);
          setWidgetWindow((prev) => ({ ...prev, x, y, w, h }));
        }
      }
    }
    function onUp() {
      const d = dragRef.current;
      if (d) {
        dragRef.current = null;
        setUndoStack((u) => [...u, d.snapshot]);
        setRedoStack([]);
      }
      const r = resizeRef.current;
      if (r) {
        resizeRef.current = null;
        setUndoStack((u) => [...u, r.snapshot]);
        setRedoStack([]);
      }
      widgetDragRef.current = null;
      widgetWindowInteractionRef.current = null;
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [zoom, canvasSize.w, canvasSize.h]);

  useEffect(() => {
    setSelectedId(null);
    setUndoStack([]);
    setRedoStack([]);
  }, [activePageIndex]);

  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      if (!selected || selected.type !== "text") return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      const isTypingTarget =
        !!target &&
        (target.isContentEditable || tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT");
      if (isTypingTarget) return;
      const text = e.clipboardData?.getData("text");
      if (!text) return;
      e.preventDefault();
      updateSelected({ text });
      setNotice("Pasted text into selected text layer.");
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [selected, updateSelected]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!selected || selected.type !== "text") return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      const isTypingTarget =
        !!target &&
        (target.isContentEditable || tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT");
      if (isTypingTarget) return;

      if ((e.metaKey || e.ctrlKey) && (e.key.toLowerCase() === "z" || e.key.toLowerCase() === "y")) return;
      if (e.key === "Backspace") {
        e.preventDefault();
        updateSelected({ text: (selected.text || "").slice(0, -1) });
        return;
      }
      if (e.key === "Delete") {
        e.preventDefault();
        updateSelected({ text: "" });
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        updateSelected({ text: `${selected.text || ""}\n` });
        return;
      }
      if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        updateSelected({ text: `${selected.text || ""}${e.key}` });
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selected, updateSelected]);

  useEffect(() => {
    function onWidgetOutputMessage(event: MessageEvent) {
      if (!activeWidget) return;
      const payload = event.data as { type?: string; src?: string; title?: string; outputType?: string };
      if (!payload || typeof payload !== "object") return;
      if (payload.type !== "vcm:widget-output") return;
      if (payload.outputType !== "image") return;
      const src = payload.src;
      if (!src || typeof src !== "string") return;
      setWidgetOutputs((prev) => [
        ...prev,
        { id: makeId(), widgetId: activeWidget.id, title: payload.title || `${activeWidget.toolName} Output`, src },
      ]);
      setNotice("Widget output received. Drag it to the canvas.");
    }
    window.addEventListener("message", onWidgetOutputMessage);
    return () => window.removeEventListener("message", onWidgetOutputMessage);
  }, [activeWidget]);

  async function onUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setNotice(null);
    try {
      const next: UploadedAsset[] = [];
      let fallbackCount = 0;
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;
        if (!isLoggedIn) {
          next.push(makeLocalAsset(file, "image"));
          continue;
        }
        try {
          const uploaded = await uploadToWorkspace(file);
          next.push({ localId: makeId(), ...uploaded, status: "uploaded", type: "image" });
        } catch {
          next.push(makeLocalAsset(file, "image"));
          fallbackCount += 1;
        }
      }
      setAssets((prev) => [...next, ...prev]);
      if (next[0]) addImageAsset(next[0]);
      if (!isLoggedIn) setNotice("Guest mode: images stay local in this browser session.");
      if (fallbackCount > 0) setNotice(`Cloud upload failed for ${fallbackCount} image file(s). Imported locally instead.`);
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Upload failed");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="min-h-[calc(100vh-72px)] bg-[#f3f4f6]">
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => onUpload(e.target.files)} />

      <div className="h-16 bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500 text-white px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="inline-flex items-center gap-1 text-sm text-white/90 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <span className="text-sm font-medium">Image Workstation</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={undo} disabled={undoStack.length === 0} className="text-xs px-2.5 py-1.5 rounded bg-white/10 disabled:opacity-50 inline-flex items-center gap-1">
            <Undo2 className="h-3.5 w-3.5" /> Undo
          </button>
          <button onClick={redo} disabled={redoStack.length === 0} className="text-xs px-2.5 py-1.5 rounded bg-white/10 disabled:opacity-50 inline-flex items-center gap-1">
            <Redo2 className="h-3.5 w-3.5" /> Redo
          </button>
          <div className="relative">
            <button
              onClick={openExportMenu}
              className="text-xs px-2.5 py-1.5 rounded bg-white/10 disabled:opacity-50 inline-flex items-center gap-1"
            >
              <Download className="h-3.5 w-3.5" /> {exporting ? "Exporting..." : "Export"}
            </button>
            {exportMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-[340px] rounded-xl border border-gray-200 bg-white text-gray-900 shadow-xl p-3 z-40">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <p className="text-sm font-semibold">{canExportClean ? "Clean Export Ready" : "Watermarked Export Preview"}</p>
                    <p className="text-xs text-gray-500">
                      {canExportClean
                        ? "Your subscription removes watermarks."
                        : "Free exports include VCM branding. Subscribe to remove watermark."}
                    </p>
                  </div>
                  <button onClick={() => setExportMenuOpen(false)} className="text-gray-400 hover:text-gray-700">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="rounded-lg border border-gray-200 bg-gray-50 h-40 overflow-hidden flex items-center justify-center">
                  {exportPreviewLoading && <p className="text-xs text-gray-500">Generating preview...</p>}
                  {!exportPreviewLoading && exportPreviewUrl && (
                    <img
                      src={exportPreviewUrl}
                      alt="Export preview"
                      className="w-full h-full object-contain"
                    />
                  )}
                </div>
                {!canExportClean && (
                  <div className="mt-3 flex items-center gap-2">
                    <Link href="/pricing" className="text-xs rounded-lg px-3 py-2 bg-orange-500 text-white hover:bg-orange-600">
                      Subscribe to Remove Watermark
                    </Link>
                    <button
                      onClick={downloadWatermarkedExport}
                      data-track-output="true"
                      disabled={exporting}
                      className="text-xs rounded-lg px-3 py-2 border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      Download Watermarked
                    </button>
                  </div>
                )}
                {canExportClean && (
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      onClick={downloadCleanExport}
                      data-track-output="true"
                      disabled={exporting}
                      className="text-xs rounded-lg px-3 py-2 bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50"
                    >
                      Download Clean
                    </button>
                    <button
                      onClick={downloadWatermarkedExport}
                      data-track-output="true"
                      disabled={exporting}
                      className="text-xs rounded-lg px-3 py-2 border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      Download Watermarked
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          <button onClick={() => inputRef.current?.click()} className="text-xs px-2.5 py-1.5 rounded bg-white text-gray-900 inline-flex items-center gap-1">
            <Upload className="h-3.5 w-3.5" /> Upload
          </button>
        </div>
      </div>

      <div ref={propertiesBarRef} className="mx-4 mt-3 rounded-lg border border-gray-200 bg-white px-3 py-2 flex items-center gap-3 overflow-x-auto">
        <div className="min-w-[180px] text-xs">
          <p className="font-semibold text-gray-700">Properties</p>
          <p className={`${notice ? "text-blue-700" : "text-gray-500"} truncate`}>
            {notice || (selected ? "Editing selected element." : "Select an element to edit.")}
          </p>
        </div>
        {selected && (
          <>
            <div className="inline-flex items-center gap-1 text-xs">
              <span className="text-gray-600">X</span>
              <input type="number" className="w-16 border rounded px-1.5 py-1 text-xs" value={Math.round(selected.x)} onChange={(e) => updateSelected({ x: Number(e.target.value) })} />
            </div>
            <div className="inline-flex items-center gap-1 text-xs">
              <span className="text-gray-600">Y</span>
              <input type="number" className="w-16 border rounded px-1.5 py-1 text-xs" value={Math.round(selected.y)} onChange={(e) => updateSelected({ y: Number(e.target.value) })} />
            </div>
            <div className="inline-flex items-center gap-1 text-xs">
              <span className="text-gray-600">W</span>
              <input type="number" className="w-16 border rounded px-1.5 py-1 text-xs" value={Math.round(selected.w)} onChange={(e) => updateSelected({ w: Math.max(20, Number(e.target.value)) })} />
            </div>
            <div className="inline-flex items-center gap-1 text-xs">
              <span className="text-gray-600">H</span>
              <input type="number" className="w-16 border rounded px-1.5 py-1 text-xs" value={Math.round(selected.h)} onChange={(e) => updateSelected({ h: Math.max(20, Number(e.target.value)) })} />
            </div>
            <div className="inline-flex items-center gap-1 text-xs min-w-[170px]">
              <span className="text-gray-600">Rotation</span>
              <input type="range" min={0} max={360} value={selected.rotation} onChange={(e) => updateSelected({ rotation: Number(e.target.value) })} className="w-28" />
            </div>
            <div className="inline-flex items-center gap-1 text-xs min-w-[170px]">
              <span className="text-gray-600">Opacity</span>
              <input type="range" min={10} max={100} value={Math.round(selected.opacity * 100)} onChange={(e) => updateSelected({ opacity: Number(e.target.value) / 100 })} className="w-28" />
            </div>
            {(selected.type === "shape" || selected.type === "text") && (
              <div className="inline-flex items-center gap-1 text-xs">
                <span className="text-gray-600">Color</span>
                <input type="color" value={selected.color} onChange={(e) => updateSelected({ color: e.target.value })} className="w-8 h-8 border rounded" />
              </div>
            )}
            {selected.type === "text" && (
              <>
                <input className="w-44 border rounded px-2 py-1 text-xs" value={selected.text || ""} onChange={(e) => updateSelected({ text: e.target.value })} />
                <div className="inline-flex items-center gap-1 text-xs min-w-[210px]">
                  <span className="text-gray-600">Font Family</span>
                  <select
                    className="border rounded px-2 py-1 text-xs min-w-[130px]"
                    value={selected.fontFamily || "Inter"}
                    onChange={(e) => updateSelected({ fontFamily: e.target.value })}
                  >
                    {FONT_OPTIONS.map((font) => (
                      <option key={font} value={font}>
                        {font}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="inline-flex items-center gap-1 text-xs min-w-[170px]">
                  <span className="text-gray-600">Font</span>
                  <input type="range" min={12} max={96} value={selected.fontSize || 32} onChange={(e) => updateSelected({ fontSize: Number(e.target.value) })} className="w-28" />
                </div>
              </>
            )}
            <button onClick={() => bringToFront(selected.id)} className="text-xs border rounded px-2 py-1">Front</button>
            <button onClick={() => sendToBack(selected.id)} className="text-xs border rounded px-2 py-1">Back</button>
            <button onClick={deleteSelected} className="text-xs border border-red-200 text-red-700 rounded px-2 py-1 inline-flex items-center gap-1"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
          </>
        )}
      </div>

      {uploadsOpen && (
        <div className="fixed inset-0 z-40 bg-black/30 flex items-center justify-center p-4" onClick={() => setUploadsOpen(false)}>
          <div className="w-full max-w-lg rounded-xl border border-gray-200 bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Uploads</h3>
              <button onClick={() => setUploadsOpen(false)} className="text-sm text-gray-500 hover:text-gray-700 inline-flex items-center gap-1">
                <X className="h-4 w-4" /> Close
              </button>
            </div>
            <div className="p-4 space-y-3">
              <button onClick={() => inputRef.current?.click()} className="w-full text-left text-sm border rounded-lg px-3 py-2 inline-flex items-center gap-2 hover:bg-gray-50">
                <Upload className="h-4 w-4" /> Upload Images
              </button>
              <div className="space-y-2 max-h-[420px] overflow-auto">
                {assets.length === 0 && <p className="text-sm text-gray-500">No uploads yet.</p>}
                {assets.map((a) => (
                  <button key={a.localId} onClick={() => addImageAsset(a)} className="w-full text-left text-sm border rounded-lg px-3 py-2 truncate hover:bg-gray-50">
                    {a.title}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {elementsOpen && (
        <div className="fixed left-24 top-[260px] z-30 w-80 rounded-2xl border border-gray-200 bg-white shadow-xl p-3">
          <p className="text-sm font-semibold text-gray-900 mb-2">Elements</p>
          <input
            value={elementsQuery}
            onChange={(e) => setElementsQuery(e.target.value)}
            placeholder="Search elements..."
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3"
          />
          <div className="grid grid-cols-2 gap-2 max-h-80 overflow-auto pr-1">
            {elementPresets.map((preset) => (
              <button
                key={preset.key}
                onClick={() => addShape(preset.key as CanvasItem["shapeKind"], preset.w, preset.h)}
                className="text-left border border-gray-200 rounded-lg p-2 hover:bg-gray-50"
              >
                <div className="h-20 rounded-md bg-gray-50 border border-gray-100 flex items-center justify-center mb-2">
                  {renderElementPresetPreview(preset.key as NonNullable<CanvasItem["shapeKind"]>)}
                </div>
                <p className="text-sm font-medium text-gray-900">{preset.label}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {activeWidget && (
        <div
          className="fixed z-40 rounded-xl border border-gray-200 bg-white shadow-xl overflow-hidden flex flex-col"
          style={{ left: widgetWindow.x, top: widgetWindow.y, width: widgetWindow.w, height: widgetWindow.h, display: isWidgetWindowCollapsed ? "none" : "flex" }}
        >
          <div onMouseDown={startWidgetWindowMove} className="px-3 py-2 border-b border-gray-200 flex items-center justify-between cursor-move select-none">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{activeWidget.toolName}</p>
              <p className="text-xs text-gray-500 truncate">/{activeWidget.toolSlug}</p>
            </div>
            <div className="flex items-center gap-2">
              <Link href={`/tools/${activeWidget.toolSlug}`} target="_blank" className="text-xs text-orange-600 hover:text-orange-700">Open</Link>
              <button onClick={() => setIsWidgetWindowCollapsed(true)} className="text-gray-500 hover:text-gray-700 text-lg leading-none px-0.5">-</button>
              <button onClick={() => { setActiveWidget(null); setIsWidgetWindowCollapsed(false); }} className="text-gray-500 hover:text-gray-700"><X className="h-4 w-4" /></button>
            </div>
          </div>
          <iframe src={`/tools/${activeWidget.toolSlug}?embed=1`} className="w-full flex-1 min-h-[140px] bg-white" title={activeWidget.toolName} />
          <div className="px-3 py-2 border-t border-gray-200">
            <p className="text-xs font-semibold text-gray-700 mb-2">Widget Outputs</p>
            <div className="flex items-center gap-2 mb-2">
              <input
                value={widgetOutputUrl}
                onChange={(e) => setWidgetOutputUrl(e.target.value)}
                placeholder="Paste output image URL"
                className="flex-1 border border-gray-200 rounded px-2 py-1 text-xs"
              />
              <button onClick={addWidgetOutputFromUrl} className="text-xs border border-gray-200 rounded px-2 py-1">Add</button>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {widgetOutputs.filter((o) => o.widgetId === activeWidget.id).length === 0 && (
                <p className="text-xs text-gray-500">No outputs yet. Add URL or emit `postMessage` from tool.</p>
              )}
              {widgetOutputs
                .filter((o) => o.widgetId === activeWidget.id)
                .map((o) => (
                  <div
                    key={o.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("application/x-vcm-image-output", JSON.stringify({ src: o.src, title: o.title }));
                    }}
                    className="shrink-0 w-28 border border-gray-200 rounded-lg p-1 bg-gray-50"
                  >
                    <img src={o.src} alt={o.title} className="w-full h-16 object-cover rounded" />
                    <p className="text-[10px] text-gray-700 truncate mt-1">{o.title}</p>
                  </div>
                ))}
            </div>
          </div>
          <div onMouseDown={(e) => startWidgetWindowResize(e, "nw")} className="absolute -top-1 -left-1 w-3 h-3 bg-white border border-gray-300 rounded-full cursor-nwse-resize" />
          <div onMouseDown={(e) => startWidgetWindowResize(e, "ne")} className="absolute -top-1 -right-1 w-3 h-3 bg-white border border-gray-300 rounded-full cursor-nesw-resize" />
          <div onMouseDown={(e) => startWidgetWindowResize(e, "sw")} className="absolute -bottom-1 -left-1 w-3 h-3 bg-white border border-gray-300 rounded-full cursor-nesw-resize" />
          <div onMouseDown={(e) => startWidgetWindowResize(e, "se")} className="absolute -bottom-1 -right-1 w-3 h-3 bg-white border border-gray-300 rounded-full cursor-nwse-resize" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[72px_1fr] gap-4 p-4">
        <aside className="rounded-xl border border-gray-200 bg-white py-3 flex flex-col items-center gap-3">
          <button
            onClick={() => {
              setElementsOpen((v) => !v);
              setUploadsOpen(false);
            }}
            className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center gap-0.5 text-[10px] hover:bg-gray-50 ${elementsOpen ? "bg-orange-50 text-orange-700" : "text-gray-600"}`}
          >
            <Square className="h-4 w-4" />
            <span>Elements</span>
          </button>
          <button onClick={addText} className="w-12 h-12 rounded-lg flex flex-col items-center justify-center gap-0.5 text-[10px] text-gray-600 hover:bg-gray-50">
            <Type className="h-4 w-4" />
            <span>Text</span>
          </button>
          <button onClick={() => setUploadsOpen(true)} className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center gap-0.5 text-[10px] hover:bg-gray-50 ${uploadsOpen ? "bg-orange-50 text-orange-700" : "text-gray-600"}`}>
            <Upload className="h-4 w-4" />
            <span>Uploads</span>
          </button>
          <button
            onClick={() => setNotice("Layer order controls are in the top properties bar.")}
            className="w-12 h-12 rounded-lg flex flex-col items-center justify-center gap-0.5 text-[10px] text-gray-600 hover:bg-gray-50"
          >
            <Layers className="h-4 w-4" />
            <span>Layers</span>
          </button>
        </aside>

        <main className="rounded-xl border border-gray-200 bg-[#e5e7eb] p-4 overflow-auto">
          <div className="w-full flex justify-center">
            <div style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top center" }}>
              <div
                ref={canvasRef}
                className={`relative bg-white shadow-sm ${widgetCanvasDragOver ? "ring-2 ring-orange-300" : ""}`}
                style={{ width: canvasSize.w, height: canvasSize.h }}
                onMouseDown={(e) => {
                  if (e.target === e.currentTarget) setSelectedId(null);
                }}
                onDragOver={(e) => {
                  if (
                    e.dataTransfer.types.includes("application/x-tool-widget") ||
                    e.dataTransfer.types.includes(WORKSPACE_DRAG_MIME)
                  ) {
                    e.preventDefault();
                    setWidgetCanvasDragOver(true);
                  }
                }}
                onDragLeave={() => setWidgetCanvasDragOver(false)}
                onDrop={onCanvasWidgetDrop}
              >
                {canvasItems
                  .slice()
                  .sort((a, b) => a.zIndex - b.zIndex)
                  .map((item) => (
                    <div
                      key={item.id}
                      className={`absolute ${selectedId === item.id ? "ring-2 ring-orange-400" : ""}`}
                      style={{
                        left: item.x,
                        top: item.y,
                        width: item.w,
                        height: item.h,
                        transform: `rotate(${item.rotation}deg)`,
                        opacity: item.opacity,
                        cursor: "move",
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setSelectedId(item.id);
                        dragRef.current = {
                          id: item.id,
                          startX: e.clientX,
                          startY: e.clientY,
                          originX: item.x,
                          originY: item.y,
                          snapshot: canvasItems,
                        };
                      }}
                    >
                      {item.type === "image" && item.src && <img src={item.src} alt="" className="w-full h-full object-contain pointer-events-none" />}
                      {item.type === "shape" && (
                        <div
                          className="w-full h-full"
                          style={{
                            backgroundColor: item.color,
                            borderRadius: item.shapeKind === "circle" || item.shapeKind === "pill" ? "9999px" : undefined,
                            clipPath:
                              item.shapeKind === "triangle"
                                ? "polygon(50% 0%, 0% 100%, 100% 100%)"
                                : item.shapeKind === "diamond"
                                  ? "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)"
                                  : item.shapeKind === "star"
                                    ? "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)"
                                    : undefined,
                          }}
                        />
                      )}
                      {item.type === "text" && (
                        <div className="w-full h-full leading-tight pointer-events-none" style={{ color: item.color, fontSize: item.fontSize || 30, fontFamily: item.fontFamily || "Inter" }}>
                          {item.text}
                        </div>
                      )}
                      {selectedId === item.id && (
                        <>
                          {[
                            { dir: "n", cls: "top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 cursor-ns-resize" },
                            { dir: "s", cls: "bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 cursor-ns-resize" },
                            { dir: "e", cls: "right-0 top-1/2 translate-x-1/2 -translate-y-1/2 cursor-ew-resize" },
                            { dir: "w", cls: "left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize" },
                            { dir: "ne", cls: "top-0 right-0 translate-x-1/2 -translate-y-1/2 cursor-nesw-resize" },
                            { dir: "nw", cls: "top-0 left-0 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize" },
                            { dir: "se", cls: "bottom-0 right-0 translate-x-1/2 translate-y-1/2 cursor-nwse-resize" },
                            { dir: "sw", cls: "bottom-0 left-0 -translate-x-1/2 translate-y-1/2 cursor-nesw-resize" },
                          ].map((h) => (
                            <button
                              key={h.dir}
                              className={`absolute w-3 h-3 rounded-full bg-white border border-orange-400 ${h.cls}`}
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                resizeRef.current = {
                                  id: item.id,
                                  dir: h.dir as "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw",
                                  startX: e.clientX,
                                  startY: e.clientY,
                                  originX: item.x,
                                  originY: item.y,
                                  originW: item.w,
                                  originH: item.h,
                                  originFontSize: item.type === "text" ? item.fontSize || 30 : undefined,
                                  snapshot: canvasItems,
                                };
                              }}
                            />
                          ))}
                        </>
                      )}
                    </div>
                  ))}
                {widgetNodes.map((node) => {
                  const ui = getToolUI({ slug: node.toolSlug, iconKey: node.toolIcon });
                  const Icon = ui.icon;
                  return (
                    <div
                      key={node.id}
                      className="absolute rounded-lg border border-gray-200 bg-white shadow-sm px-2 py-1.5 flex items-center gap-2 cursor-move"
                      style={{ left: node.x, top: node.y, width: 212, minHeight: 44 }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        widgetDragRef.current = {
                          id: node.id,
                          startX: e.clientX,
                          startY: e.clientY,
                          originX: node.x,
                          originY: node.y,
                        };
                      }}
                    >
                      <span className={`w-7 h-7 rounded-md ${ui.bg} flex items-center justify-center shrink-0`}>
                        <Icon className="w-4 h-4 text-white" />
                      </span>
                      <Link href={`/tools/${node.toolSlug}`} className="min-w-0 flex-1 text-xs font-medium text-gray-800 hover:text-orange-600 truncate">
                        {node.toolName}
                      </Link>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeWidgetNode(node.id);
                        }}
                        className="text-gray-400 hover:text-red-600"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-center gap-3">
            <span className="text-sm text-gray-600">Zoom</span>
            <input type="range" min={40} max={200} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} />
            <span className="text-sm text-gray-700 w-12">{zoom}%</span>
          </div>
          <div className="mt-3 flex flex-col items-center gap-2">
            <button
              onClick={addPage}
              className="min-w-[240px] border border-gray-300 bg-white hover:bg-gray-50 rounded-xl px-4 py-2 text-sm font-semibold text-gray-800"
            >
              + Add page
            </button>
            <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1">
              {pages.map((page, idx) => (
                <button
                  key={page.id}
                  onClick={() => setActivePageIndex(idx)}
                  className={`text-xs rounded-lg border px-3 py-1.5 whitespace-nowrap ${
                    idx === activePageIndex ? "border-orange-300 bg-orange-50 text-orange-700" : "border-gray-200 bg-white text-gray-700"
                  }`}
                >
                  Page {idx + 1}
                </button>
              ))}
            </div>
          </div>
        </main>
      </div>

      <div ref={widgetBarRef} className="mx-4 mb-4 rounded-xl border border-gray-200 bg-white px-3 py-2 flex items-center gap-3">
        <div className="relative">
          <button
            onClick={() => setWidgetMenuOpen((v) => !v)}
            className="text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white hover:bg-gray-50 whitespace-nowrap"
          >
            + Add Widget
          </button>
          {widgetMenuOpen && (
            <div className="absolute bottom-full left-0 mb-2 w-80 rounded-xl border border-gray-200 bg-white shadow-xl p-3 z-30">
              <p className="text-xs font-semibold text-gray-700 mb-2">Tool Widgets</p>
              <input
                value={widgetQuery}
                onChange={(e) => setWidgetQuery(e.target.value)}
                placeholder="Search tools..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-2"
              />
              <div className="max-h-64 overflow-auto space-y-1">
                {imageTools.length === 0 && <p className="text-sm text-gray-500 px-1 py-2">No tools found.</p>}
                {imageTools.map((tool) => (
                  (() => {
                    const ui = getToolUI({ slug: tool.slug, iconKey: tool.icon });
                    const Icon = ui.icon;
                    return (
                  <button
                    key={tool.slug}
                    onClick={() => addWidget(tool)}
                    className="w-full text-left rounded-lg border border-gray-200 px-3 py-2 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <span className={`w-8 h-8 rounded-md ${ui.bg} flex items-center justify-center shrink-0`}>
                      <Icon className="w-4 h-4 text-white" />
                    </span>
                    <span className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{tool.name}</p>
                      <p className="text-xs text-gray-500 truncate">/{tool.slug}</p>
                    </span>
                  </button>
                    );
                  })()
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 overflow-x-auto">
          <div className="flex items-center gap-2 min-w-max">
            {widgets.length === 0 && <p className="text-sm text-gray-500">No widgets added yet. Use Add Widget.</p>}
            {widgets.map((w) => (
              (() => {
                const ui = getToolUI({ slug: w.toolSlug, iconKey: w.toolIcon });
                const Icon = ui.icon;
                return (
              <div
                key={w.id}
                draggable
                onDragStart={(e) =>
                  e.dataTransfer.setData(
                    "application/x-tool-widget",
                    JSON.stringify({ slug: w.toolSlug, name: w.toolName, icon: w.toolIcon }),
                  )
                }
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-2.5 py-1.5 bg-gray-50"
                onClick={() => openWidgetWindow(w)}
              >
                <span className={`w-6 h-6 rounded-md ${ui.bg} flex items-center justify-center shrink-0`}>
                  <Icon className="w-3.5 h-3.5 text-white" />
                </span>
                <span className="text-xs text-gray-800 whitespace-nowrap">{w.toolName}</span>
                <Link
                  href={`/tools/${w.toolSlug}`}
                  target="_blank"
                  onClick={(e) => e.stopPropagation()}
                  className="text-[10px] text-orange-600 hover:text-orange-700 whitespace-nowrap"
                >
                  Open
                </Link>
                <button onClick={(e) => { e.stopPropagation(); removeWidget(w.id); }} className="text-gray-400 hover:text-red-600">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
                );
              })()
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AudioStudio({ onBack, isLoggedIn, tools }: { onBack: () => void; isLoggedIn: boolean; tools: ToolOption[] }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const lowPassRef = useRef<BiquadFilterNode | null>(null);
  const [clips, setClips] = useState<UploadedAsset[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedClip, setSelectedClip] = useState<string | null>(null);
  const [widgets, setWidgets] = useState<WidgetInstance[]>([]);
  const [widgetSettings, setWidgetSettings] = useState<Record<string, RackWidgetSettings>>({});
  const [rackDragOver, setRackDragOver] = useState(false);
  const [canvasDragOver, setCanvasDragOver] = useState(false);
  const [gainLevel, setGainLevel] = useState(1);
  const [lowPassOn, setLowPassOn] = useState(false);
  const [lowPassCutoff, setLowPassCutoff] = useState(1200);
  const [exporting, setExporting] = useState(false);
  const [runningWidgetId, setRunningWidgetId] = useState<string | null>(null);
  const [runningChain, setRunningChain] = useState(false);
  const [canExportClean, setCanExportClean] = useState(false);
  const [libraryQuery, setLibraryQuery] = useState("");
  const [runOutputs, setRunOutputs] = useState<RackRunOutput[]>([]);
  const libraryModules = useMemo(() => {
    const classify = (slug: string) => {
      const s = slug.toLowerCase();
      if (s.includes("eq") || s.includes("filter")) return "Dynamics & EQ";
      if (s.includes("compress") || s.includes("comp") || s.includes("limit")) return "Dynamics & EQ";
      if (s.includes("delay") || s.includes("reverb") || s.includes("echo") || s.includes("chorus")) return "Creative & FX";
      if (s.includes("satur") || s.includes("distort") || s.includes("drive")) return "Creative & FX";
      if (s.includes("pitch") || s.includes("midi") || s.includes("key") || s.includes("chord")) return "Pitch & Harmony";
      return "Utility";
    };
    const builtIns: Array<ToolOption & { category: string; summary: string }> = [
      { slug: "studio-audio-gain-up", name: "Gain Up", icon: "Volume2", category: "Dynamics & EQ", summary: "Boost output gain by +0.10x." },
      { slug: "studio-audio-gain-down", name: "Gain Down", icon: "Volume1", category: "Dynamics & EQ", summary: "Reduce output gain by -0.10x." },
      { slug: "studio-audio-toggle-lowpass", name: "Toggle Low-Pass", icon: "SlidersHorizontal", category: "Dynamics & EQ", summary: "Toggle low-pass filter at 1.2kHz." },
    ];
    const dynamic = tools
      .filter((tool) => matchesMode(tool, "audio"))
      .map((tool) => ({
        ...tool,
        category: classify(tool.slug),
        summary: `Tool module: /${tool.slug}`,
      }));
    const merged = [...builtIns, ...dynamic.filter((tool) => !builtIns.some((b) => b.slug === tool.slug))];
    const term = libraryQuery.trim().toLowerCase();
    if (!term) return merged;
    return merged.filter((tool) => tool.name.toLowerCase().includes(term) || tool.slug.toLowerCase().includes(term) || tool.category.toLowerCase().includes(term));
  }, [libraryQuery, tools]);

  const defaultRackSettings = useMemo<RackWidgetSettings>(() => ({ enabled: true, low: 50, mid: 50, high: 50 }), []);
  function getSettings(id: string): RackWidgetSettings {
    return widgetSettings[id] || defaultRackSettings;
  }
  function updateWidgetSettings(id: string, patch: Partial<RackWidgetSettings>) {
    setWidgetSettings((prev) => ({
      ...prev,
      [id]: { ...(prev[id] || defaultRackSettings), ...patch },
    }));
  }

  function removeWidget(id: string) {
    setWidgets((prev) => prev.filter((w) => w.id !== id));
    setWidgetSettings((prev) => {
      if (!prev[id]) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }
  function moveWidget(id: string, direction: "up" | "down") {
    setWidgets((prev) => {
      const index = prev.findIndex((widget) => widget.id === id);
      if (index === -1) return prev;
      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      const [item] = next.splice(index, 1);
      next.splice(target, 0, item);
      return next;
    });
  }
  function onRackDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setRackDragOver(true);
  }
  function onRackDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setRackDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setNotice("Drop audio files on the canvas panel to the right.");
      return;
    }
    const raw = e.dataTransfer.getData("application/x-tool-widget");
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as { slug: string; name: string };
      const nextId = makeId();
      setWidgets((prev) => [...prev, { id: nextId, toolSlug: parsed.slug, toolName: parsed.name }]);
      setWidgetSettings((prev) => ({ ...prev, [nextId]: defaultRackSettings }));
      setNotice(`${parsed.name} added to the rack.`);
    } catch {}
  }
  function onCanvasDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setCanvasDragOver(true);
  }
  function isAudioLike(type: string, title: string) {
    if (type.toLowerCase().startsWith("audio/")) return true;
    return /\.(mp3|wav|m4a|aac|flac|ogg|aif|aiff|wma|opus|webm)$/i.test(title);
  }
  function extFromMime(mime: string) {
    if (mime.includes("mpeg")) return "mp3";
    if (mime.includes("wav")) return "wav";
    if (mime.includes("mp4")) return "m4a";
    if (mime.includes("flac")) return "flac";
    if (mime.includes("ogg")) return "ogg";
    if (mime.includes("webm")) return "webm";
    return "wav";
  }
  function pushRunOutput(moduleName: string, summary: string, links: Array<{ label: string; href: string }> = []) {
    setRunOutputs((prev) => [
      { id: makeId(), moduleName, summary, links },
      ...prev.slice(0, 9),
    ]);
  }
  function sliderToFrequency(value: number, min = 40, max = 16000) {
    const ratio = Math.max(0, Math.min(1, value / 100));
    return Math.round(min * Math.pow(max / min, ratio));
  }
  function mapToolToPedalboardKind(slug: string): PedalboardKind | null {
    const normalized = slug.toLowerCase();
    if (normalized.startsWith("studio-audio-")) return null;
    if (normalized.includes("audio-pitch-shift")) return "pitch-shift";
    if (normalized.includes("audio-reverb")) return "reverb";
    if (normalized.includes("audio-delay") || normalized.includes("vocal-delay")) return "delay";
    if (normalized.includes("audio-compressor")) return "compressor";
    if (normalized.includes("audio-limiter")) return "limiter";
    if (normalized.includes("audio-high-pass-filter") || normalized.includes("hi-pass")) return "high-pass";
    if (normalized.includes("audio-low-pass-filter")) return "low-pass";
    if (normalized.includes("audio-bitcrusher")) return "bitcrusher";
    if (normalized.includes("audio-effect-chain-builder")) return "effect-chain";
    if (normalized.includes("vocal-effects-chain")) return "vocal-chain";
    return null;
  }
  function mapToolToAnalysisKind(slug: string): AnalysisKind | null {
    const normalized = slug.toLowerCase();
    if (normalized.includes("audio-key-detector") || normalized.includes("audio-key-scale-detector")) return "key-detector";
    if (normalized.includes("chord-progression-finder")) return "chord-finder";
    if (normalized.includes("vocal-melody-extractor")) return "melody-extractor";
    if (normalized.includes("audio-to-midi")) return "audio-to-midi";
    return null;
  }
  function analysisRoute(kind: AnalysisKind) {
    if (kind === "key-detector") return "/api/audio-key-detector";
    if (kind === "chord-finder") return "/api/chord-progression-finder";
    if (kind === "melody-extractor") return "/api/vocal-melody-extractor";
    return "/api/audio-to-midi";
  }
  function pedalboardSettingsFromRack(kind: PedalboardKind, settings: RackWidgetSettings) {
    const low = Math.max(0, Math.min(100, settings.low));
    const mid = Math.max(0, Math.min(100, settings.mid));
    const high = Math.max(0, Math.min(100, settings.high));
    const common = {
      bypass: false,
      mix: high / 100,
      outputGain: 0.7 + low / 100,
    };

    if (kind === "reverb") {
      return {
        ...common,
        roomSize: low / 100,
        damp: mid / 100,
        preDelay: Math.round((high / 100) * 250),
      };
    }
    if (kind === "delay") {
      return {
        ...common,
        delayMs: Math.round(20 + (low / 100) * 1180),
        feedback: (mid / 100) * 0.95,
      };
    }
    if (kind === "compressor") {
      return {
        ...common,
        threshold: -60 + (low / 100) * 60,
        ratio: 1 + (mid / 100) * 11,
        attack: 0.001 + (high / 100) * 0.199,
        release: 0.05 + (high / 100) * 1.2,
        knee: 12,
      };
    }
    if (kind === "limiter") {
      return {
        ...common,
        threshold: -20 + (low / 100) * 20,
        release: 0.02 + (mid / 100) * 1.2,
      };
    }
    if (kind === "high-pass" || kind === "low-pass") {
      return {
        ...common,
        frequency: sliderToFrequency(high, 20, 20000),
        q: 0.5 + (mid / 100) * 9.5,
      };
    }
    if (kind === "bitcrusher") {
      return {
        ...common,
        bits: Math.max(2, Math.min(16, Math.round(2 + (low / 100) * 14))),
        downsample: Math.max(1, Math.min(16, Math.round(1 + (mid / 100) * 15))),
      };
    }
    if (kind === "pitch-shift") {
      return {
        ...common,
        semitones: Math.round(-12 + (low / 100) * 24),
      };
    }
    return {
      ...common,
      threshold: -50 + (low / 100) * 40,
      ratio: 1 + (mid / 100) * 7,
      frequency: sliderToFrequency(high, 80, 400),
      roomSize: low / 100,
      damp: 0.4,
      delayMs: Math.round(80 + (high / 100) * 520),
      feedback: (mid / 100) * 0.7,
      chainCompressorOn: true,
      chainEqOn: true,
      chainReverbOn: true,
      chainDelayOn: kind === "vocal-chain" ? true : high > 55,
    };
  }
  async function loadSelectedClipFile(srcOverride?: string): Promise<{ file: File; title: string }> {
    const src = srcOverride || selectedClip;
    if (!src) throw new Error("Select an audio clip first.");
    const clipMeta = clips.find((clip) => clip.src === src) || null;
    const res = await fetch(src);
    if (!res.ok) throw new Error("Unable to load selected clip.");
    const blob = await res.blob();
    const ext = extFromMime(blob.type || "");
    const baseTitle = stripFileExt((clipMeta?.title || "workstation-audio").trim());
    const safeName = `${baseTitle}.${ext}`;
    return {
      file: new File([blob], safeName, { type: blob.type || "audio/wav" }),
      title: baseTitle,
    };
  }
  async function runPedalboardEffect(file: File, kind: PedalboardKind, settings: Record<string, unknown>) {
    const body = new FormData();
    body.append("file", file);
    body.append("kind", kind);
    body.append("settings", JSON.stringify(settings));
    const res = await fetch("/api/audio/pedalboard", {
      method: "POST",
      body,
    });
    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      const detail = typeof payload?.detail === "string" && payload.detail.trim() ? ` (${payload.detail})` : "";
      const message = typeof payload?.error === "string" && payload.error.trim() ? payload.error : "Audio module processing failed.";
      throw new Error(`${message}${detail}`);
    }
    return res.blob();
  }
  function absolutizeLocalHref(href: string) {
    if (href.startsWith("http://") || href.startsWith("https://")) return href;
    if (!href.startsWith("/")) return `/${href}`;
    return href;
  }
  async function maybeImportAnalysisWav(url: string, baseTitle: string, suffix: string) {
    const srcUrl = absolutizeLocalHref(url);
    const res = await fetch(srcUrl);
    if (!res.ok) return;
    const blob = await res.blob();
    if (!blob.type.startsWith("audio/") && !srcUrl.toLowerCase().endsWith(".wav")) return;
    addProcessedClip(blob, baseTitle, suffix);
  }
  async function runAnalysisModule(moduleName: string, kind: AnalysisKind, file: File, baseTitle: string, shouldImportAudio: boolean) {
    const body = new FormData();
    body.append("file", file);
    const res = await fetch(analysisRoute(kind), {
      method: "POST",
      body,
    });
    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      const message = typeof payload?.error === "string" && payload.error.trim() ? payload.error : "Module execution failed.";
      throw new Error(message);
    }
    const data = await res.json();
    if (kind === "key-detector") {
      const confidence = typeof data?.confidence === "number" ? `${Math.round(data.confidence * 100)}%` : "n/a";
      const summary = `Detected key: ${String(data?.keyLabel || "Unknown")} (${confidence})`;
      const links = typeof data?.analysisUrl === "string" ? [{ label: "Download JSON", href: absolutizeLocalHref(data.analysisUrl) }] : [];
      pushRunOutput(moduleName, summary, links);
      return { summary };
    }
    if (kind === "chord-finder") {
      const topChords = Array.isArray(data?.chords) ? data.chords.slice(0, 4).map((c: { chordLabel?: string }) => c?.chordLabel).filter(Boolean) : [];
      const summary = topChords.length > 0 ? `Detected chords: ${topChords.join(" -> ")}` : "Chord analysis completed.";
      const links: Array<{ label: string; href: string }> = [];
      if (typeof data?.files?.jsonUrl === "string") links.push({ label: "JSON", href: absolutizeLocalHref(data.files.jsonUrl) });
      if (typeof data?.files?.csvUrl === "string") links.push({ label: "CSV", href: absolutizeLocalHref(data.files.csvUrl) });
      if (typeof data?.files?.midiUrl === "string") links.push({ label: "MIDI", href: absolutizeLocalHref(data.files.midiUrl) });
      pushRunOutput(moduleName, summary, links);
      return { summary };
    }
    if (kind === "melody-extractor") {
      const noteCount = typeof data?.meta?.noteCount === "number" ? data.meta.noteCount : null;
      const summary = `Melody extracted${noteCount !== null ? ` (${noteCount} notes)` : ""}.`;
      const links: Array<{ label: string; href: string }> = [];
      if (typeof data?.midiUrl === "string") links.push({ label: "MIDI", href: absolutizeLocalHref(data.midiUrl) });
      if (typeof data?.notesUrl === "string") links.push({ label: "Notes CSV", href: absolutizeLocalHref(data.notesUrl) });
      if (typeof data?.pitchUrl === "string") links.push({ label: "Pitch CSV", href: absolutizeLocalHref(data.pitchUrl) });
      if (typeof data?.wavUrl === "string") links.push({ label: "Preview WAV", href: absolutizeLocalHref(data.wavUrl) });
      if (shouldImportAudio && typeof data?.wavUrl === "string") {
        await maybeImportAnalysisWav(data.wavUrl, baseTitle, "melody-preview");
      }
      pushRunOutput(moduleName, summary, links);
      return { summary };
    }
    const notesCount = typeof data?.meta?.notesCount === "number" ? data.meta.notesCount : null;
    const summary = `Audio-to-MIDI completed${notesCount !== null ? ` (${notesCount} notes)` : ""}.`;
    const links: Array<{ label: string; href: string }> = [];
    if (typeof data?.midiUrl === "string") links.push({ label: "MIDI", href: absolutizeLocalHref(data.midiUrl) });
    if (typeof data?.csvUrl === "string") links.push({ label: "Notes CSV", href: absolutizeLocalHref(data.csvUrl) });
    if (typeof data?.wavUrl === "string") links.push({ label: "Sonified WAV", href: absolutizeLocalHref(data.wavUrl) });
    if (shouldImportAudio && typeof data?.wavUrl === "string") {
      await maybeImportAnalysisWav(data.wavUrl, baseTitle, "midi-sonified");
    }
    pushRunOutput(moduleName, summary, links);
    return { summary };
  }
  function addProcessedClip(blob: Blob, baseTitle: string, suffix: string) {
    const src = URL.createObjectURL(blob);
    const title = `${baseTitle}-${suffix}.wav`;
    const next: UploadedAsset = {
      localId: makeId(),
      title,
      src,
      status: "local",
      type: "audio",
    };
    setClips((prev) => [next, ...prev]);
    setSelectedClip(src);
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }

  function ensureAudioGraph() {
    const el = audioRef.current;
    if (!el) return;
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    if (!sourceRef.current) {
      sourceRef.current = audioCtxRef.current.createMediaElementSource(el);
      gainRef.current = audioCtxRef.current.createGain();
      lowPassRef.current = audioCtxRef.current.createBiquadFilter();
      lowPassRef.current.type = "lowpass";
      sourceRef.current.connect(lowPassRef.current);
      lowPassRef.current.connect(gainRef.current);
      gainRef.current.connect(audioCtxRef.current.destination);
    }
    if (gainRef.current) gainRef.current.gain.value = gainLevel;
    if (lowPassRef.current) lowPassRef.current.frequency.value = lowPassOn ? lowPassCutoff : 22000;
  }

  useEffect(() => {
    if (gainRef.current) gainRef.current.gain.value = gainLevel;
    if (lowPassRef.current) lowPassRef.current.frequency.value = lowPassOn ? lowPassCutoff : 22000;
  }, [gainLevel, lowPassOn, lowPassCutoff]);

  useEffect(() => {
    return () => {
      audioCtxRef.current?.close().catch(() => {});
    };
  }, []);

  function applyWidgetBySlug(slug: string, settings: RackWidgetSettings) {
    const normalizedSlug = slug.toLowerCase();
    if (!settings.enabled) return true;
    if (normalizedSlug.includes("studio-audio-gain-up")) {
      const target = Number((1 + (settings.low / 100) * 2).toFixed(2));
      setGainLevel(Math.min(3, Math.max(0.2, target)));
      return true;
    }
    if (normalizedSlug.includes("studio-audio-gain-down")) {
      const reduction = 1 - (settings.low / 100) * 0.8;
      setGainLevel(Math.max(0.2, Number(reduction.toFixed(2))));
      return true;
    }
    if (normalizedSlug.includes("studio-audio-toggle-lowpass")) {
      const minCutoff = 400;
      const maxCutoff = 22000;
      const cutoff = Math.round(minCutoff + (settings.high / 100) * (maxCutoff - minCutoff));
      setLowPassOn(true);
      setLowPassCutoff(cutoff);
      return true;
    }
    return false;
  }

  async function runWidget(widget: WidgetInstance) {
    const settings = getSettings(widget.id);
    if (!settings.enabled) {
      setNotice(`${widget.toolName} is bypassed.`);
      return;
    }
    if (applyWidgetBySlug(widget.toolSlug, settings)) {
      setNotice(`Applied ${widget.toolName}.`);
      pushRunOutput(widget.toolName, "Applied in-canvas DSP module.");
      return;
    }
    if (!selectedClip) {
      setNotice("Import/select audio first, then run a module.");
      return;
    }
    setRunningWidgetId(widget.id);
    setNotice(`Running ${widget.toolName}...`);
    try {
      const { file, title } = await loadSelectedClipFile();
      const effectKind = mapToolToPedalboardKind(widget.toolSlug);
      if (effectKind) {
        const processed = await runPedalboardEffect(file, effectKind, pedalboardSettingsFromRack(effectKind, settings));
        const suffix = widget.toolSlug.replace(/^audio-/, "").replace(/^vocal-/, "vocal-").replace(/[^a-z0-9-]/gi, "-").toLowerCase();
        addProcessedClip(processed, title, suffix || "processed");
        const summary = `${widget.toolName} processed and added as a new clip.`;
        pushRunOutput(widget.toolName, summary);
        setNotice(summary);
        return;
      }
      const analysisKind = mapToolToAnalysisKind(widget.toolSlug);
      if (analysisKind) {
        const result = await runAnalysisModule(widget.toolName, analysisKind, file, title, true);
        setNotice(result.summary);
        return;
      }
      setNotice(`${widget.toolName} cannot run in-rack yet.`);
    } catch (e) {
      setNotice(e instanceof Error ? e.message : `Failed to run ${widget.toolName}.`);
    } finally {
      setRunningWidgetId(null);
    }
  }

  async function runChain() {
    if (widgets.length === 0) {
      setNotice("Add at least one module to the rack.");
      return;
    }
    if (!selectedClip) {
      setNotice("Import/select audio first, then run the chain.");
      return;
    }
    if (runningChain) return;
    setRunningChain(true);
    setGainLevel(1);
    setLowPassOn(false);
    setLowPassCutoff(1200);
    let applied = 0;
    let pending = 0;
    let bypassed = 0;
    let rendered: Blob | null = null;
    try {
      const loaded = await loadSelectedClipFile();
      let currentFile = loaded.file;
      const baseTitle = loaded.title;
      for (const widget of widgets) {
        const settings = getSettings(widget.id);
        if (!settings.enabled) {
          bypassed += 1;
          continue;
        }
        if (applyWidgetBySlug(widget.toolSlug, settings)) {
          applied += 1;
          continue;
        }
        const effectKind = mapToolToPedalboardKind(widget.toolSlug);
        if (effectKind) {
          const processed = await runPedalboardEffect(currentFile, effectKind, pedalboardSettingsFromRack(effectKind, settings));
          rendered = processed;
          currentFile = new File([processed], `${baseTitle}-${effectKind}.wav`, { type: "audio/wav" });
          applied += 1;
          continue;
        }
        const analysisKind = mapToolToAnalysisKind(widget.toolSlug);
        if (analysisKind) {
          await runAnalysisModule(widget.toolName, analysisKind, currentFile, baseTitle, false);
          applied += 1;
          continue;
        }
        pending += 1;
      }
      if (rendered) {
        addProcessedClip(rendered, baseTitle, "chain");
      }
      if (pending === 0) {
        setNotice(`Applied ${applied} module(s) in chain order${bypassed > 0 ? ` (${bypassed} bypassed)` : ""}.`);
      } else {
        setNotice(`Applied ${applied} module(s), ${pending} module(s) still require dedicated rack execution wiring${bypassed > 0 ? `, ${bypassed} bypassed` : ""}.`);
      }
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Failed to run chain.");
    } finally {
      setRunningChain(false);
    }
  }

  async function importAudioFiles(files: File[]) {
    if (files.length === 0) return;
    setNotice(null);
    try {
      const next: UploadedAsset[] = [];
      let fallbackCount = 0;
      for (const file of files) {
        if (!isAudioLike(file.type || "", file.name || "")) continue;
        if (!isLoggedIn) {
          next.push(makeLocalAsset(file, "audio"));
          continue;
        }
        try {
          const uploaded = await uploadToWorkspace(file);
          next.push({ localId: makeId(), ...uploaded, status: "uploaded", type: "audio" });
        } catch {
          next.push(makeLocalAsset(file, "audio"));
          fallbackCount += 1;
        }
      }
      if (next.length === 0) {
        setNotice("No audio files were detected in that drop/import.");
        return;
      }
      setClips((prev) => [...next, ...prev]);
      if (next[0]) setSelectedClip(next[0].src);
      if (!isLoggedIn) setNotice("Guest mode: audio files stay local in this browser session.");
      if (fallbackCount > 0) setNotice(`Cloud upload failed for ${fallbackCount} audio file(s). Imported locally instead.`);
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Upload failed");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }
  function onUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    void importAudioFiles(Array.from(files));
  }
  async function importWorkspaceAudio(dataTransfer: DataTransfer) {
    const workspacePayload = getWorkspaceDragPayload(dataTransfer);
    if (!workspacePayload?.fileUrl) return false;
    if (!isAudioLike(workspacePayload.type, workspacePayload.title)) {
      setNotice("Only audio items can be dropped onto this canvas.");
      return true;
    }
    try {
      const res = await fetch(workspacePayload.fileUrl);
      if (!res.ok) throw new Error("Could not load that workspace item.");
      const blob = await res.blob();
      const file = new File([blob], workspacePayload.title || "workspace-audio", {
        type: blob.type || "audio/wav",
      });
      await importAudioFiles([file]);
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Unable to import that workspace item.");
    }
    return true;
  }
  function onCanvasDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setCanvasDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      void importAudioFiles(Array.from(e.dataTransfer.files));
      return;
    }
    const raw = e.dataTransfer.getData("application/x-tool-widget");
    if (raw) {
      setNotice("Drop effects into the rack panel, not onto the audio canvas.");
      return;
    }
    void importWorkspaceAudio(e.dataTransfer);
  }

  async function togglePlay() {
    const audio = audioRef.current;
    if (!audio || !selectedClip) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      return;
    }
    try {
      ensureAudioGraph();
      if (audioCtxRef.current?.state === "suspended") {
        await audioCtxRef.current.resume();
      }
      audio.src = selectedClip;
      await audio.play();
      setIsPlaying(true);
    } catch {
      setNotice("Unable to play this clip directly.");
    }
  }

  useEffect(() => {
    let cancelled = false;
    async function run() {
      const allowed = await fetchCanExportClean();
      if (!cancelled) setCanExportClean(allowed);
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  async function exportAudio() {
    if (!selectedClip || exporting) return;
    setExporting(true);
    setNotice(null);
    try {
      const res = await fetch(selectedClip);
      if (!res.ok) throw new Error("Unable to load audio for export.");
      const sourceBlob = await res.blob();

      if (canExportClean) {
        const base = stripFileExt((clips.find((c) => c.src === selectedClip)?.title || "workstation-audio").trim());
        const ext = sourceBlob.type.includes("mpeg") ? "mp3" : sourceBlob.type.includes("wav") ? "wav" : "audio";
        triggerDownloadBlob(sourceBlob, `${base}.${ext}`);
        setNotice("Exported clean audio.");
        return;
      }

      const bytes = await sourceBlob.arrayBuffer();
      const AudioCtx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) throw new Error("Audio export is unavailable in this browser.");
      const decodeCtx = new AudioCtx();
      const original = await decodeCtx.decodeAudioData(bytes.slice(0));
      decodeCtx.close().catch(() => {});

      const offline = new OfflineAudioContext(original.numberOfChannels, original.length, original.sampleRate);
      const src = offline.createBufferSource();
      src.buffer = original;
      const mainGain = offline.createGain();
      mainGain.gain.value = 0.95;
      src.connect(mainGain);
      mainGain.connect(offline.destination);
      src.start(0);

      const totalSeconds = original.length / original.sampleRate;
      const addTone = (at: number, freq: number, dur = 0.12, amp = 0.045) => {
        if (at >= totalSeconds) return;
        const osc = offline.createOscillator();
        const g = offline.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        g.gain.setValueAtTime(0, at);
        g.gain.linearRampToValueAtTime(amp, at + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
        osc.connect(g);
        g.connect(offline.destination);
        osc.start(at);
        osc.stop(at + dur + 0.01);
      };

      for (let t = 0.4; t < totalSeconds; t += 4.5) {
        addTone(t, 880);
        addTone(t + 0.16, 988, 0.1, 0.04);
        addTone(t + 0.29, 1318, 0.08, 0.035);
      }

      const rendered = await offline.startRendering();
      const watermarked = audioBufferToWavBlob(rendered);
      const base = stripFileExt((clips.find((c) => c.src === selectedClip)?.title || "workstation-audio").trim());
      triggerDownloadBlob(watermarked, `${base}-vcm-watermarked.wav`);
      setNotice("Exported watermarked audio. Subscribe to remove watermark exports.");
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Export failed.");
    } finally {
      setExporting(false);
    }
  }

  const rackKnobs: Array<{ key: keyof Omit<RackWidgetSettings, "enabled">; label: string }> = [
    { key: "low", label: "Low" },
    { key: "mid", label: "Mid" },
    { key: "high", label: "High" },
  ];
  const libraryGroups = useMemo(() => {
    const order = ["Dynamics & EQ", "Creative & FX", "Pitch & Harmony", "Utility"];
    return order
      .map((name) => ({
        name,
        items: libraryModules.filter((tool) => tool.category === name),
      }))
      .filter((group) => group.items.length > 0);
  }, [libraryModules]);
  function knobReadout(slug: string, key: keyof Omit<RackWidgetSettings, "enabled">, value: number) {
    const normalizedSlug = slug.toLowerCase();
    if ((normalizedSlug.includes("gain-up") || normalizedSlug.includes("gain-down")) && key === "low") {
      const gain = normalizedSlug.includes("gain-up")
        ? Number((1 + (value / 100) * 2).toFixed(2))
        : Number((1 - (value / 100) * 0.8).toFixed(2));
      return `${gain.toFixed(2)}x`;
    }
    if (normalizedSlug.includes("lowpass") && key === "high") {
      const minCutoff = 400;
      const maxCutoff = 22000;
      const cutoff = Math.round(minCutoff + (value / 100) * (maxCutoff - minCutoff));
      return `${cutoff}Hz`;
    }
    return `${Math.round(value)}%`;
  }

  const selectedClipMeta = clips.find((clip) => clip.src === selectedClip) || null;

  return (
    <div className="w-full min-h-screen bg-[#0a0a0b] text-[#c4c4c8] selection:bg-emerald-500/30">
      <div className="min-h-screen border-y border-[#1f1f22] bg-[#101012]">
        <header className="border-b border-[#2a2b2f] bg-[#0f0f11]">
          <div className="flex h-16 items-center justify-between px-3 md:px-4">
            <div className="flex items-center gap-3">
              <button onClick={onBack} className="inline-flex h-9 items-center gap-2 rounded-md border border-[#3a3b40] bg-[#1b1c1f] px-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#d4d5da] hover:border-[#53555c]">
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </button>
              <div className="h-2.5 w-2.5 rounded-full bg-[#00e676] shadow-[0_0_12px_rgba(0,230,118,0.95)]" />
              <p className="text-[30px] leading-none font-semibold tracking-[0.28em] text-white">
                VCM <span className="text-[#23f58f]">MIX</span>
              </p>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em]">
              <button className="inline-flex h-9 items-center gap-1 rounded-md border border-[#36373c] bg-[#16171b] px-3 text-[#d6d6da]">
                <span className="h-2 w-2 rounded-full bg-red-500" /> Rec
              </button>
              <span className="rounded-md border border-[#36373c] bg-[#16171b] px-3 py-2 text-[#b4b6bc]">CPU: 12%</span>
              <span className="rounded-md border border-[#36373c] bg-[#16171b] px-3 py-2 text-[#b4b6bc]">DSP: 34%</span>
              <span className="rounded-md border border-[#36373c] bg-[#16171b] px-3 py-2 text-[#b4b6bc]">48kHz</span>
              <button
                onClick={() => void runChain()}
                disabled={runningChain || !selectedClip}
                className="inline-flex h-9 items-center rounded-md border border-[#42444b] bg-[#1b1c1f] px-3 text-[#d8d9de] hover:border-[#3f9f7e] hover:text-[#9ef3cb] disabled:cursor-not-allowed disabled:opacity-45"
              >
                {runningChain ? "Running..." : "Run"}
              </button>
              <button onClick={() => inputRef.current?.click()} className="inline-flex h-9 items-center gap-1 rounded-md border border-[#42444b] bg-[#1b1c1f] px-3 text-[#d8d9de] hover:border-[#5a5d66]">
                <Upload className="h-3.5 w-3.5" /> Import
              </button>
              <button
                onClick={togglePlay}
                disabled={!selectedClip}
                className="inline-flex h-9 items-center gap-1 rounded-md border border-[#42444b] bg-[#1b1c1f] px-3 text-[#d8d9de] hover:border-[#5a5d66] disabled:cursor-not-allowed disabled:opacity-45"
              >
                {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                {isPlaying ? "Pause" : "Play"}
              </button>
              <button
                onClick={exportAudio}
                data-track-output="true"
                disabled={!selectedClip || exporting}
                className="inline-flex h-9 items-center gap-1 rounded-md border border-[#42444b] bg-[#1b1c1f] px-3 text-[#d8d9de] hover:border-[#5a5d66] disabled:cursor-not-allowed disabled:opacity-45"
              >
                <Download className="h-3.5 w-3.5" /> {exporting ? "Exporting..." : "Export"}
              </button>
            </div>
          </div>
        </header>
        <input ref={inputRef} type="file" accept="audio/*" multiple className="hidden" onChange={(e) => onUpload(e.target.files)} />
        <audio ref={audioRef} onEnded={() => setIsPlaying(false)} className="hidden" />
        {notice && (
          <div className="mx-3 mt-2 rounded border border-[#194534] bg-[#0b251d] px-3 py-2 text-[11px] uppercase tracking-[0.08em] text-[#97efc4] md:mx-4">
            {notice}
          </div>
        )}
        <div className="grid grid-cols-1 xl:grid-cols-[300px_520px_minmax(0,1fr)] xl:h-[calc(100vh-64px)]">
          <aside className="min-h-0 flex flex-col border-r border-[#2a2b2f] bg-[#141416]">
            <div className="border-b border-[#2d2e33] px-4 py-4">
              <p className="text-[22px] font-semibold uppercase tracking-[0.1em] text-[#e2e3e6]">Module Library</p>
              <input
                value={libraryQuery}
                onChange={(e) => setLibraryQuery(e.target.value)}
                placeholder="Search modules..."
                className="mt-3 w-full rounded-md border border-[#3d3e45] bg-[#0f0f11] px-3 py-2 text-sm text-[#ececef] placeholder:text-[#7b7c82] focus:border-[#46d69b] focus:outline-none"
              />
            </div>
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-3 py-4">
              {libraryGroups.map((group) => (
                <div key={group.name} className="space-y-2">
                  <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7b7c82]">{group.name}</p>
                  <div className="space-y-2">
                    {group.items.map((tool) => (
                      <div
                        key={tool.slug}
                        draggable
                        onDragStart={(e) => e.dataTransfer.setData("application/x-tool-widget", JSON.stringify({ slug: tool.slug, name: tool.name }))}
                        className="cursor-grab active:cursor-grabbing rounded-lg border border-[#393a40] bg-[#1c1d22] px-3 py-3 transition-colors hover:border-[#51535b]"
                      >
                        <p className="truncate text-[15px] font-semibold uppercase tracking-[0.03em] text-[#f0f0f2]">{tool.name}</p>
                        <p className="mt-0.5 truncate text-[12px] uppercase tracking-[0.12em] text-[#a0a1a8]">{tool.summary.replace("Tool module: ", "")}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {libraryGroups.length === 0 && <p className="rounded-lg border border-[#393a40] bg-[#1c1d22] px-3 py-4 text-xs uppercase tracking-[0.08em] text-[#a0a1a8]">No modules match this search.</p>}
            </div>
            <div className="border-t border-[#2d2e33] px-4 py-3 text-[11px] uppercase tracking-[0.08em] text-[#7f8086]">
              Drag modules to the rack on the right to insert them into the chain.
            </div>
          </aside>
          <section className="border-r border-[#2a2b2f] bg-[#151518] px-3 pb-3 pt-3">
            <div className="rounded-md border border-[#313238] bg-[#18191d]">
              <div className="flex items-center justify-between border-b border-[#313238] px-4 py-3">
                <div>
                  <p className="text-[36px] leading-none font-semibold uppercase tracking-[0.06em] text-[#f1f1f2]">Master Rack</p>
                  <p className="mt-1 text-[12px] uppercase tracking-[0.18em] text-[#85878f]">
                    <span className="text-[#1ee68a]">•</span> Chain A: Stereo Bus
                  </p>
                </div>
                <div className="rounded border border-[#44464f] bg-[#16181d] px-2 py-1">
                  <div className="flex items-end gap-1">
                    {["#00e676", "#27dc6f", "#47d562", "#66cf55", "#8fcb3c", "#c8ca2a", "#f39b2d", "#ed5d3d"].map((color, idx) => (
                      <span key={`${color}-${idx}`} className="w-2 rounded-sm" style={{ backgroundColor: color, height: `${10 + ((idx * 7) % 16)}px` }} />
                    ))}
                  </div>
                </div>
              </div>
              <div
                onDragOver={onRackDragOver}
                onDragLeave={() => setRackDragOver(false)}
                onDrop={onRackDrop}
                className={`min-h-[calc(100vh-210px)] p-3 transition-colors ${rackDragOver ? "bg-[#123126]" : "bg-[#111216]"}`}
              >
                {widgets.length === 0 && (
                  <div className="grid h-full place-items-center rounded-md border border-dashed border-[#3a3b42] bg-[#17181d] px-6 text-center text-sm uppercase tracking-[0.08em] text-[#85878f]">
                    Drop effects here to build your mix chain.
                  </div>
                )}
                <div className="space-y-3">
                  {widgets.map((widget, index) => {
                    const settings = getSettings(widget.id);
                    return (
                      <div key={widget.id} className={`rounded border px-3 py-3 ${settings.enabled ? "border-[#43454d] bg-[#1d1e23]" : "border-[#35363d] bg-[#18191d] opacity-70"}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-[30px] leading-none font-semibold uppercase tracking-[0.04em] text-[#d0d2d8]">{widget.toolName}</p>
                            <p className="mt-1 truncate text-[11px] uppercase tracking-[0.14em] text-[#84868e]">Slot {index + 1} • /{widget.toolSlug}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => updateWidgetSettings(widget.id, { enabled: !settings.enabled })}
                              className={`rounded border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] ${settings.enabled ? "border-[#1ac37c] bg-[#0d2a1f] text-[#86f0c2]" : "border-[#4a4c53] text-[#b0b2b8]"}`}
                            >
                              {settings.enabled ? "On" : "Bypass"}
                            </button>
                            <button onClick={() => moveWidget(widget.id, "up")} className="rounded border border-[#4a4d56] px-2 py-1 text-[10px] uppercase tracking-[0.1em] text-[#d0d2d8] hover:border-[#6f7179] disabled:opacity-25" disabled={index === 0}>Up</button>
                            <button onClick={() => moveWidget(widget.id, "down")} className="rounded border border-[#4a4d56] px-2 py-1 text-[10px] uppercase tracking-[0.1em] text-[#d0d2d8] hover:border-[#6f7179] disabled:opacity-25" disabled={index === widgets.length - 1}>Down</button>
                            <button
                              onClick={() => void runWidget(widget)}
                              disabled={runningChain || runningWidgetId === widget.id}
                              className="rounded border border-[#2d8e68] bg-[#123f2d] px-2 py-1 text-[10px] uppercase tracking-[0.1em] text-[#97f2ca] hover:border-[#48c291] disabled:cursor-not-allowed disabled:opacity-45"
                            >
                              {runningWidgetId === widget.id ? "Running" : "Run"}
                            </button>
                            <button onClick={() => removeWidget(widget.id)} className="rounded border border-[#4a4d56] px-2 py-1 text-[#d0d2d8] hover:border-[#e06b7d] hover:text-[#ff96a7]"><X className="h-3 w-3" /></button>
                          </div>
                        </div>
                        <div className="mt-3 grid grid-cols-3 gap-2">
                          {rackKnobs.map((knob) => {
                            const value = settings[knob.key];
                            const angle = -135 + (value / 100) * 270;
                            return (
                              <div key={`${widget.id}-${knob.key}`} className="rounded border border-[#3e4048] bg-[#18191e] px-2 py-2 text-center">
                                <div className="mx-auto relative h-14 w-14">
                                  <input
                                    type="range"
                                    min={0}
                                    max={100}
                                    step={1}
                                    value={value}
                                    onChange={(e) => updateWidgetSettings(widget.id, { [knob.key]: Number(e.target.value) } as Partial<RackWidgetSettings>)}
                                    className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                                    aria-label={`${widget.toolName} ${knob.label}`}
                                  />
                                  <div className="absolute inset-0 rounded-full border border-[#5a5d66] bg-gradient-to-b from-[#4a4c55] to-[#2b2c31] shadow-[inset_0_1px_2px_rgba(255,255,255,0.12)]" />
                                  <span className="absolute left-1/2 top-1/2 h-5 w-[2px] rounded bg-[#f0f0f2]" style={{ transform: `translate(-50%, -96%) rotate(${angle}deg)` }} />
                                </div>
                                <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#a0a1a8]">{knob.label}</p>
                                <p className="text-[11px] font-semibold text-[#40e39f]">{knobReadout(widget.toolSlug, knob.key, value)}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <p className="border-t border-[#313238] px-4 py-2 text-[11px] uppercase tracking-[0.12em] text-[#8d8f96]">
                Chain state: gain <span className="text-[#d8dadd]">{gainLevel.toFixed(2)}x</span> | low-pass <span className="text-[#d8dadd]">{lowPassOn ? `${Math.round(lowPassCutoff)}Hz` : "off"}</span>
              </p>
              <div className="border-t border-[#313238] px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8a8c93]">Module Output</p>
                <div className="mt-2 space-y-2 max-h-[170px] overflow-auto">
                  {runOutputs.length === 0 && <p className="text-[11px] uppercase tracking-[0.08em] text-[#787a82]">Run a module to see analysis/output details.</p>}
                  {runOutputs.map((output) => (
                    <div key={output.id} className="rounded border border-[#3b3d44] bg-[#191a1f] px-2 py-2">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#b3b5bc]">{output.moduleName}</p>
                      <p className="mt-1 text-[11px] text-[#d3d5dc]">{output.summary}</p>
                      {output.links.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {output.links.map((link) => (
                            <a
                              key={`${output.id}-${link.href}-${link.label}`}
                              href={link.href}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded border border-[#4f5159] px-2 py-0.5 text-[10px] uppercase tracking-[0.1em] text-[#c5c7cf] hover:border-[#777983]"
                            >
                              {link.label}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
          <section className="bg-[#111113] px-0 py-0">
            <div
              onDragOver={onCanvasDragOver}
              onDragLeave={() => setCanvasDragOver(false)}
              onDrop={onCanvasDrop}
              className={`relative flex min-h-[calc(100vh-64px)] flex-col border-l border-[#2a2b2f] transition-colors ${canvasDragOver ? "bg-[#1f2024]" : "bg-[#0f1012]"}`}
              style={{
                backgroundImage:
                  "linear-gradient(rgba(88,88,94,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(88,88,94,0.26) 1px, transparent 1px)",
                backgroundSize: "54px 54px, 54px 54px",
              }}
            >
              <div className="flex items-center justify-between border-b border-[#2f3036] px-4 py-3">
                <div>
                  <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#8e9097]">Signal Canvas</p>
                  <p className="text-[11px] uppercase tracking-[0.12em] text-[#72747c]">Drop audio files here</p>
                </div>
                <div className="rounded border border-[#44464e] bg-[#1a1b20] px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#b4b6bd]">48kHz</div>
              </div>
              <div className="relative min-h-0 flex-1 px-6 py-5">
                {clips.length === 0 && (
                  <div className="absolute inset-0 grid place-items-center text-center">
                    <div>
                      <p className="text-[14px] uppercase tracking-[0.2em] text-[#83858d]">No Signal Detected</p>
                      <p className="mt-2 text-[74px] font-bold leading-none uppercase tracking-[0.03em] text-[#2f3035]">Waiting For Input</p>
                      <button
                        onClick={() => inputRef.current?.click()}
                        className="mt-6 inline-flex items-center gap-2 rounded border border-[#4b4d55] bg-[#1d1e23] px-3 py-2 text-[11px] uppercase tracking-[0.12em] text-[#d7d9df] hover:border-[#64666f]"
                      >
                        <Upload className="h-3.5 w-3.5" /> Import Audio
                      </button>
                    </div>
                  </div>
                )}
                {clips.length > 0 && (
                  <div className="space-y-3">
                    <div className="h-[220px] rounded border border-[#2f3036] bg-[#0e0f11]/70 p-4">
                      <div className="flex h-full items-end justify-between gap-1">
                        {Array.from({ length: 60 }).map((_, idx) => (
                          <div key={idx} className={`w-[2px] rounded-full ${selectedClip ? "bg-[#a3a6ad]/70" : "bg-[#6a6c72]/60"}`} style={{ height: `${8 + ((idx * 31) % 88)}%` }} />
                        ))}
                      </div>
                    </div>
                    <div className="rounded border border-[#383a42] bg-[#17181c] px-3 py-2">
                      <p className="text-[10px] uppercase tracking-[0.15em] text-[#84868e]">Selected Clip</p>
                      <p className="mt-1 truncate text-sm font-semibold text-[#e7e8ec]">{selectedClipMeta?.title || "None selected"}</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="border-t border-[#2f3036] bg-[#141416]/90 px-3 py-2">
                <p className="px-1 text-[10px] uppercase tracking-[0.15em] text-[#80828a]">Imported Audio ({clips.length})</p>
                <div className="mt-1 max-h-[165px] space-y-1 overflow-auto">
                  {clips.map((clip) => (
                    <button
                      key={clip.localId}
                      onClick={() => setSelectedClip(clip.src)}
                      className={`w-full rounded border px-3 py-2 text-left ${selectedClip === clip.src ? "border-[#2b9470] bg-[#10291f] text-[#9aefc6]" : "border-[#3a3b42] bg-[#1c1d22]/90 text-[#d1d2d8] hover:border-[#55575f]"}`}
                    >
                      <span className="block truncate text-sm font-medium">{clip.title}</span>
                      <span className="block text-[10px] uppercase tracking-[0.15em] text-[#8f9198]">{clip.status === "uploaded" ? "Cloud" : "Local"}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="border-t border-[#2f3036] bg-[#151619] px-4 py-2 text-[11px] uppercase tracking-[0.16em] text-[#80828a]">
                Auto-save: on&nbsp;&nbsp; Undo: ctrl+z &nbsp;&nbsp; VCM Mix Engine v1.0.0-alpha
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default function WorkstationsClient({ isLoggedIn }: WorkstationsClientProps) {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<WorkstationMode | null>(null);
  const [tools, setTools] = useState<ToolOption[]>([]);
  const [loadingTools, setLoadingTools] = useState(true);
  const preloadImage = useMemo(
    () => ({
      src: searchParams?.get("src"),
      title: searchParams?.get("title"),
      itemId: searchParams?.get("itemId"),
    }),
    [searchParams]
  );

  useEffect(() => {
    if (mode) return;
    const rawMode = searchParams?.get("mode");
    if (rawMode === "image" || rawMode === "pdf" || rawMode === "audio") {
      setMode(rawMode);
    }
  }, [searchParams, mode]);

  useEffect(() => {
    let mounted = true;
    async function loadTools() {
      try {
        const res = await fetch("/api/tools/search");
        if (!res.ok) throw new Error("Failed to load tools");
        const data = await res.json();
        if (mounted) setTools(Array.isArray(data.tools) ? data.tools : []);
      } catch {
        if (mounted) setTools([]);
      } finally {
        if (mounted) setLoadingTools(false);
      }
    }
    loadTools();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const immersive = mode === "audio";
    const roots = [document.documentElement, document.body];
    for (const root of roots) {
      if (immersive) root.classList.add("audio-workstation-immersive");
      else root.classList.remove("audio-workstation-immersive");
    }
    return () => {
      for (const root of roots) {
        root.classList.remove("audio-workstation-immersive");
      }
    };
  }, [mode]);

  if (!mode) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Choose Your Workstation</h1>
          <p className="text-gray-600 mt-2">Choose media type first, then build a modular workstation with drag-and-drop widgets.</p>
        </div>
        {!isLoggedIn && <div className="rounded-lg border border-blue-200 bg-blue-50 text-blue-800 px-4 py-3">Guest mode enabled. Files remain local in this browser.</div>}
        {loadingTools && <div className="text-sm text-gray-500">Loading available widgets...</div>}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ModeCard title="PDF Workstation" description="PDF-focused canvas + PDF tool widgets." icon={<FileText className="h-6 w-6" />} onClick={() => setMode("pdf")} />
          <ModeCard title="Image Workstation" description="Design canvas + image tool widgets." icon={<ImageIcon className="h-6 w-6" />} onClick={() => setMode("image")} />
          <ModeCard title="Audio Workstation" description="Timeline canvas + audio tool widgets." icon={<Music2 className="h-6 w-6" />} onClick={() => setMode("audio")} />
        </div>
      </div>
    );
  }

  if (mode === "pdf") {
    return (
      <PdfStudio
        onBack={() => setMode(null)}
        isLoggedIn={isLoggedIn}
        tools={tools}
        preloadPdf={preloadImage}
      />
    );
  }
  if (mode === "image") return <ImageStudio onBack={() => setMode(null)} isLoggedIn={isLoggedIn} tools={tools} preloadImage={preloadImage} />;
  return <AudioStudio onBack={() => setMode(null)} isLoggedIn={isLoggedIn} tools={tools} />;
}
