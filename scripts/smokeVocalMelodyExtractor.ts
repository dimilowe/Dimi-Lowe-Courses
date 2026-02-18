type WavOptions = {
  durationSeconds: number;
  sampleRate: number;
  frequencyHz: number;
  gain?: number;
};

function createMonoPcmWav(options: WavOptions): ArrayBuffer {
  const sampleRate = Math.max(8_000, Math.floor(options.sampleRate));
  const channelCount = 1;
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const frameCount = Math.max(1, Math.floor(options.durationSeconds * sampleRate));
  const dataSize = frameCount * channelCount * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  const gain = Math.max(0, Math.min(1, options.gain ?? 0.25));

  const writeString = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i += 1) {
      view.setUint8(offset + i, value.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channelCount, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * channelCount * bytesPerSample, true);
  view.setUint16(32, channelCount * bytesPerSample, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  let offset = 44;
  const twoPiOverRate = (Math.PI * 2) / sampleRate;
  for (let i = 0; i < frameCount; i += 1) {
    const sample = Math.sin(i * twoPiOverRate * options.frequencyHz) * gain;
    const pcm = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
    view.setInt16(offset, Math.round(pcm), true);
    offset += 2;
  }

  return buffer;
}

function getArgValue(name: string): string | undefined {
  const prefix = `${name}=`;
  const token = process.argv.find((arg) => arg.startsWith(prefix));
  return token ? token.slice(prefix.length) : undefined;
}

function toAbsoluteUrl(baseUrl: string, maybeRelative: string): string {
  if (/^https?:\/\//i.test(maybeRelative)) return maybeRelative;
  return `${baseUrl.replace(/\/+$/, '')}/${maybeRelative.replace(/^\/+/, '')}`;
}

async function run(): Promise<void> {
  const baseUrl =
    getArgValue('--url') ||
    process.env.SMOKE_BASE_URL ||
    'http://localhost:3000';
  const endpoint = `${baseUrl.replace(/\/+$/, '')}/api/vocal-melody-extractor`;
  const filename =
    getArgValue('--filename') ||
    'smoke vocal (take#1) 🚀.wav';

  const audio = createMonoPcmWav({
    durationSeconds: 3,
    sampleRate: 16_000,
    frequencyHz: 220,
    gain: 0.28
  });

  const formData = new FormData();
  formData.append('file', new File([audio], filename, { type: 'audio/wav' }));

  const startedAt = Date.now();
  const response = await fetch(endpoint, {
    method: 'POST',
    body: formData,
    headers: {
      'user-agent': 'VCM-Smoke-Check/1.0',
    },
  });
  const elapsedMs = Date.now() - startedAt;

  const raw = await response.text();
  let data: Record<string, unknown> = {};
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error(`Smoke failed: non-JSON response (${response.status}) from ${endpoint}: ${raw.slice(0, 300)}`);
  }

  if (!response.ok) {
    throw new Error(
      `Smoke failed: HTTP ${response.status} ${response.statusText} from ${endpoint}. Body: ${raw.slice(0, 300)}`
    );
  }

  const midiUrl = typeof data.midiUrl === 'string' ? data.midiUrl : '';
  const notesUrl = typeof data.notesUrl === 'string' ? data.notesUrl : '';
  const pitchUrl = typeof data.pitchUrl === 'string' ? data.pitchUrl : '';
  const wavUrl = typeof data.wavUrl === 'string' ? data.wavUrl : '';
  const urls = [midiUrl, notesUrl, pitchUrl, wavUrl].filter(Boolean);
  if (urls.length !== 4) {
    throw new Error(`Smoke failed: missing output URLs in API response: ${raw.slice(0, 300)}`);
  }

  for (const url of urls) {
    const absolute = toAbsoluteUrl(baseUrl, url);
    const fileRes = await fetch(absolute);
    if (!fileRes.ok) {
      throw new Error(`Smoke failed: output URL returned HTTP ${fileRes.status}: ${absolute}`);
    }
    const bytes = await fileRes.arrayBuffer();
    if (bytes.byteLength < 16) {
      throw new Error(`Smoke failed: output URL returned tiny payload (${bytes.byteLength} bytes): ${absolute}`);
    }
  }

  const noteCount = (data.meta as { noteCount?: number } | undefined)?.noteCount ?? 'n/a';
  console.log(
    `Vocal-melody smoke passed: HTTP ${response.status}, outputs=4, noteCount=${noteCount}, elapsed=${elapsedMs}ms`
  );
}

run().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});

export {};
