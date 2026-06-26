import { Check, ThumbsDown, ThumbsUp, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { trackChartFeedbackEvent } from '../../lib/amplitude';

type ChartFeedbackReaction = 'like' | 'dislike';

type ChartFeedbackReason = {
  id: string;
  label: string;
};

type SubmittedFeedback = {
  reaction: ChartFeedbackReaction;
  reason: ChartFeedbackReason;
};

type ChartFeedbackProps = {
  chartId?: string;
  chartTitle: string;
  page: string;
  className?: string;
  eventProperties?: Record<string, unknown>;
  likeReasons?: ChartFeedbackReason[];
  dislikeReasons?: ChartFeedbackReason[];
};

const DEFAULT_LIKE_REASONS: ChartFeedbackReason[] = [
  { id: 'informative', label: 'This chart is informative' },
  { id: 'easy_to_read', label: 'Easy to read' },
  { id: 'trustworthy_data', label: 'The data looks correct' },
  { id: 'useful_for_decisions', label: 'Helpful for decision making' },
  { id: 'clear_visual', label: 'Clear visual design' },
  { id: 'other', label: 'Other' },
];

const DEFAULT_DISLIKE_REASONS: ChartFeedbackReason[] = [
  { id: 'not_informative', label: 'This chart is not informative' },
  { id: 'data_seems_incorrect', label: 'The data does not look correct' },
  { id: 'hard_to_read', label: 'Hard to read' },
  { id: 'too_much_detail', label: 'Too much detail' },
  { id: 'missing_context', label: 'Missing context' },
  { id: 'other', label: 'Other' },
];

function reactionLabel(reaction: ChartFeedbackReaction): string {
  return reaction === 'like' ? 'Liked' : 'Disliked';
}

function buildChartId(chartTitle: string): string {
  return chartTitle
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export default function ChartFeedback({
  chartId,
  chartTitle,
  page,
  className = '',
  eventProperties,
  likeReasons = DEFAULT_LIKE_REASONS,
  dislikeReasons = DEFAULT_DISLIKE_REASONS,
}: ChartFeedbackProps) {
  const resolvedChartId = chartId ?? buildChartId(chartTitle);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [activeReaction, setActiveReaction] = useState<ChartFeedbackReaction | null>(null);
  const [submittedFeedback, setSubmittedFeedback] = useState<SubmittedFeedback | null>(null);

  const isPanelVisible = activeReaction !== null || submittedFeedback !== null;
  const visibleReasons = useMemo(
    () => (activeReaction === 'like' ? likeReasons : dislikeReasons),
    [activeReaction, dislikeReasons, likeReasons],
  );

  useEffect(() => {
    if (!isPanelVisible) {
      return undefined;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (containerRef.current?.contains(event.target as Node)) {
        return;
      }

      setActiveReaction(null);
      setSubmittedFeedback(null);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') {
        return;
      }

      setActiveReaction(null);
      setSubmittedFeedback(null);
    };

    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isPanelVisible]);

  const handleReactionClick = (reaction: ChartFeedbackReaction) => {
    setSubmittedFeedback(null);
    setActiveReaction(reaction);
  };

  const handleReasonSelect = (reason: ChartFeedbackReason) => {
    if (!activeReaction) {
      return;
    }

    trackChartFeedbackEvent('chart_feedback_submitted', {
      page,
      chart_id: resolvedChartId,
      chart_title: chartTitle,
      reaction: activeReaction,
      reason_id: reason.id,
      reason_label: reason.label,
      ...eventProperties,
    });

    setSubmittedFeedback({
      reaction: activeReaction,
      reason,
    });
    setActiveReaction(null);
  };

  const selectedReaction = activeReaction ?? submittedFeedback?.reaction ?? null;
  const triggerVisibilityClass = isPanelVisible
    ? 'pointer-events-auto translate-y-0 opacity-100'
    : 'pointer-events-none translate-y-1 opacity-0 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:opacity-100';

  return (
    <div ref={containerRef} className={`absolute right-5 top-5 z-20 flex flex-col items-end gap-2 ${className}`}>
      <div
        className={`flex items-center gap-1.5 rounded-full border border-[#e5e7eb] bg-white/95 px-1.5 py-1 shadow-sm backdrop-blur transition-all ${triggerVisibilityClass}`}
      >
        <button
          type="button"
          onClick={() => handleReactionClick('like')}
          aria-label={`Like ${chartTitle}`}
          className={`inline-flex h-8 w-8 items-center justify-center rounded-full transition ${
            selectedReaction === 'like'
              ? 'bg-[#ecfdf3] text-[#15803d]'
              : 'text-[#667085] hover:bg-[#f4f4f5] hover:text-[#242424]'
          }`}
        >
          <ThumbsUp className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => handleReactionClick('dislike')}
          aria-label={`Dislike ${chartTitle}`}
          className={`inline-flex h-8 w-8 items-center justify-center rounded-full transition ${
            selectedReaction === 'dislike'
              ? 'bg-[#fff1f2] text-[#dc2626]'
              : 'text-[#667085] hover:bg-[#f4f4f5] hover:text-[#242424]'
          }`}
        >
          <ThumbsDown className="h-3.5 w-3.5" />
        </button>
      </div>

      {activeReaction ? (
        <div className="w-[280px] rounded-2xl border border-[#e5e7eb] bg-white p-3 shadow-[0_16px_40px_rgba(15,23,42,0.14)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs font-medium uppercase tracking-[0.12em] text-[#8b8b8b]">
                Chart feedback
              </div>
              <div className="mt-2 text-sm font-semibold text-[#242424]">
                Why did you {activeReaction === 'like' ? 'like' : 'dislike'} this chart?
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveReaction(null)}
              aria-label="Close chart feedback"
              className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[#8b8b8b] transition hover:bg-[#f4f4f5] hover:text-[#242424]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {visibleReasons.map((reason) => (
              <button
                key={`${activeReaction}-${reason.id}`}
                type="button"
                onClick={() => handleReasonSelect(reason)}
                className="rounded-full border border-[#e5e7eb] bg-[#fafafa] px-3 py-1.5 text-left text-xs font-medium text-[#374151] transition hover:border-[#d4d4d8] hover:bg-white"
              >
                {reason.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {submittedFeedback ? (
        <div className="w-[280px] rounded-2xl border border-[#d1fae5] bg-[#f0fdf4] p-3 shadow-[0_16px_40px_rgba(15,23,42,0.12)]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 text-sm font-semibold text-[#166534]">
                <Check className="h-4 w-4" />
                Feedback saved
              </div>
              <div className="mt-1 text-sm text-[#166534]">
                {reactionLabel(submittedFeedback.reaction)} because: {submittedFeedback.reason.label}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSubmittedFeedback(null)}
              aria-label="Dismiss chart feedback message"
              className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[#4d7c0f] transition hover:bg-white/70 hover:text-[#166534]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
