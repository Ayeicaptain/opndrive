const AUTH_STATE_KEY = 'opndrive_cognito_oauth_state';
const AUTH_VERIFIER_KEY = 'opndrive_cognito_pkce_verifier';
const POST_AUTH_REDIRECT_KEY = 'opndrive_cognito_post_auth_redirect';

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

/**
 * Supports both a plain callback URL and a full Cognito Hosted UI URL.
 * If a full Hosted UI URL is provided, extract its `redirect_uri` query value.
 */
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

/**
 * Chooses a redirect URI that is safe for the currently running frontend origin.
 *
 * This protects local development when `NEXT_PUBLIC_COGNITO_REDIRECT_URI` is set
 * to a full Hosted UI URL whose nested `redirect_uri` points to another domain.
 */
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

function isSafeInternalPath(path: string): boolean {
  return path.startsWith('/') && !path.startsWith('//');
}

export function savePostAuthRedirect(path: string): void {
  if (!isSafeInternalPath(path)) {
    sessionStorage.removeItem(POST_AUTH_REDIRECT_KEY);
    return;
  }

  sessionStorage.setItem(POST_AUTH_REDIRECT_KEY, path);
}

export function consumePostAuthRedirect(defaultPath = '/connect'): string {
  const path = sessionStorage.getItem(POST_AUTH_REDIRECT_KEY);
  sessionStorage.removeItem(POST_AUTH_REDIRECT_KEY);

  if (!path || !isSafeInternalPath(path)) {
    return defaultPath;
  }

  return path;
}

export async function exchangeCodeForTokens(
  config: CognitoConfig,
  code: string,
  codeVerifier: string
): Promise<CognitoTokenResponse> {
  const tokenUrl = new URL('/oauth2/token', normalizeCognitoDomain(config.domain));
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: config.clientId,
    code,
    code_verifier: codeVerifier,
    redirect_uri: config.redirectUri,
  });

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
