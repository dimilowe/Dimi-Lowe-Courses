import { Metadata } from 'next';
import ToolServerGate from '@/components/entitlements/ToolServerGate';
import OutfitIdeasClient from './OutfitIdeasClient';

export const metadata: Metadata = {
  title: 'Outfit Ideas Generator – Shop Any Look',
  description: 'Upload any outfit photo and instantly find similar items to shop. Recreate celebrity looks, Pinterest inspiration, or your favorite Instagram styles with AI-powered product matching.',
};

export default function OutfitIdeasPage() {
  return (
    <ToolServerGate
      slug="outfit-ideas"
      toolName="Outfit Ideas Generator"
      toolDescription="Upload any outfit photo and instantly find similar items to shop. Recreate celebrity looks, Pinterest inspiration, or your favorite Instagram styles with AI-powered product matching."
    >
      <OutfitIdeasClient />
    </ToolServerGate>
  );
}
