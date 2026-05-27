import { ScatterChart, Scatter, ResponsiveContainer, CartesianGrid, XAxis, YAxis, ZAxis, Tooltip, Cell, ReferenceLine } from '../recharts';

type UsageImpactScope = 'department' | 'team';
type QuadrantSummaryItem = {
  key: string;
  title: string;
  note: string;
  count: number;
  share: number;
};
type QuadrantPoint = {
  name: string;
  usage: number;
  impact: number;
  respondents: number;
  level: string;
  color: string;
};

function UsageImpactTooltip({
  active,
  payload,
  scopeLabel,
}: {
  active?: boolean;
  payload?: Array<{ payload?: QuadrantPoint }>;
  scopeLabel: string;
}) {
  const point = payload?.[0]?.payload;

  if (!active || !point) {
    return null;
  }

  return (
    <div className="rounded-md bg-[#242424] px-4 py-3 text-sm text-white shadow-lg">
      <div className="mb-2 font-semibold text-white">
        {scopeLabel}: {point.name}
      </div>
      <div className="space-y-1">
        <div>Impact: {point.impact.toFixed(1)} / 5</div>
        <div>Usage: {point.usage.toFixed(1)} / 5</div>
        <div>Cohort size: {point.respondents} respondents</div>
        <div>Level: {point.level}</div>
      </div>
    </div>
  );
}

export default function UsageImpactQuadrantCard({
  scope,
  onScopeChange,
  summary,
  data,
}: {
  scope: UsageImpactScope;
  onScopeChange: (scope: UsageImpactScope) => void;
  summary: QuadrantSummaryItem[];
  data: QuadrantPoint[];
}) {
  return (
    <section className="rounded-2xl border border-[#eaeaea] bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold tracking-tight text-[#242424]">
        Usage vs Impact quadrant
      </h3>
      <p className="mt-1 text-sm text-[#7a7a7a]">
        See which departments or teams use AI a lot, and which ones actually get value from it.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {([
          { key: 'department' as const, label: 'Department' },
          { key: 'team' as const, label: 'Team' },
        ] as const).map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => onScopeChange(option.key)}
            className={`inline-flex items-center rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              scope === option.key
                ? 'border border-[#bfdbfe] bg-[#eff6ff] text-[#1d4ed8]'
                : 'border border-[#e5e7eb] bg-white text-[#525252] hover:bg-[#f8f8f8]'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-2 xl:grid-cols-4">
        {summary.map((item) => (
          <div key={item.key} className="rounded-xl border border-[#eaeaea] bg-[#fafafa] p-3 text-sm text-[#4b5563]">
            <div className="font-medium text-[#242424]">{item.title}</div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-[30px] font-semibold leading-none tracking-tight text-[#242424]">
                {item.share}%
              </span>
              <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#8b8b8b]">
                of cohorts
              </span>
            </div>
            <div className="mt-1 text-xs text-[#8b8b8b]">
              {item.count} {item.count === 1 ? 'cohort' : 'cohorts'}
            </div>
            <div className="mt-2 text-[#6b7280]">{item.note}</div>
          </div>
        ))}
      </div>

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
              name="Usage"
              label={{
                value: 'Usage',
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
              name="Impact"
              label={{
                value: 'Impact',
                angle: -90,
                position: 'insideLeft',
                fill: '#525252',
                fontSize: 12,
                fontWeight: 600,
              }}
            />
            <ZAxis type="number" dataKey="respondents" range={[120, 1200]} />
            <Tooltip
              isAnimationActive={false}
              cursor={{ strokeDasharray: '3 3' }}
              content={
                <UsageImpactTooltip scopeLabel={scope === 'department' ? 'Department' : 'Team'} />
              }
            />
            <ReferenceLine x={3} stroke="#d4d4d8" strokeDasharray="4 4" />
            <ReferenceLine y={3} stroke="#d4d4d8" strokeDasharray="4 4" />
            <Scatter data={data}>
              {data.map((item) => (
                <Cell key={item.name} fill={item.color} stroke="#ffffff" strokeWidth={2.5} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
