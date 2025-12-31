/**
 * DEV-ONLY seed script for brand_access_entries
 * Do NOT run in production
 * 
 * Usage: npx tsx scripts/seed-brand-access.ts
 */

import { query } from '../lib/db';

const SEED_ENTRIES = [
  {
    brand_name: 'Nike',
    website_url: 'https://nike.com',
    contact_url: 'https://about.nike.com/pages/contact-us',
    contact_type: 'brand',
    tags: ['sportswear', 'lifestyle'],
    notes: 'General contact form for all inquiries',
    country: 'USA',
    last_verified: '2025-01-01'
  },
  {
    brand_name: 'Sephora',
    website_url: 'https://sephora.com',
    contact_url: 'https://www.sephora.com/beauty/affiliate-program',
    contact_type: 'affiliate',
    tags: ['beauty', 'cosmetics'],
    notes: 'Affiliate program application page',
    country: 'USA',
    last_verified: '2025-01-01'
  },
  {
    brand_name: 'Red Bull',
    website_url: 'https://redbull.com',
    contact_url: 'https://www.redbullcontentpool.com/register',
    contact_type: 'partnerships',
    tags: ['energy', 'sports', 'entertainment'],
    notes: 'Content pool registration for creators',
    country: 'Austria',
    last_verified: '2025-01-01'
  },
  {
    brand_name: 'Gymshark',
    website_url: 'https://gymshark.com',
    contact_url: 'https://www.gymshark.com/pages/athlete-application',
    contact_type: 'influencer',
    tags: ['fitness', 'activewear'],
    notes: 'Athlete ambassador application',
    country: 'UK',
    last_verified: '2025-01-01'
  },
  {
    brand_name: 'Adobe',
    website_url: 'https://adobe.com',
    contact_url: 'https://www.adobe.com/about-adobe/contact/advertising-press-inquiry.html',
    contact_type: 'press',
    tags: ['software', 'creative'],
    notes: 'Press and advertising inquiries',
    country: 'USA',
    last_verified: '2025-01-01'
  },
  {
    brand_name: 'Logitech',
    website_url: 'https://logitech.com',
    contact_url: 'https://www.logitechg.com/en-us/influencers.html',
    contact_type: 'influencer',
    tags: ['gaming', 'tech', 'peripherals'],
    notes: 'Gaming influencer program',
    country: 'Switzerland',
    last_verified: '2025-01-01'
  },
  {
    brand_name: 'HelloFresh',
    website_url: 'https://hellofresh.com',
    contact_url: 'https://www.hellofresh.com/pages/affiliate-program',
    contact_type: 'affiliate',
    tags: ['food', 'subscription'],
    notes: 'Affiliate and creator program',
    country: 'Germany',
    last_verified: '2025-01-01'
  },
  {
    brand_name: 'CAA (Creative Artists Agency)',
    website_url: 'https://caa.com',
    contact_url: 'https://www.caa.com/contact',
    contact_type: 'agency',
    tags: ['talent', 'entertainment'],
    notes: 'Talent agency general contact',
    country: 'USA',
    last_verified: '2025-01-01'
  },
  {
    brand_name: 'Netflix',
    website_url: 'https://netflix.com',
    contact_url: 'https://media.netflix.com/en/contact-us',
    contact_type: 'press',
    tags: ['streaming', 'entertainment'],
    notes: 'Media and press inquiries only',
    country: 'USA',
    last_verified: '2025-01-01'
  },
  {
    brand_name: 'Shein',
    website_url: 'https://shein.com',
    contact_url: 'https://us.shein.com/campaign/sheglam-influencer',
    contact_type: 'influencer',
    tags: ['fashion', 'affordable'],
    notes: 'SHEGLAM influencer program',
    country: 'Singapore',
    last_verified: '2025-01-01'
  }
];

async function seed() {
  console.log('Seeding brand_access_entries (DEV ONLY)...');
  
  for (const entry of SEED_ENTRIES) {
    await query(
      `INSERT INTO brand_access_entries 
        (brand_name, website_url, contact_url, contact_type, tags, notes, country, last_verified, is_active, source)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, 'curated')
       ON CONFLICT DO NOTHING`,
      [
        entry.brand_name,
        entry.website_url,
        entry.contact_url,
        entry.contact_type,
        entry.tags,
        entry.notes,
        entry.country,
        entry.last_verified
      ]
    );
    console.log(`  Added: ${entry.brand_name}`);
  }
  
  console.log('Done seeding brand_access_entries');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
