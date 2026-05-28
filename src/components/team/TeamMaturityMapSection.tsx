import {
  Cell,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  Tooltip as RechartsTooltip,
} from '../charts/recharts';
import { Tooltip as InfoTooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import TeamSectionHeader from './TeamSectionHeader';
import {
  LEVEL_SCORE_RANGES,
  type LevelDistributionItem,
  type TeamMapDimension,
  type TeamMapSeriesKey,
} from './teamViewShared';

type RadarDatum = {
  dimension: TeamMapDimension;
  selected: number;
  orgAverage: number;
};

type TeamMaturityMapSectionProps = {
  scopeLabel: string;
  scopeLabelLower: string;
  radarData: RadarDatum[];
  levelDistribution: LevelDistributionItem[];
  hiddenTeamMapSeries: TeamMapSeriesKey[];
  onToggleSeries: (seriesKey: TeamMapSeriesKey) => void;
  teamMapSeriesMeta: Record<TeamMapSeriesKey, { color: string; fill: string; label: string }>;
};

function LevelDistributionTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload?: LevelDistributionItem }>;
}) {
  const slice = payload?.[0]?.payload;

  if (!active || !slice) {
    return null;
  }

  return (
    <div className="rounded-md bg-[#242424] px-3 py-2 text-xs text-white shadow-lg">
      <p className="font-semibold">{slice.level}</p>
      <p className="mt-1">Share: {slice.share}%</p>
      <p>Replies: {slice.count ?? 0}</p>
    </div>
  );
}

export default function TeamMaturityMapSection({
  scopeLabel,
  scopeLabelLower,
  radarData,
  levelDistribution,
  hiddenTeamMapSeries,
  onToggleSeries,
  teamMapSeriesMeta,
}: TeamMaturityMapSectionProps) {
  const visibleTeamMapSeries = (Object.keys(teamMapSeriesMeta) as TeamMapSeriesKey[]).filter(
    (key) => !hiddenTeamMapSeries.includes(key),
  );

  return (
    <section id="team-maturity-map" className="mt-8 scroll-mt-24">
      <TeamSectionHeader
        title={`${scopeLabel} maturity map`}
        subtitle={`A dimension-level view of the selected ${scopeLabelLower} against the organization average.`}
      />

      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-2xl border border-[#eaeaea] bg-white p-6 shadow-sm">
          <div className="flex flex-wrap gap-2">
            {(Object.keys(teamMapSeriesMeta) as TeamMapSeriesKey[]).map((seriesKey) => {
              const series = teamMapSeriesMeta[seriesKey];
              const isHidden = hiddenTeamMapSeries.includes(seriesKey);

              return (
                <InfoTooltip key={seriesKey}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => onToggleSeries(seriesKey)}
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                        isHidden
                          ? 'border-[#e5e7eb] bg-white text-[#9ca3af]'
                          : 'border-[#e5e7eb] bg-[#fafafa] text-[#374151] hover:bg-[#f5f5f5]'
                      }`}
                      aria-pressed={!isHidden}
                    >
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: series.color, opacity: isHidden ? 0.35 : 1 }}
                      />
                      <span className={isHidden ? 'line-through' : ''}>{series.label}</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" sideOffset={8} className="px-3 py-2 text-[11px] leading-relaxed">
                    <div className="font-medium text-white">{series.label}</div>
                    <div className="mt-1 text-white/80">
                      Click to {isHidden ? 'show' : 'hide'} this comparison series.
                    </div>
                  </TooltipContent>
                </InfoTooltip>
              );
            })}
          </div>

          <div className="mt-6 h-[420px]">
            {visibleTeamMapSeries.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} outerRadius="72%">
                  <PolarGrid stroke="rgb(229,229,229)" />
                  <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 12, fill: '#737373' }} />
                  <PolarRadiusAxis
                    domain={[1, 5]}
                    ticks={[1, 2, 3, 4, 5]}
                    tick={{ fontSize: 9, fill: '#b0b0b0' }}
                    axisLine={false}
                  />
                  <RechartsTooltip
                    isAnimationActive={false}
                    cursor={{ stroke: '#14b8a6', strokeWidth: 1, strokeDasharray: '3 3' }}
                    contentStyle={{
                      backgroundColor: '#242424',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '6px 12px',
                      color: '#ffffff',
                      fontSize: '12px',
                    }}
                    labelStyle={{ color: '#ffffff', fontWeight: 600 }}
                    itemStyle={{ color: '#ffffff' }}
                    formatter={(value, name) => {
                      const num = Number(value);
                      const label =
                        typeof name === 'string' && name in teamMapSeriesMeta
                          ? teamMapSeriesMeta[name as TeamMapSeriesKey].label
                          : String(name);
                      return [`${num.toFixed(1)} / 5`, label];
                    }}
                  />
                  {!hiddenTeamMapSeries.includes('orgAverage') ? (
                    <Radar
                      name="orgAverage"
                      dataKey="orgAverage"
                      stroke={teamMapSeriesMeta.orgAverage.color}
                      fill={teamMapSeriesMeta.orgAverage.fill}
                      fillOpacity={0.04}
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      isAnimationActive={false}
                    />
                  ) : null}
                  {!hiddenTeamMapSeries.includes('selected') ? (
                    <Radar
                      name="selected"
                      dataKey="selected"
                      stroke={teamMapSeriesMeta.selected.color}
                      fill={teamMapSeriesMeta.selected.fill}
                      fillOpacity={0.12}
                      strokeWidth={2}
                      isAnimationActive={false}
                      dot={
                        ((props: { cx?: number; cy?: number }) => {
                          const { cx = 0, cy = 0 } = props;
                          const size = 10;
                          return (
                            <rect
                              x={cx - size / 2}
                              y={cy - size / 2}
                              width={size}
                              height={size}
                              fill={teamMapSeriesMeta.selected.color}
                            />
                          );
                        }) as unknown as never
                      }
                      label={
                        ((props: {
                          x?: number;
                          y?: number;
                          value?: number;
                          viewBox?: { cx?: number; cy?: number };
                        }) => {
                          const { x = 0, y = 0, value = 0, viewBox } = props;
                          const cx = viewBox?.cx ?? 0;
                          const cy = viewBox?.cy ?? 0;
                          const dx = x - cx;
                          const dy = y - cy;
                          const length = Math.sqrt(dx * dx + dy * dy) || 1;
                          const offset = 16;
                          const lx = x + (dx / length) * offset;
                          const ly = y + (dy / length) * offset;
                          let textAnchor: 'start' | 'middle' | 'end' = 'middle';
                          if (dx > 8) textAnchor = 'start';
                          else if (dx < -8) textAnchor = 'end';

                          let baseline: 'auto' | 'middle' | 'hanging' = 'middle';
                          if (dy > 10) baseline = 'hanging';
                          else if (dy < -10) baseline = 'auto';

                          return (
                            <text
                              x={lx}
                              y={ly}
                              fill={teamMapSeriesMeta.selected.color}
                              fontSize={13}
                              fontWeight={600}
                              textAnchor={textAnchor}
                              dominantBaseline={baseline}
                            >
                              {Number(value).toFixed(1)}
                            </text>
                          );
                        }) as unknown as never
                      }
                    />
                  ) : null}
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-[#d4d4d8] bg-[#fafafa] px-6 text-center text-sm text-[#7a7a7a]">
                All comparison series are hidden. Click a chip above to show them again.
              </div>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-[#eaeaea] bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold tracking-tight text-[#242424]">
            Level distribution inside selected {scopeLabelLower}
          </h3>
          <p className="mt-1 text-sm text-[#7a7a7a]">
            Real distribution based on current selected {scopeLabelLower} respondents across Levels 1–5.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2 px-4 pb-4">
            {levelDistribution.map((entry) => (
              <InfoTooltip key={entry.level}>
                <TooltipTrigger asChild>
                  <span className="inline-flex items-center gap-2 rounded-full border border-[#e5e7eb] bg-[#fafafa] px-3 py-1.5 text-xs font-medium text-[#374151]">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: entry.fill }}
                    />
                    <span>{entry.level}</span>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={8} className="max-w-[220px] px-3 py-2 text-[11px] leading-relaxed">
                  <div className="font-medium text-white">{entry.level}</div>
                  <div className="mt-1 text-white/80">
                    Respondents: {entry.count ?? 0} ({entry.share}% of current {scopeLabelLower})
                  </div>
                  <div className="mt-1 text-white/80">
                    Score: {LEVEL_SCORE_RANGES[entry.level]}
                  </div>
                </TooltipContent>
              </InfoTooltip>
            ))}
          </div>
          <div className="mt-6 h-[420px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={levelDistribution}
                  dataKey="share"
                  nameKey="level"
                  isAnimationActive={false}
                  cx="50%"
                  cy="56%"
                  innerRadius={68}
                  outerRadius={132}
                  paddingAngle={2}
                  stroke="white"
                  strokeWidth={2}
                  label={({ percent }) => `${Math.round((percent ?? 0) * 100)}%`}
                  labelLine={false}
                >
                  {levelDistribution.map((item) => (
                    <Cell key={item.level} fill={item.fill} />
                  ))}
                </Pie>
                <Tooltip isAnimationActive={false} content={<LevelDistributionTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </section>
  );
}
