import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

interface NavigationPendingContextValue {
  pendingPath: string | null;
  startPendingNavigation: (path: string) => void;
  clearPendingNavigation: (path?: string) => void;
}

const NavigationPendingContext = createContext<NavigationPendingContextValue | null>(null);

export function NavigationPendingProvider({ children }: { children: ReactNode }) {
  const [pendingPath, setPendingPath] = useState<string | null>(null);

  const value = useMemo<NavigationPendingContextValue>(
    () => ({
      pendingPath,
      startPendingNavigation: (path: string) => {
        setPendingPath(path);
      },
      clearPendingNavigation: (path?: string) => {
        setPendingPath((currentPath) => {
          if (path && currentPath !== path) {
            return currentPath;
          }

          return null;
        });
      },
    }),
    [pendingPath],
  );

  return (
    <NavigationPendingContext.Provider value={value}>
      {children}
    </NavigationPendingContext.Provider>
  );
}

export function useNavigationPending() {
  const context = useContext(NavigationPendingContext);

  if (!context) {
    throw new Error('useNavigationPending must be used within NavigationPendingProvider.');
  }

  return context;
}
