function getArgValue(name: string): string | undefined {
  const prefix = `${name}=`;
  const token = process.argv.find((arg) => arg.startsWith(prefix));
  return token ? token.slice(prefix.length) : undefined;
}

function getBaseUrl(): string {
  return (
    getArgValue('--url') ||
    process.env.SMOKE_BASE_URL ||
    'https://vcmsuite.com'
  ).replace(/\/+$/, '');
}

function getChunkPaths(html: string): string[] {
  const matches = html.match(/\/_next\/static\/chunks\/[^"' ]+\.js/g) || [];
  return Array.from(new Set(matches));
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, { headers: { 'user-agent': 'VCM-Deploy-Check/1.0' } });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} from ${url}`);
  }
  return res.text();
}

async function run(): Promise<void> {
  const baseUrl = getBaseUrl();
  const pageUrl = `${baseUrl}/tools/vocal-melody-extractor`;
  const html = await fetchText(pageUrl);

  const chunks = getChunkPaths(html);
  if (chunks.length === 0) {
    throw new Error(`No Next.js chunk paths found in ${pageUrl}`);
  }

  const oldMarker = 'Your filename has unsupported characters. Rename the file (letters/numbers only) and try again.';
  const newMarkers = [
    'Upload failed due to a Safari request-format issue.',
    'forceUpload',
  ];

  let chunkWithOldMarker = '';
  let chunkWithNewMarkers = '';

  for (const chunk of chunks) {
    const js = await fetchText(`${baseUrl}${chunk}`);
    const hasOld = js.includes(oldMarker);
    const hasNew = newMarkers.every((marker) => js.includes(marker));

    if (!chunkWithOldMarker && hasOld) chunkWithOldMarker = chunk;
    if (!chunkWithNewMarkers && hasNew) chunkWithNewMarkers = chunk;
  }

  console.log(`Checked ${chunks.length} chunks from ${pageUrl}`);
  console.log(`Old-marker chunk: ${chunkWithOldMarker || 'not found'}`);
  console.log(`New-marker chunk: ${chunkWithNewMarkers || 'not found'}`);

  if (chunkWithOldMarker && !chunkWithNewMarkers) {
    throw new Error('Deployment is serving the old vocal-melody client bundle.');
  }

  if (!chunkWithOldMarker && chunkWithNewMarkers) {
    console.log('Deployment is serving the new vocal-melody client bundle.');
    return;
  }

  if (chunkWithOldMarker && chunkWithNewMarkers) {
    throw new Error('Mixed markers detected across chunks. Likely cache inconsistency.');
  }

  throw new Error('Could not detect old/new markers in chunks.');
}

run().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});

export {};
