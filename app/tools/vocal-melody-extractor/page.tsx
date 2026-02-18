import { Metadata } from 'next';
import VocalMelodyExtractorClient from './VocalMelodyExtractorClient';
import ExploreMoreTools from '@/components/ExploreMoreTools';
import { CheckCircle2, Music, FileText, AudioLines, Download, Zap, Shield, Clock, AlertTriangle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Free Acapella Vocal to MIDI Melody Extractor | VCM Suite',
  description: 'Upload clean vocals or acapella and convert the lead melody to MIDI for free. Get melody MIDI, pitch curve CSV, and audio preview.',
  keywords: [
    'vocal melody extractor',
    'vocals to midi',
    'singing to midi',
    'acapella vocals to midi',
    'clean vocals to midi',
    'melody to midi',
    'acapella to midi',
    'pitch to midi',
    'free vocal midi converter',
    'extract melody from song',
    'vocal pitch detection',
    'melody extraction online',
    'voice to midi free'
  ],
  openGraph: {
    title: 'Free Acapella Vocal to MIDI Melody Extractor | VCM Suite',
    description: 'Convert clean vocals or acapella to monophonic melody MIDI with pitch curve analysis.',
    type: 'website',
  }
};

const faqs = [
  {
    question: 'What is a vocal melody extractor?',
    answer: 'A vocal melody extractor analyzes clean vocal audio to identify the main sung melody line. It detects pitch over time, then applies post-processing to isolate a clean, single-voice melody you can import into your DAW as MIDI.'
  },
  {
    question: 'Can I convert singing to MIDI for free?',
    answer: 'Yes, this tool is 100% free. Upload your vocal recording, and we\'ll extract the melody as a MIDI file. You also get a pitch curve CSV for detailed analysis and a WAV preview of the extracted melody.'
  },
  {
    question: 'What audio works best for melody extraction?',
    answer: 'Solo vocals or acapellas work best. Clean recordings with minimal background noise and reverb give the most accurate results. Full songs with heavy instrumentation are not recommended for this workflow.'
  },
  {
    question: 'Can I use it on a full song with instruments?',
    answer: 'This tool is not a vocal stem separator. It is designed for vocal-first files (acapella or clean solo vocals). On full songs, instruments can dominate pitch detection and reduce accuracy.'
  },
  {
    question: 'Why does the MIDI sound messy or wrong?',
    answer: 'Several factors affect accuracy: background noise, heavy reverb, multiple voices singing together, or instruments playing in the same frequency range as vocals. The tool applies heuristics to clean up results, but complex audio can still produce artifacts.'
  },
  {
    question: 'Does this support pitch bends and slides?',
    answer: 'The current version outputs quantized MIDI notes without pitch bend data. Vocal slides and vibrato are simplified to the nearest semitone. The pitch curve CSV provides continuous pitch data if you need sub-semitone detail.'
  },
  {
    question: 'How accurate is it?',
    answer: 'On clean solo vocals, expect 85-95% note accuracy. On noisy recordings or full mixes, accuracy drops significantly. The algorithm is optimized for monophonic melody extraction, not polyphonic transcription.'
  },
  {
    question: 'How do I import the MIDI into Ableton/Logic/FL Studio?',
    answer: 'Download the melody.mid file, then drag it directly onto a MIDI track in your DAW. In Ableton, drop it on an empty MIDI track. In Logic, use File > Import > MIDI. In FL Studio, drag to the playlist or channel rack.'
  },
  {
    question: 'Do you store my uploaded audio?',
    answer: 'Your audio is processed in a temporary directory and deleted immediately after extraction. Output files are stored for 2 hours to allow downloads, then automatically deleted. We don\'t keep copies of your music.'
  },
  {
    question: 'What\'s the difference between this and Audio to MIDI Converter?',
    answer: 'The Audio to MIDI Converter transcribes everything it hears—all notes, all instruments. This Vocal Melody Extractor specifically isolates the lead melodic line, filtering out harmonies, chords, and background elements to give you a clean single-voice MIDI.'
  },
  {
    question: 'How can I get cleaner results?',
    answer: 'Use isolated vocals without backing tracks. Record in a quiet environment. Avoid heavy reverb and effects. Sing clearly with distinct note attacks. If extracting from a mix, use a vocal isolation tool first.'
  },
  {
    question: 'What file types are supported?',
    answer: 'We support MP3, WAV, M4A, FLAC, and OGG audio files. Maximum file size is 25MB and maximum duration is 10 minutes. Files are converted to WAV internally before processing.'
  }
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'SoftwareApplication',
      name: 'VCM Vocal Melody Extractor',
      applicationCategory: 'MultimediaApplication',
      operatingSystem: 'Web',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD'
      },
      description: 'Free online tool to extract clean monophonic vocal melodies from audio. Converts singing to MIDI with pitch curve analysis.',
      featureList: [
        'Vocal melody extraction',
        'Singing to MIDI conversion',
        'Pitch curve CSV export',
        'Monophonic melody isolation',
        'WAV preview generation'
      ]
    },
    {
      '@type': 'FAQPage',
      mainEntity: faqs.map(faq => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer
        }
      }))
    }
  ]
};

export default function VocalMelodyExtractorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <section className="pt-16 pb-8 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <span className="inline-block bg-orange-100 text-orange-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
              Free Vocal Melody Extractor
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Acapella Vocal to MIDI Melody Extractor
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Upload clean vocals or acapella and convert the lead melody into monophonic MIDI for your DAW.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600 mb-8">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                Free to use
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                No account required
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                Files not stored
              </span>
            </div>
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-4 py-3 max-w-2xl mx-auto">
              Best for clean vocal recordings and acapellas. This tool does not separate vocals from a full mixed song.
            </p>
          </div>
        </section>

        <section className="pb-12 px-4">
          <div className="max-w-4xl mx-auto">
            <VocalMelodyExtractorClient />
          </div>
        </section>

        <section className="py-12 px-4 bg-white">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              You sang a melody you don't want to lose
            </h2>
            <p className="text-gray-600 mb-6">
              But turning that vocal into MIDI is slow and annoying. Manually transcribing pitches note by note? 
              That kills the creative momentum. This tool pulls out the lead melody so you can drop it into your DAW in seconds.
            </p>
            <p className="text-gray-600">
              Upload a clean vocal recording or acapella. We&apos;ll extract the lead melodic line,
              clean it up to a single monophonic voice, and give you MIDI you can actually use plus a pitch curve
              for detailed analysis and a preview WAV so you know exactly what you're getting.
            </p>
          </div>
        </section>

        <section className="py-12 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">How It Works</h2>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-orange-600 font-bold">1</span>
                </div>
                <h3 className="font-semibold mb-2">Upload Audio</h3>
                <p className="text-sm text-gray-600">Drop your clean vocal recording or acapella</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-orange-600 font-bold">2</span>
                </div>
                <h3 className="font-semibold mb-2">AI Analysis</h3>
                <p className="text-sm text-gray-600">AI detects pitch and note timing</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-orange-600 font-bold">3</span>
                </div>
                <h3 className="font-semibold mb-2">Melody Isolation</h3>
                <p className="text-sm text-gray-600">Algorithm selects the lead melodic line</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-orange-600 font-bold">4</span>
                </div>
                <h3 className="font-semibold mb-2">Download</h3>
                <p className="text-sm text-gray-600">Get MIDI, CSV, and preview files</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 px-4 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">What You Get</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <Music className="w-6 h-6 text-orange-500" />
                  <h3 className="font-semibold">Melody MIDI</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Clean monophonic MIDI file with the extracted melody. Import directly into any DAW—Ableton, Logic, FL Studio, Pro Tools.
                </p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <FileText className="w-6 h-6 text-gray-700" />
                  <h3 className="font-semibold">Notes CSV</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Detailed note events with start time, end time, MIDI note, frequency, and confidence. Perfect for analysis or custom processing.
                </p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <FileText className="w-6 h-6 text-gray-600" />
                  <h3 className="font-semibold">Pitch Curve CSV</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Frame-by-frame pitch data at 20ms resolution. See the continuous pitch contour including slides and vibrato detail.
                </p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <AudioLines className="w-6 h-6 text-purple-600" />
                  <h3 className="font-semibold">Preview WAV</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Audio rendering of the extracted melody using sine waves. Listen before importing to verify the extraction quality.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Features</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <Zap className="w-8 h-8 text-orange-500 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Fast Processing</h3>
                <p className="text-sm text-gray-600">Most files process in under 30 seconds</p>
              </div>
              <div className="text-center">
                <Shield className="w-8 h-8 text-green-500 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Privacy First</h3>
                <p className="text-sm text-gray-600">Audio deleted after processing, outputs expire in 2 hours</p>
              </div>
              <div className="text-center">
                <Clock className="w-8 h-8 text-blue-500 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">No Account Needed</h3>
                <p className="text-sm text-gray-600">Just upload and download—no signup required</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 px-4 bg-amber-50 border-y border-amber-100">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Honest Limitations</h2>
                <ul className="space-y-2 text-gray-700">
                  <li><strong>Solo vocals work best.</strong> Full mixes with instruments in the same frequency range can confuse the algorithm.</li>
                  <li><strong>Not a stem separator.</strong> It does not isolate vocals from beat-heavy full songs.</li>
                  <li><strong>No pitch bends.</strong> Slides and vibrato are quantized to the nearest semitone in MIDI output.</li>
                  <li><strong>Polyphony not supported.</strong> If multiple notes play simultaneously, only one is selected per frame.</li>
                  <li><strong>Noisy recordings struggle.</strong> Background noise, heavy reverb, and room reflections reduce accuracy.</li>
                  <li><strong>Not real-time.</strong> Processing happens server-side and takes 10-60 seconds depending on duration.</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Alternatives Comparison</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Feature</th>
                    <th className="text-center py-3 px-4">VCM Melody Extractor</th>
                    <th className="text-center py-3 px-4">Melodyne</th>
                    <th className="text-center py-3 px-4">DAW Built-in</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-3 px-4">Price</td>
                    <td className="text-center py-3 px-4 text-green-600 font-medium">Free</td>
                    <td className="text-center py-3 px-4">$99–$699</td>
                    <td className="text-center py-3 px-4">Varies</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4">Monophonic melody focus</td>
                    <td className="text-center py-3 px-4">Yes</td>
                    <td className="text-center py-3 px-4">Manual</td>
                    <td className="text-center py-3 px-4">No</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4">Pitch curve export</td>
                    <td className="text-center py-3 px-4">Yes (CSV)</td>
                    <td className="text-center py-3 px-4">Limited</td>
                    <td className="text-center py-3 px-4">No</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4">Polyphonic transcription</td>
                    <td className="text-center py-3 px-4">No</td>
                    <td className="text-center py-3 px-4">Yes</td>
                    <td className="text-center py-3 px-4">Some</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4">Pitch bend support</td>
                    <td className="text-center py-3 px-4">No</td>
                    <td className="text-center py-3 px-4">Yes</td>
                    <td className="text-center py-3 px-4">Varies</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4">No installation</td>
                    <td className="text-center py-3 px-4">Yes</td>
                    <td className="text-center py-3 px-4">No</td>
                    <td className="text-center py-3 px-4">No</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="py-12 px-4 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <details key={index} className="bg-white rounded-lg shadow-sm">
                  <summary className="px-6 py-4 cursor-pointer font-medium text-gray-900 hover:text-orange-600">
                    {faq.question}
                  </summary>
                  <div className="px-6 pb-4 text-gray-600">
                    {faq.answer}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="py-8 px-4">
          <div className="max-w-4xl mx-auto">
            <ExploreMoreTools currentTool="/tools/vocal-melody-extractor" />
          </div>
        </section>

        <footer className="py-8 px-4 border-t">
          <div className="max-w-4xl mx-auto text-center text-sm text-gray-500">
            <p>
              Your audio is processed server-side and deleted immediately after extraction. 
              Output files are available for 2 hours, then automatically removed.
            </p>
          </div>
        </footer>
      </main>
    </>
  );
}
