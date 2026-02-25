'use client';

import { UserManager, WebStorageStateStore } from 'oidc-client-ts';

const cognitoDomain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN;
const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
const configuredRedirectSignIn = process.env.NEXT_PUBLIC_COGNITO_REDIRECT_SIGN_IN;
const configuredRedirectSignOut = process.env.NEXT_PUBLIC_COGNITO_REDIRECT_SIGN_OUT;
const configuredScope = process.env.NEXT_PUBLIC_COGNITO_SCOPE || 'openid profile email';

function getWindowOrigin() {
  if (typeof window === 'undefined') {
    return 'http://localhost:3000';
  }

  return window.location.origin;
}

function getRedirectSignIn() {
  return configuredRedirectSignIn || `${getWindowOrigin()}/auth/callback`;
}

function getRedirectSignOut() {
  return configuredRedirectSignOut || `${getWindowOrigin()}/`;
}

function normalizeDomain(domain: string) {
  return domain.endsWith('/') ? domain.slice(0, -1) : domain;
}

export function hasOidcConfig() {
  return Boolean(cognitoDomain && clientId);
}

export function ensureOidcConfig() {
  if (!hasOidcConfig()) {
    throw new Error(
      'Cognito Hosted UI is not configured. Set NEXT_PUBLIC_COGNITO_DOMAIN and NEXT_PUBLIC_COGNITO_CLIENT_ID.'
    );
  }
}

export function buildOidcConfig() {
  const authority = hasOidcConfig() ? normalizeDomain(cognitoDomain!) : getWindowOrigin();
  const resolvedClientId = hasOidcConfig() ? clientId! : 'opndrive-placeholder-client-id';

  return {
    authority,
    client_id: resolvedClientId,
    redirect_uri: getRedirectSignIn(),
    post_logout_redirect_uri: getRedirectSignOut(),
    response_type: 'code',
    scope: configuredScope,
    userStore:
      typeof window === 'undefined'
        ? undefined
        : new WebStorageStateStore({ store: window.localStorage }),
  };
}

export function createUserManager() {
  return new UserManager(buildOidcConfig());
}

export function getHostedUiLogoutUrl() {
  ensureOidcConfig();
  const logoutUrl = new URL(`${normalizeDomain(cognitoDomain!)}/logout`);
  logoutUrl.searchParams.set('client_id', clientId!);
  logoutUrl.searchParams.set('logout_uri', getRedirectSignOut());
  return logoutUrl.toString();
}
