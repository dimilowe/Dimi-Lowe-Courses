export const PDF_TASK_BANK_SLUG = "pdf-task";
export const PDF_TASK_BANK_HUB_PATH = "/tools/pdf-task-bank";

export type PdfTaskTemplate = {
  slug: string;
  phrase: string;
  phraseSlug: string;
  titlePattern: string;
  descriptionPattern: string;
  introPattern: string;
};

export type PdfTaskEntity = {
  key: string;
  name: string;
  task: string;
  category: string;
  outputType: string;
  toolSlug: string;
  bestFor: string;
  notes: string;
  priority: number;
};

export const pdfTaskTemplates: PdfTaskTemplate[] = [
  {
    slug: "pdf-task-main",
    phrase: "{task}",
    phraseSlug: "task",
    titlePattern: "{task} Online Free | PDF Workflow and Tool Guide",
    descriptionPattern:
      "Learn the fastest way to {task} with practical steps, output notes, and the best VCM PDF tool path.",
    introPattern:
      "This page covers how to {task} with a browser-based workflow that keeps your process fast, simple, and consistent across devices.",
  },
  {
    slug: "pdf-task-tool",
    phrase: "{task} tool",
    phraseSlug: "tool",
    titlePattern: "{task} Tool (Free, No Install) | PDF Utility Guide",
    descriptionPattern:
      "Need a {task} tool? Use this checklist to run the task quickly and avoid common output mistakes.",
    introPattern:
      "A reliable {task} tool workflow should focus on clean output, minimal friction, and predictable final files for sharing or upload.",
  },
  {
    slug: "pdf-task-how-to",
    phrase: "how to {task}",
    phraseSlug: "how-to",
    titlePattern: "How to {task} (Step-by-Step PDF Guide)",
    descriptionPattern:
      "Step-by-step instructions for how to {task}, including quality checks and direct links to the right tool flow.",
    introPattern:
      "If you are figuring out how to {task}, start with the core process below, then validate your output before final distribution.",
  },
];

export const pdfTaskEntities: PdfTaskEntity[] = [
  {
    key: "merge-pdf-files",
    name: "Merge PDF Files",
    task: "merge PDF files",
    category: "merge",
    outputType: "single combined PDF",
    toolSlug: "pdf-merger-free",
    bestFor: "Combining invoices, reports, and appendices into one deliverable.",
    notes: "Review page order before exporting.",
    priority: 1,
  },
  {
    key: "combine-pdf-documents",
    name: "Combine PDF Documents",
    task: "combine PDF documents",
    category: "merge",
    outputType: "single combined PDF",
    toolSlug: "pdf-merger-free",
    bestFor: "Creating one upload-ready file from multiple source documents.",
    notes: "Keep source naming clean for easier troubleshooting.",
    priority: 2,
  },
  {
    key: "split-pdf-pages",
    name: "Split PDF Pages",
    task: "split PDF pages",
    category: "split",
    outputType: "multiple smaller PDFs",
    toolSlug: "pdf-merge-split",
    bestFor: "Extracting chapters, contracts, or selected page ranges.",
    notes: "Double-check section boundaries before distribution.",
    priority: 3,
  },
  {
    key: "extract-pages-from-pdf",
    name: "Extract Pages from PDF",
    task: "extract pages from PDF",
    category: "split",
    outputType: "targeted page subset PDF",
    toolSlug: "pdf-merge-split",
    bestFor: "Sending only relevant pages to clients or teammates.",
    notes: "Preserve original as master; export subsets separately.",
    priority: 4,
  },
  {
    key: "edit-pdf-online",
    name: "Edit PDF Online",
    task: "edit PDF online",
    category: "edit",
    outputType: "revised PDF",
    toolSlug: "pdf-editor",
    bestFor: "Quick content and page-structure updates without desktop apps.",
    notes: "Use a final read-through before sending.",
    priority: 5,
  },
  {
    key: "reorder-pdf-pages",
    name: "Reorder PDF Pages",
    task: "reorder PDF pages",
    category: "edit",
    outputType: "re-sequenced PDF",
    toolSlug: "pdf-editor",
    bestFor: "Fixing presentation flow and document sequencing.",
    notes: "Check table of contents references after reordering.",
    priority: 6,
  },
  {
    key: "rotate-pdf-pages",
    name: "Rotate PDF Pages",
    task: "rotate PDF pages",
    category: "edit",
    outputType: "orientation-corrected PDF",
    toolSlug: "pdf-editor",
    bestFor: "Correcting scanned pages and sideways exports.",
    notes: "Validate odd/even page orientation before final save.",
    priority: 7,
  },
  {
    key: "delete-pages-from-pdf",
    name: "Delete Pages from PDF",
    task: "delete pages from PDF",
    category: "edit",
    outputType: "trimmed PDF",
    toolSlug: "pdf-editor",
    bestFor: "Removing unwanted pages before sharing.",
    notes: "Keep a backup copy before permanent removals.",
    priority: 8,
  },
  {
    key: "merge-and-split-pdf",
    name: "Merge and Split PDF",
    task: "merge and split PDF files",
    category: "mixed workflow",
    outputType: "restructured PDF set",
    toolSlug: "pdf-merge-split",
    bestFor: "Restructuring large document bundles in one pass.",
    notes: "Map the target structure before editing.",
    priority: 9,
  },
  {
    key: "organize-pdf-pages",
    name: "Organize PDF Pages",
    task: "organize PDF pages",
    category: "edit",
    outputType: "cleanly sequenced PDF",
    toolSlug: "pdf-editor",
    bestFor: "Preparing decks, handbooks, and client-ready packs.",
    notes: "Use consistent section breaks for long docs.",
    priority: 10,
  },
  {
    key: "pdf-page-remover",
    name: "PDF Page Remover",
    task: "remove pages from a PDF",
    category: "edit",
    outputType: "lighter PDF without selected pages",
    toolSlug: "pdf-editor",
    bestFor: "Removing appendix or legal pages for partial sharing.",
    notes: "Check page numbering after removals.",
    priority: 11,
  },
  {
    key: "free-pdf-merger",
    name: "Free PDF Merger",
    task: "merge PDF files free",
    category: "merge",
    outputType: "single merged PDF",
    toolSlug: "pdf-merger-free",
    bestFor: "No-cost merging for recurring admin workflows.",
    notes: "Verify upload and download file size constraints.",
    priority: 12,
  },
];
