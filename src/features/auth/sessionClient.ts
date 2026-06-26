import { apiClient } from '../../shared/api/client';
import type { AuthSession } from '../../shared/survey-domain';
import { clearDemoSession, readDemoSession, unlockDemoSession } from './demoSessionStorage';

const USE_SERVER_AUTH = import.meta.env.VITE_USE_SERVER_AUTH === 'true';

export async function loadSession(): Promise<AuthSession> {
  if (USE_SERVER_AUTH) {
    return apiClient.getSession();
  }

  return readDemoSession();
}

export async function unlockSession(): Promise<AuthSession> {
  if (USE_SERVER_AUTH) {
    throw new Error('Server auth is enabled. Use the backend login flow instead of the demo gate.');
  }

  return unlockDemoSession();
}

export async function signOutSession(): Promise<void> {
  if (USE_SERVER_AUTH) {
    return;
  }

  await clearDemoSession();
}
