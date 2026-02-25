'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { hasValidLoginSession } from '@/lib/auth-session';

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(hasValidLoginSession() ? '/connect' : '/login');
  }, [router]);

  return (
    <main className="min-h-screen grid place-items-center px-4">
      <p className="text-sm text-muted-foreground">Redirecting…</p>
    </main>
  );
}
