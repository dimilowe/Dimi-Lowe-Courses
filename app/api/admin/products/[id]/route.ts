import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { AdminSessionData, sessionOptions } from "@/lib/admin-session";
import { query } from "@/lib/db";

async function ensureProductsMetaColumn() {
  await query(
    `ALTER TABLE products
     ADD COLUMN IF NOT EXISTS meta JSONB`
  );
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getIronSession<AdminSessionData>(await cookies(), sessionOptions);

  if (!session.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const {
      slug,
      name,
      description,
      type,
      price_type,
      price,
      thumbnail_url,
      download_url,
      external_url,
      visibility,
      meta,
    } = await request.json();

    const values = [
      slug,
      name,
      description,
      type,
      price_type,
      price,
      thumbnail_url,
      download_url,
      external_url,
      visibility,
    ];
    const metaJson = meta ? JSON.stringify(meta) : null;

    let result;
    try {
      result = await query(
        `UPDATE products 
         SET slug = $1, name = $2, description = $3, type = $4, price_type = $5, 
             price = $6, thumbnail_url = $7, download_url = $8, external_url = $9, 
             visibility = $10, meta = $11, updated_at = CURRENT_TIMESTAMP
         WHERE id = $12
         RETURNING *`,
        [...values, metaJson, id]
      );
    } catch (error: any) {
      const message = String(error?.message || "");
      if (!message.includes('column "meta"')) {
        throw error;
      }
      await ensureProductsMetaColumn();
      result = await query(
        `UPDATE products 
         SET slug = $1, name = $2, description = $3, type = $4, price_type = $5, 
             price = $6, thumbnail_url = $7, download_url = $8, external_url = $9, 
             visibility = $10, meta = $11, updated_at = CURRENT_TIMESTAMP
         WHERE id = $12
         RETURNING *`,
        [...values, metaJson, id]
      );
    }

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ product: result.rows[0] });
  } catch (error: any) {
    console.error("Failed to update product:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update product" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getIronSession<AdminSessionData>(await cookies(), sessionOptions);

  if (!session.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const result = await query("DELETE FROM products WHERE id = $1 RETURNING *", [
      id,
    ]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete product:", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}
