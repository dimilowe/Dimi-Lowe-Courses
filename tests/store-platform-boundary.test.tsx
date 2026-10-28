import { describe, expect, it } from "vitest";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { ProductCard } from "@/components/product-card";

const product = {
  id: "12",
  slug: "example",
  name: "Example product",
  description: "Example description",
  thumbnail_url: "",
  type: "download",
  price_type: "free",
  price: 0,
};

function routeHandlers(directory: string): string[] {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? routeHandlers(path) : /^route\.[jt]sx?$/.test(entry.name) ? [path] : [];
  });
}

describe("store-only product presentation and platform boundary", () => {
  it("labels externally priced apps In App rather than Free", () => {
    const html = renderToStaticMarkup(<ProductCard product={{ ...product, type: "app" }} />);
    expect(html).toContain("In App");
    expect(html).not.toContain(">Free<");
    expect(html).toContain("/products/example");
  });

  it("still labels free downloads Free", () => {
    expect(renderToStaticMarkup(<ProductCard product={product} />)).toContain(">Free<");
  });

  it("preserves recurring membership inclusion labels", () => {
    expect(renderToStaticMarkup(
      <ProductCard product={{ ...product, type: "course", price_type: "membership" }} />
    )).toContain("Included with membership");
  });

  it("preserves paid download pricing", () => {
    expect(renderToStaticMarkup(
      <ProductCard product={{ ...product, price_type: "paid", price: 2500 }} />
    )).toContain("$25.00");
  });

  it("does not include public legacy tool-processing handlers, even ignored leftovers", () => {
    expect(routeHandlers(join(process.cwd(), "app/api/tools"))).toEqual([]);
  });

  it("keeps customer-facing file serving in the application", () => {
    expect(existsSync(join(process.cwd(), "app/uploads/[...path]/route.ts"))).toBe(true);
  });
});
