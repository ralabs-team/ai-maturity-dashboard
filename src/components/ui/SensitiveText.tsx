import type { ElementType, ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface SensitiveTextProps {
  as?: ElementType;
  children: ReactNode;
  className?: string;
  hidden?: boolean;
  title?: string;
}

export default function SensitiveText({
  as: Component = 'span',
  children,
  className,
  hidden = false,
  title,
}: SensitiveTextProps) {
  return (
    <Component
      title={hidden ? undefined : title}
      className={cn(
        className,
        hidden &&
          'select-none rounded-sm bg-[#d9d9d9] text-transparent opacity-100 transition-[background-color,color] duration-150 ease-out',
      )}
      style={
        hidden
          ? {
              color: 'transparent',
              WebkitTextFillColor: 'transparent',
            }
          : undefined
      }
    >
      {children}
    </Component>
  );
}
