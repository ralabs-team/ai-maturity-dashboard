import { useEffect, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import AppFooter from '../components/layout/AppFooter';
import MobileHeader from '../components/layout/MobileHeader';
import WorkspaceIdentityModal from '../components/layout/WorkspaceIdentityModal';
import { SidebarInset } from '../components/ui/sidebar';
import {
  useNavigationPending,
} from '../components/layout/NavigationPendingContext';

function NavigationPendingCursor() {
  const location = useLocation();
  const { pendingPath, clearPendingNavigation } = useNavigationPending();

  useEffect(() => {
    document.body.dataset.navigationPending = pendingPath ? 'true' : 'false';
  }, [pendingPath]);

  useEffect(() => {
    const isPendingRoute =
      pendingPath !== null &&
      (location.pathname === pendingPath || location.pathname.startsWith(`${pendingPath}/`));

    if (!isPendingRoute) {
      return;
    }

    let secondFrame: number | null = null;
    const firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => {
        clearPendingNavigation(pendingPath);
      });
    });

    return () => {
      window.cancelAnimationFrame(firstFrame);
      if (secondFrame !== null) {
        window.cancelAnimationFrame(secondFrame);
      }
    };
  }, [clearPendingNavigation, location.pathname, pendingPath]);

  useEffect(
    () => () => {
      delete document.body.dataset.navigationPending;
    },
    [],
  );

  return null;
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <>
      <NavigationPendingCursor />
      <Sidebar />
      <SidebarInset>
        <MobileHeader />
        <div data-app-scroll-container className="flex-1 overflow-auto">
          <div className="mx-auto max-w-[2000px] px-4 py-4 md:px-6 md:py-5">{children}</div>
        </div>
        <AppFooter />
      </SidebarInset>
      <WorkspaceIdentityModal />
    </>
  );
}
