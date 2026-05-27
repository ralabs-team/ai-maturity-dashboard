import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

const SENSITIVE_DATA_STORAGE_KEY = 'sensitive_data_hidden';

interface SensitiveDataContextValue {
  isSensitiveDataHidden: boolean;
  setSensitiveDataHidden: (value: boolean | ((value: boolean) => boolean)) => void;
  toggleSensitiveData: () => void;
}

const SensitiveDataContext = createContext<SensitiveDataContextValue | null>(null);

export function SensitiveDataProvider({ children }: { children: ReactNode }) {
  const [isSensitiveDataHidden, setIsSensitiveDataHiddenState] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    return window.localStorage.getItem(SENSITIVE_DATA_STORAGE_KEY) === 'true';
  });

  const setSensitiveDataHidden = useCallback(
    (value: boolean | ((value: boolean) => boolean)) => {
      setIsSensitiveDataHiddenState((current) => {
        const nextValue = typeof value === 'function' ? value(current) : value;
        window.localStorage.setItem(SENSITIVE_DATA_STORAGE_KEY, String(nextValue));
        return nextValue;
      });
    },
    [],
  );

  const toggleSensitiveData = useCallback(() => {
    setSensitiveDataHidden((current) => !current);
  }, [setSensitiveDataHidden]);

  const value = useMemo(
    () => ({
      isSensitiveDataHidden,
      setSensitiveDataHidden,
      toggleSensitiveData,
    }),
    [isSensitiveDataHidden, setSensitiveDataHidden, toggleSensitiveData],
  );

  return <SensitiveDataContext.Provider value={value}>{children}</SensitiveDataContext.Provider>;
}

export function useSensitiveData() {
  const context = useContext(SensitiveDataContext);

  if (!context) {
    throw new Error('useSensitiveData must be used within a SensitiveDataProvider.');
  }

  return context;
}
