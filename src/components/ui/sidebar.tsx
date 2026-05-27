import * as React from 'react';
import { PanelLeft } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip';
import { cn } from '../../lib/utils';

const SIDEBAR_STORAGE_KEY = 'sidebar_state';
const SIDEBAR_WIDTH = '18rem';
const SIDEBAR_WIDTH_ICON = '4rem';
const SIDEBAR_WIDTH_MOBILE = '18rem';
const SIDEBAR_KEYBOARD_SHORTCUT = '.';
const MOBILE_BREAKPOINT = 768;
const DESKTOP_TRANSITION_MS = 220;

type SidebarState = 'expanded' | 'collapsed';

type SidebarContextValue = {
  state: SidebarState;
  open: boolean;
  setOpen: (value: boolean | ((value: boolean) => boolean)) => void;
  openMobile: boolean;
  setOpenMobile: React.Dispatch<React.SetStateAction<boolean>>;
  isMobile: boolean;
  isDesktopTransitioning: boolean;
  toggleSidebar: () => void;
};

const SidebarContext = React.createContext<SidebarContextValue | null>(null);

function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const update = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);

    mediaQuery.addEventListener('change', update);
    update();

    return () => mediaQuery.removeEventListener('change', update);
  }, []);

  return !!isMobile;
}

function cloneWithProps(
  child: React.ReactNode,
  props: Record<string, unknown>,
) {
  if (!React.isValidElement(child)) {
    return child;
  }

  const element = child as React.ReactElement<Record<string, unknown>>;
  const childProps = (element.props ?? {}) as Record<string, unknown>;

  return React.cloneElement(element, {
    ...props,
    ...childProps,
    className: cn(props.className as string | undefined, childProps.className as string | undefined),
  });
}

export function useSidebar() {
  const context = React.useContext(SidebarContext);

  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider.');
  }

  return context;
}

export function SidebarProvider({
  children,
  defaultOpen = true,
}: {
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const isMobile = useIsMobile();
  const [openMobile, setOpenMobile] = React.useState(false);
  const [isDesktopTransitioning, setIsDesktopTransitioning] = React.useState(false);
  const desktopTransitionTimeoutRef = React.useRef<number | null>(null);
  const [openState, setOpenState] = React.useState(() => {
    if (typeof window === 'undefined') return defaultOpen;

    const stored = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
    if (stored !== null) {
      return stored === 'true';
    }

    return defaultOpen;
  });

  const setOpen = React.useCallback((value: boolean | ((value: boolean) => boolean)) => {
    setOpenState((current) => {
      const next = typeof value === 'function' ? value(current) : value;
      window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  React.useEffect(() => {
    if (isMobile && openMobile) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isMobile, openMobile]);

  React.useEffect(() => {
    if (!isMobile) {
      return;
    }

    setIsDesktopTransitioning(false);

    if (desktopTransitionTimeoutRef.current !== null) {
      window.clearTimeout(desktopTransitionTimeoutRef.current);
      desktopTransitionTimeoutRef.current = null;
    }
  }, [isMobile]);

  React.useEffect(() => {
    return () => {
      if (desktopTransitionTimeoutRef.current !== null) {
        window.clearTimeout(desktopTransitionTimeoutRef.current);
      }
    };
  }, []);

  const toggleSidebar = React.useCallback(() => {
    if (isMobile) {
      setOpenMobile((current) => !current);
      return;
    }

    setIsDesktopTransitioning(true);
    if (desktopTransitionTimeoutRef.current !== null) {
      window.clearTimeout(desktopTransitionTimeoutRef.current);
    }
    desktopTransitionTimeoutRef.current = window.setTimeout(() => {
      setIsDesktopTransitioning(false);
      desktopTransitionTimeoutRef.current = null;
    }, DESKTOP_TRANSITION_MS);

    setOpen((current) => !current);
  }, [isMobile, setOpen]);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === SIDEBAR_KEYBOARD_SHORTCUT && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        toggleSidebar();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSidebar]);

  const state: SidebarState = openState ? 'expanded' : 'collapsed';

  const value = React.useMemo(
    () => ({
      state,
      open: openState,
      setOpen,
      openMobile,
      setOpenMobile,
      isMobile,
      isDesktopTransitioning,
      toggleSidebar,
    }),
    [state, openState, setOpen, openMobile, isMobile, isDesktopTransitioning, toggleSidebar],
  );

  return (
    <SidebarContext.Provider value={value}>
      <div
        data-state={state}
        className="group/sidebar-wrapper flex min-h-svh w-full"
        style={
          {
            '--sidebar-width': SIDEBAR_WIDTH,
            '--sidebar-width-icon': SIDEBAR_WIDTH_ICON,
          } as React.CSSProperties
        }
      >
        {children}
      </div>
    </SidebarContext.Provider>
  );
}

export function Sidebar({
  children,
  className,
  collapsible = 'icon',
}: {
  children: React.ReactNode;
  className?: string;
  collapsible?: 'icon' | 'none';
}) {
  const { isMobile, openMobile, setOpenMobile, state } = useSidebar();

  if (collapsible === 'none') {
    return (
      <aside className={cn('flex h-full w-[var(--sidebar-width)] flex-col bg-[var(--sidebar)] text-[var(--sidebar-foreground)]', className)}>
        {children}
      </aside>
    );
  }

  if (isMobile) {
    return (
      <>
        <div
          className={cn(
            'fixed inset-0 z-30 bg-black/50 transition-opacity duration-300 ease-in-out',
            openMobile ? 'opacity-100' : 'pointer-events-none opacity-0',
          )}
          onClick={() => setOpenMobile(false)}
        />
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-40 flex h-svh w-[var(--sidebar-width)] flex-col bg-[var(--sidebar)] text-[var(--sidebar-foreground)] transition-transform duration-300 ease-in-out',
            openMobile ? 'translate-x-0' : '-translate-x-full',
            className,
          )}
          style={
            {
              '--sidebar-width': SIDEBAR_WIDTH_MOBILE,
            } as React.CSSProperties
          }
        >
          <div className="flex h-full w-full flex-col overflow-hidden border-r border-[var(--sidebar-border)]">
            {children}
          </div>
        </aside>
      </>
    );
  }

  return (
    <div
      className="group peer hidden text-[var(--sidebar-foreground)] md:block"
      data-state={state}
      data-collapsible={state === 'collapsed' ? collapsible : ''}
    >
      <div className="relative w-[var(--sidebar-width)] shrink-0 transition-[width] duration-200 ease-linear group-data-[collapsible=icon]:w-[var(--sidebar-width-icon)]" />
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 hidden h-svh w-[var(--sidebar-width)] transition-[width] duration-200 ease-linear md:flex group-data-[collapsible=icon]:w-[var(--sidebar-width-icon)]',
          className,
        )}
      >
        <div className="flex h-full w-full flex-col overflow-hidden border-r border-[var(--sidebar-border)] bg-[var(--sidebar)]">
          {children}
        </div>
      </aside>
    </div>
  );
}

export function SidebarInset({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { isMobile, openMobile } = useSidebar();

  return (
    <main
      className={cn(
        'relative flex min-w-0 flex-1 flex-col overflow-x-clip bg-[var(--background)]',
        isMobile && 'transition-transform duration-300 ease-in-out',
        className,
      )}
      style={
        isMobile && openMobile
          ? { transform: `translateX(${SIDEBAR_WIDTH_MOBILE})` }
          : undefined
      }
    >
      {children}
    </main>
  );
}

export function SidebarTrigger({
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { toggleSidebar } = useSidebar();

  return (
    <button
      type="button"
      {...props}
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-md text-[var(--sidebar-foreground)] transition-colors hover:bg-[var(--sidebar-accent)] hover:text-[var(--sidebar-accent-foreground)]',
        className,
      )}
      onClick={(event) => {
        props.onClick?.(event);
        if (!event.defaultPrevented) {
          toggleSidebar();
        }
      }}
    >
      <PanelLeft className="h-4 w-4" />
      <span className="sr-only">Toggle sidebar</span>
    </button>
  );
}

export function SidebarHeader({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn('flex flex-col gap-2 p-2', className)}>{children}</div>;
}

export function SidebarFooter({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn('flex flex-col gap-2 p-2', className)}>{children}</div>;
}

export function SidebarSeparator({ className }: { className?: string }) {
  return <div className={cn('mx-2 h-px bg-[var(--sidebar-border)]', className)} />;
}

export function SidebarContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex min-h-0 flex-1 flex-col gap-2 overflow-auto group-data-[collapsible=icon]:overflow-hidden',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function SidebarGroup({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn('relative flex w-full min-w-0 flex-col px-4 py-2', className)}>{children}</div>;
}

export function SidebarGroupLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium text-[var(--sidebar-muted)] transition-[margin,opacity] duration-200 ease-linear group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function SidebarGroupContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn('w-full text-sm', className)}>{children}</div>;
}

export function SidebarMenu({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <ul className={cn('flex w-full min-w-0 flex-col gap-1', className)}>{children}</ul>;
}

export function SidebarMenuItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <li className={cn('group/menu-item relative', className)}>{children}</li>;
}

type SidebarMenuButtonProps = {
  children: React.ReactNode;
  className?: string;
  asChild?: boolean;
  isActive?: boolean;
  tooltip?: string;
  size?: 'default' | 'lg';
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'className'>;

export function SidebarMenuButton({
  children,
  className,
  asChild = false,
  isActive = false,
  tooltip,
  size = 'default',
  type = 'button',
  ...props
}: SidebarMenuButtonProps) {
  const { isMobile, state } = useSidebar();

  const classes = cn(
    'flex w-full items-center gap-2 overflow-hidden rounded-md px-2 text-left outline-none transition-[width,height,padding,transform] [&>svg]:shrink-0 [&>svg]:transition-transform [&>svg]:duration-150 [&>svg]:ease-[cubic-bezier(.4,0,.2,1)] hover:bg-[var(--sidebar-accent)] hover:text-[var(--sidebar-accent-foreground)] hover:[&>svg]:scale-110 focus-visible:ring-2 focus-visible:ring-[var(--sidebar-ring)] group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-2 [&>span:last-child]:truncate',
    size === 'default' && 'h-8 text-sm',
    size === 'lg' && 'h-12 text-sm group-data-[collapsible=icon]:p-0',
    isActive && 'bg-[var(--sidebar-accent)] font-medium text-[var(--sidebar-foreground)] ring-2 ring-[var(--sidebar-ring)]',
    !isActive && 'text-[var(--sidebar-foreground)]',
    className,
  );

  const content = asChild
    ? cloneWithProps(children, { ...props, className: classes })
    : (
        <button type={type} className={classes} {...props}>
          {children}
        </button>
      );

  if (!tooltip || state !== 'collapsed' || isMobile) {
    return content;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{content}</TooltipTrigger>
      <TooltipContent side="right" align="center">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
}

export function SidebarMenuSub({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <ul
      className={cn(
        'ml-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-l border-[var(--sidebar-border)] pl-2.5 pt-2 pb-0.5 group-data-[collapsible=icon]:hidden',
        className,
      )}
    >
      {children}
    </ul>
  );
}

export function SidebarMenuSubItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <li className={cn('group/menu-sub-item relative', className)}>{children}</li>;
}

type SidebarMenuSubButtonProps = {
  children: React.ReactNode;
  className?: string;
  asChild?: boolean;
  isActive?: boolean;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'className'>;

export function SidebarMenuSubButton({
  children,
  className,
  asChild = false,
  isActive = false,
  type = 'button',
  ...props
}: SidebarMenuSubButtonProps) {
  const classes = cn(
    'flex h-7 min-w-0 items-center gap-2 overflow-hidden rounded-md px-2 text-sm text-[var(--sidebar-foreground)] outline-none transition-colors hover:bg-[var(--sidebar-accent)] hover:text-[var(--sidebar-accent-foreground)] focus-visible:ring-2 focus-visible:ring-[var(--sidebar-ring)] group-data-[collapsible=icon]:hidden [&>span:last-child]:truncate',
    isActive && 'bg-[var(--sidebar-accent)] font-medium ring-2 ring-[var(--sidebar-ring)]',
    className,
  );

  return asChild
    ? cloneWithProps(children, { ...props, className: classes })
    : (
        <button type={type} className={classes} {...props}>
          {children}
        </button>
      );
}
