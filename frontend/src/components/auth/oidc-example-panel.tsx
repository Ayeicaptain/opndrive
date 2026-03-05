'use client';

import { useAuth } from 'react-oidc-context';
import { cognitoAuthConfig, cognitoDomain, cognitoLogoutUri } from '@/config/oidc';

export function OidcExamplePanel() {
  const auth = useAuth();

  const signOutRedirect = () => {
    if (typeof window === 'undefined') {
      return;
    }

    window.location.href = `${cognitoDomain}/logout?client_id=${cognitoAuthConfig.client_id}&logout_uri=${encodeURIComponent(cognitoLogoutUri)}`;
  };

  if (auth.isLoading) {
    return <p className="text-sm text-muted-foreground">Loading OIDC session...</p>;
  }

  if (auth.error) {
    return <p className="text-sm text-destructive">Encountering error... {auth.error.message}</p>;
  }

  if (auth.isAuthenticated) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-foreground">Hello: {auth.user?.profile.email}</p>
        <pre className="overflow-x-auto rounded bg-muted p-2 text-xs">
          ID Token: {auth.user?.id_token}
        </pre>
        <pre className="overflow-x-auto rounded bg-muted p-2 text-xs">
          Access Token: {auth.user?.access_token}
        </pre>
        <pre className="overflow-x-auto rounded bg-muted p-2 text-xs">
          Refresh Token: {auth.user?.refresh_token}
        </pre>

        <button
          className="rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-muted"
          onClick={() => auth.removeUser()}
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <button
        className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        onClick={() => auth.signinRedirect()}
      >
        Sign in
      </button>
      <button
        className="rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-muted"
        onClick={signOutRedirect}
      >
        Sign out
      </button>
    </div>
  );
}
