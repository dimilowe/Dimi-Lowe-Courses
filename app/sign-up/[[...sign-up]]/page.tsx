import { SignUp } from "@clerk/nextjs";
import { buildAuthCompletionUrl, buildAuthFlowUrl, safeAuthReturnPath, safeClaimProductId } from "@/lib/auth/clerkRedirect";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Create Account | Dimi Lowe Courses",
  robots: { index: false, follow: false },
};

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const next = safeAuthReturnPath(params.next ?? params.redirect ?? params.redirect_url);
  const claimProductId = safeClaimProductId(params.claimProductId);

  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-gray-50 px-4 py-12">
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl={buildAuthFlowUrl("/sign-in", next, claimProductId)}
        forceRedirectUrl={buildAuthCompletionUrl(next, claimProductId)}
      />
    </main>
  );
}
