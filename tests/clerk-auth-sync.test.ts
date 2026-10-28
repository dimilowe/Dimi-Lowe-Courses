import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  currentUser: vi.fn(),
  updateMetadata: vi.fn(),
  findOrCreate: vi.fn(),
  findById: vi.fn(),
  query: vi.fn(),
  claimPending: vi.fn(),
  seal: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mocks.auth,
  currentUser: mocks.currentUser,
  clerkClient: async () => ({ users: { updateUserMetadata: mocks.updateMetadata } }),
}));
vi.mock("@/lib/auth", () => ({
  findOrCreateUserByEmail: mocks.findOrCreate,
  findUserById: mocks.findById,
}));
vi.mock("@/lib/db", () => ({ query: mocks.query }));
vi.mock("@/lib/subscription/pending", () => ({ claimPendingGlobalSubscriptions: mocks.claimPending }));
vi.mock("iron-session", () => ({ sealData: mocks.seal }));
vi.mock("@/lib/user-session", () => ({
  userSessionOptions: {
    password: "test-only-secret-not-used-for-real-sessions",
    cookieName: "vcm_user_session",
    cookieOptions: { httpOnly: true, secure: false, sameSite: "lax", maxAge: 3600, path: "/" },
  },
}));

import { POST } from "@/app/api/auth/sync/route";

const email = "customer@example.test";
const localUser = { id: "42", email, is_admin: false };
const clerkUser = {
  id: "clerk-test-user",
  primaryEmailAddressId: "verified-address",
  emailAddresses: [{ id: "verified-address", emailAddress: email, verification: { status: "verified" } }],
  privateMetadata: {} as Record<string, unknown>,
};

describe("Clerk account linking", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.auth.mockResolvedValue({ userId: clerkUser.id, sessionId: "clerk-test-session" });
    mocks.currentUser.mockResolvedValue({ ...clerkUser, privateMetadata: {} });
    mocks.findOrCreate.mockResolvedValue({ ...localUser });
    mocks.findById.mockResolvedValue({ ...localUser });
    mocks.seal.mockResolvedValue("test-sealed-session");
    mocks.query.mockResolvedValue({ rows: [] });
    mocks.claimPending.mockResolvedValue(0);
  });

  it("rejects signed-out requests without touching local accounts", async () => {
    mocks.auth.mockResolvedValue({ userId: null, sessionId: null });
    const response = await POST();
    expect(response.status).toBe(401);
    expect(mocks.findOrCreate).not.toHaveBeenCalled();
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("never links an unverified email to an existing account", async () => {
    mocks.currentUser.mockResolvedValue({
      ...clerkUser,
      emailAddresses: [{ id: "verified-address", emailAddress: email, verification: { status: "unverified" } }],
    });
    const response = await POST();
    expect(response.status).toBe(403);
    expect(mocks.findOrCreate).not.toHaveBeenCalled();
    expect(mocks.updateMetadata).not.toHaveBeenCalled();
  });

  it("preserves the local user ID and creates a Clerk-bound HTTP-only session", async () => {
    const response = await POST();
    expect(response.status).toBe(200);
    expect((await response.json()).userId).toBe("42");
    expect(mocks.findOrCreate).toHaveBeenCalledWith(email);
    expect(mocks.updateMetadata).toHaveBeenCalledWith(clerkUser.id, {
      privateMetadata: { vcmStoreUserId: "42" },
    });
    expect(mocks.claimPending).toHaveBeenCalledWith({ userId: "42", email });
    expect(mocks.seal).toHaveBeenCalledWith(expect.objectContaining({
      userId: "42",
      clerkUserId: clerkUser.id,
      clerkSessionId: "clerk-test-session",
      isAdmin: false,
    }), expect.any(Object));
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
  });

  it("uses the stable linked ID and retains database admin permissions", async () => {
    mocks.currentUser.mockResolvedValue({ ...clerkUser, privateMetadata: { vcmStoreUserId: "42" } });
    mocks.findById.mockResolvedValue({ ...localUser, is_admin: true });
    const response = await POST();
    expect(response.status).toBe(200);
    expect(mocks.findById).toHaveBeenCalledWith("42");
    expect(mocks.findOrCreate).not.toHaveBeenCalled();
    expect(mocks.seal).toHaveBeenCalledWith(expect.objectContaining({ isAdmin: true }), expect.any(Object));
  });

  it("retains purchase ownership after the verified email changes", async () => {
    mocks.currentUser.mockResolvedValue({ ...clerkUser, privateMetadata: { vcmStoreUserId: "42" } });
    mocks.findById.mockResolvedValue({ ...localUser, email: "previous@example.test" });
    const response = await POST();
    expect(response.status).toBe(200);
    expect(mocks.query).toHaveBeenCalledWith(
      "UPDATE users SET email = $1 WHERE id = $2",
      [email, "42"]
    );
    expect(mocks.findOrCreate).not.toHaveBeenCalled();
  });

  it("fails explicitly rather than silently creating another account for a stale link", async () => {
    mocks.currentUser.mockResolvedValue({ ...clerkUser, privateMetadata: { vcmStoreUserId: "42" } });
    mocks.findById.mockResolvedValue(null);
    expect((await POST()).status).toBe(409);
    expect(mocks.findOrCreate).not.toHaveBeenCalled();
  });

  it("rejects malformed saved identity links without relinking by email", async () => {
    mocks.currentUser.mockResolvedValue({ ...clerkUser, privateMetadata: { vcmStoreUserId: "invalid" } });
    expect((await POST()).status).toBe(409);
    expect(mocks.findOrCreate).not.toHaveBeenCalled();
  });
});
