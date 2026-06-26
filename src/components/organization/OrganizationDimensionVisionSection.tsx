import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from '../charts/recharts';
import DepartmentTeamFilters, { type DepartmentTeamFiltersProps } from './DepartmentTeamFilters';
import {
  CohortStackedTooltip,
  ImpactComparisonTooltip,
} from './OrganizationChartTooltips';
import { formatPercentageLabel } from '../charts/formatters';
import OrganizationSectionHeader from './OrganizationSectionHeader';

type SeriesItem<K extends string = string> = {
  key: K;
  label: string;
  color: string;
};

type StackedRow = {
  cohort: string;
  respondents: number;
  [key: string]: string | number;
};

type ComparisonRow = {
  label: string;
  businessShare: number;
  deliveryShare: number;
  businessCount: number;
  deliveryCount: number;
};

type StackedCardConfig = {
  title: string;
  description: string;
  filterProps: DepartmentTeamFiltersProps;
  data: StackedRow[];
  series: ReadonlyArray<SeriesItem>;
  stackId: string;
  chartHeight?: number;
};

type ComparisonCardConfig = {
  title: string;
  description: string;
  filterProps: DepartmentTeamFiltersProps;
  data: ComparisonRow[];
  chartHeight?: number;
  labelWidth?: number;
};

type VisionReadinessAverageSummaryEntry = {
  cohort: string;
  averageScore: number | null;
  color: string;
};

function LegendBadges({ series }: { series: ReadonlyArray<SeriesItem> }) {
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

function CohortBadges({
  businessColor,
  deliveryColor,
}: {
  businessColor: string;
  deliveryColor: string;
}) {
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <div className="inline-flex items-center gap-2 rounded-full border border-[#dbeafe] bg-[#eff6ff] px-3 py-1.5 text-xs font-medium text-[#1d4ed8]">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: businessColor }} />
        <span>Business</span>
      </div>
      <div className="inline-flex items-center gap-2 rounded-full border border-[#ccfbf1] bg-[#f0fdfa] px-3 py-1.5 text-xs font-medium text-[#0f766e]">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: deliveryColor }} />
        <span>Delivery & engineering</span>
      </div>
    </div>
  );
}

function StackedCard({
  title,
  description,
  filterProps,
  data,
  series,
  stackId,
  chartHeight = 260,
}: StackedCardConfig) {
  return (
    <section className="mt-5 rounded-2xl border border-[#eaeaea] bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold tracking-tight text-[#242424]">{title}</h3>
      <p className="mt-1 text-sm text-[#7a7a7a]">{description}</p>
      <DepartmentTeamFilters {...filterProps} />
      <LegendBadges series={series} />
      <div className="mt-6" style={{ height: `${chartHeight}px` }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
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
              width={150}
              tick={{ fontSize: 12, fill: '#525252' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip isAnimationActive={false} content={<CohortStackedTooltip />} />
            {series.map((entry, index) => (
              <Bar
                key={entry.key}
                dataKey={entry.key}
                name={entry.label}
                stackId={stackId}
                fill={entry.color}
                radius={index === series.length - 1 ? [0, 8, 8, 0] : undefined}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function ComparisonCard({
  title,
  description,
  filterProps,
  data,
  businessColor,
  deliveryColor,
  chartHeight = 320,
  labelWidth = 220,
}: ComparisonCardConfig & { businessColor: string; deliveryColor: string }) {
  return (
    <section className="mt-5 rounded-2xl border border-[#eaeaea] bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold tracking-tight text-[#242424]">{title}</h3>
      <p className="mt-1 text-sm text-[#7a7a7a]">{description}</p>
      <DepartmentTeamFilters {...filterProps} />
      <CohortBadges businessColor={businessColor} deliveryColor={deliveryColor} />
      <div className="mt-6" style={{ height: `${chartHeight}px` }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
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
            <Tooltip isAnimationActive={false} content={<ImpactComparisonTooltip />} />
            <Bar dataKey="businessShare" name="Business" fill={businessColor} radius={[0, 8, 8, 0]} />
            <Bar
              dataKey="deliveryShare"
              name="Delivery & engineering"
              fill={deliveryColor}
              radius={[0, 8, 8, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

export type OrganizationDimensionVisionSectionProps = {
  opportunityClarity: StackedCardConfig;
  actionPriorities: ComparisonCardConfig;
  workChangeImagination: StackedCardConfig;
  opportunitySelectionMaturity: StackedCardConfig;
  businessValueConnection: StackedCardConfig;
  personalDevelopmentDirection: StackedCardConfig;
  visionReadiness: {
    filterProps: DepartmentTeamFiltersProps;
    data: StackedRow[];
    series: ReadonlyArray<SeriesItem>;
    averageSummary: VisionReadinessAverageSummaryEntry[];
  };
  visionActionMix: ComparisonCardConfig;
  businessColor: string;
  deliveryColor: string;
};

export default function OrganizationDimensionVisionSection({
  opportunityClarity,
  actionPriorities,
  workChangeImagination,
  opportunitySelectionMaturity,
  businessValueConnection,
  personalDevelopmentDirection,
  visionReadiness,
  visionActionMix,
  businessColor,
  deliveryColor,
}: OrganizationDimensionVisionSectionProps) {
  return (
    <section id="org-dimension-vision" className="mt-8 scroll-mt-24">
      <OrganizationSectionHeader
        title="Dimension: Vision"
        subtitle="See how clearly people can spot future AI value, choose the right opportunities, connect them to business outcomes, and define what should happen next."
      />

      <StackedCard {...opportunityClarity} />
      <ComparisonCard {...actionPriorities} businessColor={businessColor} deliveryColor={deliveryColor} />
      <StackedCard {...workChangeImagination} />
      <StackedCard {...opportunitySelectionMaturity} />
      <StackedCard {...businessValueConnection} />
      <StackedCard {...personalDevelopmentDirection} />

      <section className="mt-5 rounded-2xl border border-[#eaeaea] bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold tracking-tight text-[#242424]">Vision readiness score</h3>
        <p className="mt-1 text-sm text-[#7a7a7a]">
          This gives one synthesized view of whether people can spot opportunities, evaluate them, connect them to value, and act intentionally.
        </p>
        <DepartmentTeamFilters {...visionReadiness.filterProps} />

        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl border border-[#e5e7eb] bg-[#fcfcfc] px-4 py-3 text-sm text-[#525252]">
          <span className="font-medium text-[#242424]">Average readiness score:</span>
          {visionReadiness.averageSummary.map((entry) => (
            <span
              key={`vision-readiness-average-${entry.cohort}`}
              className="inline-flex items-center gap-2 rounded-full border border-[#e5e7eb] bg-white px-3 py-1.5"
            >
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="font-medium text-[#242424]">{entry.cohort}</span>
              <span>{entry.averageScore !== null ? `${entry.averageScore.toFixed(1)} / 5` : '—'}</span>
            </span>
          ))}
        </div>

        <LegendBadges series={visionReadiness.series} />

        <div className="mt-6 h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={visionReadiness.data}
              layout="vertical"
              margin={{ top: 10, right: 12, left: 20, bottom: 0 }}
            >
              <CartesianGrid stroke="#ececec" vertical={false} strokeDasharray="3 3" />
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
                dataKey="cohort"
                width={150}
                tick={{ fontSize: 12, fill: '#525252' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip isAnimationActive={false} content={<CohortStackedTooltip />} />
              {visionReadiness.series.map((entry, index) => (
                <Bar
                  key={entry.key}
                  dataKey={entry.key}
                  name={entry.label}
                  stackId="vision-readiness"
                  fill={entry.color}
                  radius={index === visionReadiness.series.length - 1 ? [0, 8, 8, 0] : undefined}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <ComparisonCard {...visionActionMix} businessColor={businessColor} deliveryColor={deliveryColor} />
    </section>
  );
}
