import { useState, useEffect, useCallback } from 'react';
import { pathToView, viewToPath } from '../modules/shared/navigation.js';

/**
 * Manages view state synchronized with browser history.
 * Returns { view, setView, navigate }.
 */
export function useViewRouter() {
  const getInitialView = () => {
    if (typeof window === 'undefined') return 'dashboard';
    return pathToView(window.location.pathname) || 'dashboard';
  };

  const [view, setView] = useState(getInitialView);

  const navigate = useCallback((newView) => {
    const path = viewToPath(newView);
    if (window.location.pathname !== path) {
      window.history.pushState(null, '', path);
    }
    if (newView && newView.startsWith('hr-')) {
      try {
        sessionStorage.setItem('ithras_hr_view', newView);
      } catch (_) { /* sessionStorage may be unavailable */ }
    }
    setView(newView);
  }, []);

  useEffect(() => {
    const onPopState = () => {
      const newView = pathToView(window.location.pathname) || 'dashboard';
      if (!pathToView(window.location.pathname)) {
        window.history.replaceState(null, '', viewToPath(newView));
      }
      setView(newView);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  return { view, setView, navigate };
}
