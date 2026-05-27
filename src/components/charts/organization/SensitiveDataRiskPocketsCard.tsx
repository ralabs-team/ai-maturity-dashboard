import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from '../recharts';

type Scope = 'department' | 'team';
type Row = {
  name: string;
  respondents: number;
  score: number;
  riskyShare: number;
  color: string;
};

function TooltipContent({
  active,
  payload,
  label,
  scope,
}: {
  active?: boolean;
  payload?: Array<{ payload?: Row }>;
  label?: string;
  scope: Scope;
}) {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;

  return (
    <div className="rounded-md bg-[#242424] px-4 py-3 text-sm text-white shadow-lg">
      <div className="mb-2 font-semibold text-white">
        {scope === 'department' ? 'Department' : 'Team'}: {label ?? point.name}
      </div>
      <div className="space-y-1">
        <div>Safe handling score: {point.score.toFixed(1)} / 5</div>
        <div>Risky or uncertain responses: {point.riskyShare.toFixed(1)}%</div>
        <div>Respondents: {point.respondents}</div>
      </div>
    </div>
  );
}

export default function SensitiveDataRiskPocketsCard({
  departmentRows,
  teamRows,
}: {
  departmentRows: Row[];
  teamRows: Row[];
}) {
  const [scope, setScope] = useState<Scope>('department');
  const rows = scope === 'department' ? departmentRows : teamRows;

  return (
    <section className="rounded-2xl border border-[#eaeaea] bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold tracking-tight text-[#242424]">
        Sensitive data risk pockets
      </h3>
      <p className="mt-1 text-sm text-[#7a7a7a]">
        Break out sensitive data handling by department or team and sort by weakest responses first. Gaps here are not only about capability; some are governance and risk hotspots.
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

      <div className="mt-6 h-[360px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 12, left: 12, bottom: 4 }}>
            <CartesianGrid stroke="#ececec" horizontal={false} strokeDasharray="3 3" />
            <XAxis
              type="number"
              domain={[0, 5]}
              ticks={[1, 2, 3, 4, 5]}
              tick={{ fontSize: 12, fill: '#737373' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              dataKey="name"
              type="category"
              width={150}
              tick={{ fontSize: 12, fill: '#525252' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip isAnimationActive={false} content={<TooltipContent scope={scope} />} />
            <Bar dataKey="score" radius={[0, 8, 8, 0]}>
              {rows.map((row) => (
                <Cell key={row.name} fill={row.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
