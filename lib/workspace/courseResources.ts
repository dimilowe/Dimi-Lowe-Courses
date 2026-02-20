import { query } from "@/lib/db";
import { extractCourseResourceLinks } from "@/lib/products/courseResourceLinks";

type CourseProduct = {
  id: number;
  slug: string;
  name: string;
  type: string;
  thumbnail_url: string | null;
  download_url: string | null;
  external_url: string | null;
  meta: unknown;
};

function isCourseProductType(productType: string): boolean {
  return productType === "video" || productType === "course";
}

function toUserId(userId: number | string): number | null {
  const parsed = typeof userId === "number" ? userId : parseInt(userId, 10);
  if (!Number.isFinite(parsed)) return null;
  return parsed;
}

async function getCourseProductBySlug(slug: string): Promise<CourseProduct | null> {
  const result = await query(
    `SELECT id, slug, name, type, thumbnail_url, download_url, external_url,
            to_jsonb(products)->'meta' AS meta
     FROM products
     WHERE slug = $1
     LIMIT 1`,
    [slug]
  );
  return result.rows[0] || null;
}

async function getCourseProductById(productId: number): Promise<CourseProduct | null> {
  const result = await query(
    `SELECT id, slug, name, type, thumbnail_url, download_url, external_url,
            to_jsonb(products)->'meta' AS meta
     FROM products
     WHERE id = $1
     LIMIT 1`,
    [productId]
  );
  return result.rows[0] || null;
}

async function getExistingWorkspaceEntryId(userId: number, productSlug: string): Promise<string | null> {
  const existing = await query(
    `SELECT id
     FROM workspace_items
     WHERE user_id = $1
       AND type = 'course_resource'
       AND payload_json->>'product_slug' = $2
     LIMIT 1`,
    [userId, productSlug]
  );

  return existing.rows[0]?.id ? String(existing.rows[0].id) : null;
}

async function ensureWorkspaceEntry(userId: number, course: CourseProduct): Promise<string | null> {
  if (!isCourseProductType(course.type)) return null;
  const courseResourceLinks = extractCourseResourceLinks(course.meta);

  const existingId = await getExistingWorkspaceEntryId(userId, course.slug);
  if (existingId) return existingId;

  const inserted = await query(
    `INSERT INTO workspace_items
      (user_id, title, type, origin_cloud_id, cloud_id, preview_text, thumbnail_url, file_url, payload_json)
     VALUES ($1, $2, 'course_resource', NULL, 'file-data', $3, $4, $5, $6)
     RETURNING id`,
    [
      userId,
      `${course.name} - Course Resources`,
      "Course resources and links",
      course.thumbnail_url,
      course.download_url,
      JSON.stringify({
        folder: `Course: ${course.name}`,
        tags: ["course", "resources"],
        product_id: course.id,
        product_slug: course.slug,
        course_video_url: course.external_url,
        resource_download_url: course.download_url,
        resource_links: courseResourceLinks,
      }),
    ]
  );

  return inserted.rows[0]?.id ? String(inserted.rows[0].id) : null;
}

export async function ensureCourseWorkspaceEntryBySlug(
  userId: number | string,
  productSlug: string
): Promise<string | null> {
  const numericUserId = toUserId(userId);
  if (!numericUserId) return null;

  const course = await getCourseProductBySlug(productSlug);
  if (!course) return null;

  return ensureWorkspaceEntry(numericUserId, course);
}

export async function ensureCourseWorkspaceEntryByProductId(
  userId: number | string,
  productId: number
): Promise<string | null> {
  const numericUserId = toUserId(userId);
  if (!numericUserId) return null;

  const course = await getCourseProductById(productId);
  if (!course) return null;

  return ensureWorkspaceEntry(numericUserId, course);
}
