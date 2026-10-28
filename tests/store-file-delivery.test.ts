import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { join } from "node:path";

const mocks = vi.hoisted(() => ({ readFile: vi.fn() }));
vi.mock("fs/promises", () => ({ readFile: mocks.readFile }));

import { GET } from "@/app/uploads/[...path]/route";

function download(path: string[]) {
  return GET(new NextRequest("https://store.example.test/uploads/lesson.pdf"), {
    params: Promise.resolve({ path }),
  });
}

describe("customer file delivery", () => {
  beforeEach(() => vi.resetAllMocks());

  it("serves existing download bytes with the correct MIME type", async () => {
    const bytes = Buffer.from("%PDF-1.7\nTest course resource");
    mocks.readFile.mockResolvedValue(bytes);
    const response = await download(["courses", "lesson.pdf"]);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/pdf");
    expect(Buffer.from(await response.arrayBuffer())).toEqual(bytes);
    expect(mocks.readFile).toHaveBeenCalledWith(join(process.cwd(), "uploads", "courses", "lesson.pdf"));
  });

  it("rejects traversal outside the uploaded-file directory", async () => {
    expect((await download(["..", "private.pdf"])).status).toBe(400);
    expect(mocks.readFile).not.toHaveBeenCalled();
  });

  it("returns 404 rather than a broken successful download for missing files", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      mocks.readFile.mockRejectedValue(new Error("ENOENT"));
      expect((await download(["missing.pdf"])).status).toBe(404);
    } finally {
      log.mockRestore();
    }
  });
});
