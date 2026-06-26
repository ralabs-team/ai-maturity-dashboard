import type { SuggestedGoal } from '../../data/survey/goals';

function priorityTone(priorityScore: number): string {
  if (priorityScore >= 80) {
    return 'border-[#fecaca] bg-[#fff7f7]';
  }

  if (priorityScore >= 65) {
    return 'border-[#fde68a] bg-[#fffdf5]';
  }

  if (priorityScore >= 50) {
    return 'border-[#dbeafe] bg-[#f8fbff]';
  }

  return 'border-[#e5e7eb] bg-white';
}

function priorityBadgeTone(priorityScore: number): string {
  if (priorityScore >= 80) {
    return 'bg-[#fee2e2] text-[#b91c1c]';
  }

  if (priorityScore >= 65) {
    return 'bg-[#fef3c7] text-[#b45309]';
  }

  if (priorityScore >= 50) {
    return 'bg-[#dbeafe] text-[#1d4ed8]';
  }

  return 'bg-[#f3f4f6] text-[#4b5563]';
}

function priorityLabel(priorityScore: number): string {
  if (priorityScore >= 80) {
    return 'Highest priority';
  }

  if (priorityScore >= 65) {
    return 'High priority';
  }

  if (priorityScore >= 50) {
    return 'Medium priority';
  }

  return 'Low priority';
}

type SuggestedGoalCardProps = {
  goal: SuggestedGoal;
};

export default function SuggestedGoalCard({ goal }: SuggestedGoalCardProps) {
  return (
    <article
      className={`rounded-2xl border p-5 shadow-sm ${priorityTone(goal.priorityScore)}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#8b8b8b]">
            {goal.dimension}
          </div>
          <h3 className="mt-2 text-lg font-semibold tracking-tight text-[#1f2937]">
            {goal.title}
          </h3>
        </div>

        <div
          className={`inline-flex shrink-0 rounded-full px-3 py-1 text-sm font-semibold ${priorityBadgeTone(goal.priorityScore)}`}
          title={`Priority score: ${goal.priorityScore}`}
        >
          {priorityLabel(goal.priorityScore)}
        </div>
      </div>

      <p className="mt-3 text-sm leading-6 text-[#667085]">{goal.description}</p>
    </article>
  );
}
