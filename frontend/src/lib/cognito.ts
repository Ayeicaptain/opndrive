'use client';

import {
  AuthenticationDetails,
  CognitoUser,
  CognitoUserPool,
  type CognitoUserSession,
} from 'amazon-cognito-identity-js';

const userPoolId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID;
const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;

function ensureConfig() {
  if (!userPoolId || !clientId) {
    throw new Error(
      'Cognito is not configured. Set NEXT_PUBLIC_COGNITO_USER_POOL_ID and NEXT_PUBLIC_COGNITO_CLIENT_ID.'
    );
  }
}

export function getCognitoUserPool(): CognitoUserPool {
  ensureConfig();
  return new CognitoUserPool({
    UserPoolId: userPoolId!,
    ClientId: clientId!,
  });
}

export function signInWithCognito(email: string, password: string): Promise<CognitoUserSession> {
  const pool = getCognitoUserPool();
  const authDetails = new AuthenticationDetails({ Username: email, Password: password });
  const user = new CognitoUser({ Username: email, Pool: pool });

  return new Promise((resolve, reject) => {
    user.authenticateUser(authDetails, {
      onSuccess: (session) => resolve(session),
      onFailure: (error) => reject(error),
      newPasswordRequired: () => {
        reject(new Error('New password required. Complete this flow in your Cognito user setup.'));
      },
    });
  });
}

export function getCurrentCognitoUser(): Promise<CognitoUser | null> {
  try {
    const pool = getCognitoUserPool();
    const user = pool.getCurrentUser();

    if (!user) {
      return Promise.resolve(null);
    }

    return new Promise((resolve) => {
      user.getSession((err: Error | null, session: CognitoUserSession | null) => {
        if (err || !session?.isValid()) {
          resolve(null);
          return;
        }

        resolve(user);
      });
    });
  } catch {
    return Promise.resolve(null);
  }
}

export function signOutCognitoUser() {
  try {
    const pool = getCognitoUserPool();
    const user = pool.getCurrentUser();
    user?.signOut();
  } catch {
    // no-op for non-configured environments
  }
}
