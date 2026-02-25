'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/shared/components/ui';
import { saveLoginSession } from '@/lib/auth-session';

type CallbackStatus = 'processing' | 'error';

function parseOauthHash(hash: string): URLSearchParams {
  return new URLSearchParams(hash.replace(/^#/, ''));
}

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<CallbackStatus>('processing');
  const [errorMessage, setErrorMessage] = useState('');

  const supportMessage = useMemo(
    () => 'Please verify your Cognito App Client callback URL and OAuth response type.',
    []
  );

  useEffect(() => {
    const params = parseOauthHash(window.location.hash);

    const oauthError = params.get('error_description') || params.get('error');
    if (oauthError) {
      setStatus('error');
      setErrorMessage(oauthError);
      return;
    }

    const idToken = params.get('id_token');
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token') ?? undefined;
    const expiresIn = Number(params.get('expires_in') || 3600);

    if (!idToken || !accessToken || Number.isNaN(expiresIn)) {
      setStatus('error');
      setErrorMessage('Missing required OAuth tokens from Cognito callback.');
      return;
    }

    saveLoginSession({
      idToken,
      accessToken,
      refreshToken,
      expiresAt: Date.now() + expiresIn * 1000,
    });

    router.push('/connect');
  }, [router]);

  if (status === 'processing') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <p className="text-sm text-muted-foreground">Completing sign-in…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10 md:py-16">
        <div className="mx-auto w-full max-w-md rounded-xl border border-border bg-card p-6 md:p-8 shadow-sm">
          <h1 className="text-xl font-semibold text-foreground">
            Could not complete Cognito login
          </h1>
          <p className="mt-2 text-sm text-destructive">{errorMessage}</p>
          <p className="mt-2 text-xs text-muted-foreground">{supportMessage}</p>

          <Button type="button" className="mt-6 w-full" onClick={() => router.push('/login')}>
            Try sign-in again
          </Button>
        </div>
      </main>
    </div>
  );
}
