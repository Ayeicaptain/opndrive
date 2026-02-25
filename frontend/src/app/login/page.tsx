'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/shared/components/ui';
import { useAuth } from 'react-oidc-context';
import { hasOidcConfig } from '@/lib/oidc-client';

export default function LoginPage() {
  const router = useRouter();
  const oidcAuth = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    if (oidcAuth.isAuthenticated) {
      const hasS3Session = localStorage.getItem('s3_user_session');
      router.push(hasS3Session ? '/dashboard' : '/connect');
    }
  }, [oidcAuth.isAuthenticated, router]);

  const handleHostedLogin = async () => {
    setError('');

    try {
      if (!hasOidcConfig()) {
        throw new Error(
          'Cognito Hosted UI is not configured. Set NEXT_PUBLIC_COGNITO_DOMAIN and NEXT_PUBLIC_COGNITO_CLIENT_ID.'
        );
      }
      await oidcAuth.signinRedirect();
    } catch (err) {
      const fallbackMessage = 'Failed to redirect to Cognito Hosted UI.';
      setError(err instanceof Error ? err.message : fallbackMessage);
    }
  };

  const isBusy = oidcAuth.isLoading || oidcAuth.activeNavigator === 'signinRedirect';

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
          <h1 className="text-2xl font-semibold text-foreground">Login to Opndrive</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            You will be redirected to your AWS Cognito Hosted UI to sign in.
          </p>

          <div className="mt-6 space-y-4">
            <Button type="button" className="w-full" disabled={isBusy} onClick={handleHostedLogin}>
              {isBusy ? 'Redirecting...' : 'Continue with Cognito'}
            </Button>

            {(error || oidcAuth.error) && (
              <p className="text-sm text-destructive">{error || oidcAuth.error?.message}</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
