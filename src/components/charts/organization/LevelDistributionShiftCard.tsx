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
  'L1 Observer': number;
  'L2 Explorer': number;
  'L3 Practitioner': number;
  'L4 Orchestrator': number;
  'L5 Native': number;
};

const SERIES = [
  { key: 'L1 Observer', color: '#e5e7eb' },
  { key: 'L2 Explorer', color: '#cbd5e1' },
  { key: 'L3 Practitioner', color: '#94a3b8' },
  { key: 'L4 Orchestrator', color: '#64748b' },
  { key: 'L5 Native', color: '#334155' },
] as const;

export default function LevelDistributionShiftCard({ rows }: { rows: Row[] }) {
  return (
    <section className="rounded-2xl border border-[#eaeaea] bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold tracking-tight text-[#242424]">
        Level distribution shift
      </h3>
      <p className="mt-1 text-sm text-[#7a7a7a]">
        Show how the org moved across Observer, Explorer, Practitioner, Orchestrator, and Native. This makes progress tangible for leadership.
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
              trigger="hover"
              cursor={{ fill: 'rgba(37, 99, 235, 0.06)' }}
              formatter={(value) =>
                typeof value === 'number' ? `${value.toFixed(1)}%` : String(value ?? '-')
              }
            />
            {SERIES.map((series) => (
              <Bar key={series.key} dataKey={series.key} stackId="level-shift" fill={series.color} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
