import MonetizationBar from "@/components/MonetizationBar";
import CreatorStack from "@/components/CreatorStack";
import SaveUpgradeSection from "@/components/monetization/SaveUpgradeSection";

export default function ToolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="pb-14">
        {children}
        <div className="max-w-4xl mx-auto px-4">
          <CreatorStack />
        </div>
        <SaveUpgradeSection />
      </div>
      <MonetizationBar />
    </>
  );
}
