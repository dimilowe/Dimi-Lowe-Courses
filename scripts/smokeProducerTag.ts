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
  view.setUint16(20, 1, true); // PCM
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

async function run(): Promise<void> {
  const baseUrl =
    getArgValue('--url') ||
    process.env.SMOKE_BASE_URL ||
    'http://localhost:5001';
  const endpoint = `${baseUrl.replace(/\/+$/, '')}/api/producer-tag/mix-preview`;

  const mainAudio = createMonoPcmWav({
    durationSeconds: 4,
    sampleRate: 16_000,
    frequencyHz: 220,
    gain: 0.25,
  });
  const tagAudio = createMonoPcmWav({
    durationSeconds: 1,
    sampleRate: 16_000,
    frequencyHz: 880,
    gain: 0.35,
  });

  const formData = new FormData();
  formData.append('file', new File([mainAudio], 'smoke-main.wav', { type: 'audio/wav' }));
  formData.append('mode', 'upload');
  formData.append('tagFile', new File([tagAudio], 'smoke-tag.wav', { type: 'audio/wav' }));
  formData.append('intervalSeconds', '15');
  formData.append('tagVolumeDb', '-3');
  formData.append('sourceVolumeDb', '0');

  const startedAt = Date.now();
  const response = await fetch(endpoint, {
    method: 'POST',
    body: formData,
    headers: {
      'user-agent': 'VCM-Smoke-Check/1.0',
    },
  });
  const elapsedMs = Date.now() - startedAt;

  const responseBytes = await response.arrayBuffer();
  const contentType = (response.headers.get('content-type') || '').toLowerCase();

  if (!response.ok) {
    const raw = Buffer.from(responseBytes).toString('utf8').slice(0, 300);
    throw new Error(
      `Smoke failed: HTTP ${response.status} ${response.statusText} from ${endpoint}. Body: ${raw || '<empty>'}`
    );
  }

  if (!contentType.includes('audio/')) {
    throw new Error(
      `Smoke failed: expected audio response but got content-type "${contentType || '<missing>'}".`
    );
  }

  if (responseBytes.byteLength < 1_024) {
    throw new Error(
      `Smoke failed: response audio too small (${responseBytes.byteLength} bytes).`
    );
  }

  console.log(
    `Producer-tag smoke passed: HTTP ${response.status}, ${responseBytes.byteLength} bytes, ${contentType}, ${elapsedMs}ms`
  );
}

run().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});

export {};
