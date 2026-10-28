export function safeAuthReturnPath(value: unknown, fallback = "/dashboard"): string {
  if (typeof value !== "string") return fallback;
  const path = value.trim();
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) {
    return fallback;
  }
  return path;
}

export function safeClaimProductId(value: unknown): string | null {
  if (typeof value !== "string" || !/^\d+$/.test(value)) return null;
  return value;
}

export function buildAuthCompletionUrl(next: string, claimProductId: string | null): string {
  const params = new URLSearchParams({ next });
  if (claimProductId) params.set("claimProductId", claimProductId);
  return `/auth/complete?${params.toString()}`;
}

export function buildAuthFlowUrl(
  pathname: "/sign-in" | "/sign-up",
  next: string,
  claimProductId: string | null
): string {
  const params = new URLSearchParams({ next });
  if (claimProductId) params.set("claimProductId", claimProductId);
  return `${pathname}?${params.toString()}`;
}
