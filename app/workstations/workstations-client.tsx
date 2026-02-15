"use client";

import { DragEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, FileText, Image as ImageIcon, Music2, Pause, Play, Scissors, Upload, X, Undo2, Redo2, Square, Type, Layers, Trash2 } from "lucide-react";
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

function PdfStudio({ onBack, isLoggedIn, tools }: { onBack: () => void; isLoggedIn: boolean; tools: ToolOption[] }) {
  const inputRef = useRef<HTMLInputElement>(null);
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
      { id: makeId(), type: "text", x: 130, y: 130, w: 260, h: 70, rotation: 0, opacity: 1, color: "#111827", text: "Edit this text", fontSize: 40, fontFamily: "Inter", zIndex: z },
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
      ctx.fillStyle = "#111827";
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
  const [dragOver, setDragOver] = useState(false);
  const [gainLevel, setGainLevel] = useState(1);
  const [lowPassOn, setLowPassOn] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [canExportClean, setCanExportClean] = useState(false);
  const tracks = useMemo(() => ["Track 1", "Track 2", "Track 3", "Track 4"], []);

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
    if (lowPassRef.current) lowPassRef.current.frequency.value = lowPassOn ? 1200 : 22000;
  }

  useEffect(() => {
    if (gainRef.current) gainRef.current.gain.value = gainLevel;
    if (lowPassRef.current) lowPassRef.current.frequency.value = lowPassOn ? 1200 : 22000;
  }, [gainLevel, lowPassOn]);

  function runWidget(widget: WidgetInstance) {
    const slug = widget.toolSlug.toLowerCase();
    if (slug.includes("studio-audio-gain-up")) {
      setGainLevel((v) => Math.min(3, Number((v + 0.1).toFixed(2))));
      return;
    }
    if (slug.includes("studio-audio-gain-down")) {
      setGainLevel((v) => Math.max(0.2, Number((v - 0.1).toFixed(2))));
      return;
    }
    if (slug.includes("studio-audio-toggle-lowpass")) {
      setLowPassOn((v) => !v);
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
        if (!file.type.startsWith("audio/")) continue;
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

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-4">
      <button onClick={onBack} className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"><ArrowLeft className="h-4 w-4" /> Back</button>
      <div className="rounded-xl border border-gray-200 bg-white p-3 flex items-center justify-between">
        <div className="text-sm font-medium text-gray-900">Audio Workstation</div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportAudio}
            data-track-output="true"
            disabled={!selectedClip || exporting}
            className="inline-flex items-center gap-2 text-xs rounded-lg border px-3 py-1.5 disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" /> {exporting ? "Exporting..." : "Export"}
          </button>
          <button onClick={() => inputRef.current?.click()} className="inline-flex items-center gap-2 text-xs rounded-lg border px-3 py-1.5"><Upload className="h-3.5 w-3.5" /> Import Audio</button>
          <button onClick={togglePlay} className="inline-flex items-center gap-2 text-xs rounded-lg border px-3 py-1.5">{isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}{isPlaying ? "Pause" : "Play"}</button>
          <button className="inline-flex items-center gap-2 text-xs rounded-lg border px-3 py-1.5"><Scissors className="h-3.5 w-3.5" /> Split</button>
        </div>
      </div>
      <input ref={inputRef} type="file" accept="audio/*" multiple className="hidden" onChange={(e) => onUpload(e.target.files)} />
      <audio ref={audioRef} onEnded={() => setIsPlaying(false)} className="hidden" />
      {notice && <div className="rounded-lg border border-blue-200 bg-blue-50 text-blue-800 px-4 py-2 text-sm">{notice}</div>}

      <div className="grid grid-cols-1 xl:grid-cols-[260px_1fr] gap-4">
        <WidgetLibrary mode="audio" tools={tools} />
        <div onDragOver={onDragOver} onDragLeave={() => setDragOver(false)} onDrop={onDrop} className={`rounded-xl border border-gray-200 p-4 ${dragOver ? "bg-orange-50 border-orange-300" : "bg-white"}`}>
          <p className="text-sm text-gray-600 mb-2">Drop audio widgets into this workstation</p>
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
          <div className="mt-2 text-xs text-gray-500">Audio chain: gain {gainLevel.toFixed(2)}x | low-pass {lowPassOn ? "on" : "off"}</div>
          <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4 min-h-[560px]">
            <div className="h-10 rounded-lg bg-gray-50 border border-gray-200 mb-3 px-3 flex items-center text-xs text-gray-500">Timeline Ruler</div>
            <div className="space-y-3">
              {tracks.map((track, trackIndex) => {
                const trackClips = clips.filter((_, clipIndex) => clipIndex % tracks.length === trackIndex);
                return (
                  <div key={track} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <div className="text-xs text-gray-500 mb-2">{track}</div>
                    <div className="space-y-2">
                      {trackClips.length === 0 && <div className="h-8 rounded bg-white border border-gray-200" />}
                      {trackClips.map((clip, i) => (
                        <button key={`${clip.title}-${i}`} onClick={() => setSelectedClip(clip.src)} className={`h-8 rounded px-3 text-xs text-left border w-full ${selectedClip === clip.src ? "border-orange-300 bg-orange-50" : "border-gray-200 bg-white"}`}>
                          {clip.title}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
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

  if (mode === "pdf") return <PdfStudio onBack={() => setMode(null)} isLoggedIn={isLoggedIn} tools={tools} />;
  if (mode === "image") return <ImageStudio onBack={() => setMode(null)} isLoggedIn={isLoggedIn} tools={tools} preloadImage={preloadImage} />;
  return <AudioStudio onBack={() => setMode(null)} isLoggedIn={isLoggedIn} tools={tools} />;
}
