import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  query: vi.fn(),
  catalog: vi.fn(),
  session: vi.fn(),
  checkout: vi.fn(),
  grantedIds: vi.fn(),
  courseResource: vi.fn(),
}));

vi.mock("@/lib/db", () => ({ query: mocks.query }));
vi.mock("@/lib/products/publicCatalog", () => ({ queryPublicCatalogProducts: mocks.catalog }));
vi.mock("iron-session", () => ({ getIronSession: mocks.session }));
vi.mock("next/headers", () => ({ cookies: vi.fn(async () => ({})) }));
vi.mock("stripe", () => ({
  default: class {
    checkout = { sessions: { create: mocks.checkout } };
  },
}));
vi.mock("@/lib/products/bundleAccess", () => ({
  resolveGrantedProductIdsForPurchaseProductIds: mocks.grantedIds,
  resolveGrantedProductIdsForPurchaseProductId: mocks.grantedIds,
}));
vi.mock("@/lib/workspace/courseResources", () => ({
  ensureCourseWorkspaceEntryByProductId: mocks.courseResource,
}));
vi.mock("@/components/product-card", () => ({
  ProductCard: ({ product }: { product: { name: string } }) => <article>{product.name}</article>,
}));
vi.mock("@/components/email-capture", () => ({ EmailCapture: () => null }));

import StorePage from "@/app/store/page";
import { POST as checkout } from "@/app/api/checkout/route";
import { POST as claimFree } from "@/app/api/claim-free/route";

function request(body: object) {
  return new NextRequest("https://store.example/api/checkout", {
    method: "POST",
    headers: { "content-type": "application/json", host: "store.example" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("STRIPE_SECRET_KEY", "test_key");
  mocks.session.mockResolvedValue({ isLoggedIn: true, userId: "7", email: "buyer@example.com" });
  mocks.checkout.mockResolvedValue({ id: "cs_test", url: "https://checkout.example/session" });
  mocks.grantedIds.mockResolvedValue([12]);
});

describe("store commerce after retiring the tool platform", () => {
  it("displays subscriptions and additional product types alongside the standard categories", async () => {
    const types = ["course", "app", "download", "freebie", "funnel", "subscription", "physical", "service"];
    mocks.catalog.mockResolvedValue(types.map((type, id) => ({ id, slug: type, type, name: `Product ${type}` })));
    const html = renderToStaticMarkup(await StorePage());
    for (const type of types) expect(html).toContain(`Product ${type}`);
  });

  it("still creates a paid product checkout with fulfillment metadata", async () => {
    mocks.query.mockResolvedValue({ rows: [{ id: 12, slug: "course", name: "Course", price_type: "paid", price: 2500, visibility: "public" }] });
    const response = await checkout(request({ productId: 12 }));
    expect(response.status).toBe(200);
    expect(mocks.checkout).toHaveBeenCalledWith(expect.objectContaining({
      mode: "payment",
      metadata: expect.objectContaining({ productId: "12", grantedProductIds: "12", checkout_type: "product" }),
      line_items: [expect.objectContaining({ price_data: expect.objectContaining({ unit_amount: 2500 }) })],
    }));
  });

  it("still creates recurring membership checkout using existing subscription metadata", async () => {
    const response = await checkout(request({ type: "global" }));
    expect(response.status).toBe(200);
    expect(mocks.checkout).toHaveBeenCalledWith(expect.objectContaining({
      mode: "subscription",
      metadata: expect.objectContaining({ type: "global", tier: "pro", user_id: "7" }),
      line_items: [expect.objectContaining({ price_data: expect.objectContaining({ recurring: { interval: "month" } }) })],
    }));
  });

  it("grants a free product and retains course-resource delivery", async () => {
    mocks.query.mockResolvedValueOnce({ rows: [{ price_type: "free" }] }).mockResolvedValue({ rows: [] });
    const response = await claimFree(request({ productId: 12, userId: 7 }));
    expect(response.status).toBe(200);
    expect(mocks.query).toHaveBeenCalledWith(expect.stringContaining("INSERT INTO entitlements"), ["7", 12, "free_claim"]);
    expect(mocks.courseResource).toHaveBeenCalledWith("7", 12);
    expect(mocks.checkout).not.toHaveBeenCalled();
  });

  it("uses the signed-in customer rather than a user ID supplied in the request", async () => {
    mocks.query.mockResolvedValueOnce({ rows: [{ price_type: "free" }] }).mockResolvedValue({ rows: [] });
    const response = await claimFree(request({ productId: 12, userId: 999 }));
    expect(response.status).toBe(200);
    expect(mocks.query).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO entitlements"), ["7", 12, "free_claim"]
    );
    expect(mocks.courseResource).toHaveBeenCalledWith("7", 12);
  });

  it("does not allow a signed-out request to claim a product for another customer", async () => {
    mocks.session.mockResolvedValue({ isLoggedIn: false });
    expect((await claimFree(request({ productId: 12, userId: 7 }))).status).toBe(401);
    expect(mocks.query).not.toHaveBeenCalled();
    expect(mocks.courseResource).not.toHaveBeenCalled();
  });

  it("does not send free products through paid checkout", async () => {
    mocks.query.mockResolvedValue({ rows: [{ id: 12, price_type: "free", price: 0, visibility: "public" }] });
    expect((await checkout(request({ productId: 12 }))).status).toBe(400);
    expect(mocks.checkout).not.toHaveBeenCalled();
  });

  it("does not sell a hidden catalog product", async () => {
    mocks.query.mockResolvedValue({ rows: [{ id: 12, price_type: "paid", price: 2500, visibility: "private" }] });
    expect((await checkout(request({ productId: 12 }))).status).toBe(404);
    expect(mocks.checkout).not.toHaveBeenCalled();
  });
});
