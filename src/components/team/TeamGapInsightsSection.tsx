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
import TeamSectionHeader from './TeamSectionHeader';
import type {
  TeamSupportDemandPoint,
  TeamToolAccessPoint,
  TeamUsageImpactPoint,
  TeamWorkflowTransformationPoint,
} from '../../data/survey/gapInsights';

type TeamGapInsightsSectionProps = {
  scopeLabelLower: string;
  selectedScopeName: string;
  usageImpactData: TeamUsageImpactPoint[];
  comparisonUsageImpactData: TeamUsageImpactPoint[];
  supportDemandRows: TeamSupportDemandPoint[];
  toolAccessRows: TeamToolAccessPoint[];
  workflowRows: TeamWorkflowTransformationPoint[];
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

  if (!active || !row || row.isComparison) {
    return null;
  }

  return (
    <div className="rounded-md bg-[#242424] px-4 py-3 text-sm text-white shadow-lg">
      <div className="mb-2 font-semibold text-white">{row.name}</div>
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
}: ScatterCardProps<Row>) {
  return (
    <section className="rounded-2xl border border-[#eaeaea] bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold tracking-tight text-[#242424]">{title}</h3>
      <p className="mt-1 text-sm text-[#7a7a7a]">{description}</p>

      <div className="mt-6 h-[340px]">
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
              label={{
                value: yLabel,
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
    </section>
  );
}

export default function TeamGapInsightsSection({
  scopeLabelLower,
  selectedScopeName,
  usageImpactData,
  comparisonUsageImpactData,
  supportDemandRows,
  toolAccessRows,
  workflowRows,
}: TeamGapInsightsSectionProps) {
  const comparisonUsageImpactRows = comparisonUsageImpactData.map((row) => ({
    ...row,
    isComparison: true,
  }));

  return (
    <section id="team-gap-signals" className="mt-8 scroll-mt-24">
      <TeamSectionHeader
        title="Where are the gaps?"
        subtitle={`See what is happening inside the selected ${scopeLabelLower}: who is getting value, who needs support, who is blocked by tools, and where workflow or governance risks are concentrated.`}
      />

      <div className="mb-4 inline-flex items-center rounded-full border border-[#e5e7eb] bg-white px-3 py-1.5 text-sm text-[#525252] shadow-sm">
        Selected {scopeLabelLower}: <span className="ml-1 font-semibold text-[#242424]">{selectedScopeName}</span>
      </div>

      <div className="space-y-5">
        <section className="rounded-2xl border border-[#eaeaea] bg-white p-6 shadow-sm">
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

        <div className="grid gap-5 xl:grid-cols-2">
          <MemberScatterCard<TeamSupportDemandPoint>
            title="Support demand vs current skill baseline"
            description={`See which people in the selected ${scopeLabelLower} need the most support while still sitting low on baseline AI understanding.`}
            rows={supportDemandRows}
            xKey="baselineSkills"
            yKey="supportDemand"
            xLabel="Baseline AI understanding"
            yLabel="Support demand intensity"
            xDomain={[1, 5]}
            yDomain={[0, 100]}
            xTicks={[1, 2, 3, 4, 5]}
            yTicks={[0, 25, 50, 75, 100]}
            yTickFormatter={(value) => `${value}%`}
            referenceX={3}
            referenceY={50}
            renderDetails={(row) => [
              { label: 'Baseline AI understanding', value: `${row.baselineSkills.toFixed(1)} / 5` },
              { label: 'Support demand intensity', value: `${row.supportDemand.toFixed(1)}%` },
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
            renderDetails={(row) => [
              { label: 'Access readiness', value: `${row.access.toFixed(1)} / 5` },
              { label: 'Cost maturity', value: `${row.costMaturity.toFixed(1)} / 5` },
              { label: 'Company/client funded access', value: row.fundedAccess ? 'Yes' : 'No / unsure' },
            ]}
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
          renderDetails={(row) => [
              { label: 'Estimated hours saved', value: `${row.hoursSaved.toFixed(1)}h / week` },
              { label: 'Workflow transformation', value: `${row.transformation.toFixed(1)} / 5` },
            ]}
          />
        </div>
      </div>
    </section>
  );
}
