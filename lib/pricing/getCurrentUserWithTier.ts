import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { UserSessionData, userSessionOptions } from "@/lib/user-session";
import { query } from "@/lib/db";
import type { UserTier } from "./types";

export interface UserWithTier {
  id: string;
  email: string;
  subscription_tier: UserTier;
  isAdmin: boolean;
}

type UsersSchemaSupport = {
  hasIsAdmin: boolean;
  hasSubscriptionTier: boolean;
};

let usersSchemaSupportPromise: Promise<UsersSchemaSupport> | null = null;

async function getUsersSchemaSupport(): Promise<UsersSchemaSupport> {
  if (!usersSchemaSupportPromise) {
    usersSchemaSupportPromise = query(
      `SELECT column_name
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'users'
         AND column_name IN ('is_admin', 'subscription_tier')`
    )
      .then((result) => {
        const columns = new Set(
          (result.rows as { column_name?: string }[])
            .map((row) => String(row.column_name || "").toLowerCase())
            .filter(Boolean)
        );
        return {
          hasIsAdmin: columns.has("is_admin"),
          hasSubscriptionTier: columns.has("subscription_tier"),
        };
      })
      .catch((error) => {
        usersSchemaSupportPromise = null;
        throw error;
      });
  }

  return usersSchemaSupportPromise;
}

export async function getCurrentUserWithTier(): Promise<UserWithTier | null> {
  try {
    const session = await getIronSession<UserSessionData>(await cookies(), userSessionOptions);
    
    if (!session.isLoggedIn || !session.userId) {
      return null;
    }

    const userSchema = await getUsersSchemaSupport();
    const selectedColumns = [
      "id",
      "email",
      ...(userSchema.hasSubscriptionTier ? ["subscription_tier"] : []),
      ...(userSchema.hasIsAdmin ? ["is_admin"] : []),
    ].join(", ");

    const result = await query(
      `SELECT ${selectedColumns} FROM users WHERE id = $1`,
      [session.userId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const user = result.rows[0] as { id: string; email: string; subscription_tier?: UserTier; is_admin?: boolean };
    return {
      id: user.id,
      email: user.email,
      subscription_tier: userSchema.hasSubscriptionTier
        ? (user.subscription_tier || "free")
        : "free",
      isAdmin: userSchema.hasIsAdmin ? Boolean(user.is_admin) : false,
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

export function createAIGatingResponse(): Response {
  return new Response(
    JSON.stringify({ 
      error: 'AI tools require a Pro subscription.',
      upgradeRequired: true,
      requiredTier: 'pro',
    }),
    { 
      status: 403, 
      headers: { 'Content-Type': 'application/json' } 
    }
  );
}

export function createLoginRequiredResponse(): Response {
  return new Response(
    JSON.stringify({ 
      error: 'Please log in to use this feature.',
      loginRequired: true,
    }),
    { 
      status: 401, 
      headers: { 'Content-Type': 'application/json' } 
    }
  );
}
