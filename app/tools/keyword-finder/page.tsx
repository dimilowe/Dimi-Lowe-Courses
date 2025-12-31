import { Metadata } from 'next';
import ToolServerGate from '@/components/entitlements/ToolServerGate';
import KeywordFinderClient from './KeywordFinderClient';

export const metadata: Metadata = {
  title: 'Free Keyword Tool for SEO',
  description: 'Free keyword tool for SEO that finds low-competition, long-tail keyword opportunities you can actually rank for.',
};

export default function KeywordFinderPage() {
  return (
    <ToolServerGate
      slug="keyword-finder"
      toolName="Free Keyword Tool for SEO"
      toolDescription="Free keyword tool for SEO that finds low-competition, long-tail keyword opportunities you can actually rank for."
    >
      <KeywordFinderClient />
    </ToolServerGate>
  );
}
