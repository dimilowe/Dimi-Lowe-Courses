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

type PdfOperation = {
  slug: string;
  taskTemplate: string;
  category: string;
  outputType: string;
  toolSlug: string;
  bestFor: string;
  notes: string;
};

type PdfContext = {
  slug: string;
  label: string;
};

const pdfOperations: PdfOperation[] = [
  {
    slug: "merge",
    taskTemplate: "merge {context}",
    category: "merge",
    outputType: "single combined PDF",
    toolSlug: "pdf-merger-free",
    bestFor: "Combining related files into one shareable package.",
    notes: "Verify order before final export.",
  },
  {
    slug: "combine",
    taskTemplate: "combine {context}",
    category: "merge",
    outputType: "single combined PDF",
    toolSlug: "pdf-merger-free",
    bestFor: "Building upload-ready bundles from multiple PDFs.",
    notes: "Maintain consistent naming for source files.",
  },
  {
    slug: "batch-merge",
    taskTemplate: "batch merge {context}",
    category: "merge",
    outputType: "consolidated batch PDFs",
    toolSlug: "pdf-merger-free",
    bestFor: "Processing multiple sets of related files quickly.",
    notes: "Group files by destination before merging.",
  },
  {
    slug: "split",
    taskTemplate: "split {context}",
    category: "split",
    outputType: "multiple smaller PDFs",
    toolSlug: "pdf-merge-split",
    bestFor: "Breaking large files into manageable parts.",
    notes: "Double-check split boundaries before sharing.",
  },
  {
    slug: "extract-pages",
    taskTemplate: "extract pages from {context}",
    category: "split",
    outputType: "selected-page PDF outputs",
    toolSlug: "pdf-merge-split",
    bestFor: "Sending only relevant pages to stakeholders.",
    notes: "Keep a master copy before extracting.",
  },
  {
    slug: "batch-split",
    taskTemplate: "batch split {context}",
    category: "split",
    outputType: "structured split PDF sets",
    toolSlug: "pdf-merge-split",
    bestFor: "Running high-volume page-range extractions.",
    notes: "Use consistent naming for generated outputs.",
  },
  {
    slug: "edit",
    taskTemplate: "edit {context}",
    category: "edit",
    outputType: "updated PDF",
    toolSlug: "pdf-editor",
    bestFor: "Quick page-level updates without desktop tools.",
    notes: "Preview the final file before publishing.",
  },
  {
    slug: "reorder",
    taskTemplate: "reorder pages in {context}",
    category: "edit",
    outputType: "re-sequenced PDF",
    toolSlug: "pdf-editor",
    bestFor: "Fixing narrative flow and section sequence.",
    notes: "Check table-of-contents references afterward.",
  },
  {
    slug: "rotate",
    taskTemplate: "rotate pages in {context}",
    category: "edit",
    outputType: "orientation-corrected PDF",
    toolSlug: "pdf-editor",
    bestFor: "Correcting scan orientation issues.",
    notes: "Validate odd/even page orientation before save.",
  },
  {
    slug: "delete-pages",
    taskTemplate: "delete pages from {context}",
    category: "edit",
    outputType: "trimmed PDF",
    toolSlug: "pdf-editor",
    bestFor: "Removing irrelevant or sensitive pages.",
    notes: "Retain original source for recovery.",
  },
  {
    slug: "organize",
    taskTemplate: "organize {context}",
    category: "edit",
    outputType: "cleanly structured PDF",
    toolSlug: "pdf-editor",
    bestFor: "Preparing polished document packages.",
    notes: "Apply consistent section separators.",
  },
  {
    slug: "trim",
    taskTemplate: "trim {context}",
    category: "edit",
    outputType: "condensed PDF output",
    toolSlug: "pdf-editor",
    bestFor: "Reducing long files to essential pages.",
    notes: "Confirm retained pages match audience needs.",
  },
];

const pdfContexts: PdfContext[] = [
  { slug: "invoice-pdfs", label: "invoice PDFs" },
  { slug: "contract-pdfs", label: "contract PDFs" },
  { slug: "proposal-pdfs", label: "proposal PDFs" },
  { slug: "report-pdfs", label: "report PDFs" },
  { slug: "portfolio-pdfs", label: "portfolio PDFs" },
  { slug: "legal-pdfs", label: "legal PDFs" },
  { slug: "onboarding-pdfs", label: "onboarding PDFs" },
  { slug: "resume-pdfs", label: "resume PDFs" },
  { slug: "ebook-pdfs", label: "ebook PDFs" },
  { slug: "manual-pdfs", label: "manual PDFs" },
  { slug: "slides-pdfs", label: "slides PDFs" },
  { slug: "chapter-pdfs", label: "chapter PDFs" },
  { slug: "application-pdfs", label: "application PDFs" },
  { slug: "bank-statement-pdfs", label: "bank statement PDFs" },
  { slug: "tax-form-pdfs", label: "tax form PDFs" },
  { slug: "claim-form-pdfs", label: "claim form PDFs" },
  { slug: "study-note-pdfs", label: "study note PDFs" },
  { slug: "worksheet-pdfs", label: "worksheet PDFs" },
  { slug: "client-deck-pdfs", label: "client deck PDFs" },
  { slug: "scan-pdfs", label: "scan PDFs" },
];

function buildPdfTaskEntities(): PdfTaskEntity[] {
  const entities: PdfTaskEntity[] = [];
  let priority = 1;

  for (const operation of pdfOperations) {
    for (const context of pdfContexts) {
      const task = operation.taskTemplate.replace("{context}", context.label);
      entities.push({
        key: `${operation.slug}-${context.slug}`,
        name: task
          .replace(/\b\w/g, (char) => char.toUpperCase())
          .replace("Pdfs", "PDFs"),
        task,
        category: operation.category,
        outputType: operation.outputType,
        toolSlug: operation.toolSlug,
        bestFor: operation.bestFor,
        notes: operation.notes,
        priority,
      });
      priority += 1;
    }
  }

  return entities;
}

export const pdfTaskTemplates: PdfTaskTemplate[] = [
  {
    slug: "pdf-task-main",
    phrase: "{task}",
    phraseSlug: "task",
    titlePattern: "{task} Online Free | PDF Workflow Guide",
    descriptionPattern:
      "Learn the fastest way to {task} with practical steps, output checks, and direct links to the best VCM PDF tool flow.",
    introPattern:
      "This page explains how to {task} using a browser-based process that keeps the workflow fast, repeatable, and easy to verify before sharing.",
  },
  {
    slug: "pdf-task-tool",
    phrase: "{task} tool",
    phraseSlug: "tool",
    titlePattern: "{task} Tool (Free, No Install) | PDF Utility",
    descriptionPattern:
      "Need a {task} tool? Use this quick workflow checklist to avoid common PDF output mistakes and ship cleaner files.",
    introPattern:
      "A reliable {task} tool workflow should prioritize output quality, simple steps, and final validation before distribution.",
  },
  {
    slug: "pdf-task-how-to",
    phrase: "how to {task}",
    phraseSlug: "how-to",
    titlePattern: "How to {task} (Step-by-Step PDF Guide)",
    descriptionPattern:
      "Follow this step-by-step guide for how to {task}, including practical checks and direct links to the right tool entry point.",
    introPattern:
      "If you are figuring out how to {task}, start with the task sequence below, then confirm page order, readability, and final structure before sharing.",
  },
  {
    slug: "pdf-task-online",
    phrase: "{task} online",
    phraseSlug: "online",
    titlePattern: "{task} Online (Free PDF Workflow)",
    descriptionPattern:
      "Run {task} online with a clean browser workflow and practical guidance for reliable output across common PDF use cases.",
    introPattern:
      "This {task} online workflow is designed for speed and consistency, so you can complete repetitive PDF tasks with fewer mistakes.",
  },
  {
    slug: "pdf-task-best",
    phrase: "best way to {task}",
    phraseSlug: "best",
    titlePattern: "Best Way to {task} (Practical PDF Guide)",
    descriptionPattern:
      "Compare the best way to {task} with practical tips on process order, validation, and the right free tool path.",
    introPattern:
      "For most teams, the best way to {task} is a repeatable checklist process with quick quality checks after each operation.",
  },
];

export const pdfTaskEntities: PdfTaskEntity[] = buildPdfTaskEntities();
