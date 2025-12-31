import { Metadata } from 'next';
import ToolServerGate from '@/components/entitlements/ToolServerGate';
import VisualizationClient from './VisualizationClient';

export const metadata: Metadata = {
  title: 'Free Visualization Tool',
  description: 'Turn simple text into diagrams for funnels, workflows, and content systems. Free online visualization tool.',
};

export default function VisualizationPage() {
  return (
    <ToolServerGate
      slug="visualization"
      toolName="Free Visualization Tool"
      toolDescription="Turn simple text into diagrams for funnels, workflows, and content systems. Free online visualization tool."
    >
      <VisualizationClient />
    </ToolServerGate>
  );
}
