import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { resolveGrantedProductIdsForPurchaseProductId } from "@/lib/products/bundleAccess";
import { ensureCourseWorkspaceEntryByProductId } from "@/lib/workspace/courseResources";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { UserSessionData, userSessionOptions } from "@/lib/user-session";

export async function POST(request: NextRequest) {
  try {
    const { productId } = await request.json();
    const session = await getIronSession<UserSessionData>(await cookies(), userSessionOptions);
    const userId = session.isLoggedIn ? session.userId : null;

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }
    if (!userId) {
      return NextResponse.json({ error: "Sign in to claim this product." }, { status: 401 });
    }

    const productResult = await query(
      `SELECT price_type
       FROM products
       WHERE id = $1
       LIMIT 1`,
      [productId]
    );

    if (productResult.rows.length === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (productResult.rows[0].price_type !== "free") {
      return NextResponse.json({ error: "Only free products can be claimed." }, { status: 400 });
    }

    const grantedProductIds = await resolveGrantedProductIdsForPurchaseProductId(Number(productId));
    if (grantedProductIds.length === 0) {
      return NextResponse.json({ error: "This bundle is missing valid included products." }, { status: 400 });
    }

    for (const grantedProductId of grantedProductIds) {
      await query(
        `INSERT INTO entitlements (user_id, product_id, source) 
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, product_id) DO NOTHING`,
        [userId, grantedProductId, "free_claim"]
      );

      try {
        await ensureCourseWorkspaceEntryByProductId(userId, grantedProductId);
      } catch (workspaceError) {
        console.error("Failed to create course workspace entry for free claim:", workspaceError);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Claim error:", error);
    return NextResponse.json(
      { error: "Failed to claim product" },
      { status: 500 }
    );
  }
}
