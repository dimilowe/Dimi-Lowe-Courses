import { Metadata } from 'next';
import ToolServerGate from '@/components/entitlements/ToolServerGate';
import HoroscopeOfTheDayClient from './HoroscopeOfTheDayClient';

export const metadata: Metadata = {
  title: 'Horoscope of the Day',
  description: 'Get your real AF horoscope of the day. Choose your zodiac sign and let our brutally honest AI generator give you today\'s no-BS reading.',
};

export default function HoroscopeOfTheDayPage() {
  return (
    <ToolServerGate
      slug="horoscope-of-the-day"
      toolName="Horoscope of the Day"
      toolDescription="Get your real AF horoscope of the day. Choose your zodiac sign and let our brutally honest AI generator give you today's no-BS reading."
    >
      <HoroscopeOfTheDayClient />
    </ToolServerGate>
  );
}
