import SensitiveText from './SensitiveText';
import { useSensitiveData } from '../privacy/SensitiveDataContext';

type AxisTickPayload = {
  value?: string | number;
};

type SensitiveAxisTickProps = {
  x?: number;
  y?: number;
  payload?: AxisTickPayload;
  fill?: string;
  fontSize?: number;
  textAnchor?: 'start' | 'middle' | 'end';
  angle?: number;
  dx?: number;
  dy?: number;
};

export function SensitiveAxisTick({
  x = 0,
  y = 0,
  payload,
  fill = '#525252',
  fontSize = 12,
  textAnchor = 'end',
  angle = 0,
  dx = 0,
  dy = 0,
}: SensitiveAxisTickProps) {
  const { isSensitiveDataHidden } = useSensitiveData();
  const value = String(payload?.value ?? '');

  return (
    <g transform={`translate(${x},${y})`}>
      <text
        dx={dx}
        dy={dy}
        fill={fill}
        fontSize={fontSize}
        textAnchor={textAnchor}
        transform={angle ? `rotate(${angle})` : undefined}
        style={isSensitiveDataHidden ? { filter: 'blur(4px)' } : undefined}
      >
        {value}
      </text>
    </g>
  );
}

export function SensitiveTooltipLabel({
  prefix,
  value,
  className,
}: {
  prefix?: string;
  value: string;
  className?: string;
}) {
  const { isSensitiveDataHidden } = useSensitiveData();

  return (
    <div className={className}>
      {prefix ? `${prefix}: ` : null}
      <SensitiveText as="span" hidden={isSensitiveDataHidden}>
        {value}
      </SensitiveText>
    </div>
  );
}
