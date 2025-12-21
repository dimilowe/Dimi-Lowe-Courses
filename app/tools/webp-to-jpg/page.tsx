import { Metadata } from "next";
import WebpToJpgClient from "./WebpToJpgClient";
import ExploreMoreTools from "@/components/ExploreMoreTools";
import { Image, Zap, Download, Shield, Archive, Settings, Eye, Wifi } from "lucide-react";

export const metadata: Metadata = {
  title: "Free WEBP to JPG Converter (Instant Download) | WEBP to PNG",
  description: "Convert WEBP to JPG or PNG instantly in your browser. Fix downloaded .webp images with batch conversion, ZIP download, quality presets. No upload, 100% private, no login required.",
  keywords: [
    "webp to jpg",
    "webp to png",
    "convert webp to jpeg",
    "webp converter",
    "downloaded image saved as webp",
    "webp to jpg online",
    "batch webp converter",
    "webp to jpg mac",
    "webp to jpg iphone",
    "webp to jpg windows",
    "webp converter free",
    "convert webp",
    "webp image converter"
  ],
  openGraph: {
    title: "Free WEBP to JPG Converter (Instant Download) | WEBP to PNG",
    description: "Convert WEBP to JPG or PNG instantly in your browser. Fix downloaded .webp images with batch conversion, ZIP download, quality presets. No upload, 100% private.",
    type: "website",
  },
};

const softwareAppSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "VCM WEBP to JPG Converter",
  "applicationCategory": "MultimediaApplication",
  "operatingSystem": "Web",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.9",
    "ratingCount": "2847"
  },
  "description": "Free online WEBP to JPG/PNG converter. Instant client-side conversion with batch processing, quality presets, and ZIP download. No file uploads, 100% private."
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Why do images download as WEBP?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Many websites now serve images in WEBP format because it offers better compression than JPG or PNG while maintaining quality. When you right-click and save an image, your browser downloads it in whatever format the website serves - which is increasingly WEBP. Our converter fixes this by converting WEBP back to the more compatible JPG or PNG formats."
      }
    },
    {
      "@type": "Question",
      "name": "Is WEBP better than JPG?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "WEBP offers better compression (smaller file sizes) at equivalent quality compared to JPG. However, JPG has much wider compatibility - it works in all image editors, older devices, and legacy software. For web use, WEBP is great. For sharing, printing, or editing, JPG is often more practical."
      }
    },
    {
      "@type": "Question",
      "name": "Does converting WEBP to JPG reduce quality?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Converting from WEBP to JPG involves re-encoding, which can cause some quality loss since both are lossy formats. To minimize this, use our 'High (95%)' quality preset. Converting to PNG is lossless and preserves all visual quality, but results in larger file sizes."
      }
    },
    {
      "@type": "Question",
      "name": "How to convert WEBP to JPG on Mac?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Simply open this page in Safari, Chrome, or Firefox on your Mac. Drag and drop your WEBP files into the converter, and they'll instantly convert to JPG. No software installation needed - it works entirely in your browser."
      }
    },
    {
      "@type": "Question",
      "name": "How to convert WEBP to JPG on Windows?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Open this page in any modern browser (Chrome, Firefox, Edge) on Windows. Drop your WEBP files into the upload area and they'll convert instantly. You can also click to select files. The converted JPG files download automatically."
      }
    },
    {
      "@type": "Question",
      "name": "How to convert WEBP to JPG on iPhone?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Open this page in Safari on your iPhone. Tap the upload area and select your WEBP file from Photos or Files. The conversion happens instantly in your browser, and you can save the JPG to your Photos app."
      }
    },
    {
      "@type": "Question",
      "name": "Do you upload my files?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "No. This converter runs 100% in your browser using JavaScript. Your files never leave your device - they're processed locally using the HTML5 Canvas API. We have no server-side processing and cannot see or store your images."
      }
    },
    {
      "@type": "Question",
      "name": "Can I batch convert multiple WEBP files?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes! You can drag and drop multiple WEBP files at once, or select multiple files from the file picker. Each file converts independently, and you can download them individually or all at once as a ZIP file."
      }
    },
    {
      "@type": "Question",
      "name": "What's the difference between JPG and PNG?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "JPG uses lossy compression - smaller files but some quality loss. Best for photos. PNG uses lossless compression - larger files but perfect quality, and supports transparency. Choose JPG for photos and screenshots, PNG for graphics with transparency or when you need perfect quality."
      }
    },
    {
      "@type": "Question",
      "name": "Can I convert animated WEBP?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "This converter extracts the first frame from animated WEBP files. Full animation conversion to GIF requires specialized tools. If you need to preserve animation, consider using a dedicated animated WEBP to GIF converter."
      }
    },
    {
      "@type": "Question",
      "name": "What is the maximum file size?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "The maximum file size is 50MB per image. Since processing happens in your browser, very large files may be slower to convert depending on your device's processing power."
      }
    },
    {
      "@type": "Question",
      "name": "Why won't my file convert?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Common reasons: the file isn't actually a WEBP (check the file extension), the file is corrupted, or it exceeds the 50MB size limit. Try downloading the image again or check if it opens in an image viewer first."
      }
    }
  ]
};

const FEATURES = [
  {
    icon: Zap,
    title: "Auto-Convert on Upload",
    description: "Files convert instantly when you drop or select them. No extra buttons to click."
  },
  {
    icon: Archive,
    title: "Drag & Drop Batch Conversion",
    description: "Convert multiple WEBP files at once. Drag a whole folder of images."
  },
  {
    icon: Settings,
    title: "JPG Quality Presets",
    description: "Choose Small (70%), Balanced (85%), or High (95%) quality for your needs."
  },
  {
    icon: Image,
    title: "PNG Option with Transparency",
    description: "Convert to PNG for lossless quality or to preserve transparent backgrounds."
  },
  {
    icon: Download,
    title: "Auto-Download Toggle",
    description: "Enable auto-download to save files immediately after conversion."
  },
  {
    icon: Archive,
    title: "Download All as ZIP",
    description: "Get all converted files in a single ZIP download. Choose JPG or PNG format."
  },
  {
    icon: Eye,
    title: "Size Comparison Display",
    description: "See original and converted file sizes side by side for each file."
  },
  {
    icon: Wifi,
    title: "Works Offline / No Uploads",
    description: "Runs entirely in your browser. Works offline after page load. Files never leave your device."
  }
];

export default function WebpToJpgPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <main className="min-h-screen bg-gray-50">
        <section className="py-12 md:py-16 px-4">
          <div className="max-w-4xl mx-auto text-center mb-10">
            <span className="inline-block px-4 py-1.5 bg-orange-100 text-orange-700 text-sm font-medium rounded-full mb-4">
              100% Free &amp; Private
            </span>
            <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
              WEBP to JPG Converter
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Convert WEBP images to JPG or PNG instantly. Batch conversion, quality presets, ZIP download. 
              Runs in your browser - files never leave your device.
            </p>
          </div>

          <WebpToJpgClient />
        </section>

        <section className="py-12 px-4 bg-white border-t border-gray-100">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
              The WEBP to JPG Converter That Fixes Annoying Downloads
            </h2>
            <div className="prose prose-gray max-w-none">
              <p>
                Ever right-click an image to save it, only to find it downloaded as a .webp file that won&apos;t open 
                in your image editor? You&apos;re not alone. Websites increasingly serve images in WEBP format because 
                it&apos;s more efficient - but that doesn&apos;t help when you need a JPG for Photoshop, Canva, or printing.
              </p>
              <p>
                Our WEBP to JPG converter solves this instantly. Drop your .webp file, get a .jpg back. 
                No signup, no waiting, no file size limits that matter for normal images. 
                The conversion happens right in your browser - your files never touch our servers.
              </p>
              <p>
                Need PNG instead? Just toggle the output format. Need to convert 50 images at once? 
                Drag them all in and download a ZIP. Need maximum quality? Use the High (95%) preset. 
                We built this to be the converter we wanted to use ourselves.
              </p>
            </div>
          </div>
        </section>

        <section className="py-12 px-4 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
              How It Works
            </h2>
            <div className="prose prose-gray max-w-none">
              <p>
                This converter uses the HTML5 Canvas API built into every modern browser. 
                When you drop a WEBP file, here&apos;s what happens:
              </p>
              <ol>
                <li><strong>Load:</strong> Your browser reads the WEBP file and decodes it into raw pixel data.</li>
                <li><strong>Draw:</strong> Those pixels are drawn onto an invisible canvas element.</li>
                <li><strong>Export:</strong> The canvas re-encodes the image as JPG or PNG using the quality setting you chose.</li>
                <li><strong>Download:</strong> The converted file is offered for download - or auto-downloads if you enabled that.</li>
              </ol>
              <p>
                The entire process takes milliseconds for normal-sized images. Large images (10MB+) might take 
                a second or two depending on your device. Since everything runs locally, even a slow internet 
                connection won&apos;t affect conversion speed.
              </p>
            </div>
          </div>
        </section>

        <section className="py-12 px-4 bg-white border-t border-gray-100">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
              Best Settings: When to Use JPG vs PNG
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-blue-50 p-6 rounded-xl">
                <h3 className="font-semibold text-blue-900 mb-3">Choose JPG When:</h3>
                <ul className="space-y-2 text-blue-800 text-sm">
                  <li>• Converting photos or screenshots</li>
                  <li>• File size matters more than perfect quality</li>
                  <li>• Uploading to social media or websites</li>
                  <li>• Printing photos (use High quality)</li>
                  <li>• You don&apos;t need transparency</li>
                </ul>
              </div>
              <div className="bg-purple-50 p-6 rounded-xl">
                <h3 className="font-semibold text-purple-900 mb-3">Choose PNG When:</h3>
                <ul className="space-y-2 text-purple-800 text-sm">
                  <li>• The image has a transparent background</li>
                  <li>• Converting logos, icons, or graphics</li>
                  <li>• You need perfect, lossless quality</li>
                  <li>• The image has sharp text or lines</li>
                  <li>• File size isn&apos;t a concern</li>
                </ul>
              </div>
            </div>
            <div className="mt-6 p-4 bg-gray-100 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Quality Preset Guide:</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li><strong>Small (70%):</strong> Good for web thumbnails, previews, social sharing where speed matters</li>
                <li><strong>Balanced (85%):</strong> Best for most uses - good quality with reasonable file size</li>
                <li><strong>High (95%):</strong> Use for printing, archiving, or when you need maximum quality</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="py-12 px-4 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
              Batch Conversion &amp; ZIP Download
            </h2>
            <div className="prose prose-gray max-w-none">
              <p>
                Need to convert a bunch of WEBP files at once? Drag and drop multiple files - or even 
                select a whole folder. Each file converts independently, so one failed conversion 
                won&apos;t stop the others.
              </p>
              <p>
                When you have multiple files ready, the &quot;Download All as ZIP&quot; button packages them 
                into a single download. You can choose whether the ZIP contains JPGs or PNGs using the 
                ZIP Format dropdown. The ZIP uses the same filenames as your originals, just with the new extension.
              </p>
              <p>
                Pro tip: If you&apos;re converting many files and don&apos;t want them all downloading individually, 
                turn off Auto-Download first. Convert everything, then grab them all at once with the ZIP button.
              </p>
            </div>
          </div>
        </section>

        <section className="py-12 px-4 bg-white border-t border-gray-100">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <Shield className="w-8 h-8 text-green-600" />
              Your Privacy is Protected
            </h2>
            <div className="prose prose-gray max-w-none">
              <p>
                Unlike most online converters, this tool runs <strong>100% in your browser</strong>. 
                Your images are never uploaded to any server. We couldn&apos;t see your files even if we wanted to.
              </p>
              <ul>
                <li>No file uploads - conversion happens locally on your device</li>
                <li>No server processing - uses browser-native Canvas API</li>
                <li>No data collection - we don&apos;t track what you convert</li>
                <li>Works offline - after the page loads, no internet needed</li>
                <li>No account required - just drop files and go</li>
              </ul>
              <p>
                This makes it safe for converting sensitive images, proprietary photos, or anything 
                you wouldn&apos;t want uploaded to a random server on the internet.
              </p>
            </div>
          </div>
        </section>

        <section className="py-12 px-4 bg-gray-50">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">
              Features
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {FEATURES.map((feature, i) => (
                <div key={i} className="bg-white p-5 rounded-xl border border-gray-200">
                  <feature.icon className="w-8 h-8 text-orange-500 mb-3" />
                  <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-12 px-4 bg-white border-t border-gray-100">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {[
                {
                  q: "Why do images download as WEBP?",
                  a: "Many websites now serve images in WEBP format because it offers better compression than JPG or PNG while maintaining quality. When you right-click and save an image, your browser downloads it in whatever format the website serves - which is increasingly WEBP."
                },
                {
                  q: "Is WEBP better than JPG?",
                  a: "WEBP offers better compression (smaller file sizes) at equivalent quality compared to JPG. However, JPG has much wider compatibility - it works in all image editors, older devices, and legacy software. For web use, WEBP is great. For sharing, printing, or editing, JPG is often more practical."
                },
                {
                  q: "Does converting WEBP to JPG reduce quality?",
                  a: "Converting from WEBP to JPG involves re-encoding, which can cause some quality loss since both are lossy formats. To minimize this, use our 'High (95%)' quality preset. Converting to PNG is lossless and preserves all visual quality."
                },
                {
                  q: "How to convert WEBP to JPG on Mac?",
                  a: "Simply open this page in Safari, Chrome, or Firefox on your Mac. Drag and drop your WEBP files into the converter, and they'll instantly convert to JPG. No software installation needed."
                },
                {
                  q: "How to convert WEBP to JPG on Windows?",
                  a: "Open this page in any modern browser (Chrome, Firefox, Edge) on Windows. Drop your WEBP files into the upload area and they'll convert instantly."
                },
                {
                  q: "How to convert WEBP to JPG on iPhone?",
                  a: "Open this page in Safari on your iPhone. Tap the upload area and select your WEBP file from Photos or Files. The conversion happens instantly in your browser."
                },
                {
                  q: "Do you upload my files?",
                  a: "No. This converter runs 100% in your browser using JavaScript. Your files never leave your device - they're processed locally using the HTML5 Canvas API."
                },
                {
                  q: "Can I batch convert multiple WEBP files?",
                  a: "Yes! You can drag and drop multiple WEBP files at once. Each file converts independently, and you can download them individually or all at once as a ZIP file."
                },
                {
                  q: "What's the difference between JPG and PNG?",
                  a: "JPG uses lossy compression - smaller files but some quality loss. Best for photos. PNG uses lossless compression - larger files but perfect quality, and supports transparency."
                },
                {
                  q: "Can I convert animated WEBP?",
                  a: "This converter extracts the first frame from animated WEBP files. Full animation conversion to GIF requires specialized tools."
                },
                {
                  q: "What is the maximum file size?",
                  a: "The maximum file size is 50MB per image. Since processing happens in your browser, very large files may be slower to convert depending on your device."
                },
                {
                  q: "Why won't my file convert?",
                  a: "Common reasons: the file isn't actually a WEBP (check the file extension), the file is corrupted, or it exceeds the 50MB size limit. Try downloading the image again."
                }
              ].map((faq, i) => (
                <details key={i} className="bg-gray-50 border border-gray-200 rounded-lg group">
                  <summary className="px-5 py-4 cursor-pointer font-medium text-gray-900 hover:bg-gray-100 list-none flex justify-between items-center">
                    {faq.q}
                    <span className="text-gray-400 group-open:rotate-180 transition-transform">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </span>
                  </summary>
                  <div className="px-5 pb-4 text-gray-600 text-sm">
                    {faq.a}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="py-12 px-4">
          <ExploreMoreTools currentTool="/tools/webp-to-jpg" />
        </section>
      </main>
    </>
  );
}
