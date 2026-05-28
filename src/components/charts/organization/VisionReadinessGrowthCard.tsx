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

type Scope = 'department' | 'team';
type Row = {
  name: string;
  respondents: number;
  previous: number;
  current: number;
  delta: number;
};

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
              tick={{ fontSize: 12, fill: '#525252' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              isAnimationActive={false}
              formatter={(value, _name, entry) => [
                typeof value === 'number' ? `${value.toFixed(1)} / 5` : String(value ?? '-'),
                String(entry?.dataKey) === 'current' ? 'Current' : 'Previous',
              ]}
              labelFormatter={(label, payload) => {
                const point = payload?.[0]?.payload as Row | undefined;
                return `${label} · ${point?.respondents ?? 0} respondents · ${point?.delta.toFixed(1) ?? '0.0'} delta`;
              }}
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
