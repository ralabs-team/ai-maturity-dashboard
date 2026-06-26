import SuggestedGoalCard from '../goals/SuggestedGoalCard';
import type { SuggestedGoal } from '../../data/survey/goals';
import TeamSectionHeader from './TeamSectionHeader';

type TeamSuggestedGoalsSectionProps = {
  scopeLabelLower: string;
  goals: SuggestedGoal[];
};

export default function TeamSuggestedGoalsSection({
  scopeLabelLower,
  goals,
}: TeamSuggestedGoalsSectionProps) {
  return (
    <section id="team-suggested-goals" className="mt-8 scroll-mt-24">
      <TeamSectionHeader
        title="Where should we invest?"
        subtitle={`Suggested goals for the selected ${scopeLabelLower}, ranked from current maturity scores, benchmark gaps, and team-level friction signals.`}
      />

      <div className="grid gap-4 xl:grid-cols-3">
        {goals.map((goal) => (
          <SuggestedGoalCard key={goal.id} goal={goal} />
        ))}
      </div>
    </section>
  );
}
