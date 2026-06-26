import { BarChart, Bar, ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip } from '../recharts';
import ChartFeedback from '../../analytics/ChartFeedback';
import { SensitiveAxisTick, SensitiveTooltipLabel } from '../../ui/SensitiveChartText';

type Row = {
  name: string;
  respondents: number;
  self: number;
};

function SkillsGapTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ payload?: Row }>;
  label?: string;
}) {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;

  return (
    <div className="rounded-md bg-[#242424] px-4 py-3 text-sm text-white shadow-lg">
      <SensitiveTooltipLabel
        prefix="Department"
        value={String(label ?? point.name)}
        className="mb-2 font-semibold text-white"
      />
      <div className="space-y-1">
        <div>Self-rated skills: {point.self.toFixed(1)} / 5</div>
        <div>Respondents: {point.respondents}</div>
      </div>
    </div>
  );
}

export default function SkillsConfidenceGapCard({
  departmentRows,
}: {
  departmentRows: Row[];
}) {
  const rows = departmentRows;

  return (
    <section className="group relative rounded-2xl border border-[#eaeaea] bg-white p-6 shadow-sm">
      <ChartFeedback chartTitle="Skills confidence vs verification gap" page="organization" />
      <h3 className="text-lg font-semibold tracking-tight text-[#242424]">
        Skills confidence vs verification gap
      </h3>
      <p className="mt-1 text-sm text-[#7a7a7a]">
        Show how confident each department feels about its AI skills, using self-rated responses only.
      </p>

      <div className="mt-6 h-[340px]">
        {rows.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} margin={{ top: 10, right: 12, left: 0, bottom: 24 }}>
              <CartesianGrid stroke="#ececec" vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                interval={0}
                angle={-45}
                textAnchor="end"
                height={92}
                tick={
                  <SensitiveAxisTick
                    fill="#737373"
                    fontSize={12}
                    textAnchor="end"
                    angle={-45}
                    dy={6}
                  />
                }
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[1, 5]}
                ticks={[1, 2, 3, 4, 5]}
                tick={{ fontSize: 12, fill: '#737373' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                isAnimationActive={false}
                cursor={{ fill: 'rgba(15, 118, 110, 0.06)' }}
                content={<SkillsGapTooltip />}
              />
              <Bar dataKey="self" name="Self-rated skills" fill="#14b8a6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-[#d4d4d8] bg-[#fafafa] px-6 text-center text-sm text-[#7a7a7a]">
            Department-level self-rated skill data is not available yet.
          </div>
        )}
      </div>
    </section>
  );
}
