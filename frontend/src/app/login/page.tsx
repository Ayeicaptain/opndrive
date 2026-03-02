'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { hasValidLoginSession } from '@/lib/auth-session';
import {
  createCodeChallenge,
  generateRandomString,
  normalizeCognitoDomain,
  resolveRuntimeCognitoRedirectUri,
  saveOauthState,
  savePkceVerifier,
} from '@/lib/cognito-auth';

export default function LoginPage() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [error, setError] = useState('');

  // Prevent SSR issues
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const cognitoDomain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN ?? '';
  const cognitoClientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID ?? '';
  const cognitoRedirectUri = resolveRuntimeCognitoRedirectUri(
    process.env.NEXT_PUBLIC_COGNITO_REDIRECT_URI ?? ''
  );
  const cognitoLoginUrl = process.env.NEXT_PUBLIC_COGNITO_LOGIN_URL ?? '';
  const cognitoResponseType = process.env.NEXT_PUBLIC_COGNITO_RESPONSE_TYPE ?? 'code';
  const cognitoScope = process.env.NEXT_PUBLIC_COGNITO_SCOPE ?? 'openid email profile';

  const isConfigured = Boolean(
    cognitoLoginUrl || (cognitoDomain && cognitoClientId && cognitoRedirectUri)
  );
  const isCodeFlow = cognitoResponseType === 'code';

  const baseLoginUrl = useMemo(() => {
    if (!isConfigured) {
      return null;
    }

    const url = cognitoLoginUrl
      ? new URL(cognitoLoginUrl)
      : new URL('/oauth2/authorize', normalizeCognitoDomain(cognitoDomain));

    if (!cognitoLoginUrl) {
      url.searchParams.set('client_id', cognitoClientId);
      url.searchParams.set('response_type', cognitoResponseType);
      url.searchParams.set('scope', cognitoScope);
      url.searchParams.set('redirect_uri', cognitoRedirectUri);
      url.searchParams.set('prompt', 'login');
    }

    return url;
  }, [
    cognitoLoginUrl,
    cognitoDomain,
    cognitoClientId,
    cognitoRedirectUri,
    cognitoResponseType,
    cognitoScope,
    isConfigured,
  ]);

  const startLogin = async () => {
    if (!isConfigured || !baseLoginUrl) {
      return;
    }

    setIsRedirecting(true);
    setError('');

    try {
      const loginUrl = new URL(baseLoginUrl.toString());
      const state = generateRandomString(32);
      saveOauthState(state);
      loginUrl.searchParams.set('state', state);

      if (isCodeFlow) {
        const verifier = generateRandomString(96);
        const challenge = await createCodeChallenge(verifier);
        savePkceVerifier(verifier);
        loginUrl.searchParams.set('code_challenge_method', 'S256');
        loginUrl.searchParams.set('code_challenge', challenge);
      }

      // Add small delay to let browser render first
      await new Promise(resolve => setTimeout(resolve, 100));
      window.location.href = loginUrl.toString();
    } catch (loginError) {
      setError(
        loginError instanceof Error ? loginError.message : 'Failed to start Cognito sign-in.'
      );
      setIsRedirecting(false);
    }
  };

  // Auto-redirect to Cognito on mount (with delay)
  useEffect(() => {
    if (isMounted && isConfigured && baseLoginUrl) {
      if (hasValidLoginSession()) {
        router.push('/connect');
      } else {
        // Small delay before redirect
        const timer = setTimeout(() => {
          startLogin();
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [isMounted, isConfigured, baseLoginUrl, router]);

  // Prevent SSR
  if (!isMounted) {
    return null;
  }

  // Show error if not configured
  if (!isConfigured) {
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
            <h1 className="text-2xl font-semibold text-foreground">Sign in with AWS Cognito</h1>
            <div className="mt-6 rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
              Configure <code>NEXT_PUBLIC_COGNITO_DOMAIN</code>,{' '}
              <code>NEXT_PUBLIC_COGNITO_CLIENT_ID</code>, and{' '}
              <code>NEXT_PUBLIC_COGNITO_REDIRECT_URI</code> to enable login.
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Show redirecting message
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <p className="text-muted-foreground">Redirecting to login...</p>
        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      </div>
    </div>
  );
}