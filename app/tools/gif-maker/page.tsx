import { Metadata } from 'next';
import ToolServerGate from '@/components/entitlements/ToolServerGate';
import GifMakerClient from './GifMakerClient';

export const metadata: Metadata = {
  title: 'Free GIF Maker',
  description: 'Create GIFs from videos or images. Convert MP4, WebM to GIF or combine multiple images into animated GIFs. Free, runs in your browser.',
};

export default function GifMakerPage() {
  return (
    <ToolServerGate
      slug="gif-maker"
      toolName="Free GIF Maker"
      toolDescription="Create GIFs from videos or images. Convert MP4, WebM to GIF or combine multiple images into animated GIFs. Free, runs in your browser."
    >
      <GifMakerClient />
    </ToolServerGate>
  );
}
