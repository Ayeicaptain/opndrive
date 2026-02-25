'use client';

import { ReactNode, useMemo } from 'react';
import { AuthProvider } from 'react-oidc-context';
import { createUserManager } from '@/lib/oidc-client';

export function OidcProvider({ children }: { children: ReactNode }) {
  const userManager = useMemo(() => createUserManager(), []);

  return (
    <AuthProvider
      userManager={userManager}
      onSigninCallback={() => {
        if (typeof window !== 'undefined') {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }}
    >
      {children}
    </AuthProvider>
  );
}
