# VCM Suite

## Overview
VCM Suite is a creator-focused online campus built with Next.js 14, TypeScript, Tailwind CSS, and PostgreSQL. The platform's primary goal is to **capture massive SEO traffic through free tools and content**, then **convert that traffic into joining VCM OS** (the creator ecosystem at vcmos.io). Users can browse all content without authentication, only needing to create an account when claiming free products or purchasing paid items.

### Primary Conversion Goal
- Drive SEO traffic via free tools (GIF compressor, logo generator, keyword finder, etc.)
- Convert visitors to VCM OS ecosystem at **vcmos.io**
- Homepage features prominent "Open VCM OS" CTA button linking to vcmos.io

---

## VCM Code Modification Protocol

This section defines exactly what an AI agent or contributor is allowed to modify inside the VCM Suite codebase. These rules exist to protect architecture, prevent regressions, and enforce consistency across engines, clouds, tools, and CMS-driven pages.

### FORBIDDEN ZONES (DO NOT MODIFY)

The following files and directories are structurally critical and must never be modified unless the Founder explicitly approves the change.

#### 1. Global Styling & Design System
- `app/globals.css`
- Any global `@layer base` or `@layer utilities` definitions
- Global CSS tokens, color maps, theme variables

**Reason**: These define the entire design system. Any change cascades across thousands of pages.

#### 2. Core Database & Server Infrastructure
- `lib/db.ts`
- Prisma schema files (unless explicit approval is given)
- Any shared DB connection logic

**Reason**: These are sensitive, shared across clouds & tools. Breaking them breaks everything.

#### 3. Core Engine Registry
- `lib/engineRegistry.ts`
- `data/toolsRegistry.ts`

**Allowed**: Append-only new engine registrations or new tool entries.
**Forbidden**: Refactoring, removing entries, renaming engine keys, or altering existing registry structure.

**Reason**: This registry is the backbone of the Engine → Config → Renderer system.

#### 4. Layouts & Top-Level Routing
- `app/layout.tsx`
- Cloud layouts (`app/(clouds)/**/layout.tsx`)
- Marketing layouts

**Reason**: Breaking a layout collapses the entire rendering stack.

#### 5. Authentication, Entitlements & OS Interfaces
- `lib/cloudEntitlements.ts`
- `app/api/user/entitlements/**`
- Any internal OS mirror interfaces

**Allowed**: Adding new endpoints.
**Forbidden**: Modifying entitlement logic or existing OS calls.

#### 6. VCM Renderer (ABSOLUTE LOCKED ZONE)
- `components/renderer/**`
- `lib/vcmRenderer/**`
- `lib/vcm-renderer/**`
- Any file containing: `Renderer`, `renderEngine`, `VCMRenderer`, `resolveConfig`, `resolveCmsObject`

**Rules**:
- No modifications
- No refactors
- No optimizations
- No style changes
- No imports added or removed
- No touching the rendering pipeline or layout system

**Allowed action**: Agent may read these files to understand behavior, but never write to them.

**Reason**: The renderer is the universal engine powering hundreds of tools; it is infrastructure, not feature code.

### THEME CONSTRAINT (GLOBAL RULE)

**LIGHT-THEME ONLY — DO NOT USE DARK MODE**

The codebase is currently light-theme only.

**Forbidden**:
- Do not use Tailwind `dark:` variants anywhere in: Engines, Tools, Layouts, Marketing wrappers, Shared components

**Reason**: No dark palette has been designed yet. Any `dark:` class silently overrides text colors and causes washed-out UI.

Only add `dark:` classes if the Founder explicitly requests dark-mode implementation.

### ALLOWED ZONES (SAFE TO MODIFY)

You may freely edit these areas as long as you follow the existing architecture patterns.

#### 1. Engine Configurations
- `engines/**/config.ts`
- Add new presets, modify labels, adjust CTA content.

**Rule**: Do not change the shape of an existing config schema.

#### 2. Engine Components
- `components/engines/**/*.tsx`

**Allowed**:
- Update UI inside the engine
- Add UI elements
- Add controlled client-side logic
- Add feature-gated UI based on entitlements

**Forbidden**:
- Importing server code (must use `.client.ts` variants)
- Adding inline CSS except for debugging or temporary patches

#### 3. CMS Tool Definitions
- Create new CMS tool entries
- Update SEO metadata
- Update config references
- Add cloud tags

**Rule**: Do not change existing slugs.

#### 4. API Routes (New Ones Only)
- You may create new API endpoints under `app/api/**` following existing patterns.

**Forbidden**: Modifying existing API endpoints unless explicitly instructed.

#### 5. Client-Side Utilities
- `lib/cloudEntitlements.client.ts`
- `lib/parseQuery.ts`
- Other client-only helpers

**Rule**: These must remain client-safe. No DB imports.

### DEBUGGING STANDARD (REQUIRED)

When diagnosing UI issues, the contributor must:
1. Inspect the element in DevTools
2. Open Computed panel
3. Check: `color`, `opacity`, `filter`, `-webkit-text-fill-color`
4. Paste the Computed output + screenshot into the chat before proposing a fix

**Reason**: Prevents blind CSS edits and ensures exact diagnosis.

### SAFETY RULES FOR AGENTS

**Agents MUST**:
- Follow the Engine → Config → Renderer architecture
- Use Tailwind classes (no inline styles unless explicitly asked)
- Keep logic decoupled (client/server separation)
- Ask before modifying anything in Forbidden Zones

**Agents MUST NOT**:
- Introduce dark mode classes
- Add new global CSS
- Change layouts
- Edit registries except append-only
- Modify entitlements or DB layers
- Introduce inline styling as permanent fixes

---

## Architecture

### Tech Stack
- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, PostgreSQL
- **Payments**: Stripe Checkout
- **Authentication**: Email/password with bcrypt

### Key Features
- **Public-first browsing**: All content visible without login
- **Browse-first, account-later**: Authentication only required on claim/purchase
- **Product catalog**: Apps, courses, downloads, funnels, and freebies
- **Blog system**: SEO-optimized blog with WordPress-style editor, image uploads, and categories
- **Free Web Tools**: SEO-optimized tools (GIF Compressor, Image Compressor, Word Counter) to drive organic traffic
- **Feedback system**: User feedback form with bug reports, feature requests, improvements, and general feedback
- **AI Strategy chat**: Mock AI that suggests products based on keywords
- **Email capture**: Newsletter subscription throughout the site
- **Stripe integration**: Payments with webhook-based fulfillment

## Database Schema

### Tables
- `products`: Product catalog with type, price, Stripe integration
- `users`: User accounts with email/password
- `profiles`: Extended user data
- `entitlements`: User access to products
- `purchases`: Purchase history
- `blog_posts`: SEO-optimized blog posts with featured images, categories, and scheduling
- `categories`: Blog post categories
- `blog_post_categories`: Many-to-many relationship between posts and categories
- `subscribers`: Email newsletter list
- `feedback`: User feedback submissions (bug reports, feature requests, improvements)
- `user_emoji_combos`: Community-submitted emoji combinations
- `daily_horoscopes`: Cached daily horoscope readings by sign and tone
- `daily_affirmations`: Cached daily affirmations by area and tone
- `ideas`: Community-submitted startup ideas
- `idea_votes`: Upvotes on ideas (one per session)
- `idea_comments`: Comments on ideas
- `questions`: VCM Answers Q&A questions for SEO
- `question_votes`: Upvotes on questions (one per session)
- `resource_boxes`: Creator resource boxes for link card generator
- `box_items`: Links within resource boxes
- `internal_resources`: Pre-defined VCM tools/freebies for resource boxes
- `predictions`: Community predictions about future events (tech, crypto, etc.)
- `prediction_votes`: Yes/No votes on predictions (anonymous voting)
- `youtube_users`: YouTube OAuth users with tokens and channel info
- `youtube_title_tests`: A/B title tests for YouTube videos
- `youtube_title_variants`: Title variants for each test (2-5 per test)
- `youtube_rotation_log`: Log of title rotations with activation times
- `cluster_articles`: AI-generated SEO articles linked to clusters (separate from manual blog posts)
- `global_urls`: URL registry for domain-wide indexing control (URL, type, is_indexed, canonical, notes)
- `seo_health_snapshots`: SEO health audit results per page (score, title, H1, meta, word count, schema, robots)
- `cms_objects`: JSON CMS objects for tools, articles, products (slug, type, cluster_slug, data JSONB, word_count, health, cloud_tags text[])

### Cloud Tag Matrix
Tools can be tagged with VCM Cloud affiliations to display contextual upsell blocks:
- **lib/clouds.ts**: Defines 8 VCM Cloud product bundles (Creation, Video, Writing/SEO, File/Data, Monetization, Intelligence, Music/Performance, Growth/Distribution)
- **Admin UI**: Cloud tags column in tools table with modal editor for checkbox selection
- **CloudUpsellBlock**: Renders on tool pages when cloudTags.length > 0, showing related VCM Cloud products with links to cloud dashboards
- **Database**: cloud_tags stored as text[] in cms_objects table

### Cloud Dashboard Engine
Each VCM Cloud has a dedicated dashboard page at /clouds/[cloud-slug]:
- **CloudDashboardEngine**: components/engines/CloudDashboardEngine.tsx renders Adobe-style cloud landing pages
- **Route**: app/clouds/[cloud]/page.tsx with CloudPageClient wrapper
- **Data fetcher**: lib/cms/getCmsCloudBySlug.ts fetches cloud_dashboard CMS objects
- **Engine config**: hero block, featured products, app row, shortcuts, recent files placeholder
- **Database columns**: engine TEXT and engine_config JSONB on cms_objects table
- **Seeded dashboards**: All 8 clouds have CMS objects (creation-cloud, video-cloud, writing-seo-cloud, etc.)
- **Funnel flow**: Tool → CloudUpsellBlock → Cloud Dashboard → Product/Store page

### Cloud Entitlements System
Controls user access to pro/AI features based on cloud subscription tier:
- **Database**: `cloud_entitlements` table with unique constraint on (user_id, cloud_id)
- **Types**: `lib/types/cloudEntitlements.ts` defines CloudId, EntitlementTier, CloudEntitlement
- **Helpers**: `lib/cloudEntitlements.ts` provides hasAccess(), getCloudEntitlementsForUser(), grantCloudEntitlement()
- **Client helpers**: `lib/cloudEntitlements.client.ts` provides client-safe hasAccess(), cloudSlugToId() for use in 'use client' components
- **Offer mapping**: `lib/offers.ts` contains CLOUD_OFFER_MAP linking offer_keys to cloud entitlements
- **API**: `/api/user/entitlements` endpoint (session-protected) returns current user's entitlements
- **Tool integration**: ToolPageClient fetches entitlements and passes canUsePro/canUseBasic to engine components
- **Tiers**: free → basic → pro → enterprise (hierarchical access)
- **Statuses**: active, trial (both grant access), past_due, canceled
- **Sources**: stripe, manual_grant, bundle, promotion

### Price Engine (Shopping Cloud)
First engine gated behind cloud entitlements, for price tracking tools:
- **Engine**: `components/engines/PriceEngine.tsx` renders price tracking interface
- **Config**: `engines/price-engine/config.ts` defines PriceEngineConfig with mode, input labels, CTAs
- **Presets**: trackPriceConfig (generic), trackPricesOnAmazonConfig (Amazon-specific)
- **Tools**: `/tools/track-price`, `/tools/track-prices-on-amazon`
- **Modal**: `components/modals/ShoppingCloudUpgradeModal.tsx` for waitlist signup
- **Waitlist API**: `/api/waitlist/shopping-cloud` creates waitlist_signups entries
- **Analytics**: price_tool_submitted, price_tool_cta_clicked, shopping_cloud_waitlist_joined events

## Project Structure

```
/app                    # Next.js app directory
  /api                 # API routes
    /auth              # Signup, login endpoints
    /checkout          # Stripe checkout
    /webhooks          # Stripe webhook handler
  /blog                # Blog pages
  /product/[slug]      # Product detail pages
  /store               # Product catalog
  /dashboard           # User dashboard
  /strategy-ai         # AI chat interface
/components            # Reusable React components
  /ui                  # shadcn/ui components
/lib                   # Utilities and helpers
  db.ts                # Database connection
  auth.ts              # Authentication logic
  utils.ts             # Utility functions
```

## Routes

### Public Routes
- `/` - Homepage with hero and email capture
- `/store` - Full product catalog
- `/product/[slug]` - Product detail page
- `/blog` - Blog post listing
- `/blog/[slug]` - Individual blog post
- `/newsletter` - Newsletter signup page
- `/strategy-ai` - AI strategy chat
- `/tools/gif-compressor` - Free GIF compression tool (SEO traffic driver)
- `/tools/image-compressor` - Free JPG/PNG/WebP compression tool
- `/tools/word-counter` - Free word/character counting tool (100% client-side)
- `/tools/logo-generator` - Free AI-powered logo generator
- `/tools/keyword-finder` - Free low-competition keyword finder
- `/tools/visualization` - Free text-to-diagram visualization tool
- `/tools/emoji-combos` - Free emoji combination generator with community library
- `/tools/horoscope-of-the-day` - Free AI-powered daily horoscope generator
- `/tools/affirmation-about-self-love` - Free daily AI self-love affirmation generator
- `/tools/calorie-counter-steps` - Free steps to calories calculator (SEO: "calorie counter steps")
- `/ideas` - VCM Ideas Hub - Reddit-style feed for startup ideas
- `/ideas/new` - Submit a new idea
- `/ideas/[slug]` - Individual idea detail page with comments
- `/answers` - VCM Answers - Quora-style Q&A for SEO
- `/answers/new` - Submit a new question
- `/answers/[slug]` - Individual question page with SEO schema
- `/tools/resource-box` - Creator Resource Box - shareable link card generator
- `/tools/resource-box/[slug]` - Public resource box display
- `/tools/resource-box/[slug]/embed` - Embeddable resource box for iframes
- `/tools/ai-thumbnail-coach` - AI YouTube Thumbnail Coach - thumbnail analyzer with chat
- `/tools/reach-grabber-tool` - Reach Grabber Tool - AI SEO content optimizer
- `/tools/pdf-editor` - Free online PDF editor - reorder, rotate, delete pages (client-side)
- `/tools/ai-humanizer-free` - AI Humanizer Free - detect & humanize AI-written content
- `/tools/producer-tag-generator` - Producer Tag Generator - AI voice tags for beats
- `/tools/ad-copy-analyzer` - Ad Copy Analyzer - analyze & improve ad copy with AI
- `/tools/internal-link-seo-audit` - Internal Link Audit - find orphan pages & weak internal links
- `/tools/gif-maker` - GIF Maker - create GIFs from videos using ffmpeg.wasm
- `/tools/heic-to-jpg` - HEIC to JPG Converter - convert iPhone HEIC photos to JPG (targets "heic u jpg" keyword)
- `/tools/outfit-ideas` - Outfit Ideas Generator - upload outfit photos and find similar items to shop with AI (targets "outfit ideas" keyword)
- `/tools/calorie-deficit-calculator` - AI Calorie Deficit Calculator - snap food + health app screenshot to see surplus or deficit (targets "calorie counter deficit" keyword)
- `/r` - Redirect route for affiliate link tracking (routes shopping clicks through for future APE integration)
- `/tools/prediction-center` - Prediction Center - vote Yes/No on future event predictions
- `/tools/name-combiner` - Name Combiner - combine 2-3 names into unique mashups (targets "combiner name" keyword)
- `/tools/photo-gallery-maker` - Photo Gallery Maker - create multi-photo gallery layouts (grid, masonry, horizontal strip) with PNG export
- `/tools/youtube-title-split-test` - YouTube Title Split-Test Tool - A/B test YouTube video titles with auto-rotation and CTR tracking
- `/tools/youtube-thumbnail-resizer` - YouTube Thumbnail Resizer - resize images to 1280×720 (shared engine)
- `/tools/instagram-post-resizer` - Instagram Post Resizer - resize images to 1080×1080 (shared engine)
- `/tools/instagram-story-resizer` - Instagram Story Resizer - resize images to 1080×1920 (shared engine)
- `/tools/tiktok-video-resizer` - TikTok Cover Resizer - resize images to 1080×1920 (shared engine)
- `/tools/twitter-header-resizer` - Twitter/X Header Resizer - resize images to 1500×500 (shared engine)
- `/tools/linkedin-banner-resizer` - LinkedIn Banner Resizer - resize images to 1584×396 (shared engine)

### MBB Routes (Micro-Blog Business)
MBBs are standalone SEO tools that drive traffic without appearing in main navigation. Access via Admin > Manage MBBs.
- `/tools/calorie-counter-walking` - Walking calorie calculator (targets "calorie counter walking" keyword)
- `/articles/steps-vs-calories-walking` - Supporting article for walking calculator
- `/articles/walking-for-fat-loss` - Supporting article for walking calculator
- `/tools/calorie-counter-maintenance` - TDEE/Maintenance calorie calculator (targets "calorie counter maintenance" keyword)
- `/articles/what-are-maintenance-calories` - Supporting article for maintenance calculator
- `/articles/maintenance-vs-deficit-vs-surplus` - Supporting article for maintenance calculator
- `/tools/ups-shipping-cost` - UPS shipping cost estimator (targets "estimate ups shipping cost" keyword)
- `/mbb/ups-shipping-rates-explained` - Supporting article explaining UPS rate factors
- `/mbb/ups-ground-vs-air` - Supporting article comparing Ground vs Air services
- `/tools/401k-retirement-calculator` - 401k retirement estimator (targets "estimate 401k at retirement" keyword)
- `/mbb/how-401k-compound-growth-works` - Supporting article on compound interest power
- `/mbb/401k-vs-ira-retirement` - Supporting article comparing 401k vs IRA accounts
- `/tools/loan-estimator-home` - Home loan calculator (targets "loan estimator home" keyword)
- `/mbb/home-loan-basics` - Supporting article on mortgage fundamentals
- `/mbb/mortgage-types-explained` - Supporting article comparing Fixed, ARM, FHA, VA loans
- `/tools/estimator-for-car-repair` - Car repair cost calculator (targets "estimator for car repair" keyword)
- `/mbb/common-car-repair-costs` - Supporting article with brake, engine, AC, transmission cost tables
- `/mbb/how-car-repairs-are-priced` - Supporting article explaining labor billing, parts markup, diagnostic fees
- `/tools/maker-quotes-generator` - Quote generator for creators (targets "maker quotes generator" keyword)
- `/mbb/how-makers-use-quotes` - Supporting article on quote content strategy for makers
- `/mbb/famous-quotes-for-creators` - Supporting article with 50+ curated quotes from famous makers

### Authenticated Routes
- `/dashboard` - User's products and entitlements
- `/apps/[slug]` - Access to purchased apps
- `/courses/[slug]` - Access to purchased courses
- `/downloads/[slug]` - Access to purchased downloads

## Development

### Running Locally
The dev server runs on port 5000:
```bash
npm run dev
```

### Environment Variables
- `DATABASE_URL` - External Neon PostgreSQL connection string (shared across dev and production)
- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret
- `SESSION_SECRET` - Session encryption key
- `ADMIN_PASSWORD_HASH` - Hashed admin password for dashboard access
- `STORAGE_BUCKET` - Object storage bucket name for file uploads

### Database Configuration
**IMPORTANT**: This project uses an **external Neon PostgreSQL database** shared across all environments.

- ✅ Database connection uses `DATABASE_URL` environment variable
- ✅ **One shared database for both development and production** - changes sync instantly
- ✅ Products, users, and all data persist across environments
- ✅ What you add in testing immediately appears on the live site
- ✅ Same setup as APE - external Neon database for unified data

**Current Status**: External Neon database set up on 2025-11-03 with all required tables.

**Connection**: `postgresql://neondb_owner:***@ep-shiny-sun-ade9bu1b-pooler.c-2.us-east-1.aws.neon.tech/neondb`

**Code Implementation**: See `lib/db.ts` which uses Neon serverless driver with WebSocket support.

## Three Truths Architecture (2025-12-08)

The codebase follows three contracts that define what is "real":

### 1. CONTENT Truth
All tools, products, clusters, articles live in `cms_objects` table.
- Legacy stuff is frozen and never extended
- Use the JSON importer to create new content
- Type field: `'product' | 'tool' | 'article' | 'mbb' | 'cluster'`

### 2. URL Truth  
Only `global_urls` defines what is "real" for SEO.
- SEO scanner reads from `global_urls`
- Sitemap reads from `global_urls WHERE is_indexed = true`
- Admin panels read from `global_urls`
- Nothing custom per page anymore

### 3. MONEY Truth
Every monetized product uses `offer_key` as the identifier:
- CMS `product_data` includes: `offer_key`, `primary_price_id`, `mode`, `checkout_strategy`
- `/api/checkout` reads from CMS, passes `offer_key` in Stripe metadata
- Webhook grants entitlements via `lib/offers.ts grantAccessForOffer()`
- Entitlements keyed by `offer_key`, not slugs or price amounts

**Adding a new paid product:**
1. CMS: add `offer_key` + `primary_price_id` + `checkout_strategy: 'stripe'`
2. Code: entitlements are granted automatically via `offer_key`

**External apps (QR Social, C-Score):**
- `checkout_strategy: 'external'`
- `cta_primary_href` links to external app URL
- No Stripe integration needed

## Design System

### Color Palette
- **Primary Accent**: Orange-500/600 (matching VCM OS branding, inverted for light theme)
- **Neutral Colors**: Gray palette (gray-50 through gray-900)
- **App Cards**: Colorful gradient cards (pink, blue, yellow, teal, orange) matching VCM OS style
- **Backgrounds**: White/light gray for clean, premium appearance
- **Text**: Gray-900 for headings, gray-600 for body text

### Brand Cohesion
VCM Suite and VCM OS share a unified brand identity:
- VCM Suite: Light theme with orange accents on white/gray backgrounds
- VCM OS: Dark theme with orange accents on dark backgrounds
- Both use the same colorful app card gradient system

## Engine Architecture (VASE Infrastructure)

### Overview
VCM Suite uses a **Vertical Action Search Engine (VASE)** architecture. Tools are powered by reusable **engines** that can spawn multiple tools from a single codebase.

### Engine Types
| Engine | Description | Input Types | Output Types |
|--------|-------------|-------------|--------------|
| `platform-resizer` | Resize images for social platforms | image | image |
| `image-compress` | Compress images to reduce size | image | download |
| `image-convert` | Convert between image formats | image, multi | download |
| `text-transform` | Transform and manipulate text | text | text |
| `text-analysis` | Analyze text for metrics | text | analysis |
| `calculator` | Numerical calculations | number, selection | analysis |
| `ai-analysis` | AI-powered content analysis | text, image, url | analysis, text |
| `ai-generate` | AI-powered content generation | text, selection | text, image, display, download |
| `file-convert` | Convert between file formats | file | download |
| `file-edit` | Edit and manipulate files | file | download |
| `community` | User-generated content tools | selection, text | interactive, text |
| `static` | Reference guides | none | display |
| `standalone` | Custom one-off tools | multi, text, image | interactive, image, text |

**Note**: Tool counts are computed dynamically via `getToolCountByEngine()` from the tools registry.

### Tool Metadata Schema (Semantic Layer)
Every tool in `toolsRegistry.ts` includes a **semantic layer** enabling automated SEO manufacturing:

**Core Fields:**
- `engineType` - which engine powers it
- `inputType` - what it accepts (image, text, url, file, number, selection, none, multi)
- `outputType` - what it produces (image, text, file, download, analysis, display, interactive)
- `relatedTools` - array of related tool slugs for legacy cross-linking
- `relatedArticles` - array of related MBB article slugs for legacy linking

**SEO Manufacturing Fields (Phase 2):**
- `primaryKeyword` - main target keyword for the tool
- `secondaryKeywords[]` - array of secondary keyword variations for content optimization
- `searchIntent` - "informational" | "action" | "transactional"
- `pillarSlug` - the pillar topic this tool belongs to (e.g., "social-media-image-sizes")
- `clusterSlug` - specific cluster within pillar (e.g., "instagram-image-tools")
- `recommendedTools[]` - tools to link to (automated linking)
- `recommendedArticles[]` - articles to link to (automated linking)

**This semantic layer enables:**
- Automated internal linking
- Automated breadcrumbs generation
- Automated CTA selection
- Automated schema.org injection
- Automated sitemap grouping
- Automated cluster performance reporting

### Keyword & Cluster Registries
- `data/keywordsRegistry.ts` - Keyword metadata (volume, difficulty, intent, SERP features, content briefs)
- `data/clusterRegistry.ts` - Topic cluster structure (pillarSlug, toolSlugs[], articleSlugs[], keywords)

### Phase 2: Tool Manufacturing Strategy
**Step 1** - Build 10 Engines (platform-resizer, calculator, ai-analysis, etc.)
**Step 2** - Create Keyword Matrix for each engine (modifiers × platforms = 200+ skins)
**Step 3** - Auto-generate tool pages from the matrix (unique SEO copy, CTAs, related blocks)
**Step 4** - Build clusters (Engine page = pillar, Articles = support, Tools = spokes)
**Step 5** - Deploy internal linking automation (3 tools + 2 articles + 1 revenue CTA per page)
**Step 6** - Add schema at engine, cluster, and page levels
**Step 7** - Add monetization overlays (QR Social, Nudge, APE, etc.)

### Adding New Tools
1. **Engine-based tools**: Add preset to engine's config file, create thin page shell
2. **Standalone tools**: Create custom implementation in `/app/tools/[slug]`
3. **Register in tools registry**: Add entry to `toolsRegistry.ts` with full metadata

### File Structure
```
/engines                    # Engine configs and shared logic
  /platform-resizer        # Platform image resizer engine
    config.ts              # Engine configuration
/data
  toolsRegistry.ts         # Master tool registry with all 47+ tools
  platformImagePresets.ts  # Platform resizer presets
/components
  PlatformImageToolClient.tsx  # Shared platform resizer component
```

## Recent Changes
- 2025-12-11: **Internal Linking Architecture** - Complete SEO internal linking to prevent orphaned pillar pages
  - Created ToolBreadcrumb component (components/tools/ToolBreadcrumb.tsx):
    - Shows "Tools > [Pillar] > [Tool Name]" when tool has a pillar assigned
    - Shows "Tools > [Tool Name]" for tools without a pillar
    - Links to /tools, pillar page, and current tool
  - Added Tool Collections section to /tools page (components/tools/PillarCollections.tsx):
    - Displays indexed pillar cards with title, description, and CTA
    - Links to /tools/[pillar-slug] pillar pages
  - Created pillar helper functions (lib/cms/getPillarBySlug.ts):
    - getPillarBySlug(): Get single pillar info
    - getAllIndexedPillars(): Get all indexed pillars
    - getRelatedPillars(): Get other pillars for cross-linking
  - Added Related Collections section to pillar pages:
    - Shows other indexed pillars with links
    - Excludes current pillar from list
  - Complete linking graph: /tools ↔ pillars ↔ tools creates non-orphaned architecture
  - API endpoint: /api/pillars returns all pillar slugs and titles
  - **Standardized pillar_slug as canonical source of truth**:
    - Added pillar_slug column to cms_objects table
    - Backfilled from cluster_slug for 27 existing CMS tools
    - Admin API writes to pillar_slug in both tools and cms_objects tables
    - cluster_slug remains available for future SEO cluster use (separate concept)
- 2025-12-09: **Type-Based SEO Ready Rules** - Intelligent readiness evaluation based on page type and cluster architecture
  - Created lib/seo/urlClassifier.ts as central classification utility:
    - Configurable thresholds: MIN_READY_SCORE=80, BASELINE_INTERNAL_LINKS=3
    - URL classification: isLegacyTool, isCmsTool, isCmsArticle, isPillar, isOtherCms
    - Cluster detection via CLUSTER_REGISTRY integration
    - Slug normalization utilities for URL/slug consistency
  - Type-specific expected links computation:
    - Cluster tools: siblings + pillar + min(articles, 3)
    - Cluster articles: 3 (pillar + 2 tools)
    - Pillars: all tools + min(articles, 3)
    - Other CMS pages: 3 baseline
    - Legacy tools: null (out of scope)
  - Four-state status system: Ready, Needs Links, Needs Review, Legacy
  - Updated readyInspector.ts to use classifier and compare actual vs expected links
  - SEO Control UI now shows:
    - Status breakdown summary (X Ready, X Needs Links, X Needs Review, X Legacy)
    - Cluster ID displayed under each URL for context
    - Links column color-coded (green=met, orange=under)
    - Filter dropdown with Ready/Needs Links/Needs Review/Legacy options
  - Workflow simplified: Filter by Ready → toggle indexed, ignore Legacy, fix Needs Links
- 2025-12-08: **CMS-Based Product Pages** - Products now render from cms_objects instead of products table
  - Created ProductData type with hero, CTAs, bullets, feature_sections, FAQ, pro_tips, Stripe IDs
  - Built ProductRenderer component for rendering CMS product objects
  - Created VCMRenderer that delegates to appropriate renderer based on content type
  - New /products/[slug] route reads from cms_objects where type='product'
  - products table remains for Stripe webhook plumbing, not content source
  - Discovery endpoint updated to scan cms_objects for products
  - Template: docs/cms-product-template.json shows full product JSON structure
- 2025-12-08: **CMS Bulk Import System** - No-code content management for tools, articles, and products
  - Created cms_objects table to store JSON CMS objects (slug, type, cluster_slug, data JSONB, word_count, health)
  - Added cms_slug column to global_urls for linking CMS objects to URL registry
  - Built bulk import API (/api/admin/cms/bulk-import) with:
    - JSON validation (type, slug required; engine_config required for tools)
    - Auto word count calculation from title, body, FAQ, pro_tips fields
    - Health scoring: thin (<600 words), ok (600-1200), strong (>1200 + FAQ + pro_tips)
    - Upsert to cms_objects and global_urls with proper path mapping
    - Preserves is_indexed flag on updates (won't accidentally de-index pages)
  - Admin UI at /admin/cms-import with validate → import → results workflow
  - Path mapping: tool→/tools/, article→/articles/, mbb→/mbb/, cluster→/tools/clusters/
  - Workflow: Generate CMS JSON in ChatGPT → Paste in admin → Import → Review in SEO Control
- 2025-12-08: **Admin UI Consolidation** - Simplified scattered admin pages into 3 master panels
  - Content Factory (/admin/content-factory): Create clusters, tools, and articles in one place
  - Content Manager (/admin/content-manager): Edit tools, articles, pillars, clusters with tabbed interface
  - SEO Control Center (/admin/seo-control): Combined SEO Health, Ready to Index, URL Registry tabs
  - Created shared AdminLayout component with centralized authentication
  - /admin now redirects to /admin/content-factory, Products moved to /admin/products
  - Workflow mirrors actual use: Create → Edit → Publish
- 2025-12-08: **Ready to Index Auto-Inspector** - Automated SEO readiness evaluation system
  - Added global_urls columns: last_health_score, is_ready_to_index, manual_review_passed, indexed_at
  - Created readyInspector.ts with comprehensive readiness rules:
    - Score >= 75, HTTP 200, not noindex
    - Has title, H1, meta description
    - Schema required for tool/article/blog pages
    - Word count: 300 for articles, 150 for others
    - Internal links >= 3
    - Manual visual review requirement
  - Admin dashboard at /admin/ready-to-index with:
    - Run Inspector and Index All Ready buttons
    - Summary cards (total, ready, needs review, not ready)
    - Filterable table with manual review toggle
    - Detail modal with issues list
  - One-click "Index All Ready Pages" to publish approved pages to sitemap
  - Protected by iron-session admin authentication
- 2025-12-08: **SEO Health Console** - Internal admin tool for site-wide SEO auditing
  - Created seo_health_snapshots table to store crawl results
  - Built SEO scanner module (lib/seo/seoScanner.ts) that crawls indexed pages
  - Extracts SEO signals: title, H1, meta description, word count, internal links, schema, robots meta
  - Calculates overall health score (0-100) with deductions for issues
  - Admin dashboard at /admin/seo-health with summary cards, filters, table, and detail modal
  - Supports filtering by: Critical, Broken, Thin Content, No H1, No Meta, No Schema
  - Protected by iron-session admin authentication
- 2025-12-07: **Global URL Registry** - Centralized indexing control system for SEO
  - Created global_urls database table to track all URLs with indexing status
  - Built auto-discovery API at /api/global-urls/discover to scan app folder
  - Created admin panel at /admin/indexing with search, filters, bulk toggle/delete
  - Sitemap.ts now integrates with registry - only indexed URLs included
  - Uses iron-session for secure admin authentication
  - Removed legacy /ai-chat page and navigation links (orphan page cleanup)
- 2025-12-06: **ToolsRepo Single Source of Truth** - Database-driven tool management
  - Created ToolsRepo abstraction (lib/toolsRepo.ts): getToolBySlug, listTools, createTool, updateTool, upsertTool
  - Extended tools table with 19 new columns: category, tags, icon, priority, input_type, output_type, etc.
  - Migrated 47 legacy tools from toolsRegistry.ts into database (source='legacy', status='published')
  - Total: 79 tools in database (47 legacy + 32 expansion shells)
  - Tool Control Panel now reads exclusively from database via ToolsRepo
  - Created toolsCache.ts for sync access with auto-initialization on module load
  - Updated toolRollout.ts to use cache-first pattern (no registry fallback)
  - JSON configs and toolsRegistry.ts are no longer source of truth - database is authoritative
- 2025-12-06: **Engine Expansion Factory** - Cartesian product-based tool shell generation
  - Created EngineBlueprint schema (lib/engineBlueprint.ts) with dimensions, clusterResolver, linkRules, defaults
  - Built Engine Expansion Generator (lib/engineExpansionGenerator.ts) for idempotent Cartesian expansion
  - All generated shells start as draft (status: "draft", isIndexed: false, inDirectory: false)
  - 4 example blueprints: thumbnail-analyzer, content-analyzer, image-resizer-niche, calculator-niche
  - Admin UI at /admin/engines with "Run Expansion" buttons per blueprint
  - Shows potential shell counts per blueprint (e.g., Platform(7) × ContentType(5) = 35 shells)
  - Link Builder (lib/linkBuilder.ts) auto-wires siblings and articles based on linkRules
  - Database-driven storage: shells insert directly into tools table (no JSON files)
  - Added withTransaction helper in lib/db.ts for atomic batch inserts with proper pool.connect()
- 2025-12-06: **Database-Driven Article System** - Scalable article management for 5K-10K articles
  - Created ArticleContent TypeScript schema in lib/articleTypes.ts for structured JSON content (hero, quickCTA, sections, specs, tips, FAQs, bottomCTA)
  - Built ArticleTemplate component with static Tailwind class mappings (avoids tree-shaking issues)
  - Theme system: instagram, youtube, linkedin, tiktok, twitter, health, social-media - auto-detected from cluster slug or platform field
  - Updated dynamic article route app/articles/[slug]/page.tsx to render structured JSON or legacy HTML content
  - Removed 9 static article pages - all articles now served from database
  - Admin panel already supports filtering, search, and publish/index toggles at /admin/articles
  - Sitemap respects is_indexed flag for SEO control
  - Workflow: AI writes structured JSON content → save to cluster_articles → admin reviews → toggle published → toggle indexed
- 2025-12-06: **Enhanced Article Styling** - Articles now render with tool-page aesthetics
  - Updated articleGenerator.ts to output structured HTML with semantic div classes
  - Created StyledArticleContent component for rendering articles
  - Added comprehensive CSS styling for: article-intro, article-section, article-steps (numbered cards), article-faq (card-based FAQs), article-cta (tool button links)
  - Steps section displays as 3-column grid on desktop with numbered badges
  - FAQ section uses white cards with gray borders matching tool page design
  - CTA section features gradient background with styled tool link buttons
  - Newly generated articles get full visual treatment; existing articles retain basic styling
- 2025-12-06: **Added Article Lifecycle System** - Complete workflow from draft to indexed
  - Added `cluster_slug` and `is_indexed` columns to blog_posts table for cluster wiring and SEO control
  - Created "Create Missing Drafts" button that generates empty article shells for user to fill via Replit AI
  - Updated cluster detail UI with enhanced article status tracking (Missing/Draft/Published/Indexed)
  - Implemented toggle controls for Published and Indexed status with visual badges
  - Tree map shows status indicators: ✕ missing, ◐ draft, ● published, ★ indexed
  - Sitemap now only includes posts where `is_indexed = true`
  - Blog pages respect `is_indexed` for robots meta tag (noindex when false)
  - Workflow: Create drafts → Fill content → Toggle Published → Toggle Indexed (for search engines)
- 2025-12-06: **Added Cluster Control Panel** - Macro-view for managing topical authority clusters
  - Created /admin/clusters dashboard showing all clusters with health scores
  - Built lib/clusterHealth.ts with calculateClusterHealth() scoring (0-100):
    - pillarScore (25pts) + toolsScore (25pts) + articlesScore (25pts) + interlinkScore (25pts)
    - Status: ready (80+), needs-work (50-79), incomplete (<50)
  - Cluster detail page /admin/clusters/[clusterSlug] with:
    - Visual cluster map (tree structure: Pillar → Tools + Articles)
    - Tools table with indexed/draft status
    - Supporting articles list
    - Health score breakdown by category
  - Filter by status (Ready/Needs Work/Incomplete) and engine type
  - Issues displayed as red tags showing what's missing
- 2025-12-06: **Built Pre-Indexing Safety System** - Tools must have complete interlinking before indexing
  - Created dynamic pillar pages at /tools/clusters/[clusterSlug] aggregating tools by cluster
  - Created category pages at /tools/categories/[categorySlug] filtering tools by category
  - Built validateToolInterlinking() with 4 checks: hasPillar, hasCategory, hasSiblings (2+), hasFunnelCTA
  - Admin shows "Link Status" column with Ready/Incomplete/Not Ready badges
  - Added link status filter dropdown for easier cluster management
  - API blocks isIndexed=true toggle unless all interlinking requirements pass
  - Pattern: Upward links (→pillar, →category) + horizontal links (↔siblings) + downward funnel (→VCM OS)
- 2025-12-06: **Wired Indexed Toggle for SEO Control** - Admin toggle now controls Google indexing
  - Created lib/toolRollout.ts with isToolIndexed(), getAllIndexedTools(), getRobotsDirective()
  - Sitemap.xml only includes tools where isIndexed=true
  - Tool layouts use generateMetadata() with getRobotsDirective(slug) for request-time robots tag
  - Indexed=ON: robots "index, follow" + included in sitemap
  - Indexed=OFF: robots "noindex, nofollow" + excluded from sitemap
  - Pattern: Update tool layouts from static metadata to generateMetadata() function for dynamic control
- 2025-12-06: **Formalized Engine Architecture** - VASE infrastructure for scaling to 10,000+ tools
  - Extended Tool type with engineType, inputType, outputType, relatedTools, relatedArticles
  - Added all new metadata fields to 47 existing tools
  - Created `/engines` folder with engine registry and configurations
  - Documented 13 engine types: platform-resizer, image-compress, calculator, ai-analysis, etc.
- 2025-12-06: **Added VCM Tools Directory** - Central hub for all tools with premium design
  - Created `/tools` page "VCM Tools Explorer" with search, tag filters, and category sections
  - Implemented `toolsRegistry.ts` data file with 47+ tools organized by 10 categories
  - Added weighted search ranking (name matches > tag matches > description matches)
  - Created `/tools/all` page with alphabetical listing and letter navigation
  - Added ItemList, SiteNavigationElement, and WebPage JSON-LD schema for SEO
  - Added "Tools Directory" footer link on homepage
  - Categories: Creator, Image, Video, Writing, Social, Business, File, Calculators, Utilities, AI
  - MBB tools included in categories but not highlighted as MBB (maintains luxury brand)
- 2025-12-06: **Added Platform Image Resizer Suite** - Shared engine architecture for platform-specific image resizers
  - Created shared `PlatformImageToolClient` component with upload, preview, resize, download
  - Created `platformImagePresets.ts` registry with TypeScript types and preset configurations
  - Created API route `/api/platform-image/resize` using sharp for server-side processing
  - 6 platform-specific tools: YouTube Thumbnail (1280×720), Instagram Post (1080×1080), Instagram Story (1080×1920), TikTok Cover (1080×1920), Twitter Header (1500×500), LinkedIn Banner (1584×396)
  - Each tool has unique SEO metadata, FAQ section with JSON-LD schema, and platform-specific tips
  - Architecture designed for easy expansion - adding new platforms requires only preset config + thin page shell
- 2025-12-05: **Added Maker Quotes Generator MBB** - Quote generator for creators (targets "maker quotes generator")
  - Created `/tools/maker-quotes-generator` with 75+ curated quotes, 5 themes (Creativity, Persistence, Innovation, Entrepreneurship, Failure & Learning), 4 tones (Motivational, Serious, Funny, Short & Punchy), 3 formats (Quote Only, Quote + Author, Social Caption)
  - Copy-to-clipboard functionality for generated quotes
  - Two supporting articles: `/mbb/how-makers-use-quotes` and `/mbb/famous-quotes-for-creators`
  - Full SEO optimization with FAQ JSON-LD schema, keyword prominence in H1/opening paragraph
- 2025-12-05: **Added Estimator for Car Repair MBB** - Car repair cost calculator (targets "estimator for car repair")
  - Created `/tools/estimator-for-car-repair` main calculator with make, model, year, repair type, severity, labor rate, ZIP code inputs
  - 10 repair types: Brake Pads, Check Engine, Alternator, Battery, AC, Oil Leak, Transmission, Engine Misfire, Wheel Alignment, Custom
  - 3 severity levels (Minor/Moderate/Major) affecting labor hours
  - Regional pricing adjustment based on ZIP code (East Coast +5%, West Coast +10%, Midwest baseline)
  - Two supporting articles: `/mbb/common-car-repair-costs` and `/mbb/how-car-repairs-are-priced`
  - Full SEO optimization with FAQ schema, keyword prominence in H1/H2/opening paragraph
- 2025-12-05: **Added Loan Estimator Home MBB** - Mortgage payment calculator (targets "loan estimator home")
  - Created `/tools/loan-estimator-home` main calculator with home price, down payment ($/%), loan term, APR, taxes, insurance, HOA inputs
  - Calculates monthly P&I, taxes, insurance, HOA breakdown with total cost and interest
  - Two supporting articles: `/mbb/home-loan-basics` and `/mbb/mortgage-types-explained`
  - Full SEO optimization with FAQ schema, keyword prominence in H1/H2/opening paragraph
  - All monetization components: MonetizationBar, PostResultUpsell
  - Complete cross-linking between all 3 pages
- 2025-12-05: **Added 401k Retirement Estimator MBB** - 401k retirement calculator (targets "estimate 401k at retirement")
  - Created `/tools/401k-retirement-calculator` main calculator with current age, retirement age, balance, salary, contributions, employer match, and return rate inputs
  - Year-by-year projection table showing salary, contributions, and balance growth
  - Employer match automatically capped at employee contribution percentage (realistic 401k matching behavior)
  - Two supporting articles: `/mbb/how-401k-compound-growth-works` and `/mbb/401k-vs-ira-retirement`
  - Full SEO optimization with FAQ schema, keyword prominence in H1/H2/opening paragraph
  - All monetization components: MonetizationBar, PostResultUpsell
  - Updated admin MBB tracking page with new entry and supporting article links
- 2025-12-05: **Added UPS Shipping Cost Estimator MBB** - UPS shipping cost calculator (targets "estimate ups shipping cost")
  - Created `/tools/ups-shipping-cost` main calculator with weight, dimensions, ZIP codes, and service level selection
  - Uses 3-digit ZIP prefix lookup with Haversine distance formula for accurate zone calculation
  - Calculates both actual weight and dimensional weight, applying the higher
  - Supports UPS Ground, 2nd Day Air, and Next Day Air pricing estimates
  - Two supporting articles: `/mbb/ups-shipping-rates-explained` and `/mbb/ups-ground-vs-air`
  - Full SEO optimization with FAQ schema, keyword prominence in H1/H2/opening paragraph
  - All monetization components: MonetizationBar, PostResultUpsell
  - Updated admin MBB tracking page with new entry and supporting article links
- 2025-12-04: **Added Calorie Counter Maintenance MBB** - TDEE/Maintenance calorie calculator (targets "calorie counter maintenance")
  - Created `/tools/calorie-counter-maintenance` main calculator page with Mifflin-St Jeor formula
  - Calculates BMR, maintenance calories (TDEE), deficit/surplus suggestions
  - Two supporting articles: `/articles/what-are-maintenance-calories` and `/articles/maintenance-vs-deficit-vs-surplus`
  - Full SEO optimization with metadata, FAQ schema JSON-LD, calorie tables
  - All monetization components: MonetizationBar, PostResultUpsell
  - Updated admin MBB tracking page with new entry
- 2025-12-04: **Added MBB Management System** - Admin dashboard for Micro-Blog Business tools
  - Created `/admin/mbbs` page to list all MBB tools (hidden from public navigation)
  - Added "Manage MBBs" button to admin dashboard header
  - MBBs are SEO-focused tools that don't clutter the main site navigation
- 2025-12-04: **Added Calorie Counter Walking MBB** - Walking calorie calculator (targets "calorie counter walking")
  - Created `/tools/calorie-counter-walking` main calculator page
  - MET-based calculation formula with duration, weight, and intensity inputs
  - Two supporting articles: `/articles/steps-vs-calories-walking` and `/articles/walking-for-fat-loss`
  - Full SEO optimization with metadata, FAQ schema JSON-LD, calorie tables
  - All monetization components: MonetizationBar, PostResultUpsell
- 2025-12-04: **Added Name Combiner Tool** - Free name blending/mashup generator (targets "combiner name" keyword)
  - Created `/tools/name-combiner` page for combining 2-3 names into unique mashups
  - Features 5 combination styles: Balanced, Cute, Edgy, Fantasy, Brandable
  - Robust algorithm with half-and-half, overlap, vowel-based, and syllable blending
  - Reliably produces 20 suggestions for all input types including short names
  - Use cases: couple names, baby names, brand names, usernames, team names
  - One-click copy to clipboard functionality
  - Full SEO booster sections and FAQ schema JSON-LD
  - Added to ExploreMoreTools component
- 2025-12-03: **Added Prediction Center Tool** - Community prediction voting hub
  - Created `/tools/prediction-center` page for voting on future event predictions
  - Database tables: predictions (question, category, close_date, status, outcome), prediction_votes (anonymous Yes/No)
  - Submit new predictions with question, description, category, and optional close date
  - Vote Yes or No on any open prediction (cookie-based anonymous voting)
  - Real-time vote percentages with color-coded progress bars
  - Category filter and sorting (trending, newest, closing soon)
  - SEO structured data with JSON-LD WebApplication schema
  - Added to navbar Resources > Community, tools index, homepage carousel, sitemap
  - Fixed Next.js 15+ async cookies() compatibility in vote API routes
- 2025-12-02: **Added PDF Editor Tool** - Free online PDF editor targeting "pdf editor website" keyword
  - Created `/tools/pdf-editor` page with client-side PDF manipulation using pdf-lib
  - Upload PDF, view page thumbnails with page numbers
  - Drag-and-drop page reordering with visual feedback
  - Rotate pages left/right in 90-degree increments
  - Delete unwanted pages with confirmation
  - Duplicate pages for repeated content
  - Reset all changes to original state
  - Download edited PDF with modifications applied
  - All processing happens in browser - files never leave user's device
  - Privacy-focused: no server upload, no watermarks, no signup required
  - Full SEO: title, meta, keywords, FAQ section, structured data (JSON-LD)
  - Added to navbar Resources dropdown (Utilities), tools index, homepage, sitemap, ExploreMoreTools
- 2025-12-02: **Added Saved Items Feature** - Bookmark icon to save products for later
  - Created CartContext in `/contexts/CartContext.tsx` with localStorage persistence
  - Saved items persist across browser sessions
  - Bookmark icon in navbar with item count badge
  - Dropdown panel shows saved items, total price, and remove items
  - Created `/saved` page for full saved items view with checkout summary
  - Added "Save for Later" button to product pages alongside claim/buy button
  - Saved items sync across all pages via React Context
- 2025-12-02: **Added AI Calorie Deficit Calculator** - Food and health app screenshot analyzer targeting "calorie counter deficit" keyword
  - Created `/tools/calorie-deficit-calculator` page with dual image upload (food photo + optional health screenshot)
  - Uses OpenAI gpt-4o vision model for food calorie estimation and health app reading
  - Analyzes food photos to estimate calories, confidence, and breakdown by items
  - Reads Health/Fitness app screenshots to extract active and total calories burned
  - Calculates calorie deficit or surplus with weekly projections (kg/lbs)
  - Color-coded status badges: green for deficit, red for surplus, gray for even
  - Rate limited: 15 calculations per hour per IP
  - Full SEO: title, meta description, FAQ section, how-it-works, disclaimer
  - Added to navbar Resources dropdown, tools index, homepage grid, sitemap, ExploreMoreTools
- 2025-12-02: **Added Outfit Ideas Generator Tool** - AI-powered style finder targeting "outfit ideas" keyword
  - Created `/tools/outfit-ideas` page for uploading outfit photos and finding similar items to shop
  - Uses OpenAI gpt-4o-mini vision model to analyze images and detect clothing items
  - Generates search keywords for each detected item (tops, pants, shoes, accessories, etc.)
  - SerpAPI Google Shopping integration for product results (falls back to Google Shopping URLs if no API key)
  - Created `/r` redirect route for affiliate link tracking (future APE integration ready)
  - Product cards with images, prices, merchant names, and "Shop" links
  - Rate limited: uses OpenAI Vision per request
  - Full SEO: title, meta description, FAQ section, educational content
  - Added to navbar, tools index, homepage, sitemap, ExploreMoreTools
- 2025-11-30: **Added VCM Summarizer Tool** - AI text summarizer and key points extractor
  - Created `/tools/summarizer` page targeting "summarizer", "summarizer generator", "AI summarizer", "text summarizer" keywords
  - Paste any text (articles, essays, emails, notes) and get a clean summary + bullet-point key takeaways
  - Options: "Simpler language" mode and "Bullet points only" mode
  - Input validation: minimum 200 chars, max 8000 chars (truncates with notice)
  - Real-time word/character count display
  - Copy summary, takeaways, or all at once
  - Rate limited: 15 summaries per hour per IP
  - Full SEO: title, meta description, H1 with keywords, FAQ section, how-it-works explainer
  - Added to navbar, tools index, homepage, sitemap, ExploreMoreTools
- 2025-11-30: **Added Internal Link in SEO Audit Tool** - Website internal linking analyzer
  - Created `/tools/internal-link-seo-audit` page targeting "internal link in seo" keyword
  - Enter domain or sitemap URL to analyze internal linking structure
  - Fetches sitemap automatically or uses direct sitemap URL
  - Crawls up to 150 pages, extracts all internal links
  - Identifies orphan pages (0 inbound links)
  - Identifies weak pages (1-2 inbound links)
  - Shows top linked pages (most connected content)
  - Provides actionable suggestions for improving internal links
  - Rate limited: 5 audits per hour per IP
  - Full SEO: title, meta description, FAQ section, educational content
  - Added to navbar, tools index, homepage, sitemap
- 2025-11-30: **Added Ad Copy Analyzer Tool** - AI-powered ad copy analysis and improvement
  - Created `/tools/ad-copy-analyzer` page targeting "ad copy" keyword
  - Analyze competitor ads with 7-point scoring system (hook, clarity, benefits, proof, specificity, CTA, platform fit)
  - Compare your own ad against competitor ads
  - Get AI-generated improved versions (Safe Upgrade, Bold Version)
  - Hook lines, headlines, and CTA suggestions
  - Platform-specific and audience-specific recommendations
  - Sample ad button for quick testing
  - Rate limited: 10 analyses per hour per IP
  - Full SEO: title, meta description, FAQ section, educational content
  - Added to navbar, tools index, homepage, sitemap
- 2025-11-30: **Added Producer Tag Generator Tool** - AI voice tags for music producers
  - Created `/tools/producer-tag-generator` page targeting "producer tag" keyword
  - Upload MP3/WAV files (max 30MB) and add producer tags at intervals
  - Custom AI voice generation using OpenAI TTS (5 voice styles)
  - Default VCM Suite tags also available
  - Configurable tag interval (5-60 seconds) and volume adjustment
  - FFmpeg-based audio processing with tag mixing
  - Rate limited: 5 generations per hour per IP
  - Files auto-cleanup after 30 minutes
  - Full SEO: title, meta description, FAQ section, educational content
  - Added to navbar, tools index, homepage, sitemap
- 2025-11-29: **Added AI Humanizer Free Tool** - AI text detector and humanizer
  - Created `/tools/ai-humanizer-free` page targeting "ai humanizer free" keyword
  - Analyze function: Detects AI probability (0-100%), shows why text sounds AI-like
  - Humanize function: Rewrites AI text to sound more natural and human
  - Shows annotated text with AI-sounding segments highlighted
  - Provides specific suggestions for making text sound more human
  - Rate limited: 15 analyses / 10 humanizations per hour per IP
  - Full SEO: H1, meta description, FAQ section, canonical URL
  - Added to navbar Resources dropdown, tools index, homepage, sitemap
- 2025-11-29: **Added Reach Grabber Tool** - AI-powered SEO content optimizer
  - Created `/tools/reach-grabber-tool` page with full SEO optimization
  - Users enter target keyword phrase and paste their blog content
  - AI optimizes content for better search rankings using gpt-4o-mini
  - Shows SEO Snapshot with word count, keyword mentions, and density percentage
  - Copy to clipboard functionality for optimized content
  - Rate limited: 10 optimizations per hour per IP
  - Full SEO content sections: How it works, How to use, Why use it, FAQs
  - Added to navbar Resources dropdown, tools index, homepage, and sitemap
- 2025-11-29: **Homepage Redesign with VCM OS CTAs**
  - Added colorful app cards at top (APE, QR Social, Nudge, Stemly, C-Score)
  - Pill-shaped search bar with orange arrow button
  - "Open VCM OS" button linking to vcmos.io (primary conversion goal)
  - "Browse Tools" button for exploring free tools
  - Popular tool chips below search bar
  - Rebranded from "VCM Hub" to "VCM Suite" with "Creator Campus" tagline
- 2025-11-29: **Major Design System Overhaul** - Migrated from yellow to orange accent color
  - Updated globals.css with new orange primary color variables
  - Changed all stone-* colors to gray-* for consistency
  - Updated all 11+ tool pages, UI components, and forms to use orange-500/600
  - Redesigned navbar, homepage, buttons, inputs, dialogs, selects
  - ExploreMoreTools component now uses white background with orange CTA
  - Creates unified brand identity between VCM Suite and VCM OS
- 2025-11-28: **Added AI Thumbnail Coach** - Free YouTube thumbnail analyzer tool
  - Upload thumbnail images (PNG, JPEG, WebP up to 5MB)
  - Uses OpenAI gpt-4o vision model for AI-powered analysis
  - Scores 6 metrics (0-100): Clarity, Intrigue, Emotion, Contrast, Readability, Composition
  - Shows overall verdict, what's working, what to improve, and concrete suggestions
  - Chat interface below analysis for follow-up questions with AI coach
  - No authentication required - completely free tool
  - Added to navbar Resources dropdown, homepage tools section, and sitemap
- 2025-11-28: **Added VCM Resource Box** - Free shareable link card generator
  - Create resource boxes with up to 4 links (external URLs or VCM internal tools)
  - Each box gets unique URL and iframe embed code
  - No authentication required - completely free tool
  - Database tables: resource_boxes, box_items, internal_resources
- 2025-11-27: **Added VCM Answers** - Quora-style Q&A engine for SEO
  - Created questions and question_votes database tables
  - Built /answers landing page with search, newest, and trending sections
  - Built /answers/new question submission form
  - Built /answers/[slug] question detail pages with QAPage schema for SEO
  - Added voting system with session-based one-vote-per-question
  - Added admin answer capability (dimitrioslowe@gmail.com only)
  - Integrated into sitemap for Google indexing
  - Added to homepage ecosystem and hero search
- 2025-11-27: **Transformed Homepage to Hub/Campus Model** - Complete homepage redesign
  - New hero with big search bar (autocomplete suggestions for tools/products)
  - "Open VCM OS" + "Browse Tools" CTA buttons
  - Featured tools row showing Popular: QR Social, C-Score, APE, Logo Gen, Keywords
  - Latest Drops strip (dark bar showing newest products with prices)
  - Microtools/Free Tools grid with 9 free tools
  - VCM Media Hub section showing latest blog posts
  - For Creators & Entrepreneurs category section
  - Ecosystem Overview grid linking to all products
  - Ideas Hub Highlights showing community ideas
  - Dark mode email capture section
  - Created /tools index page with category groupings
  - Created HeroSearch component with keyboard navigation
  - Updated branding from "VCM Store" to "VCM"
- 2025-11-27: **Added VCM Ideas Hub** - Reddit-style community ideas feed
  - Created `/ideas` with Hot/New/Top sorting (hot uses decay algorithm)
  - Idea submission form at `/ideas/new` with structured fields
  - Idea detail pages at `/ideas/[slug]` with full content sections
  - Session-based upvoting (toggle on/off, one vote per session per idea)
  - Anonymous commenting system with real-time updates
  - Database tables: ideas, idea_votes, idea_comments
  - SEO optimized with proper meta tags and sitemap entries
  - Added to navbar Resources dropdown
- 2025-11-27: **Restructured Affirmation Tool to Daily Model**
  - Changed from on-demand to daily caching (like horoscope)
  - Same affirmation all day for each area + tone combo
  - Refreshes at midnight UTC
  - Increases user retention and daily return visits
- 2025-11-26: **Added Emoji Combos Tool** - Aesthetic emoji combination generator
  - Created `/tools/emoji-combos` with 100 curated emoji combinations
  - Filter by category (cute, aesthetic, funny, flirty, meme, etc.)
  - Search by keyword (matches combo, label, or tags)
  - One-click copy to clipboard with toast notification
  - Random combo button with highlight animation
  - SEO optimized for "emoji combos" keyword
- 2025-11-26: **Added Visualization Tool** - Text-to-diagram generator
  - Created `/tools/visualization` with React Flow for diagram rendering
  - Parses indented text to create hierarchical diagrams
  - Supports left-to-right and top-to-bottom layouts
  - PNG export functionality via html-to-image
  - 100% client-side, no backend/API calls needed
  - Perfect for visualizing funnels, workflows, and content systems
- 2025-11-26: **Added Keyword Finder Tool** - Low-competition SEO keyword research
  - Created `/tools/keyword-finder` with AI-powered keyword suggestions
  - Uses OpenAI chat completions to estimate difficulty, volume, intent
  - Generates long-tail, low-difficulty keyword opportunities
  - Sortable results table with copy/CSV export
  - Rate limited: 10 searches per hour per IP
  - SEO content explaining the tool and integration with VCM products
- 2025-11-26: **Added Logo Generator Tool** - AI-powered logo maker with chat interface
  - Created `/tools/logo-generator` with natural language chat input
  - Users describe their vision in their own words (not form fields)
  - Uses OpenAI gpt-image-1 model via Replit AI Integrations
  - Generates 4 unique variations per request (minimalist, bold, icon-focused, abstract)
  - Click-to-download PNG files at 1024x1024 resolution
  - Rate limited: 5 generations per hour per IP
  - Example prompts to help users get started
  - Conversational UI with message history
  - JSON-LD schema for SEO
  - Added to navigation dropdown and sitemap
- 2025-11-26: **Added Word Counter Tool** - Free word/character counting tool
  - Created `/tools/word-counter` page with real-time text analysis
  - Counts words, characters (with/without spaces), sentences, paragraphs
  - Calculates reading time (200 wpm) and reading level (Flesch-Kincaid)
  - Keyword density analysis showing top 10 non-stop-words
  - 100% client-side processing - no server calls, complete privacy
  - JSON-LD schema for SoftwareApplication and FAQPage
  - Added to navigation dropdown and sitemap
- 2025-11-26: **Added Image Compressor Tool** - Free JPG/PNG/WebP compression tool
  - Created `/tools/image-compressor` page with full SEO content
  - Uses Sharp for high-quality lossy and lossless compression
  - Three compression levels: Light (best quality), Balanced, Maximum (smallest file)
  - Supports JPG, PNG, and WebP formats up to 10MB
  - Rate limiting: 20 compressions per hour per IP
  - JSON-LD schema for SoftwareApplication and FAQPage
  - APE product CTA integration for monetization
  - Added to navigation dropdown and sitemap
- 2025-12-01: **Added HEIC to JPG Converter Tool** - Free conversion tool targeting "heic u jpg" keyword
  - Created `/tools/heic-to-jpg` page with client-side HEIC conversion
  - Uses heic2any library for HEIC/HEIF to JPG conversion (dynamically imported for SSR compatibility)
  - JSZip for batch downloads of multiple converted images (dynamically imported)
  - Supports quality adjustment (1-100%) and optional resizing
  - Batch processing up to 20 files simultaneously
  - 100% client-side - no server uploads, complete privacy
  - SEO-optimized with keyword targeting in meta descriptions and FAQ content
  - JSON-LD schema for SoftwareApplication and FAQPage
  - **IMPORTANT**: Browser-only libraries (heic2any, JSZip) must use dynamic import pattern:
    `const heic2any = (await import('heic2any')).default;`
- 2025-12-01: **Added GIF Maker Tool** - Create GIFs from video files
  - Uses FFmpeg WASM for client-side video-to-GIF conversion
  - Supports MP4, WebM, AVI, MOV, MKV video formats
  - Configurable FPS (5-30), width (100-800px), and quality
  - Preview of video before conversion
- 2025-11-26: **Added GIF Compressor Tool** - Free web tool to drive SEO traffic
  - Created `/tools/gif-compressor` page with premium white/gray/gold styling
  - Three compression levels: Light (best quality), Balanced, Maximum (smallest file)
  - Uses ffmpeg with palette optimization for quality compression
  - Rate limiting: 20 compressions per hour per IP
  - Automatic file cleanup on failure and after 10 minutes
  - Keyboard accessible drag & drop upload with ARIA labels
  - SEO-optimized with full content sections (What is, Why, How to, Features, FAQ)
  - APE product CTA integration for monetization
- 2025-11-18: **Increased File Upload Limit** - Raised maximum upload size from 10MB to 50MB
  - Updated server-side validation in `/api/upload/route.ts` to allow 50MB files
  - Increased client-side limits in all uploader components (ImageUploader, InlineUploader, ObjectUploader)
  - Enables uploading larger GIFs and high-quality images to Media Library
  - Updated UI text to display "max 50MB" in upload interfaces
- 2025-11-06: **Added Feedback System** - User feedback form with categorized submissions
  - Created feedback database table to store submissions
  - Built FeedbackDialog component with 4 feedback types (bug, feature, improvement, general)
  - Added feedback button to homepage footer with premium white/gray/gold styling
  - Created API endpoint for secure feedback submission
  - Includes optional email field for follow-up and priority levels
  - Successfully tested and verified submissions are saved to database
- 2025-11-06: **Transformed Newsletter into Full Blog System** - SEO-optimized WordPress-style blog
  - WordPress-style content editor with rich text formatting toolbar
  - Image upload capabilities (featured images and inline content images)
  - Category system with many-to-many relationships
  - Post scheduling and draft management
  - SEO optimization: custom slugs, meta descriptions, sitemap.xml, robots.txt
  - Google Search Console verification (meta tag + HTML file)
  - First blog post "Testing1" published successfully at /newsletter/testing1
  - Fixed sidebar layout locked at 320px width to prevent expansion during uploads
- 2025-11-03: **Implemented Email + Password Authentication** - Complete post-purchase authentication system
  - Users create accounts AFTER purchasing (browse anonymously, authenticate only when buying)
  - Signup: Email + password (8+ characters), hashed with bcrypt, auto-login after signup
  - Login: Email + password verification with proper session management
  - Pending purchase system: Webhook stores purchases with NULL user_id when user doesn't exist
  - Claim purchases: After signup/login, pending purchases are matched to user via Stripe payment intent
  - SessionManager: Detects if user exists → shows signup or login form accordingly
  - iron-session: Cookie-based session management for secure authentication
  - Purchase flow: Stripe checkout → redirect → signup/login → claim purchases → access dashboard
- 2025-11-03: **Migrated to Replit Object Storage** - Fixed image storage for production deployment
  - All product images and downloads now stored in Replit Object Storage
  - Created `/api/files/[filename]` route to serve files from Object Storage
  - Fixed Next.js 15+ async params compatibility issue
  - Disabled Next.js image optimization to prevent URL mangling
  - Upload system configured to use `@replit/object-storage` package
  - Images accessible on both dev and production environments
  - Note: Product images need to be re-uploaded through admin interface
- 2025-11-03: **Switched to external Neon database** - Configured shared database for dev and production
  - Created external Neon PostgreSQL database (same setup as APE)
  - All 7 tables created: products, users, posts, entitlements, purchases, subscribers, profiles
  - One unified database - changes in testing instantly appear on live site
  - Removed retry logic (not needed for external Neon)
  - Server restarted and working properly
- 2025-11-01: Initial project setup with Next.js 14, database schema, and all core pages
  - Database tables created for products, users, entitlements, posts, subscribers
  - Implemented public browsing with authentication on claim/purchase
  - Added Stripe checkout integration and webhook handler
  - Created email capture component used throughout the site
  - Set up AI strategy chat with mock responses

## User Preferences
None specified yet.

## Authentication Flow

### Purchase Flow (New Customers)
1. Customer browses products anonymously (no account required)
2. Customer clicks "Buy Now" → Stripe Checkout (collects email)
3. Stripe redirects to `/dashboard?session_id=XXX`
4. SessionManager checks if email exists in users table
5. If no account exists → SignupForm (email prefilled, set password)
6. User creates account → Auto-login with iron-session
7. Claim purchases endpoint matches pending purchases by Stripe payment intent email
8. Purchases transferred from NULL user_id to new user's ID
9. Entitlements granted → User sees purchased products in dashboard

### Login Flow (Returning Customers)
1. Customer visits `/dashboard`
2. If no session → LoginForm displayed
3. Enter email + password → Verify with bcrypt
4. Create iron-session → Redirect to dashboard with purchases

### Security Features
- Passwords hashed with bcrypt (min 8 characters)
- iron-session for secure cookie-based authentication
- Pending purchases stored with NULL user_id until claimed
- Email matching via Stripe payment intent for claim verification

## Next Steps
- Add real AI integration (OpenAI/Anthropic)
- Add email sending for purchase confirmations
- Create admin panel for product management
- Add product search and filtering
- Implement SEO optimization with metadata

---

**For system design, architectural rules, and single-source-of-truth definitions, see ARCHITECTURE.md.**
