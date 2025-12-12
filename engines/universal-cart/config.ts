export interface UniversalCartConfig {
  slug: string;
  title: string;
  subtitle: string;
  urlLabel: string;
  urlPlaceholder: string;
  noteLabel: string;
  notePlaceholder: string;
  priceLabel: string;
  pricePlaceholder: string;
  tagsLabel: string;
  tagsPlaceholder: string;
  cloudTag: 'shopping';
}

export const UNIVERSAL_CART_CONFIG: UniversalCartConfig = {
  slug: 'universal-shopping-cart',
  title: 'Universal Shopping Cart',
  subtitle: 'Save products from any website. Add notes, tags, and share your wishlist.',
  urlLabel: 'Product URL',
  urlPlaceholder: 'Paste a product link from any store...',
  noteLabel: 'Note (optional)',
  notePlaceholder: 'e.g. "Size M, color blue"',
  priceLabel: 'Price (optional)',
  pricePlaceholder: 'e.g. 49.99',
  tagsLabel: 'Tags (optional)',
  tagsPlaceholder: 'e.g. wishlist, gift-ideas',
  cloudTag: 'shopping',
};

export function getUniversalCartConfig(): UniversalCartConfig {
  return UNIVERSAL_CART_CONFIG;
}
