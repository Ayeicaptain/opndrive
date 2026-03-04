'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveCognitoSession } from '@/lib/cognito-auth';

export default function CognitoCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState('Completing Cognito login...');

  useEffect(() => {
    const processCallback = () => {
      const hash = window.location.hash.startsWith('#')
        ? window.location.hash.slice(1)
        : window.location.hash;
      const query = window.location.search.startsWith('?')
        ? window.location.search.slice(1)
        : window.location.search;

      const hashParams = new URLSearchParams(hash);
      const queryParams = new URLSearchParams(query);
      const accessToken = hashParams.get('access_token') ?? queryParams.get('access_token');
      const idToken = hashParams.get('id_token') ?? queryParams.get('id_token') ?? undefined;
      const expiresInValue =
        hashParams.get('expires_in') ?? queryParams.get('expires_in') ?? '3600';
      const expiresInSeconds = Number.parseInt(expiresInValue, 10);

      if (!accessToken) {
        setMessage('Cognito login failed. No access token received.');
        return;
      }

      saveCognitoSession({
        accessToken,
        idToken,
        expiresAt: Date.now() + (Number.isNaN(expiresInSeconds) ? 3600 : expiresInSeconds) * 1000,
      });

      router.replace('/connect/aws');
    };

    processCallback();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
