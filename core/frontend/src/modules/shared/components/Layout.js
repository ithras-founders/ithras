
import React, { useState, useEffect, useRef } from 'react';
import htm from 'htm';
import { UserRole } from '../types.js';
import NotificationBell from './NotificationBell.js';
import ModeSwitcher from './ModeSwitcher.js';
import GlobalSearchBar from './GlobalSearchBar.js';
import { deriveRoleFlags } from '../permissions.js';
import { pathToView } from '../navigation.js';
import { resolveNavContext, getRecruiterModeNavItems } from '../modeConfig.js';
import { useTutorialContext } from '/core/frontend/src/modules/tutorials/index.js';
import IthrasLogo from './IthrasLogo.js';
import AlphaBadge from './AlphaBadge.js';
import { useApp } from '../context/AppContext.js';
import { toDisplayString } from '../utils/displayUtils.js';

const html = htm.bind(React.createElement);

const SIDEBAR_COLLAPSED_KEY = 'ithras-sidebar-collapsed';
const NAV_GROUPS_COLLAPSED_KEY = 'ithras-nav-groups-collapsed';

const Layout = ({ children, activeView, user: userProp, onLogout: onLogoutProp, navigate: navigateProp, setView, profiles: profilesProp, activeProfile: activeProfileProp, onSwitchProfile: onSwitchProfileProp }) => {
  const ctx = useApp();
  const user = userProp || ctx.user;
  const onLogout = onLogoutProp || ctx.onLogout;
  const profiles = profilesProp || ctx.profiles;
  const activeProfile = activeProfileProp || ctx.activeProfile;
  const onSwitchProfile = onSwitchProfileProp || ctx.onSwitchProfile;
  const onUserUpdate = ctx.onUserUpdate;
  const { isTutorialMode, endTutorial } = useTutorialContext();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(SIDEBAR_COLLAPSED_KEY) || 'false');
    } catch {
      return false; // localStorage may be unavailable
    }
  });
  const [navGroupsCollapsed, setNavGroupsCollapsed] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(NAV_GROUPS_COLLAPSED_KEY) || '{"Business":false,"Profile Management":false,"Institutional Recruitment":false,"Technology":false}');
    } catch {
      return { Business: false, 'Profile Management': false, 'Institutional Recruitment': false, Technology: false }; // localStorage may be unavailable
    }
  });
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);

  const nav = navigateProp || ctx.navigate || setView;

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, JSON.stringify(sidebarCollapsed));
    } catch (_) { /* localStorage may be unavailable */ }
  }, [sidebarCollapsed]);

  useEffect(() => {
    try {
      localStorage.setItem(NAV_GROUPS_COLLAPSED_KEY, JSON.stringify(navGroupsCollapsed));
    } catch (_) { /* localStorage may be unavailable */ }
  }, [navGroupsCollapsed]);

  const toggleNavGroup = (label) => {
    setNavGroupsCollapsed(prev => ({ ...prev, [label]: !prev[label] }));
  };

  useEffect(() => {
    if (!profileMenuOpen) return;
    const handleClickOutside = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [profileMenuOpen]);

  const displayName = toDisplayString(user?.name) || toDisplayString(user?.email) || 'User';
  const roleLabel = toDisplayString(activeProfile?.role?.name || activeProfile?.role || user?.role) || 'USER';
  const avatarUrl = user?.profile_photo_url || null;
  const avatarInitial = (displayName || '?').trim().charAt(0).toUpperCase();

  const navContext = resolveNavContext(activeView, pathToView, user, activeProfile, profiles);
  const { effectiveView: effectiveViewForLabel, inRecruiterMode: navInRecruiterMode, canAccessRecruiterMode: navCanAccessRecruiter } = navContext;

  const isInAccountSettings = activeView === 'account-settings' || activeView === 'account-settings-contact' || activeView === 'account-settings-messaging';

  const getNavItems = () => {
    const settingsIcon = html`<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>`;
    const contactIcon = html`<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>`;
    const messageIcon = html`<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>`;

    if (isInAccountSettings) {
      return [
        { id: 'account-settings', label: 'Account', icon: settingsIcon },
        { id: 'account-settings-contact', label: 'Contact preferences', icon: contactIcon },
        { id: 'account-settings-messaging', label: 'Messaging preferences', icon: messageIcon },
      ];
    }

    const feedIcon = html`<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0v6a2 2 0 01-2 2m0 0V5a2 2 0 012-2m0 6a2 2 0 012 2v6m-6-4a2 2 0 012-2m0 6V5a2 2 0 012 2m-6-4a2 2 0 012 2" /></svg>`;
    const calendarIcon = html`<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>`;
    const networkIcon = html`<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>`;
    const messagesIcon = html`<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>`;
    const homeIcon = html`<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>`;
    const profileIcon = html`<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>`;
    const hrJobIcon = html`<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>`;
    const hrDiscoveryIcon = html`<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>`;
    const hrOutreachIcon = html`<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>`;

    const { inRecruiterMode, canAccessRecruiterMode } = navContext;

    const items = [];

    if (inRecruiterMode && canAccessRecruiterMode) {
      const recruiterNavDef = getRecruiterModeNavItems();
      const iconMap = {
        'feed': homeIcon,
        'hr-job-profiles': hrJobIcon,
        'hr-discovery': hrDiscoveryIcon,
        'hr-outreach': hrOutreachIcon,
        'calendar': calendarIcon,
      };
      recruiterNavDef.forEach(({ id, label }) => {
        items.push({ id, label, icon: iconMap[id] || homeIcon });
      });
      return items;
    }

    const fallbackFlags = () => {
      const roleId = (user?.role && typeof user.role === 'object' && user.role.id) ? user.role.id : (user?.role || '');
      const isCandidateOrProfessional = roleId === 'CANDIDATE' || roleId === 'PROFESSIONAL';
      const institutionId = user?.institution_id ?? user?.institution?.id;
      const isSystemAdmin = roleId === 'SYSTEM_ADMIN';
      const isGovernanceUser = [UserRole.FACULTY_OBSERVER, UserRole.PLACEMENT_TEAM, UserRole.PLACEMENT_ADMIN, UserRole.INSTITUTION_ADMIN].includes(roleId);
      const isPlacementTeam = [UserRole.PLACEMENT_TEAM, UserRole.PLACEMENT_ADMIN].includes(roleId);
      const isRestrictedUser = !isSystemAdmin && !isGovernanceUser && !isPlacementTeam && !isCandidateOrProfessional && roleId !== 'RECRUITER';
      return {
        isSystemAdmin,
        isCandidate: isCandidateOrProfessional,
        isRecruiter: roleId === 'RECRUITER',
        isProfessional: roleId === 'PROFESSIONAL',
        isGovernanceUser,
        isInstitutionAdmin: roleId === 'INSTITUTION_ADMIN',
        isPlacementTeam,
        isGeneralUser: isCandidateOrProfessional && !institutionId,
        isRestrictedUser,
        isInstitutionallyRestrictedCandidate: false,
        isLimitedRecruiter: false,
        canAccessRecruiterMode: roleId === 'PROFESSIONAL',
      };
    };
    const flags = activeProfile ? deriveRoleFlags(activeProfile, { profiles }) : fallbackFlags();

    const isProfessionalForNav = canAccessRecruiterMode || flags.isProfessional;
    if (flags.isGeneralUser) {
      items.push(
        { id: 'feed', label: 'Feed', icon: feedIcon },
        { id: 'my-network', label: 'My Network', icon: networkIcon },
        { id: 'messages', label: 'Messages', icon: messagesIcon },
        ...(isProfessionalForNav ? [{ id: 'hr-outreach', label: 'Recruiter', icon: html`<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>` }] : []),
        { id: 'profile/me', label: 'My Profile', icon: profileIcon },
        { id: 'calendar', label: 'My Calendar', icon: calendarIcon },
        { id: 'preparation', label: 'Preparation', icon: html`<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>` }
      );
    } else {
      items.push(
        { id: 'dashboard', label: 'Home', icon: homeIcon },
        ...((flags.isCandidate || flags.isRecruiter) ? [{ id: 'feed', label: 'Feed', icon: feedIcon }, { id: 'my-network', label: 'My Network', icon: networkIcon }, { id: 'messages', label: 'Messages', icon: messagesIcon }] : [])
      );
    }

    if (!flags.isGeneralUser && flags.isCandidate && !flags.isInstitutionallyRestrictedCandidate) {
      items.push(
        { id: 'profile/me', label: 'Profile', icon: html`<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>` },
        { id: 'preparation', label: 'Preparation', icon: html`<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>` },
        { id: 'active_processes', label: 'Active Processes', icon: html`<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>` },
        { id: 'applications', label: 'My Applications', icon: html`<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>` },
        { id: 'calendar', label: 'My Calendar', icon: html`<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>` },
        { id: 'intelligence', label: 'Cycle Intelligence', icon: html`<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>` }
      );
    } else if (flags.isInstitutionallyRestrictedCandidate) {
      items.push(
        { id: 'feed', label: 'Feed', icon: feedIcon },
        { id: 'my-network', label: 'My Network', icon: networkIcon },
        { id: 'messages', label: 'Messages', icon: messagesIcon },
        { id: 'profile/me', label: 'Profile', icon: profileIcon },
        { id: 'calendar', label: 'My Calendar', icon: calendarIcon },
        { id: 'preparation', label: 'Preparation', icon: html`<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>` }
      );
    } else if (flags.isLimitedRecruiter) {
      items.push(
        { id: 'feed', label: 'Feed', icon: feedIcon },
        { id: 'my-network', label: 'My Network', icon: networkIcon },
        { id: 'messages', label: 'Messages', icon: messagesIcon },
        { id: 'hr-job-profiles', label: 'Job Profiles', icon: html`<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>` },
        { id: 'hr-discovery', label: 'Discovery', icon: html`<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>` },
        { id: 'calendar', label: 'Calendar', icon: calendarIcon }
      );
    } else if (flags.isRecruiter) {
      items.push(
        { id: 'hr-job-profiles', label: 'Job Profiles', icon: html`<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>` },
        { id: 'hr-discovery', label: 'Discovery', icon: html`<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>` },
        { id: 'hr-outreach', label: 'Outreach', icon: html`<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>` },
        { id: 'workflows', label: 'Placement Cycles', icon: html`<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>` },
        { id: 'ai-shortlist', label: 'AI Shortlist', icon: html`<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>` },
        { id: 'request-approvals', label: 'Request Approvals', icon: html`<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>` },
        { id: 'institutions', label: 'Institutional Registry', icon: html`<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>` },
        { id: 'jobs', label: 'Opportunity Hub', icon: html`<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>` },
        { id: 'calendar', label: 'Calendar', icon: html`<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>` },
        { id: 'applications', label: 'Applications', icon: html`<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>` }
      );
    } else if (flags.isSystemAdmin) {
      const biz = (id, label, icon) => ({ id, label, icon });
      const dbIcon = html`<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>`;
      const buildingIcon = html`<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>`;
      const briefcaseIcon = html`<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>`;
      const usersIcon = html`<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>`;
      const lockIcon = html`<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>`;
      items.push(
        { type: 'group', label: 'Business' },
        biz('cv', 'CV Templates', html`<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>`),
        biz('analytics', 'Analytics', html`<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>`),
        biz('master_calendar', 'Master Schedule', html`<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>`),
        { type: 'group', label: 'Profile Management' },
        biz('system-admin/institutions', 'Institution Management', buildingIcon),
        biz('system-admin/companies', 'Organisation Management', briefcaseIcon),
        biz('system-admin/pending-approvals', 'Pending Approvals', html`<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`),
        biz('system-admin/people', 'User Management', usersIcon),
        biz('system-admin/access', 'Access Control', lockIcon),
        { type: 'group', label: 'Institutional Recruitment' },
        biz('recruitment_cycles', 'Recruitment Cycles', html`<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>`),
        { type: 'group', label: 'Technology' },
        biz('telemetry', 'Telemetry', html`<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>`),
        biz('database', 'Database', dbIcon),
        biz('system-admin/migrations', 'Migrations', dbIcon),
        biz('simulator', 'Simulator', html`<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0v6a2 2 0 01-2 2m0 0V5a2 2 0 012-2m0 6a2 2 0 012 2v6m-6-4a2 2 0 012-2m0 6V5a2 2 0 012 2m-6-4a2 2 0 012 2" /></svg>`),
        biz('system-admin/testing', 'Testing', html`<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 4l2 2 4-4" /></svg>`),
      );
    } else {
      if (flags.isGovernanceUser) {
        items.push(
          { id: 'profile/me', label: 'CV Maker', icon: html`<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>` },
          { id: 'cv-templates', label: 'CV Template Builder', icon: html`<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>` },
          { id: 'cv-verification', label: 'CV Verification', icon: html`<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>` },
          { id: 'policy_approvals', label: 'Governance Flow', icon: html`<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>` },
          { id: 'recruitment_cycles', label: 'Recruitment Cycles', icon: html`<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>` },
          { id: 'approval-queue', label: 'Approval Queue', icon: html`<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>` },
          { id: 'master_calendar', label: 'Master Calendar', icon: html`<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>` },
          { id: 'placement_templates', label: 'Placement Cycle Templates', icon: html`<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" /></svg>` },
          { id: 'request_applications', label: 'Request Applications', icon: html`<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>` },
          { id: 'students', label: 'Students', icon: html`<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>` }
        );
      } else if (flags.isPlacementTeam) {
        items.push(
          { id: 'recruitment_cycles', label: 'Recruitment Cycles', icon: html`<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>` },
          { id: 'policy_approvals', label: 'Governance Flow', icon: html`<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>` },
          { id: 'master_calendar', label: 'Master Schedule', icon: html`<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>` },
          { id: 'placement_templates', label: 'Placement Cycle Templates', icon: html`<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" /></svg>` },
          { id: 'request_applications', label: 'Request Applications', icon: html`<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>` }
        );
      } else {
        items.length = 0;
        items.push(
          { id: 'feed', label: 'Feed', icon: feedIcon },
          { id: 'my-network', label: 'My Network', icon: networkIcon },
          { id: 'profile/me', label: 'My Profile', icon: profileIcon },
          { id: 'calendar', label: 'My Calendar', icon: calendarIcon },
          { id: 'preparation', label: 'Preparation', icon: html`<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>` }
        );
      }
    }

    return items;
  };

  const navItems = getNavItems();

  const isSystemAdminUser = user?.role === UserRole.SYSTEM_ADMIN || activeProfile?.role?.id === 'SYSTEM_ADMIN';
  const homeView = navInRecruiterMode ? 'hr-outreach' : (isSystemAdminUser ? 'dashboard' : 'feed');

  const pageLabelForView = (v) => {
    const exact = navItems.find((i) => i.id && i.id === v)?.label;
    if (exact) return exact;
    if (v === 'guided-demos') return 'Guided Demos';
    if (v === 'tutorials') return 'Help & Tutorials';
    if (v === 'about-us') return 'About Us';
    if (v === 'profile/me') return 'My Profile';
    if (v?.startsWith('profile/')) return 'Profile';
    if (v === 'account-settings') return 'Account';
    if (v === 'account-settings-contact') return 'Contact preferences';
    if (v === 'account-settings-messaging') return 'Messaging preferences';
    if (v === 'dashboard') return isSystemAdminUser ? 'System Overview' : 'Governance Dashboard';
    if (v === 'feed') return 'Feed';
    if (v === 'my-network') return 'My Network';
    if (v === 'hr-job-profiles') return 'Job Profiles';
    if (v === 'hr-discovery') return 'Discovery';
    if (v === 'hr-outreach') return 'Recruiter Outreach';
    if (v === 'database') return 'Database Management';
    if (v === 'system-admin/testing') return 'Testing';
    if (v === 'system-admin/migrations') return 'Migrations';
    if (v === 'system-admin/institutions') return 'Institution Management';
    if (v === 'system-admin/companies') return 'Organisation Management';
    if (v === 'system-admin/pending-approvals') return 'Pending Approvals';
    if (v === 'system-admin/people') return 'User Management';
    if (v === 'system-admin/access') return 'Access Control';
    if (v?.startsWith('system-admin/')) return navItems.find((i) => i.id && v?.startsWith(i.id + '/'))?.label || 'User Management';
    if (v?.startsWith('telemetry/')) return navItems.find((i) => i.id === 'telemetry')?.label || 'Telemetry';
    if (v?.startsWith('institution')) return 'Institution';
    if (v?.startsWith('company')) return 'Company';
    return (v || 'Home').replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };
  const pageLabel = pageLabelForView(effectiveViewForLabel);

  const handleNavClick = (id) => {
    if (isTutorialMode) return;
    if (id === 'investor-deck') {
      nav?.('investor-deck');
      return;
    }
    if (id === 'feed' && navInRecruiterMode) {
      nav?.('hr-outreach');
      return;
    }
    nav?.(id);
  };

  const toggleSidebar = () => setSidebarCollapsed((c) => !c);

  return html`
    <div className="flex min-h-screen app-shell-bg overflow-x-hidden relative text-[var(--app-text-primary)]">
      <aside className=${`
        fixed inset-y-0 left-0 app-sidebar-glass flex flex-col z-50 transition-[width,transform] duration-300 ease-in-out
        ${sidebarCollapsed ? 'w-[72px]' : 'w-[280px]'}
        ${sidebarCollapsed ? '-translate-x-full lg:translate-x-0' : 'translate-x-0'}
      `}>
        <div className=${`flex-shrink-0 border-b border-[var(--app-border-soft)] relative ${sidebarCollapsed ? 'pt-4 pb-2 px-2' : 'p-4'}`}>
          <div className=${`flex items-center ${sidebarCollapsed ? 'flex-col gap-2 justify-center' : 'justify-center gap-2'}`}>
            <div className=${`flex items-center ${sidebarCollapsed ? 'flex-col gap-2' : 'justify-center flex-1'}`}>
              <button
                onClick=${() => nav?.(homeView)}
                className="inline-flex items-baseline gap-0.5 hover:opacity-80 transition-opacity cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--app-accent)] focus:ring-offset-2 rounded"
                title="Go to home"
              >
                <${IthrasLogo} size="sm" theme="dark" />
                ${!sidebarCollapsed ? html`<${AlphaBadge} theme="dark" variant="superscript" />` : null}
              </button>
              ${sidebarCollapsed ? html`
                <button onClick=${toggleSidebar} className="p-1.5 text-[var(--app-text-secondary)] hover:bg-[var(--app-surface-muted)] rounded-[var(--app-radius-sm)]" title="Expand">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
                </button>
              ` : ''}
            </div>
            ${!sidebarCollapsed ? html`
              <button onClick=${toggleSidebar} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-[var(--app-text-secondary)] hover:bg-[var(--app-surface-muted)] rounded-[var(--app-radius-sm)]" title="Collapse">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7M18 19l-7-7 7-7" /></svg>
              </button>
            ` : ''}
          </div>
        </div>

        <nav className=${`flex-1 min-h-0 overflow-y-auto overflow-x-hidden ${sidebarCollapsed ? 'px-2 pt-2 pb-2' : 'px-4 pt-3 pb-4'} ${isTutorialMode ? 'pointer-events-none opacity-50' : ''}`}>
          ${!isTutorialMode ? html`
            <div className=${`mb-3 w-full ${sidebarCollapsed ? 'flex justify-center' : ''}`}>
              <${ModeSwitcher}
                profiles=${profiles}
                activeProfile=${activeProfile}
                onSwitchProfile=${onSwitchProfile}
                navigate=${nav}
                user=${user}
                activeView=${activeView}
                placement="sidebar"
                compact=${sidebarCollapsed}
              />
            </div>
          ` : null}
          <div className="space-y-1">
          ${(() => {
            let currentGroup = null;
            return navItems.map((item, idx) => {
              if (item.type === 'group') {
                currentGroup = item.label;
                if (sidebarCollapsed) return html`<div key=${`group-${item.label}-${idx}`} className="border-t border-[var(--app-border-soft)] mt-1 pt-1 mx-2" />`;
                const collapsed = navGroupsCollapsed[item.label];
                return html`
                  <button
                    key=${`group-${item.label}-${idx}`}
                    onClick=${() => toggleNavGroup(item.label)}
                    className="w-full flex items-center justify-between px-4 pt-4 pb-1.5 cursor-pointer hover:bg-[var(--app-surface-muted)] rounded-[var(--app-radius-sm)] transition-colors"
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--app-text-muted)]">${item.label}</span>
                    <svg className=${`w-3.5 h-3.5 text-[var(--app-text-muted)] transition-transform duration-200 ${collapsed ? '-rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                `;
              }
              if (!sidebarCollapsed && currentGroup && navGroupsCollapsed[currentGroup]) return null;
              return html`
              <button 
                key=${item.id}
                data-tour-id=${`nav-${item.id}`}
                onClick=${() => handleNavClick(item.id)}
                title=${sidebarCollapsed ? item.label : undefined}
                className=${`w-full flex items-center app-nav-item transition-all duration-200 app-focus-ring text-sm font-medium ${sidebarCollapsed ? 'justify-center px-0 py-3' : 'gap-3 px-4'} ${effectiveViewForLabel === item.id ? 'sidebar-item-active' : 'text-[var(--app-text-secondary)] hover:bg-[var(--app-surface-muted)] hover:text-[var(--app-text-primary)]'}`}
              >
                ${item.icon}
                ${!sidebarCollapsed ? html`<span className="truncate">${item.label}</span>` : ''}
              </button>
            `;
            });
          })()}
          </div>
        </nav>

        <div className=${`flex-shrink-0 ${sidebarCollapsed ? 'p-2' : 'p-4'}`}>
          ${isTutorialMode ? html`
            <button 
              onClick=${endTutorial}
              className=${`w-full py-2.5 bg-[rgba(220,38,38,0.08)] text-[var(--app-danger)] text-xs font-semibold rounded-[var(--app-radius-sm)] hover:bg-[rgba(220,38,38,0.14)] transition-colors app-focus-ring flex items-center justify-center gap-2 border border-[rgba(220,38,38,0.2)]`}
              title=${sidebarCollapsed ? 'Exit Tour' : undefined}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              ${!sidebarCollapsed ? 'Exit Tour' : ''}
            </button>
          ` : html`
            <div className=${sidebarCollapsed ? 'space-y-2' : 'app-sidebar-footer-card space-y-2'}>
              <button 
                onClick=${() => nav?.('guided-demos')} 
                className=${`w-full py-2.5 bg-[var(--app-surface-muted)] text-[var(--app-text-secondary)] text-xs font-medium rounded-[var(--app-radius-sm)] hover:bg-[var(--app-surface)] hover:text-[var(--app-text-primary)] transition-colors app-focus-ring flex items-center justify-center gap-2`}
                title=${sidebarCollapsed ? 'Guided Demos' : undefined}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                ${!sidebarCollapsed ? 'Guided Demos' : ''}
              </button>
              <button 
                onClick=${() => nav?.('tutorials')} 
                className=${`w-full py-2 text-[var(--app-text-muted)] text-xs font-medium rounded-[var(--app-radius-sm)] hover:bg-[var(--app-surface-muted)] hover:text-[var(--app-text-secondary)] transition-colors app-focus-ring flex items-center justify-center gap-2`}
                title=${sidebarCollapsed ? 'Help & Tutorials' : undefined}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                ${!sidebarCollapsed ? 'Help & Tutorials' : ''}
              </button>
            </div>
          `}
        </div>
      </aside>

      <div className=${`
        flex-1 flex flex-col min-h-screen transition-[margin] duration-300 ease-in-out
        ${sidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-[280px]'}
        ${activeView === 'tutorials' ? 'relative z-[60]' : ''}
      `}>
        <header className="flex-shrink-0 relative z-20 overflow-visible flex items-center gap-2 md:gap-3 px-4 py-3 md:px-5 md:py-3 bg-[var(--app-surface)] border-b border-[var(--app-border-soft)]">
          <button
            onClick=${toggleSidebar}
            className="p-2 -ml-2 text-[var(--app-text-secondary)] hover:bg-[var(--app-surface-muted)] rounded-[var(--app-radius-sm)] transition-colors app-focus-ring lg:hidden"
            title="Menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <div className="flex-1 min-w-0 flex items-center">
            ${user && !isTutorialMode ? html`
              <${GlobalSearchBar} user=${user} navigate=${nav} />
            ` : null}
          </div>
          <div className="flex items-center gap-1 ml-auto">
            ${isTutorialMode ? html`
              <div className="flex items-center gap-2 mr-2">
                <span className="px-2.5 py-1 bg-[var(--app-accent-soft)] text-[var(--app-accent)] text-[10px] font-bold uppercase tracking-wider rounded-full">Guided Tour</span>
              </div>
            ` : html`
              ${user ? html`
                <button
                  onClick=${() => nav?.('messages')}
                  title="Inbox"
                  className="p-2 text-[var(--app-text-secondary)] hover:text-[var(--app-text-primary)] hover:bg-[var(--app-surface-muted)] rounded-[var(--app-radius-sm)] transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </button>
              ` : null}
              <${NotificationBell} user=${user} navigate=${nav} />
            `}
            ${!isTutorialMode ? html`
              <div ref=${profileMenuRef} className="relative">
              <button
                onClick=${(e) => { e.stopPropagation(); setProfileMenuOpen(!profileMenuOpen); }}
                className="flex items-center gap-2 p-1.5 rounded-[var(--app-radius-md)] hover:bg-[var(--app-surface-muted)] transition-colors app-focus-ring"
                title="Settings"
              >
                ${avatarUrl ? html`
                  <img src=${avatarUrl} alt="Profile" loading="lazy" className="w-8 h-8 md:w-9 md:h-9 rounded-[var(--app-radius-sm)] object-cover border border-[var(--app-border-soft)]" />
                ` : html`
                  <div className="w-8 h-8 md:w-9 md:h-9 bg-[var(--app-accent-soft)] text-[var(--app-accent)] rounded-[var(--app-radius-sm)] flex items-center justify-center font-semibold">
                    ${avatarInitial}
                  </div>
                `}
                <svg className=${`w-4 h-4 text-[var(--app-text-muted)] hidden sm:block transition-transform ${profileMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              ${profileMenuOpen ? html`
                <div className="absolute right-0 mt-1 py-1 w-64 bg-[var(--app-surface)] border border-[var(--app-border-soft)] rounded-[var(--app-radius-md)] shadow-[var(--app-shadow-card)] z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-[var(--app-border-soft)] flex items-center gap-3">
                    ${avatarUrl ? html`
                      <img src=${avatarUrl} alt="" loading="lazy" className="w-12 h-12 rounded-[var(--app-radius-sm)] object-cover border border-[var(--app-border-soft)] flex-shrink-0" />
                    ` : html`
                      <div className="w-12 h-12 bg-[var(--app-accent-soft)] text-[var(--app-accent)] rounded-[var(--app-radius-sm)] flex items-center justify-center font-semibold text-lg flex-shrink-0">
                        ${avatarInitial}
                      </div>
                    `}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-[var(--app-text-primary)] truncate">${displayName}</p>
                      <p className="text-[10px] text-[var(--app-text-muted)] truncate uppercase tracking-wider">${roleLabel}</p>
                    </div>
                  </div>
                  <button
                    onClick=${() => { nav?.('account-settings'); setProfileMenuOpen(false); }}
                    className="w-full px-4 py-2.5 text-left text-sm font-semibold text-[var(--app-text-secondary)] hover:bg-[var(--app-surface-muted)] flex items-center gap-2 app-focus-ring"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    Settings
                  </button>
                  <button
                    onClick=${() => { nav?.('profile/me'); setProfileMenuOpen(false); }}
                    className="w-full px-4 py-2.5 text-left text-sm font-semibold text-[var(--app-text-secondary)] hover:bg-[var(--app-surface-muted)] flex items-center gap-2 app-focus-ring"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    Profile
                  </button>
                  <button
                    onClick=${() => { onLogout?.(); setProfileMenuOpen(false); }}
                    className="w-full px-4 py-2.5 text-left text-sm font-semibold text-[var(--app-text-secondary)] hover:bg-[var(--app-surface-muted)] flex items-center gap-2 app-focus-ring border-t border-[var(--app-border-soft)]"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    Sign Out
                  </button>
                </div>
              ` : null}
              </div>
            ` : html`
              <button
                onClick=${endTutorial}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[var(--app-danger)] bg-[rgba(220,38,38,0.06)] hover:bg-[rgba(220,38,38,0.12)] border border-[rgba(220,38,38,0.15)] rounded-[var(--app-radius-sm)] transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                Exit
              </button>
            `}
          </div>
        </header>
        <main className=${`flex-1 overflow-y-auto min-h-0 relative z-0 ${isTutorialMode ? 'pointer-events-none' : ''}`}>
          <div className="app-page-container app-shell-main min-h-full">
            ${children}
          </div>
        </main>
      </div>
    </div>
  `;
};

export default Layout;
