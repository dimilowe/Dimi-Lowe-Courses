import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { UserSessionData, userSessionOptions } from "@/lib/user-session";
import { getCloudEntitlementsForUser } from "@/lib/cloudEntitlements";
import { gateTool, GateResult } from "./gate";
import { toolsRegistry, type Tool } from "@/data/toolsRegistry";
import type { CloudEntitlement, CloudId } from "@/lib/types/cloudEntitlements";

export interface ServerGateParams {
  slug: string;
}

export interface ServerGateResult {
  gate: GateResult;
  isLoggedIn: boolean;
  entitlements: CloudEntitlement[];
  registryTool: Tool | undefined;
}

export async function getServerGate(params: ServerGateParams): Promise<ServerGateResult> {
  console.log(`[ServerGate] ENTERED with params:`, JSON.stringify(params));
  const { slug } = params;
  
  const registryTool = toolsRegistry.find(t => t.slug === slug);
  
  console.log(`[ServerGate] slug=${slug}, found=${!!registryTool}, required_tier=${registryTool?.required_tier || 'free'}`);
  
  const cloud_ids: CloudId[] = registryTool?.cloud_ids || [];
  const required_tier = registryTool?.required_tier || 'free';
  
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
  
  const gate = gateTool({
    tool: { cloud_ids, required_tier },
    entitlements,
    isLoggedIn
  });
  
  console.log(`[ServerGate] isLoggedIn=${isLoggedIn}, entitlements=${entitlements.length}, gate.allowed=${gate.allowed}, reason=${gate.reason}`);
  
  return {
    gate,
    isLoggedIn,
    entitlements,
    registryTool
  };
}
