import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { AdminSessionData, sessionOptions } from "@/lib/admin-session";
import { withTransaction } from "@/lib/db";

export async function POST(request: NextRequest) {
  const session = await getIronSession<AdminSessionData>(await cookies(), sessionOptions);
  
  if (!session.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { slug } = await request.json();
    
    if (!slug || typeof slug !== "string") {
      return NextResponse.json({ error: "Missing or invalid slug" }, { status: 400 });
    }

    const result = await withTransaction(async (tx) => {
      const deletedFrom: string[] = [];

      const toolsCheck = await tx.query(
        `SELECT id, deleted_at FROM tools WHERE slug = $1`,
        [slug]
      );

      if (toolsCheck.rows.length > 0) {
        if (!toolsCheck.rows[0].deleted_at) {
          await tx.query(
            `UPDATE tools SET deleted_at = NOW(), updated_at = NOW() WHERE slug = $1`,
            [slug]
          );
        }
        deletedFrom.push("tools");
      }

      const cmsCheck = await tx.query(
        `SELECT id FROM cms_objects WHERE type = 'tool' AND slug = $1`,
        [slug]
      );

      if (cmsCheck.rows.length > 0) {
        await tx.query(
          `DELETE FROM cms_objects WHERE type = 'tool' AND slug = $1`,
          [slug]
        );
        deletedFrom.push("cms_objects");
      }

      if (deletedFrom.length === 0) {
        throw new Error("NOT_FOUND");
      }

      const pathVariants = [
        `/tools/${slug}`,
        `/shopping/${slug}`,
      ];

      await tx.query(
        `UPDATE global_urls SET is_indexed = false WHERE url = ANY($1)`,
        [pathVariants]
      );

      return { deletedFrom, deindexedPaths: pathVariants };
    });

    return NextResponse.json({ ok: true, ...result });

  } catch (error: any) {
    if (error.message === "NOT_FOUND") {
      return NextResponse.json({ error: "Tool not found" }, { status: 404 });
    }
    console.error("Delete tool error:", error);
    return NextResponse.json(
      { error: "Failed to delete tool" },
      { status: 500 }
    );
  }
}
