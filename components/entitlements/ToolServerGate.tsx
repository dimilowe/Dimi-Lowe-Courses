"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import UpgradeWall from "./UpgradeWall";
import type { GateResult } from "@/lib/entitlements/gate";

interface ToolServerGateProps {
  slug: string;
  toolName?: string;
  toolDescription?: string;
  children: ReactNode;
}

interface GateApiResponse {
  allowed?: boolean;
  gate?: GateResult;
  tool?: {
    name?: string | null;
    description?: string | null;
  } | null;
}

export default function ToolServerGate({
  slug,
  toolName,
  toolDescription,
  children,
}: ToolServerGateProps) {
  const [gate, setGate] = useState<GateResult | null>(null);
  const [apiToolName, setApiToolName] = useState<string | null>(null);
  const [apiToolDescription, setApiToolDescription] = useState<string | null>(null);

  useEffect(() => {
    let canceled = false;

    async function checkGate() {
      try {
        const res = await fetch(`/api/tools/gate/${slug}`, {
          cache: "no-store",
          credentials: "include",
        });
        if (!res.ok) return;

        const data = (await res.json()) as GateApiResponse;
        if (canceled) return;

        if (data.gate) {
          setGate(data.gate);
        }
        if (data.tool?.name) {
          setApiToolName(data.tool.name);
        }
        if (data.tool?.description) {
          setApiToolDescription(data.tool.description);
        }
      } catch {
        // Keep tool UI visible if gate probe fails; action APIs enforce access.
      }
    }

    checkGate();
    return () => {
      canceled = true;
    };
  }, [slug]);

  const resolvedName = useMemo(
    () => toolName || apiToolName || "Premium Tool",
    [toolName, apiToolName]
  );
  const resolvedDescription = useMemo(
    () => toolDescription || apiToolDescription || undefined,
    [toolDescription, apiToolDescription]
  );

  if (gate && !gate.allowed) {
    return (
      <UpgradeWall
        gate={gate}
        toolName={resolvedName}
        toolDescription={resolvedDescription}
      />
    );
  }

  return <>{children}</>;
}
