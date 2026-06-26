import type { ReactNode } from 'react';
import { SidebarProvider } from '../components/ui/sidebar';
import { NavigationPendingProvider } from '../components/layout/NavigationPendingContext';
import { SensitiveDataProvider } from '../components/privacy/SensitiveDataContext';
import { AuthProvider } from '../features/auth/AuthProvider';
import { SurveyDataProvider } from '../data/survey/SurveyDataContext';
import { WorkspaceIdentityProvider } from '../data/workspace/WorkspaceIdentityContext';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <SurveyDataProvider>
        <WorkspaceIdentityProvider>
          <SensitiveDataProvider>
            <SidebarProvider>
              <NavigationPendingProvider>{children}</NavigationPendingProvider>
            </SidebarProvider>
          </SensitiveDataProvider>
        </WorkspaceIdentityProvider>
      </SurveyDataProvider>
    </AuthProvider>
  );
}
