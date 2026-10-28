"use client";

import { useClerk, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function ClerkAccountSecurity() {
  const { openUserProfile } = useClerk();
  const { isLoaded, isSignedIn } = useUser();

  if (!isLoaded) return <p className="text-sm text-gray-500">Loading account security…</p>;
  if (!isSignedIn) {
    return <Link className="font-medium text-orange-600" href="/sign-in?next=%2Fsettings">Sign in with Clerk to manage account security</Link>;
  }
  return <Button onClick={() => openUserProfile()}>Manage sign-in and security</Button>;
}
