import { Metadata } from 'next';
import ToolServerGate from '@/components/entitlements/ToolServerGate';
import AdCopyAnalyzerClient from './AdCopyAnalyzerClient';

export const metadata: Metadata = {
  title: 'Ad Copy Analyzer',
  description: 'Analyze and improve your ad copy with AI-powered insights. Get detailed scoring, diagnosis, and rewrite suggestions for better performing ads.',
};

export default function AdCopyAnalyzerPage() {
  return (
    <ToolServerGate
      slug="ad-copy-analyzer"
      toolName="Ad Copy Analyzer"
      toolDescription="Analyze and improve your ad copy with AI-powered insights. Get detailed scoring, diagnosis, and rewrite suggestions for better performing ads."
    >
      <AdCopyAnalyzerClient />
    </ToolServerGate>
  );
}
