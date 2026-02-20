import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { notFound, redirect } from "next/navigation";
import { query } from "@/lib/db";
import { userSessionOptions, type UserSessionData } from "@/lib/user-session";
import { userHasProductEntitlement } from "@/lib/products/entitlements";
import { ensureCourseWorkspaceEntryBySlug } from "@/lib/workspace/courseResources";

type CourseProduct = {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  thumbnail_url: string | null;
  external_url: string | null;
  download_url: string | null;
  type: string;
  visibility: string | null;
};

async function getCourseProduct(slug: string): Promise<CourseProduct | null> {
  const result = await query(
    `SELECT id, slug, name, description, thumbnail_url, external_url, download_url, type, visibility
     FROM products
     WHERE slug = $1
     LIMIT 1`,
    [slug]
  );
  return result.rows[0] || null;
}

function extractYoutubeEmbedUrl(rawUrl: string | null): string | null {
  if (!rawUrl) return null;

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return null;
  }

  const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
  const isYouTube = host === "youtube.com" || host === "m.youtube.com" || host === "youtu.be";
  if (!isYouTube) return null;

  let videoId = "";

  if (host === "youtu.be") {
    videoId = parsed.pathname.replace("/", "").trim();
  } else if (parsed.pathname === "/watch") {
    videoId = parsed.searchParams.get("v") || "";
  } else if (parsed.pathname.startsWith("/embed/")) {
    videoId = parsed.pathname.replace("/embed/", "").trim();
  } else if (parsed.pathname.startsWith("/shorts/")) {
    videoId = parsed.pathname.replace("/shorts/", "").trim();
  }

  if (!videoId) return null;

  const start = parsed.searchParams.get("t") || parsed.searchParams.get("start");
  const startParam = start ? `?start=${encodeURIComponent(start.replace("s", ""))}` : "";
  return `https://www.youtube.com/embed/${encodeURIComponent(videoId)}${startParam}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCourseProduct(slug);

  if (!course || course.type !== "video") {
    return {
      title: "Course Not Found | VCM Suite",
      robots: { index: false, follow: false },
    };
  }

  return {
    title: `${course.name} | Course`,
    description: course.description || `Watch your purchased course: ${course.name}`,
    robots: { index: false, follow: false },
  };
}

export default async function CoursePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const course = await getCourseProduct(slug);

  if (!course || course.type !== "video") {
    notFound();
  }

  const session = await getIronSession<UserSessionData>(await cookies(), userSessionOptions);
  if (!session.isLoggedIn || !session.userId) {
    redirect(`/login?next=${encodeURIComponent(`/courses/${course.slug}`)}`);
  }

  const hasAccess = await userHasProductEntitlement(session.userId, course.id, course.slug);
  if (!hasAccess) {
    redirect("/store");
  }

  const courseWorkspaceItemId = await ensureCourseWorkspaceEntryBySlug(session.userId, course.slug);
  const workspaceHref = courseWorkspaceItemId
    ? `/workspace/${courseWorkspaceItemId}`
    : `/workspace?q=${encodeURIComponent(course.slug)}`;

  const youtubeEmbedUrl = extractYoutubeEmbedUrl(course.external_url);

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <Link href="/dashboard" className="text-sm text-orange-600 hover:text-orange-700">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mt-3">{course.name}</h1>
          {course.description && (
            <p className="text-gray-600 mt-3 whitespace-pre-line">{course.description}</p>
          )}
        </div>

        {youtubeEmbedUrl ? (
          <div className="aspect-video w-full rounded-xl overflow-hidden border border-gray-200 bg-black">
            <iframe
              src={youtubeEmbedUrl}
              title={course.name}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        ) : course.external_url ? (
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <p className="text-gray-700 mb-4">Open your course video:</p>
            <a
              href={course.external_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-orange-500 text-white hover:bg-orange-600 h-10 px-4 py-2"
            >
              Open Video
            </a>
          </div>
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <p className="text-gray-700">No video URL is configured yet for this course.</p>
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={workspaceHref}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 h-10 px-4 py-2"
          >
            Open in Workspace
          </Link>
          {course.download_url && (
            <a
              href={course.download_url}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 h-10 px-4 py-2"
            >
              Download Course Files
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
