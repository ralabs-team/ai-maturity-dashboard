import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from '../charts/recharts';
import type { ChampionRow } from './ChampionVisibilityOptions';
import ChampionVisibilityOptions from './ChampionVisibilityOptions';
import DepartmentTeamFilters, { type DepartmentTeamFiltersProps } from './DepartmentTeamFilters';
import {
  CohortStackedTooltip,
  ImpactComparisonTooltip,
} from './OrganizationChartTooltips';
import { formatPercentageLabel } from '../charts/formatters';
import OrganizationSectionHeader from './OrganizationSectionHeader';
import ExperienceReviewOptions, { type ExperienceReviewCohorts } from './ExperienceReviewOptions';

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
};

type SingleCohortCardConfig = {
  title: string;
  description: string;
  filterProps: DepartmentTeamFiltersProps;
  data: StackedRow[];
  series: ReadonlyArray<SeriesItem>;
  stackId: string;
  emptyState: string;
  respondentCount: number;
  cohortColor: string;
  cohortLabel: string;
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
              width={220}
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
  data,
  series,
  stackId,
  emptyState,
  respondentCount,
  cohortColor,
  cohortLabel,
  chartHeight = 240,
}: SingleCohortCardConfig) {
  return (
    <section className="mt-5 rounded-2xl border border-[#eaeaea] bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold tracking-tight text-[#242424]">{title}</h3>
      <p className="mt-1 text-sm text-[#7a7a7a]">{description}</p>
      <DepartmentTeamFilters {...filterProps} />
      <LegendBadges series={series} />
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
      ) : (
        <div className="mt-6 flex min-h-[140px] items-center justify-center rounded-2xl border border-dashed border-[#d4d4d8] bg-[#fafafa] px-6 text-center text-sm text-[#7a7a7a]">
          {emptyState}
        </div>
      )}
    </section>
  );
}

export type OrganizationDimensionCultureSectionProps = {
  topChampionRows: ChampionRow[];
  detailedReviewCohorts: ExperienceReviewCohorts;
  growthMomentum: StackedCardConfig;
  experimentationInitiative: StackedCardConfig;
  knowledgeSharing: StackedCardConfig;
  influenceScore: StackedCardConfig;
  teamAiMaturity: StackedCardConfig;
  organizationalSupport: StackedCardConfig;
  toolSatisfaction: StackedCardConfig;
  enjoyability: StackedCardConfig;
  supportNeeded: ComparisonCardConfig;
  handsOnHelp: ComparisonCardConfig;
  practiceResilience: StackedCardConfig;
  knowledgeArtifacts: StackedCardConfig;
  businessOnboarding: SingleCohortCardConfig;
  businessColor: string;
  deliveryColor: string;
};

export default function OrganizationDimensionCultureSection({
  topChampionRows,
  detailedReviewCohorts,
  growthMomentum,
  experimentationInitiative,
  knowledgeSharing,
  influenceScore,
  teamAiMaturity,
  organizationalSupport,
  toolSatisfaction,
  enjoyability,
  supportNeeded,
  handsOnHelp,
  practiceResilience,
  knowledgeArtifacts,
  businessOnboarding,
  businessColor,
  deliveryColor,
}: OrganizationDimensionCultureSectionProps) {
  return (
    <section id="org-dimension-culture" className="mt-8 scroll-mt-24">
      <OrganizationSectionHeader
        title="Dimension: Culture"
        subtitle="See whether AI practice is spreading, becoming team-owned, and turning into reusable habits instead of staying dependent on a few individual champions."
      />

      <div id="org-ai-champions" className="scroll-mt-24">
        <ChampionVisibilityOptions topChampionRows={topChampionRows} />
      </div>
      <ExperienceReviewOptions cohorts={detailedReviewCohorts} />

      <StackedCard {...growthMomentum} />
      <StackedCard {...experimentationInitiative} />
      <StackedCard {...knowledgeSharing} />
      <StackedCard {...influenceScore} />
      <StackedCard {...teamAiMaturity} />
      <StackedCard {...organizationalSupport} />
      <StackedCard {...toolSatisfaction} />
      <StackedCard {...enjoyability} />
      <ComparisonCard {...supportNeeded} businessColor={businessColor} deliveryColor={deliveryColor} />
      <ComparisonCard {...handsOnHelp} businessColor={businessColor} deliveryColor={deliveryColor} />
      <StackedCard {...practiceResilience} />
      <StackedCard {...knowledgeArtifacts} />
      <SingleCohortCard {...businessOnboarding} />
    </section>
  );
}
