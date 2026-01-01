import ToolServerGate from "@/components/entitlements/ToolServerGate";
import VideoAssemblerClient from "./VideoAssemblerClient";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "VCM Video Assembler",
  applicationCategory: "MultimediaApplication",
  operatingSystem: "Web",
  description:
    "Render a slideshow video from extracted frames using a template pack from Music Video Parser. Automatically normalizes timing and creates optimized MP4 output.",
};

export default function VideoAssemblerPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ToolServerGate slug="video-assembler">
        <VideoAssemblerClient />
      </ToolServerGate>
    </>
  );
}
