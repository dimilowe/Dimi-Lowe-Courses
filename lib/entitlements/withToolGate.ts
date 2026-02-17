import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { getToolBySlug, ToolRecord } from '@/lib/toolsRepo';
import { gateTool, type GateResult, type ToolAccess } from '@/lib/entitlements/gate';
import { getCloudEntitlementsForUser } from '@/lib/cloudEntitlements';
import type { CloudEntitlement, CloudId, EntitlementTier } from '@/lib/types/cloudEntitlements';
import { recordApiInvocation } from '@/lib/ops/metrics';

interface SessionData {
  userId?: number;
  email?: string;
}

const sessionOptions = {
  password: process.env.SESSION_SECRET || 'complex_password_at_least_32_characters_long',
  cookieName: 'vcm_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
  },
};

export interface GatedContext {
  tool: ToolRecord;
  session: SessionData | null;
  entitlements: CloudEntitlement[];
  gate: GateResult;
}

type GatedHandler = (
  req: NextRequest,
  context: GatedContext
) => Promise<NextResponse> | NextResponse;

export function withToolGate(handler: GatedHandler) {
  return async (req: NextRequest, { params }: { params: Promise<{ slug: string }> }) => {
    const { slug } = await params;
    recordApiInvocation(`/api/tools/${slug}`);

    const tool = await getToolBySlug(slug);
    if (!tool) {
      return NextResponse.json(
        { ok: false, error: 'Tool not found' },
        { status: 404 }
      );
    }

    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
    const isLoggedIn = !!session.userId;

    let entitlements: CloudEntitlement[] = [];
    if (isLoggedIn && session.userId) {
      entitlements = await getCloudEntitlementsForUser(session.userId);
    }

    const toolAccess: ToolAccess = {
      required_clouds: (tool.requiredClouds ?? []) as CloudId[],
      required_tier: (tool.requiredTier ?? 'free') as EntitlementTier
    };

    const gate = gateTool({
      tool: toolAccess,
      entitlements,
      isLoggedIn
    });

    if (!gate.allowed) {
      return NextResponse.json(
        { ok: false, gate },
        { status: 403 }
      );
    }

    return handler(req, {
      tool,
      session: isLoggedIn ? session : null,
      entitlements,
      gate
    });
  };
}

export async function gateToolForRequest(
  slug: string
): Promise<{ allowed: true; tool: ToolRecord; entitlements: CloudEntitlement[]; gate: GateResult } | { allowed: false; gate: GateResult; response: NextResponse }> {
  recordApiInvocation(`/api/tools/${slug}`);
  const tool = await getToolBySlug(slug);
  if (!tool) {
    const gate: GateResult = {
      allowed: false,
      reason: 'misconfigured_tool',
      required_tier: 'free',
      user_tier_best: null,
      upgrade_cloud_id: null,
      checked_cloud_ids: []
    };
    return {
      allowed: false,
      gate,
      response: NextResponse.json({ ok: false, error: 'Tool not found' }, { status: 404 })
    };
  }

  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
  const isLoggedIn = !!session.userId;

  let entitlements: CloudEntitlement[] = [];
  if (isLoggedIn && session.userId) {
    entitlements = await getCloudEntitlementsForUser(session.userId);
  }

  const toolAccess: ToolAccess = {
    required_clouds: (tool.requiredClouds ?? []) as CloudId[],
    required_tier: (tool.requiredTier ?? 'free') as EntitlementTier
  };

  const gate = gateTool({
    tool: toolAccess,
    entitlements,
    isLoggedIn
  });

  if (!gate.allowed) {
    return {
      allowed: false,
      gate,
      response: NextResponse.json({ ok: false, gate }, { status: 403 })
    };
  }

  return {
    allowed: true,
    tool,
    entitlements,
    gate
  };
}
