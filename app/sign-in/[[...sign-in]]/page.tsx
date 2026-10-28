import { SignIn } from "@clerk/nextjs";
import { buildAuthCompletionUrl, buildAuthFlowUrl, safeAuthReturnPath, safeClaimProductId } from "@/lib/auth/clerkRedirect";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Sign In | Dimi Lowe Courses",
  robots: { index: false, follow: false },
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const next = safeAuthReturnPath(params.next ?? params.redirect ?? params.redirect_url);
  const claimProductId = safeClaimProductId(params.claimProductId);

  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center gap-6 bg-gray-50 px-4 py-12">
      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl={buildAuthFlowUrl("/sign-up", next, claimProductId)}
        forceRedirectUrl={buildAuthCompletionUrl(next, claimProductId)}
      />
      <p className="max-w-sm text-center text-xs text-gray-500">
        Existing customer? Create a new sign-in using the same email you used for your purchases.
      </p>
    </main>
  );
}
