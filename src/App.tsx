import { BrowserRouter } from 'react-router-dom';
import { TooltipProvider } from './components/ui/tooltip';
import { AppProviders } from './app/AppProviders';
import { AppRouter } from './app/AppRouter';
import { AppShell } from './app/AppShell';
import { RequireAuth } from './features/auth/RequireAuth';

export default function App() {
  return (
    <BrowserRouter>
      <TooltipProvider delayDuration={0}>
        <AppProviders>
          <RequireAuth>
            <AppShell>
              <AppRouter />
            </AppShell>
          </RequireAuth>
        </AppProviders>
      </TooltipProvider>
    </BrowserRouter>
  );
}
