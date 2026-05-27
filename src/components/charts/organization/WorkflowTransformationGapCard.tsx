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
  hoursSaved: number;
  transformation: number;
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
        <div>Estimated hours saved: {point.hoursSaved.toFixed(1)}h / week</div>
        <div>Workflow transformation: {point.transformation.toFixed(1)} / 5</div>
        <div>Respondents: {point.respondents}</div>
      </div>
    </div>
  );
}

export default function WorkflowTransformationGapCard({
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
        Workflow transformation gap
      </h3>
      <p className="mt-1 text-sm text-[#7a7a7a]">
        Compare hours saved per week against workflow transformation depth. This helps separate “AI gives small efficiency wins” from “AI is actually changing how work gets done.”
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
              dataKey="hoursSaved"
              domain={[0, 6]}
              ticks={[0, 1, 3, 5, 6]}
              tickFormatter={(value) => `${value}h`}
              tick={{ fontSize: 12, fill: '#737373' }}
              axisLine={false}
              tickLine={false}
              label={{
                value: 'Estimated hours saved / week',
                position: 'bottom',
                offset: 6,
                fill: '#525252',
                fontSize: 12,
                fontWeight: 600,
              }}
            />
            <YAxis
              type="number"
              dataKey="transformation"
              domain={[1, 5]}
              ticks={[1, 2, 3, 4, 5]}
              tick={{ fontSize: 12, fill: '#737373' }}
              axisLine={false}
              tickLine={false}
              label={{
                value: 'Workflow transformation',
                angle: -90,
                position: 'insideLeft',
                fill: '#525252',
                fontSize: 12,
                fontWeight: 600,
              }}
            />
            <ZAxis type="number" dataKey="respondents" range={[160, 1100]} />
            <Tooltip isAnimationActive={false} content={<TooltipContent scope={scope} />} />
            <ReferenceLine x={2.5} stroke="#d4d4d8" strokeDasharray="4 4" />
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
