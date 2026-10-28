import { unsealData } from "iron-session";
import { NextRequest, NextResponse } from "next/server";
import { userSessionOptions, type UserSessionData } from "@/lib/user-session";

/** Keep compatibility cookies subordinate to the Clerk session that issued them. */
export async function enforceClerkBridgeSession(
  request: NextRequest,
  response: NextResponse,
  identity: { userId: string | null; sessionId: string | null }
): Promise<NextResponse> {
  const cookieName = userSessionOptions.cookieName as string;
  const sealed = request.cookies.get(cookieName)?.value;
  if (!sealed) return response;
  const local = await unsealData<UserSessionData>(sealed, {
    password: userSessionOptions.password as string,
  });
  // Allow pre-migration sessions to finish their existing lifetime.
  if (!local.clerkUserId) return response;
  if (
    local.clerkUserId === identity.userId &&
    local.clerkSessionId === identity.sessionId
  ) return response;

  let result = response;
  if (response.headers.get("x-middleware-next") === "1") {
    const headers = new Headers(request.headers);
    const cookies = request.cookies.getAll()
      .filter((cookie) => cookie.name !== cookieName)
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join("; ");
    if (cookies) headers.set("cookie", cookies);
    else headers.delete("cookie");
    result = NextResponse.next({ request: { headers } });
    response.headers.forEach((value, key) => {
      if (!key.startsWith("x-middleware-")) result.headers.set(key, value);
    });
  }
  result.cookies.set(cookieName, "", {
    secure: userSessionOptions.cookieOptions?.secure,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return result;
}
