import { ClerkAuthComplete } from "@/components/auth/clerk-auth-complete";
import { safeAuthReturnPath, safeClaimProductId } from "@/lib/auth/clerkRedirect";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

export default async function AuthCompletePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const next = safeAuthReturnPath(params.next);
  const claimProductId = safeClaimProductId(params.claimProductId);

  return <ClerkAuthComplete next={next} claimProductId={claimProductId} />;
}
