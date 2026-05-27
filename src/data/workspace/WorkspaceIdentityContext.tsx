import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

const STORAGE_KEY = 'ai-maturity-dashboard.workspace-name.v1';
const ANONYMIZED_DATA_CONSENT_STORAGE_KEY = 'ai-maturity-dashboard.anonymized-data-consent.v1';

interface WorkspaceIdentityContextValue {
  workspaceName: string;
  hasWorkspaceName: boolean;
  anonymizedDataConsent: boolean;
  setWorkspaceName: (nextName: string) => void;
  setAnonymizedDataConsent: (nextValue: boolean) => void;
}

const WorkspaceIdentityContext = createContext<WorkspaceIdentityContextValue | null>(null);

function normalizeWorkspaceName(rawValue: string): string {
  return rawValue.trim().replace(/\s+/g, ' ');
}

function readStoredWorkspaceName(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? normalizeWorkspaceName(stored) : '';
  } catch (error) {
    console.warn('[workspace] Failed to restore stored workspace name', error);
    return '';
  }
}

function readStoredAnonymizedDataConsent(): boolean {
  if (typeof window === 'undefined') {
    return true;
  }

  try {
    const stored = window.localStorage.getItem(ANONYMIZED_DATA_CONSENT_STORAGE_KEY);

    if (stored === null) {
      return true;
    }

    return stored === 'true';
  } catch (error) {
    console.warn('[workspace] Failed to restore stored anonymized data consent', error);
    return true;
  }
}

export function WorkspaceIdentityProvider({ children }: { children: ReactNode }) {
  const [workspaceName, setWorkspaceNameState] = useState(() => readStoredWorkspaceName());
  const [anonymizedDataConsent, setAnonymizedDataConsentState] = useState(() =>
    readStoredAnonymizedDataConsent(),
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (!workspaceName) {
      window.localStorage.removeItem(STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, workspaceName);
  }, [workspaceName]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(
      ANONYMIZED_DATA_CONSENT_STORAGE_KEY,
      String(anonymizedDataConsent),
    );
  }, [anonymizedDataConsent]);

  const setWorkspaceName = (nextName: string) => {
    setWorkspaceNameState(normalizeWorkspaceName(nextName));
  };

  const setAnonymizedDataConsent = (nextValue: boolean) => {
    setAnonymizedDataConsentState(nextValue);
  };

  const value = useMemo(
    () => ({
      workspaceName,
      hasWorkspaceName: workspaceName.length > 0,
      anonymizedDataConsent,
      setWorkspaceName,
      setAnonymizedDataConsent,
    }),
    [workspaceName, anonymizedDataConsent],
  );

  return (
    <WorkspaceIdentityContext.Provider value={value}>
      {children}
    </WorkspaceIdentityContext.Provider>
  );
}

export function useWorkspaceIdentity() {
  const context = useContext(WorkspaceIdentityContext);

  if (!context) {
    throw new Error('useWorkspaceIdentity must be used within a WorkspaceIdentityProvider.');
  }

  return context;
}
