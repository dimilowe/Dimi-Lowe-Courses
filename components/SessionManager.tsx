'use client';

import { useEffect, useState } from 'react';
import { LoginForm } from './LoginForm';
import { SignupForm } from './SignupForm';
import { Card, CardContent } from './ui/card';

export function SessionManager({ sessionId }: { sessionId?: string }) {
  const [status, setStatus] = useState<'loading' | 'signup' | 'login' | 'error'>('loading');
  const [email, setEmail] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (sessionId) {
      fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
        credentials: 'include',
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.userExists === true) {
            setStatus('login');
            setEmail(data.email);
          } else if (data.userExists === false) {
            setStatus('signup');
            setEmail(data.email);
          } else if (data.error) {
            setStatus('error');
            setError(data.error);
          }
        })
        .catch((error) => {
          console.error('Session check failed:', error);
          setStatus('error');
          setError('Failed to verify purchase. Please try again.');
        });
    }
  }, [sessionId]);

  if (status === 'loading') {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="py-12 text-center">
          <p className="text-lg text-muted-foreground">
            Verifying your purchase...
          </p>
        </CardContent>
      </Card>
    );
  }

  if (status === 'error') {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="py-12 text-center">
          <p className="text-lg text-red-600 mb-4">{error}</p>
          <p className="text-sm text-muted-foreground">
            Please contact support if this issue persists.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (status === 'signup') {
    return <SignupForm prefillEmail={email} />;
  }

  if (status === 'login') {
    return (
      <div className="space-y-4">
        <div className="text-center mb-6">
          <p className="text-lg text-green-600 font-medium">Subscription successful.</p>
          <p className="text-muted-foreground">Login to access your membership library.</p>
        </div>
        <LoginForm prefillEmail={email} />
      </div>
    );
  }

  return null;
}
