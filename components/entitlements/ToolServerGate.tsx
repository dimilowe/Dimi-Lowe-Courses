import { ReactNode } from 'react';
import { getServerGate } from '@/lib/entitlements/getServerGate';
import UpgradeWall from './UpgradeWall';
import { toolsRegistry } from '@/data/toolsRegistry';

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
  const { gate, registryTool } = await getServerGate({ slug });

  if (!gate.allowed) {
    const name = toolName || registryTool?.name || 'Premium Tool';
    const description = toolDescription || registryTool?.description;
    
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
