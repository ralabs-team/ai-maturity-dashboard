import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  ComposedChart,
  Legend,
} from './recharts';
import type { TechDimension, MaturityLevel } from '../../data/types';
import { MAX_DIMENSION_SCORE, TECH_DIMENSIONS, LEVEL_LABELS, scoreToLevel } from '../../data/types';

interface Props {
  personScores: Record<TechDimension, number>;
  benchmarkScores: Record<TechDimension, number>;
  personName: string;
  personColor: string;
  benchmarkLabel?: string;
}

const yTicks = Array.from({ length: MAX_DIMENSION_SCORE }, (_, idx) => idx + 1);
function formatYTick(value: number) {
  return value.toString();
}

export default function DimensionComparison({
  personScores,
  benchmarkScores,
  personName,
  personColor,
  benchmarkLabel = 'Benchmark',
}: Props) {
  const data = TECH_DIMENSIONS.map((dim) => {
    const person = personScores[dim];
    const benchmark = benchmarkScores[dim];
    return {
      dimension: dim,
      person,
      benchmark,
      aheadFill: person > benchmark ? person : benchmark,
      behindFill: person < benchmark ? person : benchmark,
      aheadBase: person > benchmark ? benchmark : person,
      behindBase: person < benchmark ? benchmark : person,
    };
  });

  return (
    <ResponsiveContainer width="100%" height={320}>
      <ComposedChart data={data} margin={{ top: 20, right: 80, bottom: 20, left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="dimension"
          tick={{ fontSize: 14, fontWeight: 600, fill: '#475569' }}
          axisLine={false}
          tickLine={false}
          dy={8}
          padding={{ left: 40, right: 20 }}
        />
        <YAxis
          domain={[1, MAX_DIMENSION_SCORE]}
          ticks={yTicks}
          tickFormatter={formatYTick}
          tick={{ fontSize: 13, fill: '#64748b' }}
          axisLine={false}
          tickLine={false}
          width={110}
        />
        <Tooltip
          isAnimationActive={false}
          contentStyle={{
            backgroundColor: '#ffffff',
            border: '1px solid #eaeaea',
            borderRadius: '8px',
            padding: '8px 12px',
            fontSize: '12px',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
          }}
          labelStyle={{ color: '#242424', fontWeight: 600, marginBottom: 4 }}
          formatter={(value, name) => {
            const num = Number(value);
            const lvl = scoreToLevel(num) as MaturityLevel;
            return [`${num.toFixed(1)} / ${MAX_DIMENSION_SCORE} — ${LEVEL_LABELS[lvl]}`, name];
          }}
          filterNull
        />

        <Legend
          verticalAlign="bottom"
          align="center"
          iconType="circle"
          wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }}
        />

        <Line
          dataKey="benchmark"
          name={benchmarkLabel}
          stroke="#94a3b8"
          strokeWidth={2}
          strokeDasharray="8 4"
          dot={{ r: 7, fill: '#94a3b8', fillOpacity: 1, strokeWidth: 0 }}
          type="monotone"
          isAnimationActive={false}
        />
        <Line
          dataKey="person"
          name={personName}
          stroke={personColor}
          strokeWidth={3}
          type="monotone"
          dot={
            ((props: { cx?: number; cy?: number }) => {
              const { cx = 0, cy = 0 } = props;
              const size = 14;
              return (
                <rect
                  x={cx - size / 2}
                  y={cy - size / 2}
                  width={size}
                  height={size}
                  fill={personColor}
                />
              );
            }) as unknown as never
          }
          isAnimationActive={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
