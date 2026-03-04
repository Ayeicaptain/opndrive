export interface CognitoSession {
  accessToken: string;
  idToken?: string;
  expiresAt: number;
}

const COGNITO_SESSION_KEY = 'cognito_user_session';

export function getCognitoSession(): CognitoSession | null {
  if (typeof window === 'undefined') return null;

  const stored = localStorage.getItem(COGNITO_SESSION_KEY);
  if (!stored) return null;

  try {
    const session = JSON.parse(stored) as CognitoSession;
    if (!session.accessToken || !session.expiresAt) {
      localStorage.removeItem(COGNITO_SESSION_KEY);
      return null;
    }

    if (Date.now() >= session.expiresAt) {
      localStorage.removeItem(COGNITO_SESSION_KEY);
      return null;
    }

    return session;
  } catch {
    localStorage.removeItem(COGNITO_SESSION_KEY);
    return null;
  }
}

export function saveCognitoSession(session: CognitoSession): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(COGNITO_SESSION_KEY, JSON.stringify(session));
}

export function clearCognitoSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(COGNITO_SESSION_KEY);
}
