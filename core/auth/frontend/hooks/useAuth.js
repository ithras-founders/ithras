import { useState, useEffect, useCallback } from 'react';
import { validateSession } from '/shared/services/index.js';

/**
 * Minimal auth: login, logout, session restore from localStorage.
 */
export function useAuth() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const onAuthExpired = () => {
      setUser(null);
      localStorage.removeItem('ithras_session');
      window.history.replaceState(null, '', '/');
    };
    window.addEventListener('ithras:auth:expired', onAuthExpired);
    return () => window.removeEventListener('ithras:auth:expired', onAuthExpired);
  }, []);

  useEffect(() => {
    const onRefreshSession = () => {
      validateSession()
        .then((res) => {
          const userData = res?.user;
          if (userData) setUser(userData);
        })
        .catch(() => {});
    };
    window.addEventListener('ithras:refresh-session', onRefreshSession);
    return () => window.removeEventListener('ithras:refresh-session', onRefreshSession);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('ithras_session');
    if (!saved) return;
    const parsed = (() => { try { return JSON.parse(saved); } catch { return null; } })();
    const authToken = parsed?.access_token || parsed?.session_id || parsed?.sessionId;
    if (!authToken) {
      localStorage.removeItem('ithras_session');
      return;
    }
    validateSession()
      .then((res) => {
        const userData = res?.user || parsed?.user;
        if (userData) setUser(userData);
      })
      .catch(() => {
        localStorage.removeItem('ithras_session');
      });
  }, []);

  const handleLogin = useCallback((loginResponse, options = {}) => {
    const userData = loginResponse?.user || loginResponse;
    const accessToken = loginResponse?.access_token;
    setUser(userData);
    localStorage.setItem('ithras_session', JSON.stringify({
      user: userData,
      access_token: accessToken,
    }));
    const redirectTo = options.redirectTo;
    const hardRedirect = options.hardRedirect === true;
    if (hardRedirect && redirectTo) {
      window.location.href = redirectTo;
      return;
    }
    window.history.replaceState(null, '', redirectTo != null ? redirectTo : '/');
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      const { apiRequest } = await import('/shared/services/apiBase.js');
      await apiRequest('/v1/auth/logout', { method: 'POST', quiet: true });
    } catch (_) {}
    setUser(null);
    localStorage.removeItem('ithras_session');
    window.history.replaceState(null, '', '/');
  }, []);

  return { user, handleLogin, handleLogout };
}
