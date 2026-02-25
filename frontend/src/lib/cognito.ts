'use client';

type StoredSession = {
  email?: string;
  accessToken: string;
  idToken?: string;
  tokenType?: string;
  expiresAt: number;
};

type HostedUiTokens = {
  access_token: string;
  id_token?: string;
  token_type?: string;
  expires_in: string;
};

const userPoolId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID;
const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
const cognitoDomain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN;
const configuredRedirectSignIn = process.env.NEXT_PUBLIC_COGNITO_REDIRECT_SIGN_IN;
const configuredRedirectSignOut = process.env.NEXT_PUBLIC_COGNITO_REDIRECT_SIGN_OUT;
const configuredScope = process.env.NEXT_PUBLIC_COGNITO_SCOPE || 'openid email profile';

const sessionStorageKey = 'opndrive_cognito_session';

function getDefaultRedirectSignIn() {
  if (typeof window === 'undefined') {
    return '';
  }

  return `${window.location.origin}/auth/callback`;
}

function getDefaultRedirectSignOut() {
  if (typeof window === 'undefined') {
    return '';
  }

  return `${window.location.origin}/`;
}

function getRedirectSignIn() {
  return configuredRedirectSignIn || getDefaultRedirectSignIn();
}

function getRedirectSignOut() {
  return configuredRedirectSignOut || getDefaultRedirectSignOut();
}

function ensureConfig() {
  if (!userPoolId || !clientId || !cognitoDomain) {
    throw new Error(
      'Cognito Hosted UI is not configured. Set NEXT_PUBLIC_COGNITO_USER_POOL_ID, NEXT_PUBLIC_COGNITO_CLIENT_ID and NEXT_PUBLIC_COGNITO_DOMAIN.'
    );
  }
}

function normalizeDomain(domain: string) {
  return domain.endsWith('/') ? domain.slice(0, -1) : domain;
}

function readStoredSession(): StoredSession | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = localStorage.getItem(sessionStorageKey);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as StoredSession;
    if (!parsed?.accessToken || !parsed?.expiresAt) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function writeStoredSession(payload: StoredSession) {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.setItem(sessionStorageKey, JSON.stringify(payload));
}

function parseJwtEmail(idToken?: string): string | undefined {
  if (!idToken) {
    return undefined;
  }

  try {
    const parts = idToken.split('.');
    if (parts.length < 2) {
      return undefined;
    }

    const payload = JSON.parse(atob(parts[1])) as { email?: string };
    return payload.email;
  } catch {
    return undefined;
  }
}

export function getHostedUiSignInUrl() {
  ensureConfig();

  const authorizeUrl = new URL(`${normalizeDomain(cognitoDomain!)}/oauth2/authorize`);
  authorizeUrl.searchParams.set('client_id', clientId!);
  authorizeUrl.searchParams.set('response_type', 'token');
  authorizeUrl.searchParams.set('scope', configuredScope);
  authorizeUrl.searchParams.set('redirect_uri', getRedirectSignIn());

  return authorizeUrl.toString();
}

export function startHostedUiSignIn() {
  if (typeof window === 'undefined') {
    return;
  }

  const loginUrl = getHostedUiSignInUrl();
  window.location.assign(loginUrl);
}

export function handleHostedUiCallback(hashValue?: string): StoredSession {
  ensureConfig();

  const source = hashValue ?? (typeof window !== 'undefined' ? window.location.hash : '');
  const hash = source.startsWith('#') ? source.slice(1) : source;
  const params = new URLSearchParams(hash);

  const error = params.get('error_description') || params.get('error');
  if (error) {
    throw new Error(error);
  }

  const tokens = Object.fromEntries(params.entries()) as Partial<HostedUiTokens>;
  if (!tokens.access_token || !tokens.expires_in) {
    throw new Error('Hosted UI callback is missing required tokens.');
  }

  const expiresInSeconds = Number(tokens.expires_in);
  if (!Number.isFinite(expiresInSeconds) || expiresInSeconds <= 0) {
    throw new Error('Invalid token expiration from Hosted UI callback.');
  }

  const session: StoredSession = {
    accessToken: tokens.access_token,
    idToken: tokens.id_token,
    tokenType: tokens.token_type,
    email: parseJwtEmail(tokens.id_token),
    expiresAt: Date.now() + expiresInSeconds * 1000,
  };

  writeStoredSession(session);
  return session;
}

export async function getCurrentCognitoUser(): Promise<{
  email?: string;
  accessToken: string;
  idToken?: string;
} | null> {
  try {
    ensureConfig();
    const session = readStoredSession();

    if (!session) {
      return null;
    }

    if (Date.now() >= session.expiresAt) {
      localStorage.removeItem(sessionStorageKey);
      return null;
    }

    return {
      email: session.email,
      accessToken: session.accessToken,
      idToken: session.idToken,
    };
  } catch {
    return null;
  }
}

export function signOutCognitoUser() {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.removeItem(sessionStorageKey);

  try {
    ensureConfig();
    const logoutUrl = new URL(`${normalizeDomain(cognitoDomain!)}/logout`);
    logoutUrl.searchParams.set('client_id', clientId!);
    logoutUrl.searchParams.set('logout_uri', getRedirectSignOut());
    window.location.assign(logoutUrl.toString());
  } catch {
    // no-op when not configured
  }
}
