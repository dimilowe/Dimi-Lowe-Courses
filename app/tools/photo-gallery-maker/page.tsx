"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  Upload, 
  Download, 
  Copy, 
  Check, 
  Image as ImageIcon,
  Grid3X3,
  LayoutGrid,
  Columns,
  GalleryHorizontal,
  Trash2,
  AlertCircle,
  RotateCcw,
  ArrowUp,
  ArrowDown,
  Shuffle
} from "lucide-react";
import MonetizationBar from "@/components/MonetizationBar";
import PostResultUpsell from "@/components/PostResultUpsell";
import { useToolPresets, type ToolPresetRecord } from "@/lib/hooks/useToolPresets";
import { ToolPresetBar } from "@/components/presets/ToolPresetBar";

type LayoutType =
  | "grid-2"
  | "grid-3"
  | "grid-4"
  | "grid-5"
  | "masonry-2"
  | "masonry"
  | "masonry-4"
  | "horizontal-compact"
  | "horizontal"
  | "horizontal-tall"
  | "collage"
  | "polaroid";
type FitMode = "cover" | "contain";

interface UploadedImage {
  id: string;
  src: string;
  name: string;
  width: number;
  height: number;
  caption: string;
}

type PhotoGalleryPresetJson = {
  layout: LayoutType;
  spacing: number;
  borderRadius: number;
  bgColor: string;
  gridColumns: number;
  masonryColumns: number;
  horizontalHeight: number;
  fitMode: FitMode;
  showCaptions: boolean;
  captionSize: number;
  captionColor: string;
};

type PhotoGalleryPresetRecord = ToolPresetRecord<PhotoGalleryPresetJson>;

const MAX_IMAGES = 80;
const MAX_FILE_SIZE = 20 * 1024 * 1024;

export default function PhotoGalleryMakerPage() {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [layout, setLayout] = useState<LayoutType>("grid-3");
  const [spacing, setSpacing] = useState(8);
  const [borderRadius, setBorderRadius] = useState(8);
  const [bgColor, setBgColor] = useState("#ffffff");
  const [gridColumns, setGridColumns] = useState(3);
  const [masonryColumns, setMasonryColumns] = useState(3);
  const [horizontalHeight, setHorizontalHeight] = useState(200);
  const [fitMode, setFitMode] = useState<FitMode>("cover");
  const [showCaptions, setShowCaptions] = useState(true);
  const [captionSize, setCaptionSize] = useState(14);
  const [captionColor, setCaptionColor] = useState("#111827");
  const [presetName, setPresetName] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedImageId, setDraggedImageId] = useState<string | null>(null);
  const [dragOverImageId, setDragOverImageId] = useState<string | null>(null);
  const [slotImageIds, setSlotImageIds] = useState<Array<string | null>>([]);
  const [dragOverSlotIndex, setDragOverSlotIndex] = useState<number | null>(null);
  const { presets, savingPreset, savePreset } = useToolPresets<PhotoGalleryPresetJson>({
    toolId: "photo-gallery-maker",
    originCloudId: "creation",
  });

  const processFiles = useCallback(async (files: FileList) => {
    setError("");
    const onlyImages = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (onlyImages.length === 0) {
      setError("Please upload valid image files.");
      return;
    }

    const availableSlots = MAX_IMAGES - images.length;
    if (availableSlots <= 0) {
      setError(`You can only add up to ${MAX_IMAGES} images.`);
      return;
    }

    const capped = onlyImages.slice(0, availableSlots);
    const oversizeCount = capped.filter((f) => f.size > MAX_FILE_SIZE).length;
    const validFiles = capped.filter((f) => f.size <= MAX_FILE_SIZE);
    if (validFiles.length === 0) {
      setError(`All selected images were larger than ${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB.`);
      return;
    }

    const readDataUrl = (file: File) =>
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

    const readDimensions = (src: string) =>
      new Promise<{ width: number; height: number }>((resolve, reject) => {
        const img = new window.Image();
        img.onload = () => resolve({ width: img.width, height: img.height });
        img.onerror = reject;
        img.src = src;
      });

    try {
      const prepared: UploadedImage[] = [];
      for (const file of validFiles) {
        const src = await readDataUrl(file);
        const dims = await readDimensions(src);
        prepared.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
          src,
          name: file.name,
          width: dims.width,
          height: dims.height,
          caption: "",
        });
      }
      setImages((prev) => [...prev, ...prepared]);
      setShowPreview(true);
      if (oversizeCount > 0) {
        setStatusMessage(`Added ${prepared.length} images. Skipped ${oversizeCount} image(s) over 20MB.`);
      } else {
        setStatusMessage(`Added ${prepared.length} image(s).`);
      }
      setTimeout(() => setStatusMessage(""), 2500);
    } catch {
      setError("Some images could not be processed. Try different files.");
    }
  }, [images.length]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) processFiles(files);
    e.target.value = "";
  }, [processFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files) processFiles(files);
  }, [processFiles]);

  const removeImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
    setSlotImageIds((prev) => prev.map((slotId) => (slotId === id ? null : slotId)));
  };

  const clearAllImages = () => {
    setImages([]);
    setSlotImageIds((prev) => prev.map(() => null));
  };

  const moveImage = (id: string, direction: "up" | "down") => {
    setImages((prev) => {
      const idx = prev.findIndex((img) => img.id === id);
      if (idx === -1) return prev;
      const target = direction === "up" ? idx - 1 : idx + 1;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  const reorderImages = (sourceId: string, targetId: string) => {
    setImages((prev) => {
      const sourceIndex = prev.findIndex((img) => img.id === sourceId);
      const targetIndex = prev.findIndex((img) => img.id === targetId);
      if (sourceIndex === -1 || targetIndex === -1 || sourceIndex === targetIndex) return prev;
      const next = [...prev];
      const [moved] = next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
  };

  const updateCaption = (id: string, caption: string) => {
    setImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, caption } : img))
    );
  };

  const assignImageToSlot = (slotIndex: number, imageId: string) => {
    setSlotImageIds((prev) => {
      const next = [...prev];
      for (let i = 0; i < next.length; i++) {
        if (next[i] === imageId) next[i] = null;
      }
      next[slotIndex] = imageId;
      return next;
    });
  };

  const clearSlot = (slotIndex: number) => {
    setSlotImageIds((prev) => {
      const next = [...prev];
      next[slotIndex] = null;
      return next;
    });
  };

  const autoFillSlots = () => {
    setSlotImageIds((prev) => {
      const used = new Set(prev.filter((id): id is string => Boolean(id)));
      const available = images.map((img) => img.id).filter((id) => !used.has(id));
      let cursor = 0;
      const next = [...prev];
      for (let i = 0; i < next.length && cursor < available.length; i++) {
        if (!next[i]) {
          next[i] = available[cursor];
          cursor += 1;
        }
      }
      return next;
    });
    setStatusMessage("Filled empty slots with uploaded images.");
    setTimeout(() => setStatusMessage(""), 1500);
  };

  const shuffleSlots = () => {
    setSlotImageIds((prev) => {
      const filledIndices: number[] = [];
      const values: string[] = [];
      prev.forEach((slotId, index) => {
        if (slotId) {
          filledIndices.push(index);
          values.push(slotId);
        }
      });
      for (let i = values.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [values[i], values[j]] = [values[j], values[i]];
      }
      const next = [...prev];
      filledIndices.forEach((slotIndex, idx) => {
        next[slotIndex] = values[idx];
      });
      return next;
    });
    setStatusMessage("Shuffled placed images.");
    setTimeout(() => setStatusMessage(""), 1500);
  };

  const resetStyle = () => {
    setLayout("grid-3");
    setSpacing(8);
    setBorderRadius(8);
    setBgColor("#ffffff");
    setGridColumns(3);
    setMasonryColumns(3);
    setHorizontalHeight(200);
    setFitMode("cover");
    setShowCaptions(true);
    setCaptionSize(14);
    setCaptionColor("#111827");
  };

  const sanitizeHexColor = (value: string) => {
    const candidate = value.trim();
    const valid = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;
    return valid.test(candidate) ? candidate : "#ffffff";
  };

  const sanitizeCaptionColor = (value: string) => {
    const candidate = value.trim();
    const valid = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;
    return valid.test(candidate) ? candidate : "#111827";
  };

  const isHorizontalLayout = layout === "horizontal" || layout === "horizontal-compact" || layout === "horizontal-tall";
  const isMasonryLayout = layout === "masonry" || layout === "masonry-2" || layout === "masonry-4";
  const isCollageLayout = layout === "collage";
  const isPolaroidLayout = layout === "polaroid";

  const getSlotCount = useCallback(() => {
    if (isCollageLayout) return 5;
    if (isHorizontalLayout) return 6;
    if (isMasonryLayout) return masonryColumns * 3;
    return gridColumns * 2;
  }, [gridColumns, isCollageLayout, isHorizontalLayout, isMasonryLayout, masonryColumns]);

  useEffect(() => {
    const nextCount = getSlotCount();
    setSlotImageIds((prev) => {
      const next = prev.slice(0, nextCount);
      while (next.length < nextCount) next.push(null);
      return next;
    });
  }, [getSlotCount]);

  const applyLayoutPreset = (nextLayout: LayoutType) => {
    setLayout(nextLayout);
    if (nextLayout === "grid-2") setGridColumns(2);
    if (nextLayout === "grid-3") setGridColumns(3);
    if (nextLayout === "grid-4") setGridColumns(4);
    if (nextLayout === "grid-5") setGridColumns(5);
    if (nextLayout === "masonry-2") setMasonryColumns(2);
    if (nextLayout === "masonry") setMasonryColumns(3);
    if (nextLayout === "masonry-4") setMasonryColumns(4);
    if (nextLayout === "horizontal-compact") setHorizontalHeight(140);
    if (nextLayout === "horizontal") setHorizontalHeight(200);
    if (nextLayout === "horizontal-tall") setHorizontalHeight(300);
    if (nextLayout === "collage") setGridColumns(4);
    if (nextLayout === "polaroid") {
      setGridColumns(3);
      setShowCaptions(true);
    }
  };

  const generateGallery = () => {
    if (images.length === 0) {
      setError("Please upload at least one photo to create a gallery.");
      return;
    }
    setError("");
    setIsGenerating(true);
    setStatusMessage("Gallery generated successfully!");
    setTimeout(() => {
      setIsGenerating(false);
      setStatusMessage("");
    }, 200);
  };

  const getLayoutStyles = (): React.CSSProperties => {
    if (isCollageLayout) {
      return {
        display: "grid",
        gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
        gap: `${spacing}px`,
        gridAutoRows: "minmax(80px, auto)",
      };
    }

    switch (layout) {
      case "grid-2":
      case "grid-3":
      case "grid-4":
      case "grid-5":
      case "polaroid":
        return {
          display: "grid",
          gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))`,
          gap: `${spacing}px`,
        };
      case "masonry-2":
      case "masonry":
      case "masonry-4":
        return {
          columnCount: masonryColumns,
          columnGap: `${spacing}px`,
        };
      case "horizontal-compact":
      case "horizontal":
      case "horizontal-tall":
        return {
          display: "flex",
          gap: `${spacing}px`,
          overflowX: "auto",
          paddingBottom: "10px",
        };
      default:
        return {};
    }
  };

  const getImageStyles = (): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
      borderRadius: `${borderRadius}px`,
      display: "block",
    };

    if (isMasonryLayout) {
      return {
        ...baseStyles,
        width: "100%",
      };
    }

    if (isHorizontalLayout) {
      return {
        ...baseStyles,
        height: `${horizontalHeight}px`,
        width: "auto",
        flexShrink: 0,
        objectFit: fitMode,
      };
    }

    return {
      ...baseStyles,
      width: "100%",
      height: "auto",
      objectFit: fitMode,
      aspectRatio: "1",
    };
  };

  const getItemStyles = (): React.CSSProperties => {
    if (isMasonryLayout) {
      return {
        breakInside: "avoid",
        marginBottom: `${spacing}px`,
      };
    }
    if (isHorizontalLayout) {
      return {
        flexShrink: 0,
      };
    }
    if (isCollageLayout) {
      return {
        margin: 0,
      };
    }
    if (isPolaroidLayout) {
      return {
        margin: 0,
        background: "#ffffff",
        padding: "8px 8px 12px 8px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.12)",
        borderRadius: `${Math.max(6, borderRadius)}px`,
      };
    }
    return {};
  };

  const getFigureStyles = (index: number): React.CSSProperties => {
    if (isCollageLayout && index === 0) {
      return {
        gridColumn: "span 2",
        gridRow: "span 2",
      };
    }
    return {};
  };

  const shouldRenderCaptions = showCaptions && images.some((img) => img.caption.trim().length > 0);
  const captionLineHeight = captionSize + 4;
  const captionSpace = shouldRenderCaptions ? captionLineHeight + 8 : 0;

  const drawRoundedImage = (
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    x: number,
    y: number,
    w: number,
    h: number
  ) => {
    const scale = fitMode === "cover"
      ? Math.max(w / img.width, h / img.height)
      : Math.min(w / img.width, h / img.height);
    const scaledWidth = img.width * scale;
    const scaledHeight = img.height * scale;
    const drawX = x + (w - scaledWidth) / 2;
    const drawY = y + (h - scaledHeight) / 2;

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, borderRadius);
    ctx.clip();
    ctx.drawImage(img, drawX, drawY, scaledWidth, scaledHeight);
    ctx.restore();
  };

  const drawCaption = (
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    width: number
  ) => {
    if (!text.trim() || !shouldRenderCaptions) return;
    ctx.save();
    ctx.fillStyle = captionColor;
    ctx.font = `${captionSize}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    const maxChars = Math.max(12, Math.floor(width / (captionSize * 0.55)));
    const compact = text.length > maxChars ? `${text.slice(0, maxChars - 1)}…` : text;
    ctx.fillText(compact, x + width / 2, y);
    ctx.restore();
  };

  const downloadAsImage = async () => {
    const placedImages = slotImageIds
      .map((id) => images.find((img) => img.id === id))
      .filter((img): img is UploadedImage => Boolean(img));

    if (placedImages.length === 0) {
      setError("Drag uploaded images into the layout slots first.");
      return;
    }

    setStatusMessage("Generating PNG...");

    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not get canvas context");

      const loadImage = (src: string): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
          const img = new window.Image();
          img.crossOrigin = "anonymous";
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = src;
        });
      };

      const loadedImages = await Promise.all(placedImages.map(img => loadImage(img.src)));

      if (isHorizontalLayout) {
        const fixedHeight = horizontalHeight;
        let totalWidth = spacing;
        const imageWidths: number[] = [];
        
        loadedImages.forEach(img => {
          const scaledWidth = (img.width / img.height) * fixedHeight;
          imageWidths.push(scaledWidth);
          totalWidth += scaledWidth + spacing;
        });

        canvas.width = totalWidth;
        canvas.height = fixedHeight + spacing * 2 + captionSpace;

        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        let currentX = spacing;
        for (let i = 0; i < loadedImages.length; i++) {
          const img = loadedImages[i];
          const imgWidth = imageWidths[i];
          
          drawRoundedImage(ctx, img, currentX, spacing, imgWidth, fixedHeight);
          drawCaption(ctx, placedImages[i].caption, currentX, spacing + fixedHeight + 4, imgWidth);
          
          currentX += imgWidth + spacing;
        }
      } else if (isMasonryLayout) {
        const columns = masonryColumns;
        const canvasWidth = 1200;
        const columnWidth = (canvasWidth - spacing * (columns + 1)) / columns;
        const columnHeights = new Array(columns).fill(spacing);
        const imagePositions: { x: number; y: number; w: number; h: number; imgIndex: number }[] = [];

        loadedImages.forEach((img, i) => {
          const shortestCol = columnHeights.indexOf(Math.min(...columnHeights));
          const aspectRatio = img.height / img.width;
          const imgHeight = columnWidth * aspectRatio;
          const x = spacing + shortestCol * (columnWidth + spacing);
          const y = columnHeights[shortestCol];
          
          imagePositions.push({ x, y, w: columnWidth, h: imgHeight, imgIndex: i });
          columnHeights[shortestCol] += imgHeight + captionSpace + spacing;
        });

        const canvasHeight = Math.max(...columnHeights);
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        for (const pos of imagePositions) {
          const img = loadedImages[pos.imgIndex];
          drawRoundedImage(ctx, img, pos.x, pos.y, pos.w, pos.h);
          drawCaption(
            ctx,
            placedImages[pos.imgIndex].caption,
            pos.x,
            pos.y + pos.h + 4,
            pos.w
          );
        }
      } else if (isCollageLayout) {
        const cols = 4;
        const canvasWidth = 1200;
        const cell = (canvasWidth - spacing * (cols + 1)) / cols;
        const rightStartX = spacing + (cell + spacing) * 2;
        const rowsAfterHero = Math.ceil(Math.max(0, placedImages.length - 5) / cols);
        const baseHeight = spacing + (cell * 2 + spacing) + spacing;
        const extraRowsHeight = rowsAfterHero > 0 ? rowsAfterHero * (cell + captionSpace + spacing) + spacing : 0;
        canvas.width = canvasWidth;
        canvas.height = Math.max(baseHeight + captionSpace, baseHeight + extraRowsHeight);

        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (loadedImages[0]) {
          drawRoundedImage(ctx, loadedImages[0], spacing, spacing, cell * 2 + spacing, cell * 2 + spacing);
          drawCaption(ctx, placedImages[0].caption, spacing, spacing + cell * 2 + spacing + 4, cell * 2 + spacing);
        }

        const slots = [
          { x: rightStartX, y: spacing, w: cell, h: cell },
          { x: rightStartX + cell + spacing, y: spacing, w: cell, h: cell },
          { x: rightStartX, y: spacing + cell + spacing, w: cell, h: cell },
          { x: rightStartX + cell + spacing, y: spacing + cell + spacing, w: cell, h: cell },
        ];

        for (let i = 1; i <= 4 && i < loadedImages.length; i++) {
          const slot = slots[i - 1];
          drawRoundedImage(ctx, loadedImages[i], slot.x, slot.y, slot.w, slot.h);
            drawCaption(ctx, placedImages[i].caption, slot.x, slot.y + slot.h + 4, slot.w);
        }

        let remainingIndex = 5;
        let y = spacing + cell * 2 + spacing + spacing;
        while (remainingIndex < loadedImages.length) {
          for (let col = 0; col < cols && remainingIndex < loadedImages.length; col++) {
            const x = spacing + col * (cell + spacing);
            drawRoundedImage(ctx, loadedImages[remainingIndex], x, y, cell, cell);
            drawCaption(ctx, images[remainingIndex].caption, x, y + cell + 4, cell);
            remainingIndex++;
          }
          y += cell + captionSpace + spacing;
        }
      } else {
        const columns = gridColumns;
        const canvasWidth = 1200;
        const cellWidth = (canvasWidth - spacing * (columns + 1)) / columns;
        const cellHeight = cellWidth + captionSpace;
        const rows = Math.ceil(images.length / columns);
        const canvasHeight = rows * cellHeight + spacing * (rows + 1);

        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        for (let i = 0; i < loadedImages.length; i++) {
          const img = loadedImages[i];
          const col = i % columns;
          const row = Math.floor(i / columns);
          const x = spacing + col * (cellWidth + spacing);
          const y = spacing + row * (cellHeight + spacing);

          if (isPolaroidLayout) {
            const framePad = 8;
            const frameW = cellWidth;
            const frameH = cellWidth + captionSpace + framePad * 2;
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(x, y, frameW, frameH);
            drawRoundedImage(ctx, img, x + framePad, y + framePad, frameW - framePad * 2, frameW - framePad * 2);
            drawCaption(ctx, placedImages[i].caption, x + framePad, y + frameW, frameW - framePad * 2);
          } else {
            drawRoundedImage(ctx, img, x, y, cellWidth, cellWidth);
            drawCaption(ctx, placedImages[i].caption, x, y + cellWidth + 4, cellWidth);
          }
        }
      }

      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = "photo-gallery.png";
      link.href = dataUrl;
      link.click();

      setStatusMessage("PNG downloaded successfully!");
      setTimeout(() => setStatusMessage(""), 3000);
    } catch (err) {
      setError("Failed to generate image. Please try again.");
      setStatusMessage("");
    }
  };

  const generateHtmlCss = (): string => {
    const placedImages = slotImageIds
      .map((id) => images.find((img) => img.id === id))
      .filter((img): img is UploadedImage => Boolean(img));

    const layoutCss = (() => {
      if (isCollageLayout) {
        return `  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: ${spacing}px;
  grid-auto-rows: minmax(80px, auto);`;
      }
      switch (layout) {
        case "grid-2":
        case "grid-5":
        case "grid-4":
        case "grid-3":
        case "polaroid":
          return `  display: grid;
  grid-template-columns: repeat(${gridColumns}, 1fr);
  gap: ${spacing}px;`;
        case "masonry-2":
        case "masonry-4":
        case "masonry":
          return `  column-count: ${masonryColumns};
  column-gap: ${spacing}px;`;
        case "horizontal-compact":
        case "horizontal-tall":
        case "horizontal":
          return `  display: flex;
  gap: ${spacing}px;
  overflow-x: auto;`;
        default:
          return "";
      }
    })();

    const imageCss = isHorizontalLayout
      ? `  height: ${horizontalHeight}px;
  width: auto;
  flex-shrink: 0;
  object-fit: ${fitMode};`
      : `  width: 100%;
  aspect-ratio: 1;
  object-fit: ${fitMode};`;

    const imageHtml = placedImages
      .map((img, i) => {
        const caption = img.caption.trim();
        const safeCaption = caption
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");
        const collageClass = isCollageLayout && i === 0 ? " gallery-item--hero" : "";
        return `  <figure class="gallery-item${collageClass}">
    <img src="photo-${i + 1}.jpg" alt="Gallery photo ${i + 1}">
${caption && showCaptions ? `    <figcaption class="gallery-caption">${safeCaption}</figcaption>` : ""}
  </figure>`;
      })
      .join("\n");

    const itemCss = isMasonryLayout
      ? `  break-inside: avoid;
  margin-bottom: ${spacing}px;`
      : isHorizontalLayout
      ? `  flex-shrink: 0;`
      : isPolaroidLayout
      ? `  background: #fff;
  padding: 8px 8px 12px 8px;
  border-radius: ${Math.max(6, borderRadius)}px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.12);`
      : ``;

    return `<!-- HTML -->
<div class="my-photo-gallery">
${imageHtml}
</div>

<!-- CSS -->
<style>
.my-photo-gallery {
${layoutCss}
  background: ${bgColor};
  padding: ${spacing}px;
}

.my-photo-gallery .gallery-item {
${itemCss}
  margin: 0;
}

.my-photo-gallery .gallery-item--hero {
  grid-column: span 2;
  grid-row: span 2;
}

.my-photo-gallery img {
${imageCss}
  border-radius: ${borderRadius}px;
  display: block;
}

.my-photo-gallery .gallery-caption {
  margin-top: 6px;
  font-size: ${captionSize}px;
  line-height: ${captionSize + 4}px;
  color: ${captionColor};
  text-align: center;
}
</style>

<!-- Note: Replace photo-1.jpg, photo-2.jpg, etc. with your actual image URLs -->`;
  };

  const copyHtmlCss = async () => {
    const placedCount = slotImageIds.filter(Boolean).length;
    if (placedCount === 0) {
      setError("Drag uploaded images into the layout slots first.");
      return;
    }

    try {
      const snippet = generateHtmlCss();
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setStatusMessage("HTML & CSS copied to clipboard!");
      setTimeout(() => {
        setCopied(false);
        setStatusMessage("");
      }, 3000);
    } catch (err) {
      setError("Failed to copy to clipboard. Please try again.");
    }
  };

  const handleSavePreset = async () => {
    const ok = await savePreset(presetName, {
      layout,
      spacing,
      borderRadius,
      bgColor,
      gridColumns,
      masonryColumns,
      horizontalHeight,
      fitMode,
      showCaptions,
      captionSize,
      captionColor,
    });
    if (ok) setPresetName("");
  };

  const handleApplyPreset = (preset: PhotoGalleryPresetRecord) => {
    const payload = preset?.preset_json;
    if (!payload) return;
    setLayout(payload.layout ?? "grid-3");
    setSpacing(Math.min(40, Math.max(0, payload.spacing ?? 8)));
    setBorderRadius(Math.min(30, Math.max(0, payload.borderRadius ?? 8)));
    setBgColor(payload.bgColor || "#ffffff");
    setGridColumns(Math.min(6, Math.max(2, payload.gridColumns ?? 3)));
    setMasonryColumns(Math.min(6, Math.max(2, payload.masonryColumns ?? 3)));
    setHorizontalHeight(Math.min(500, Math.max(120, payload.horizontalHeight ?? 200)));
    setFitMode(payload.fitMode === "contain" ? "contain" : "cover");
    setShowCaptions(Boolean(payload.showCaptions));
    setCaptionSize(Math.min(28, Math.max(10, payload.captionSize ?? 14)));
    setCaptionColor(sanitizeCaptionColor(payload.captionColor || "#111827"));
    setShowPreview(true);
  };

  const layoutOptions = [
    { value: "grid-2", label: "Grid 2", icon: Grid3X3 },
    { value: "grid-3", label: "Grid 3", icon: Grid3X3 },
    { value: "grid-4", label: "Grid 4", icon: LayoutGrid },
    { value: "grid-5", label: "Grid 5", icon: LayoutGrid },
    { value: "masonry-2", label: "Masonry 2", icon: Columns },
    { value: "masonry", label: "Masonry 3", icon: Columns },
    { value: "masonry-4", label: "Masonry 4", icon: Columns },
    { value: "horizontal-compact", label: "Strip Compact", icon: GalleryHorizontal },
    { value: "horizontal", label: "Strip Standard", icon: GalleryHorizontal },
    { value: "horizontal-tall", label: "Strip Tall", icon: GalleryHorizontal },
    { value: "collage", label: "Collage Hero", icon: LayoutGrid },
    { value: "polaroid", label: "Polaroid", icon: ImageIcon },
  ];
  const hasPreview = slotImageIds.length > 0;
  const placedCount = slotImageIds.filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <MonetizationBar />
      
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Link
          href="/tools"
          className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Tools
        </Link>

        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-full text-sm font-medium mb-4">
            <ImageIcon className="w-4 h-4" />
            Free Photo Tool
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Photo Gallery Maker – Create a Gallery of Photos Online
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Upload images, choose a layout, and instantly create a <strong>gallery of photos</strong> for your website, blog, or social media. Export as PNG or copy the HTML & CSS code.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 md:p-8 mb-8">
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Photos
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                  isDragging 
                    ? "border-orange-500 bg-orange-100" 
                    : "border-gray-300 hover:border-orange-400 hover:bg-orange-50"
                }`}
              >
                <Upload className={`w-8 h-8 mx-auto mb-2 ${isDragging ? "text-orange-500" : "text-gray-400"}`} />
                <p className="text-sm text-gray-600">
                  {isDragging ? "Drop images here..." : "Click to upload or drag and drop"}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  PNG, JPG, GIF, WEBP up to 80 images
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <p className="text-xs text-gray-500 mt-2">
                Images are processed in your browser and not uploaded to our server.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Layout
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {layoutOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => applyLayoutPreset(option.value as LayoutType)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${
                        layout === option.value
                          ? "border-orange-500 bg-orange-50 text-orange-700"
                          : "border-gray-200 hover:border-gray-300 text-gray-600"
                      }`}
                    >
                      <option.icon className="w-4 h-4" />
                      <span className="truncate">{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Spacing: {spacing}px
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="40"
                    step="2"
                    value={spacing}
                    onChange={(e) => setSpacing(Number(e.target.value))}
                    className="w-full accent-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Corner Radius: {borderRadius}px
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="30"
                    step="2"
                    value={borderRadius}
                    onChange={(e) => setBorderRadius(Number(e.target.value))}
                    className="w-full accent-orange-500"
                  />
                </div>
              </div>

              {!isHorizontalLayout && !isCollageLayout && !isPolaroidLayout && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {isMasonryLayout ? `Masonry Columns: ${masonryColumns}` : `Grid Columns: ${gridColumns}`}
                  </label>
                  <input
                    type="range"
                    min="2"
                    max="6"
                    step="1"
                    value={isMasonryLayout ? masonryColumns : gridColumns}
                    onChange={(e) => {
                      const next = Number(e.target.value);
                      if (isMasonryLayout) setMasonryColumns(next);
                      else setGridColumns(next);
                    }}
                    className="w-full accent-orange-500"
                  />
                </div>
              )}

              {isHorizontalLayout && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Strip Height: {horizontalHeight}px
                  </label>
                  <input
                    type="range"
                    min="120"
                    max="500"
                    step="10"
                    value={horizontalHeight}
                    onChange={(e) => setHorizontalHeight(Number(e.target.value))}
                    className="w-full accent-orange-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image Fit
                </label>
                <select
                  value={fitMode}
                  onChange={(e) => setFitMode(e.target.value as FitMode)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                >
                  <option value="cover">Cover (crop to fill)</option>
                  <option value="contain">Contain (no crop)</option>
                </select>
              </div>

              <div className="space-y-3">
                <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
                  <input
                    type="checkbox"
                    checked={showCaptions}
                    onChange={(e) => setShowCaptions(e.target.checked)}
                    className="accent-orange-500"
                  />
                  Show Captions
                </label>
                {showCaptions && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Caption Size: {captionSize}px
                      </label>
                      <input
                        type="range"
                        min="10"
                        max="28"
                        step="1"
                        value={captionSize}
                        onChange={(e) => setCaptionSize(Number(e.target.value))}
                        className="w-full accent-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Caption Color
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={captionColor}
                          onChange={(e) => setCaptionColor(e.target.value)}
                          className="w-10 h-9 rounded border border-gray-200"
                        />
                        <input
                          type="text"
                          value={captionColor}
                          onChange={(e) => setCaptionColor(e.target.value)}
                          onBlur={(e) => setCaptionColor(sanitizeCaptionColor(e.target.value))}
                          className="flex-1 px-2 py-1.5 border border-gray-200 rounded-lg text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Background Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-12 h-10 rounded-lg border border-gray-200 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    onBlur={(e) => setBgColor(sanitizeHexColor(e.target.value))}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono"
                  />
                </div>
              </div>
              <ToolPresetBar
                presetName={presetName}
                onPresetNameChange={setPresetName}
                onSave={handleSavePreset}
                saving={savingPreset}
                presets={presets}
                onApply={handleApplyPreset}
                lockedMessage="Subscribe to save your gallery style presets."
              />
            </div>
          </div>

          {images.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700">
                  {images.length} photo{images.length !== 1 ? "s" : ""} selected
                </span>
                <button
                  onClick={clearAllImages}
                  className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear all
                </button>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {images.map((img, idx) => (
                  <div
                    key={img.id}
                    className={`relative flex-shrink-0 p-2 border rounded-lg bg-white w-32 ${
                      dragOverImageId === img.id ? "border-orange-400" : "border-gray-200"
                    }`}
                    draggable
                    onDragStart={(e) => {
                      if ((e.target as HTMLElement).tagName.toLowerCase() === "input") {
                        e.preventDefault();
                        return;
                      }
                      e.dataTransfer.setData("text/plain", img.id);
                      e.dataTransfer.effectAllowed = "move";
                      setDraggedImageId(img.id);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOverImageId(img.id);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (draggedImageId && draggedImageId !== img.id) {
                        reorderImages(draggedImageId, img.id);
                      }
                      setDraggedImageId(null);
                      setDragOverImageId(null);
                    }}
                    onDragEnd={() => {
                      setDraggedImageId(null);
                      setDragOverImageId(null);
                    }}
                  >
                    <img
                      src={img.src}
                      alt={img.name}
                      className="w-full h-20 object-cover rounded-lg"
                    />
                    <input
                      type="text"
                      value={img.caption}
                      onChange={(e) => updateCaption(img.id, e.target.value)}
                      placeholder="Caption (optional)"
                      className="mt-2 w-full px-2 py-1.5 text-xs border border-gray-200 rounded-md"
                    />
                    <div className="absolute -left-1 -bottom-1 flex gap-1">
                      <button
                        onClick={() => moveImage(img.id, "up")}
                        disabled={idx === 0}
                        className="w-5 h-5 bg-gray-800 text-white rounded-full flex items-center justify-center text-xs disabled:opacity-40"
                        title="Move left"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => moveImage(img.id, "down")}
                        disabled={idx === images.length - 1}
                        className="w-5 h-5 bg-gray-800 text-white rounded-full flex items-center justify-center text-xs disabled:opacity-40"
                        title="Move right"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                    </div>
                    <button
                      onClick={() => removeImage(img.id)}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {statusMessage && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700 text-sm">
              <Check className="w-4 h-4" />
              {statusMessage}
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              onClick={generateGallery}
              data-track-output="true"
              disabled={isGenerating}
              className="flex-1 sm:flex-none px-6 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <ImageIcon className="w-4 h-4" />
                  Generate Gallery
                </>
              )}
            </button>
            <button
              onClick={resetStyle}
              className="flex-1 sm:flex-none px-6 py-3 border border-gray-300 rounded-xl font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reset Style
            </button>
            <button
              onClick={autoFillSlots}
              disabled={images.length === 0}
              className="flex-1 sm:flex-none px-6 py-3 border border-gray-300 rounded-xl font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <ImageIcon className="w-4 h-4" />
              Auto-fill Slots
            </button>
            <button
              onClick={shuffleSlots}
              disabled={placedCount < 2}
              className="flex-1 sm:flex-none px-6 py-3 border border-gray-300 rounded-xl font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Shuffle className="w-4 h-4" />
              Shuffle Slots
            </button>
            <button
              onClick={downloadAsImage}
              data-track-output="true"
              disabled={placedCount === 0}
              className="flex-1 sm:flex-none px-6 py-3 border border-gray-300 rounded-xl font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download PNG
            </button>
            <button
              onClick={copyHtmlCss}
              data-track-output="true"
              disabled={placedCount === 0}
              className="flex-1 sm:flex-none px-6 py-3 border border-gray-300 rounded-xl font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-green-600" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy HTML & CSS
                </>
              )}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 md:p-8 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Gallery Preview</h2>
          <p className="text-sm text-gray-500 mb-3">
            Drag your uploaded images into these slots.
          </p>
          <div
            ref={previewRef}
            className="min-h-[200px] rounded-xl border border-dashed border-gray-300 overflow-hidden"
            style={{ backgroundColor: bgColor, padding: hasPreview ? `${spacing}px` : 0 }}
          >
            <div style={getLayoutStyles()}>
              {slotImageIds.map((slotImageId, index) => {
                const slotted = images.find((img) => img.id === slotImageId) || null;
                const isSlotActive = dragOverSlotIndex === index;
                const placeholderStyle: React.CSSProperties = isHorizontalLayout
                  ? {
                      height: `${horizontalHeight}px`,
                      width: "220px",
                    }
                  : {
                      width: "100%",
                      aspectRatio: isCollageLayout && index === 0 ? "2 / 2" : "1 / 1",
                    };

                return (
                  <figure
                    key={`slot-${index}`}
                    style={{ ...getItemStyles(), ...getFigureStyles(index) }}
                    className={`m-0 relative ${isSlotActive ? "ring-2 ring-orange-400 rounded-lg" : ""}`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOverSlotIndex(index);
                    }}
                    onDragLeave={() => {
                      if (dragOverSlotIndex === index) setDragOverSlotIndex(null);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      const droppedId = e.dataTransfer.getData("text/plain") || draggedImageId;
                      if (droppedId) assignImageToSlot(index, droppedId);
                      setDragOverSlotIndex(null);
                      setDraggedImageId(null);
                    }}
                  >
                    {slotted ? (
                      <>
                        <img
                          src={slotted.src}
                          alt={slotted.name}
                          style={getImageStyles()}
                        />
                        {shouldRenderCaptions && slotted.caption.trim() && (
                          <figcaption
                            style={{
                              marginTop: 6,
                              fontSize: `${captionSize}px`,
                              lineHeight: `${captionSize + 4}px`,
                              color: captionColor,
                              textAlign: "center",
                            }}
                          >
                            {slotted.caption}
                          </figcaption>
                        )}
                        <button
                          onClick={() => clearSlot(index)}
                          className="absolute top-1 right-1 w-6 h-6 bg-black/60 text-white rounded-full text-xs hover:bg-black/75"
                          title="Clear slot"
                        >
                          ×
                        </button>
                      </>
                    ) : (
                      <div
                        style={placeholderStyle}
                        className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-100/80 flex items-center justify-center text-gray-400 text-xs font-medium"
                      >
                        Drop image
                      </div>
                    )}
                  </figure>
                );
              })}
            </div>
          </div>
        </div>

        <PostResultUpsell />

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 md:p-8 space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Is a Gallery of Photos?</h2>
            <p className="text-gray-600 leading-relaxed">
              A gallery of photos is a visual arrangement of multiple images displayed together in an organized layout. Photo galleries are essential for showcasing portfolios, product collections, event highlights, travel memories, and creative projects. Whether you're a photographer, business owner, blogger, or creator, a well-designed photo gallery helps tell your story and engage your audience. This free tool lets you create stunning galleries without any design skills or expensive software.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Popular Photo Gallery Layouts</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-xl">
                <h3 className="font-semibold text-gray-900 mb-2">Grid Galleries</h3>
                <p className="text-sm text-gray-600">
                  Clean, uniform layouts with equal-sized cells. Perfect for product photos, team headshots, or any collection where consistency matters. Choose between 3 or 4 columns based on your content.
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <h3 className="font-semibold text-gray-900 mb-2">Masonry Galleries</h3>
                <p className="text-sm text-gray-600">
                  Pinterest-style layouts that preserve image aspect ratios. Ideal for mixed portrait and landscape photos, creative portfolios, and artistic collections where varied dimensions add visual interest.
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <h3 className="font-semibold text-gray-900 mb-2">Horizontal Strips</h3>
                <p className="text-sm text-gray-600">
                  Scrollable single-row galleries perfect for featured images, product showcases, or timeline-style presentations. Great for headers and hero sections.
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <h3 className="font-semibold text-gray-900 mb-2">Social Media Collages</h3>
                <p className="text-sm text-gray-600">
                  Combined layouts optimized for Instagram, Facebook, and other platforms. Download as a single image to share your collection in one post.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">How to Create a Gallery of Photos</h2>
            <ol className="space-y-3">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-7 h-7 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-medium">1</span>
                <div>
                  <p className="font-medium text-gray-900">Upload your photos</p>
                  <p className="text-sm text-gray-600">Click the upload area or drag and drop up to 80 images. All processing happens in your browser for complete privacy.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-7 h-7 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-medium">2</span>
                <div>
                  <p className="font-medium text-gray-900">Choose your layout</p>
                  <p className="text-sm text-gray-600">Select from Grid (3 or 4 columns), Masonry (Pinterest-style), or Horizontal strip layouts.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-7 h-7 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-medium">3</span>
                <div>
                  <p className="font-medium text-gray-900">Customize the appearance</p>
                  <p className="text-sm text-gray-600">Adjust spacing between photos, corner radius, and background color to match your brand or style.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-7 h-7 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-medium">4</span>
                <div>
                  <p className="font-medium text-gray-900">Generate and export</p>
                  <p className="text-sm text-gray-600">Click "Generate Gallery" to preview, then download as PNG for social media or copy HTML/CSS code for your website.</p>
                </div>
              </li>
            </ol>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Best Uses for a Gallery of Photos</h2>
            <ul className="grid md:grid-cols-2 gap-3">
              {[
                "Photography portfolios and showcases",
                "E-commerce product collections",
                "Blog post image galleries",
                "Event and wedding photo displays",
                "Travel and adventure photo journals",
                "Real estate property listings",
                "Social media photo collages",
                "Team and company about pages",
                "Before/after transformation galleries",
                "Art and creative project showcases",
              ].map((use, i) => (
                <li key={i} className="flex items-center gap-2 text-gray-600">
                  <Check className="w-4 h-4 text-orange-500 flex-shrink-0" />
                  {use}
                </li>
              ))}
            </ul>
          </section>

          <section className="border-t border-gray-200 pt-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-xl">
                <h3 className="font-semibold text-gray-900 mb-2">Are my photos uploaded to a server?</h3>
                <p className="text-sm text-gray-600">
                  No. All photo processing happens entirely in your browser. Your images never leave your device, ensuring complete privacy and security.
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <h3 className="font-semibold text-gray-900 mb-2">What image formats are supported?</h3>
                <p className="text-sm text-gray-600">
                  This tool supports all common image formats including PNG, JPG, JPEG, GIF, and WebP. You can upload up to 50 images at once.
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <h3 className="font-semibold text-gray-900 mb-2">How do I use the HTML/CSS code on my website?</h3>
                <p className="text-sm text-gray-600">
                  Copy the generated code snippet and paste it into your website's HTML. Replace the placeholder image filenames (photo-1.jpg, photo-2.jpg, etc.) with your actual image URLs.
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <h3 className="font-semibold text-gray-900 mb-2">Can I use this for commercial projects?</h3>
                <p className="text-sm text-gray-600">
                  Yes! The gallery code and downloaded images are yours to use however you like, including commercial websites, social media, and marketing materials.
                </p>
              </div>
            </div>
          </section>
        </div>

        <footer className="text-center text-sm text-gray-500 mt-8 pb-8">
          All images are handled locally in your browser. No data is sent to any server.
        </footer>
      </div>
    </div>
  );
}
