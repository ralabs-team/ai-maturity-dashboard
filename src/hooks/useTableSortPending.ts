import { useCallback, useEffect, useRef, useState } from 'react';

export function useTableSortPending() {
  const [isTableSortPending, setIsTableSortPending] = useState(false);
  const clearTimeoutRef = useRef<number | null>(null);
  const pendingStartRef = useRef<number>(0);
  const minimumPendingMs = 160;

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    if (isTableSortPending) {
      document.body.dataset.tableSortPending = 'true';
      return () => {
        delete document.body.dataset.tableSortPending;
      };
    }

    delete document.body.dataset.tableSortPending;
  }, [isTableSortPending]);

  useEffect(
    () => () => {
      if (typeof window !== 'undefined') {
        if (clearTimeoutRef.current !== null) {
          window.clearTimeout(clearTimeoutRef.current);
        }
      }

      if (typeof document !== 'undefined') {
        delete document.body.dataset.tableSortPending;
      }
    },
    [],
  );

  const queueTableSort = useCallback((commitSort: () => void) => {
    pendingStartRef.current =
      typeof performance !== 'undefined' ? performance.now() : Date.now();

    setIsTableSortPending(true);

    if (clearTimeoutRef.current !== null) {
      if (typeof window !== 'undefined') {
        window.clearTimeout(clearTimeoutRef.current);
      }
      clearTimeoutRef.current = null;
    }

    commitSort();
  }, []);

  const clearTableSortPending = useCallback(() => {
    if (typeof window === 'undefined') {
      setIsTableSortPending(false);
      return;
    }

    if (clearTimeoutRef.current !== null) {
      window.clearTimeout(clearTimeoutRef.current);
      clearTimeoutRef.current = null;
    }

    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const elapsedMs = now - pendingStartRef.current;
    const remainingMs = Math.max(0, minimumPendingMs - elapsedMs);

    if (remainingMs === 0) {
      setIsTableSortPending(false);
      return;
    }

    clearTimeoutRef.current = window.setTimeout(() => {
      clearTimeoutRef.current = null;
      setIsTableSortPending(false);
    }, remainingMs);
  }, []);

  return {
    isTableSortPending,
    queueTableSort,
    clearTableSortPending,
  };
}
