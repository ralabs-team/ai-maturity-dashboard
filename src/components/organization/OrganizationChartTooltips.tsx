import { formatPercentageLabel } from '../charts/formatters';

export function CohortStackedTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{
    color?: string;
    dataKey?: string;
    name?: string;
    value?: number;
    payload?: { cohort?: string; respondents?: number };
  }>;
  label?: string;
}) {
  const row = payload?.[0]?.payload;

  if (!active || !row || !payload || payload.length === 0) {
    return null;
  }

  return (
    <div className="rounded-md bg-[#242424] px-4 py-3 text-sm text-white shadow-lg">
      <div className="mb-2 font-semibold text-white">{label ?? row.cohort ?? 'Unknown cohort'}</div>
      <div className="mb-2 text-white/80">{row.respondents ?? 0} respondents</div>
      <div className="space-y-1.5">
        {payload
          .filter((entry) => Number(entry.value) > 0)
          .sort((left, right) => Number(right.value ?? 0) - Number(left.value ?? 0))
          .map((entry) => (
            <div key={String(entry.dataKey)} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                <span>{entry.name}</span>
              </div>
              <span>{formatPercentageLabel(Number(entry.value ?? 0))}</span>
            </div>
          ))}
      </div>
    </div>
  );
}

export function ImpactComparisonTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{
    color?: string;
    dataKey?: string;
    name?: string;
    value?: number;
    payload?: {
      label: string;
      businessShare: number;
      deliveryShare: number;
      businessCount: number;
      deliveryCount: number;
    };
  }>;
}) {
  const point = payload?.[0]?.payload;

  if (!active || !point || !payload || payload.length === 0) {
    return null;
  }

  return (
    <div className="rounded-md bg-[#242424] px-4 py-3 text-sm text-white shadow-lg">
      <div className="mb-2 font-semibold text-white">{point.label}</div>
      <div className="space-y-1.5">
        {payload.map((entry) => {
          const share =
            entry.dataKey === 'businessShare' ? point.businessShare : point.deliveryShare;
          const count =
            entry.dataKey === 'businessShare' ? point.businessCount : point.deliveryCount;

          return (
            <div key={String(entry.dataKey)} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                <span>{entry.name}</span>
              </div>
              <span>
                {share.toFixed(1)}% ({count})
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
