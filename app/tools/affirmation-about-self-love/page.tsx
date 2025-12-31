import { Metadata } from 'next';
import ToolServerGate from '@/components/entitlements/ToolServerGate';
import AffirmationAboutSelfLoveClient from './AffirmationAboutSelfLoveClient';

export const metadata: Metadata = {
  title: 'Daily Self-Love Affirmations',
  description: 'Get personalized daily affirmations for self-love and confidence. Choose your focus area and tone for custom affirmations that resonate with you.',
};

export default function AffirmationAboutSelfLovePage() {
  return (
    <ToolServerGate
      slug="affirmation-about-self-love"
      toolName="Daily Self-Love Affirmations"
      toolDescription="Get personalized daily affirmations for self-love and confidence. Choose your focus area and tone for custom affirmations that resonate with you."
    >
      <AffirmationAboutSelfLoveClient />
    </ToolServerGate>
  );
}
