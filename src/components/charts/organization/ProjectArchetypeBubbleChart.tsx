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

export type ArchetypeBubbleRow = {
  id: string;
  label: string;
  signal: string;
  scopeCount: number;
  respondentCount: number;
  usageImpactAverage: number;
  cultureVisionAverage: number;
};

export const TEAM_ARCHETYPE_BUBBLE_COLORS: Record<string, string> = {
  earlyCamp: '#94a3b8',
  visioneers: '#2563eb',
  individualExperts: '#d97706',
  toolOperators: '#0891b2',
  skepticalPerformers: '#7c3aed',
  outcomeHunters: '#dc2626',
  habitBuilders: '#059669',
  nativeTeams: '#4338ca',
};

function ProjectArchetypeTooltip({
  active,
  payload,
  scopeLabel,
}: {
  active?: boolean;
  payload?: Array<{ payload?: ArchetypeBubbleRow }>;
  scopeLabel: string;
}) {
  const point = payload?.[0]?.payload;

  if (!active || !point) {
    return null;
  }

  return (
    <div className="rounded-md bg-[#242424] px-4 py-3 text-sm text-white shadow-lg">
      <div className="mb-2 font-semibold text-white">{point.label}</div>
      <div className="space-y-1">
        <div>Average usage + impact: {point.usageImpactAverage.toFixed(1)} / 5</div>
        <div>Average culture + vision: {point.cultureVisionAverage.toFixed(1)} / 5</div>
        <div>
          {scopeLabel}: {point.scopeCount}
        </div>
        <div>Respondents: {point.respondentCount}</div>
      </div>
      <div className="mt-2 text-xs leading-5 text-white/80">{point.signal}</div>
    </div>
  );
}

export default function ProjectArchetypeBubbleChart({
  rows,
  scopeLabel,
  scopeLabelPlural,
  title = 'Archetype bubble chart',
  colors = TEAM_ARCHETYPE_BUBBLE_COLORS,
  cardClassName = 'bg-[#fafafa]',
}: {
  rows: ArchetypeBubbleRow[];
  scopeLabel: string;
  scopeLabelPlural: string;
  title?: string;
  colors?: Record<string, string>;
  cardClassName?: string;
}) {
  const colorFor = (id: string) => colors[id] ?? '#6b7280';

  if (rows.length === 0) {
    return (
      <div className={`rounded-2xl border border-[#eaeaea] p-5 ${cardClassName}`}>
        <h4 className="text-base font-semibold tracking-tight text-[#242424]">
          {title}
        </h4>
        <p className="mt-2 text-sm leading-6 text-[#7a7a7a]">
          No {scopeLabel.toLowerCase()} archetype data is available yet.
        </p>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border border-[#eaeaea] p-5 ${cardClassName}`}>
      <h4 className="text-base font-semibold tracking-tight text-[#242424]">
        {title}
      </h4>
      <p className="mt-1 text-sm leading-6 text-[#7a7a7a]">
        Each bubble groups {scopeLabelPlural.toLowerCase()} by archetype. Bubble size shows{' '}
        {scopeLabel.toLowerCase()} count, while position shows the average of usage plus impact on
        one axis, and culture plus vision on the other.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {rows.map((row) => (
          <div
            key={row.id}
            className="inline-flex items-center gap-2 rounded-full border border-[#e5e7eb] bg-white px-3 py-1.5 text-xs font-medium text-[#374151]"
          >
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: colorFor(row.id) }}
            />
            <span>{row.label}</span>
            <span className="text-[#8b8b8b]">{row.scopeCount}</span>
          </div>
        ))}
      </div>

      <div className="relative mt-5 h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 18, left: 24, bottom: 18 }}>
            <CartesianGrid stroke="#ececec" strokeDasharray="3 3" />
            <XAxis
              type="number"
              dataKey="usageImpactAverage"
              domain={[1, 5]}
              ticks={[1, 2, 3, 4, 5]}
              tick={{ fontSize: 12, fill: '#737373' }}
              axisLine={false}
              tickLine={false}
              label={{
                value: 'Average of usage and impact',
                position: 'bottom',
                offset: 6,
                fill: '#525252',
                fontSize: 12,
                fontWeight: 600,
              }}
            />
            <YAxis
              type="number"
              dataKey="cultureVisionAverage"
              domain={[1, 5]}
              ticks={[1, 2, 3, 4, 5]}
              tick={{ fontSize: 12, fill: '#737373' }}
              width={58}
              axisLine={false}
              tickLine={false}
              label={{
                value: 'Average of culture and vision',
                angle: -90,
                position: 'center',
                dx: -26,
                fill: '#525252',
                fontSize: 12,
                fontWeight: 600,
              }}
            />
            <ZAxis type="number" dataKey="scopeCount" range={[260, 1800]} />
            <Tooltip
              isAnimationActive={false}
              content={<ProjectArchetypeTooltip scopeLabel={scopeLabel} />}
            />
            <ReferenceLine x={3} stroke="#d4d4d8" strokeDasharray="4 4" />
            <ReferenceLine y={3} stroke="#d4d4d8" strokeDasharray="4 4" />
            <Scatter data={rows}>
              {rows.map((row) => (
                <Cell
                  key={row.id}
                  fill={colorFor(row.id)}
                  stroke="#ffffff"
                  strokeWidth={2.5}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
