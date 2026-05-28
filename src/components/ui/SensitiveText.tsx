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
        hidden && 'select-none blur-[8px] opacity-50 transition-[filter,opacity] duration-150 ease-out',
      )}
    >
      {children}
    </Component>
  );
}
