import { useState, useEffect } from 'react';

/**
 * useDebounce Hook
 *
 * Debounces a value by delaying its update until after a specified delay.
 * Useful for optimizing search inputs and reducing unnecessary re-renders
 * or expensive operations (like Firestore queries).
 *
 * @param {any} value - The value to debounce
 * @param {number} delay - Delay in milliseconds (default: 300ms)
 * @returns {any} The debounced value
 *
 * @example
 * const [search, setSearch] = useState('');
 * const debouncedSearch = useDebounce(search, 500);
 *
 * useEffect(() => {
 *   // This will only run 500ms after user stops typing
 *   fetchResults(debouncedSearch);
 * }, [debouncedSearch]);
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Set up a timer to update the debounced value after the delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clean up the timer if value changes before delay completes
    // This ensures we only update after user stops typing/changing value
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;
