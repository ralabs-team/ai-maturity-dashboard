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
        hidden && 'blur-[5px]',
      )}
    >
      {children}
    </Component>
  );
}
