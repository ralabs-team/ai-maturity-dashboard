export function formatPercentageLabel(value: number): string {
  const rounded = Math.round(Math.max(0, Math.min(100, value)) * 10) / 10;

  return Number.isInteger(rounded) ? `${rounded}%` : `${rounded.toFixed(1)}%`;
}
