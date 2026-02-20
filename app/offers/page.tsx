import { OfferFlowClient } from "@/components/offers/OfferFlowClient";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Special Offer | VCM Suite",
  robots: { index: false, follow: false },
};

export default async function OffersPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const params = await searchParams;
  return <OfferFlowClient sessionId={params.session_id} />;
}
