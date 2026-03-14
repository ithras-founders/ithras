import { useState, useEffect, useCallback } from 'react';
import { switchProfile, validateSession } from '../modules/shared/services/api.js';
import { setTelemetryUser } from '../modules/shared/services/telemetry.js';
import { pathToView } from '../modules/shared/navigation.js';

/**
 * Manages authentication, session, profile switching, and demo mode.
 * @param {function} navigate - view navigation callback
 * @param {function} setView - raw setView for reset paths
 */
export function useAuth(navigate, setView) {
  const [user, setUser] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [activeProfile, setActiveProfile] = useState(null);

  // Auth expired listener
  useEffect(() => {
    const onAuthExpired = () => {
      setUser(null);
      setProfiles([]);
      setActiveProfile(null);
      setTelemetryUser(null);
      window.history.replaceState(null, '', '/');
      setView('dashboard');
    };
    window.addEventListener('ithras:auth:expired', onAuthExpired);
    return () => window.removeEventListener('ithras:auth:expired', onAuthExpired);
  }, [setView]);

  // Restore session from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('ithras_session');
    if (saved) {
      const parsed = (() => { try { return JSON.parse(saved); } catch { /* localStorage parse may fail */ return null; } })();
      const authToken = parsed?.access_token || parsed?.session_id || parsed?.sessionId;
      if (!authToken) {
        localStorage.removeItem('ithras_session');
        return;
      }
      validateSession()
        .then((res) => {
          const userData = res?.user || parsed?.user;
          if (userData) {
            setUser(userData);
            setProfiles(parsed?.profiles || []);
            setActiveProfile(parsed?.active_profile || null);
            setTelemetryUser(userData?.id || null);
          }
          const pathname = (window.location.pathname || '/').replace(/\/+$/, '') || '/';
          const viewFromUrl = pathToView(pathname);
          const u = userData || parsed?.user;
          const isProfessional = u?.role === 'PROFESSIONAL' && !u?.institution_id;
          const isGen = u && (u.role === 'CANDIDATE' || u.role === 'PROFESSIONAL') && !u.institution_id;

          let targetView = viewFromUrl || (isGen ? 'feed' : 'dashboard');
          if (isProfessional && targetView === 'dashboard' && pathname === '/') {
            try {
              const savedHrView = sessionStorage.getItem('ithras_hr_view');
              if (savedHrView && ['hr-outreach', 'hr-job-profiles', 'hr-discovery'].includes(savedHrView)) {
                targetView = savedHrView;
              }
            } catch (_) { /* sessionStorage may be unavailable */ }
          }

          const path = targetView === 'dashboard' ? '/' : targetView === 'feed' ? '/feed' : `/${targetView}`;
          if (!viewFromUrl || targetView !== viewFromUrl) {
            window.history.replaceState(null, '', path);
          }
          setView(targetView);
        })
        .catch(() => {
          localStorage.removeItem('ithras_session');
        });
    }
  }, [setView]);

  const handleLogin = useCallback((loginResponse) => {
    const userData = loginResponse.user || loginResponse;
    const userProfiles = loginResponse.profiles || [];
    const activeProf = loginResponse.active_profile || null;
    const sessionId = loginResponse.session_id || null;
    const accessToken = loginResponse.access_token || null;
    setUser(userData);
    setProfiles(userProfiles);
    setActiveProfile(activeProf);
    setTelemetryUser(userData?.id || null);
    localStorage.setItem('ithras_session', JSON.stringify({
      user: userData,
      profiles: userProfiles,
      active_profile: activeProf,
      session_id: sessionId,
      access_token: accessToken,
    }));
    const intended = pathToView(window.location.pathname);
    const isGeneralUser = userData && (userData.role === 'CANDIDATE' || userData.role === 'PROFESSIONAL') && !userData.institution_id;
    queueMicrotask(() => navigate(intended || (isGeneralUser ? 'feed' : 'dashboard')));
  }, [navigate]);

  const handleLogout = useCallback(async () => {
    try {
      const { apiRequest } = await import('../modules/shared/services/api/apiBase.js');
      await apiRequest('/v1/auth/logout', { method: 'POST', quiet: true });
    } catch (_) { /* logout is best-effort; proceed with local cleanup */ }
    setUser(null);
    setProfiles([]);
    setActiveProfile(null);
    setTelemetryUser(null);
    localStorage.removeItem('ithras_session');
    window.history.replaceState(null, '', '/');
    setView('dashboard');
  }, [setView]);

  const handleSwitchProfile = useCallback(async (profileId) => {
    try {
      const res = await switchProfile(profileId);
      const updatedUser = res.user || user;
      const updatedProfile = res.active_profile || null;
      setUser(updatedUser);
      setActiveProfile(updatedProfile);
      const saved = localStorage.getItem('ithras_session');
      let sessionId = null;
      try { if (saved) sessionId = JSON.parse(saved)?.session_id; } catch (_) { /* localStorage may be unavailable */ }
      localStorage.setItem('ithras_session', JSON.stringify({
        user: updatedUser,
        profiles,
        active_profile: updatedProfile,
        session_id: sessionId,
      }));
      navigate('dashboard');
    } catch (e) {
      console.error('Failed to switch profile:', e);
    }
  }, [user, profiles, navigate]);

  const handleUserUpdate = useCallback((updatedUser) => {
    setUser(updatedUser);
    const saved = localStorage.getItem('ithras_session');
    let parsed = {};
    try { if (saved) parsed = JSON.parse(saved); } catch (_) { /* localStorage may be unavailable */ }
    localStorage.setItem('ithras_session', JSON.stringify({
      ...parsed,
      user: updatedUser,
    }));
  }, []);

  return {
    user, profiles, activeProfile,
    handleLogin, handleLogout,
    handleSwitchProfile, handleUserUpdate,
  };
}
