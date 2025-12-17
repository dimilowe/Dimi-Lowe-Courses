import { NextRequest, NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";
import JSZip from "jszip";

const MAX_FILE_SIZE = 50 * 1024 * 1024;

function parseRanges(rangesStr: string, pageCount: number): { start: number; end: number }[] {
  const ranges: { start: number; end: number }[] = [];
  const parts = rangesStr.split(",").map((s) => s.trim()).filter(Boolean);

  for (const part of parts) {
    const match = part.match(/^(\d+)-(\d+)$/);
    if (!match) {
      throw new Error(`Invalid range format: "${part}". Use format like 1-3, 4-7.`);
    }

    const start = parseInt(match[1], 10);
    const end = parseInt(match[2], 10);

    if (start < 1 || end < 1) {
      throw new Error(`Page numbers must be positive: "${part}".`);
    }

    if (start > end) {
      throw new Error(`Start page cannot be greater than end page: "${part}".`);
    }

    if (start > pageCount || end > pageCount) {
      throw new Error(`Page range "${part}" exceeds document page count (${pageCount}).`);
    }

    ranges.push({ start, end });
  }

  if (ranges.length === 0) {
    throw new Error("No valid page ranges provided.");
  }

  return ranges;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const mode = formData.get("mode") as string;
    const rangesStr = formData.get("ranges") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Only PDF files are allowed" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File exceeds 50MB limit" },
        { status: 400 }
      );
    }

    if (mode !== "every" && mode !== "ranges") {
      return NextResponse.json(
        { error: "Invalid mode. Use 'every' or 'ranges'." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const pdfBytes = new Uint8Array(arrayBuffer);

    let srcPdf: PDFDocument;
    try {
      srcPdf = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
    } catch {
      return NextResponse.json(
        { error: "Failed to read PDF. It may be corrupted or password-protected." },
        { status: 400 }
      );
    }

    const pageCount = srcPdf.getPageCount();
    if (pageCount === 0) {
      return NextResponse.json(
        { error: "PDF has no pages." },
        { status: 400 }
      );
    }

    const zip = new JSZip();

    if (mode === "every") {
      for (let i = 0; i < pageCount; i++) {
        const newPdf = await PDFDocument.create();
        const [copiedPage] = await newPdf.copyPages(srcPdf, [i]);
        newPdf.addPage(copiedPage);
        const pdfData = await newPdf.save();
        zip.file(`page-${String(i + 1).padStart(3, "0")}.pdf`, pdfData);
      }
    } else {
      let ranges: { start: number; end: number }[];
      try {
        ranges = parseRanges(rangesStr || "", pageCount);
      } catch (err: any) {
        return NextResponse.json(
          { error: err.message },
          { status: 400 }
        );
      }

      for (let i = 0; i < ranges.length; i++) {
        const { start, end } = ranges[i];
        const newPdf = await PDFDocument.create();
        const pageIndices = [];
        for (let p = start - 1; p <= end - 1; p++) {
          pageIndices.push(p);
        }
        const copiedPages = await newPdf.copyPages(srcPdf, pageIndices);
        copiedPages.forEach((page) => newPdf.addPage(page));
        const pdfData = await newPdf.save();
        zip.file(`pages-${start}-${end}.pdf`, pdfData);
      }
    }

    const zipBuffer = await zip.generateAsync({ type: "uint8array" });

    return new Response(Buffer.from(zipBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": 'attachment; filename="split-pages.zip"',
        "Content-Length": zipBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("PDF split error:", error);
    return NextResponse.json(
      { error: "Failed to split PDF. Please try again." },
      { status: 500 }
    );
  }
}
