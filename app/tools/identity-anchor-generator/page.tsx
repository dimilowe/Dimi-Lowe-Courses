import ToolServerGate from "@/components/entitlements/ToolServerGate";
import IdentityAnchorGeneratorClient from "./IdentityAnchorGeneratorClient";

export default function IdentityAnchorGeneratorPage() {
  return (
    <ToolServerGate slug="identity-anchor-generator">
      <IdentityAnchorGeneratorClient />
    </ToolServerGate>
  );
}
