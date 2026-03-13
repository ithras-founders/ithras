import { useState, useCallback, useRef } from 'react';

/**
 * Generic undo/redo hook for template editing
 * Maintains history stack with configurable limit
 */
export const useUndoRedo = (initialState, maxHistory = 50) => {
  const [state, setState] = useState(initialState);
  const [history, setHistory] = useState([initialState]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const isUndoingRef = useRef(false);

  const saveState = useCallback((newState) => {
    if (isUndoingRef.current) {
      isUndoingRef.current = false;
      return;
    }

    setHistory((prevHistory) => {
      const newHistory = prevHistory.slice(0, historyIndex + 1);
      newHistory.push(newState);
      
      // Limit history size
      if (newHistory.length > maxHistory) {
        newHistory.shift();
        return newHistory;
      }
      
      return newHistory;
    });
    
    setHistoryIndex((prevIndex) => {
      const newIndex = prevIndex + 1;
      return newIndex >= maxHistory ? maxHistory - 1 : newIndex;
    });
    
    setState(newState);
  }, [historyIndex, maxHistory]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      isUndoingRef.current = true;
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setState(history[newIndex]);
    }
  }, [historyIndex, history]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      isUndoingRef.current = true;
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setState(history[newIndex]);
    }
  }, [historyIndex, history]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const clearHistory = useCallback(() => {
    setHistory([state]);
    setHistoryIndex(0);
  }, [state]);

  const reset = useCallback((newState) => {
    setState(newState);
    setHistory([newState]);
    setHistoryIndex(0);
  }, []);

  return {
    state,
    setState: saveState,
    undo,
    redo,
    canUndo,
    canRedo,
    clearHistory,
    reset,
    historyLength: history.length,
  };
};
