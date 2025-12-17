import { Metadata } from "next";
import PdfMergeSplitClient from "./PdfMergeSplitClient";
import ExploreMoreTools from "@/components/ExploreMoreTools";
import Link from "next/link";

export const metadata: Metadata = {
  title: "PDF Merge Split – Merge & Split PDF Files Free | VCM Suite",
  description: "Free PDF merge split tool. Merge multiple PDFs into one file or split a PDF into pages instantly. No signup, no watermark.",
  keywords: "pdf merge split, merge pdf and split pdf, pdf merger and splitter, merge pdf free, split pdf free, combine pdf and split pages, merge and split pdf online",
  openGraph: {
    title: "PDF Merge Split – Merge & Split PDF Files Free | VCM Suite",
    description: "Free PDF merge split tool. Merge multiple PDFs into one file or split a PDF into pages instantly. No signup, no watermark.",
    type: "website",
  },
};

const softwareAppSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "VCM PDF Merge Split",
  "applicationCategory": "UtilitiesApplication",
  "operatingSystem": "Web",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "description": "Free PDF merge split tool. Merge multiple PDFs into one file or split a PDF into pages instantly. No signup, no watermark."
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is a PDF merge split tool?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "A PDF merge split tool lets you combine multiple PDF files into one document or split a single PDF into separate pages or sections. This tool does both in one place."
      }
    },
    {
      "@type": "Question",
      "name": "Is this PDF merge split tool free?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, this tool is 100% free. No signup required, no watermarks added to your files, and no hidden fees."
      }
    },
    {
      "@type": "Question",
      "name": "How many PDFs can I merge at once?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "You can merge up to 20 PDF files at once, with a total size limit of 100MB and individual files up to 50MB each."
      }
    },
    {
      "@type": "Question",
      "name": "Can I change the order of PDFs before merging?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes! Drag and drop the files in the list to reorder them. The merged PDF will follow your custom order."
      }
    },
    {
      "@type": "Question",
      "name": "How do I split a PDF into individual pages?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Upload your PDF, select 'Split Every Page' mode, and click Split. You'll download a ZIP file containing each page as a separate PDF."
      }
    },
    {
      "@type": "Question",
      "name": "Can I split specific page ranges from a PDF?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes! Use the 'Split by Ranges' mode and enter ranges like 1-3, 4-7, 10-10. Each range becomes a separate PDF in the downloaded ZIP."
      }
    },
    {
      "@type": "Question",
      "name": "Are my files stored on your servers?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "No. Files are processed in memory and immediately discarded after the operation completes. We never store your documents."
      }
    },
    {
      "@type": "Question",
      "name": "What file format does the split output use?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Split PDFs are delivered as a ZIP file containing individual PDF files for each page or range you specified."
      }
    },
    {
      "@type": "Question",
      "name": "Can I use this tool on mobile?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes! This PDF merge split tool works on all devices including phones and tablets. The interface is fully responsive."
      }
    },
    {
      "@type": "Question",
      "name": "What if my PDF is password-protected?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Password-protected PDFs may fail to process. Remove the password protection first using your PDF reader, then try again."
      }
    }
  ]
};

export default function PdfMergeSplitPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <span className="inline-block bg-orange-100 text-orange-700 text-sm font-medium px-4 py-1.5 rounded-full mb-4">
            100% Free
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            PDF Merge Split
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-2">
            Merge multiple PDFs into one or split a PDF into pages. Instant results.
          </p>
          <p className="text-sm text-gray-500 flex items-center justify-center gap-2">
            <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Files processed in memory and discarded
          </p>
        </div>

        <PdfMergeSplitClient />

        <section className="mt-16 bg-white rounded-2xl border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Free PDF Merge Split Tool</h2>
          <div className="prose prose-gray max-w-none">
            <p>
              Need to <strong>pdf merge split</strong> your documents? This free online tool handles both operations in one convenient place. Whether you're combining multiple contracts into a single file or extracting specific pages from a large document, we've got you covered.
            </p>
            <p>
              Unlike other tools, our <strong>pdf merger and splitter</strong> requires no signup, adds no watermarks, and works entirely in your browser. Your files are processed securely in memory and immediately discarded—we never store your documents.
            </p>
            <p>
              Perfect for professionals, students, and anyone who works with PDF documents. Merge invoices, split scanned documents, extract chapters, or reorganize your files in seconds.
            </p>
          </div>
        </section>

        <section className="mt-8 bg-white rounded-2xl border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">1</div>
              <h3 className="font-semibold text-gray-900 mb-2">Upload Files</h3>
              <p className="text-gray-600 text-sm">Drag and drop or click to upload your PDF files. Multiple files for merge, one file for split.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">2</div>
              <h3 className="font-semibold text-gray-900 mb-2">Choose Operation</h3>
              <p className="text-gray-600 text-sm">Select Merge or Split mode. Reorder files for merge, or set page ranges for split.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">3</div>
              <h3 className="font-semibold text-gray-900 mb-2">Download Result</h3>
              <p className="text-gray-600 text-sm">Get your merged PDF or a ZIP file with split pages instantly.</p>
            </div>
          </div>
        </section>

        <section className="mt-8 bg-white rounded-2xl border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Common Use Cases</h2>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <svg className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-gray-700">Combine contracts, invoices, or reports into a single PDF for easy sharing</span>
            </li>
            <li className="flex items-start gap-3">
              <svg className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-gray-700">Split a scanned document into individual pages for separate processing</span>
            </li>
            <li className="flex items-start gap-3">
              <svg className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-gray-700">Extract specific chapters or sections from an eBook or manual</span>
            </li>
            <li className="flex items-start gap-3">
              <svg className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-gray-700">Prepare multi-page forms for submission as a single file</span>
            </li>
            <li className="flex items-start gap-3">
              <svg className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-gray-700">Reorganize document pages in the order you need</span>
            </li>
          </ul>
        </section>

        <section className="mt-8 bg-white rounded-2xl border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <details className="group bg-gray-50 rounded-xl p-4 cursor-pointer">
              <summary className="font-semibold text-gray-900 flex items-center justify-between">
                What is a PDF merge split tool?
                <svg className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="mt-3 text-gray-600">
                A <strong>pdf merge split</strong> tool lets you combine multiple PDF files into one document or split a single PDF into separate pages or sections. This tool does both in one place.
              </p>
            </details>

            <details className="group bg-gray-50 rounded-xl p-4 cursor-pointer">
              <summary className="font-semibold text-gray-900 flex items-center justify-between">
                Is this PDF merge split tool free?
                <svg className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="mt-3 text-gray-600">
                Yes, this tool is 100% free. No signup required, no watermarks added to your files, and no hidden fees.
              </p>
            </details>

            <details className="group bg-gray-50 rounded-xl p-4 cursor-pointer">
              <summary className="font-semibold text-gray-900 flex items-center justify-between">
                How many PDFs can I merge at once?
                <svg className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="mt-3 text-gray-600">
                You can merge up to 20 PDF files at once, with a total size limit of 100MB and individual files up to 50MB each.
              </p>
            </details>

            <details className="group bg-gray-50 rounded-xl p-4 cursor-pointer">
              <summary className="font-semibold text-gray-900 flex items-center justify-between">
                Can I change the order of PDFs before merging?
                <svg className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="mt-3 text-gray-600">
                Yes! Drag and drop the files in the list to reorder them. The merged PDF will follow your custom order.
              </p>
            </details>

            <details className="group bg-gray-50 rounded-xl p-4 cursor-pointer">
              <summary className="font-semibold text-gray-900 flex items-center justify-between">
                How do I split a PDF into individual pages?
                <svg className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="mt-3 text-gray-600">
                Upload your PDF, select "Split Every Page" mode, and click Split. You'll download a ZIP file containing each page as a separate PDF.
              </p>
            </details>

            <details className="group bg-gray-50 rounded-xl p-4 cursor-pointer">
              <summary className="font-semibold text-gray-900 flex items-center justify-between">
                Can I split specific page ranges from a PDF?
                <svg className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="mt-3 text-gray-600">
                Yes! Use the "Split by Ranges" mode and enter ranges like 1-3, 4-7, 10-10. Each range becomes a separate PDF in the downloaded ZIP.
              </p>
            </details>

            <details className="group bg-gray-50 rounded-xl p-4 cursor-pointer">
              <summary className="font-semibold text-gray-900 flex items-center justify-between">
                Are my files stored on your servers?
                <svg className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="mt-3 text-gray-600">
                No. Files are processed in memory and immediately discarded after the operation completes. We never store your documents.
              </p>
            </details>

            <details className="group bg-gray-50 rounded-xl p-4 cursor-pointer">
              <summary className="font-semibold text-gray-900 flex items-center justify-between">
                What file format does the split output use?
                <svg className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="mt-3 text-gray-600">
                Split PDFs are delivered as a ZIP file containing individual PDF files for each page or range you specified.
              </p>
            </details>

            <details className="group bg-gray-50 rounded-xl p-4 cursor-pointer">
              <summary className="font-semibold text-gray-900 flex items-center justify-between">
                Can I use this tool on mobile?
                <svg className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="mt-3 text-gray-600">
                Yes! This <strong>pdf merge split</strong> tool works on all devices including phones and tablets. The interface is fully responsive.
              </p>
            </details>

            <details className="group bg-gray-50 rounded-xl p-4 cursor-pointer">
              <summary className="font-semibold text-gray-900 flex items-center justify-between">
                What if my PDF is password-protected?
                <svg className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="mt-3 text-gray-600">
                Password-protected PDFs may fail to process. Remove the password protection first using your PDF reader, then try again.
              </p>
            </details>
          </div>
        </section>

        <section className="mt-8 text-center text-sm text-gray-500">
          <p>
            Looking for dedicated tools? Try{" "}
            <Link href="/tools/pdf-merger-free" className="text-orange-600 hover:underline">PDF Merger Free</Link>
            {" "}for merging only.
          </p>
        </section>

        <div className="mt-12">
          <ExploreMoreTools currentTool="pdf-merge-split" />
        </div>
      </div>
    </div>
  );
}
