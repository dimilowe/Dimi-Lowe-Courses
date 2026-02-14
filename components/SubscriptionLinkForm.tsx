'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function SubscriptionLinkForm() {
  const [checkoutSessionId, setCheckoutSessionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/auth/link-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkoutSessionId }),
        credentials: 'include',
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to link subscription');
      }

      setSuccess(data.message || 'Subscription linked successfully.');
      setCheckoutSessionId('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-2 block">Stripe Checkout Session ID</label>
        <Input
          type="text"
          placeholder="cs_test_... or cs_live_..."
          value={checkoutSessionId}
          onChange={(e) => setCheckoutSessionId(e.target.value)}
          required
          disabled={loading}
        />
        <p className="text-xs text-muted-foreground mt-2">
          Use this if you paid while logged out or used a different email at checkout.
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-green-600">{success}</p>}

      <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600" disabled={loading}>
        {loading ? 'Linking Subscription...' : 'Link Subscription to This Account'}
      </Button>
    </form>
  );
}
