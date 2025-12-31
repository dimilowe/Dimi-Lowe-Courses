import { Metadata } from 'next';
import ToolServerGate from '@/components/entitlements/ToolServerGate';
import ProducerTagGeneratorClient from './ProducerTagGeneratorClient';

export const metadata: Metadata = {
  title: 'Producer Tag Generator',
  description: 'Generate custom producer tags for your music. Add professional vocal tags to your beats with multiple voice options and customizable settings.',
};

export default function ProducerTagGeneratorPage() {
  return (
    <ToolServerGate
      slug="producer-tag-generator"
      toolName="Producer Tag Generator"
      toolDescription="Generate custom producer tags for your music. Add professional vocal tags to your beats with multiple voice options and customizable settings."
    >
      <ProducerTagGeneratorClient />
    </ToolServerGate>
  );
}
