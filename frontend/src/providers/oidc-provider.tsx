'use client';

import type { PropsWithChildren } from 'react';
import { AuthProvider } from 'react-oidc-context';
import { cognitoAuthConfig } from '@/config/oidc';

export function OidcProvider({ children }: PropsWithChildren) {
  return (
    <AuthProvider
      {...cognitoAuthConfig}
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
