import { Metadata } from 'next';
import M4aToMp3ConversionClient from './M4aToMp3ConversionClient';
import { AudioLines, Download, Lock, SlidersHorizontal } from 'lucide-react';

export const metadata: Metadata = {
  title: 'M4A to MP3 Conversion (Free Online Tool)',
  description:
    'Free M4A to MP3 conversion tool. Convert M4A audio to MP3 in your browser with 128/192/320 kbps options, no upload required.',
  keywords: [
    'm4a to mp3 conversion',
    'm4a to mp3',
    'm4a to mp3 converter',
    'convert m4a to mp3',
    'm4a to mp3 online',
    'm4a audio converter',
    'mp3 converter',
  ],
  openGraph: {
    title: 'M4A to MP3 Conversion (Free Online Tool)',
    description:
      'Convert M4A to MP3 online in your browser. Fast, private, and free.',
    type: 'website',
  },
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How does M4A to MP3 conversion work?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The tool decodes your M4A audio and re-encodes it as MP3 with your selected bitrate. Conversion runs in your browser and then provides a downloadable MP3 file.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is this M4A to MP3 converter free?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. This M4A to MP3 conversion tool is free to use with no signup required.',
      },
    },
    {
      '@type': 'Question',
      name: 'What bitrate should I choose for MP3 output?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Use 128 kbps for smaller files, 192 kbps for balanced quality and size, and 320 kbps for highest MP3 quality.',
      },
    },
    {
      '@type': 'Question',
      name: 'Do you upload my audio files?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. This tool processes conversion in your browser using WebAssembly. Your audio stays on your device.',
      },
    },
  ],
};

const softwareSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'VCM M4A to MP3 Conversion Tool',
  applicationCategory: 'MultimediaApplication',
  operatingSystem: 'Web',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  description:
    'Free online M4A to MP3 conversion with bitrate control and instant download.',
};

export default function M4aToMp3ConversionPage() {
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

      <M4aToMp3ConversionClient />

      <section className="py-12 px-4 bg-white border-t border-gray-100">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
            M4A to MP3 Conversion for Creators
          </h2>
          <div className="prose prose-gray max-w-none">
            <p>
              If you need reliable <strong>m4a to mp3 conversion</strong>, this tool is built for speed and simplicity.
              Drop in your M4A file, choose a bitrate, and get an MP3 you can upload anywhere.
            </p>
            <p>
              M4A is great for Apple workflows, but MP3 remains the most universal format for distribution, sharing, and
              legacy compatibility. This converter helps you bridge that gap in seconds.
            </p>
            <p>
              The workflow is straightforward: upload M4A, set quality, convert, preview, download. No account gates,
              no cluttered steps, and no waiting on slow server queues.
            </p>
          </div>
        </div>
      </section>

      <section className="py-12 px-4 bg-gray-50 border-t border-gray-100">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">How to Convert M4A to MP3</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <p className="font-semibold text-gray-900 mb-2">1. Upload your M4A file</p>
              <p className="text-sm text-gray-600">Drag and drop or click the upload box to select your `.m4a` audio file.</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <p className="font-semibold text-gray-900 mb-2">2. Choose MP3 quality</p>
              <p className="text-sm text-gray-600">Pick `128`, `192`, or `320` kbps depending on your quality and size target.</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <p className="font-semibold text-gray-900 mb-2">3. Convert instantly</p>
              <p className="text-sm text-gray-600">Click convert to run the M4A to MP3 conversion process in your browser.</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <p className="font-semibold text-gray-900 mb-2">4. Preview and download</p>
              <p className="text-sm text-gray-600">Listen to the result and download your MP3 when it sounds right.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 px-4 bg-white border-t border-gray-100">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">Why Use This Converter</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <AudioLines className="w-5 h-5 text-orange-600" />
                <p className="font-semibold text-gray-900">Practical Audio Output</p>
              </div>
              <p className="text-sm text-gray-600">Export MP3 at common bitrates used by streaming, social, and upload pipelines.</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <SlidersHorizontal className="w-5 h-5 text-orange-600" />
                <p className="font-semibold text-gray-900">Quality Control</p>
              </div>
              <p className="text-sm text-gray-600">You control file size versus quality with bitrate options before conversion.</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <Download className="w-5 h-5 text-orange-600" />
                <p className="font-semibold text-gray-900">Immediate Download</p>
              </div>
              <p className="text-sm text-gray-600">No email step. Convert and download from one flow.</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <Lock className="w-5 h-5 text-orange-600" />
                <p className="font-semibold text-gray-900">Private Workflow</p>
              </div>
              <p className="text-sm text-gray-600">Conversion runs locally in your browser session.</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
