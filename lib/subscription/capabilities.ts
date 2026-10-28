import { query } from "@/lib/db";
import { PUBLIC_CLOUD_IDS } from "@/lib/types/cloudEntitlements";

export type SubscriptionCapabilities = {
  canSaveWorkspace: boolean;
  canAccessAllContent: boolean;
};

export async function hasGlobalSubscription(userId: number): Promise<boolean> {
  const requiredCloudCount = PUBLIC_CLOUD_IDS.length;

  const { rows } = await query(
    `SELECT 1
     FROM cloud_entitlements
     WHERE user_id = $1
       AND stripe_subscription_id IS NOT NULL
       AND status IN ('active', 'trial')
       AND tier = 'pro'
       AND (current_period_end IS NULL OR current_period_end >= NOW())
     GROUP BY stripe_subscription_id
     HAVING COUNT(DISTINCT cloud_id) >= $2
     LIMIT 1`,
    [userId, requiredCloudCount]
  );

  return rows.length > 0;
}

export async function getSubscriptionCapabilitiesForUser(
  userId: number
): Promise<SubscriptionCapabilities> {
  const hasSubscription = await hasGlobalSubscription(userId);

  return {
    canSaveWorkspace: hasSubscription,
    canAccessAllContent: hasSubscription,
  };
}
