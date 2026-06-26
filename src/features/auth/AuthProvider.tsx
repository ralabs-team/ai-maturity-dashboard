import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { AuthSession } from '../../shared/survey-domain';
import { loadSession, signOutSession, unlockSession } from './sessionClient';

type AuthContextValue = {
  errorMessage: string | null;
  isLoading: boolean;
  session: AuthSession | null;
  refreshSession: () => Promise<void>;
  signOut: () => Promise<void>;
  unlock: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const refreshSession = async () => {
    setIsLoading(true);

    try {
      setSession(await loadSession());
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load session.');
      setSession({
        status: 'unauthenticated',
        user: null,
        workspace: null,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void refreshSession();
  }, []);

  const unlock = async () => {
    setIsLoading(true);

    try {
      setSession(await unlockSession());
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    await signOutSession();
    await refreshSession();
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      errorMessage,
      isLoading,
      session,
      refreshSession,
      signOut,
      unlock,
    }),
    [errorMessage, isLoading, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider.');
  }

  return context;
}
