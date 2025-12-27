import { Metadata } from 'next';
import AudioKeyDetectorClient from './AudioKeyDetectorClient';
import ExploreMoreTools from '@/components/ExploreMoreTools';
import { CheckCircle2, Music, Zap, Shield, Target, AlertTriangle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Free Audio Key Detector | Song Key Finder | VCM Suite',
  description: 'Detect the key and scale of any song for free. Find if a track is major or minor, see confidence scores, and detect key changes. No account required.',
  keywords: [
    'audio key detector',
    'song key finder',
    'key and scale detector',
    'detect key of a song',
    'key finder online',
    'audio to key',
    'key detection',
    'major or minor detector',
    'free key detector',
    'music key finder',
    'what key is this song',
    'find key of sample'
  ],
  openGraph: {
    title: 'Free Audio Key Detector | VCM Suite',
    description: 'Detect the key and scale of any song. Find major vs minor, confidence scores, and key changes.',
    type: 'website',
  }
};

const faqs = [
  {
    question: 'How do I find the key of a song?',
    answer: 'Upload your audio file (MP3, WAV, FLAC, etc.) and click "Detect Key". Our algorithm analyzes the harmonic content using chroma features and compares it against standard key profiles to identify the most likely key and scale.'
  },
  {
    question: 'Can this detect major vs minor?',
    answer: 'Yes. The detector distinguishes between major and minor keys by comparing your audio against both Krumhansl-Schmuckler major and minor key profiles. It will tell you whether the track is in a major key (like C major) or minor key (like A minor).'
  },
  {
    question: 'How accurate is key detection?',
    answer: 'Accuracy depends on the audio content. Clean, tonal music (piano, guitar, vocals) typically achieves 80-90% accuracy. Complex harmony, key changes, or percussive content can reduce accuracy. We show a confidence score so you know how certain the detection is.'
  },
  {
    question: 'Why does it show low confidence?',
    answer: 'Low confidence usually means: (1) the audio is mostly percussive with little tonal content, (2) the harmony is ambiguous or chromatic, (3) there are frequent key changes, or (4) the recording is noisy. Try using a cleaner excerpt or isolating the melodic elements.'
  },
  {
    question: 'Can it detect key changes (modulations)?',
    answer: 'Yes. The tool analyzes your audio in 8-second windows and identifies segments where the key changes. If your track modulates from A minor to C major, you\'ll see both keys listed with their timestamps.'
  },
  {
    question: 'What audio works best?',
    answer: 'Tonal audio with clear harmonic content works best: piano, guitar, synths, vocals, orchestral music. Drum loops, noise, and heavily distorted audio give unreliable results. Longer excerpts (30+ seconds) also help improve accuracy.'
  },
  {
    question: 'Does it work on vocals-only?',
    answer: 'Yes, isolated vocals work well for key detection since they contain clear pitch information. Acapellas are great inputs. However, heavily processed vocals with lots of reverb or autotune artifacts may reduce accuracy.'
  },
  {
    question: 'Does it work on full mixes?',
    answer: 'Yes, full mixes work, but accuracy depends on the mix. If the harmonic elements (chords, bass, melody) are prominent, detection is reliable. Very dense or complex mixes may show lower confidence.'
  },
  {
    question: 'What file types are supported?',
    answer: 'We support MP3, WAV, M4A, FLAC, and OGG audio files. Maximum file size is 25MB and maximum duration is 10 minutes. Files are converted internally before analysis.'
  },
  {
    question: 'Do you store my audio?',
    answer: 'Your audio is processed in a temporary directory and deleted immediately after analysis. The analysis results (JSON) are stored for 2 hours to allow downloads, then automatically deleted. We don\'t keep copies of your music.'
  },
  {
    question: 'How do I use this with BPM Finder?',
    answer: 'The Key Detector and BPM Finder work together in our "Prep Stack" workflow. First detect the key, then find the BPM—you\'ll have both pieces of information needed to match samples, create remixes, or produce in the same key and tempo.'
  },
  {
    question: 'How do I use this with Audio to MIDI?',
    answer: 'Once you know the key, use our Audio to MIDI converter to transcribe the melodic content. Knowing the key helps you interpret the MIDI correctly and make adjustments in your DAW.'
  }
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'SoftwareApplication',
      name: 'VCM Audio Key + Scale Detector',
      applicationCategory: 'MultimediaApplication',
      operatingSystem: 'Web',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD'
      },
      description: 'Free online tool to detect the musical key and scale of audio files. Shows confidence scores and detects key changes.',
      featureList: [
        'Key detection',
        'Major vs minor detection',
        'Confidence scoring',
        'Key change detection',
        'Multiple audio format support'
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

export default function AudioKeyDetectorPage() {
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
              Free Audio Key Detector
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              VCM Audio Key + Scale Detector
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Find out what key your audio is in. Major or minor, with confidence scores and modulation detection.
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
          </div>
        </section>

        <section className="pb-12 px-4">
          <div className="max-w-4xl mx-auto">
            <AudioKeyDetectorClient />
          </div>
        </section>

        <section className="py-12 px-4 bg-white">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              You found a beat. You found a sample. You have no clue what key it's in.
            </h2>
            <p className="text-gray-600 mb-6">
              This tool tells you in seconds. Upload any audio file and get the key, scale (major or minor), 
              and a confidence score. If the track modulates, you'll see where the key changes happen.
            </p>
            <p className="text-gray-600">
              No more guessing. No more playing random notes on your keyboard to figure it out. 
              Just upload, detect, and get back to making music.
            </p>
          </div>
        </section>

        <section className="py-12 px-4 bg-purple-50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Prep Stack Workflow</h2>
            <p className="text-center text-gray-600 mb-8 max-w-2xl mx-auto">
              Key detection is step one. Combine it with these tools for a complete audio prep workflow:
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl p-6 text-center shadow-sm border-2 border-orange-200">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-orange-600 font-bold">1</span>
                </div>
                <h3 className="font-semibold mb-2 text-orange-700">Key Detector</h3>
                <p className="text-sm text-gray-600">Find the key and scale</p>
                <p className="text-xs text-orange-600 mt-2">You are here</p>
              </div>
              <Link href="/tools/bpm-finder" className="bg-white rounded-xl p-6 text-center shadow-sm hover:shadow-md transition-shadow group">
                <div className="w-12 h-12 bg-gray-100 group-hover:bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors">
                  <span className="text-gray-600 group-hover:text-purple-600 font-bold">2</span>
                </div>
                <h3 className="font-semibold mb-2">BPM Finder</h3>
                <p className="text-sm text-gray-600">Detect the tempo</p>
                <p className="text-xs text-purple-600 mt-2 flex items-center justify-center gap-1">
                  Go <ArrowRight className="w-3 h-3" />
                </p>
              </Link>
              <Link href="/tools/audio-to-midi" className="bg-white rounded-xl p-6 text-center shadow-sm hover:shadow-md transition-shadow group">
                <div className="w-12 h-12 bg-gray-100 group-hover:bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors">
                  <span className="text-gray-600 group-hover:text-blue-600 font-bold">3</span>
                </div>
                <h3 className="font-semibold mb-2">Audio to MIDI</h3>
                <p className="text-sm text-gray-600">Transcribe to notes</p>
                <p className="text-xs text-blue-600 mt-2 flex items-center justify-center gap-1">
                  Go <ArrowRight className="w-3 h-3" />
                </p>
              </Link>
            </div>
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
                <h3 className="font-semibold mb-2">Upload</h3>
                <p className="text-sm text-gray-600">Drop your audio file</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-orange-600 font-bold">2</span>
                </div>
                <h3 className="font-semibold mb-2">Analyze</h3>
                <p className="text-sm text-gray-600">Extract chroma features</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-orange-600 font-bold">3</span>
                </div>
                <h3 className="font-semibold mb-2">Match</h3>
                <p className="text-sm text-gray-600">Compare to key profiles</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-orange-600 font-bold">4</span>
                </div>
                <h3 className="font-semibold mb-2">Results</h3>
                <p className="text-sm text-gray-600">Get key + confidence</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 px-4 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Features</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <Target className="w-8 h-8 text-orange-500 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Key + Scale Detection</h3>
                <p className="text-sm text-gray-600">Identifies both the tonic (A, B, C, etc.) and mode (major/minor)</p>
              </div>
              <div className="text-center">
                <Zap className="w-8 h-8 text-purple-500 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Modulation Detection</h3>
                <p className="text-sm text-gray-600">Finds key changes with timestamps</p>
              </div>
              <div className="text-center">
                <Music className="w-8 h-8 text-blue-500 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Confidence Scores</h3>
                <p className="text-sm text-gray-600">Know how certain the detection is</p>
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
                  <li><strong>Complex harmony can confuse detection.</strong> Jazz, atonal music, and frequent chord changes may show ambiguous results.</li>
                  <li><strong>Modulations are best-effort.</strong> The windowed analysis catches obvious key changes but may miss subtle ones.</li>
                  <li><strong>Works best on tonal audio.</strong> Drums, noise, and sound effects have no key—expect low confidence.</li>
                  <li><strong>Short clips reduce confidence.</strong> Longer excerpts (30+ seconds) give more reliable results.</li>
                  <li><strong>Enharmonic equivalents.</strong> C# and Db are the same pitch; we pick one notation.</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 px-4">
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
            <ExploreMoreTools currentTool="/tools/audio-key-detector" />
          </div>
        </section>

        <footer className="py-8 px-4 border-t">
          <div className="max-w-4xl mx-auto text-center text-sm text-gray-500">
            <p className="mb-2">
              Key detection uses chroma-based analysis with Krumhansl-Schmuckler key profiles.
            </p>
            <p>
              Your audio is processed server-side and deleted immediately after analysis. 
              Results are available for 2 hours, then automatically removed.
            </p>
          </div>
        </footer>
      </main>
    </>
  );
}
