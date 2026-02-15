import { Metadata } from "next";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { UserSessionData, userSessionOptions } from "@/lib/user-session";
import WorkstationsClient from "./workstations-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Workstations | VCM Suite",
  description: "Build and save your own modular workstation with the tools you use most.",
  robots: { index: false, follow: false },
};

export default async function WorkstationsPage() {
  const session = await getIronSession<UserSessionData>(await cookies(), userSessionOptions);
  const isLoggedIn = Boolean(session.isLoggedIn && session.userId);

  return <WorkstationsClient isLoggedIn={isLoggedIn} />;
}
