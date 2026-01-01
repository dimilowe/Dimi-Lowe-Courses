import ToolServerGate from "@/components/entitlements/ToolServerGate";
import MotionCompilerClient from "./MotionCompilerClient";

export const metadata = {
  title: "VCM Motion Compiler | VCM Suite",
  description: "Compile identity-locked, scene-consistent, multi-shot AI video with boundary contracts, validation, and stitching."
};

export default function Page() {
  return (
    <ToolServerGate slug="vcm-motion-compiler">
      <MotionCompilerClient />
    </ToolServerGate>
  );
}
