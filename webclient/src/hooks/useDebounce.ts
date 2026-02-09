import { useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for debouncing values with configurable delay
 * Best Practice 2025: Generic, reusable debounce hook with cleanup
 * 
 * @param callback - Function to execute after debounce delay
 * @param delay - Delay in milliseconds (default: 500ms)
 * @returns Debounced function
 * 
 * @example
 * ```tsx
 * const debouncedSearch = useDebounce((value: string) => {
 *   performSearch(value);
 * }, 300);
 * 
 * <input onChange={(e) => debouncedSearch(e.target.value)} />
 * ```
 */
export function useDebounce<T extends (...args: any[]) => void>(
  callback: T,
  delay: number = 500
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const debouncedFunction = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay]
  ) as T;

  return debouncedFunction;
}
