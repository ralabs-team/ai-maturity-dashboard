import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, Send, Sparkles, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { AskAiResearchPack, AskAiScopeType } from '../../shared/api/askAi';
import PersonAvatar from '../ui/PersonAvatar';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

type AskAiSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
  scopeType: AskAiScopeType;
  scopeLabel: string;
  scopeDescription: string;
  avatarName?: string;
  threadKey: string;
  buildResearchPack: () => Promise<AskAiResearchPack>;
  starterQuestions: string[];
  disabled?: boolean;
  disabledReason?: string;
};

type AskAiTriggerButtonProps = {
  onClick: () => void;
  disabled?: boolean;
};

const SIDEBAR_ANIMATION_MS = 260;

const ASK_AI_BUTTON_CLASSNAME =
  'inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-[#e5e7eb] bg-white px-4 text-sm font-semibold text-[#242424] transition hover:border-[#d4d4d8] hover:bg-[#f8f8f9] focus:outline-none focus:ring-[3px] focus:ring-[#c7c7cc]/25 disabled:cursor-not-allowed disabled:opacity-60';

export function AskAiTriggerButton({
  onClick,
  disabled = false,
}: AskAiTriggerButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={ASK_AI_BUTTON_CLASSNAME}
    >
      <span className="relative inline-flex h-5 w-7 items-center">
        <span className="absolute left-0 inline-flex h-5 w-5 items-center justify-center rounded-full border border-[#e5e7eb] bg-white shadow-sm">
          <img src="/chatgpt-logo.svg" alt="" aria-hidden="true" className="h-3.5 w-3.5" />
        </span>
        <span className="absolute right-0 inline-flex h-5 w-5 items-center justify-center rounded-full border border-[#e5e7eb] bg-white shadow-sm">
          <img src="/claude-logo.png" alt="" aria-hidden="true" className="h-3.5 w-3.5 object-contain" />
        </span>
      </span>
      Ask AI
    </button>
  );
}

function MarkdownMessage({
  content,
  isUserMessage,
}: {
  content: string;
  isUserMessage: boolean;
}) {
  const textColorClassName = isUserMessage ? 'text-white' : 'text-[#1f2937]';
  const mutedColorClassName = isUserMessage ? 'text-white/90' : 'text-[#475569]';
  const linkColorClassName = isUserMessage ? 'text-white' : 'text-[#1d4ed8]';

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => (
          <p className={`my-0 ${textColorClassName}`}>{children}</p>
        ),
        strong: ({ children }) => (
          <strong className={`font-semibold ${textColorClassName}`}>{children}</strong>
        ),
        em: ({ children }) => (
          <em className={`italic ${mutedColorClassName}`}>{children}</em>
        ),
        ul: ({ children }) => (
          <ul className={`my-2 list-disc space-y-1 pl-5 ${textColorClassName}`}>{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className={`my-2 list-decimal space-y-1 pl-5 ${textColorClassName}`}>{children}</ol>
        ),
        li: ({ children }) => <li className={textColorClassName}>{children}</li>,
        code: ({ children }) => (
          <code
            className={`rounded-md px-1.5 py-0.5 font-mono text-[0.92em] ${
              isUserMessage ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-800'
            }`}
          >
            {children}
          </code>
        ),
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className={`underline underline-offset-4 ${linkColorClassName}`}
          >
            {children}
          </a>
        ),
        h1: ({ children }) => (
          <h1 className={`mb-2 text-base font-semibold ${textColorClassName}`}>{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className={`mb-2 text-[0.98rem] font-semibold ${textColorClassName}`}>{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className={`mb-1 text-sm font-semibold ${textColorClassName}`}>{children}</h3>
        ),
        hr: () => (
          <hr className={`my-3 border-0 border-t ${isUserMessage ? 'border-white/20' : 'border-slate-200'}`} />
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

export default function AskAiSidebar({
  isOpen,
  onClose,
  scopeType,
  scopeLabel,
  scopeDescription,
  avatarName,
  threadKey,
  buildResearchPack,
  starterQuestions,
  disabled = false,
  disabledReason,
}: AskAiSidebarProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPreparingContext, setIsPreparingContext] = useState(false);
  const [contextWasTruncated, setContextWasTruncated] = useState(false);
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(false);
  const researchPackRef = useRef<AskAiResearchPack | null>(null);
  const researchPackPromiseRef = useRef<Promise<AskAiResearchPack> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const getResearchPack = useCallback(async () => {
    if (researchPackRef.current) {
      return researchPackRef.current;
    }

    if (!researchPackPromiseRef.current) {
      researchPackPromiseRef.current = buildResearchPack()
        .then((researchPack) => {
          researchPackRef.current = researchPack;
          return researchPack;
        })
        .finally(() => {
          researchPackPromiseRef.current = null;
        });
    }

    return researchPackPromiseRef.current;
  }, [buildResearchPack]);

  useEffect(() => {
    setMessages([]);
    setDraft('');
    setErrorMessage(null);
    setIsSubmitting(false);
    setIsPreparingContext(false);
    setContextWasTruncated(false);
    researchPackRef.current = null;
    researchPackPromiseRef.current = null;
  }, [threadKey]);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);

      const frameId = window.requestAnimationFrame(() => {
        setIsVisible(true);
      });

      return () => {
        window.cancelAnimationFrame(frameId);
      };
    }

    setIsVisible(false);

    const timeoutId = window.setTimeout(() => {
      setShouldRender(false);
    }, SIDEBAR_ANIMATION_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      textareaRef.current?.focus();
    });
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.cancelAnimationFrame(frameId);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || disabled) {
      return;
    }

    if (researchPackRef.current || researchPackPromiseRef.current) {
      return;
    }

    setIsPreparingContext(true);

    void getResearchPack()
      .catch((error) => {
        console.error('[ask-ai] Failed to prepare research pack', error);
      })
      .finally(() => {
        setIsPreparingContext(false);
      });
  }, [disabled, isOpen, threadKey, getResearchPack]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [isOpen, isSubmitting, messages]);

  const sendMessage = async (messageText: string) => {
    const trimmedMessage = messageText.trim();

    if (!trimmedMessage || isSubmitting || disabled) {
      return;
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmedMessage,
    };
    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setDraft('');
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const researchPack = await getResearchPack();
      const response = await fetch('/api/ask-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scope: {
            type: scopeType,
            label: scopeLabel,
          },
          researchPack: {
            filename: researchPack.filename,
            markdown: researchPack.aiContext ? undefined : researchPack.markdown,
          },
          aiContext: researchPack.aiContext,
          messages: nextMessages.map(({ role, content }) => ({ role, content })),
        }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          typeof payload?.error === 'string'
            ? payload.error
            : 'Ask AI could not answer that question.',
        );
      }

      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content:
            typeof payload?.answer === 'string'
              ? payload.answer
              : 'I could not generate a reply for that question.',
        },
      ]);
      setContextWasTruncated(Boolean(payload?.researchPackTruncated));
    } catch (error) {
      console.error('[ask-ai] Failed to send message', error);
      setErrorMessage(
        error instanceof Error ? error.message : 'Ask AI failed to answer that question.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const placeholder =
    scopeType === 'individual'
      ? 'Ask about this respondent, their benchmarks, or recommended next steps...'
      : 'Ask about patterns, outliers, benchmarks, or where to focus next...';

  if (!shouldRender) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[70]">
      <button
        type="button"
        aria-label="Close Ask AI sidebar"
        onClick={onClose}
        className={`absolute inset-0 bg-[#0f172a]/28 backdrop-blur-[1px] transition-opacity duration-300 ease-out motion-reduce:transition-none ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
      />

      <aside
        className={`absolute inset-y-0 right-0 flex w-full max-w-[540px] flex-col border-l border-[#dbe3f2] bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_22%,#ffffff_100%)] shadow-[-20px_0_70px_rgba(15,23,42,0.18)] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:translate-x-0 motion-reduce:transition-none ${
          isVisible ? 'translate-x-0 opacity-100' : 'translate-x-6 opacity-0'
        }`}
      >
        <div className="border-b border-[#e5e7eb] px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#dbe4ff] bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#1d4ed8]">
                <Sparkles className="h-3.5 w-3.5" />
                Ask AI
              </div>
              <div className="mt-3 flex items-center gap-3">
                {avatarName ? (
                  <PersonAvatar
                    name={avatarName}
                    className="h-10 w-10"
                    textClassName="text-sm"
                  />
                ) : null}
                <h2 className="text-lg font-semibold tracking-tight text-[#0f172a]">
                  {scopeLabel}
                </h2>
              </div>
              <p className="mt-1 text-sm leading-6 text-[#64748b]">
                {scopeDescription}
              </p>
              <p className="mt-2 text-xs leading-5 text-[#94a3b8]">
                This chat uses the same anonymized research pack available from the download
                button.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[#e5e7eb] bg-white text-[#64748b] transition hover:border-[#d1d5db] hover:text-[#0f172a] focus:outline-none focus:ring-[3px] focus:ring-[#c7d2fe]/40"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {disabled ? (
            <div className="rounded-3xl border border-[#e5e7eb] bg-white p-5 text-sm text-[#64748b] shadow-sm">
              {disabledReason ?? 'Ask AI is unavailable for this selection right now.'}
            </div>
          ) : (
            <>
              {messages.length === 0 ? (
                <div className="rounded-3xl border border-[#dbe4ff] bg-[linear-gradient(180deg,#eef4ff_0%,#ffffff_100%)] p-5 shadow-sm">
                  <p className="text-sm leading-6 text-[#334155]">
                    Ask a follow-up question and I&apos;ll answer from this scope&apos;s research
                    pack.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {starterQuestions.map((question) => (
                      <button
                        key={question}
                        type="button"
                        onClick={() => void sendMessage(question)}
                        className="rounded-full border border-[#c7d2fe] bg-white px-3 py-2 text-left text-sm text-[#1e3a8a] transition hover:border-[#93c5fd] hover:bg-[#eff6ff] focus:outline-none focus:ring-[3px] focus:ring-[#bfdbfe]/45"
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="mt-4 flex flex-col gap-3">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`max-w-[92%] rounded-3xl px-4 py-3 text-sm leading-6 shadow-sm ${
                      message.role === 'user'
                        ? 'ml-auto bg-[#1d4ed8] text-white'
                        : 'border border-[#e5e7eb] bg-white text-[#1f2937]'
                    }`}
                  >
                    <MarkdownMessage
                      content={message.content}
                      isUserMessage={message.role === 'user'}
                    />
                  </div>
                ))}

                {isSubmitting ? (
                  <div className="max-w-[92%] rounded-3xl border border-[#e5e7eb] bg-white px-4 py-3 text-sm text-[#64748b] shadow-sm">
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Thinking through the research pack...
                    </span>
                  </div>
                ) : null}

                <div ref={messagesEndRef} />
              </div>
            </>
          )}
        </div>

        <div className="border-t border-[#e5e7eb] bg-white/90 px-5 py-4 backdrop-blur-sm">
          {contextWasTruncated ? (
            <div className="mb-3 rounded-2xl border border-[#fde68a] bg-[#fffbeb] px-3 py-2 text-xs leading-5 text-[#92400e]">
              The backend trimmed an oversized research pack before answering, so broad
              organization-wide questions may need a narrower scope.
            </div>
          ) : null}

          {errorMessage ? (
            <div className="mb-3 rounded-2xl border border-[#fecaca] bg-[#fff1f2] px-3 py-2 text-sm text-[#b91c1c]">
              {errorMessage}
            </div>
          ) : null}

          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              void sendMessage(draft);
            }}
          >
            <label className="block">
              <span className="sr-only">Ask AI a question</span>
              <textarea
                ref={textareaRef}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                    event.preventDefault();
                    void sendMessage(draft);
                  }
                }}
                placeholder={disabled ? disabledReason ?? '' : placeholder}
                disabled={disabled || isSubmitting}
                rows={4}
                className="w-full resize-none rounded-3xl border border-[#d7deea] bg-[#f8fafc] px-4 py-3 text-sm leading-6 text-[#0f172a] outline-none transition focus:border-[#93c5fd] focus:ring-[3px] focus:ring-[#bfdbfe]/40 disabled:cursor-not-allowed disabled:opacity-70"
              />
            </label>

            <div className="flex items-center justify-between gap-3">
              <div className="text-xs text-[#94a3b8]">
                {isPreparingContext
                  ? 'Preparing the research-pack context...'
                  : 'Answers stay grounded in the anonymized dashboard export.'}
              </div>

              <button
                type="submit"
                disabled={disabled || isSubmitting || !draft.trim()}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#0f172a] px-4 text-sm font-semibold text-white transition hover:bg-[#1e293b] focus:outline-none focus:ring-[3px] focus:ring-[#94a3b8]/40 disabled:cursor-not-allowed disabled:bg-[#94a3b8]"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Send
              </button>
            </div>
          </form>
        </div>
      </aside>
    </div>
  );
}
