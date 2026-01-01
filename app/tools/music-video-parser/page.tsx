import ToolServerGate from "@/components/entitlements/ToolServerGate";
import MusicVideoParserClient from "./MusicVideoParserClient";

export default function MusicVideoParserPage() {
  return (
    <ToolServerGate slug="music-video-parser">
      <MusicVideoParserClient />
    </ToolServerGate>
  );
}
