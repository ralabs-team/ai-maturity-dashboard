import { useMemo, useState } from 'react';
import PageHeader from '../components/layout/PageHeader';
import {
  INDIVIDUAL_GOAL_CATALOG,
  TEAM_GOAL_CATALOG,
  type IndividualGoalCatalogEntry,
  type TeamGoalCatalogEntry,
} from '../data/survey/goals';
import { LEVEL_LABELS, type MaturityLevel } from '../shared/survey-domain';

const LEVEL_OPTIONS: MaturityLevel[] = [1, 2, 3, 4, 5];

function BestFitLevelBadge({ levels }: { levels: MaturityLevel[] }) {
  if (levels.length === 0) {
    return <span className="text-xs text-[#8b8b8b]">Not set</span>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {[...levels]
        .sort((left, right) => left - right)
        .map((level) => (
          <span
            key={level}
            className="inline-flex rounded-full border border-[#dbe4f0] bg-[#f8fbff] px-3 py-1.5 text-sm font-medium text-[#31517a]"
            title={LEVEL_LABELS[level]}
          >
            {`L${level}`}
          </span>
        ))}
    </div>
  );
}

function IndividualGoalsTable({ goals }: { goals: IndividualGoalCatalogEntry[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-[#eaeaea] bg-white shadow-sm">
      <table className="min-w-full">
        <thead className="bg-[#fafafa] text-left text-xs uppercase tracking-[0.12em] text-[#8b8b8b]">
          <tr>
            <th className="px-4 py-3 font-medium">Dimension</th>
            <th className="px-4 py-3 font-medium">Goal</th>
            <th className="px-4 py-3 font-medium">Best fit levels</th>
          </tr>
        </thead>
        <tbody>
          {goals.map((goal) => (
            <tr key={goal.id} className="border-t border-[#eaeaea] align-top">
              <td className="px-4 py-4 text-sm font-medium text-[#242424]">{goal.dimension}</td>
              <td className="px-4 py-4">
                <div className="min-w-[22rem]">
                  <div className="font-medium text-[#1f2937]">{goal.title}</div>
                  <div className="mt-1 text-sm leading-6 text-[#667085]">{goal.description}</div>
                </div>
              </td>
              <td className="px-4 py-4">
                <div className="min-w-[10rem]">
                  <BestFitLevelBadge levels={goal.bestFitLevels} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TeamGoalsTable({
  goals,
}: {
  goals: TeamGoalCatalogEntry[];
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-[#eaeaea] bg-white shadow-sm">
      <table className="min-w-full">
        <thead className="bg-[#fafafa] text-left text-xs uppercase tracking-[0.12em] text-[#8b8b8b]">
          <tr>
            <th className="px-4 py-3 font-medium">Dimension</th>
            <th className="px-4 py-3 font-medium">Goal</th>
            <th className="px-4 py-3 font-medium">Best fit levels</th>
          </tr>
        </thead>
        <tbody>
          {goals.map((goal) => (
            <tr key={goal.id} className="border-t border-[#eaeaea] align-top">
              <td className="px-4 py-4 text-sm font-medium text-[#242424]">{goal.dimension}</td>
              <td className="px-4 py-4">
                <div className="min-w-[24rem]">
                  <div className="font-medium text-[#1f2937]">{goal.title}</div>
                  <div className="mt-1 text-sm leading-6 text-[#667085]">{goal.description}</div>
                </div>
              </td>
              <td className="px-4 py-4">
                <div className="min-w-[10rem]">
                  <BestFitLevelBadge levels={goal.bestFitLevels} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function GoalsView() {
  const [selectedLevels, setSelectedLevels] = useState<MaturityLevel[]>([]);

  const filteredIndividualGoals = useMemo(
    () =>
      selectedLevels.length === 0
        ? INDIVIDUAL_GOAL_CATALOG
        : INDIVIDUAL_GOAL_CATALOG.filter((goal) =>
            goal.bestFitLevels.some((level) => selectedLevels.includes(level)),
          ),
    [selectedLevels],
  );

  const filteredTeamGoals = useMemo(
    () =>
      selectedLevels.length === 0
        ? TEAM_GOAL_CATALOG
        : TEAM_GOAL_CATALOG.filter((goal) =>
            goal.bestFitLevels.some((level) => selectedLevels.includes(level)),
          ),
    [selectedLevels],
  );

  const totalGoalCount = filteredIndividualGoals.length + filteredTeamGoals.length;

  function toggleLevel(level: MaturityLevel) {
    setSelectedLevels((current) =>
      current.includes(level)
        ? current.filter((currentLevel) => currentLevel !== level)
        : [...current, level].sort((left, right) => left - right),
    );
  }

  const isAllLevelsSelected = selectedLevels.length === 0;

  return (
    <div>
      <PageHeader
        title="Goals Library"
        subtitle="Read-only view of the built-in goal catalog currently used to generate suggested goals for teams and individuals."
        badge={totalGoalCount}
      />

      <section className="mt-6 rounded-2xl border border-[#e5e7eb] bg-white p-4 shadow-sm">
        <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#8b8b8b]">
          Filter by level
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelectedLevels([])}
            className={`inline-flex rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              isAllLevelsSelected
                ? 'border-[#1d4ed8] bg-[#eff6ff] text-[#1d4ed8]'
                : 'border-[#e5e7eb] bg-white text-[#525252] hover:border-[#cbd5e1] hover:bg-[#f8fafc]'
            }`}
          >
            All levels
          </button>
          {LEVEL_OPTIONS.map((level) => {
            const isSelected = selectedLevels.includes(level);

            return (
              <button
                key={level}
                type="button"
                onClick={() => toggleLevel(level)}
                className={`inline-flex rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                  isSelected
                    ? 'border-[#1d4ed8] bg-[#eff6ff] text-[#1d4ed8]'
                    : 'border-[#e5e7eb] bg-white text-[#525252] hover:border-[#cbd5e1] hover:bg-[#f8fafc]'
                }`}
                title={LEVEL_LABELS[level]}
              >
                {`L${level} ${LEVEL_LABELS[level]}`}
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-sm leading-6 text-[#667085]">
          Show goals that best fit one or more maturity levels. Leave all levels selected to view
          the full catalog.
        </p>
      </section>

      <section className="mt-6">
        <div className="mb-4">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#8b8b8b]">
              Individuals
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h2 className="text-xl font-semibold tracking-tight text-[#1f2937]">
                Individual goal catalog
              </h2>
              <div className="rounded-full border border-[#e5e7eb] bg-white px-3 py-1.5 text-sm font-medium text-[#525252]">
                {filteredIndividualGoals.length} goals
              </div>
            </div>
            <p className="mt-2 text-sm leading-6 text-[#667085]">
              Goals that can be suggested inside the respondent modal, ranked from weak dimensions,
              low question scores, benchmark gaps, and shown here with the maturity levels they fit best.
            </p>
          </div>
        </div>

        <IndividualGoalsTable goals={filteredIndividualGoals} />
      </section>

      <section className="mt-8">
        <div className="mb-4">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#8b8b8b]">
              Teams
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h2 className="text-xl font-semibold tracking-tight text-[#1f2937]">
                Team goal catalog
              </h2>
              <div className="rounded-full border border-[#e5e7eb] bg-white px-3 py-1.5 text-sm font-medium text-[#525252]">
                {filteredTeamGoals.length} goals
              </div>
            </div>
            <p className="mt-2 text-sm leading-6 text-[#667085]">
              Goals that can be suggested for a selected team or department, ranked from current
              scope maturity plus team friction signals, with best-fit maturity levels shown for context.
            </p>
          </div>
        </div>

        <TeamGoalsTable goals={filteredTeamGoals} />
      </section>
    </div>
  );
}
