export default function AppFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-[var(--sidebar-border)] bg-[var(--background)]">
      <div className="mx-auto max-w-[2000px] px-4 py-4 md:px-6">
        <div className="flex flex-col items-center justify-between gap-3 text-sm text-[var(--sidebar-muted)] sm:flex-row">
          <div>© {currentYear} AI Maturity Index. All rights reserved.</div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              className="text-xs opacity-50 transition-opacity hover:opacity-100"
              aria-label={`Application version ${__APP_VERSION__}`}
            >
              v{__APP_VERSION__}
            </button>
            <span className="text-[color:color-mix(in_srgb,var(--sidebar-muted)_30%,transparent)]">
              •
            </span>
            <span>
              Developed by{' '}
              <a
                href="https://ralabs.org?utm_source=ai-maturity-index"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[var(--foreground)] transition-colors hover:text-[#1d4ed8]"
              >
                Ralabs
              </a>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
