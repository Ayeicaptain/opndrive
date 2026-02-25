'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { hasValidLoginSession } from '@/lib/auth-session';

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    if (hasValidLoginSession()) {
      router.replace('/connect');
      return;
    }

    router.replace('/login');
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <p className="text-sm text-muted-foreground">Redirecting…</p>
    </div>
  );
}
