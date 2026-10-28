import { redirect } from "next/navigation";
import { buildAuthFlowUrl, safeAuthReturnPath, safeClaimProductId } from "@/lib/auth/clerkRedirect";

export const dynamic = "force-dynamic";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  redirect(
    buildAuthFlowUrl(
      "/sign-up",
      safeAuthReturnPath(params.next ?? params.redirect ?? params.redirect_url),
      safeClaimProductId(params.claimProductId)
    )
  );
}
