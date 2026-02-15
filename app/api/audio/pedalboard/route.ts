import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 200 * 1024 * 1024;
const ALLOWED_EXTS = new Set([".wav", ".mp3", ".m4a", ".aac", ".ogg", ".flac", ".webm"]);
const PROCESSING_TIMEOUT_MS = 180000;

function getPythonCandidates() {
  return ["python3.11", "python3", "python"];
}

function cleanupDirectory(dirPath: string | null) {
  if (!dirPath) return;
  try {
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true });
    }
  } catch {}
}

async function runWorker(inputPath: string, outputPath: string, kind: string, settingsJson: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const workerPath = path.join(process.cwd(), "python", "pedalboard_worker.py");
  const pythonBins = getPythonCandidates();

  let lastError = "Pedalboard worker failed.";

  for (const pythonBin of pythonBins) {
    const result = await new Promise<{ ok: true } | { ok: false; error: string }>((resolve) => {
      const proc = spawn(
        pythonBin,
        [workerPath, "--input", inputPath, "--output", outputPath, "--kind", kind, "--settings", settingsJson],
        { stdio: ["ignore", "pipe", "pipe"] }
      );

      let stderr = "";
      const timeout = setTimeout(() => {
        try {
          proc.kill("SIGTERM");
        } catch {}
      }, PROCESSING_TIMEOUT_MS);

      proc.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      proc.on("close", (code) => {
        clearTimeout(timeout);
        if (code === 0) {
          resolve({ ok: true });
          return;
        }

        const msg = stderr.trim() || `${pythonBin} exited with code ${code}`;
        resolve({ ok: false, error: msg.slice(0, 1200) });
      });

      proc.on("error", (err) => {
        clearTimeout(timeout);
        resolve({ ok: false, error: `${pythonBin}: ${err.message}` });
      });
    });

    if (result.ok) {
      return result;
    }
    lastError = result.error;
  }

  return { ok: false, error: lastError };
}

export async function POST(request: NextRequest) {
  let tempDir: string | null = null;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const kind = String(formData.get("kind") || "").trim();
    const settings = String(formData.get("settings") || "{}");

    if (!file) {
      return NextResponse.json({ error: "No audio file uploaded." }, { status: 400 });
    }
    if (!kind) {
      return NextResponse.json({ error: "Missing effect kind." }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File too large. Max 200MB." }, { status: 400 });
    }

    const ext = path.extname(file.name).toLowerCase();
    if (!ALLOWED_EXTS.has(ext)) {
      return NextResponse.json({ error: "Unsupported file type." }, { status: 400 });
    }

    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "vcm-pedalboard-"));
    const inPath = path.join(tempDir, `input${ext}`);
    const outPath = path.join(tempDir, "output.wav");

    const bytes = await file.arrayBuffer();
    fs.writeFileSync(inPath, Buffer.from(bytes));

    const worker = await runWorker(inPath, outPath, kind, settings);
    if (!worker.ok) {
      return NextResponse.json(
        {
          error:
            "Server Pedalboard processing failed. Install python deps (`pip install -r python/requirements.txt`) and ensure `python3.11`/`python3` is available.",
          detail: worker.error,
        },
        { status: 500 }
      );
    }

    if (!fs.existsSync(outPath)) {
      return NextResponse.json({ error: "Worker completed but no output file was generated." }, { status: 500 });
    }

    const out = fs.readFileSync(outPath);
    return new NextResponse(out, {
      status: 200,
      headers: {
        "Content-Type": "audio/wav",
        "Content-Disposition": `attachment; filename="processed.wav"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Pedalboard API error:", error);
    return NextResponse.json({ error: "Audio processing failed." }, { status: 500 });
  } finally {
    cleanupDirectory(tempDir);
  }
}
