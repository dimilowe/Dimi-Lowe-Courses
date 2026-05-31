import { query } from './db';
import { getClusterById } from '@/data/clusterRegistry';
import { ArticleContent } from './articleTypes';
import OpenAI from 'openai';

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY
});

export interface ArticleStatus {
  slug: string;
  title: string;
  exists: boolean;
  isDraft: boolean;
  isPublished: boolean;
  isIndexed: boolean;
  contentLength: number;
}

export interface GeneratedArticle {
  title: string;
  content: string;
  excerpt: string;
  metaDescription: string;
}

function slugToTitle(slug: string): string {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function detectPlatform(slug: string, clusterSlug: string): string {
  const combined = `${slug} ${clusterSlug}`.toLowerCase();
  if (combined.includes('instagram')) return 'instagram';
  if (combined.includes('youtube')) return 'youtube';
  if (combined.includes('linkedin')) return 'linkedin';
  if (combined.includes('tiktok')) return 'tiktok';
  if (combined.includes('twitter') || combined.includes('x-header')) return 'twitter';
  if (combined.includes('health') || combined.includes('calorie') || combined.includes('fitness') || combined.includes('walking')) return 'health';
  return 'default';
}

function getIconForPlatform(platform: string): string {
  const icons: Record<string, string> = {
    'instagram': 'Instagram',
    'youtube': 'Youtube',
    'linkedin': 'Linkedin',
    'tiktok': 'Music',
    'twitter': 'Twitter',
    'health': 'Heart',
    'default': 'FileImage'
  };
  return icons[platform] || 'FileImage';
}

function getThemeColors(platform: string): { iconColor: string; bgGradient: string; borderColor: string; buttonGradient: string; buttonHoverGradient: string } {
  const themes: Record<string, any> = {
    'instagram': {
      iconColor: 'text-pink-600',
      bgGradient: 'from-pink-50 to-purple-50',
      borderColor: 'border-pink-200',
      buttonGradient: 'from-pink-500 to-purple-500',
      buttonHoverGradient: 'from-pink-600 to-purple-600'
    },
    'youtube': {
      iconColor: 'text-red-600',
      bgGradient: 'from-red-50 to-orange-50',
      borderColor: 'border-red-200',
      buttonGradient: 'from-red-500 to-red-600',
      buttonHoverGradient: 'from-red-600 to-red-700'
    },
    'linkedin': {
      iconColor: 'text-blue-600',
      bgGradient: 'from-blue-50 to-indigo-50',
      borderColor: 'border-blue-200',
      buttonGradient: 'from-blue-600 to-blue-700',
      buttonHoverGradient: 'from-blue-700 to-blue-800'
    },
    'tiktok': {
      iconColor: 'text-gray-900',
      bgGradient: 'from-pink-50 to-cyan-50',
      borderColor: 'border-pink-200',
      buttonGradient: 'from-gray-900 to-gray-800',
      buttonHoverGradient: 'from-gray-800 to-gray-700'
    },
    'twitter': {
      iconColor: 'text-blue-500',
      bgGradient: 'from-blue-50 to-sky-50',
      borderColor: 'border-blue-200',
      buttonGradient: 'from-blue-400 to-blue-500',
      buttonHoverGradient: 'from-blue-500 to-blue-600'
    },
    'health': {
      iconColor: 'text-orange-600',
      bgGradient: 'from-orange-50 to-amber-50',
      borderColor: 'border-orange-200',
      buttonGradient: 'from-orange-500 to-orange-600',
      buttonHoverGradient: 'from-orange-600 to-orange-700'
    },
    'default': {
      iconColor: 'text-orange-600',
      bgGradient: 'from-orange-50 to-amber-50',
      borderColor: 'border-orange-200',
      buttonGradient: 'from-orange-500 to-orange-600',
      buttonHoverGradient: 'from-orange-600 to-orange-700'
    }
  };
  return themes[platform] || themes['default'];
}

export async function generateArticleContent(
  articleSlug: string,
  clusterSlug: string
): Promise<GeneratedArticle> {
  const cluster = getClusterById(clusterSlug);
  if (!cluster) {
    throw new Error(`Cluster not found: ${clusterSlug}`);
  }

  const platform = detectPlatform(articleSlug, clusterSlug);
  const heroIcon = getIconForPlatform(platform);
  const themeColors = getThemeColors(platform);
  
  const primaryTool = cluster.toolSlugs[0] || '';
  const secondaryTool = cluster.toolSlugs[1] || '';

  const jsonSchema = `{
  "hero": {
    "icon": "${heroIcon}",
    "title": "Your SEO Title Here",
    "subtitle": "2-3 sentences explaining what this guide covers and the value it provides.",
    "platform": "${platform}"
  },
  "quickCTA": {
    "icon": "Zap",
    "iconColor": "${themeColors.iconColor}",
    "bgGradient": "${themeColors.bgGradient}",
    "borderColor": "${themeColors.borderColor}",
    "buttonGradient": "${themeColors.buttonGradient}",
    "buttonHoverGradient": "${themeColors.buttonHoverGradient}",
    "title": "Quick Action Title",
    "description": "Short description of what the tool does.",
    "buttonText": "Try Tool Name",
    "toolSlug": "${primaryTool}"
  },
  "sections": [
    {
      "heading": "Section Heading",
      "icon": "IconName",
      "iconColor": "${themeColors.iconColor}",
      "paragraphs": ["Paragraph 1...", "Paragraph 2..."],
      "specs": [
        {"label": "Spec Name", "value": "Spec Value", "icon": "IconName", "iconColor": "bg-color-100 text-color-600"}
      ],
      "tips": [
        {"title": "Tip Title", "content": "Tip content..."}
      ],
      "proTip": "Optional pro tip text"
    }
  ],
  "faqs": [
    {"question": "FAQ question?", "answer": "FAQ answer..."}
  ],
  "bottomCTA": {
    "heading": "Call to Action Heading",
    "description": "Description encouraging tool use.",
    "primaryTool": {"slug": "${primaryTool}", "name": "${slugToTitle(primaryTool)}"},
    "secondaryTool": {"slug": "${secondaryTool}", "name": "${slugToTitle(secondaryTool)}"}
  }
}`;

  const prompt = `You are an expert SEO content writer for VCM Suite. Generate a comprehensive article in STRUCTURED JSON format.

ARTICLE TOPIC: "${slugToTitle(articleSlug)}"
CLUSTER: "${cluster.pillarTitle}"
PRIMARY KEYWORD: "${cluster.primaryKeyword}"
RELATED KEYWORDS: ${cluster.relatedKeywords.join(', ')}
PLATFORM: ${platform}
AVAILABLE TOOLS: ${cluster.toolSlugs.map(s => slugToTitle(s)).join(', ')}

Generate a complete article following this EXACT JSON structure:

${jsonSchema}

CONTENT REQUIREMENTS:
1. hero.title: SEO-optimized, 50-60 characters, include primary keyword
2. hero.subtitle: 2-3 engaging sentences explaining the article value
3. sections: Create 4-6 sections with:
   - First section: Overview/intro with specs cards (4 key specs)
   - Middle sections: Detailed how-to content with tips arrays (3-5 tips each)
   - Include proTip in at least 2 sections
   - Use appropriate icons: Maximize, Image, Calculator, Heart, Activity, Scale, TrendingUp, Target, Footprints, Clock, FileImage, Video, Smartphone, CheckCircle, AlertTriangle, Zap, Eye, Type
4. faqs: 4-5 common questions with detailed answers
5. bottomCTA: Encourage using the tools with compelling copy

ICON COLOR FORMATS:
- For specs iconColor: use "bg-{color}-100 text-{color}-600" format (e.g., "bg-pink-100 text-pink-600")
- For section iconColor: use "text-{color}-500" format (e.g., "text-pink-500")

OUTPUT: Return ONLY valid JSON, no markdown, no code blocks, no explanation.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: 'You are an expert SEO content writer. Output ONLY valid JSON, no markdown code blocks, no explanation.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.7,
    max_tokens: 4000
  });

  let contentStr = response.choices[0]?.message?.content || '';
  
  // Clean up response - remove markdown code blocks if present
  contentStr = contentStr.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  
  // Validate JSON
  let articleContent: ArticleContent;
  try {
    articleContent = JSON.parse(contentStr);
  } catch (parseError) {
    console.error('Failed to parse AI response as JSON:', contentStr.slice(0, 500));
    throw new Error('AI generated invalid JSON. Please try again.');
  }
  
  // Validate required fields with detailed checks
  if (!articleContent.hero) {
    throw new Error('AI response missing hero section');
  }
  if (typeof articleContent.hero.title !== 'string' || !articleContent.hero.title.trim()) {
    throw new Error('AI response missing hero.title');
  }
  if (typeof articleContent.hero.subtitle !== 'string' || !articleContent.hero.subtitle.trim()) {
    throw new Error('AI response missing hero.subtitle');
  }
  if (!Array.isArray(articleContent.sections) || articleContent.sections.length === 0) {
    throw new Error('AI response has no sections');
  }
  if (!Array.isArray(articleContent.faqs) || articleContent.faqs.length === 0) {
    throw new Error('AI response has no FAQs');
  }
  if (!articleContent.bottomCTA || !articleContent.bottomCTA.heading) {
    throw new Error('AI response missing bottomCTA');
  }
  
  // Graceful fallback: remove quickCTA if no tool slugs
  if (!primaryTool && articleContent.quickCTA) {
    delete articleContent.quickCTA;
  }
  
  // Graceful fallback: remove secondary tool if not available
  if (!secondaryTool && articleContent.bottomCTA?.secondaryTool) {
    delete articleContent.bottomCTA.secondaryTool;
  }

  const title = articleContent.hero.title.trim();
  const excerpt = articleContent.hero.subtitle.trim().slice(0, 250);
  const metaDescription = articleContent.hero.subtitle.trim().slice(0, 155);

  return {
    title: title.slice(0, 255),
    content: JSON.stringify(articleContent),
    excerpt,
    metaDescription
  };
}

export async function getArticleStatusesForCluster(clusterSlug: string): Promise<ArticleStatus[]> {
  const cluster = getClusterById(clusterSlug);
  if (!cluster) {
    return [];
  }

  const existingArticles = await query(
    `SELECT slug, title, content, is_published, is_indexed 
     FROM cluster_articles 
     WHERE slug = ANY($1)`,
    [cluster.articleSlugs]
  );

  const articleMap = new Map<string, typeof existingArticles.rows[0]>();
  for (const row of existingArticles.rows) {
    articleMap.set(row.slug as string, row);
  }

  return cluster.articleSlugs.map(slug => {
    const article = articleMap.get(slug);
    if (!article) {
      return {
        slug,
        title: slugToTitle(slug),
        exists: false,
        isDraft: false,
        isPublished: false,
        isIndexed: false,
        contentLength: 0,
      };
    }

    return {
      slug,
      title: (article.title as string) || slugToTitle(slug),
      exists: true,
      isDraft: !article.is_published,
      isPublished: article.is_published === true,
      isIndexed: article.is_indexed === true,
      contentLength: (article.content as string)?.length || 0,
    };
  });
}

export async function createMissingDraftsWithContent(clusterSlug: string): Promise<{
  created: string[];
  skipped: string[];
  errors: { slug: string; error: string }[];
}> {
  const cluster = getClusterById(clusterSlug);
  if (!cluster) {
    throw new Error(`Cluster not found: ${clusterSlug}`);
  }

  const existingArticles = await query(
    `SELECT slug FROM cluster_articles WHERE slug = ANY($1)`,
    [cluster.articleSlugs]
  );

  const existingSlugs = new Set(existingArticles.rows.map(r => r.slug));

  const created: string[] = [];
  const skipped: string[] = [];
  const errors: { slug: string; error: string }[] = [];

  for (const articleSlug of cluster.articleSlugs) {
    if (existingSlugs.has(articleSlug)) {
      skipped.push(articleSlug);
      continue;
    }

    try {
      console.log(`Generating structured JSON content for: ${articleSlug}`);
      const generated = await generateArticleContent(articleSlug, clusterSlug);
      
      await query(`
        INSERT INTO cluster_articles (slug, title, content, excerpt, meta_description, cluster_slug, is_indexed, is_published, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      `, [articleSlug, generated.title, generated.content, generated.excerpt, generated.metaDescription, clusterSlug, false, false]);

      created.push(articleSlug);
      console.log(`Created article with structured JSON: ${articleSlug}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error(`Error generating ${articleSlug}:`, errorMessage);
      errors.push({ slug: articleSlug, error: errorMessage });
    }
  }

  return { created, skipped, errors };
}

export async function createMissingDrafts(clusterSlug: string): Promise<{
  created: string[];
  skipped: string[];
}> {
  const result = await createMissingDraftsWithContent(clusterSlug);
  return { created: result.created, skipped: result.skipped };
}

export async function publishArticle(slug: string): Promise<boolean> {
  const result = await query(
    `UPDATE cluster_articles 
     SET is_published = true, updated_at = NOW() 
     WHERE slug = $1 AND is_published = false
     RETURNING id`,
    [slug]
  );
  return (result.rowCount ?? 0) > 0;
}

export async function unpublishArticle(slug: string): Promise<boolean> {
  const result = await query(
    `UPDATE cluster_articles 
     SET is_published = false, updated_at = NOW() 
     WHERE slug = $1
     RETURNING id`,
    [slug]
  );
  return (result.rowCount ?? 0) > 0;
}

export async function setArticleIndexed(slug: string, indexed: boolean): Promise<boolean> {
  const result = await query(
    `UPDATE cluster_articles 
     SET is_indexed = $1, updated_at = NOW() 
     WHERE slug = $2
     RETURNING id`,
    [indexed, slug]
  );
  return (result.rowCount ?? 0) > 0;
}
