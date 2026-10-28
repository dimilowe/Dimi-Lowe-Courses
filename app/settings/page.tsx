import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { UserSessionData, userSessionOptions } from "@/lib/user-session";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClerkAccountSecurity } from "@/components/auth/clerk-account-security";
import { SubscriptionLinkForm } from "@/components/SubscriptionLinkForm";
import { BillingPortalButton } from "@/components/BillingPortalButton";
import { query } from "@/lib/db";
import type { Metadata } from "next";

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: "Account Settings | VCM Suite",
  robots: { index: false, follow: false },
};

export default async function SettingsPage() {
  const session = await getIronSession<UserSessionData>(await cookies(), userSessionOptions);
  
  if (!session.isLoggedIn || !session.userId) {
    redirect('/login');
  }

  // Get user info
  const userResult = await query(
    "SELECT email, created_at FROM users WHERE id = $1",
    [session.userId]
  );

  const user = userResult.rows[0] as { email: string; created_at: Date };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Account Settings</h1>
        <p className="text-xl text-muted-foreground">
          Manage your account information and security
        </p>
      </div>

      <div className="grid gap-6 max-w-2xl">
        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Your account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Member Since</label>
              <p className="text-lg">{new Date(user.created_at).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sign-in & Security</CardTitle>
            <CardDescription>Manage your email, password, and sign-in methods securely with Clerk.</CardDescription>
          </CardHeader>
          <CardContent>
            <ClerkAccountSecurity />
          </CardContent>
        </Card>

        {/* Subscription Billing */}
        <Card>
          <CardHeader>
            <CardTitle>Subscription & Billing</CardTitle>
            <CardDescription>
              Manage your membership securely through Stripe.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BillingPortalButton />
          </CardContent>
        </Card>

        {/* Subscription Linking */}
        <Card>
          <CardHeader>
            <CardTitle>Paid with a different email?</CardTitle>
            <CardDescription>
              Link your existing global subscription to this account using your Stripe checkout session ID.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SubscriptionLinkForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
