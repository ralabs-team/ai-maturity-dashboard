import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from '../recharts';

type Row = {
  wave: string;
  sharedPractices: number;
  knowledgeArtifacts: number;
  practiceResilience: number;
};

const SERIES = [
  { key: 'sharedPractices', label: 'Shared practices', color: '#2563eb' },
  { key: 'knowledgeArtifacts', label: 'Knowledge artifacts', color: '#7c3aed' },
  { key: 'practiceResilience', label: 'Practice resilience', color: '#0f766e' },
] as const;

export default function SharedPracticesGrowthCard({ rows }: { rows: Row[] }) {
  return (
    <section className="rounded-2xl border border-[#eaeaea] bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold tracking-tight text-[#242424]">
        Shared practices growth
      </h3>
      <p className="mt-1 text-sm text-[#7a7a7a]">
        Track growth in shared AI practices on teams, knowledge artifacts created, and practice resilience. This shows whether AI capability is becoming more reusable and less individual-dependent.
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
                name={series.label}
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
