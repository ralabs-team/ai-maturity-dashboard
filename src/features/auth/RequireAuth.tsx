import type { ReactNode } from 'react';
import { useAuth } from './AuthProvider';

export function RequireAuth({ children }: { children: ReactNode }) {
  const { errorMessage, isLoading, session, unlock } = useAuth();

  if (isLoading && session === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-10 text-white">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur">
          <p className="text-sm uppercase tracking-[0.28em] text-white/55">Protected App</p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">Loading session</h1>
          <p className="mt-3 text-sm leading-6 text-white/72">
            Checking the current auth session before the dashboard loads.
          </p>
        </div>
      </div>
    );
  }

  if (session?.status === 'authenticated') {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-10 text-white">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur">
        <p className="text-sm uppercase tracking-[0.28em] text-white/55">Protected App</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">Authentication required</h1>
        <p className="mt-3 text-sm leading-6 text-white/72">
          This dashboard now loads behind a route-based auth provider. Until the shared backend
          exists, the provider uses the demo password adapter.
        </p>
        {errorMessage ? (
          <p className="mt-4 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {errorMessage}
          </p>
        ) : null}
        <button
          type="button"
          onClick={() => {
            void unlock();
          }}
          className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-white px-4 py-3 text-sm font-medium text-slate-950 transition hover:bg-white/90"
        >
          Enter password
        </button>
      </div>
    </div>
  );
}
