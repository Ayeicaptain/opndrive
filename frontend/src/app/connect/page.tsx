'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Lock, LogIn } from 'lucide-react';
import { Button } from '@/shared/components/ui';
import { getCognitoSession } from '@/lib/cognito-auth';

const cognitoDomain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN;
const cognitoClientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
const cognitoScope = process.env.NEXT_PUBLIC_COGNITO_SCOPE ?? 'openid profile email';
const cognitoResponseType = process.env.NEXT_PUBLIC_COGNITO_RESPONSE_TYPE ?? 'token';

export default function ConnectLoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const redirectUri = useMemo(() => {
    if (typeof window === 'undefined') {
      return process.env.NEXT_PUBLIC_COGNITO_REDIRECT_URI ?? '';
    }

    return (
      process.env.NEXT_PUBLIC_COGNITO_REDIRECT_URI ?? `${window.location.origin}/connect/callback`
    );
  }, []);

  const isConfigured = Boolean(cognitoDomain && cognitoClientId && redirectUri);

  useEffect(() => {
    if (getCognitoSession()) {
      router.replace('/connect/aws');
    }
  }, [router]);

  const handleCognitoLogin = () => {
    if (!isConfigured) return;
    setIsLoading(true);

    const normalizedDomain = cognitoDomain?.startsWith('http')
      ? cognitoDomain
      : `https://${cognitoDomain}`;

    const authUrl = `${normalizedDomain}/oauth2/authorize?client_id=${encodeURIComponent(
      cognitoClientId!
    )}&response_type=${encodeURIComponent(cognitoResponseType)}&scope=${encodeURIComponent(
      cognitoScope
    )}&redirect_uri=${encodeURIComponent(redirectUri)}`;

    window.location.href = authUrl;
  };

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

      <main className="container mx-auto px-4 py-16">
        <div className="max-w-xl mx-auto rounded-xl border border-border bg-card p-8 shadow-sm space-y-6">
          <div className="space-y-2 text-center">
            <p className="inline-flex items-center justify-center gap-2 text-sm text-primary font-medium">
              <Lock className="h-4 w-4" />
              Step 1 of 2
            </p>
            <h1 className="text-2xl font-semibold">Sign in with AWS Cognito</h1>
            <p className="text-sm text-muted-foreground">
              Authenticate first, then continue to the AWS S3 connection form to configure Access
              Key and Secret Key.
            </p>
          </div>

          {!isConfigured && (
            <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-300">
              Cognito is not configured. Add <code>NEXT_PUBLIC_COGNITO_DOMAIN</code>,{' '}
              <code>NEXT_PUBLIC_COGNITO_CLIENT_ID</code>, and optionally{' '}
              <code>NEXT_PUBLIC_COGNITO_REDIRECT_URI</code>.
            </div>
          )}

          <Button
            onClick={handleCognitoLogin}
            disabled={!isConfigured || isLoading}
            className="w-full"
          >
            <LogIn className="h-4 w-4 mr-2" />
            {isLoading ? 'Redirecting to Cognito...' : 'Continue with Cognito'}
          </Button>
        </div>
      </main>
    </div>
  );
}
