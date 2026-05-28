import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from '../recharts';

type Row = {
  wave: string;
  '0 hours': number;
  'Less than 1 hour': number;
  '1–3 hours': number;
  '3–5 hours': number;
  'More than 5 hours': number;
};

const SERIES = [
  { key: '0 hours', color: '#e5e7eb' },
  { key: 'Less than 1 hour', color: '#cbd5e1' },
  { key: '1–3 hours', color: '#93c5fd' },
  { key: '3–5 hours', color: '#2563eb' },
  { key: 'More than 5 hours', color: '#0f766e' },
] as const;

export default function HoursSavedMomentumCard({ rows }: { rows: Row[] }) {
  return (
    <section className="rounded-2xl border border-[#eaeaea] bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold tracking-tight text-[#242424]">
        Hours saved momentum
      </h3>
      <p className="mt-1 text-sm text-[#7a7a7a]">
        Compare hours saved per week distribution over time. This gives a practical value view that complements maturity movement.
      </p>

      <div className="mt-6 h-[360px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 10, right: 12, left: 0, bottom: 6 }}>
            <CartesianGrid stroke="#ececec" vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="wave" tick={{ fontSize: 12, fill: '#737373' }} axisLine={false} tickLine={false} />
            <YAxis
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
              tick={{ fontSize: 12, fill: '#737373' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              isAnimationActive={false}
              formatter={(value) =>
                typeof value === 'number' ? `${value.toFixed(1)}%` : String(value ?? '-')
              }
            />
            {SERIES.map((series) => (
              <Bar key={series.key} dataKey={series.key} stackId="hours" fill={series.color} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
