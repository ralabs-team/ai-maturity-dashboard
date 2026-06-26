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
import type { RawResponse } from '../../../data/survey/scoring';
import { allDepartmentsList, allProjectsList } from '../../../data/survey/scoring';
import { buildResistanceSummary } from './ResistanceReasonsCard';
import { SensitiveTooltipLabel } from '../../ui/SensitiveChartText';

type Scope = 'department' | 'team';
type Row = {
  name: string;
  respondents: number;
  support: number;
  resistance: number;
  highResistanceShare: number;
  color: string;
};

type ChartRow = Row & {
  plotRespondents: number;
};

function roundToOne(value: number): number {
  return Number(value.toFixed(1));
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function isNumber(value: number | null): value is number {
  return typeof value === 'number';
}

function normalizeOrganizationalSupportAnswer(rawValue: string | undefined) {
  const value = rawValue?.trim().replace(/\s+/g, ' ').toLowerCase();

  if (!value) return null;
  if (value.includes('not at all')) return 'notSupportedAtAll';
  if (value.includes('minimally')) return 'minimallySupported';
  if (value.includes('somewhat')) return 'somewhatSupported';
  if (value.includes('well supported')) return 'wellSupported';
  if (value.includes('very well supported')) return 'veryWellSupported';
  return null;
}

function organizationalSupportScore(rawValue: string | undefined): number | null {
  const key = normalizeOrganizationalSupportAnswer(rawValue);
  if (!key) return null;

  switch (key) {
    case 'notSupportedAtAll':
      return 1;
    case 'minimallySupported':
      return 2;
    case 'somewhatSupported':
      return 3;
    case 'wellSupported':
      return 4;
    case 'veryWellSupported':
      return 5;
  }
}

function groupResponsesByScope(responses: RawResponse[], scope: Scope) {
  const groups = new Map<string, RawResponse[]>();

  for (const response of responses) {
    const names =
      scope === 'department'
        ? allDepartmentsList(response.department)
        : allProjectsList(response.projects);

    for (const name of names) {
      const existing = groups.get(name) ?? [];
      existing.push(response);
      groups.set(name, existing);
    }
  }

  return Array.from(groups.entries()).sort(([left], [right]) => left.localeCompare(right));
}

export function buildResistanceByScopeRows(
  responses: RawResponse[],
  scope: Scope,
): Row[] {
  return groupResponsesByScope(responses, scope)
    .map(([name, scopedResponses]) => {
      const supportScores = scopedResponses
        .map((response) =>
          organizationalSupportScore(
            response.surveyType === 'business' ? response.q4_9 : response.q4_11,
          ),
        )
        .filter(isNumber);
      const summary = buildResistanceSummary(scopedResponses);

      if (summary.respondentCount === 0 || supportScores.length === 0) return null;

      const support = roundToOne(average(supportScores));
      const resistance = roundToOne(summary.score);
      const highResistanceShare = roundToOne(summary.highResistanceShare);

      return {
        name,
        respondents: summary.respondentCount,
        support,
        resistance,
        highResistanceShare,
        color:
          support < 3 && resistance >= 3
            ? '#dc2626'
            : support >= 3 && resistance >= 3
              ? '#f59e0b'
              : support < 3
                ? '#2563eb'
                : '#0f766e',
      };
    })
    .filter((row): row is Row => Boolean(row))
    .sort(
      (left, right) =>
        right.resistance - left.resistance ||
        right.highResistanceShare - left.highResistanceShare ||
        right.respondents - left.respondents ||
        left.name.localeCompare(right.name),
    );
}

function TooltipContent({
  active,
  payload,
  scope,
  highlightName,
  tooltipOnlyForHighlight = false,
}: {
  active?: boolean;
  payload?: Array<{ payload?: Row }>;
  scope: Scope;
  highlightName?: string;
  tooltipOnlyForHighlight?: boolean;
}) {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;
  if (tooltipOnlyForHighlight && point.name !== highlightName) return null;

  return (
    <div className="rounded-md bg-[#242424] px-4 py-3 text-sm text-white shadow-lg">
      <SensitiveTooltipLabel
        prefix={scope === 'department' ? 'Department' : 'Team'}
        value={point.name}
        className="mb-2 font-semibold text-white"
      />
      <div className="space-y-1">
        <div>Support: {point.support.toFixed(1)} / 5</div>
        <div>Resistance score: {point.resistance.toFixed(1)} / 5</div>
        <div>Strong resistance signals: {point.highResistanceShare.toFixed(1)}%</div>
        <div>Respondents: {point.respondents}</div>
      </div>
    </div>
  );
}

export default function ResistanceByScopeCard({
  departmentRows,
  teamRows,
  scope: forcedScope,
  hideScopeToggle = false,
  highlightName,
  comparisonAsMuted = false,
  tooltipOnlyForHighlight = false,
  feedbackPage = 'organization',
  feedbackEventProperties,
}: {
  departmentRows: Row[];
  teamRows: Row[];
  scope?: Scope;
  hideScopeToggle?: boolean;
  highlightName?: string;
  comparisonAsMuted?: boolean;
  tooltipOnlyForHighlight?: boolean;
  feedbackPage?: string;
  feedbackEventProperties?: Record<string, unknown>;
}) {
  const [scope, setScope] = useState<Scope>(forcedScope ?? 'department');
  useEffect(() => {
    if (forcedScope) {
      setScope(forcedScope);
    }
  }, [forcedScope]);
  const rows = scope === 'department' ? departmentRows : teamRows;
  const comparisonRows =
    comparisonAsMuted && highlightName
      ? rows.filter((row) => row.name !== highlightName)
      : [];
  const focusRows =
    comparisonAsMuted && highlightName
      ? rows.filter((row) => row.name === highlightName)
      : rows;
  const comparisonPlotRows: ChartRow[] = comparisonRows.map((row) => ({
    ...row,
    plotRespondents: row.respondents,
  }));
  const focusPlotRows: ChartRow[] = focusRows.map((row) => ({
    ...row,
    // Give the highlighted scope a slightly larger bubble so it reads above dense overlaps.
    plotRespondents: comparisonAsMuted && highlightName ? row.respondents * 1.18 : row.respondents,
  }));

  return (
    <section className="group relative rounded-2xl border border-[#eaeaea] bg-white p-6 shadow-sm">
      <ChartFeedback
        chartTitle="Support vs Resistance"
        page={feedbackPage}
        eventProperties={feedbackEventProperties}
      />
      <h3 className="text-lg font-semibold tracking-tight text-[#242424]">
        Support vs Resistance
      </h3>
      <p className="mt-1 text-sm text-[#7a7a7a]">
        Compare organizational support for AI adoption against resistance to broader AI use. This
        separates teams that are willing but unsupported from teams that are supported but still
        resistant.
      </p>

      {hideScopeToggle ? null : (
        <div className="mt-4 flex flex-wrap gap-2">
          {(['department', 'team'] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setScope(option)}
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

      <div className="relative mt-6 h-[340px]">
        <div className="pointer-events-none absolute left-4 top-3 z-10 rounded-full bg-white/90 px-3 py-1 text-[11px] font-medium text-[#475569] shadow-sm ring-1 ring-[#e5e7eb]">
          Low support + high resistance
        </div>
        <div className="pointer-events-none absolute right-4 top-3 z-10 rounded-full bg-white/90 px-3 py-1 text-[11px] font-medium text-[#475569] shadow-sm ring-1 ring-[#e5e7eb]">
          High support + high resistance
        </div>
        <div className="pointer-events-none absolute bottom-9 left-4 z-10 rounded-full bg-white/90 px-3 py-1 text-[11px] font-medium text-[#475569] shadow-sm ring-1 ring-[#e5e7eb]">
          Low support + low resistance
        </div>
        <div className="pointer-events-none absolute bottom-9 right-4 z-10 rounded-full bg-white/90 px-3 py-1 text-[11px] font-medium text-[#475569] shadow-sm ring-1 ring-[#e5e7eb]">
          High support + low resistance
        </div>
        {rows.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart
              data={rows}
              margin={{ top: 10, right: 12, left: 0, bottom: 18 }}
            >
              <CartesianGrid stroke="#ececec" strokeDasharray="3 3" />
              <XAxis
                type="number"
                dataKey="support"
                domain={[1, 5]}
                ticks={[1, 2, 3, 4, 5]}
                tick={{ fontSize: 12, fill: '#737373' }}
                axisLine={false}
                tickLine={false}
                label={{
                  value: 'Organizational support',
                  position: 'bottom',
                  offset: 6,
                  fill: '#525252',
                  fontSize: 12,
                  fontWeight: 600,
                }}
              />
              <YAxis
                type="number"
                dataKey="resistance"
                domain={[1, 5]}
                ticks={[1, 2, 3, 4, 5]}
                tick={{ fontSize: 12, fill: '#525252' }}
                axisLine={false}
                tickLine={false}
                label={{
                  value: 'Resistance score',
                  angle: -90,
                  position: 'insideLeft',
                  fill: '#525252',
                  fontSize: 12,
                  fontWeight: 600,
                }}
              />
              <ZAxis type="number" dataKey="plotRespondents" range={[140, 1100]} />
              <Tooltip
                isAnimationActive={false}
                content={
                  <TooltipContent
                    scope={scope}
                    highlightName={highlightName}
                    tooltipOnlyForHighlight={tooltipOnlyForHighlight}
                  />
                }
              />
              <ReferenceLine x={3} stroke="#d4d4d8" strokeDasharray="4 4" />
              <ReferenceLine y={3} stroke="#d4d4d8" strokeDasharray="4 4" />
              {comparisonPlotRows.length > 0 ? (
                <Scatter data={comparisonPlotRows}>
                  {comparisonPlotRows.map((row) => (
                    <Cell
                      key={`comparison-${row.name}`}
                      fill="#d1d5db"
                      fillOpacity={0.65}
                      stroke="#f8fafc"
                      strokeWidth={1.5}
                    />
                  ))}
                </Scatter>
              ) : null}
              <Scatter data={focusPlotRows}>
                {focusPlotRows.map((row) => (
                  <Cell
                    key={row.name}
                    fill={row.color}
                    stroke="#ffffff"
                    strokeWidth={row.name === highlightName ? 2.5 : 2.5}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-[#d4d4d8] bg-[#fafafa] px-6 text-center text-sm text-[#7a7a7a]">
            No resistance-score responses are available in the current view.
          </div>
        )}
      </div>
    </section>
  );
}
