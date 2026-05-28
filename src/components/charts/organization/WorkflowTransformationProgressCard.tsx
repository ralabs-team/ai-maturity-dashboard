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
  'Same tasks faster': number;
  'Tweaked a few tasks': number;
  'One workflow meaningfully changed': number;
  'Redesigned / eliminated a process': number;
  'Introduced a new AI-enabled process': number;
};

const SERIES = [
  { key: 'Same tasks faster', color: '#e5e7eb' },
  { key: 'Tweaked a few tasks', color: '#cbd5e1' },
  { key: 'One workflow meaningfully changed', color: '#93c5fd' },
  { key: 'Redesigned / eliminated a process', color: '#2563eb' },
  { key: 'Introduced a new AI-enabled process', color: '#0f766e' },
] as const;

export default function WorkflowTransformationProgressCard({ rows }: { rows: Row[] }) {
  return (
    <section className="rounded-2xl border border-[#eaeaea] bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold tracking-tight text-[#242424]">
        Workflow transformation progress
      </h3>
      <p className="mt-1 text-sm text-[#7a7a7a]">
        Track movement from same tasks faster toward meaningfully changed workflow and new AI-enabled process. This is stronger than just showing more usage.
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
              <Bar key={series.key} dataKey={series.key} stackId="workflow-progress" fill={series.color} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
