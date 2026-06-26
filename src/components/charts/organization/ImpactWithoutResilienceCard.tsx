import { useState } from 'react';
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
import { SensitiveTooltipLabel } from '../../ui/SensitiveChartText';

type Scope = 'department' | 'team';
type Row = {
  name: string;
  respondents: number;
  dependency: number;
  resilience: number;
  color: string;
};

function TooltipContent({
  active,
  payload,
  scope,
}: {
  active?: boolean;
  payload?: Array<{ payload?: Row }>;
  scope: Scope;
}) {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;

  return (
    <div className="rounded-md bg-[#242424] px-4 py-3 text-sm text-white shadow-lg">
      <SensitiveTooltipLabel
        prefix={scope === 'department' ? 'Department' : 'Team'}
        value={point.name}
        className="mb-2 font-semibold text-white"
      />
      <div className="space-y-1">
        <div>Dependency on AI: {point.dependency.toFixed(1)} / 5</div>
        <div>Practice resilience: {point.resilience.toFixed(1)} / 5</div>
        <div>Respondents: {point.respondents}</div>
      </div>
    </div>
  );
}

export default function ImpactWithoutResilienceCard({
  departmentRows,
  teamRows,
}: {
  departmentRows: Row[];
  teamRows: Row[];
}) {
  const [scope, setScope] = useState<Scope>('department');
  const rows = scope === 'department' ? departmentRows : teamRows;

  return (
    <section className="group relative rounded-2xl border border-[#eaeaea] bg-white p-6 shadow-sm">
      <ChartFeedback chartTitle="Impact without resilience" page="organization" />
      <h3 className="text-lg font-semibold tracking-tight text-[#242424]">
        Impact without resilience
      </h3>
      <p className="mt-1 text-sm text-[#7a7a7a]">
        Cross dependency on AI with whether practices would survive if a key person left. This is a strong org-risk view because high dependency plus low resilience means bus-factor risk.
      </p>

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

      <div className="relative mt-6 h-[340px]">
        <div className="pointer-events-none absolute left-4 top-3 z-10 rounded-full bg-white/90 px-3 py-1 text-[11px] font-medium text-[#475569] shadow-sm ring-1 ring-[#e5e7eb]">
          Low dependency + high resilience
        </div>
        <div className="pointer-events-none absolute right-4 top-3 z-10 rounded-full bg-white/90 px-3 py-1 text-[11px] font-medium text-[#475569] shadow-sm ring-1 ring-[#e5e7eb]">
          High dependency + high resilience
        </div>
        <div className="pointer-events-none absolute bottom-9 left-4 z-10 rounded-full bg-white/90 px-3 py-1 text-[11px] font-medium text-[#475569] shadow-sm ring-1 ring-[#e5e7eb]">
          Low dependency + low resilience
        </div>
        <div className="pointer-events-none absolute bottom-9 right-4 z-10 rounded-full bg-white/90 px-3 py-1 text-[11px] font-medium text-[#475569] shadow-sm ring-1 ring-[#e5e7eb]">
          High dependency + low resilience
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 12, left: 0, bottom: 18 }}>
            <CartesianGrid stroke="#ececec" strokeDasharray="3 3" />
            <XAxis
              type="number"
              dataKey="dependency"
              domain={[1, 5]}
              ticks={[1, 2, 3, 4, 5]}
              tick={{ fontSize: 12, fill: '#737373' }}
              axisLine={false}
              tickLine={false}
              label={{
                value: 'Dependency on AI',
                position: 'bottom',
                offset: 6,
                fill: '#525252',
                fontSize: 12,
                fontWeight: 600,
              }}
            />
            <YAxis
              type="number"
              dataKey="resilience"
              domain={[1, 5]}
              ticks={[1, 2, 3, 4, 5]}
              tick={{ fontSize: 12, fill: '#737373' }}
              axisLine={false}
              tickLine={false}
              label={{
                value: 'Practice resilience',
                angle: -90,
                position: 'insideLeft',
                fill: '#525252',
                fontSize: 12,
                fontWeight: 600,
              }}
            />
            <ZAxis type="number" dataKey="respondents" range={[160, 1100]} />
            <Tooltip isAnimationActive={false} content={<TooltipContent scope={scope} />} />
            <ReferenceLine x={3} stroke="#d4d4d8" strokeDasharray="4 4" />
            <ReferenceLine y={3} stroke="#d4d4d8" strokeDasharray="4 4" />
            <Scatter data={rows}>
              {rows.map((row) => (
                <Cell key={row.name} fill={row.color} stroke="#ffffff" strokeWidth={2} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
