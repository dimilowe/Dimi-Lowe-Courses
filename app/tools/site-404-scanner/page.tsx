import ToolServerGate from "@/components/entitlements/ToolServerGate";
import Site404ScannerClient from "./Site404ScannerClient";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "VCM Site 404 & Broken Link Scanner",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Web",
  description:
    "Scan a site for 404s, soft 404s, redirect problems, and broken links—then pinpoint the exact pages causing each issue.",
};

export default function Site404ScannerPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ToolServerGate slug="site-404-scanner">
        <Site404ScannerClient />
      </ToolServerGate>
    </>
  );
}
