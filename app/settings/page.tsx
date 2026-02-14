import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { UserSessionData, userSessionOptions } from "@/lib/user-session";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PasswordChangeForm } from "@/components/PasswordChangeForm";
import { EmailChangeForm } from "@/components/EmailChangeForm";
import { SubscriptionLinkForm } from "@/components/SubscriptionLinkForm";
import { query } from "@/lib/db";

export const dynamic = 'force-dynamic';

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

  const user = userResult.rows[0];

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

        {/* Email Update */}
        <Card>
          <CardHeader>
            <CardTitle>Change Email Address</CardTitle>
            <CardDescription>Update the email address associated with your account</CardDescription>
          </CardHeader>
          <CardContent>
            <EmailChangeForm currentEmail={user.email} />
          </CardContent>
        </Card>

        {/* Password Change */}
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>Update your password to keep your account secure</CardDescription>
          </CardHeader>
          <CardContent>
            <PasswordChangeForm />
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
