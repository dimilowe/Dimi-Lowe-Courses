import { Metadata } from 'next';
import ToolServerGate from '@/components/entitlements/ToolServerGate';
import ReachGrabberToolClient from './ReachGrabberToolClient';

export const metadata: Metadata = {
  title: 'Reach Grabber Tool',
  description: 'Optimize your content for SEO with keyword-focused rewrites. Improve your content reach with strategic keyword placement.',
};

export default function ReachGrabberToolPage() {
  return (
    <ToolServerGate
      slug="reach-grabber-tool"
      toolName="Reach Grabber Tool"
      toolDescription="Optimize your content for SEO with keyword-focused rewrites. Improve your content reach with strategic keyword placement."
    >
      <ReachGrabberToolClient />
    </ToolServerGate>
  );
}
