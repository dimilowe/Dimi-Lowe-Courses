import ToolServerGate from "@/components/entitlements/ToolServerGate";
import VerticalBlurFillClient from "./VerticalBlurFillClient";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "VCM Vertical Blur Fill",
  applicationCategory: "MultimediaApplication",
  operatingSystem: "Web",
  description:
    "Automatically converts any video into a clean 9:16 vertical master by filling side bars with a blurred background layer.",
};

export default function VerticalBlurFillPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ToolServerGate slug="vertical-blur-fill">
        <VerticalBlurFillClient />
      </ToolServerGate>
    </>
  );
}
