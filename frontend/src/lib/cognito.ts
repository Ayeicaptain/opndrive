'use client';

import { createUserManager, getHostedUiLogoutUrl } from '@/lib/oidc-client';

/**
 * Backward-compatible helpers kept to avoid breaking older imports.
 * New auth integration should use react-oidc-context + oidc-client-ts directly.
 */

export async function signInWithCognito() {
  await createUserManager().signinRedirect();
}

export async function getCurrentCognitoUser() {
  const user = await createUserManager().getUser();
  if (!user || user.expired) {
    return null;
  }

  return {
    email: user.profile?.email as string | undefined,
    accessToken: user.access_token,
    idToken: user.id_token,
  };
}

export function startHostedUiSignIn() {
  void createUserManager().signinRedirect();
}

export function signOutCognitoUser() {
  void createUserManager().removeUser();
  window.location.assign(getHostedUiLogoutUrl());
}
