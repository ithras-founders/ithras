/**
 * Optimistic mutation hook - instant UI feedback before server response.
 * Calls onOptimistic before mutation; onRollback + toast on error.
 */
import { useState, useCallback } from 'react';

export function useOptimisticMutation({
  mutationFn,
  onOptimistic,
  onRollback,
  onSuccess,
  onError,
}) {
  const [isPending, setIsPending] = useState(false);

  const mutate = useCallback(
    async (variables) => {
      let previousState = null;
      try {
        setIsPending(true);
        if (onOptimistic) {
          previousState = onOptimistic(variables);
        }
        const result = await mutationFn(variables);
        if (onSuccess) onSuccess(result);
        return result;
      } catch (err) {
        if (onRollback && previousState !== undefined) {
          onRollback(previousState);
        }
        if (onError) onError(err);
        throw err;
      } finally {
        setIsPending(false);
      }
    },
    [mutationFn, onOptimistic, onRollback, onSuccess, onError]
  );

  return { mutate, isPending };
}
