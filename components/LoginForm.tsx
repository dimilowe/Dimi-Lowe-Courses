'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface LoginFormProps {
  prefillEmail?: string;
}

export function LoginForm({ prefillEmail }: LoginFormProps) {
  const [email, setEmail] = useState(prefillEmail || '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get('next');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      const data = await res.json();

      if (data.success) {
        // Check for new purchases and trigger downloads
        const claimRes = await fetch('/api/auth/claim-purchases', {
          method: 'POST',
          credentials: 'include',
        });
        
        const claimData = await claimRes.json();
        
        // Trigger automatic downloads for any newly claimed products
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
        
        let redirectTo = '/dashboard';
        if (nextUrl && nextUrl.startsWith('/') && !nextUrl.startsWith('//')) {
          redirectTo = nextUrl;
        }
        window.location.href = redirectTo;
      } else {
        setError(data.error || 'Login failed');
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
        <CardTitle>Welcome Back</CardTitle>
        <CardDescription>
          Login to access your purchased products
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
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
            {loading ? 'Logging in...' : 'Login'}
          </Button>
          <div className="flex items-center justify-between text-sm">
            <a href="/forgot-password" className="text-orange-600 hover:text-orange-700">
              Forgot password?
            </a>
            <a href="/forgot-username" className="text-orange-600 hover:text-orange-700">
              Forgot username?
            </a>
          </div>
          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <a href="/signup" className="text-orange-600 hover:text-orange-700 font-medium">
              Sign up
            </a>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
