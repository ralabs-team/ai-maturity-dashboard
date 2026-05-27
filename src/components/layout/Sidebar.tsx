import { useEffect, useMemo, useRef, type MouseEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Users,
  UsersRound,
  ClipboardList,
  ListChecks,
  Building,
  Award,
  PanelLeftClose,
  PanelLeft,
  Sparkles,
  Building2,
  Database,
  Loader2,
  Eye,
  EyeOff,
} from 'lucide-react';
import {
  Sidebar as SidebarShell,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from '../ui/sidebar';
import { useSensitiveData } from '../privacy/SensitiveDataContext';
import { useSurveyData } from '../../data/survey/SurveyDataContext';
import { allProjectsList } from '../../data/survey/scoring';
import { useWorkspaceIdentity } from '../../data/workspace/WorkspaceIdentityContext';
import { useNavigationPending } from './NavigationPendingContext';

interface NavItem {
  to: string;
  label: string;
  tooltipLabel?: string;
  icon: typeof Users;
}

interface NavSection {
  label: string;
  links: NavItem[];
}

const navSections: NavSection[] = [
  {
    label: 'Navigation',
    links: [{ to: '/surveys', label: 'Surveys', icon: ClipboardList }],
  },
  {
    label: 'Insights',
    links: [
      {
        to: '/organization',
        label: 'Organization',
        tooltipLabel: 'Organization Insights',
        icon: Building2,
      },
      {
        to: '/teams',
        label: 'Teams',
        tooltipLabel: 'Team Insights',
        icon: UsersRound,
      },
      {
        to: '/people',
        label: 'People',
        tooltipLabel: 'Individual Insights',
        icon: Users,
      },
    ],
  },
  {
    label: 'Data Overview',
    links: [
      { to: '/data', label: 'Responses', icon: ListChecks },
      { to: '/projects', label: 'Projects', icon: Database },
      { to: '/departments', label: 'Departments', icon: Building },
      { to: '/seniority', label: 'Seniority', icon: Award },
      { to: '/overview/people', label: 'People', icon: Users },
    ],
  },
];

const DATA_GATED_PATHS = new Set([
  '/organization',
  '/teams',
  '/people',
  '/projects',
  '/departments',
  '/seniority',
  '/overview/people',
]);

const INSIGHT_PENDING_PATHS = new Set(['/organization', '/teams', '/people']);

export default function Sidebar() {
  const { state, toggleSidebar, setOpenMobile } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const isCollapsed = state === 'collapsed';
  const { rawResponses, hasResponseData } = useSurveyData();
  const { isSensitiveDataHidden, toggleSensitiveData } = useSensitiveData();
  const { workspaceName } = useWorkspaceIdentity();
  const { pendingPath, startPendingNavigation, clearPendingNavigation } = useNavigationPending();
  const homePath = hasResponseData ? '/people' : '/surveys';
  const pendingNavigationFramesRef = useRef<number[]>([]);

  const overviewBadges = useMemo(() => {
    const usernames = new Set<string>();
    const departments = new Set<string>();
    const seniorities = new Set<string>();
    const projects = new Set<string>();

    for (const response of rawResponses) {
      const username = response.username.trim().toLowerCase();
      const department = response.department.trim() || 'Unassigned';
      const seniority = response.seniority.trim() || 'Unassigned';

      if (username) {
        usernames.add(username);
      }

      departments.add(department);
      seniorities.add(seniority);

      for (const project of allProjectsList(response.projects)) {
        if (project !== 'Unassigned') {
          projects.add(project);
        }
      }
    }

    return {
      '/data': rawResponses.length,
      '/projects': projects.size,
      '/departments': departments.size,
      '/seniority': seniorities.size,
      '/overview/people': usernames.size,
    } as const;
  }, [rawResponses]);

  useEffect(() => {
    setOpenMobile(false);
  }, [location.pathname, setOpenMobile]);

  useEffect(
    () => () => {
      for (const frameId of pendingNavigationFramesRef.current) {
        window.cancelAnimationFrame(frameId);
      }
    },
    [],
  );

  const cancelPendingNavigation = () => {
    for (const frameId of pendingNavigationFramesRef.current) {
      window.cancelAnimationFrame(frameId);
    }

    pendingNavigationFramesRef.current = [];
    clearPendingNavigation();
  };

  const handleNavigationClick = (to: string) => (event: MouseEvent<HTMLAnchorElement>) => {
    if (!INSIGHT_PENDING_PATHS.has(to)) {
      cancelPendingNavigation();
      return;
    }

    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.altKey ||
      event.ctrlKey ||
      event.shiftKey
    ) {
      return;
    }

    if (location.pathname.startsWith(to)) {
      clearPendingNavigation(to);
      return;
    }

    event.preventDefault();
    cancelPendingNavigation();
    startPendingNavigation(to);

    const firstFrame = window.requestAnimationFrame(() => {
      pendingNavigationFramesRef.current = pendingNavigationFramesRef.current.filter(
        (frameId) => frameId !== firstFrame,
      );

      const secondFrame = window.requestAnimationFrame(() => {
        pendingNavigationFramesRef.current = pendingNavigationFramesRef.current.filter(
          (frameId) => frameId !== secondFrame,
        );
        navigate(to);
      });

      pendingNavigationFramesRef.current.push(secondFrame);
    });

    pendingNavigationFramesRef.current.push(firstFrame);
  };

  return (
    <SidebarShell collapsible="icon">
      <SidebarHeader className="px-6 py-5 group-data-[collapsible=icon]:px-2">
        <Link
          to={homePath}
          className="flex items-center gap-3 transition-opacity hover:opacity-90 group-data-[collapsible=icon]:justify-center"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[linear-gradient(135deg,#0f766e_0%,#1d4ed8_100%)] text-white">
            <Sparkles className="h-4 w-4" fill="currentColor" strokeWidth={1.5} />
          </div>
          <div className="flex flex-col whitespace-nowrap group-data-[collapsible=icon]:hidden">
            <div className="text-lg font-semibold tracking-tight text-[var(--sidebar-foreground)]">
              AI Maturity Index
            </div>
            <div className="min-h-5 max-w-[180px] truncate text-[15px] font-medium text-[var(--sidebar-muted)]">
              {workspaceName}
            </div>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent className="py-3">
        {navSections.map((section) => (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.links.map(({ to, label, tooltipLabel, icon: Icon }) => {
                  const isDisabled = !hasResponseData && DATA_GATED_PATHS.has(to);
                  const isActive = !isDisabled && location.pathname.startsWith(to);
                  const badge = overviewBadges[to as keyof typeof overviewBadges];
                  const isPending = pendingPath === to;

                  return (
                    <SidebarMenuItem key={to}>
                      {isDisabled ? (
                        <SidebarMenuButton
                          disabled
                          tooltip={`${tooltipLabel ?? label} (upload responses first)`}
                          className="cursor-not-allowed opacity-45 hover:bg-transparent hover:text-[var(--sidebar-foreground)] hover:[&>svg]:scale-100"
                        >
                          <Icon className="h-4 w-4" />
                          <span className="min-w-0 flex-1 truncate group-data-[collapsible=icon]:hidden">
                            {label}
                          </span>
                        </SidebarMenuButton>
                      ) : (
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          tooltip={tooltipLabel ?? label}
                        >
                          <Link to={to} onClick={handleNavigationClick(to)}>
                            <Icon className="h-4 w-4" />
                            <div className="flex min-w-0 flex-1 items-center gap-1.5 group-data-[collapsible=icon]:hidden">
                              <span className="min-w-0 truncate">{label}</span>
                              {isPending ? (
                                <Loader2
                                  className="h-3.5 w-3.5 shrink-0 animate-spin text-[var(--sidebar-muted)]"
                                  aria-hidden="true"
                                />
                              ) : null}
                            </div>
                            {badge !== undefined ? (
                              <div className="ml-auto hidden h-5 min-w-5 shrink-0 select-none items-center justify-center rounded-md px-1 text-xs font-medium tabular-nums text-[var(--sidebar-foreground)] group-data-[collapsible=icon]:hidden md:flex">
                                {badge}
                              </div>
                            ) : null}
                          </Link>
                        </SidebarMenuButton>
                      )}
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter className="px-4 py-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={toggleSensitiveData}
              tooltip={isSensitiveDataHidden ? 'Show sensitive data' : 'Hide sensitive data'}
              aria-pressed={isSensitiveDataHidden}
            >
              {isSensitiveDataHidden ? (
                <>
                  <Eye className="h-4 w-4 shrink-0" />
                  <span className="group-data-[collapsible=icon]:hidden">Show Sensitive</span>
                </>
              ) : (
                <>
                  <EyeOff className="h-4 w-4 shrink-0" />
                  <span className="group-data-[collapsible=icon]:hidden">Hide Sensitive</span>
                </>
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={toggleSidebar}
              tooltip={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? (
                <PanelLeft className="h-4 w-4 shrink-0" />
              ) : (
                <>
                  <PanelLeftClose className="h-4 w-4 shrink-0" />
                  <span>Collapse</span>
                  <kbd className="ml-auto rounded border border-[var(--sidebar-border)] bg-[var(--sidebar-accent)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--sidebar-muted)] group-data-[collapsible=icon]:hidden">
                    &#8984;.
                  </kbd>
                </>
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </SidebarShell>
  );
}
