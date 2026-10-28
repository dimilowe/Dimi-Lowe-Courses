import { redirect } from "next/navigation";
import { buildAuthFlowUrl, safeAuthReturnPath, safeClaimProductId } from "@/lib/auth/clerkRedirect";

export const dynamic = 'force-dynamic';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  redirect(
    buildAuthFlowUrl(
      "/sign-in",
      safeAuthReturnPath(params.next ?? params.redirect ?? params.redirect_url),
      safeClaimProductId(params.claimProductId)
    )
  );
}
