import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { SidebarTrigger } from '../ui/sidebar';
import { useWorkspaceIdentity } from '../../data/workspace/WorkspaceIdentityContext';
import { useSurveyData } from '../../data/survey/SurveyDataContext';

export default function MobileHeader() {
  const { workspaceName } = useWorkspaceIdentity();
  const { hasResponseData } = useSurveyData();

  return (
    <header className="sticky top-0 z-20 flex min-h-14 items-center gap-3 border-b border-[var(--sidebar-border)] bg-[var(--background)] px-4 py-2 backdrop-blur md:hidden">
      <SidebarTrigger className="-ml-1" />
      <Link to={hasResponseData ? '/people' : '/surveys'} className="flex min-w-0 items-center gap-3">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[linear-gradient(135deg,#0f766e_0%,#1d4ed8_100%)] text-white">
          <Sparkles className="h-3.5 w-3.5" fill="currentColor" strokeWidth={1.5} />
        </div>
        <div className="flex min-w-0 items-baseline gap-2">
          <div className="truncate text-base font-semibold tracking-tight text-[var(--sidebar-foreground)]">
            AI Maturity Index
          </div>
          <div className="shrink-0 text-[var(--sidebar-muted)]">&middot;</div>
          <div className="truncate text-sm font-medium text-[var(--sidebar-muted)]">
            {workspaceName}
          </div>
        </div>
      </Link>
    </header>
  );
}
