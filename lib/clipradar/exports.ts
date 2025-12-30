import { ClipPeak } from "./types";

export function formatTimeMMSS(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function formatTimeHHMMSSmmm(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}.${ms.toString().padStart(3, "0")}`;
}

export function generateCsv(peaks: ClipPeak[]): string {
  const header = "rank,start,end,duration,title,caption,score,category,reasons";
  const rows = peaks.map(peak => {
    const window = peak.windows.standard;
    const duration = Math.round((window.end - window.start) * 100) / 100;
    const title = peak.titles[0] || "";
    const caption = peak.captions[0] || "";
    const reasons = peak.reasons.join("; ");
    return `${peak.rank},${window.start},${window.end},${duration},"${title}","${caption}",${peak.score},"${peak.category}","${reasons}"`;
  });
  return [header, ...rows].join("\n");
}

export function generateYoutubeTimestamps(peaks: ClipPeak[]): string {
  return peaks.map(peak => {
    const time = formatTimeMMSS(peak.windows.standard.start);
    const title = peak.titles[0] || `Clip #${peak.rank}`;
    return `${time} - ${title}`;
  }).join("\n");
}

export function generateMarkersCsv(peaks: ClipPeak[]): string {
  const header = "name,description,in,out";
  const rows = peaks.map(peak => {
    const window = peak.windows.standard;
    const name = `Clip ${peak.rank}`;
    const description = `Score: ${peak.score} | ${peak.category} | ${peak.reasons.slice(0, 2).join(", ")}`;
    const inTime = formatTimeHHMMSSmmm(window.start);
    const outTime = formatTimeHHMMSSmmm(window.end);
    return `"${name}","${description}",${inTime},${outTime}`;
  });
  return [header, ...rows].join("\n");
}

export function generateExports(peaks: ClipPeak[]): {
  csv: string;
  youtubeTimestamps: string;
  markersCsv: string;
} {
  return {
    csv: generateCsv(peaks),
    youtubeTimestamps: generateYoutubeTimestamps(peaks),
    markersCsv: generateMarkersCsv(peaks)
  };
}
