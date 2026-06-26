import { useEffect, useState } from 'react';
import {
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from '../recharts';
import ChartFeedback from '../../analytics/ChartFeedback';
import type { TeamValidatedScopeRow } from '../../../data/survey/teamValidatedView';
import { SensitiveTooltipLabel } from '../../ui/SensitiveChartText';

type Scope = 'department' | 'team';
type QuadrantBadge = {
  title: string;
  description: string;
  className: string;
};

const QUADRANT_BADGES: QuadrantBadge[] = [
  {
    title: 'Healthy spread',
    description: 'Strength is visible around people',
    className: 'left-3 bottom-3',
  },
  {
    title: 'Hidden strength',
    description: 'Strong people, weak spread',
    className: 'right-3 bottom-3 text-right',
  },
  {
    title: 'Fragile pockets',
    description: 'Some lone experts still show up',
    className: 'left-3 top-3',
  },
  {
    title: 'Highest risk',
    description: 'Strong individuals, low diffusion',
    className: 'right-3 top-3 text-right',
  },
];

function TooltipContent({
  active,
  payload,
  scope,
}: {
  active?: boolean;
  payload?: Array<{ payload?: TeamValidatedScopeRow }>;
  scope: Scope;
}) {
  const point = payload?.[0]?.payload;

  if (!active || !point) {
    return null;
  }

  return (
    <div className="rounded-md bg-[#242424] px-4 py-3 text-sm text-white shadow-lg">
      <SensitiveTooltipLabel
        prefix={scope === 'department' ? 'Department' : 'Team'}
        value={point.name}
        className="mb-2 font-semibold text-white"
      />
      <div className="space-y-1">
        <div>Avg positive gap: {point.avgPositiveAlignmentGap.toFixed(1)}</div>
        <div>Lone-expert share: {point.loneExpertShare.toFixed(1)}%</div>
        <div>Avg self score: {point.avgSelfScore.toFixed(1)} / 5</div>
        <div>Avg proxy score: {point.avgPeerProxyScore.toFixed(1)} / 5</div>
        <div>Influence evidence: {point.avgInfluenceEvidence.toFixed(1)} / 5</div>
        <div>Validated people: {point.validatedRespondents} of {point.respondents}</div>
        <div>Lone-expert flags: {point.loneExpertCount}</div>
      </div>
    </div>
  );
}

export default function MaturityVisibilityGapCard({
  departmentRows,
  teamRows,
  scope: forcedScope,
  hideScopeToggle = false,
}: {
  departmentRows: TeamValidatedScopeRow[];
  teamRows: TeamValidatedScopeRow[];
  scope?: Scope;
  hideScopeToggle?: boolean;
}) {
  const [internalScope, setInternalScope] = useState<Scope>(forcedScope ?? 'department');

  useEffect(() => {
    if (forcedScope) {
      setInternalScope(forcedScope);
    }
  }, [forcedScope]);

  const scope = forcedScope ?? internalScope;
  const rows = scope === 'department' ? departmentRows : teamRows;

  return (
    <section className="group relative rounded-2xl border border-[#eaeaea] bg-white p-6 shadow-sm">
      <ChartFeedback chartTitle="Where maturity is not spreading" page="organization" />
      <h3 className="text-lg font-semibold tracking-tight text-[#242424]">
        Where maturity is not spreading
      </h3>
      <p className="mt-1 text-sm text-[#7a7a7a]">
        See where strong personal maturity exists, but is not yet becoming shared behavior around
        people. The biggest risk is top-right: capable individuals are present, but advice,
        artifacts, and durable team habits are not spreading well.
      </p>

      {hideScopeToggle ? null : (
        <div className="mt-4 flex flex-wrap gap-2">
          {(['department', 'team'] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setInternalScope(option)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                scope === option
                  ? 'border-[#bfdbfe] bg-[#eff6ff] text-[#1d4ed8]'
                  : 'border-[#e5e7eb] bg-white text-[#525252] hover:bg-[#f8f8f8]'
              }`}
            >
              {option === 'department' ? 'Department' : 'Team'}
            </button>
          ))}
        </div>
      )}

      {rows.length > 0 ? (
        <div className="relative mt-6 h-[340px]">
          {QUADRANT_BADGES.map((badge) => (
            <div
              key={badge.title}
              className={`pointer-events-none absolute z-10 hidden rounded-xl border border-white/80 bg-white/90 px-2.5 py-2 shadow-sm backdrop-blur sm:block ${badge.className}`}
            >
              <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#334155]">
                {badge.title}
              </div>
              <div className="mt-1 max-w-[10rem] text-[11px] leading-4 text-[#64748b]">
                {badge.description}
              </div>
            </div>
          ))}
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 10, right: 12, left: 0, bottom: 18 }}>
              <CartesianGrid stroke="#ececec" strokeDasharray="3 3" />
              <XAxis
                type="number"
                dataKey="avgPositiveAlignmentGap"
                domain={[0, 2.5]}
                ticks={[0, 0.5, 1, 1.5, 2, 2.5]}
                tick={{ fontSize: 12, fill: '#737373' }}
                axisLine={false}
                tickLine={false}
                label={{
                  value: 'How much stronger people rate themselves than what shows up around them',
                  position: 'bottom',
                  offset: 6,
                  fill: '#525252',
                  fontSize: 12,
                  fontWeight: 600,
                }}
              />
              <YAxis
                type="number"
                dataKey="loneExpertShare"
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
                tickFormatter={(value) => `${value}%`}
                tick={{ fontSize: 12, fill: '#737373' }}
                axisLine={false}
                tickLine={false}
                label={{
                  value: 'Lone-expert share',
                  angle: -90,
                  position: 'insideLeft',
                  fill: '#525252',
                  fontSize: 12,
                  fontWeight: 600,
                }}
              />
              <ZAxis type="number" dataKey="respondents" range={[180, 1100]} />
              <Tooltip isAnimationActive={false} content={<TooltipContent scope={scope} />} />
              <ReferenceLine x={0.35} stroke="#d4d4d8" strokeDasharray="4 4" />
              <ReferenceLine y={20} stroke="#d4d4d8" strokeDasharray="4 4" />
              <Scatter data={rows}>
                {rows.map((row) => (
                  <Cell key={row.name} fill={row.color} stroke="#ffffff" strokeWidth={2} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="mt-6 flex h-[220px] items-center justify-center rounded-2xl border border-dashed border-[#d4d4d8] bg-[#fafafa] px-6 text-center text-sm text-[#7a7a7a]">
          No {scope === 'department' ? 'departments' : 'teams'} have enough validated data for this chart yet.
        </div>
      )}
    </section>
  );
}
