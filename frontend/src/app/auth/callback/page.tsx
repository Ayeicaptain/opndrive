'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from 'react-oidc-context';

export default function AuthCallbackPage() {
  const router = useRouter();
  const auth = useAuth();

  useEffect(() => {
    if (auth.isAuthenticated) {
      router.replace('/connect');
    }
  }, [auth.isAuthenticated, router]);

  if (auth.error) {
    return <div className="p-6">Authentication failed: {auth.error.message}</div>;
  }

  return <div className="p-6">Completing sign-in...</div>;
}
