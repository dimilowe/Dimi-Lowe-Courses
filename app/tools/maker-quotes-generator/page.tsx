import { Metadata } from 'next';
import ToolServerGate from '@/components/entitlements/ToolServerGate';
import MakerQuotesGeneratorClient from './MakerQuotesGeneratorClient';

export const metadata: Metadata = {
  title: 'Maker Quotes Generator',
  description: 'Generate inspiring quotes for makers, entrepreneurs, and creators. Filter by topic and tone to find the perfect quote for your content.',
};

export default function MakerQuotesGeneratorPage() {
  return (
    <ToolServerGate
      slug="maker-quotes-generator"
      toolName="Maker Quotes Generator"
      toolDescription="Generate inspiring quotes for makers, entrepreneurs, and creators. Filter by topic and tone to find the perfect quote for your content."
    >
      <MakerQuotesGeneratorClient />
    </ToolServerGate>
  );
}
