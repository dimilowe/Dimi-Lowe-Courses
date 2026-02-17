import { Suspense } from "react";
import ToolsLayoutClient from "./ToolsLayoutClient";

export default function ToolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div className="pb-14">{children}</div>}>
      <ToolsLayoutClient>{children}</ToolsLayoutClient>
    </Suspense>
  );
}
