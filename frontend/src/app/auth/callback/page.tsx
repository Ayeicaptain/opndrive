'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from 'react-oidc-context';

export default function HostedUiCallbackPage() {
  const router = useRouter();
  const oidcAuth = useAuth();

  useEffect(() => {
    if (oidcAuth.isAuthenticated) {
      router.replace('/connect');
    }
  }, [oidcAuth.isAuthenticated, router]);

  if (oidcAuth.error) {
    return (
      <div className="flex h-screen items-center justify-center px-4">
        <div className="max-w-md rounded-lg border border-border bg-card p-6">
          <h1 className="text-lg font-semibold text-foreground">Authentication Error</h1>
          <p className="mt-2 text-sm text-muted-foreground">{oidcAuth.error.message}</p>
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
