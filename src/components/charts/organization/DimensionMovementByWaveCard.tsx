import {
  CartesianGrid,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  LineChart,
} from '../recharts';

type Row = {
  wave: string;
  Usage: number;
  Skills: number;
  Impact: number;
  Culture: number;
  Vision: number;
};

const SERIES = [
  { key: 'Usage', color: '#2563eb' },
  { key: 'Skills', color: '#0f766e' },
  { key: 'Impact', color: '#7c3aed' },
  { key: 'Culture', color: '#f59e0b' },
  { key: 'Vision', color: '#dc2626' },
] as const;

export default function DimensionMovementByWaveCard({ rows }: { rows: Row[] }) {
  return (
    <section className="rounded-2xl border border-[#eaeaea] bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold tracking-tight text-[#242424]">
        Dimension movement by wave
      </h3>
      <p className="mt-1 text-sm text-[#7a7a7a]">
        Track Usage, Skills, Impact, Culture, and Vision over time. This helps show whether progress is broad-based or concentrated in one dimension.
      </p>

      <div className="mt-6 h-[360px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={{ top: 10, right: 18, left: 0, bottom: 6 }}>
            <CartesianGrid stroke="#ececec" strokeDasharray="3 3" />
            <XAxis dataKey="wave" tick={{ fontSize: 12, fill: '#737373' }} axisLine={false} tickLine={false} />
            <YAxis
              domain={[1, 5]}
              ticks={[1, 2, 3, 4, 5]}
              tick={{ fontSize: 12, fill: '#737373' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              isAnimationActive={false}
              formatter={(value) =>
                typeof value === 'number' ? `${value.toFixed(1)} / 5` : String(value ?? '-')
              }
            />
            <Legend iconType="circle" />
            {SERIES.map((series) => (
              <Line
                key={series.key}
                type="monotone"
                dataKey={series.key}
                stroke={series.color}
                strokeWidth={2.5}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
