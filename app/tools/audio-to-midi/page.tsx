import type { Metadata } from "next";
import { Music, Mic, Guitar, Piano, Zap, Shield, Clock, FileAudio, Download, HelpCircle, CheckCircle, XCircle } from "lucide-react";
import AudioToMidiClient from "./AudioToMidiClient";
import ExploreMoreTools from "@/components/ExploreMoreTools";

export const metadata: Metadata = {
  title: "Free Audio to MIDI Converter | MP3 to MIDI Online - VCM Suite",
  description: "Convert audio files to MIDI for free. Upload MP3, WAV, or any audio and get MIDI transcription with pitch bend. Works for vocals, guitar, piano.",
  keywords: [
    "audio to midi",
    "mp3 to midi",
    "wav to midi",
    "vocal to midi",
    "guitar to midi",
    "piano to midi",
    "music transcription",
    "free midi converter",
    "polyphonic transcription",
    "pitch to midi",
    "ai midi transcription",
    "audio transcription",
    "midi file creator",
    "online midi converter"
  ],
  openGraph: {
    title: "Free Audio to MIDI Converter - VCM Suite",
    description: "Convert any audio to MIDI with pitch bend detection. Free online tool for vocals, guitar, piano transcription.",
    type: "website"
  }
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      "name": "VCM Audio to MIDI Converter",
      "applicationCategory": "MultimediaApplication",
      "operatingSystem": "Web Browser",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      },
      "description": "Free online tool to convert audio files (MP3, WAV, M4A) to MIDI with pitch bend detection. Powered by machine learning.",
      "featureList": [
        "Audio to MIDI transcription",
        "Pitch bend detection",
        "Polyphonic support",
        "Multiple file formats",
        "Notes CSV export",
        "Sonified WAV preview"
      ]
    },
    {
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "What is audio to MIDI?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Audio to MIDI conversion analyzes an audio recording and detects the musical notes being played, then outputs them as MIDI data. MIDI is a digital format that represents notes, timing, and velocity - allowing you to edit, transpose, or re-instrument the music in any DAW."
          }
        },
        {
          "@type": "Question",
          "name": "Can I convert MP3 to MIDI for free?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes, this tool is completely free. Upload any MP3 file (up to 25MB, 10 minutes) and get MIDI output with pitch bend data, notes CSV, and a sonified WAV preview - all at no cost."
          }
        },
        {
          "@type": "Question",
          "name": "Does it work for vocals?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes, the tool works well for monophonic vocal recordings (solo singing). Results are best when the vocal is isolated without heavy reverb or background instruments. Complex harmonies or choir recordings may produce messier results."
          }
        },
        {
          "@type": "Question",
          "name": "Does it work for chords and polyphonic instruments?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes, the tool supports polyphonic transcription (multiple simultaneous notes). Piano chords, guitar strumming, and similar polyphonic material can be transcribed. However, accuracy decreases with more complex arrangements and overlapping frequencies."
          }
        },
        {
          "@type": "Question",
          "name": "Why is my MIDI messy or inaccurate?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Common reasons include: noisy audio, multiple instruments playing at once, heavy effects/reverb, very fast passages, or complex polyphony. For best results, use clean isolated recordings of a single instrument or voice."
          }
        },
        {
          "@type": "Question",
          "name": "What file types are supported?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "We support MP3, WAV, M4A, FLAC, and OGG formats. Maximum file size is 25MB and maximum duration is 10 minutes."
          }
        },
        {
          "@type": "Question",
          "name": "Is my audio stored after processing?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "No. Your uploaded audio is processed in memory and deleted immediately after conversion. Output files are temporarily available for download, then automatically removed. We don't store or analyze your audio beyond the conversion process."
          }
        },
        {
          "@type": "Question",
          "name": "How accurate is the transcription?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Accuracy varies depending on the audio quality and complexity. Solo instruments with clear recordings typically achieve 80-95% note accuracy. Polyphonic material and noisy recordings will be less accurate. Always expect to do some cleanup in your DAW."
          }
        },
        {
          "@type": "Question",
          "name": "How do I import MIDI into Ableton/FL Studio/Logic?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Simply drag and drop the downloaded .mid file onto a MIDI or instrument track in your DAW. In Ableton, drop it onto a track with an instrument. In FL Studio, open the Channel Rack and import. In Logic, drag to an arrangement track."
          }
        },
        {
          "@type": "Question",
          "name": "What's the best way to get cleaner MIDI results?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Use isolated recordings (vocals only, guitar only). Remove background noise and effects before conversion. Record at consistent volume. After conversion, use your DAW's quantize function to snap notes to grid, and delete obviously wrong notes manually."
          }
        },
        {
          "@type": "Question",
          "name": "Does it detect key signature or BPM?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "This tool focuses on note transcription and does not directly detect key signature or tempo. You can use our separate BPM Finder tool to detect tempo before importing your MIDI."
          }
        },
        {
          "@type": "Question",
          "name": "What is pitch bend detection?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Pitch bend detection captures the subtle pitch variations between notes - like vocal slides, guitar bends, or vibrato. This data is included in the MIDI output, making the transcription sound more natural when played back with appropriate instruments."
          }
        }
      ]
    }
  ]
};

export default function AudioToMidiPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      <main className="min-h-screen bg-gray-50">
        <section className="bg-gradient-to-b from-white to-gray-50 pt-16 pb-12">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <span className="inline-block px-4 py-1.5 bg-orange-100 text-orange-700 text-sm font-medium rounded-full mb-6">
              Free Online Audio to MIDI
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              VCM Audio to MIDI Converter
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Upload audio, get MIDI. Transcribe vocals, guitar, piano, or any melodic content into editable MIDI notes with pitch bend detection.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Free to use
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-green-500" />
                No account required
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Files not stored
              </span>
            </div>
          </div>
        </section>

        <section className="py-8 px-4">
          <AudioToMidiClient />
        </section>

        <section className="py-16 px-4 bg-white">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Convert Audio to MIDI for Free
            </h2>
            <p className="text-gray-600 mb-6">
              You have an idea in audio, but you need it in MIDI to edit, transpose, or re-instrument it. Traditional audio-to-MIDI conversion required expensive software or tedious manual transcription. This free tool uses machine learning to analyze your audio and extract the musical notes automatically.
            </p>
            <p className="text-gray-600 mb-6">
              Whether you&apos;re transcribing a vocal melody you hummed, capturing a guitar riff you played, or converting a piano recording into editable notes - this tool outputs standard MIDI files that work in any DAW including Ableton Live, FL Studio, Logic Pro, Pro Tools, Cubase, and more.
            </p>
            <p className="text-gray-600">
              The converter detects not just the notes, but also pitch bends (slides, vibrato, bends). This makes the MIDI output sound more natural and expressive when played back, especially for vocals and string instruments.
            </p>
          </div>
        </section>

        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
              How It Works
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileAudio className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">1. Upload Audio</h3>
                <p className="text-sm text-gray-600">
                  Drop any MP3, WAV, M4A, FLAC, or OGG file. Up to 25MB and 10 minutes.
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">2. AI Transcription</h3>
                <p className="text-sm text-gray-600">
                  Machine learning analyzes your audio frame-by-frame to detect notes and pitch variations.
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Download className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">3. Download MIDI</h3>
                <p className="text-sm text-gray-600">
                  Get your MIDI file plus notes CSV and a sonified WAV preview.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 px-4 bg-white">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
              Works With Any Instrument
            </h2>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="bg-gray-50 p-6 rounded-xl text-center">
                <Mic className="w-8 h-8 text-orange-500 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-1">Vocals</h3>
                <p className="text-sm text-gray-600">Solo singing, humming, melodies</p>
              </div>
              <div className="bg-gray-50 p-6 rounded-xl text-center">
                <Guitar className="w-8 h-8 text-orange-500 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-1">Guitar</h3>
                <p className="text-sm text-gray-600">Riffs, leads, chord progressions</p>
              </div>
              <div className="bg-gray-50 p-6 rounded-xl text-center">
                <Piano className="w-8 h-8 text-orange-500 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-1">Piano</h3>
                <p className="text-sm text-gray-600">Melodies, chords, accompaniment</p>
              </div>
              <div className="bg-gray-50 p-6 rounded-xl text-center">
                <Music className="w-8 h-8 text-orange-500 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-1">Other</h3>
                <p className="text-sm text-gray-600">Bass, synth, wind, strings</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
              Features
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Pitch Bend Detection</h3>
                  <p className="text-sm text-gray-600">
                    Captures vibrato, slides, and bends for natural-sounding MIDI output.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Polyphonic Support</h3>
                  <p className="text-sm text-gray-600">
                    Handles chords and multiple simultaneous notes, not just single melodies.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Notes CSV Export</h3>
                  <p className="text-sm text-gray-600">
                    Get raw note data (time, pitch, velocity) for custom analysis or scripting.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Sonified Preview</h3>
                  <p className="text-sm text-gray-600">
                    Download a WAV of the detected notes to hear the transcription before importing.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Privacy First</h3>
                  <p className="text-sm text-gray-600">
                    Audio is processed and immediately deleted. We don&apos;t store your files.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Fast Processing</h3>
                  <p className="text-sm text-gray-600">
                    Most files process in under 30 seconds. Up to 10 minutes of audio supported.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 px-4 bg-white">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Honest Limitations
            </h2>
            <p className="text-gray-600 mb-6">
              Audio-to-MIDI transcription is inherently imperfect. Here&apos;s what to expect:
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex gap-3 p-4 bg-amber-50 rounded-lg">
                <XCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Single instrument works best</p>
                  <p className="text-sm text-gray-600">Full mixes with drums, bass, and multiple instruments will produce messy results.</p>
                </div>
              </div>
              <div className="flex gap-3 p-4 bg-amber-50 rounded-lg">
                <XCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Vocals may need cleanup</p>
                  <p className="text-sm text-gray-600">Breaths, sibilants, and background noise can be detected as notes.</p>
                </div>
              </div>
              <div className="flex gap-3 p-4 bg-amber-50 rounded-lg">
                <XCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Polyphony is imperfect</p>
                  <p className="text-sm text-gray-600">Dense chords or fast arpeggios may have missing or extra notes.</p>
                </div>
              </div>
              <div className="flex gap-3 p-4 bg-amber-50 rounded-lg">
                <XCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">No rhythm/tempo detection</p>
                  <p className="text-sm text-gray-600">MIDI will be at raw timings. Use DAW quantize to snap to grid.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Alternatives Comparison
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Tool</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Price</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Platform</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Best For</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100 bg-orange-50">
                    <td className="py-3 px-4 font-medium text-gray-900">VCM Audio to MIDI</td>
                    <td className="py-3 px-4 text-gray-600">Free</td>
                    <td className="py-3 px-4 text-gray-600">Web browser</td>
                    <td className="py-3 px-4 text-gray-600">Quick conversions, any device</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-4 font-medium text-gray-900">Melodyne (Celemony)</td>
                    <td className="py-3 px-4 text-gray-600">$99-$699</td>
                    <td className="py-3 px-4 text-gray-600">Desktop plugin</td>
                    <td className="py-3 px-4 text-gray-600">Professional editing, pitch correction</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-4 font-medium text-gray-900">Ableton Live</td>
                    <td className="py-3 px-4 text-gray-600">$99-$749</td>
                    <td className="py-3 px-4 text-gray-600">Desktop DAW</td>
                    <td className="py-3 px-4 text-gray-600">DAW users, integrated workflow</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-gray-900">Logic Pro</td>
                    <td className="py-3 px-4 text-gray-600">$199</td>
                    <td className="py-3 px-4 text-gray-600">Mac only</td>
                    <td className="py-3 px-4 text-gray-600">Mac users, integrated workflow</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              This tool is web-based and free. Professional tools offer more accuracy and editing features. Results will vary - always expect some cleanup work.
            </p>
          </div>
        </section>

        <section className="py-16 px-4 bg-white">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-2">
              <HelpCircle className="w-6 h-6" />
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              <div className="border-b border-gray-200 pb-6">
                <h3 className="font-semibold text-gray-900 mb-2">What is audio to MIDI?</h3>
                <p className="text-gray-600">
                  Audio to MIDI conversion analyzes an audio recording and detects the musical notes being played, then outputs them as MIDI data. MIDI is a digital format that represents notes, timing, and velocity - allowing you to edit, transpose, or re-instrument the music in any DAW.
                </p>
              </div>
              <div className="border-b border-gray-200 pb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Can I convert MP3 to MIDI for free?</h3>
                <p className="text-gray-600">
                  Yes, this tool is completely free. Upload any MP3 file (up to 25MB, 10 minutes) and get MIDI output with pitch bend data, notes CSV, and a sonified WAV preview - all at no cost.
                </p>
              </div>
              <div className="border-b border-gray-200 pb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Does it work for vocals?</h3>
                <p className="text-gray-600">
                  Yes, the tool works well for monophonic vocal recordings (solo singing). Results are best when the vocal is isolated without heavy reverb or background instruments. Complex harmonies or choir recordings may produce messier results.
                </p>
              </div>
              <div className="border-b border-gray-200 pb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Does it work for chords and polyphonic instruments?</h3>
                <p className="text-gray-600">
                  Yes, the tool supports polyphonic transcription (multiple simultaneous notes). Piano chords, guitar strumming, and similar polyphonic material can be transcribed. However, accuracy decreases with more complex arrangements.
                </p>
              </div>
              <div className="border-b border-gray-200 pb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Why is my MIDI messy or inaccurate?</h3>
                <p className="text-gray-600">
                  Common reasons include: noisy audio, multiple instruments playing at once, heavy effects/reverb, very fast passages, or complex polyphony. For best results, use clean isolated recordings of a single instrument or voice.
                </p>
              </div>
              <div className="border-b border-gray-200 pb-6">
                <h3 className="font-semibold text-gray-900 mb-2">What file types are supported?</h3>
                <p className="text-gray-600">
                  We support MP3, WAV, M4A, FLAC, and OGG formats. Maximum file size is 25MB and maximum duration is 10 minutes.
                </p>
              </div>
              <div className="border-b border-gray-200 pb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Is my audio stored after processing?</h3>
                <p className="text-gray-600">
                  No. Your uploaded audio is processed in memory and deleted immediately after conversion. Output files are temporarily available for download, then automatically removed. We don&apos;t store or analyze your audio beyond the conversion process.
                </p>
              </div>
              <div className="border-b border-gray-200 pb-6">
                <h3 className="font-semibold text-gray-900 mb-2">How accurate is the transcription?</h3>
                <p className="text-gray-600">
                  Accuracy varies depending on the audio quality and complexity. Solo instruments with clear recordings typically achieve 80-95% note accuracy. Polyphonic material and noisy recordings will be less accurate. Always expect to do some cleanup in your DAW.
                </p>
              </div>
              <div className="border-b border-gray-200 pb-6">
                <h3 className="font-semibold text-gray-900 mb-2">How do I import MIDI into my DAW?</h3>
                <p className="text-gray-600">
                  Simply drag and drop the downloaded .mid file onto a MIDI or instrument track in your DAW. In Ableton, drop it onto a track with an instrument. In FL Studio, open the Channel Rack and import. In Logic, drag to an arrangement track.
                </p>
              </div>
              <div className="border-b border-gray-200 pb-6">
                <h3 className="font-semibold text-gray-900 mb-2">What&apos;s the best way to get cleaner MIDI results?</h3>
                <p className="text-gray-600">
                  Use isolated recordings (vocals only, guitar only). Remove background noise and effects before conversion. Record at consistent volume. After conversion, use your DAW&apos;s quantize function to snap notes to grid, and delete obviously wrong notes manually.
                </p>
              </div>
              <div className="border-b border-gray-200 pb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Does it detect key signature or BPM?</h3>
                <p className="text-gray-600">
                  This tool focuses on note transcription and does not directly detect key signature or tempo. You can use our separate BPM Finder tool to detect tempo before importing your MIDI.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">What is pitch bend detection?</h3>
                <p className="text-gray-600">
                  Pitch bend detection captures the subtle pitch variations between notes - like vocal slides, guitar bends, or vibrato. This data is included in the MIDI output, making the transcription sound more natural when played back.
                </p>
              </div>
            </div>
          </div>
        </section>

        <ExploreMoreTools currentTool="audio-to-midi" />
      </main>
    </>
  );
}
