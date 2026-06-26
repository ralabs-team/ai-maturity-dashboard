import { useEffect, useState } from 'react';
import { Building2, X } from 'lucide-react';
import { useWorkspaceIdentity } from '../../data/workspace/WorkspaceIdentityContext';

export default function WorkspaceIdentityModal() {
  const {
    hasWorkspaceName,
    workspaceName,
    anonymizedDataConsent,
    isWorkspaceIdentityModalOpen,
    setWorkspaceName,
    setAnonymizedDataConsent,
    closeWorkspaceIdentityModal,
  } = useWorkspaceIdentity();
  const [draftName, setDraftName] = useState(workspaceName);
  const [draftAnonymizedDataConsent, setDraftAnonymizedDataConsent] = useState(
    anonymizedDataConsent,
  );
  const [isDeclineConsentModalOpen, setIsDeclineConsentModalOpen] = useState(false);

  useEffect(() => {
    setDraftName(workspaceName);
  }, [workspaceName]);

  useEffect(() => {
    setDraftAnonymizedDataConsent(anonymizedDataConsent);
  }, [anonymizedDataConsent]);

  const isEditMode = hasWorkspaceName && isWorkspaceIdentityModalOpen;
  const isOpen = !hasWorkspaceName || isWorkspaceIdentityModalOpen;

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';

      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const normalizedDraftName = draftName.trim().replace(/\s+/g, ' ');
  const isSubmitDisabled = normalizedDraftName.length < 3;

  const handleClose = () => {
    if (!isEditMode) {
      return;
    }

    setDraftName(workspaceName);
    setDraftAnonymizedDataConsent(anonymizedDataConsent);
    setIsDeclineConsentModalOpen(false);
    closeWorkspaceIdentityModal();
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-[rgba(15,23,42,0.48)] px-4 py-6 backdrop-blur-[1px]"
      onClick={isEditMode ? handleClose : undefined}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(248,250,252,0.98)_100%)] p-7 shadow-[0_28px_90px_rgba(15,23,42,0.22)] sm:p-8"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#0f766e_0%,#1d4ed8_100%)] text-white">
              <Building2 className="h-5 w-5" strokeWidth={1.8} />
            </div>
            <div>
              <p
                className={`text-xs font-semibold uppercase tracking-[0.18em] ${
                  isEditMode ? 'text-[#6b7280]' : 'text-[#0f766e]'
                }`}
              >
                {isEditMode ? 'Workspace Settings' : 'Welcome to AI Maturity Insights'}
              </p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight text-[#111827]">
                {isEditMode ? 'Edit your workspace' : 'Name your dashboard'}
              </h2>
            </div>
          </div>
          {isEditMode ? (
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close workspace settings"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center text-[#6b7280] transition hover:text-[#374151] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d1d5db] focus-visible:ring-offset-2"
            >
              <X className="h-4 w-4" strokeWidth={2} />
            </button>
          ) : null}
        </div>

        <p className="mt-5 text-sm leading-6 text-[#4b5563]">
          {isEditMode
            ? 'Update your team name and choose whether anonymized analytics can help improve future surveys.'
            : 'Enter your company or team name before continuing.'}
        </p>

        <form
          className="mt-6"
          onSubmit={(event) => {
            event.preventDefault();

            if (isSubmitDisabled) {
              return;
            }

            setWorkspaceName(normalizedDraftName);
            setAnonymizedDataConsent(draftAnonymizedDataConsent);
            closeWorkspaceIdentityModal();
          }}
        >
          <label htmlFor="workspace-name" className="text-sm font-medium text-[#1f2937]">
            Company or team name
          </label>
          <input
            id="workspace-name"
            type="text"
            value={draftName}
            onChange={(event) => setDraftName(event.target.value)}
            placeholder="e.g. Google, Engineering Team, ..."
            autoFocus
            minLength={3}
            className="mt-2 h-12 w-full rounded-xl border border-[#d1d5db] bg-white px-4 text-[15px] text-[#111827] shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] outline-none transition focus:border-[#9ca3af] focus:ring-4 focus:ring-[#e5e7eb]"
          />
          <p className="mt-2 text-xs text-[#6b7280]">
            This field is required, must be at least 3 characters, and is stored locally only in this browser.
          </p>

          <label className="mt-4 flex items-start gap-3 text-sm text-[#374151]">
            <input
              type="checkbox"
              checked={draftAnonymizedDataConsent}
              onChange={(event) => {
                if (!event.target.checked && draftAnonymizedDataConsent) {
                  setIsDeclineConsentModalOpen(true);
                  return;
                }

                setDraftAnonymizedDataConsent(event.target.checked);
              }}
              className="mt-0.5 h-4 w-4 rounded border border-[#9ca3af] accent-[#6b7280]"
            />
            <span>
              I allow anonymized analytics to be used to improve future surveys.
            </span>
          </label>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
            {isEditMode ? (
              <button
                type="button"
                onClick={handleClose}
                className="inline-flex h-12 items-center justify-center rounded-xl border border-[#d1d5db] bg-white px-4 text-sm font-medium text-[#374151] transition hover:bg-[#f9fafb]"
              >
                Cancel
              </button>
            ) : null}
            <button
              type="submit"
              disabled={isSubmitDisabled}
              className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-[linear-gradient(135deg,#0f766e_0%,#1d4ed8_100%)] px-4 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:min-w-44"
            >
              {isEditMode ? 'Save changes' : 'Continue to dashboard'}
            </button>
          </div>
        </form>
      </div>

      {isDeclineConsentModalOpen ? (
        <div
          className="fixed inset-0 z-[210] flex items-center justify-center bg-[rgba(15,23,42,0.22)] px-4 py-6"
          onClick={(event) => event.stopPropagation()}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.2)]"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="text-lg font-semibold tracking-tight text-[#111827]">
              Are you sure you want to turn this off?
            </h3>
            <p className="mt-3 text-sm leading-6 text-[#4b5563]">
              The quality of these insights and future surveys depends on learning
              from real response patterns and question performance over time.
            </p>
            <p className="mt-3 text-sm leading-6 text-[#4b5563]">
              Only <strong>anonymized data</strong> would be sent. Real people names,
              company-specific identifiers, and other directly identifying details
              would not be sent.
            </p>
            <p className="mt-3 text-sm leading-6 text-[#4b5563]">
              <strong>Please help us to improve the quality of surveys.</strong>
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                autoFocus
                onClick={() => setIsDeclineConsentModalOpen(false)}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#0f766e_0%,#1d4ed8_100%)] px-4 text-sm font-semibold text-white transition hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#93c5fd] focus-visible:ring-offset-2"
              >
                Keep enabled
              </button>
              <button
                type="button"
                onClick={() => {
                  setDraftAnonymizedDataConsent(false);
                  setIsDeclineConsentModalOpen(false);
                }}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-[#d1d5db] bg-white px-4 text-sm font-semibold text-[#374151] transition hover:bg-[#f9fafb]"
              >
                Disable anyway
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
