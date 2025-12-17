import { Metadata } from "next";
import PdfMergerFreeClient from "./PdfMergerFreeClient";
import ExploreMoreTools from "@/components/ExploreMoreTools";

export const metadata: Metadata = {
  title: "PDF Merger Free - Combine PDFs Online | VCM Suite",
  description: "Merge multiple PDF files into one PDF instantly. Free online PDF merger with no signup, no watermark. Drag-and-drop to reorder pages, then download your combined PDF.",
  keywords: "pdf merger free, merge pdf files, combine pdfs, pdf combiner, join pdf files, free pdf merge tool, online pdf merger",
  openGraph: {
    title: "PDF Merger Free - Combine PDFs Online | VCM Suite",
    description: "Merge multiple PDF files into one PDF instantly. Free online PDF merger with no signup, no watermark.",
    type: "website",
  },
  other: {
    "application/ld+json": JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "Is this PDF merger free to use?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes, this PDF merger is 100% free. No signup required, no watermarks, no limits on merging."
          }
        },
        {
          "@type": "Question",
          "name": "How many PDF files can I merge at once?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "You can merge up to 20 PDF files at once, with a total size limit of 100MB."
          }
        },
        {
          "@type": "Question",
          "name": "Can I change the order of pages before merging?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes! Simply drag and drop the files in the list to reorder them. The merged PDF will follow your custom order."
          }
        },
        {
          "@type": "Question",
          "name": "Is my data secure when merging PDFs?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Your files are uploaded securely, processed on our server, and immediately deleted after the merged PDF is created. We never store your documents."
          }
        },
        {
          "@type": "Question",
          "name": "What file types can I merge?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "This tool only accepts PDF files. All uploaded files must be valid .pdf documents."
          }
        },
        {
          "@type": "Question",
          "name": "Why is my merged PDF not downloading?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Make sure you have at least 2 PDF files uploaded. If the merge fails, one of your files may be corrupted or password-protected."
          }
        }
      ]
    })
  }
};

export default function PdfMergerFreePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <span className="inline-block bg-orange-100 text-orange-700 text-sm font-medium px-4 py-1.5 rounded-full mb-4">
            100% Free
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            PDF Merger Free
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-2">
            Merge multiple PDF files into one PDF instantly. No signup.
          </p>
          <p className="text-sm text-gray-500 flex items-center justify-center gap-2">
            <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Fast, secure, and private
          </p>
        </div>

        <PdfMergerFreeClient />

        <section className="mt-16 bg-white rounded-2xl border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">1</div>
              <h3 className="font-semibold text-gray-900 mb-2">Upload PDFs</h3>
              <p className="text-gray-600 text-sm">Drag and drop or click to upload multiple PDF files.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">2</div>
              <h3 className="font-semibold text-gray-900 mb-2">Reorder Files</h3>
              <p className="text-gray-600 text-sm">Drag files to arrange them in your preferred order.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">3</div>
              <h3 className="font-semibold text-gray-900 mb-2">Merge & Download</h3>
              <p className="text-gray-600 text-sm">Click merge and download your combined PDF instantly.</p>
            </div>
          </div>
        </section>

        <section className="mt-8 bg-white rounded-2xl border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">About This Free PDF Merger</h2>
          <p className="text-gray-600 mb-8">
            Looking for a reliable <strong>pdf merger free</strong> tool? VCM Suite's online PDF combiner lets you merge multiple PDF documents into a single file without installing any software. Whether you're combining reports, contracts, or presentations, our tool handles it quickly and securely.
          </p>

          <div className="space-y-4">
            <details className="group bg-gray-50 rounded-xl p-4 cursor-pointer">
              <summary className="font-semibold text-gray-900 flex items-center justify-between">
                Is this PDF merger really free?
                <svg className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="mt-3 text-gray-600">
                Yes! This <strong>pdf merger free</strong> tool is completely free with no hidden costs. There's no signup required, no watermarks added to your merged documents, and no daily limits. We built this as part of VCM Suite's mission to provide free creator tools.
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
                You can merge up to 20 PDF files at once with a total size limit of 100MB. Each individual file can be up to 50MB. This is generous enough for most use cases while keeping the service fast and reliable.
              </p>
            </details>

            <details className="group bg-gray-50 rounded-xl p-4 cursor-pointer">
              <summary className="font-semibold text-gray-900 flex items-center justify-between">
                Can I reorder the PDF files before merging?
                <svg className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="mt-3 text-gray-600">
                Absolutely! Simply drag and drop the files in the list to reorder them before merging. The final merged PDF will follow exactly the order you set.
              </p>
            </details>

            <details className="group bg-gray-50 rounded-xl p-4 cursor-pointer">
              <summary className="font-semibold text-gray-900 flex items-center justify-between">
                Is my data secure when using this tool?
                <svg className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="mt-3 text-gray-600">
                Yes! Your files are uploaded securely over HTTPS, processed on our server to create the merged PDF, and immediately deleted afterward. We never store, read, or share your documents.
              </p>
            </details>

            <details className="group bg-gray-50 rounded-xl p-4 cursor-pointer">
              <summary className="font-semibold text-gray-900 flex items-center justify-between">
                What if the merge fails?
                <svg className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="mt-3 text-gray-600">
                If the merge fails, it's usually because one of your PDFs is corrupted, password-protected, or not a valid PDF file. Try removing files one by one to identify the problematic document.
              </p>
            </details>

            <details className="group bg-gray-50 rounded-xl p-4 cursor-pointer">
              <summary className="font-semibold text-gray-900 flex items-center justify-between">
                Can I use this PDF merger on mobile?
                <svg className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="mt-3 text-gray-600">
                Yes! This <strong>free pdf merger</strong> is fully responsive and works on mobile phones and tablets. While the desktop experience offers easier drag-and-drop functionality, you can still upload, reorder, and merge PDFs from any device.
              </p>
            </details>
          </div>
        </section>

        <div className="mt-12">
          <ExploreMoreTools currentTool="pdf-merger-free" />
        </div>
      </div>
    </div>
  );
}
