import { Metadata } from 'next';
import ToolServerGate from '@/components/entitlements/ToolServerGate';
import SummarizerClient from './SummarizerClient';

export const metadata: Metadata = {
  title: 'Free AI Text Summarizer | Summarize Any Article or Document',
  description: 'Summarize long articles, documents, and text instantly with our free AI summarizer. Get concise summaries and key takeaways. No login required.',
};

export default function SummarizerPage() {
  return (
    <ToolServerGate
      slug="summarizer"
      toolName="AI Text Summarizer"
      toolDescription="Summarize long articles, documents, and text instantly with AI."
    >
      <SummarizerClient />
    </ToolServerGate>
  );
}
