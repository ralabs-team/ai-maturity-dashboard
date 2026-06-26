import { useMemo } from 'react';
import {
  Cell,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  Tooltip as RechartsTooltip,
} from '../charts/recharts';
import ProjectArchetypeBubbleChart, {
  type ArchetypeBubbleRow,
} from '../charts/organization/ProjectArchetypeBubbleChart';
import ChartFeedback from '../analytics/ChartFeedback';
import { Tooltip as InfoTooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import TeamSectionHeader from './TeamSectionHeader';
import {
  LEVEL_SCORE_RANGES,
  type LevelDistributionItem,
  type TeamMapDimension,
  type TeamMapSeriesKey,
} from './teamViewShared';
import {
  INDIVIDUAL_ARCHETYPE_CATALOG,
  resolveIndividualArchetype,
  type IndividualArchetypeProfile,
} from '../../data/survey/individualArchetypes';
import type { TeamArchetypeProfile } from '../../data/survey/teamArchetypes';
import type { Individual } from '../../data/types';

const INDIVIDUAL_ARCHETYPE_BUBBLE_COLORS: Record<string, string> = {
  earlyExplorer: '#94a3b8',
  visioneer: '#2563eb',
  individualExpert: '#d97706',
  toolOperator: '#0891b2',
  skepticalPerformer: '#7c3aed',
  outcomeHunter: '#dc2626',
  habitBuilder: '#059669',
  aiNative: '#4338ca',
};

type RadarDatum = {
  dimension: TeamMapDimension;
  selected: number;
  orgAverage: number;
};

type MissingArchetypeRecommendation = {
  archetype: IndividualArchetypeProfile;
  emphasis: string;
  reason: string;
  priority: number;
};

type TeamMaturityMapSectionProps = {
  scopeLabel: string;
  scopeLabelLower: string;
  radarData: RadarDatum[];
  scopedIndividuals: Individual[];
  levelDistribution: LevelDistributionItem[];
  hiddenTeamMapSeries: TeamMapSeriesKey[];
  onToggleSeries: (seriesKey: TeamMapSeriesKey) => void;
  teamMapSeriesMeta: Record<TeamMapSeriesKey, { color: string; fill: string; label: string }>;
  scopeArchetype: TeamArchetypeProfile | null;
};

function LevelDistributionTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload?: LevelDistributionItem }>;
}) {
  const slice = payload?.[0]?.payload;

  if (!active || !slice) {
    return null;
  }

  return (
    <div className="rounded-md bg-[#242424] px-3 py-2 text-xs text-white shadow-lg">
      <p className="font-semibold">{slice.level}</p>
      <p className="mt-1">Share: {slice.share}%</p>
      <p>Replies: {slice.count ?? 0}</p>
    </div>
  );
}

export default function TeamMaturityMapSection({
  scopeLabel,
  scopeLabelLower,
  radarData,
  scopedIndividuals,
  levelDistribution,
  hiddenTeamMapSeries,
  onToggleSeries,
  teamMapSeriesMeta,
  scopeArchetype,
}: TeamMaturityMapSectionProps) {
  const individualArchetypeBubbleRows = useMemo<ArchetypeBubbleRow[]>(() => {
    const rowsByArchetype = new Map<
      string,
      {
        archetype: IndividualArchetypeProfile;
        people: Individual[];
      }
    >();

    for (const person of scopedIndividuals) {
      const archetype = resolveIndividualArchetype(person.scores);
      const existing = rowsByArchetype.get(archetype.id);

      if (existing) {
        existing.people.push(person);
        continue;
      }

      rowsByArchetype.set(archetype.id, {
        archetype,
        people: [person],
      });
    }

    const average = (values: number[]) =>
      values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;

    return Array.from(rowsByArchetype.values())
      .map(({ archetype, people }) => ({
        id: archetype.id,
        label: archetype.label,
        signal: archetype.signal,
        scopeCount: people.length,
        respondentCount: people.length,
        usageImpactAverage: average(
          people.map((person) => average([person.scores.Usage, person.scores.Impact])),
        ),
        cultureVisionAverage: average(
          people.map((person) => average([person.scores.Culture, person.scores.Vision])),
        ),
      }))
      .sort(
        (left, right) =>
          right.scopeCount - left.scopeCount ||
          right.usageImpactAverage - left.usageImpactAverage,
      );
  }, [scopedIndividuals]);

  const archetypeCoverage = useMemo(() => {
    const counts = new Map<string, { archetype: IndividualArchetypeProfile; count: number }>();

    for (const person of scopedIndividuals) {
      const archetype = resolveIndividualArchetype(person.scores);
      const existing = counts.get(archetype.id);

      if (existing) {
        existing.count += 1;
      } else {
        counts.set(archetype.id, { archetype, count: 1 });
      }
    }

    const countFor = (ids: string[]) =>
      ids.reduce((sum, id) => sum + (counts.get(id)?.count ?? 0), 0);
    const shareFor = (ids: string[]) =>
      scopedIndividuals.length > 0 ? countFor(ids) / scopedIndividuals.length : 0;
    const lookup = new Map(
      INDIVIDUAL_ARCHETYPE_CATALOG.map((entry) => [entry.id, entry] as const),
    );
    const seen = new Set<IndividualArchetypeProfile['id']>();
    const recommendations: MissingArchetypeRecommendation[] = [];
    const addRecommendation = (
      id: IndividualArchetypeProfile['id'],
      emphasis: string,
      reason: string,
      priority: number,
    ) => {
      if (seen.has(id)) {
        return;
      }

      const profile = lookup.get(id);

      if (!profile) {
        return;
      }

      seen.add(id);
      recommendations.push({
        archetype: profile,
        emphasis,
        reason,
        priority,
      });
    };

    const directionCoverage = countFor(['visioneer', 'habitBuilder', 'aiNative']);
    const executionCoverage = countFor([
      'individualExpert',
      'toolOperator',
      'skepticalPerformer',
      'outcomeHunter',
      'habitBuilder',
      'aiNative',
    ]);
    const embeddingCoverage = countFor(['habitBuilder', 'aiNative']);
    const craftCoverage = countFor(['individualExpert', 'aiNative']);
    const skepticalShare = shareFor(['skepticalPerformer']);
    const earlyExplorerShare = shareFor(['earlyExplorer']);

    if (directionCoverage === 0) {
      addRecommendation(
        'visioneer',
        'Vision gap',
        'No one currently looks like the clear direction-setter for where AI should go next.',
        100,
      );
    }

    if (embeddingCoverage === 0) {
      addRecommendation(
        'habitBuilder',
        'Adoption gap',
        'The mix lacks someone who turns scattered wins into shared habits, rituals, and team practice.',
        95,
      );
    }

    if (executionCoverage === 0) {
      addRecommendation(
        'outcomeHunter',
        'Outcomes gap',
        'The current team mix does not show a strong execution archetype that reliably turns AI into visible outcomes.',
        90,
      );
    }

    if (craftCoverage === 0) {
      addRecommendation(
        'individualExpert',
        'Expertise gap',
        'Deep individual craft looks thin, which can make the team over-rely on enthusiasm instead of technique.',
        85,
      );
    }

    if (skepticalShare >= 0.3 && embeddingCoverage <= 1) {
      addRecommendation(
        'habitBuilder',
        'Adoption gap',
        'A large share of the team is getting value without much shared culture, so a Habit Builder would help practice spread.',
        80,
      );
    }

    if (earlyExplorerShare >= 0.4 && executionCoverage < Math.max(1, Math.ceil(scopedIndividuals.length / 4))) {
      addRecommendation(
        'toolOperator',
        'Outcomes gap',
        'Many people are still early, so a pragmatic execution archetype would help make AI usage more concrete and repeatable.',
        75,
      );
    }

    if (scopedIndividuals.length >= 5 && countFor(['aiNative']) === 0 && embeddingCoverage > 0 && executionCoverage > 0) {
      addRecommendation(
        'aiNative',
        'Expertise gap',
        'The team has useful coverage, but no clearly mature anchor yet to model what excellent AI practice looks like end to end.',
        70,
      );
    }

    return {
      directionCoverage,
      executionCoverage,
      embeddingCoverage,
      craftCoverage,
      recommendations: recommendations.sort((left, right) => right.priority - left.priority).slice(0, 3),
    };
  }, [scopedIndividuals]);

  const maturityMapTitle = `${scopeLabel} maturity map`;
  const visibleTeamMapSeries = (Object.keys(teamMapSeriesMeta) as TeamMapSeriesKey[]).filter(
    (key) => !hiddenTeamMapSeries.includes(key),
  );
  const archetypeLabel = `${scopeLabel} archetype`;

  return (
    <section id="team-maturity-map" className="mt-8 scroll-mt-24">
      <TeamSectionHeader
        title="Where are we now?"
        subtitle={`A dimension-level view of the selected ${scopeLabelLower} against the organization average, alongside the current level distribution.`}
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.8fr)_minmax(320px,0.8fr)]">
        <section className="group relative rounded-2xl border border-[#eaeaea] bg-white p-6 shadow-sm">
          <ChartFeedback
            chartTitle={maturityMapTitle}
            page="team"
            eventProperties={{
              chart_section: 'team_maturity_map',
              selected_scope_name_length: scopeLabel.length,
            }}
          />
          <div className="pr-24">
            <h3 className="text-lg font-semibold tracking-tight text-[#242424]">
              {maturityMapTitle}
            </h3>
            <p className="mt-1 text-sm text-[#7a7a7a]">
              Compare the selected {scopeLabelLower} against the organization average across each
              maturity dimension.
            </p>
          </div>
          {scopeArchetype ? (
            <div className="mt-4 rounded-2xl border border-[#1d4ed8]/20 bg-[linear-gradient(135deg,#0f766e_0%,#1d4ed8_100%)] p-4 text-white shadow-sm">
              <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/75">
                {archetypeLabel}
              </div>
              <div className="mt-2 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                <div className="inline-flex w-fit items-center rounded-full border border-white/25 bg-white/15 px-3 py-1 text-sm font-semibold text-white shadow-sm backdrop-blur-sm">
                  {scopeArchetype.label}
                </div>
                <p className="max-w-2xl text-sm text-white/85">{scopeArchetype.signal}</p>
              </div>
            </div>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            {(Object.keys(teamMapSeriesMeta) as TeamMapSeriesKey[]).map((seriesKey) => {
              const series = teamMapSeriesMeta[seriesKey];
              const isHidden = hiddenTeamMapSeries.includes(seriesKey);

              return (
                <InfoTooltip key={seriesKey}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => onToggleSeries(seriesKey)}
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                        isHidden
                          ? 'border-[#e5e7eb] bg-white text-[#9ca3af]'
                          : 'border-[#e5e7eb] bg-[#fafafa] text-[#374151] hover:bg-[#f5f5f5]'
                      }`}
                      aria-pressed={!isHidden}
                    >
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: series.color, opacity: isHidden ? 0.35 : 1 }}
                      />
                      <span className={isHidden ? 'line-through' : ''}>{series.label}</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" sideOffset={8} className="px-3 py-2 text-[11px] leading-relaxed">
                    <div className="font-medium text-white">{series.label}</div>
                    <div className="mt-1 text-white/80">
                      Click to {isHidden ? 'show' : 'hide'} this comparison series.
                    </div>
                  </TooltipContent>
                </InfoTooltip>
              );
            })}
          </div>

          <div className="mt-6 h-[420px]">
            {visibleTeamMapSeries.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} outerRadius="72%">
                  <PolarGrid stroke="rgb(229,229,229)" />
                  <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 12, fill: '#737373' }} />
                  <PolarRadiusAxis
                    domain={[1, 5]}
                    ticks={[1, 2, 3, 4, 5]}
                    tick={{ fontSize: 9, fill: '#b0b0b0' }}
                    axisLine={false}
                  />
                  <RechartsTooltip
                    isAnimationActive={false}
                    cursor={{ stroke: '#14b8a6', strokeWidth: 1, strokeDasharray: '3 3' }}
                    contentStyle={{
                      backgroundColor: '#242424',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '6px 12px',
                      color: '#ffffff',
                      fontSize: '12px',
                    }}
                    labelStyle={{ color: '#ffffff', fontWeight: 600 }}
                    itemStyle={{ color: '#ffffff' }}
                    formatter={(value, name) => {
                      const num = Number(value);
                      const label =
                        typeof name === 'string' && name in teamMapSeriesMeta
                          ? teamMapSeriesMeta[name as TeamMapSeriesKey].label
                          : String(name);
                      return [`${num.toFixed(1)} / 5`, label];
                    }}
                  />
                  {!hiddenTeamMapSeries.includes('orgAverage') ? (
                    <Radar
                      name="orgAverage"
                      dataKey="orgAverage"
                      stroke={teamMapSeriesMeta.orgAverage.color}
                      fill={teamMapSeriesMeta.orgAverage.fill}
                      fillOpacity={0.04}
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      isAnimationActive={false}
                    />
                  ) : null}
                  {!hiddenTeamMapSeries.includes('selected') ? (
                    <Radar
                      name="selected"
                      dataKey="selected"
                      stroke={teamMapSeriesMeta.selected.color}
                      fill={teamMapSeriesMeta.selected.fill}
                      fillOpacity={0.12}
                      strokeWidth={2}
                      isAnimationActive={false}
                      dot={
                        ((props: { cx?: number; cy?: number }) => {
                          const { cx = 0, cy = 0 } = props;
                          const size = 10;
                          return (
                            <rect
                              x={cx - size / 2}
                              y={cy - size / 2}
                              width={size}
                              height={size}
                              fill={teamMapSeriesMeta.selected.color}
                            />
                          );
                        }) as unknown as never
                      }
                      label={
                        ((props: {
                          x?: number;
                          y?: number;
                          value?: number;
                          viewBox?: { cx?: number; cy?: number };
                        }) => {
                          const { x = 0, y = 0, value = 0, viewBox } = props;
                          const cx = viewBox?.cx ?? 0;
                          const cy = viewBox?.cy ?? 0;
                          const dx = x - cx;
                          const dy = y - cy;
                          const length = Math.sqrt(dx * dx + dy * dy) || 1;
                          const offset = 16;
                          const lx = x + (dx / length) * offset;
                          const ly = y + (dy / length) * offset;
                          let textAnchor: 'start' | 'middle' | 'end' = 'middle';
                          if (dx > 8) textAnchor = 'start';
                          else if (dx < -8) textAnchor = 'end';

                          let baseline: 'auto' | 'middle' | 'hanging' = 'middle';
                          if (dy > 10) baseline = 'hanging';
                          else if (dy < -10) baseline = 'auto';

                          return (
                            <text
                              x={lx}
                              y={ly}
                              fill={teamMapSeriesMeta.selected.color}
                              fontSize={13}
                              fontWeight={600}
                              textAnchor={textAnchor}
                              dominantBaseline={baseline}
                            >
                              {Number(value).toFixed(1)}
                            </text>
                          );
                        }) as unknown as never
                      }
                    />
                  ) : null}
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-[#d4d4d8] bg-[#fafafa] px-6 text-center text-sm text-[#7a7a7a]">
                All comparison series are hidden. Click a chip above to show them again.
              </div>
            )}
          </div>
        </section>

        <section className="group relative rounded-2xl border border-[#eaeaea] bg-white p-6 shadow-sm">
          <ChartFeedback
            chartTitle={`Level distribution inside selected ${scopeLabelLower}`}
            page="team"
            eventProperties={{
              chart_section: 'team_maturity_map',
              selected_scope_name_length: scopeLabel.length,
              respondent_count: levelDistribution.reduce((sum, item) => sum + (item.count ?? 0), 0),
            }}
          />
          <h3 className="text-lg font-semibold tracking-tight text-[#242424]">
            Level distribution inside selected {scopeLabelLower}
          </h3>
          <p className="mt-1 text-sm text-[#7a7a7a]">
            Real distribution based on current selected {scopeLabelLower} respondents across Levels 1–5.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2 px-4 pb-4">
            {levelDistribution.map((entry) => (
              <InfoTooltip key={entry.level}>
                <TooltipTrigger asChild>
                  <span className="inline-flex items-center gap-2 rounded-full border border-[#e5e7eb] bg-[#fafafa] px-3 py-1.5 text-xs font-medium text-[#374151]">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: entry.fill }}
                    />
                    <span>{entry.level}</span>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={8} className="max-w-[220px] px-3 py-2 text-[11px] leading-relaxed">
                  <div className="font-medium text-white">{entry.level}</div>
                  <div className="mt-1 text-white/80">
                    Respondents: {entry.count ?? 0} ({entry.share}% of current {scopeLabelLower})
                  </div>
                  <div className="mt-1 text-white/80">
                    Score: {LEVEL_SCORE_RANGES[entry.level]}
                  </div>
                </TooltipContent>
              </InfoTooltip>
            ))}
          </div>
          <div className="mt-6 h-[420px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={levelDistribution}
                  dataKey="share"
                  nameKey="level"
                  isAnimationActive={false}
                  cx="50%"
                  cy="56%"
                  innerRadius={68}
                  outerRadius={132}
                  paddingAngle={2}
                  stroke="white"
                  strokeWidth={2}
                  label={({ percent }) => `${Math.round((percent ?? 0) * 100)}%`}
                  labelLine={false}
                >
                  {levelDistribution.map((item) => (
                    <Cell key={item.level} fill={item.fill} />
                  ))}
                </Pie>
                <Tooltip isAnimationActive={false} content={<LevelDistributionTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>

        <ProjectArchetypeBubbleChart
          rows={individualArchetypeBubbleRows}
          scopeLabel="Individual"
          scopeLabelPlural="Individuals"
          title="Individual archetype bubble chart"
          colors={INDIVIDUAL_ARCHETYPE_BUBBLE_COLORS}
          cardClassName="bg-white shadow-sm"
        />
      </div>

      <section
        id="team-missing-archetypes"
        className="mt-5 scroll-mt-24 rounded-2xl border border-[#eaeaea] bg-white p-6 shadow-sm"
      >
        <ChartFeedback
          chartTitle={`Missing archetypes in selected ${scopeLabelLower}`}
          page="team"
          eventProperties={{
            chart_section: 'team_maturity_map',
            selected_scope_name_length: scopeLabel.length,
            respondent_count: scopedIndividuals.length,
          }}
        />
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-[#242424]">
              What archetypes are missing from this {scopeLabelLower}?
            </h3>
            <p className="mt-1 text-sm text-[#7a7a7a]">
              Read the current individual mix as team-building guidance: which archetypes are missing,
              thin, or would make the team more resilient.
            </p>

            {archetypeCoverage.recommendations.length > 0 ? (
              <div className="mt-5 grid gap-3 md:grid-cols-3">
                {archetypeCoverage.recommendations.map(({ archetype, emphasis, reason }) => (
                  <div key={archetype.id} className="rounded-2xl border border-[#e5e7eb] bg-[#fafafa] p-4">
                    <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#7a7a7a]">
                      {emphasis}
                    </div>
                    <div className="mt-2 inline-flex items-center rounded-full border border-[#dbe6ff] bg-white px-3 py-1 text-sm font-semibold text-[#1d4ed8]">
                      {archetype.label}
                    </div>
                    <p className="mt-3 text-sm leading-6 text-[#4b5563]">{reason}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-[#dcfce7] bg-[#f0fdf4] p-4">
                <div className="text-sm font-semibold text-[#166534]">No critical archetype gaps visible</div>
                <p className="mt-1 text-sm leading-6 text-[#166534]/80">
                  This {scopeLabelLower} already shows coverage across direction, execution, embedding,
                  and deeper craft. The next step is usually spreading those strengths more evenly,
                  not filling a missing role.
                </p>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-[#e5e7eb] bg-[#fafafa] p-4">
            <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#7a7a7a]">
              Coverage checks
            </div>
            <div className="mt-4 space-y-3">
              {[
                {
                  label: 'Vision',
                  count: archetypeCoverage.directionCoverage,
                  description: 'People who help the team see where AI should go next.',
                },
                {
                  label: 'Outcomes',
                  count: archetypeCoverage.executionCoverage,
                  description: 'People who can turn AI into visible output and outcomes.',
                },
                {
                  label: 'Adoption',
                  count: archetypeCoverage.embeddingCoverage,
                  description: 'People who spread practice into shared habits and routines.',
                },
                {
                  label: 'Expertise',
                  count: archetypeCoverage.craftCoverage,
                  description: 'People with stronger individual technique and working skill.',
                },
              ].map((check) => {
                const covered = check.count > 0;

                return (
                  <div key={check.label} className="rounded-xl border border-[#e5e7eb] bg-white p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-[#242424]">{check.label}</div>
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          covered
                            ? 'bg-[#ecfdf3] text-[#047857]'
                            : 'bg-[#fef2f2] text-[#b91c1c]'
                        }`}
                      >
                        {covered ? 'Covered' : 'Missing'}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[#6b7280]">{check.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </section>
  );
}
