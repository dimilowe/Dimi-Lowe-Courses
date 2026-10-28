import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { UserSessionData, userSessionOptions } from "@/lib/user-session";
import { SignupForm } from "@/components/SignupForm";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Create Account | VCM Suite",
  robots: { index: false, follow: false },
};

export default async function SignupPage() {
  const session = await getIronSession<UserSessionData>(await cookies(), userSessionOptions);

  if (session.isLoggedIn && session.userId) {
    redirect("/dashboard");
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-2">Create Account</h1>
        <p className="text-xl text-muted-foreground">
          Sign up to access your products, courses, and subscription benefits.
        </p>
      </div>
      <SignupForm />
      <div className="mt-6 text-center">
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <a href="/login" className="text-orange-600 hover:text-orange-700 font-medium">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
