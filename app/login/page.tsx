import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { UserSessionData, userSessionOptions } from "@/lib/user-session";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/LoginForm";

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  const session = await getIronSession<UserSessionData>(await cookies(), userSessionOptions);
  
  // If already logged in, redirect to dashboard
  if (session.isLoggedIn && session.userId) {
    redirect('/dashboard');
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-2">Sign In</h1>
        <p className="text-xl text-muted-foreground">
          Access your account and purchased products
        </p>
      </div>
      <LoginForm />
      <div className="mt-6 text-center">
        <p className="text-sm text-muted-foreground">
          Don't have an account?{' '}
          <a href="/signup" className="text-orange-600 hover:text-orange-700 font-medium">
            Create one
          </a>
        </p>
      </div>
    </div>
  );
}
