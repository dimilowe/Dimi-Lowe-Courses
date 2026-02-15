"use client";

import MonetizationBar from "@/components/MonetizationBar";
import CreatorStack from "@/components/CreatorStack";
import SaveUpgradeSection from "@/components/monetization/SaveUpgradeSection";
import { useSearchParams } from "next/navigation";

export default function ToolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const searchParams = useSearchParams();
  const isEmbedMode = searchParams?.get("embed") === "1";

  return (
    <>
      <div className="pb-14">
        {children}
        {!isEmbedMode && (
          <>
            <div className="max-w-4xl mx-auto px-4">
              <CreatorStack />
            </div>
            <SaveUpgradeSection />
          </>
        )}
      </div>
      {!isEmbedMode && <MonetizationBar />}
    </>
  );
}
