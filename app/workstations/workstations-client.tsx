"use client";

import { DragEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, FileText, Image as ImageIcon, Music2, Pause, Play, Scissors, Upload, X, Undo2, Redo2, Square, Type, Layers, Trash2 } from "lucide-react";
import { getToolUI } from "@/lib/ui/get-tool-ui";

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

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-4">
      <button onClick={onBack} className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"><ArrowLeft className="h-4 w-4" /> Back</button>
      <div className="rounded-xl border border-gray-200 bg-white p-3 flex items-center justify-between">
        <div className="text-sm font-medium text-gray-900">PDF Workstation</div>
        <button onClick={() => inputRef.current?.click()} className="text-xs border rounded-lg px-3 py-1.5 inline-flex items-center gap-1"><Upload className="h-3.5 w-3.5" /> Open PDF</button>
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

function ImageStudio({ onBack, isLoggedIn, tools }: { onBack: () => void; isLoggedIn: boolean; tools: ToolOption[] }) {
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
    snapshot: CanvasItem[];
  } | null>(null);
  const widgetWindowInteractionRef = useRef<{
    kind: "move" | "resize";
    corner?: "nw" | "ne" | "sw" | "se";
    startX: number;
    startY: number;
    startRect: { x: number; y: number; w: number; h: number };
  } | null>(null);

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
                  if (e.dataTransfer.types.includes("application/x-tool-widget")) {
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

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-4">
      <button onClick={onBack} className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"><ArrowLeft className="h-4 w-4" /> Back</button>
      <div className="rounded-xl border border-gray-200 bg-white p-3 flex items-center justify-between">
        <div className="text-sm font-medium text-gray-900">Audio Workstation</div>
        <div className="flex items-center gap-2">
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
  const [mode, setMode] = useState<WorkstationMode | null>(null);
  const [tools, setTools] = useState<ToolOption[]>([]);
  const [loadingTools, setLoadingTools] = useState(true);

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
  if (mode === "image") return <ImageStudio onBack={() => setMode(null)} isLoggedIn={isLoggedIn} tools={tools} />;
  return <AudioStudio onBack={() => setMode(null)} isLoggedIn={isLoggedIn} tools={tools} />;
}
