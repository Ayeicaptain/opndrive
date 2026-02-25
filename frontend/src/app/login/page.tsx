'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { hasValidLoginSession } from '@/lib/auth-session';
import { normalizeCognitoDomain } from '@/lib/cognito-auth';

const DEFAULT_COGNITO_LOGIN_URL =
  'https://ap-southeast-1bhrpdpicz.auth.ap-southeast-1.amazoncognito.com/login/continue?client_id=1h43m87chpee1h21hu8cqdhod6&redirect_uri=https%3A%2F%2Fd2o3xdxglqbqup.cloudfront.net&response_type=code&scope=email+openid+phone&state=4Ubs6UdPHyN7YOO-p85DH2kVtS5Z8IbM';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');

  const cognitoDomain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN ?? '';
  const cognitoClientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID ?? '';
  const cognitoRedirectUri = process.env.NEXT_PUBLIC_COGNITO_REDIRECT_URI ?? '';
  const cognitoResponseType = process.env.NEXT_PUBLIC_COGNITO_RESPONSE_TYPE ?? 'code';
  const cognitoScope = process.env.NEXT_PUBLIC_COGNITO_SCOPE ?? 'openid email profile';
  const cognitoLoginUrl = process.env.NEXT_PUBLIC_COGNITO_LOGIN_URL ?? DEFAULT_COGNITO_LOGIN_URL;

  const loginUrl = useMemo(() => {
    if (cognitoLoginUrl) {
      return cognitoLoginUrl;
    }

    if (!cognitoDomain || !cognitoClientId || !cognitoRedirectUri) {
      return '';
    }

    const url = cognitoLoginUrl
      ? new URL(cognitoLoginUrl)
      : new URL('/oauth2/authorize', normalizeCognitoDomain(cognitoDomain));

    if (!cognitoLoginUrl) {
      url.searchParams.set('client_id', cognitoClientId);
      url.searchParams.set('response_type', cognitoResponseType);
      url.searchParams.set('scope', cognitoScope);
      url.searchParams.set('redirect_uri', cognitoRedirectUri);
    }

    return url.toString();
  }, [
    cognitoLoginUrl,
    cognitoDomain,
    cognitoClientId,
    cognitoRedirectUri,
    cognitoResponseType,
    cognitoScope,
  ]);

  useEffect(() => {
    if (hasValidLoginSession()) {
      router.replace('/connect');
      return;
    }

    if (!loginUrl) {
      setError('Missing Cognito configuration for login redirect.');
      return;
    }

    window.location.replace(loginUrl);
  }, [loginUrl, router]);

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
          <h1 className="text-2xl font-semibold text-foreground">Redirecting to AWS Cognito…</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            You are being redirected automatically. No additional click is required.
          </p>
          {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
        </div>
      </main>
    </div>
  );
}
