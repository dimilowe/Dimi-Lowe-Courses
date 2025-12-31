import { Metadata } from 'next';
import ToolServerGate from '@/components/entitlements/ToolServerGate';
import CalorieDeficitCalculatorClient from './CalorieDeficitCalculatorClient';

export const metadata: Metadata = {
  title: 'Calorie Deficit Calculator',
  description: 'Upload food photos and health app screenshots to analyze your calorie intake and calculate your daily calorie deficit.',
};

export default function CalorieDeficitCalculatorPage() {
  return (
    <ToolServerGate
      slug="calorie-deficit-calculator"
      toolName="Calorie Deficit Calculator"
      toolDescription="Upload food photos and health app screenshots to analyze your calorie intake and calculate your daily calorie deficit."
    >
      <CalorieDeficitCalculatorClient />
    </ToolServerGate>
  );
}
