import React, { useState, useEffect, useCallback, useRef } from 'react';
import htm from 'htm';
import { UserRole } from '../types.js';
import NotificationBell from './NotificationBell.js';
import ModeSwitcher from './ModeSwitcher.js';
import GlobalSearchBar from './GlobalSearchBar.js';
import { deriveRoleFlags } from '../permissions.js';
import { pathToView } from '../navigation.js';
import { resolveNavContext, getRecruiterModeNavItems } from '../modeConfig.js';
import IthrasLogo from './IthrasLogo.js';
import AlphaBadge from './AlphaBadge.js';
import { useApp } from '../context/AppContext.js';
import { toDisplayString } from '../utils/displayUtils.js';
import FeedLeftNav from '/products/feed/core/frontend/src/FeedLeftNav.js';
import FeedUtilityWing from '/products/feed/global/frontend/src/global/FeedUtilityWing.js';
import { FeedSidebarRefreshContext } from '/products/feed/core/frontend/src/FeedSidebarRefreshContext.js';
import { iconMap } from '../ui/icons/iconMap.js';

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
  const rightUtilityBarOpen = ctx.rightUtilityBarOpen;
  const setRightUtilityBarOpen = ctx.setRightUtilityBarOpen;
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
  const nav = navigateProp || ctx.navigate || setView;
  const headerRef = useRef(null);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const setHeaderHeight = () => {
      document.body.style.setProperty('--app-header-height', `${el.offsetHeight}px`);
    };
    setHeaderHeight();
    const ro = new ResizeObserver(setHeaderHeight);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

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

    const feedIcon = html`<${iconMap.rss} className="w-5 h-5" />`;
    const calendarIcon = html`<${iconMap.calendar} className="w-5 h-5" />`;
    const networkIcon = html`<${iconMap.candidates} className="w-5 h-5" />`;
    const messagesIcon = html`<${iconMap.mail} className="w-5 h-5" />`;
    const homeIcon = html`<${iconMap.home} className="w-5 h-5" />`;
    const profileIcon = html`<${iconMap.profile} className="w-5 h-5" />`;
    const preparationIcon = html`<${iconMap.bookOpen} className="w-5 h-5" />`;
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
        { id: 'preparation', label: 'Preparation', icon: preparationIcon }
      );
    } else {
      items.push(
        { id: 'dashboard', label: 'Home', icon: homeIcon },
        ...((flags.isCandidate || flags.isRecruiter) ? [{ id: 'feed', label: 'Feed', icon: feedIcon }, { id: 'my-network', label: 'My Network', icon: networkIcon }, { id: 'messages', label: 'Messages', icon: messagesIcon }] : [])
      );
    }

    if (!flags.isGeneralUser && flags.isCandidate && !flags.isInstitutionallyRestrictedCandidate) {
      items.push(
        { id: 'profile/me', label: 'Profile', icon: profileIcon },
        { id: 'preparation', label: 'Preparation', icon: preparationIcon },
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
        { id: 'preparation', label: 'Preparation', icon: preparationIcon }
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
        biz('system-admin/prep-management', 'Prep Management', html`<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>`),
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
          { id: 'preparation', label: 'Preparation', icon: preparationIcon }
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
    if (v === 'system-admin/prep-management') return 'Prep Management';
    if (v === 'system-admin/community') return 'Community Management';
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

  const isFeedView = activeView === 'feed' || activeView?.startsWith('feed/') || activeView === 'messages' || activeView === 'my-network';

  const [feedSidebarRefreshTrigger, setFeedSidebarRefreshTrigger] = useState(0);
  const refreshFeedSidebar = useCallback(() => setFeedSidebarRefreshTrigger((t) => t + 1), []);

  const showFeedSidebar = isFeedView && !isSystemAdminUser;
  const showLeftSidebar = isSystemAdminUser || showFeedSidebar;
  const mainMargin = showLeftSidebar ? (sidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-[280px]') : 'lg:ml-0';
  const mainMarginRight = isFeedView && rightUtilityBarOpen ? 'lg:mr-[300px]' : '';
  const viewParts = (activeView || '').split('/').filter(Boolean);
  const feedCommunityChannel = viewParts[0] === 'feed' && viewParts[1] === 'communities' && viewParts[2] ? viewParts[2] : null;
  const feedCommunityCode = viewParts[0] === 'feed' && viewParts[1] === 'community' && viewParts[2] ? viewParts[2] : null;

  const topBarNavItems = isSystemAdminUser ? [] : navItems.filter((i) => i.id && !i.type && i.id !== 'profile/me');

  const layoutContent = html`
    <div className="flex min-h-screen app-shell-bg overflow-x-hidden relative text-[var(--app-text-primary)]">
      ${isSystemAdminUser ? html`
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

        <nav className=${`flex-1 min-h-0 overflow-y-auto overflow-x-hidden ${sidebarCollapsed ? 'px-2 pt-2 pb-2' : 'px-4 pt-3 pb-4'}`}>
          ${html`
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
          `}
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
                className=${`w-full min-w-0 flex items-center app-nav-item transition-all duration-200 app-focus-ring text-sm font-medium ${sidebarCollapsed ? 'justify-center px-0 py-3' : 'gap-3 px-4'} ${effectiveViewForLabel === item.id ? 'sidebar-item-active' : 'text-[var(--app-text-secondary)] hover:bg-[var(--app-surface-muted)] hover:text-[var(--app-text-primary)]'}`}
              >
                ${item.icon}
                ${!sidebarCollapsed ? html`<span className="truncate">${item.label}</span>` : ''}
              </button>
            `;
            });
          })()}
          </div>
        </nav>
        <div className=${`flex-shrink-0 border-t border-[var(--app-border-soft)] ${sidebarCollapsed ? 'p-2' : 'p-4'}`}>
          <button
            onClick=${() => nav?.('account-settings')}
            className=${`w-full py-2.5 bg-[var(--app-surface-muted)] text-[var(--app-text-secondary)] text-xs font-medium rounded-[var(--app-radius-sm)] hover:bg-[var(--app-surface)] hover:text-[var(--app-text-primary)] transition-colors app-focus-ring flex items-center justify-center gap-2 ${sidebarCollapsed ? 'px-0' : ''}`}
            title=${sidebarCollapsed ? 'Settings' : undefined}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            ${!sidebarCollapsed ? 'Settings' : ''}
          </button>
        </div>
      </aside>
      ` : null}

      ${showFeedSidebar ? html`
      <aside className=${`
        hidden lg:flex fixed inset-y-0 left-0 flex-col z-50 transition-[width,transform] duration-300 ease-in-out bg-white
        ${sidebarCollapsed ? 'w-[72px]' : 'w-[280px]'}
        ${sidebarCollapsed ? '-translate-x-full lg:translate-x-0' : 'translate-x-0'}
      `}>
        <div className=${`flex-shrink-0 border-b border-[var(--app-border-soft)] relative ${sidebarCollapsed ? 'pt-4 pb-2 px-2' : 'p-4'}`}>
          <div className=${`flex items-center ${sidebarCollapsed ? 'flex-col gap-2 justify-center' : 'justify-center gap-2'}`}>
            <div className=${`flex items-center min-w-0 ${sidebarCollapsed ? 'flex-col gap-2' : 'justify-center flex-1'}`}>
              <button
                onClick=${() => nav?.(homeView)}
                className="inline-flex items-baseline gap-0.5 min-w-0 hover:opacity-80 transition-opacity cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--app-accent)] focus:ring-offset-2 rounded"
                title="Go to home"
              >
                <${IthrasLogo} size="sm" theme="dark" />
                ${!sidebarCollapsed ? html`<${AlphaBadge} theme="dark" variant="superscript" />` : null}
              </button>
              ${sidebarCollapsed ? html`
                <button onClick=${toggleSidebar} className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-[var(--app-radius-sm)]" title="Expand">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
                </button>
              ` : ''}
            </div>
            ${!sidebarCollapsed ? html`
              <button onClick=${toggleSidebar} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-600 hover:bg-slate-100 rounded-[var(--app-radius-sm)]" title="Collapse">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7M18 19l-7-7 7-7" /></svg>
              </button>
            ` : ''}
          </div>
        </div>
        <nav className=${`flex-1 min-h-0 overflow-y-auto overflow-x-hidden ${sidebarCollapsed ? 'px-2 pt-4 pb-4' : 'px-4 pt-4 pb-4'}`}>
          <${FeedLeftNav}
            user=${user}
            navigate=${nav}
            activeView=${activeView}
            profiles=${profiles}
            activeProfile=${activeProfile}
            onSwitchProfile=${onSwitchProfile}
            collapsed=${sidebarCollapsed}
            onCollapsedChange=${setSidebarCollapsed}
            onJoinLeave=${refreshFeedSidebar}
            refreshTrigger=${feedSidebarRefreshTrigger}
            darkSidebar=${false}
          />
        </nav>
        <div className=${`flex-shrink-0 border-t border-[var(--app-border-soft)] ${sidebarCollapsed ? 'p-2' : 'p-4'}`}>
          <button
            onClick=${() => nav?.('account-settings')}
            className=${`w-full py-2.5 bg-[var(--app-surface-muted)] text-[var(--app-text-secondary)] text-xs font-medium rounded-[var(--app-radius-sm)] hover:bg-[var(--app-surface)] hover:text-[var(--app-text-primary)] transition-colors app-focus-ring flex items-center justify-center gap-2 ${sidebarCollapsed ? 'px-0' : ''}`}
            title=${sidebarCollapsed ? 'Settings' : undefined}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            ${!sidebarCollapsed ? 'Settings' : ''}
          </button>
        </div>
      </aside>
      ` : null}

      <div className=${`
        flex-1 flex flex-col min-h-screen transition-[margin] duration-300 ease-in-out
        ${mainMargin} ${mainMarginRight}
      `}>
        <header ref=${headerRef} className="flex-shrink-0 relative z-20 overflow-visible flex items-center gap-2 md:gap-3 px-4 py-3 md:px-5 md:py-3 bg-[var(--app-surface)] border-b border-[var(--app-border-soft)]">
          ${isSystemAdminUser ? html`
          <button
            onClick=${toggleSidebar}
            className="p-2 -ml-2 text-[var(--app-text-secondary)] hover:bg-[var(--app-surface-muted)] rounded-[var(--app-radius-sm)] transition-colors app-focus-ring lg:hidden"
            title="Menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          ` : !showFeedSidebar ? html`
          <button
            onClick=${() => nav?.(homeView)}
            className="inline-flex items-baseline gap-0.5 hover:opacity-80 transition-opacity -ml-1"
            title="Go to home"
          >
            <${IthrasLogo} size="sm" theme="dark" />
            <${AlphaBadge} theme="dark" variant="superscript" />
          </button>
          ` : null}
          ${!isSystemAdminUser ? html`
          <div className="flex-1 min-w-0 flex items-center max-w-md">
            ${user ? html`
              <${GlobalSearchBar} user=${user} navigate=${nav} />
            ` : null}
          </div>
          ` : null}
          <div className=${`flex items-center gap-3 md:gap-5 transition-all duration-300 ${isFeedView ? `flex-1 ${rightUtilityBarOpen ? 'justify-center' : 'justify-end'}` : 'ml-auto shrink-0'}`}>
          ${!isSystemAdminUser ? html`
            <div className="flex items-center gap-2 md:gap-3 overflow-x-auto scrollbar-hide">
              ${topBarNavItems.map((item) => html`
                <button
                  key=${item.id}
                  data-tour-id=${`nav-${item.id}`}
                  onClick=${() => handleNavClick(item.id)}
                  title=${item.label}
                  className=${`flex flex-col items-center gap-0.5 py-2 px-2.5 rounded-lg transition-colors app-focus-ring shrink-0 min-w-0 ${effectiveViewForLabel === item.id || (item.id === 'feed' && activeView?.startsWith('feed')) ? 'bg-[var(--app-accent-soft)] text-[var(--app-accent)]' : 'text-[var(--app-text-secondary)] hover:bg-[var(--app-surface-muted)] hover:text-[var(--app-text-primary)]'}`}
                >
                  ${item.icon}
                  <span className="text-[10px] font-medium truncate max-w-full">${item.label}</span>
                </button>
              `)}
              ${user && !topBarNavItems.some((i) => i.id === 'messages') ? html`
                <button
                  onClick=${() => nav?.('messages')}
                  title="Messages"
                  className=${`flex flex-col items-center gap-0.5 py-2 px-2.5 rounded-lg transition-colors app-focus-ring shrink-0 min-w-0 ${effectiveViewForLabel === 'messages' ? 'bg-[var(--app-accent-soft)] text-[var(--app-accent)]' : 'text-[var(--app-text-secondary)] hover:bg-[var(--app-surface-muted)] hover:text-[var(--app-text-primary)]'}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  <span className="text-[10px] font-medium whitespace-nowrap">Messages</span>
                </button>
              ` : null}
              ${user ? html`
                <div className="flex flex-col items-center justify-center gap-0.5 py-2 px-2.5 rounded-lg shrink-0 min-w-0 text-[var(--app-text-secondary)] hover:bg-[var(--app-surface-muted)] hover:text-[var(--app-text-primary)] transition-colors">
                  <div className="flex items-center justify-center min-h-[20px] [&_button]:p-0 [&_svg]:w-5 [&_svg]:h-5">
                    <${NotificationBell} user=${user} navigate=${nav} />
                  </div>
                  <span className="text-[10px] font-medium whitespace-nowrap">Notifications</span>
                </div>
              ` : null}
            </div>
          ` : null}
          ${isFeedView && user ? html`
            <div className="flex items-center gap-2 shrink-0 border-l border-[var(--app-border-soft)] pl-3">
              ${rightUtilityBarOpen ? html`
                <button
                  onClick=${(e) => { e.stopPropagation(); setRightUtilityBarOpen?.(false); }}
                  className="p-2 text-[var(--app-text-secondary)] hover:bg-[var(--app-surface-muted)] rounded-[var(--app-radius-sm)] shrink-0"
                  title="Collapse"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7M18 19l-7-7 7-7" /></svg>
                </button>
              ` : html`
                <button
                  onClick=${(e) => { e.stopPropagation(); setRightUtilityBarOpen?.(true); }}
                  className="flex items-center gap-2 py-2 pl-2 pr-3 rounded-full border border-[var(--app-border-soft)] hover:bg-[var(--app-surface-muted)] hover:border-[var(--app-border-strong)] transition-colors app-focus-ring shrink-0"
                  title="Open profile panel"
                >
                  ${avatarUrl ? html`
                    <img src=${avatarUrl} alt="Profile" loading="lazy" className="rounded-full object-cover border border-[var(--app-border-soft)] w-10 h-10 flex-shrink-0" />
                  ` : html`
                    <div className="rounded-full bg-[var(--app-accent-soft)] text-[var(--app-accent)] flex items-center justify-center font-semibold w-10 h-10 flex-shrink-0">${avatarInitial}</div>
                  `}
                  <div className="hidden sm:flex flex-col items-start min-w-0">
                    <span className="text-[9px] font-semibold uppercase tracking-wider text-[var(--app-text-muted)] leading-tight">Profile</span>
                    <span className="text-sm font-bold text-[var(--cobalt-600)] truncate">My Profile</span>
                  </div>
                  <svg className="w-4 h-4 flex-shrink-0 text-[var(--app-text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  </svg>
                </button>
              `}
            </div>
          ` : !isFeedView && user ? html`
            <button
              onClick=${(e) => { e.stopPropagation(); nav?.('profile/me'); }}
              className="p-1.5 rounded-[var(--app-radius-sm)] hover:bg-[var(--app-surface-muted)] shrink-0"
              title="Profile"
            >
              ${avatarUrl ? html`
                <img src=${avatarUrl} alt="Profile" loading="lazy" className="rounded-full object-cover border border-[var(--app-border-soft)] w-8 h-8 md:w-9 md:h-9 flex-shrink-0" />
              ` : html`
                <div className="rounded-full bg-[var(--app-accent-soft)] text-[var(--app-accent)] flex items-center justify-center font-semibold w-8 h-8 md:w-9 md:h-9 flex-shrink-0">${avatarInitial}</div>
              `}
            </button>
          ` : null}
          </div>
        </header>
        <main className="flex-1 overflow-y-auto min-h-0 relative z-0">
          <div className=${`app-page-container app-shell-main min-h-full ${isFeedView ? 'feed-layout' : ''} ${isFeedView && rightUtilityBarOpen ? 'feed-utility-open' : ''}`}>
            ${children}
          </div>
        </main>
      </div>

      ${isFeedView ? html`
      <aside className=${`
        hidden lg:flex fixed inset-y-0 right-0 flex-col z-50 bg-white border-l border-[var(--app-border-soft)] overflow-hidden
        transition-[width] duration-300 ease-in-out
        ${rightUtilityBarOpen ? 'w-[300px]' : 'w-0'}
      `}>
        ${rightUtilityBarOpen ? html`
        <div className="w-[300px] flex flex-col flex-1 min-h-0 shrink-0">
          <div className="flex-shrink-0 flex items-center gap-2 px-4 py-3 border-b border-[var(--app-border-soft)] h-[var(--app-header-height,60px)]">
            <button
              onClick=${(e) => { e.stopPropagation(); setRightUtilityBarOpen?.(false); }}
              className="p-2 -ml-2 text-[var(--app-text-secondary)] hover:bg-[var(--app-surface-muted)] rounded-[var(--app-radius-sm)] shrink-0"
              title="Collapse"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7M18 19l-7-7 7-7" /></svg>
            </button>
            ${avatarUrl ? html`
              <img src=${avatarUrl} alt="" className="rounded-full object-cover border border-[var(--app-border-soft)] w-9 h-9 flex-shrink-0" />
            ` : html`
              <div className="rounded-full bg-[var(--app-accent-soft)] text-[var(--app-accent)] flex items-center justify-center font-semibold text-sm w-9 h-9 flex-shrink-0">${avatarInitial}</div>
            `}
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <span className="font-semibold text-[var(--app-text-primary)] truncate text-sm leading-tight">${displayName}</span>
              <span className="text-[var(--app-text-muted)] shrink-0">·</span>
              <button
                onClick=${(e) => { e.stopPropagation(); nav?.('profile/me'); }}
                className="text-xs font-semibold text-[var(--cobalt-600)] hover:underline shrink-0 whitespace-nowrap"
              >
                View profile
              </button>
            </div>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto p-3">
            <${FeedUtilityWing} user=${user} communityCode=${feedCommunityCode} channelCode=${feedCommunityChannel} navigate=${nav} />
          </div>
        </div>
        ` : null}
      </aside>
      ` : null}
    </div>
  `;

  return html`
    <${FeedSidebarRefreshContext.Provider} value=${{ refresh: refreshFeedSidebar }}>
      ${layoutContent}
    <//>
  `;
};

export default Layout;
