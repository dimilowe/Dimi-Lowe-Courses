'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface SignupFormProps {
  prefillEmail?: string;
}

export function SignupForm({ prefillEmail }: SignupFormProps) {
  const [email, setEmail] = useState(prefillEmail || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      // Signup and create session
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      const data = await res.json();

      if (data.success) {
        // Claim pending purchases
        const claimRes = await fetch('/api/auth/claim-purchases', {
          method: 'POST',
          credentials: 'include',
        });
        
        const claimData = await claimRes.json();
        
        // Trigger automatic downloads for claimed products
        if (claimData.downloadUrls && claimData.downloadUrls.length > 0) {
          claimData.downloadUrls.forEach((url: string, index: number) => {
            setTimeout(() => {
              const link = document.createElement('a');
              link.href = url;
              link.download = '';
              link.click();
            }, index * 500); // Stagger downloads by 500ms
          });
        }
        
        // Force full page reload to update navbar state
        window.location.href = '/dashboard';
      } else {
        setError(data.error || 'Signup failed');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Activate Your Membership</CardTitle>
        <CardDescription>
          Create your account to access your membership library
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading || !!prefillEmail}
            />
          </div>
          <div>
            <Input
              type="password"
              placeholder="Password (min 8 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              minLength={8}
            />
          </div>
          <div>
            <Input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
              minLength={8}
            />
          </div>
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
          <Button
            type="submit"
            className="w-full bg-orange-500 hover:bg-orange-600"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Create Account & Access Membership'}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <a href="/login" className="text-orange-600 hover:text-orange-700 font-medium">
              Sign in
            </a>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
