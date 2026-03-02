const AUTH_STATE_KEY = 'opndrive_cognito_oauth_state';
const AUTH_VERIFIER_KEY = 'opndrive_cognito_pkce_verifier';

export interface CognitoConfig {
  domain: string;
  clientId: string;
  redirectUri: string;
  responseType: string;
  scope: string;
}

export interface CognitoTokenResponse {
  access_token: string;
  id_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

function toBase64Url(input: Uint8Array): string {
  return btoa(String.fromCharCode(...input))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

export function normalizeCognitoDomain(domain: string): string {
  if (!domain) {
    return '';
  }

  if (domain.startsWith('http://') || domain.startsWith('https://')) {
    return domain.replace(/\/$/, '');
  }

  return `https://${domain.replace(/\/$/, '')}`;
}

export function resolveCognitoRedirectUri(value: string): string {
  if (!value) {
    return '';
  }

  try {
    const parsed = new URL(value);
    const nestedRedirectUri = parsed.searchParams.get('redirect_uri');
    return nestedRedirectUri || value;
  } catch {
    return value;
  }
}

export function resolveRuntimeCognitoRedirectUri(value: string): string {
  const resolved = resolveCognitoRedirectUri(value);

  if (typeof window === 'undefined') {
    return resolved;
  }

  const fallback = `${window.location.origin}/auth/callback`;

  if (!resolved) {
    return fallback;
  }

  try {
    const redirectUrl = new URL(resolved, window.location.origin);
    if (redirectUrl.origin !== window.location.origin) {
      return fallback;
    }

    return redirectUrl.toString();
  } catch {
    return fallback;
  }
}

export function generateRandomString(length = 64): string {
  const values = new Uint8Array(length);
  crypto.getRandomValues(values);
  return toBase64Url(values).slice(0, length);
}

export async function createCodeChallenge(verifier: string): Promise<string> {
  if (!crypto?.subtle) {
    throw new Error('Web Crypto API is not available. Please use a modern browser.');
  }
  
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return toBase64Url(new Uint8Array(digest));
}

export function saveOauthState(state: string): void {
  sessionStorage.setItem(AUTH_STATE_KEY, state);
}

export function consumeOauthState(): string | null {
  const state = sessionStorage.getItem(AUTH_STATE_KEY);
  sessionStorage.removeItem(AUTH_STATE_KEY);
  return state;
}

export function savePkceVerifier(verifier: string): void {
  sessionStorage.setItem(AUTH_VERIFIER_KEY, verifier);
}

export function consumePkceVerifier(): string | null {
  const verifier = sessionStorage.getItem(AUTH_VERIFIER_KEY);
  sessionStorage.removeItem(AUTH_VERIFIER_KEY);
  return verifier;
}

export async function exchangeCodeForTokens(
  config: CognitoConfig,
  code: string,
  codeVerifier: string,
  clientSecret?: string
): Promise<CognitoTokenResponse> {
  const tokenUrl = new URL('/oauth2/token', normalizeCognitoDomain(config.domain));
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: config.clientId,
    code,
    code_verifier: codeVerifier,
    redirect_uri: config.redirectUri,
  });

  if (clientSecret) {
    body.set('client_secret', clientSecret);
  }

  const response = await fetch(tokenUrl.toString(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Token exchange failed (${response.status}): ${details || 'Unknown error'}`);
  }

  return (await response.json()) as CognitoTokenResponse;
}