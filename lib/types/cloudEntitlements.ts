export const CLOUD_IDS = [
  'creation',
  'video',
  'writing',
  'file',
  'monetization',
  'intelligence',
  'music',
  'growth',
  'shopping',
  'advertising',
  'gaming',
  'ecommerce',
] as const;

export type CloudId = (typeof CLOUD_IDS)[number];

export const DEPRECATED_CLOUD_IDS = new Set<CloudId>(['file', 'monetization']);

export const ENTITLEMENT_TIERS = ['free', 'basic', 'pro', 'enterprise'] as const;
export type EntitlementTier = (typeof ENTITLEMENT_TIERS)[number];

export const TOOL_ACCESS_TIERS = ['starter', 'basic', 'pro'] as const;
export type ToolAccessTier = (typeof TOOL_ACCESS_TIERS)[number];

export type ToolAccess = 
  | { access: 'free' }
  | { access: 'cloud'; cloud: CloudId; tier: ToolAccessTier };

export type CloudEntitlementsMap = Partial<Record<CloudId, EntitlementTier>>;

export const ENTITLEMENT_SOURCES = ['stripe', 'manual_grant', 'bundle', 'promotion'] as const;
export type EntitlementSource = (typeof ENTITLEMENT_SOURCES)[number];

export const ENTITLEMENT_STATUSES = ['active', 'past_due', 'canceled', 'trial'] as const;
export type EntitlementStatus = (typeof ENTITLEMENT_STATUSES)[number];

export interface CloudEntitlement {
  id: string;
  user_id: number;
  cloud_id: CloudId;
  tier: EntitlementTier;
  source: EntitlementSource;
  status: EntitlementStatus;
  valid_from: string;
  valid_to: string | null;
  created_at: string;
  updated_at: string;
}
