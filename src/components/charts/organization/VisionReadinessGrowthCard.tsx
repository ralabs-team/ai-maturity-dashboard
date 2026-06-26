import { useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from '../recharts';
import { SensitiveAxisTick, SensitiveTooltipLabel } from '../../ui/SensitiveChartText';

type Scope = 'department' | 'team';
type Row = {
  name: string;
  respondents: number;
  previous: number;
  current: number;
  delta: number;
};

function VisionReadinessTooltip({
  active,
  payload,
  scope,
}: {
  active?: boolean;
  payload?: Array<{ dataKey?: string; value?: number; payload?: Row }>;
  scope: Scope;
}) {
  const point = payload?.[0]?.payload;

  if (!active || !point) {
    return null;
  }

  return (
    <div className="rounded-md bg-[#242424] px-4 py-3 text-sm text-white shadow-lg">
      <SensitiveTooltipLabel
        prefix={scope === 'department' ? 'Department' : 'Team'}
        value={point.name}
        className="mb-2 font-semibold text-white"
      />
      <div className="space-y-1">
        {payload?.map((entry) => (
          <div key={String(entry.dataKey)}>
            {entry.dataKey === 'current' ? 'Current' : 'Previous'}:{' '}
            {typeof entry.value === 'number' ? `${entry.value.toFixed(1)} / 5` : '-'}
          </div>
        ))}
        <div>Respondents: {point.respondents}</div>
        <div>Delta: {point.delta.toFixed(1)}</div>
      </div>
    </div>
  );
}

export default function VisionReadinessGrowthCard({
  departmentRows,
  teamRows,
  waveLabel,
}: {
  departmentRows: Row[];
  teamRows: Row[];
  waveLabel: string;
}) {
  const [scope, setScope] = useState<Scope>('department');
  const rows = scope === 'department' ? departmentRows : teamRows;

  return (
    <section className="rounded-2xl border border-[#eaeaea] bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold tracking-tight text-[#242424]">
        Vision readiness growth
      </h3>
      <p className="mt-1 text-sm text-[#7a7a7a]">
        Show which departments or teams improved most in Vision readiness. This helps because progress is not only about current use, but about seeing the next opportunity clearly.
      </p>
      <div className="mt-2 text-xs text-[#8b8b8b]">Current snapshot through {waveLabel}</div>

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

      <div className="mt-6 h-[380px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} layout="vertical" margin={{ top: 6, right: 12, left: 8, bottom: 6 }}>
            <CartesianGrid stroke="#ececec" horizontal={false} strokeDasharray="3 3" />
            <XAxis
              type="number"
              domain={[1, 5]}
              ticks={[1, 2, 3, 4, 5]}
              tick={{ fontSize: 12, fill: '#737373' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              dataKey="name"
              type="category"
              width={170}
              tick={
                <SensitiveAxisTick
                  fill="#525252"
                  fontSize={12}
                  textAnchor="end"
                  dy={4}
                />
              }
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              isAnimationActive={false}
              content={<VisionReadinessTooltip scope={scope} />}
            />
            <Legend iconType="circle" />
            <Bar dataKey="previous" name="Previous wave" fill="#cbd5e1" radius={[0, 8, 8, 0]} />
            <Bar dataKey="current" name="Current" fill="#7c3aed" radius={[0, 8, 8, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
