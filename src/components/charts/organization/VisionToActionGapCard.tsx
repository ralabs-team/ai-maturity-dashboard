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

type Scope = 'department' | 'team';
type Row = {
  name: string;
  respondents: number;
  visionReadiness: number;
  actionReadiness: number;
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
      <div className="mb-2 font-semibold text-white">
        {scope === 'department' ? 'Department' : 'Team'}: {point.name}
      </div>
      <div className="space-y-1">
        <div>Vision readiness: {point.visionReadiness.toFixed(1)} / 5</div>
        <div>Action readiness: {point.actionReadiness.toFixed(1)} / 5</div>
        <div>Respondents: {point.respondents}</div>
      </div>
    </div>
  );
}

export default function VisionToActionGapCard({
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
        Vision-to-action gap
      </h3>
      <p className="mt-1 text-sm text-[#7a7a7a]">
        Compare vision readiness against next-quarter action readiness. This shows where people can see the opportunity but do not yet know how to act on it.
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

      <div className="mt-6 h-[340px]">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 12, left: 0, bottom: 18 }}>
            <CartesianGrid stroke="#ececec" strokeDasharray="3 3" />
            <XAxis
              type="number"
              dataKey="visionReadiness"
              domain={[1, 5]}
              ticks={[1, 2, 3, 4, 5]}
              tick={{ fontSize: 12, fill: '#737373' }}
              axisLine={false}
              tickLine={false}
              label={{
                value: 'Vision readiness',
                position: 'bottom',
                offset: 6,
                fill: '#525252',
                fontSize: 12,
                fontWeight: 600,
              }}
            />
            <YAxis
              type="number"
              dataKey="actionReadiness"
              domain={[1, 5]}
              ticks={[1, 2, 3, 4, 5]}
              tick={{ fontSize: 12, fill: '#737373' }}
              axisLine={false}
              tickLine={false}
              label={{
                value: 'Action readiness',
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
