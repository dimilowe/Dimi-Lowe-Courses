import { describe, expect, it, vi } from "vitest";
import { sealData } from "iron-session";
import { NextRequest, NextResponse } from "next/server";

vi.mock("@/lib/user-session", () => ({
  userSessionOptions: {
    password: "fixed-test-only-key-for-session-validation",
    cookieName: "vcm_user_session",
    cookieOptions: { secure: false, httpOnly: true, sameSite: "lax", path: "/" },
  },
}));

import { enforceClerkBridgeSession } from "@/lib/auth/clerkBridgeSession";
import { safeAuthReturnPath } from "@/lib/auth/clerkRedirect";

const password = "fixed-test-only-key-for-session-validation";
const identity = { userId: "clerk-test-user", sessionId: "test-session" };

async function requestFor(data: Record<string, unknown>) {
  const cookie = await sealData(data, { password });
  return new NextRequest("https://example.test/api/auth/session", {
    headers: { cookie: `other_cookie=keep; vcm_user_session=${cookie}` },
  });
}

describe("Clerk compatibility sessions", () => {
  it("accepts a compatibility cookie only for its issuing Clerk session", async () => {
    const request = await requestFor({
      userId: "42", clerkUserId: identity.userId, clerkSessionId: identity.sessionId,
    });
    const response = NextResponse.next();
    expect(await enforceClerkBridgeSession(request, response, identity)).toBe(response);
  });

  it("removes the account cookie from the downstream request after Clerk sign-out", async () => {
    const request = await requestFor({
      userId: "42", clerkUserId: identity.userId, clerkSessionId: identity.sessionId,
    });
    const result = await enforceClerkBridgeSession(request, NextResponse.next(), {
      userId: null, sessionId: null,
    });
    expect(result.headers.get("x-middleware-request-cookie")).toBe("other_cookie=keep");
    expect(result.cookies.get("vcm_user_session")?.maxAge).toBe(0);
  });

  it("does not reuse a local session when another Clerk account signs in", async () => {
    const request = await requestFor({
      userId: "42", clerkUserId: identity.userId, clerkSessionId: identity.sessionId,
    });
    const result = await enforceClerkBridgeSession(request, NextResponse.next(), {
      userId: "different-test-user", sessionId: "different-session",
    });
    expect(result.cookies.get("vcm_user_session")?.maxAge).toBe(0);
  });

  it("preserves pre-migration sessions until their original expiry", async () => {
    const request = await requestFor({ userId: "42", isLoggedIn: true });
    const response = NextResponse.next();
    expect(await enforceClerkBridgeSession(request, response, { userId: null, sessionId: null })).toBe(response);
  });
});

describe("authentication return URLs", () => {
  it.each(["https://example.test", "//example.test", "/\\example.test"])(
    "does not allow an external redirect: %s",
    (value) => expect(safeAuthReturnPath(value)).toBe("/dashboard")
  );
  it("preserves a local return URL", () => {
    expect(safeAuthReturnPath("/courses/example?lesson=1")).toBe("/courses/example?lesson=1");
  });
});
