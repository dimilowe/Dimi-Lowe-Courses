import { Metadata } from 'next';
import ToolServerGate from '@/components/entitlements/ToolServerGate';
import InternalLinkSeoAuditClient from './InternalLinkSeoAuditClient';

export const metadata: Metadata = {
  title: 'Internal Link SEO Audit',
  description: 'Audit your website internal linking structure. Find orphan pages, weak pages, and optimize your site architecture for better SEO.',
};

export default function InternalLinkSeoAuditPage() {
  return (
    <ToolServerGate
      slug="internal-link-seo-audit"
      toolName="Internal Link SEO Audit"
      toolDescription="Audit your website internal linking structure. Find orphan pages, weak pages, and optimize your site architecture for better SEO."
    >
      <InternalLinkSeoAuditClient />
    </ToolServerGate>
  );
}
