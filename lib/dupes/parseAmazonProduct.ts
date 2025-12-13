export interface ParsedAmazonProduct {
  asin: string;
  title: string;
  price: number | null;
  image: string | null;
  category: string;
  keywords: string[];
  url: string;
}

export function extractAsinFromUrl(url: string): string | null {
  const patterns = [
    /\/dp\/([A-Z0-9]{10})/i,
    /\/gp\/product\/([A-Z0-9]{10})/i,
    /\/gp\/aw\/d\/([A-Z0-9]{10})/i,
    /[?&]asin=([A-Z0-9]{10})/i,
    /\/product\/([A-Z0-9]{10})/i,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1].toUpperCase();
    }
  }

  return null;
}

export function cleanProductTitle(title: string): string {
  return title
    .replace(/\[.*?\]/g, '')
    .replace(/\(.*?\)/g, '')
    .replace(/,.*$/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 100);
}

export function extractKeywords(title: string): string[] {
  const stopWords = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
    'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought',
    'used', 'this', 'that', 'these', 'those', 'it', 'its', 'new', 'pack', 'set'
  ]);

  const cleaned = title
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\d+/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word));

  return [...new Set(cleaned)].slice(0, 10);
}

export function categorizeProduct(title: string, keywords: string[]): string {
  const categoryPatterns: Record<string, string[]> = {
    'Fashion': ['dress', 'shirt', 'pants', 'jeans', 'skirt', 'blouse', 'jacket', 'coat', 'sweater', 'hoodie', 'shorts', 'leggings', 'top', 'cardigan', 'tshirt', 'romper', 'jumpsuit'],
    'Bags': ['bag', 'purse', 'handbag', 'backpack', 'tote', 'crossbody', 'clutch', 'wallet', 'satchel', 'messenger', 'duffle'],
    'Shoes': ['shoes', 'sneakers', 'boots', 'sandals', 'heels', 'flats', 'loafers', 'slippers', 'pumps', 'mules', 'espadrilles'],
    'Jewelry': ['necklace', 'bracelet', 'earrings', 'ring', 'jewelry', 'pendant', 'chain', 'anklet', 'choker'],
    'Accessories': ['watch', 'sunglasses', 'scarf', 'hat', 'belt', 'gloves', 'headband', 'hair', 'beanie', 'cap'],
    'Home': ['pillow', 'blanket', 'rug', 'curtain', 'lamp', 'vase', 'decor', 'storage', 'organizer', 'throw', 'candle', 'mirror'],
    'Kitchen': ['kitchen', 'cookware', 'utensils', 'dishes', 'cups', 'mugs', 'plates', 'bowls', 'container', 'pot', 'pan'],
    'Electronics': ['phone', 'case', 'charger', 'cable', 'wireless', 'bluetooth', 'speaker', 'headphones', 'earbuds', 'adapter'],
    'Beauty': ['makeup', 'skincare', 'lipstick', 'mascara', 'foundation', 'serum', 'cream', 'moisturizer', 'brush', 'palette'],
    'Fitness': ['yoga', 'gym', 'fitness', 'workout', 'sports', 'exercise', 'weights', 'mat', 'resistance', 'dumbbells'],
  };

  const titleLower = title.toLowerCase();
  const allWords = [titleLower, ...keywords].join(' ');

  for (const [category, patterns] of Object.entries(categoryPatterns)) {
    for (const pattern of patterns) {
      if (allWords.includes(pattern)) {
        return category;
      }
    }
  }

  return 'General';
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

const productTemplates: Record<string, { titles: string[], basePrice: [number, number] }> = {
  'Fashion': {
    titles: [
      'Women\'s Elegant Summer Dress',
      'Casual Cotton Maxi Dress',
      'Floral Print Midi Dress',
      'V-Neck Wrap Dress',
      'Bohemian Beach Dress',
    ],
    basePrice: [35, 85],
  },
  'Bags': {
    titles: [
      'Leather Crossbody Bag',
      'Minimalist Tote Bag',
      'Designer Handbag',
      'Quilted Shoulder Bag',
      'Vintage Style Satchel',
    ],
    basePrice: [45, 120],
  },
  'Shoes': {
    titles: [
      'Comfortable Running Sneakers',
      'Classic Ankle Boots',
      'Casual Slip-On Loafers',
      'Strappy Block Heel Sandals',
      'Breathable Walking Shoes',
    ],
    basePrice: [40, 95],
  },
  'Jewelry': {
    titles: [
      'Dainty Gold Layer Necklace',
      'Sterling Silver Hoop Earrings',
      'Minimalist Chain Bracelet',
      'Statement Pearl Necklace',
      'Elegant Pendant Set',
    ],
    basePrice: [18, 65],
  },
  'Accessories': {
    titles: [
      'Classic Analog Watch',
      'Polarized Aviator Sunglasses',
      'Wool Blend Winter Scarf',
      'Genuine Leather Belt',
      'Cotton Baseball Cap',
    ],
    basePrice: [25, 75],
  },
  'Home': {
    titles: [
      'Decorative Throw Pillow Set',
      'Cozy Fleece Blanket',
      'Modern Area Rug',
      'Elegant Glass Vase',
      'Scented Candle Set',
    ],
    basePrice: [28, 85],
  },
  'Kitchen': {
    titles: [
      'Stainless Steel Cookware Set',
      'Ceramic Mug Collection',
      'Non-Stick Pan Set',
      'Food Storage Container Set',
      'Silicone Utensil Set',
    ],
    basePrice: [25, 95],
  },
  'Electronics': {
    titles: [
      'Wireless Bluetooth Earbuds',
      'Fast Charging Phone Charger',
      'Portable Bluetooth Speaker',
      'Premium Phone Case',
      'USB-C Charging Cable Set',
    ],
    basePrice: [20, 80],
  },
  'Beauty': {
    titles: [
      'Complete Makeup Brush Set',
      'Hydrating Face Serum',
      'Long-lasting Lipstick Collection',
      'Natural Skincare Set',
      'Professional Eyeshadow Palette',
    ],
    basePrice: [22, 65],
  },
  'Fitness': {
    titles: [
      'Premium Yoga Mat',
      'Resistance Band Set',
      'Adjustable Dumbbells',
      'Workout Gloves',
      'Foam Roller Set',
    ],
    basePrice: [20, 75],
  },
  'General': {
    titles: [
      'Popular Bestselling Item',
      'Top-Rated Product',
      'Customer Favorite',
      'Trending Item',
      'Quality Essential',
    ],
    basePrice: [25, 75],
  },
};

export async function parseAmazonProduct(url: string): Promise<ParsedAmazonProduct | null> {
  const asin = extractAsinFromUrl(url);
  if (!asin) {
    return null;
  }

  const canonicalUrl = `https://www.amazon.com/dp/${asin}`;
  const seed = hashString(asin);
  const random = seededRandom(seed);

  const categories = Object.keys(productTemplates);
  const categoryIndex = seed % categories.length;
  const category = categories[categoryIndex];
  const template = productTemplates[category];

  const titleIndex = Math.floor(random() * template.titles.length);
  const title = template.titles[titleIndex];

  const [minPrice, maxPrice] = template.basePrice;
  const price = Math.round((minPrice + random() * (maxPrice - minPrice)) * 100) / 100;

  const keywords = extractKeywords(title);

  const imageColors = ['f0e68c', 'dda0dd', 'b0e0e6', 'ffa07a', '98fb98', 'f5deb3', 'd8bfd8', 'f0f8ff'];
  const colorIndex = seed % imageColors.length;
  const image = `https://placehold.co/400x400/${imageColors[colorIndex]}/333333?text=${encodeURIComponent(category)}`;

  return {
    asin,
    title,
    price,
    image,
    category,
    keywords,
    url: canonicalUrl,
  };
}
