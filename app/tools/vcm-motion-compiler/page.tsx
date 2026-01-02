import ToolServerGate from "@/components/entitlements/ToolServerGate";
import MotionCompilerClient from "./MotionCompilerClient";

export default function MotionCompilerPage() {
  return (
    <ToolServerGate slug="vcm-motion-compiler">
      <MotionCompilerClient />
    </ToolServerGate>
  );
}
