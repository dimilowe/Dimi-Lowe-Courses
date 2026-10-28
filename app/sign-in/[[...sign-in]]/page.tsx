import { SignIn } from "@clerk/nextjs";
import { buildAuthCompletionUrl, buildAuthFlowUrl, safeAuthReturnPath, safeClaimProductId } from "@/lib/auth/clerkRedirect";

export const dynamic = "force-dynamic";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const next = safeAuthReturnPath(params.next ?? params.redirect ?? params.redirect_url);
  const claimProductId = safeClaimProductId(params.claimProductId);

  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-gray-50 px-4 py-12">
      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl={buildAuthFlowUrl("/sign-up", next, claimProductId)}
        forceRedirectUrl={buildAuthCompletionUrl(next, claimProductId)}
      />
    </main>
  );
}
