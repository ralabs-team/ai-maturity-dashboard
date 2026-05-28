import type { ReactNode } from 'react';
import { useState } from 'react';

const AUTH_STORAGE_KEY = 'ai-maturity-dashboard.authenticated';
const FALLBACK_APP_PASSWORD = 'change-me-in-code';
const APP_PASSWORD = import.meta.env.VITE_APP_PASSWORD ?? FALLBACK_APP_PASSWORD;

function readStoredAuth() {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.localStorage.getItem(AUTH_STORAGE_KEY) === 'true';
}

type AppPasswordGateProps = {
  children: ReactNode;
};

export default function AppPasswordGate({ children }: AppPasswordGateProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(readStoredAuth);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function handleUnlock() {
    const enteredPassword = window.prompt('Enter the app password');

    if (enteredPassword === null) {
      return;
    }

    if (enteredPassword === APP_PASSWORD) {
      window.localStorage.setItem(AUTH_STORAGE_KEY, 'true');
      setIsAuthenticated(true);
      setErrorMessage(null);
      return;
    }

    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    setErrorMessage('Incorrect password. Please try again.');
  }

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-10 text-white">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur">
        <p className="text-sm uppercase tracking-[0.28em] text-white/55">Protected App</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">Password required</h1>
        <p className="mt-3 text-sm leading-6 text-white/72">
          This dashboard is hidden behind a lightweight client-side password gate. Enter the shared
          password to continue.
        </p>
        {errorMessage ? (
          <p className="mt-4 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {errorMessage}
          </p>
        ) : null}
        <button
          type="button"
          onClick={handleUnlock}
          className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-white px-4 py-3 text-sm font-medium text-slate-950 transition hover:bg-white/90"
        >
          Enter password
        </button>
        <p className="mt-4 text-xs leading-5 text-white/45">
          Access is remembered in this browser with local storage until it is cleared.
        </p>
      </div>
    </div>
  );
}
