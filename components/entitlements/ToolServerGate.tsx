import { ReactNode } from 'react';
import { getServerGate } from '@/lib/entitlements/getServerGate';
import UpgradeWall from './UpgradeWall';

interface ToolServerGateProps {
  slug: string;
  toolName?: string;
  toolDescription?: string;
  children: ReactNode;
}

export default async function ToolServerGate({
  slug,
  toolName,
  toolDescription,
  children,
}: ToolServerGateProps) {
  const { gate, dbTool } = await getServerGate({ slug });

  if (!gate.allowed) {
    const name = toolName || dbTool?.name || 'Premium Tool';
    const description = toolDescription || dbTool?.description || undefined;
    
    return (
      <UpgradeWall
        gate={gate}
        toolName={name}
        toolDescription={description}
      />
    );
  }

  return <>{children}</>;
}
