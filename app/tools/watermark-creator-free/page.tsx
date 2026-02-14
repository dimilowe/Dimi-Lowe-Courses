import { Metadata } from "next";
import WatermarkCreatorFreeClient from "./WatermarkCreatorFreeClient";
import ExploreMoreTools from "@/components/ExploreMoreTools";

export const metadata: Metadata = {
  title: "Watermark Creator Free - Add Text or Logo Watermarks Online",
  description:
    "Watermark creator free tool to add your own text or logo watermark to images. Customize opacity, size, rotation, and position. 100% browser-based, no upload required.",
  keywords: [
    "watermark creator free",
    "free watermark creator",
    "add watermark to image",
    "watermark logo online",
    "watermark text on photo",
    "create watermark for digital assets",
    "watermark tool free",
  ],
  openGraph: {
    title: "Watermark Creator Free - Add Text or Logo Watermarks Online",
    description:
      "Add your own text or logo watermark to any image. Fully customizable, private, and free.",
    type: "website",
  },
};

const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Watermark Creator Free",
  applicationCategory: "MultimediaApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  description:
    "Free online watermark creator for digital assets. Add text or logo watermarks with opacity, position, and rotation controls directly in your browser.",
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Is this watermark creator free?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. This watermark creator is free to use. You can upload your image, add text or logo watermark, and download instantly.",
      },
    },
    {
      "@type": "Question",
      name: "Can I use my own logo watermark?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Choose Logo mode and upload your watermark PNG/JPG image, then adjust size, opacity, rotation, and position.",
      },
    },
    {
      "@type": "Question",
      name: "Do you upload my files?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. Processing happens in your browser canvas. Your images stay on your device.",
      },
    },
  ],
};

export default function WatermarkCreatorFreePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <main className="min-h-screen bg-gray-50">
        <section className="py-12 md:py-16 px-4">
          <div className="max-w-5xl mx-auto text-center mb-10">
            <span className="inline-block px-4 py-1.5 bg-orange-100 text-orange-700 text-sm font-medium rounded-full mb-4">
              100% Free Watermark Tool
            </span>
            <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
              Watermark Creator Free
            </h1>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Protect your digital assets by adding your own watermark. Use text or logo watermark,
              control opacity and position, then download in PNG or JPG.
            </p>
          </div>

          <WatermarkCreatorFreeClient />
        </section>

        <section className="py-12 px-4 bg-white border-t border-gray-100">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                Free Watermark Creator for Your Digital Assets
              </h2>
              <p className="text-gray-600 mt-2 max-w-2xl mx-auto">
                A cleaner way to protect image-based work while keeping your files private.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-gradient-to-b from-gray-50 to-white p-6 md:p-8 space-y-5">
              <p className="text-gray-700 leading-relaxed">
                If you publish images online, your files can get reused without attribution. This{" "}
                <strong>watermark creator free</strong> tool helps you place your own brand text or logo
                watermark in seconds.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Upload your image, choose text or logo mode, adjust opacity and position, and download
                the final watermarked image. Everything runs inside your browser, so your files are not
                uploaded to servers.
              </p>
              <p className="text-gray-700 leading-relaxed">
                It works well for social graphics, digital products, portfolio previews, printable assets,
                and product mockups when you need quick protection and clean branding.
              </p>

              <div className="pt-2 flex flex-wrap gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">No upload required</span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">Text + logo watermark</span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-sky-100 text-sky-700">Single + repeat styles</span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-violet-100 text-violet-700">PNG / JPG export</span>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 px-4 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">FAQ</h2>
            <div className="space-y-4">
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h3 className="font-semibold text-gray-900 mb-2">Is this watermark creator free?</h3>
                <p className="text-gray-600 text-sm">
                  Yes. You can create and download watermarked images for free.
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h3 className="font-semibold text-gray-900 mb-2">Can I add my own logo as a watermark?</h3>
                <p className="text-gray-600 text-sm">
                  Yes. Upload your own logo, then adjust placement, transparency, and size.
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h3 className="font-semibold text-gray-900 mb-2">Do images stay private?</h3>
                <p className="text-gray-600 text-sm">
                  Yes. The editor runs locally in your browser, and image data stays on your device.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-6 px-4 bg-white border-t border-gray-100">
          <div className="max-w-4xl mx-auto">
            <ExploreMoreTools currentTool="/tools/watermark-creator-free" />
          </div>
        </section>
      </main>
    </>
  );
}
