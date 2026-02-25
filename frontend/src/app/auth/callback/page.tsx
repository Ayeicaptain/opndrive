'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { handleHostedUiCallback } from '@/lib/cognito';

export default function HostedUiCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      handleHostedUiCallback();
      router.replace('/connect');
    } catch (err) {
      const fallbackMessage = 'Failed to complete Cognito login callback.';
      setError(err instanceof Error ? err.message : fallbackMessage);
    }
  }, [router]);

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center px-4">
        <div className="max-w-md rounded-lg border border-border bg-card p-6">
          <h1 className="text-lg font-semibold text-foreground">Authentication Error</h1>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center">
      <p>Completing sign in...</p>
    </div>
  );
}
