import { ParsedAmazonProduct } from './parseAmazonProduct';

export interface DupeProduct {
  title: string;
  price: number;
  image: string;
  similarity: 'Very Similar' | 'Similar' | 'Inspired';
  similarityScore: number;
  url: string;
  savings: number;
  savingsPercent: number;
}

export interface FindDupesOptions {
  maxResults?: number;
  minSavingsPercent?: number;
}

type Marketplace = 'amazon' | 'shein' | 'aliexpress';

const categoryDupeData: Record<string, Array<{ titleTemplate: string; priceMultiplier: number; imageKeyword: string }>> = {
  'Fashion': [
    { titleTemplate: '{adj} {item} - Casual Fit', priceMultiplier: 0.35, imageKeyword: 'fashion' },
    { titleTemplate: 'Women\'s {item} - Classic Style', priceMultiplier: 0.45, imageKeyword: 'clothing' },
    { titleTemplate: '{adj} {item} for Women', priceMultiplier: 0.55, imageKeyword: 'dress' },
    { titleTemplate: 'Everyday {item} - Comfortable', priceMultiplier: 0.40, imageKeyword: 'casual' },
    { titleTemplate: 'Trendy {item} - Modern Design', priceMultiplier: 0.50, imageKeyword: 'trendy' },
  ],
  'Bags': [
    { titleTemplate: 'Faux Leather {item}', priceMultiplier: 0.30, imageKeyword: 'bag' },
    { titleTemplate: 'Minimalist {item} - Adjustable Strap', priceMultiplier: 0.40, imageKeyword: 'handbag' },
    { titleTemplate: 'Compact {item} - Daily Use', priceMultiplier: 0.35, imageKeyword: 'purse' },
    { titleTemplate: 'Stylish {item} - Multi-pocket', priceMultiplier: 0.45, imageKeyword: 'tote' },
    { titleTemplate: 'Classic {item} Design', priceMultiplier: 0.50, imageKeyword: 'crossbody' },
  ],
  'Shoes': [
    { titleTemplate: 'Comfortable {item} - All Day Wear', priceMultiplier: 0.40, imageKeyword: 'shoes' },
    { titleTemplate: 'Stylish {item} - Cushioned Sole', priceMultiplier: 0.50, imageKeyword: 'sneakers' },
    { titleTemplate: 'Lightweight {item}', priceMultiplier: 0.35, imageKeyword: 'footwear' },
    { titleTemplate: 'Fashion {item} - Multiple Colors', priceMultiplier: 0.45, imageKeyword: 'boots' },
    { titleTemplate: 'Casual {item} - Breathable', priceMultiplier: 0.55, imageKeyword: 'sandals' },
  ],
  'Jewelry': [
    { titleTemplate: 'Dainty {item} - Hypoallergenic', priceMultiplier: 0.25, imageKeyword: 'jewelry' },
    { titleTemplate: 'Elegant {item} Set', priceMultiplier: 0.35, imageKeyword: 'necklace' },
    { titleTemplate: 'Minimalist {item}', priceMultiplier: 0.30, imageKeyword: 'bracelet' },
    { titleTemplate: 'Trendy {item} - Gift Box Included', priceMultiplier: 0.40, imageKeyword: 'earrings' },
    { titleTemplate: 'Classic {item} Design', priceMultiplier: 0.45, imageKeyword: 'ring' },
  ],
  'Home': [
    { titleTemplate: 'Soft {item} - Machine Washable', priceMultiplier: 0.35, imageKeyword: 'home' },
    { titleTemplate: 'Modern {item} Decor', priceMultiplier: 0.45, imageKeyword: 'decor' },
    { titleTemplate: 'Cozy {item} - Multiple Sizes', priceMultiplier: 0.40, imageKeyword: 'pillow' },
    { titleTemplate: 'Decorative {item}', priceMultiplier: 0.50, imageKeyword: 'blanket' },
    { titleTemplate: 'Home Essential {item}', priceMultiplier: 0.55, imageKeyword: 'interior' },
  ],
  'Kitchen': [
    { titleTemplate: 'Durable {item} - Dishwasher Safe', priceMultiplier: 0.40, imageKeyword: 'kitchen' },
    { titleTemplate: 'Compact {item} Set', priceMultiplier: 0.45, imageKeyword: 'cookware' },
    { titleTemplate: 'Essential {item} for Kitchen', priceMultiplier: 0.50, imageKeyword: 'utensils' },
    { titleTemplate: 'Multi-use {item}', priceMultiplier: 0.35, imageKeyword: 'container' },
    { titleTemplate: 'Kitchen {item} - Premium Quality', priceMultiplier: 0.55, imageKeyword: 'dishes' },
  ],
  'Electronics': [
    { titleTemplate: 'Universal {item} - Fast Charging', priceMultiplier: 0.45, imageKeyword: 'electronics' },
    { titleTemplate: 'Wireless {item} - Long Battery', priceMultiplier: 0.55, imageKeyword: 'tech' },
    { titleTemplate: 'Portable {item}', priceMultiplier: 0.50, imageKeyword: 'gadget' },
    { titleTemplate: 'High-Quality {item}', priceMultiplier: 0.60, imageKeyword: 'device' },
    { titleTemplate: 'Compatible {item} - Multi-device', priceMultiplier: 0.40, imageKeyword: 'charger' },
  ],
  'Beauty': [
    { titleTemplate: 'Natural {item} - Paraben Free', priceMultiplier: 0.35, imageKeyword: 'beauty' },
    { titleTemplate: 'Hydrating {item}', priceMultiplier: 0.40, imageKeyword: 'skincare' },
    { titleTemplate: 'Long-lasting {item}', priceMultiplier: 0.45, imageKeyword: 'makeup' },
    { titleTemplate: 'Professional {item}', priceMultiplier: 0.50, imageKeyword: 'cosmetics' },
    { titleTemplate: 'Daily {item} Essential', priceMultiplier: 0.55, imageKeyword: 'cream' },
  ],
  'Accessories': [
    { titleTemplate: 'Stylish {item} - Unisex', priceMultiplier: 0.35, imageKeyword: 'accessories' },
    { titleTemplate: 'Classic {item} Design', priceMultiplier: 0.45, imageKeyword: 'watch' },
    { titleTemplate: 'Trendy {item}', priceMultiplier: 0.40, imageKeyword: 'sunglasses' },
    { titleTemplate: 'Comfortable {item}', priceMultiplier: 0.50, imageKeyword: 'hat' },
    { titleTemplate: 'Everyday {item}', priceMultiplier: 0.55, imageKeyword: 'scarf' },
  ],
  'Fitness': [
    { titleTemplate: 'Durable {item} - Non-slip', priceMultiplier: 0.40, imageKeyword: 'fitness' },
    { titleTemplate: 'Premium {item} for Workout', priceMultiplier: 0.50, imageKeyword: 'gym' },
    { titleTemplate: 'Portable {item} - Travel Friendly', priceMultiplier: 0.45, imageKeyword: 'yoga' },
    { titleTemplate: 'High-Quality {item}', priceMultiplier: 0.55, imageKeyword: 'exercise' },
    { titleTemplate: 'Essential {item} for Training', priceMultiplier: 0.35, imageKeyword: 'sports' },
  ],
  'General': [
    { titleTemplate: 'Quality {item} Alternative', priceMultiplier: 0.45, imageKeyword: 'product' },
    { titleTemplate: 'Value {item} - Great Price', priceMultiplier: 0.40, imageKeyword: 'item' },
    { titleTemplate: 'Popular {item} Choice', priceMultiplier: 0.50, imageKeyword: 'bestseller' },
    { titleTemplate: 'Essential {item}', priceMultiplier: 0.35, imageKeyword: 'deal' },
    { titleTemplate: 'Budget-Friendly {item}', priceMultiplier: 0.55, imageKeyword: 'value' },
  ],
};

const adjectives = ['Elegant', 'Modern', 'Classic', 'Stylish', 'Trendy', 'Chic', 'Sleek', 'Premium', 'Casual', 'Comfortable'];

function getSimilarityLabel(score: number): 'Very Similar' | 'Similar' | 'Inspired' {
  if (score >= 0.8) return 'Very Similar';
  if (score >= 0.5) return 'Similar';
  return 'Inspired';
}

function generateDupeTitle(template: string, originalTitle: string): string {
  const words = originalTitle.split(' ').filter(w => w.length > 3);
  const item = words.slice(0, 2).join(' ') || 'Item';
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  
  return template
    .replace('{item}', item)
    .replace('{adj}', adj);
}

function generatePlaceholderImage(keyword: string): string {
  return `https://placehold.co/400x400/f3f4f6/9ca3af?text=${encodeURIComponent(keyword)}`;
}

export async function findDupes(
  product: ParsedAmazonProduct,
  marketplace: Marketplace = 'amazon',
  options: FindDupesOptions = {}
): Promise<DupeProduct[]> {
  const { maxResults = 5, minSavingsPercent = 10 } = options;

  if (product.price === null || product.price <= 0) {
    return [];
  }

  const templates = categoryDupeData[product.category] || categoryDupeData['General'];
  const dupes: DupeProduct[] = [];

  const shuffledTemplates = [...templates].sort(() => Math.random() - 0.5);

  for (let i = 0; i < Math.min(shuffledTemplates.length, maxResults); i++) {
    const template = shuffledTemplates[i];
    
    const baseMultiplier = template.priceMultiplier;
    const variance = (Math.random() - 0.5) * 0.1;
    const finalMultiplier = Math.max(0.2, Math.min(0.7, baseMultiplier + variance));
    
    const dupePrice = Math.round(product.price * finalMultiplier * 100) / 100;
    const savings = Math.round((product.price - dupePrice) * 100) / 100;
    const savingsPercent = Math.round((savings / product.price) * 100);

    if (savingsPercent < minSavingsPercent) continue;

    const similarityBase = 1 - finalMultiplier;
    const similarityScore = Math.min(0.95, Math.max(0.3, similarityBase + (Math.random() * 0.2)));

    const asin = generateMockAsin();

    dupes.push({
      title: generateDupeTitle(template.titleTemplate, product.title),
      price: dupePrice,
      image: generatePlaceholderImage(template.imageKeyword),
      similarity: getSimilarityLabel(similarityScore),
      similarityScore,
      url: `https://www.amazon.com/dp/${asin}?tag=vcm-20`,
      savings,
      savingsPercent,
    });
  }

  return dupes.sort((a, b) => b.savingsPercent - a.savingsPercent).slice(0, maxResults);
}

function generateMockAsin(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let asin = 'B0';
  for (let i = 0; i < 8; i++) {
    asin += chars[Math.floor(Math.random() * chars.length)];
  }
  return asin;
}
