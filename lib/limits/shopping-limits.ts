import type { UserTier } from '../pricing/types';

export const SHOPPING_CART_LIMITS: Record<UserTier, number> = {
  free: 10,
  starter: 50,
  basic: Infinity,
  pro: Infinity,
};

export function getShoppingCartLimit(tier: UserTier): number {
  return SHOPPING_CART_LIMITS[tier];
}

export function getNextUpgradeTier(currentTier: UserTier): UserTier | null {
  switch (currentTier) {
    case 'free':
      return 'starter';
    case 'starter':
      return 'basic';
    default:
      return null;
  }
}
