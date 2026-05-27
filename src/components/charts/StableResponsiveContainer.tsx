import * as React from 'react';
import { ResponsiveContainer as RechartsResponsiveContainer } from 'recharts';
import { useSidebar } from '../ui/sidebar';
import { cn } from '../../lib/utils';

type StableResponsiveContainerProps = {
  children: React.ReactNode;
  width?: number | string;
  height?: number | string;
  minWidth?: number | string;
  minHeight?: number | string;
  className?: string;
};

type Size = {
  width: number;
  height: number;
};

function sizeEquals(left: Size | null, right: Size): boolean {
  return left !== null && left.width === right.width && left.height === right.height;
}

function toStyleDimension(value: number | string | undefined, fallback: string) {
  if (typeof value === 'number') {
    return `${value}px`;
  }

  return value ?? fallback;
}

export default function StableResponsiveContainer({
  children,
  width = '100%',
  height = '100%',
  minWidth = 0,
  minHeight,
  className,
}: StableResponsiveContainerProps) {
  const { isDesktopTransitioning } = useSidebar();
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const animationFrameRef = React.useRef<number | null>(null);
  const pendingSizeRef = React.useRef<Size | null>(null);
  const [renderSize, setRenderSize] = React.useState<Size | null>(null);

  const commitSize = React.useCallback((nextSize: Size) => {
    if (nextSize.width <= 0 || nextSize.height <= 0) {
      return;
    }

    setRenderSize((currentSize) => (sizeEquals(currentSize, nextSize) ? currentSize : nextSize));
  }, []);

  React.useLayoutEffect(() => {
    const node = containerRef.current;

    if (!node) {
      return;
    }

    const measure = () => {
      const rect = node.getBoundingClientRect();
      const nextSize = {
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      };

      if (isDesktopTransitioning) {
        pendingSizeRef.current = nextSize;
        return;
      }

      pendingSizeRef.current = null;
      commitSize(nextSize);
    };

    measure();

    const observer = new ResizeObserver(() => {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }

      animationFrameRef.current = window.requestAnimationFrame(() => {
        animationFrameRef.current = null;
        measure();
      });
    });

    observer.observe(node);

    return () => {
      observer.disconnect();
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [commitSize, isDesktopTransitioning]);

  React.useEffect(() => {
    if (isDesktopTransitioning || pendingSizeRef.current === null) {
      return;
    }

    commitSize(pendingSizeRef.current);
    pendingSizeRef.current = null;
  }, [commitSize, isDesktopTransitioning]);

  return (
    <div
      ref={containerRef}
      className={cn('h-full w-full min-w-0 overflow-hidden', className)}
      style={{
        width: toStyleDimension(width, '100%'),
        height: toStyleDimension(height, '100%'),
        minWidth: toStyleDimension(minWidth, '0px'),
        minHeight: minHeight === undefined ? undefined : toStyleDimension(minHeight, '0px'),
      }}
    >
      {renderSize ? (
        <RechartsResponsiveContainer width={renderSize.width} height={renderSize.height}>
          {children}
        </RechartsResponsiveContainer>
      ) : null}
    </div>
  );
}
