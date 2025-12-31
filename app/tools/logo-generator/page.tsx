import { Metadata } from 'next';
import ToolServerGate from '@/components/entitlements/ToolServerGate';
import LogoGeneratorClient from './LogoGeneratorClient';

export const metadata: Metadata = {
  title: 'Free AI Logo Generator',
  description: 'AI-powered logo generator with chat interface. Describe your vision and get 4 unique logo designs instantly.',
};

export default function LogoGeneratorPage() {
  return (
    <ToolServerGate
      slug="logo-generator"
      toolName="Free AI Logo Generator"
      toolDescription="AI-powered logo generator with chat interface. Describe your vision and get 4 unique logo designs instantly."
    >
      <LogoGeneratorClient />
    </ToolServerGate>
  );
}
