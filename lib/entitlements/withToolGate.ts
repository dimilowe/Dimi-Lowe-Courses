import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { toolsRegistry, type Tool } from '@/data/toolsRegistry';
import { gateTool, type GateResult } from '@/lib/entitlements/gate';
import { getCloudEntitlementsForUser } from '@/lib/cloudEntitlements';
import type { CloudEntitlement } from '@/lib/types/cloudEntitlements';

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
  tool: Tool;
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

    const tool = toolsRegistry.find(t => t.slug === slug);
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

    const gate = gateTool({
      tool: { cloud_ids: tool.cloud_ids, required_tier: tool.required_tier },
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
): Promise<{ allowed: true; tool: Tool; entitlements: CloudEntitlement[]; gate: GateResult } | { allowed: false; gate: GateResult; response: NextResponse }> {
  const tool = toolsRegistry.find(t => t.slug === slug);
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

  const gate = gateTool({
    tool: { cloud_ids: tool.cloud_ids, required_tier: tool.required_tier },
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
