import { NextRequest, NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";

const MAX_FILES = 20;
const MAX_TOTAL_SIZE = 100 * 1024 * 1024;
const MAX_FILE_SIZE = 50 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files[]") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "No files provided" },
        { status: 400 }
      );
    }

    if (files.length < 2) {
      return NextResponse.json(
        { error: "At least 2 PDF files are required to merge" },
        { status: 400 }
      );
    }

    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { error: `Maximum ${MAX_FILES} files allowed` },
        { status: 400 }
      );
    }

    let totalSize = 0;
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File "${file.name}" exceeds 50MB limit` },
          { status: 400 }
        );
      }
      totalSize += file.size;
    }

    if (totalSize > MAX_TOTAL_SIZE) {
      return NextResponse.json(
        { error: "Total file size exceeds 100MB limit" },
        { status: 400 }
      );
    }

    for (const file of files) {
      if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
        return NextResponse.json(
          { error: `File "${file.name}" is not a valid PDF` },
          { status: 400 }
        );
      }
    }

    const mergedPdf = await PDFDocument.create();

    for (const file of files) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdfBytes = new Uint8Array(arrayBuffer);
        
        const pdf = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        
        copiedPages.forEach((page) => {
          mergedPdf.addPage(page);
        });
      } catch (err) {
        console.error(`Error processing file ${file.name}:`, err);
        return NextResponse.json(
          { error: `Failed to process "${file.name}". It may be corrupted or password-protected.` },
          { status: 400 }
        );
      }
    }

    const mergedPdfBytes = await mergedPdf.save();

    return new Response(Buffer.from(mergedPdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="merged.pdf"',
        "Content-Length": mergedPdfBytes.length.toString(),
      },
    });
  } catch (error) {
    console.error("PDF merge error:", error);
    return NextResponse.json(
      { error: "Failed to merge PDFs. Please try again." },
      { status: 500 }
    );
  }
}
