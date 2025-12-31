import { Metadata } from 'next';
import ToolServerGate from '@/components/entitlements/ToolServerGate';
import YoutubeTitleSplitTestClient from './YoutubeTitleSplitTestClient';

export const metadata: Metadata = {
  title: 'YouTube Title Split Test',
  description: 'A/B test your YouTube video titles to find the best performing option. Automatically rotate titles and track impressions, views, and clicks.',
};

export default function YoutubeTitleSplitTestPage() {
  return (
    <ToolServerGate
      slug="youtube-title-split-test"
      toolName="YouTube Title Split Test"
      toolDescription="A/B test your YouTube video titles to find the best performing option. Automatically rotate titles and track impressions, views, and clicks."
    >
      <YoutubeTitleSplitTestClient />
    </ToolServerGate>
  );
}
