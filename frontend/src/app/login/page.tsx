'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/shared/components/ui';
import { getCurrentCognitoUser, startHostedUiSignIn } from '@/lib/cognito';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    const checkExistingSession = async () => {
      const hasS3Session = localStorage.getItem('s3_user_session');
      if (hasS3Session) {
        router.push('/dashboard');
        return;
      }

      const cognitoUser = await getCurrentCognitoUser();
      if (cognitoUser) {
        router.push('/connect');
      }
    };

    checkExistingSession();
  }, [router]);

  const handleHostedLogin = () => {
    setError('');
    setIsRedirecting(true);

    try {
      startHostedUiSignIn();
    } catch (err) {
      const fallbackMessage = 'Failed to redirect to Cognito Hosted UI.';
      setError(err instanceof Error ? err.message : fallbackMessage);
      setIsRedirecting(false);
    }
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

      <main className="container mx-auto px-4 py-10 md:py-16">
        <div className="mx-auto w-full max-w-md rounded-xl border border-border bg-card p-6 md:p-8 shadow-sm">
          <h1 className="text-2xl font-semibold text-foreground">Login to Opndrive</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            You will be redirected to your AWS Cognito Hosted UI to sign in.
          </p>

          <div className="mt-6 space-y-4">
            <Button
              type="button"
              className="w-full"
              disabled={isRedirecting}
              onClick={handleHostedLogin}
            >
              {isRedirecting ? 'Redirecting...' : 'Continue with Cognito'}
            </Button>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        </div>
      </main>
    </div>
  );
}
