import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { UserSessionData, userSessionOptions } from "@/lib/user-session";
import { getCloudEntitlementsForUser } from "@/lib/cloudEntitlements";
import { gateTool, GateResult, ToolAccess } from "./gate";
import { getToolBySlug, ToolRecord } from "@/lib/toolsRepo";
import type { CloudEntitlement, CloudId, EntitlementTier } from "@/lib/types/cloudEntitlements";

export interface ServerGateParams {
  slug: string;
}

export interface ServerGateResult {
  gate: GateResult;
  isLoggedIn: boolean;
  entitlements: CloudEntitlement[];
  dbTool: ToolRecord | null;
}

export async function getServerGate(params: ServerGateParams): Promise<ServerGateResult> {
  const { slug } = params;
  
  const dbTool = await getToolBySlug(slug);
  
  const required_clouds: CloudId[] = (dbTool?.requiredClouds ?? []) as CloudId[];
  const required_tier: EntitlementTier = (dbTool?.requiredTier ?? 'free') as EntitlementTier;
  
  let isLoggedIn = false;
  let entitlements: CloudEntitlement[] = [];
  
  try {
    const session = await getIronSession<UserSessionData>(await cookies(), userSessionOptions);
    
    if (session.isLoggedIn && session.userId) {
      isLoggedIn = true;
      entitlements = await getCloudEntitlementsForUser(parseInt(session.userId, 10));
    }
  } catch (error) {
    console.error("[ServerGate] Error getting session:", error);
  }
  
  const toolAccess: ToolAccess = { required_clouds, required_tier };
  
  const gate = gateTool({
    tool: toolAccess,
    entitlements,
    isLoggedIn
  });
  
  return {
    gate,
    isLoggedIn,
    entitlements,
    dbTool
  };
}
