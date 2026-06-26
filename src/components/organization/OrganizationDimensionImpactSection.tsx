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

type HoursSavedAverageSummaryEntry = {
  cohort: string;
  filteredAverage: number | null;
  overallAverage: number | null;
  delta: number | null;
  color: string;
};

type SingleCohortCardProps = {
  title: string;
  description: string;
  filterProps: DepartmentTeamFiltersProps;
  legend: ReadonlyArray<SeriesItem>;
  data: StackedRow[];
  stackId: string;
  cohortLabel: string;
  cohortColor: string;
  respondentCount: number;
  emptyState: string;
  chartHeight?: number;
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
  series,
  data,
  stackId,
  chartHeight = 260,
}: {
  title: string;
  description: string;
  filterProps: DepartmentTeamFiltersProps;
  series: ReadonlyArray<SeriesItem>;
  data: StackedRow[];
  stackId: string;
  chartHeight?: number;
}) {
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
}: {
  title: string;
  description: string;
  filterProps: DepartmentTeamFiltersProps;
  data: ComparisonRow[];
  businessColor: string;
  deliveryColor: string;
  chartHeight?: number;
  labelWidth?: number;
}) {
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

function SingleCohortCard({
  title,
  description,
  filterProps,
  legend,
  data,
  stackId,
  cohortLabel,
  cohortColor,
  respondentCount,
  emptyState,
  chartHeight = 240,
}: SingleCohortCardProps) {
  return (
    <section className="mt-5 rounded-2xl border border-[#eaeaea] bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold tracking-tight text-[#242424]">{title}</h3>
      <p className="mt-1 text-sm text-[#7a7a7a]">{description}</p>
      <DepartmentTeamFilters {...filterProps} />
      <LegendBadges series={legend} />

      <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#e5e7eb] bg-[#fafafa] px-3 py-1.5 text-xs font-medium text-[#374151]">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: cohortColor }} />
        <span>{cohortLabel}</span>
      </div>

      {respondentCount > 0 ? (
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
              {legend.map((entry, index) => (
                <Bar
                  key={entry.key}
                  dataKey={entry.key}
                  name={entry.label}
                  stackId={stackId}
                  fill={entry.color}
                  radius={index === legend.length - 1 ? [0, 8, 8, 0] : undefined}
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

export type OrganizationDimensionImpactSectionProps = {
  personalOutputImpact: {
    filterProps: DepartmentTeamFiltersProps;
    data: StackedRow[];
    series: ReadonlyArray<SeriesItem>;
  };
  workflowTransformation: {
    filterProps: DepartmentTeamFiltersProps;
    data: StackedRow[];
    series: ReadonlyArray<SeriesItem>;
  };
  hoursSaved: {
    filterProps: DepartmentTeamFiltersProps;
    data: ComparisonRow[];
    filtersActive: boolean;
    averageSummary: HoursSavedAverageSummaryEntry[];
  };
  dependencyOnAi: {
    filterProps: DepartmentTeamFiltersProps;
    data: StackedRow[];
    series: ReadonlyArray<SeriesItem>;
  };
  accessLicensing: {
    filterProps: DepartmentTeamFiltersProps;
    data: StackedRow[];
    series: ReadonlyArray<SeriesItem>;
  };
  whoPays: {
    filterProps: DepartmentTeamFiltersProps;
    data: ComparisonRow[];
  };
  costMaturity: {
    filterProps: DepartmentTeamFiltersProps;
    data: StackedRow[];
    series: ReadonlyArray<SeriesItem>;
  };
  deliveryPlanningImpact: {
    filterProps: DepartmentTeamFiltersProps;
    data: StackedRow[];
    series: ReadonlyArray<SeriesItem>;
    respondentCount: number;
  };
  nonAiBlocker: {
    filterProps: DepartmentTeamFiltersProps;
    data: ComparisonRow[];
  };
  businessColor: string;
  deliveryColor: string;
};

export default function OrganizationDimensionImpactSection({
  personalOutputImpact,
  workflowTransformation,
  hoursSaved,
  dependencyOnAi,
  accessLicensing,
  whoPays,
  costMaturity,
  deliveryPlanningImpact,
  nonAiBlocker,
  businessColor,
  deliveryColor,
}: OrganizationDimensionImpactSectionProps) {
  return (
    <section id="org-dimension-impact" className="mt-8 scroll-mt-24">
      <OrganizationSectionHeader
        title="Dimension: Impact"
        subtitle="See where AI is already creating visible value, changing workflows, saving time, and where that value is still constrained by access, cost, or operating blockers."
      />

      <StackedCard
        title="Personal output impact"
        description="This is the clearest top-line &quot;is AI actually helping?&quot; chart, and the answer ladders already align well."
        filterProps={personalOutputImpact.filterProps}
        data={personalOutputImpact.data}
        series={personalOutputImpact.series}
        stackId="personal-output-impact"
      />

      <StackedCard
        title="Workflow transformation depth"
        description="This shows whether AI is just speeding work up, or actually changing how work gets done. It&apos;s a stronger impact signal than simple satisfaction."
        filterProps={workflowTransformation.filterProps}
        data={workflowTransformation.data}
        series={workflowTransformation.series}
        stackId="workflow-transformation"
      />

      <section className="mt-5 rounded-2xl border border-[#eaeaea] bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold tracking-tight text-[#242424]">
          Hours saved per week
        </h3>
        <p className="mt-1 text-sm text-[#7a7a7a]">
          This gives a very concrete value chart and pairs well with the first two.
        </p>
        <DepartmentTeamFilters {...hoursSaved.filterProps} />
        <CohortBadges businessColor={businessColor} deliveryColor={deliveryColor} />

        {hoursSaved.filtersActive ? (
          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl border border-[#e5e7eb] bg-[#fcfcfc] px-4 py-3 text-sm text-[#525252]">
            <span className="font-medium text-[#242424]">Filter avg vs org avg:</span>
            {hoursSaved.averageSummary.map((entry) => {
              const deltaTone =
                entry.delta === null
                  ? 'text-[#8b8b8b]'
                  : entry.delta > 0
                    ? 'text-[#0f766e]'
                    : entry.delta < 0
                      ? 'text-[#b45309]'
                      : 'text-[#6b7280]';

              return (
                <span
                  key={`hours-saved-average-${entry.cohort}`}
                  className="inline-flex items-center gap-2 rounded-full border border-[#e5e7eb] bg-white px-3 py-1.5"
                >
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="font-medium text-[#242424]">{entry.cohort}</span>
                  <span>{entry.filteredAverage !== null ? `${entry.filteredAverage.toFixed(1)}h` : '—'}</span>
                  <span className="text-[#a1a1aa]">vs</span>
                  <span>{entry.overallAverage !== null ? `${entry.overallAverage.toFixed(1)}h` : '—'}</span>
                  {entry.delta !== null ? (
                    <span className={`font-medium ${deltaTone}`}>
                      ({entry.delta > 0 ? '+' : ''}
                      {entry.delta.toFixed(1)}h)
                    </span>
                  ) : null}
                </span>
              );
            })}
          </div>
        ) : null}

        <div className="mt-6 h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={hoursSaved.data}
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
                width={150}
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

      <StackedCard
        title="Dependency on AI if removed tomorrow"
        description="This is a great &quot;how embedded is the value?&quot; chart, and it complements the hours-saved chart really well."
        filterProps={dependencyOnAi.filterProps}
        data={dependencyOnAi.data}
        series={dependencyOnAi.series}
        stackId="dependency-impact"
      />

      <StackedCard
        title="Access and licensing"
        description="This shows whether impact is already supported by tool access, or still constrained by licensing and visibility."
        filterProps={accessLicensing.filterProps}
        data={accessLicensing.data}
        series={accessLicensing.series}
        stackId="access-licensing"
      />

      <ComparisonCard
        title="Who pays for AI tools"
        description="This is useful as an operational subplot, especially if we want to explain why adoption differs across teams."
        filterProps={whoPays.filterProps}
        data={whoPays.data}
        businessColor={businessColor}
        deliveryColor={deliveryColor}
        chartHeight={320}
      />

      <StackedCard
        title="Cost maturity"
        description="This combines pricing understanding with cost behavior, so we can see whether people are simply aware of tool costs or are actually making cost-aware decisions."
        filterProps={costMaturity.filterProps}
        data={costMaturity.data}
        series={costMaturity.series}
        stackId="cost-maturity"
      />

      <SingleCohortCard
        title="Delivery-only planning impact"
        description="This is very relevant for engineering and project delivery, but again it’s cohort-specific."
        filterProps={deliveryPlanningImpact.filterProps}
        legend={deliveryPlanningImpact.series}
        data={deliveryPlanningImpact.data}
        stackId="delivery-planning-impact"
        cohortLabel="Delivery & engineering"
        cohortColor={deliveryColor}
        respondentCount={deliveryPlanningImpact.respondentCount}
        emptyState="No delivery & engineering respondents match the current department and team filter."
      />

      <ComparisonCard
        title="Biggest non-AI blocker"
        description="This explains what still limits AI value even when adoption and skills are already present."
        filterProps={nonAiBlocker.filterProps}
        data={nonAiBlocker.data}
        businessColor={businessColor}
        deliveryColor={deliveryColor}
        chartHeight={420}
        labelWidth={290}
      />
    </section>
  );
}
