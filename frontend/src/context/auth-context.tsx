'use client';

import type React from 'react';
import { createContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  BYOS3ApiProvider,
  Credentials,
  UploadManager,
  SignedUrlUploadManager,
} from '@opndrive/s3-api';
import { useDriveStore } from './data-context';

// ✅ NEW: logout flag
const LOGGED_OUT_KEY = 'just_logged_out';

interface AuthContextType {
  apiS3: BYOS3ApiProvider | null;
  uploadManager: UploadManager | null;
  signedUrlUploadManager: SignedUrlUploadManager | null;
  userCreds: Credentials | null;
  isLoading: boolean;
  createSession: (creds: Credentials) => Promise<void>;
  clearSession: () => void;
}

function isValidCreds(c: Credentials): c is Credentials {
  return (
    typeof c?.accessKeyId === 'string' &&
    typeof c?.secretAccessKey === 'string' &&
    typeof c?.region === 'string'
  );
}

export const AuthContext = createContext<AuthContextType>({
  apiS3: null,
  uploadManager: null,
  signedUrlUploadManager: null,
  userCreds: null,
  isLoading: true,
  createSession: async () => {
    throw new Error('AuthContext not initialized');
  },
  clearSession: () => {
    throw new Error('AuthContext not initialized');
  },
});

const STORAGE_KEY = 's3_user_session';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [apiS3, setApiS3] = useState<BYOS3ApiProvider | null>(null);
  const [uploadManager, setUploadManager] = useState<UploadManager | null>(null);
  const [signedUrlUploadManager, setSignedUrlUploadManager] =
    useState<SignedUrlUploadManager | null>(null);
  const [userCreds, setUserCreds] = useState<Credentials | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const router = useRouter();
  const pathname = usePathname();

  const clearAllData = useDriveStore((state) => state.clearAllData);

  // ✅ FIXED: Restore session with logout protection
  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);

      try {
        // ✅ Prevent auto-login after logout
        const justLoggedOut = localStorage.getItem(LOGGED_OUT_KEY);
        if (justLoggedOut === 'true') {
          localStorage.removeItem(LOGGED_OUT_KEY);
          setIsLoading(false);
          return;
        }

        const storedCreds = localStorage.getItem(STORAGE_KEY);

        if (storedCreds) {
          const creds = JSON.parse(storedCreds);

          if (isValidCreds(creds)) {
            const api = new BYOS3ApiProvider(creds, 'BYO');

            const manager = UploadManager.getInstance({
              s3: api.getS3Client(),
              bucket: api.getBucketName(),
              prefix: creds.prefix || '',
              maxConcurrency: 2,
              partSizeMB: 5,
            });

            const signedUrlManager = SignedUrlUploadManager.getInstance({
              apiProvider: api,
              maxConcurrency: 2,
              expiresInSeconds: 3600,
            });

            setUploadManager(manager);
            setSignedUrlUploadManager(signedUrlManager);
            setUserCreds(creds);
            setApiS3(api);

            if (pathname === '/') {
              router.push('/dashboard');
            }
          } else {
            throw new Error('Invalid credentials in storage');
          }
        }
      } catch (error) {
        console.error('Failed to restore session : ', error);
        clearSession();
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Create session
  const createSession = async (creds: Credentials): Promise<void> => {
    try {
      setIsLoading(true);

      const api = new BYOS3ApiProvider(creds, 'BYO');

      const manager = UploadManager.getInstance({
        s3: api.getS3Client(),
        bucket: api.getBucketName(),
        prefix: creds.prefix || '',
        maxConcurrency: 2,
        partSizeMB: 5,
      });

      const signedUrlManager = SignedUrlUploadManager.getInstance({
        apiProvider: api,
        maxConcurrency: 2,
        expiresInSeconds: 3600,
      });

      setUserCreds(creds);
      setApiS3(api);
      setUploadManager(manager);
      setSignedUrlUploadManager(signedUrlManager);

      localStorage.setItem(STORAGE_KEY, JSON.stringify(creds));

      // ✅ Clear logout flag when logging back in
      localStorage.removeItem(LOGGED_OUT_KEY);

      if (pathname === '/' || pathname === '/login') {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Login failed', error);
      throw new Error('Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ FIXED: Proper logout
  const clearSession = () => {
    try {
      setIsLoading(true);

      // ✅ Prevent auto-login
      localStorage.setItem(LOGGED_OUT_KEY, 'true');

      // ✅ Clear ALL sessions
      localStorage.removeItem(STORAGE_KEY); // s3 session
      localStorage.removeItem('opndrive_login_session'); // cognito session
      sessionStorage.clear();

      // Clear Zustand / app state
      clearAllData();

      // Reset state
      setUserCreds(null);
      setApiS3(null);
      setUploadManager(null);
      setSignedUrlUploadManager(null);

      // ✅ Redirect to login (important)
      router.push('/login');
    } catch (error) {
      console.error('Error clearing session:', error);
    } finally {
      setTimeout(() => setIsLoading(false), 100);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        apiS3,
        uploadManager,
        signedUrlUploadManager,
        userCreds,
        isLoading,
        createSession,
        clearSession,
      }}
    >
      {isLoading ? (
        <div className="flex h-screen items-center justify-center">
          <p>Loading...</p>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};
