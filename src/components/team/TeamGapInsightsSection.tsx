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
} from '../charts/recharts';
import ChartFeedback from '../analytics/ChartFeedback';
import ResistanceByScopeCard from '../charts/organization/ResistanceByScopeCard';
import ResistanceReasonsCard from '../charts/organization/ResistanceReasonsCard';
import TopDeviatingPeopleCard from '../organization/TopDeviatingPeopleCard';
import TeamSectionHeader from './TeamSectionHeader';
import TeamMaturityNotSpreadingCard from './TeamMaturityNotSpreadingCard';
import { useSensitiveData } from '../privacy/SensitiveDataContext';
import SensitiveText from '../ui/SensitiveText';
import type {
  TeamSupportDemandPoint,
  TeamToolAccessPoint,
  TeamUsageImpactPoint,
  TeamWorkflowTransformationPoint,
} from '../../data/survey/gapInsights';
import type { DeviatingPersonRow } from '../../data/survey/deviationInsights';
import type { TeamValidatedPersonRow } from '../../data/survey/teamValidatedView';
import type { ScopeType } from './teamViewShared';

type TeamGapInsightsSectionProps = {
  variant?: 'mustKnow' | 'deepAnalysis';
  scopeLabelLower: string;
  selectedScopeName: string;
  selectedScopeType: ScopeType;
  usageImpactData: TeamUsageImpactPoint[];
  comparisonUsageImpactData: TeamUsageImpactPoint[];
  supportDemandRows: TeamSupportDemandPoint[];
  toolAccessRows: TeamToolAccessPoint[];
  workflowRows: TeamWorkflowTransformationPoint[];
  blockerComparison: Array<{
    label: string;
    businessCount: number;
    businessShare: number;
    deliveryCount: number;
    deliveryShare: number;
  }>;
  resistanceDepartmentRows: Array<{
    name: string;
    respondents: number;
    support: number;
    resistance: number;
    highResistanceShare: number;
    color: string;
  }>;
  resistanceTeamRows: Array<{
    name: string;
    respondents: number;
    support: number;
    resistance: number;
    highResistanceShare: number;
    color: string;
  }>;
  deviatingPeopleRows: DeviatingPersonRow[];
  maturityNotSpreadingRows: TeamValidatedPersonRow[];
};

type ScatterBaseRow = {
  name: string;
  role: string;
  overall: number;
  level: string;
  color: string;
  size: number;
  isComparison?: boolean;
};

type ScatterCardProps<Row extends ScatterBaseRow> = {
  title: string;
  description: string;
  rows: Row[];
  xKey: keyof Row;
  yKey: keyof Row;
  xLabel: string;
  yLabel: string;
  xDomain: [number, number];
  yDomain: [number, number];
  xTicks: number[];
  yTicks: number[];
  xTickFormatter?: (value: number) => string;
  yTickFormatter?: (value: number) => string;
  renderDetails: (row: Row) => Array<{ label: string; value: string }>;
  referenceX?: number;
  referenceY?: number;
  badges?: {
    topLeft: string;
    topRight: string;
    bottomLeft: string;
    bottomRight: string;
  };
};

function MemberTooltip<Row extends ScatterBaseRow>({
  active,
  payload,
  renderDetails,
}: {
  active?: boolean;
  payload?: Array<{ payload?: Row }>;
  renderDetails: (row: Row) => Array<{ label: string; value: string }>;
}) {
  const row = payload?.[0]?.payload;
  const { isSensitiveDataHidden } = useSensitiveData();

  if (!active || !row || row.isComparison) {
    return null;
  }

  return (
    <div className="rounded-md bg-[#242424] px-4 py-3 text-sm text-white shadow-lg">
      <SensitiveText
        as="div"
        hidden={isSensitiveDataHidden}
        className="mb-2 font-semibold text-white"
      >
        {row.name}
      </SensitiveText>
      <div className="mb-2 text-xs text-white/75">
        {row.role} • {row.level} • {row.overall.toFixed(1)} / 5 overall
      </div>
      <div className="space-y-1">
        {renderDetails(row).map((item) => (
          <div key={item.label}>
            {item.label}: {item.value}
          </div>
        ))}
      </div>
    </div>
  );
}

function CenteredYAxisLabel({ value }: { value: string }) {
  return (
    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center justify-center">
      <span className="text-xs font-semibold text-[#525252] [transform:rotate(180deg)] [writing-mode:vertical-rl]">
        {value}
      </span>
    </div>
  );
}

function MemberScatterCard<Row extends ScatterBaseRow>({
  title,
  description,
  rows,
  xKey,
  yKey,
  xLabel,
  yLabel,
  xDomain,
  yDomain,
  xTicks,
  yTicks,
  xTickFormatter,
  yTickFormatter,
  renderDetails,
  referenceX,
  referenceY,
  badges,
}: ScatterCardProps<Row>) {
  return (
    <section className="group relative rounded-2xl border border-[#eaeaea] bg-white p-6 shadow-sm">
      <ChartFeedback chartTitle={title} page="team" eventProperties={{ chart_section: 'team_gap_signals' }} />
      <h3 className="text-lg font-semibold tracking-tight text-[#242424]">{title}</h3>
      <p className="mt-1 text-sm text-[#7a7a7a]">{description}</p>

      <div className="mt-6 h-[340px]">
        <div className="relative h-full pl-10">
          <CenteredYAxisLabel value={yLabel} />
          <div className="relative h-full">
            {badges ? (
              <>
                <div className="pointer-events-none absolute left-4 top-3 z-10 rounded-full bg-white/90 px-3 py-1 text-[11px] font-medium text-[#475569] shadow-sm ring-1 ring-[#e5e7eb]">
                  {badges.topLeft}
                </div>
                <div className="pointer-events-none absolute right-4 top-3 z-10 rounded-full bg-white/90 px-3 py-1 text-[11px] font-medium text-[#475569] shadow-sm ring-1 ring-[#e5e7eb]">
                  {badges.topRight}
                </div>
                <div className="pointer-events-none absolute bottom-9 left-4 z-10 rounded-full bg-white/90 px-3 py-1 text-[11px] font-medium text-[#475569] shadow-sm ring-1 ring-[#e5e7eb]">
                  {badges.bottomLeft}
                </div>
                <div className="pointer-events-none absolute bottom-9 right-4 z-10 rounded-full bg-white/90 px-3 py-1 text-[11px] font-medium text-[#475569] shadow-sm ring-1 ring-[#e5e7eb]">
                  {badges.bottomRight}
                </div>
              </>
            ) : null}
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 12, left: 0, bottom: 18 }}>
                <CartesianGrid stroke="#ececec" strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  dataKey={xKey as string}
                  domain={xDomain}
                  ticks={xTicks}
                  tickFormatter={xTickFormatter}
                  tick={{ fontSize: 12, fill: '#737373' }}
                  axisLine={false}
                  tickLine={false}
                  label={{
                    value: xLabel,
                    position: 'bottom',
                    offset: 6,
                    fill: '#525252',
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                />
                <YAxis
                  type="number"
                  dataKey={yKey as string}
                  domain={yDomain}
                  ticks={yTicks}
                  tickFormatter={yTickFormatter}
                  tick={{ fontSize: 12, fill: '#737373' }}
                  axisLine={false}
                  tickLine={false}
                />
                <ZAxis type="number" dataKey="size" range={[220, 980]} />
                <Tooltip
                  isAnimationActive={false}
                  cursor={{ strokeDasharray: '3 3' }}
                  content={<MemberTooltip renderDetails={renderDetails} />}
                />
                {typeof referenceX === 'number' ? (
                  <ReferenceLine x={referenceX} stroke="#d4d4d8" strokeDasharray="4 4" />
                ) : null}
                {typeof referenceY === 'number' ? (
                  <ReferenceLine y={referenceY} stroke="#d4d4d8" strokeDasharray="4 4" />
                ) : null}
                <Scatter data={rows}>
                  {rows.map((row) => (
                    <Cell key={row.name} fill={row.color} stroke="#ffffff" strokeWidth={2.5} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function TeamGapInsightsSection({
  variant = 'deepAnalysis',
  scopeLabelLower,
  selectedScopeName,
  selectedScopeType,
  usageImpactData,
  comparisonUsageImpactData,
  supportDemandRows,
  toolAccessRows,
  workflowRows,
  blockerComparison,
  resistanceDepartmentRows,
  resistanceTeamRows,
  deviatingPeopleRows,
  maturityNotSpreadingRows,
}: TeamGapInsightsSectionProps) {
  const { isSensitiveDataHidden } = useSensitiveData();
  const isMustKnow = variant === 'mustKnow';
  const comparisonUsageImpactRows = comparisonUsageImpactData.map((row) => ({
    ...row,
    isComparison: true,
  }));

  return (
    <section id="team-gap-signals" className="mt-8 scroll-mt-24">
      <TeamSectionHeader
        title="Where are the gaps?"
        subtitle={
          isMustKnow
            ? `A focused read on where the selected ${scopeLabelLower} is getting value and which people stand out enough to deserve follow-up.`
            : `See what is happening inside the selected ${scopeLabelLower}: who is getting value, who needs support, who is blocked by tools, and where workflow or governance risks are concentrated.`
        }
      />

      <div className="mb-4 inline-flex items-center rounded-full border border-[#e5e7eb] bg-white px-3 py-1.5 text-sm text-[#525252] shadow-sm">
        Selected {scopeLabelLower}:{' '}
        <SensitiveText
          as="span"
          hidden={isSensitiveDataHidden}
          className="ml-1 font-semibold text-[#242424]"
        >
          {selectedScopeName}
        </SensitiveText>
      </div>

      <div className="space-y-5">
        <section id="team-usage-impact" className="group relative rounded-2xl border border-[#eaeaea] bg-white p-6 shadow-sm">
          <ChartFeedback
            chartTitle="Usage vs Impact quadrant"
            page="team"
            eventProperties={{
              chart_section: 'team_gap_signals',
              selected_scope_name_length: selectedScopeName.length,
            }}
          />
          <h3 className="text-lg font-semibold tracking-tight text-[#242424]">
            Usage vs Impact quadrant
          </h3>
          <p className="mt-1 text-sm text-[#7a7a7a]">
            Plot people inside the selected {scopeLabelLower} by personal AI usage and personal impact, with the rest of the organization shown in gray for context.
          </p>

          <div className="relative mt-6 h-[320px]">
            <div className="pointer-events-none absolute left-4 top-3 z-10 rounded-full bg-white/90 px-3 py-1 text-[11px] font-medium text-[#475569] shadow-sm ring-1 ring-[#e5e7eb]">
              Low usage + high impact
            </div>
            <div className="pointer-events-none absolute right-4 top-3 z-10 rounded-full bg-white/90 px-3 py-1 text-[11px] font-medium text-[#475569] shadow-sm ring-1 ring-[#e5e7eb]">
              High usage + high impact
            </div>
            <div className="pointer-events-none absolute bottom-9 left-4 z-10 rounded-full bg-white/90 px-3 py-1 text-[11px] font-medium text-[#475569] shadow-sm ring-1 ring-[#e5e7eb]">
              Low usage + low impact
            </div>
            <div className="pointer-events-none absolute bottom-9 right-4 z-10 rounded-full bg-white/90 px-3 py-1 text-[11px] font-medium text-[#475569] shadow-sm ring-1 ring-[#e5e7eb]">
              High usage + low impact
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 12, left: 0, bottom: 18 }}>
                <CartesianGrid stroke="#ececec" strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  dataKey="usage"
                  domain={[1, 5]}
                  ticks={[1, 2, 3, 4, 5]}
                  tick={{ fontSize: 12, fill: '#737373' }}
                  axisLine={false}
                  tickLine={false}
                  label={{
                    value: 'Personal usage',
                    position: 'bottom',
                    offset: 6,
                    fill: '#525252',
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                />
                <YAxis
                  type="number"
                  dataKey="impact"
                  domain={[1, 5]}
                  ticks={[1, 2, 3, 4, 5]}
                  tick={{ fontSize: 12, fill: '#737373' }}
                  axisLine={false}
                  tickLine={false}
                  label={{
                    value: 'Personal impact',
                    angle: -90,
                    position: 'insideLeft',
                    fill: '#525252',
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                />
                <ZAxis type="number" dataKey="size" range={[220, 980]} />
                <Tooltip
                  isAnimationActive={false}
                  cursor={{ strokeDasharray: '3 3' }}
                  content={
                    <MemberTooltip<TeamUsageImpactPoint>
                      renderDetails={(row) => [
                        { label: 'Usage', value: `${row.usage.toFixed(1)} / 5` },
                        { label: 'Impact', value: `${row.impact.toFixed(1)} / 5` },
                      ]}
                    />
                  }
                />
                <ReferenceLine x={3} stroke="#d4d4d8" strokeDasharray="4 4" />
                <ReferenceLine y={3} stroke="#d4d4d8" strokeDasharray="4 4" />
                <Scatter data={comparisonUsageImpactRows}>
                  {comparisonUsageImpactRows.map((row) => (
                    <Cell
                      key={`comparison-${row.name}`}
                      fill="#d1d5db"
                      fillOpacity={0.65}
                      stroke="#f8fafc"
                      strokeWidth={1.5}
                    />
                  ))}
                </Scatter>
                <Scatter data={usageImpactData}>
                  {usageImpactData.map((row) => (
                    <Cell key={row.name} fill={row.color} stroke="#ffffff" strokeWidth={2.5} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </section>

        <div id="team-top-deviating" className="grid gap-5 xl:grid-cols-2">
          <TopDeviatingPeopleCard
            rows={deviatingPeopleRows}
            title="Top deviating people"
            description={`People inside the selected ${scopeLabelLower} whose maturity profile looks most different from their current project peers and department peers. Low sharing evidence can mean strong know-how is staying personal instead of spreading through advice or reusable practices.`}
            emptyMessage={`No people in the selected ${scopeLabelLower} currently stand out enough from their peer groups to surface here.`}
          />
          <div id="team-maturity-not-spreading">
            <TeamMaturityNotSpreadingCard
              rows={maturityNotSpreadingRows}
              scopeLabelLower={scopeLabelLower}
            />
          </div>
        </div>

        {isMustKnow ? null : (
          <div className="grid gap-5 xl:grid-cols-2">
          <MemberScatterCard<TeamSupportDemandPoint>
            title="Support demand vs current skill baseline"
            description={`See which people in the selected ${scopeLabelLower} need the most support while still sitting low on AI understanding.`}
            rows={supportDemandRows}
            xKey="baselineSkills"
            yKey="supportDemand"
            xLabel="AI understanding"
            yLabel="How much support they currently need"
            xDomain={[1, 5]}
            yDomain={[0, 100]}
            xTicks={[1, 2, 3, 4, 5]}
            yTicks={[0, 25, 50, 75, 100]}
            yTickFormatter={(value) => `${value}%`}
            referenceX={3}
            referenceY={50}
            badges={{
              topLeft: 'Low AI understanding + high support need',
              topRight: 'High AI understanding + high support need',
              bottomLeft: 'Low AI understanding + low support need',
              bottomRight: 'High AI understanding + low support need',
            }}
            renderDetails={(row) => [
              { label: 'AI understanding', value: `${row.baselineSkills.toFixed(1)} / 5` },
              { label: 'How much support they currently need', value: `${row.supportDemand.toFixed(1)}%` },
              { label: 'Support signals', value: String(row.supportSignals) },
            ]}
          />

          <MemberScatterCard<TeamToolAccessPoint>
            title="Tool access constraint map"
            description={`Separate “needs training” from “blocked by tooling” by comparing access readiness and cost maturity for each person in the selected ${scopeLabelLower}.`}
            rows={toolAccessRows}
            xKey="access"
            yKey="costMaturity"
            xLabel="Access and licensing readiness"
            yLabel="Cost maturity"
            xDomain={[1, 5]}
            yDomain={[1, 5]}
            xTicks={[1, 2, 3, 4, 5]}
            yTicks={[1, 2, 3, 4, 5]}
            referenceX={3}
            referenceY={3}
            badges={{
              topLeft: 'Low access + high cost maturity',
              topRight: 'High access + high cost maturity',
              bottomLeft: 'Low access + low cost maturity',
              bottomRight: 'High access + low cost maturity',
            }}
            renderDetails={(row) => [
              { label: 'Access readiness', value: `${row.access.toFixed(1)} / 5` },
              { label: 'Cost maturity', value: `${row.costMaturity.toFixed(1)} / 5` },
              { label: 'Company/client funded access', value: row.fundedAccess ? 'Yes' : 'No / unsure' },
            ]}
          />

          <ResistanceReasonsCard
            data={blockerComparison}
            businessColor="#2563eb"
            deliveryColor="#0f766e"
            feedbackPage="team"
            feedbackEventProperties={{ chart_section: 'team_gap_signals' }}
          />

          <ResistanceByScopeCard
            departmentRows={resistanceDepartmentRows}
            teamRows={resistanceTeamRows}
            scope={selectedScopeType}
            hideScopeToggle
            highlightName={selectedScopeName}
            comparisonAsMuted
            tooltipOnlyForHighlight
            feedbackPage="team"
            feedbackEventProperties={{ chart_section: 'team_gap_signals' }}
          />

          <MemberScatterCard<TeamWorkflowTransformationPoint>
            title="Workflow transformation gap"
            description={`Compare personal hours saved and workflow-change depth inside the selected ${scopeLabelLower} to separate small efficiency wins from real work redesign.`}
            rows={workflowRows}
            xKey="hoursSaved"
            yKey="transformation"
            xLabel="Estimated hours saved / week"
            yLabel="Workflow transformation"
            xDomain={[0, 6]}
            yDomain={[1, 5]}
            xTicks={[0, 1, 3, 5, 6]}
            yTicks={[1, 2, 3, 4, 5]}
            xTickFormatter={(value) => `${value}h`}
            referenceX={3}
            referenceY={3}
            badges={{
              topLeft: 'Low time saved + high transformation',
              topRight: 'High time saved + high transformation',
              bottomLeft: 'Low time saved + low transformation',
              bottomRight: 'High time saved + low transformation',
            }}
          renderDetails={(row) => [
              { label: 'Estimated hours saved', value: `${row.hoursSaved.toFixed(1)}h / week` },
              { label: 'Workflow transformation', value: `${row.transformation.toFixed(1)} / 5` },
            ]}
          />
          </div>
        )}
      </div>
    </section>
  );
}
