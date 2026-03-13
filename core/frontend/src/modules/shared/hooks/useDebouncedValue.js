/**
 * Debounced value hook - delays updates by `delay` ms.
 * Reduces API calls on search/filter input.
 */
import { useState, useEffect, useCallback } from 'react';

export function useDebouncedValue(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    if (value === debouncedValue) return;
    const id = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(id);
  }, [value, delay, debouncedValue]);

  return debouncedValue;
}
