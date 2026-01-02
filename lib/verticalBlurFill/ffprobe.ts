import { exec } from "child_process";
import { promisify } from "util";
import { VideoMeta } from "./types";

const execAsync = promisify(exec);

export async function probeVideo(inputPath: string): Promise<VideoMeta> {
  const cmd = `ffprobe -v quiet -print_format json -show_streams -show_format "${inputPath}"`;
  
  const { stdout } = await execAsync(cmd, { maxBuffer: 10 * 1024 * 1024 });
  const data = JSON.parse(stdout);
  
  const videoStream = data.streams?.find((s: any) => s.codec_type === "video");
  const audioStream = data.streams?.find((s: any) => s.codec_type === "audio");
  
  if (!videoStream) {
    throw new Error("No video stream found in input file");
  }

  const rotation = parseInt(videoStream.tags?.rotate || "0", 10) || 
    (videoStream.side_data_list?.find((s: any) => s.rotation)?.rotation || 0);
  
  let width = videoStream.width || 0;
  let height = videoStream.height || 0;
  
  if (Math.abs(rotation) === 90 || Math.abs(rotation) === 270) {
    [width, height] = [height, width];
  }

  let fps = 30;
  if (videoStream.r_frame_rate) {
    const [num, den] = videoStream.r_frame_rate.split("/").map(Number);
    if (den > 0) fps = Math.round(num / den);
  }

  const duration = parseFloat(data.format?.duration || videoStream.duration || "0");

  return {
    width,
    height,
    rotation: Math.abs(rotation),
    has_audio: !!audioStream,
    duration,
    fps,
  };
}
