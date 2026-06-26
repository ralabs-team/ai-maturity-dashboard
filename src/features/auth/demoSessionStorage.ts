import type { AuthSession } from '../../shared/survey-domain';

const AUTH_STORAGE_KEY = 'ai-maturity-dashboard.authenticated';
const FALLBACK_APP_PASSWORD = 'change-me-in-code';
const APP_PASSWORD = import.meta.env.VITE_APP_PASSWORD ?? FALLBACK_APP_PASSWORD;

function buildDemoSession(): AuthSession {
  return {
    status: 'authenticated',
    user: {
      id: 'demo-user',
      email: 'owner@local.ai-maturity',
      displayName: 'Workspace Owner',
    },
    workspace: {
      id: 'demo-workspace',
      name: 'AI Maturity Workspace',
      anonymizedDataConsent: true,
    },
  };
}

export async function readDemoSession(): Promise<AuthSession> {
  if (typeof window === 'undefined') {
    return {
      status: 'unauthenticated',
      user: null,
      workspace: null,
    };
  }

  return window.localStorage.getItem(AUTH_STORAGE_KEY) === 'true'
    ? buildDemoSession()
    : {
        status: 'unauthenticated',
        user: null,
        workspace: null,
      };
}

export async function unlockDemoSession(): Promise<AuthSession> {
  const enteredPassword = window.prompt('Enter the app password');

  if (enteredPassword === null) {
    throw new Error('Authentication was cancelled.');
  }

  if (enteredPassword !== APP_PASSWORD) {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    throw new Error('Incorrect password. Please try again.');
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, 'true');
  return buildDemoSession();
}

export async function clearDemoSession(): Promise<void> {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}
