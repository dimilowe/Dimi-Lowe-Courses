import { query } from "@/lib/db";
import { PUBLIC_CLOUD_IDS } from "@/lib/types/cloudEntitlements";

type PendingGlobalSubscription = {
  email: string;
  stripeSubscriptionId: string;
  stripeCustomerId: string | null;
  status: "active" | "past_due" | "canceled" | "trial";
  currentPeriodEnd: Date | null;
};

let pendingTableEnsured = false;

function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

async function ensurePendingTable() {
  if (pendingTableEnsured) return;

  await query(`
    CREATE TABLE IF NOT EXISTS pending_global_subscriptions (
      id BIGSERIAL PRIMARY KEY,
      email TEXT NOT NULL,
      stripe_subscription_id TEXT NOT NULL UNIQUE,
      stripe_customer_id TEXT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      current_period_end TIMESTAMPTZ NULL,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      claimed_by_user_id BIGINT NULL,
      claimed_at TIMESTAMPTZ NULL
    )
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_pending_global_subscriptions_email
    ON pending_global_subscriptions (LOWER(email))
  `);

  pendingTableEnsured = true;
}

export async function storePendingGlobalSubscription(
  payload: PendingGlobalSubscription
): Promise<void> {
  await ensurePendingTable();

  const email = normalizeEmail(payload.email);

  await query(
    `INSERT INTO pending_global_subscriptions
      (email, stripe_subscription_id, stripe_customer_id, status, current_period_end, metadata)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (stripe_subscription_id)
     DO UPDATE SET
       email = EXCLUDED.email,
       stripe_customer_id = EXCLUDED.stripe_customer_id,
       status = EXCLUDED.status,
       current_period_end = EXCLUDED.current_period_end,
       metadata = EXCLUDED.metadata`,
    [
      email,
      payload.stripeSubscriptionId,
      payload.stripeCustomerId,
      payload.status,
      payload.currentPeriodEnd,
      JSON.stringify({ type: "global", tier: "pro", offer_key: "global_workspace_subscription_monthly" }),
    ]
  );
}

function normalizeEntitlementStatus(status: "active" | "past_due" | "canceled" | "trial") {
  if (status === "trial") return "active";
  return status;
}

export async function claimPendingGlobalSubscriptions(params: {
  userId: string | number;
  email: string;
}): Promise<number> {
  await ensurePendingTable();

  const userId = typeof params.userId === "string" ? parseInt(params.userId, 10) : params.userId;
  if (!Number.isFinite(userId)) return 0;

  const email = normalizeEmail(params.email);

  const pending = await query(
    `SELECT id, stripe_subscription_id, stripe_customer_id, status, current_period_end
     FROM pending_global_subscriptions
     WHERE LOWER(email) = $1
       AND claimed_by_user_id IS NULL
       AND status IN ('active', 'trial', 'past_due')`,
    [email]
  );

  if (pending.rows.length === 0) return 0;

  for (const subscription of pending.rows) {
    const effectiveStatus = normalizeEntitlementStatus(subscription.status);

    for (const cloudId of PUBLIC_CLOUD_IDS) {
      await query(
        `INSERT INTO cloud_entitlement_grants
          (user_id, cloud_id, tier, status, stripe_customer_id, stripe_subscription_id, current_period_end, updated_at)
         VALUES ($1, $2, 'pro', $3, $4, $5, $6, NOW())
         ON CONFLICT (stripe_subscription_id, cloud_id)
         DO UPDATE SET
           user_id = EXCLUDED.user_id,
           tier = EXCLUDED.tier,
           status = EXCLUDED.status,
           stripe_customer_id = EXCLUDED.stripe_customer_id,
           current_period_end = EXCLUDED.current_period_end,
           updated_at = NOW()`,
        [
          userId,
          cloudId,
          effectiveStatus,
          subscription.stripe_customer_id,
          subscription.stripe_subscription_id,
          subscription.current_period_end,
        ]
      );

      await query(
        `INSERT INTO cloud_entitlements
          (user_id, cloud_id, tier, source, status, stripe_customer_id, stripe_subscription_id, current_period_end, valid_from, updated_at)
         VALUES ($1, $2, 'pro', 'stripe', $3, $4, $5, $6, NOW(), NOW())
         ON CONFLICT (user_id, cloud_id)
         DO UPDATE SET
           tier = EXCLUDED.tier,
           source = EXCLUDED.source,
           status = EXCLUDED.status,
           stripe_customer_id = EXCLUDED.stripe_customer_id,
           stripe_subscription_id = EXCLUDED.stripe_subscription_id,
           current_period_end = EXCLUDED.current_period_end,
           updated_at = NOW()`,
        [
          userId,
          cloudId,
          effectiveStatus,
          subscription.stripe_customer_id,
          subscription.stripe_subscription_id,
          subscription.current_period_end,
        ]
      );
    }

    await query(
      `UPDATE pending_global_subscriptions
       SET claimed_by_user_id = $1, claimed_at = NOW()
       WHERE id = $2`,
      [userId, subscription.id]
    );
  }

  return pending.rows.length;
}

export async function updatePendingGlobalSubscriptionStatus(params: {
  stripeSubscriptionId: string;
  status: "active" | "past_due" | "canceled" | "trial";
  currentPeriodEnd?: Date | null;
}): Promise<void> {
  await ensurePendingTable();

  await query(
    `UPDATE pending_global_subscriptions
     SET status = $1,
         current_period_end = COALESCE($2, current_period_end)
     WHERE stripe_subscription_id = $3
       AND claimed_by_user_id IS NULL`,
    [params.status, params.currentPeriodEnd ?? null, params.stripeSubscriptionId]
  );
}

export async function claimPendingGlobalSubscriptionBySubscription(params: {
  stripeSubscriptionId: string;
  userId: string | number;
}): Promise<void> {
  await ensurePendingTable();

  const userId = typeof params.userId === "string" ? parseInt(params.userId, 10) : params.userId;
  if (!Number.isFinite(userId)) return;

  await query(
    `UPDATE pending_global_subscriptions
     SET claimed_by_user_id = $1, claimed_at = NOW()
     WHERE stripe_subscription_id = $2
       AND claimed_by_user_id IS NULL`,
    [userId, params.stripeSubscriptionId]
  );
}
