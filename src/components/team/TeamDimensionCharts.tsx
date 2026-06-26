import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from '../charts/recharts';
import { formatPercentageLabel } from '../charts/formatters';
import ChartFeedback from '../analytics/ChartFeedback';
import { useSensitiveData } from '../privacy/SensitiveDataContext';
import SensitiveText from '../ui/SensitiveText';
import type {
  TeamBarDistributionRow,
  TeamSeriesItem,
  TeamStackedDistributionRow,
} from '../../data/survey/teamDimensionInsights';

function LegendBadges({ series }: { series: ReadonlyArray<TeamSeriesItem> }) {
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {series.map((entry) => (
        <div
          key={entry.key}
          className="inline-flex items-center gap-2 rounded-full border border-[#e5e7eb] bg-[#fafafa] px-3 py-1.5 text-xs font-medium text-[#374151]"
        >
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
          <span>{entry.label}</span>
        </div>
      ))}
    </div>
  );
}

function ScopeMetaBadges({
  selectedScopeName,
  respondentCount,
  cohortBadgeLabel,
}: {
  selectedScopeName: string;
  respondentCount: number;
  cohortBadgeLabel?: string;
}) {
  const { isSensitiveDataHidden } = useSensitiveData();

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <div className="inline-flex items-center gap-2 rounded-full border border-[#e5e7eb] bg-white px-3 py-1.5 text-xs font-medium text-[#374151]">
        <span className="text-[#8b8b8b]">Selected scope:</span>
        <SensitiveText as="span" hidden={isSensitiveDataHidden} className="text-[#242424]">
          {selectedScopeName}
        </SensitiveText>
      </div>
      <div className="inline-flex items-center gap-2 rounded-full border border-[#e5e7eb] bg-[#fafafa] px-3 py-1.5 text-xs font-medium text-[#374151]">
        <span>{respondentCount} responses</span>
      </div>
      {cohortBadgeLabel ? (
        <div className="inline-flex items-center gap-2 rounded-full border border-[#ccfbf1] bg-[#f0fdfa] px-3 py-1.5 text-xs font-medium text-[#0f766e]">
          <span className="h-2.5 w-2.5 rounded-full bg-[#14b8a6]" />
          <span>{cohortBadgeLabel}</span>
        </div>
      ) : null}
    </div>
  );
}

function StackedDistributionTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ dataKey?: string; name?: string; value?: number; payload?: TeamStackedDistributionRow }>;
}) {
  const segment = payload?.[0];
  const row = segment?.payload;
  const dataKey = segment?.dataKey;

  if (!active || !row || !dataKey) {
    return null;
  }

  const count = row[`${dataKey}Count`];

  return (
    <div className="rounded-md bg-[#242424] px-4 py-3 text-sm text-white shadow-lg">
      <div className="font-semibold text-white">{segment.name}</div>
      <div className="mt-1">
        {typeof segment.value === 'number' ? formatPercentageLabel(segment.value) : '0%'}
      </div>
      {typeof count === 'number' ? (
        <div className="mt-1 text-xs text-white/75">
          {count} of {row.respondents} respondents
        </div>
      ) : null}
    </div>
  );
}

function RankedBarTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload?: TeamBarDistributionRow }>;
}) {
  const row = payload?.[0]?.payload;

  if (!active || !row) {
    return null;
  }

  return (
    <div className="rounded-md bg-[#242424] px-4 py-3 text-sm text-white shadow-lg">
      <div className="font-semibold text-white">{row.label}</div>
      <div className="mt-1">{row.share.toFixed(1)}%</div>
      <div className="mt-1 text-xs text-white/75">{row.count} respondents</div>
    </div>
  );
}

export function StackedDistributionCard({
  title,
  description,
  selectedScopeName,
  rows,
  series,
  emptyState,
  chartHeight = 240,
  cohortBadgeLabel,
}: {
  title: string;
  description: string;
  selectedScopeName: string;
  rows: TeamStackedDistributionRow[];
  series: ReadonlyArray<TeamSeriesItem>;
  emptyState: string;
  chartHeight?: number;
  cohortBadgeLabel?: string;
}) {
  const row = rows[0];
  const respondentCount = row?.respondents ?? 0;

  return (
    <section className="group relative mt-5 rounded-2xl border border-[#eaeaea] bg-white p-6 shadow-sm">
      <ChartFeedback
        chartTitle={title}
        page="team"
        eventProperties={{
          chart_section: 'team_dimensions',
          selected_scope_name_length: selectedScopeName.length,
          respondent_count: respondentCount,
        }}
      />
      <h3 className="text-lg font-semibold tracking-tight text-[#242424]">{title}</h3>
      <p className="mt-1 text-sm text-[#7a7a7a]">{description}</p>
      <ScopeMetaBadges
        selectedScopeName={selectedScopeName}
        respondentCount={respondentCount}
        cohortBadgeLabel={cohortBadgeLabel}
      />
      <LegendBadges series={series} />

      {respondentCount > 0 ? (
        <div className="mt-6" style={{ height: `${chartHeight}px` }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={rows}
              layout="vertical"
              margin={{ top: 10, right: 12, left: 20, bottom: 0 }}
            >
              <CartesianGrid stroke="#ececec" vertical={false} strokeDasharray="3 3" />
              <XAxis
                type="number"
                domain={[0, 100]}
                tickFormatter={formatPercentageLabel}
                tick={{ fontSize: 12, fill: '#737373' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="cohort"
                width={120}
                tick={{ fontSize: 12, fill: '#525252' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip isAnimationActive={false} shared={false} content={<StackedDistributionTooltip />} />
              {series.map((entry, index) => (
                <Bar
                  key={entry.key}
                  dataKey={entry.key}
                  name={entry.label}
                  stackId={title}
                  fill={entry.color}
                  radius={index === series.length - 1 ? [0, 8, 8, 0] : undefined}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="mt-6 flex min-h-[140px] items-center justify-center rounded-2xl border border-dashed border-[#d4d4d8] bg-[#fafafa] px-6 text-center text-sm text-[#7a7a7a]">
          {emptyState}
        </div>
      )}
    </section>
  );
}

export function RankedBarCard({
  title,
  description,
  selectedScopeName,
  rows,
  emptyState,
  barColor = '#14b8a6',
  chartHeight = 320,
  labelWidth = 240,
  cohortBadgeLabel,
  respondentCount,
}: {
  title: string;
  description: string;
  selectedScopeName: string;
  rows: TeamBarDistributionRow[];
  emptyState: string;
  barColor?: string;
  chartHeight?: number;
  labelWidth?: number;
  cohortBadgeLabel?: string;
  respondentCount: number;
}) {
  return (
    <section className="group relative mt-5 rounded-2xl border border-[#eaeaea] bg-white p-6 shadow-sm">
      <ChartFeedback
        chartTitle={title}
        page="team"
        eventProperties={{
          chart_section: 'team_dimensions',
          selected_scope_name_length: selectedScopeName.length,
          respondent_count: respondentCount,
        }}
      />
      <h3 className="text-lg font-semibold tracking-tight text-[#242424]">{title}</h3>
      <p className="mt-1 text-sm text-[#7a7a7a]">{description}</p>
      <ScopeMetaBadges
        selectedScopeName={selectedScopeName}
        respondentCount={respondentCount}
        cohortBadgeLabel={cohortBadgeLabel}
      />

      {respondentCount > 0 && rows.length > 0 ? (
        <div className="mt-6" style={{ height: `${chartHeight}px` }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={rows}
              layout="vertical"
              margin={{ top: 0, right: 12, left: 12, bottom: 0 }}
              barCategoryGap={10}
            >
              <CartesianGrid stroke="#ececec" strokeDasharray="3 3" horizontal={false} />
              <XAxis
                type="number"
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
                tick={{ fontSize: 12, fill: '#737373' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="label"
                width={labelWidth}
                tick={{ fontSize: 12, fill: '#525252' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip isAnimationActive={false} content={<RankedBarTooltip />} />
              <Bar dataKey="share" name="Share" fill={barColor} radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="mt-6 flex min-h-[140px] items-center justify-center rounded-2xl border border-dashed border-[#d4d4d8] bg-[#fafafa] px-6 text-center text-sm text-[#7a7a7a]">
          {emptyState}
        </div>
      )}
    </section>
  );
}
