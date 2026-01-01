import { spawn } from "child_process";
import { FRAME_WIDTH, SCENE_THRESHOLD } from "./constants";

export interface ProbeMetadata {
  duration_sec: number;
  fps: number;
  width: number;
  height: number;
}

function runCommand(
  cmd: string,
  args: string[]
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args);
    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    proc.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    proc.on("close", (code) => {
      if (code === 0 || cmd === "ffmpeg") {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`${cmd} exited with code ${code}: ${stderr}`));
      }
    });

    proc.on("error", reject);
  });
}

export async function ffprobeMetadata(inputPath: string): Promise<ProbeMetadata> {
  const args = [
    "-v", "quiet",
    "-print_format", "json",
    "-show_format",
    "-show_streams",
    inputPath
  ];

  const { stdout } = await runCommand("ffprobe", args);
  const data = JSON.parse(stdout);

  const videoStream = data.streams?.find(
    (s: any) => s.codec_type === "video"
  );

  if (!videoStream) {
    throw new Error("No video stream found");
  }

  const duration_sec = parseFloat(data.format?.duration || videoStream.duration || "0");
  
  let fps = 30;
  if (videoStream.r_frame_rate) {
    const [num, den] = videoStream.r_frame_rate.split("/").map(Number);
    if (den && den > 0) {
      fps = num / den;
    }
  }

  return {
    duration_sec,
    fps,
    width: videoStream.width || 1920,
    height: videoStream.height || 1080
  };
}

export async function detectCuts(
  inputPath: string,
  sceneThreshold: number = SCENE_THRESHOLD
): Promise<number[]> {
  const args = [
    "-i", inputPath,
    "-filter_complex", `select='gt(scene,${sceneThreshold})',showinfo`,
    "-f", "null",
    "-"
  ];

  const { stderr } = await runCommand("ffmpeg", args);

  const cuts: number[] = [];
  const regex = /pts_time:(\d+\.?\d*)/g;
  let match;

  while ((match = regex.exec(stderr)) !== null) {
    const time = parseFloat(match[1]);
    if (!isNaN(time)) {
      cuts.push(time);
    }
  }

  return cuts;
}

export async function extractFrame(
  inputPath: string,
  tSec: number,
  outPath: string
): Promise<void> {
  const args = [
    "-ss", tSec.toString(),
    "-i", inputPath,
    "-frames:v", "1",
    "-vf", `scale=${FRAME_WIDTH}:-1`,
    "-y",
    outPath
  ];

  await runCommand("ffmpeg", args);
}
