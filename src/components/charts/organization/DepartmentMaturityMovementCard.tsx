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

type Row = {
  name: string;
  respondents: number;
  previous: number;
  current: number;
  delta: number;
};

function DepartmentMaturityTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ dataKey?: string; value?: number; payload?: Row }>;
}) {
  const point = payload?.[0]?.payload;

  if (!active || !point) {
    return null;
  }

  return (
    <div className="rounded-md bg-[#242424] px-4 py-3 text-sm text-white shadow-lg">
      <SensitiveTooltipLabel
        prefix="Department"
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

export default function DepartmentMaturityMovementCard({
  rows,
  waveLabel,
}: {
  rows: Row[];
  waveLabel: string;
}) {
  return (
    <section className="rounded-2xl border border-[#eaeaea] bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold tracking-tight text-[#242424]">
        Department maturity movement
      </h3>
      <p className="mt-1 text-sm text-[#7a7a7a]">
        Show each department’s average maturity now vs previous wave. This is the cleanest progress chart because it answers who is actually improving.
      </p>
      <div className="mt-2 text-xs text-[#8b8b8b]">Current snapshot through {waveLabel}</div>

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
              width={150}
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
              content={<DepartmentMaturityTooltip />}
            />
            <Legend iconType="circle" />
            <Bar dataKey="previous" name="Previous wave" fill="#cbd5e1" radius={[0, 8, 8, 0]} />
            <Bar dataKey="current" name="Current" fill="#2563eb" radius={[0, 8, 8, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
