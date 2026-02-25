'use client';

type CognitoAuthResult = {
  AccessToken: string;
  IdToken: string;
  RefreshToken?: string;
  ExpiresIn: number;
  TokenType: string;
};

type StoredSession = {
  email: string;
  auth: CognitoAuthResult;
  expiresAt: number;
};

const userPoolId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID;
const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
const sessionStorageKey = 'opndrive_cognito_session';

function ensureConfig() {
  if (!userPoolId || !clientId) {
    throw new Error(
      'Cognito is not configured. Set NEXT_PUBLIC_COGNITO_USER_POOL_ID and NEXT_PUBLIC_COGNITO_CLIENT_ID.'
    );
  }
}

function getCognitoRegion() {
  ensureConfig();
  const [region] = userPoolId!.split('_');

  if (!region) {
    throw new Error('Invalid Cognito User Pool ID format.');
  }

  return region;
}

function getCognitoEndpoint() {
  const region = getCognitoRegion();
  return `https://cognito-idp.${region}.amazonaws.com/`;
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
    if (!parsed?.auth?.AccessToken || !parsed?.expiresAt) {
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

async function cognitoRequest<T>(target: string, body: unknown): Promise<T> {
  const response = await fetch(getCognitoEndpoint(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Target': `AWSCognitoIdentityProviderService.${target}`,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    const message = data?.message || data?.Message || 'Cognito request failed';
    throw new Error(message);
  }

  return data as T;
}

export async function signInWithCognito(
  email: string,
  password: string
): Promise<CognitoAuthResult> {
  ensureConfig();

  const payload = {
    AuthFlow: 'USER_PASSWORD_AUTH',
    ClientId: clientId,
    AuthParameters: {
      USERNAME: email,
      PASSWORD: password,
    },
  };

  const data = await cognitoRequest<{ AuthenticationResult?: CognitoAuthResult }>(
    'InitiateAuth',
    payload
  );

  if (!data.AuthenticationResult?.AccessToken || !data.AuthenticationResult?.IdToken) {
    throw new Error('Cognito authentication failed. Missing auth tokens.');
  }

  const expiresAt = Date.now() + data.AuthenticationResult.ExpiresIn * 1000;
  writeStoredSession({ email, auth: data.AuthenticationResult, expiresAt });

  return data.AuthenticationResult;
}

export async function getCurrentCognitoUser(): Promise<{
  email?: string;
  accessToken: string;
} | null> {
  try {
    ensureConfig();
    const session = readStoredSession();

    if (!session) {
      return null;
    }

    if (Date.now() >= session.expiresAt) {
      signOutCognitoUser();
      return null;
    }

    return {
      email: session.email,
      accessToken: session.auth.AccessToken,
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
}
