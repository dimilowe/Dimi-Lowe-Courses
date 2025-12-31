import { Metadata } from 'next';
import ToolServerGate from '@/components/entitlements/ToolServerGate';
import AiHumanizerFreeClient from './AiHumanizerFreeClient';

export const metadata: Metadata = {
  title: 'Free AI Humanizer',
  description: 'Analyze and humanize AI-generated text. Detect AI patterns and get suggestions to make your content sound more natural and human-written.',
};

export default function AiHumanizerFreePage() {
  return (
    <ToolServerGate
      slug="ai-humanizer-free"
      toolName="Free AI Humanizer"
      toolDescription="Analyze and humanize AI-generated text. Detect AI patterns and get suggestions to make your content sound more natural and human-written."
    >
      <AiHumanizerFreeClient />
    </ToolServerGate>
  );
}
