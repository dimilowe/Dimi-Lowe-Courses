import { Metadata } from 'next';
import ChordProgressionFinderClient from './ChordProgressionFinderClient';
import ExploreMoreTools from '@/components/ExploreMoreTools';
import { CheckCircle2, Music, Zap, Shield, Target, AlertTriangle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Free Chord Progression Finder | Audio to Chords | VCM Suite',
  description: 'Find the chord progression of any song for free. Upload audio and get chord labels with timestamps. Export to MIDI, CSV, JSON. No account required.',
  keywords: [
    'chord progression finder',
    'chord detector',
    'find chords of a song',
    'audio to chords',
    'chord recognition',
    'chords from audio',
    'song chord finder',
    'chord analyzer',
    'detect chords',
    'what chords are in this song',
    'chord transcription',
    'free chord finder'
  ],
  openGraph: {
    title: 'Free Chord Progression Finder | VCM Suite',
    description: 'Find the chord progression of any song. Get chord labels with timestamps and export to MIDI.',
    type: 'website',
  }
};

const faqs = [
  {
    question: 'How do I find the chords of a song?',
    answer: 'Upload your audio file (MP3, WAV, FLAC, etc.) and click "Find Chords". Our algorithm transcribes the notes using machine learning, then analyzes them in time windows to identify chord patterns. You\'ll get a timeline of chords with timestamps you can follow along or export.'
  },
  {
    question: 'Can this detect chord progressions automatically?',
    answer: 'Yes. The tool analyzes your audio in 2-second windows, identifies which notes are playing, and matches them against chord templates (major, minor, seventh chords, etc.). It outputs a full chord progression timeline with timestamps.'
  },
  {
    question: 'How accurate is chord detection?',
    answer: 'Accuracy depends on the audio content. Clean recordings with clear harmonic content (piano, guitar, synths) typically achieve good results. Full mixes with drums, bass, and multiple instruments are more challenging. We show confidence scores so you know how certain each chord is.'
  },
  {
    question: 'Does it work on vocals-only?',
    answer: 'Vocals can provide some harmonic information, but chord detection works best on instrumental content with clear pitched notes. Acapellas may give limited results since they typically contain only the melody, not full chord voicings.'
  },
  {
    question: 'Does it work on full mixes?',
    answer: 'Yes, but with caveats. Full mixes work when harmonic elements (chords, bass, keys) are prominent. Very dense mixes with competing elements may show lower confidence or occasional errors. For best results, try isolating the harmonic elements first.'
  },
  {
    question: 'Can it detect seventh chords (Am7, G7)?',
    answer: 'Yes. The chord detector includes templates for major, minor, diminished, augmented triads, plus seventh chords (maj7, min7, dom7, m7b5), suspended chords (sus2, sus4), and sixth chords. It picks the best match for each segment.'
  },
  {
    question: 'Why is confidence low?',
    answer: 'Low confidence usually means: (1) the audio is mostly percussive with little pitched content, (2) multiple chords are equally likely, (3) the harmony is ambiguous or chromatic, or (4) there are many non-chord tones present. Try using a cleaner excerpt or isolating the harmonic elements.'
  },
  {
    question: 'Can I export chords to MIDI?',
    answer: 'Yes. We generate a MIDI file with block chords for each detected chord segment. You can drag this into your DAW and use it as a starting point for your arrangement. The MIDI uses root position voicings in a comfortable piano range.'
  },
  {
    question: 'What audio formats are supported?',
    answer: 'We support MP3, WAV, M4A, FLAC, and OGG audio files. Maximum file size is 25MB and maximum duration is 10 minutes. Files are normalized internally before analysis.'
  },
  {
    question: 'Do you store my audio?',
    answer: 'No. Your audio is processed in a temporary directory and deleted immediately after analysis. The output files (JSON, CSV, MIDI) are stored for 2 hours to allow downloads, then automatically deleted. We don\'t keep copies of your music.'
  },
  {
    question: 'How do I use this with Audio to MIDI?',
    answer: 'Great workflow! Use the Chord Finder to understand the harmony, then use Audio to MIDI to get the full note-level transcription. You\'ll have both the chord progression (structure) and the individual notes (details) for complete recreation.'
  },
  {
    question: 'How do I use this with the Key Detector?',
    answer: 'Run both tools on the same audio. The Key Detector tells you the overall key and scale, while the Chord Finder gives you the specific progression. Together, you know both "what key is this in?" and "what chords does it use?"'
  }
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'SoftwareApplication',
      name: 'VCM Chord Progression Finder',
      applicationCategory: 'MultimediaApplication',
      operatingSystem: 'Web',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD'
      },
      description: 'Free online tool to find chord progressions from audio files. Detects major, minor, seventh chords with timestamps and exports to MIDI.',
      featureList: [
        'Automatic chord detection',
        'Timestamp-based chord timeline',
        'Seventh chord recognition',
        'MIDI export',
        'CSV and JSON export',
        'Confidence scoring'
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

export default function ChordProgressionFinderPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <section className="pt-16 pb-8 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <span className="inline-block bg-purple-100 text-purple-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
              Free Chord Progression Finder
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Chord Progression Finder
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Upload a song and get a chord timeline you can recreate in your DAW.
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
            <ChordProgressionFinderClient />
          </div>
        </section>

        <section className="py-12 px-4 bg-white">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              You found a beat. You want to recreate the progression. You don't have perfect pitch.
            </h2>
            <p className="text-gray-600 mb-6">
              This tool figures out the chords for you. Upload any audio file and get a timeline of chord labels 
              with timestamps. Cmaj, Am7, Dm7, G7 — whatever the song uses, we'll find it.
            </p>
            <p className="text-gray-600">
              Export the chords as MIDI and drag them into your DAW. No more guessing, no more trial and error. 
              Just upload, analyze, and start producing.
            </p>
          </div>
        </section>

        <section className="py-12 px-4 bg-purple-50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Prep Stack Workflow</h2>
            <p className="text-center text-gray-600 mb-8 max-w-2xl mx-auto">
              Chord detection is part of a complete audio analysis workflow:
            </p>
            <div className="grid md:grid-cols-4 gap-4">
              <Link href="/tools/audio-key-detector" className="bg-white rounded-xl p-5 text-center shadow-sm hover:shadow-md transition-shadow group">
                <div className="w-10 h-10 bg-gray-100 group-hover:bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3 transition-colors">
                  <span className="text-gray-600 group-hover:text-orange-600 font-bold text-sm">1</span>
                </div>
                <h3 className="font-semibold mb-1 text-sm">Key Detector</h3>
                <p className="text-xs text-gray-500">Find the key</p>
              </Link>
              <Link href="/tools/bpm-finder" className="bg-white rounded-xl p-5 text-center shadow-sm hover:shadow-md transition-shadow group">
                <div className="w-10 h-10 bg-gray-100 group-hover:bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 transition-colors">
                  <span className="text-gray-600 group-hover:text-blue-600 font-bold text-sm">2</span>
                </div>
                <h3 className="font-semibold mb-1 text-sm">BPM Finder</h3>
                <p className="text-xs text-gray-500">Find the tempo</p>
              </Link>
              <div className="bg-white rounded-xl p-5 text-center shadow-sm border-2 border-purple-200">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-purple-600 font-bold text-sm">3</span>
                </div>
                <h3 className="font-semibold mb-1 text-sm text-purple-700">Chord Finder</h3>
                <p className="text-xs text-purple-600">You are here</p>
              </div>
              <Link href="/tools/audio-to-midi" className="bg-white rounded-xl p-5 text-center shadow-sm hover:shadow-md transition-shadow group">
                <div className="w-10 h-10 bg-gray-100 group-hover:bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 transition-colors">
                  <span className="text-gray-600 group-hover:text-green-600 font-bold text-sm">4</span>
                </div>
                <h3 className="font-semibold mb-1 text-sm">Audio to MIDI</h3>
                <p className="text-xs text-gray-500">Get all notes</p>
              </Link>
            </div>
          </div>
        </section>

        <section className="py-12 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">How It Works</h2>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-purple-600 font-bold">1</span>
                </div>
                <h3 className="font-semibold mb-2">Upload</h3>
                <p className="text-sm text-gray-600">Drop your audio file</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-purple-600 font-bold">2</span>
                </div>
                <h3 className="font-semibold mb-2">Transcribe</h3>
                <p className="text-sm text-gray-600">Extract note events</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-purple-600 font-bold">3</span>
                </div>
                <h3 className="font-semibold mb-2">Analyze</h3>
                <p className="text-sm text-gray-600">Match chord templates</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-purple-600 font-bold">4</span>
                </div>
                <h3 className="font-semibold mb-2">Export</h3>
                <p className="text-sm text-gray-600">Get MIDI + timeline</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 px-4 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Features</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <Target className="w-8 h-8 text-purple-500 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">13 Chord Types</h3>
                <p className="text-sm text-gray-600">Major, minor, seventh, suspended, diminished, augmented</p>
              </div>
              <div className="text-center">
                <Zap className="w-8 h-8 text-blue-500 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Confidence Scores</h3>
                <p className="text-sm text-gray-600">Know how certain each chord detection is</p>
              </div>
              <div className="text-center">
                <Music className="w-8 h-8 text-green-500 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">MIDI Export</h3>
                <p className="text-sm text-gray-600">Block chords ready for your DAW</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Best Use Cases</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg p-5 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-2">Songwriters & Producers</h3>
                <p className="text-sm text-gray-600">Figure out the chord progression of a reference track to understand its structure and recreate the vibe in your own production.</p>
              </div>
              <div className="bg-white rounded-lg p-5 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-2">Music Education</h3>
                <p className="text-sm text-gray-600">Analyze songs to learn common chord progressions, understand harmonic movement, and develop your ear training.</p>
              </div>
              <div className="bg-white rounded-lg p-5 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-2">Remix & Sample Pipelines</h3>
                <p className="text-sm text-gray-600">Extract the harmony from samples so you can create complementary parts or transpose them to fit your project.</p>
              </div>
              <div className="bg-white rounded-lg p-5 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-2">Cover Artists</h3>
                <p className="text-sm text-gray-600">Get the chord chart for any song without hunting for (often inaccurate) tabs online.</p>
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
                  <li><strong>Full mixes are harder.</strong> Bass, melody, and pads competing can confuse chord inference.</li>
                  <li><strong>Inversions aren't labeled.</strong> We detect the chord quality, not the bass note. No slash chords (yet).</li>
                  <li><strong>Very short clips = unstable results.</strong> Longer audio gives more reliable progressions.</li>
                  <li><strong>Drums reduce confidence.</strong> Percussive content has no pitch, so it can lower accuracy.</li>
                  <li><strong>Complex jazz harmony is best-effort.</strong> Extended chords and rapid changes are challenging for any detector.</li>
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
                  <summary className="px-6 py-4 cursor-pointer font-medium text-gray-900 hover:text-purple-600">
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
            <ExploreMoreTools currentTool="/tools/chord-progression-finder" />
          </div>
        </section>

        <footer className="py-8 px-4 border-t">
          <div className="max-w-4xl mx-auto text-center text-sm text-gray-500">
            <p className="mb-2">
              Chord detection uses machine learning transcription followed by template-based harmony analysis.
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
