import React, { useState, useRef, useEffect } from 'react';
import htm from 'htm';
import { getCompanyLogoUrl, getInstitutionLogoUrl, getCompanyLogoFallback, getInstitutionLogoFallback } from '../utils/logoUtils.js';
import { pathToView } from '../navigation.js';
import { resolveNavContext } from '../modeConfig.js';
import { IthrasIcon } from './IthrasLogo.js';

const html = htm.bind(React.createElement);

const ITHRAS_FALLBACK = '__ithras__';

const resolveLogoUrl = (profile) => {
  if (profile?.institution_id && profile?.institution_logo_url) {
    return getInstitutionLogoUrl({ logo_url: profile.institution_logo_url }) || profile.institution_logo_url;
  }
  if (profile?.company_id && profile?.company_logo_url) {
    return getCompanyLogoUrl({ logo_url: profile.company_logo_url }) || profile.company_logo_url;
  }
  if (!profile?.institution_id && !profile?.company_id) return ITHRAS_FALLBACK;
  return null;
};

const getOrgLabel = (profile) => {
  if (!profile) return 'Ithras';
  if (profile.institution_name) return profile.institution_name;
  if (profile.company_name) return profile.company_name;
  return 'Ithras';
};

const formatRoleLabel = (roleName) => {
  if (!roleName) return '';
  const map = {
    SYSTEM_ADMIN: 'Admin',
    'System Admin': 'Admin',
    PLACEMENT_ADMIN: 'Placement Admin',
    PLACEMENT_TEAM: 'Placement Team',
    INSTITUTION_ADMIN: 'Institution Admin',
    RECRUITER: 'Recruiter',
    CANDIDATE: 'Candidate',
    PROFESSIONAL: 'Professional',
    FACULTY_OBSERVER: 'Faculty Observer',
  };
  return map[roleName] || roleName.replace(/_/g, ' ');
};

const ModeSwitcher = ({ profiles = [], activeProfile, onSwitchProfile, navigate, user, activeView, placement = 'header', compact = false }) => {
  const isSidebar = placement === 'sidebar';
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const navContext = resolveNavContext(activeView, pathToView, user, activeProfile, profiles);
  const inRecruiterMode = navContext.inRecruiterMode;
  const canAccessRecruiterMode = navContext.canAccessRecruiterMode && !!navigate;
  const orgLabel = inRecruiterMode ? 'Recruiter' : getOrgLabel(activeProfile);
  const logoUrl = resolveLogoUrl(activeProfile);
  const hasMultipleProfiles = profiles && profiles.length > 1;

  const getProfileContextLabel = (p) => {
    if (p.institution_name) return p.institution_name;
    if (p.company_name) return p.company_name;
    return 'Ithras';
  };

  return html`
    <div ref=${ref} className=${isSidebar ? 'relative z-[100] min-w-0 w-full' : 'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden sm:block z-[100]'}>
      <button
        onClick=${() => setOpen(!open)}
        className=${compact ? 'flex items-center justify-center p-1.5 rounded-[var(--app-radius-sm)] border border-[var(--app-border-soft)] bg-[var(--app-surface)] hover:bg-[var(--app-surface-muted)] transition-colors app-focus-ring' : `flex items-center gap-1.5 px-2 py-1.5 rounded-[var(--app-radius-sm)] border border-[var(--app-border-soft)] bg-[var(--app-surface)] hover:bg-[var(--app-surface-muted)] transition-colors app-focus-ring ${isSidebar ? 'w-full min-w-0' : ''}`}
        title=${orgLabel}
      >
        <div className=${compact ? 'w-9 h-9 rounded-[var(--app-radius-sm)] border border-[var(--app-border-soft)] flex items-center justify-center overflow-hidden bg-[var(--app-surface)]' : 'w-8 h-8 rounded-[var(--app-radius-sm)] border border-[var(--app-border-soft)] flex items-center justify-center overflow-hidden shrink-0 bg-[var(--app-surface)]'}>
          ${inRecruiterMode ? html`
            <svg className=${compact ? 'w-7 h-7' : 'w-6 h-6'} fill="none" stroke="currentColor" viewBox="0 0 24 24" style=${{ color: 'var(--app-accent)' }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
          ` : logoUrl === ITHRAS_FALLBACK ? html`
            <${IthrasIcon} size=${compact ? '28px' : '28px'} theme="dark" />
          ` : logoUrl ? html`
            <img src=${logoUrl} alt=${orgLabel} loading="lazy" className="max-h-full max-w-full object-contain" onError=${(e) => { e.target.style.display = 'none'; }} />
          ` : html`
            <span className="text-xs font-medium text-[var(--app-text-muted)]">${(orgLabel || '?')[0]}</span>
          `}
        </div>
        ${!compact ? html`
          <div className="flex flex-col items-start min-w-0 flex-1">
            <span className="text-sm font-medium text-[var(--app-text-primary)] truncate">${orgLabel}</span>
            ${inRecruiterMode ? html`
              <span className="text-[10px] font-semibold text-[var(--app-text-muted)] uppercase tracking-wide">Opportunities</span>
            ` : (activeProfile && !activeProfile.institution_id && !activeProfile.company_id ? html`
              <span className="text-[10px] font-semibold text-[var(--app-text-muted)] uppercase tracking-wide">${formatRoleLabel(activeProfile.role?.name || activeProfile.role_id)}</span>
            ` : '')}
          </div>
          ${(hasMultipleProfiles || canAccessRecruiterMode) ? html`
            <svg className=${`w-4 h-4 text-[var(--app-text-muted)] shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          ` : ''}
        ` : ''}
      </button>

      ${open && isSidebar ? html`
        <div className="fixed inset-y-0 left-0 z-[55] w-[280px] bg-white text-gray-900 flex flex-col shadow-[var(--app-shadow-card)] border-r border-gray-200">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 flex-shrink-0">
            <span className="text-sm font-semibold">Switch context</span>
            <button
              onClick=${() => setOpen(false)}
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-[var(--app-radius-sm)]"
              title="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto p-4">
            ${!compact ? html`
              <div className="app-mode-card mb-4">
                <p className="text-[10px] font-semibold uppercase tracking-wide opacity-90">Active mode</p>
                <p className="text-sm font-semibold mt-0.5">${orgLabel}</p>
                <p className="text-xs opacity-90 mt-0.5">${inRecruiterMode ? 'Opportunities & recruiter outreach' : (activeProfile?.role?.name ? formatRoleLabel(activeProfile.role.name) : '')}</p>
              </div>
            ` : ''}
            <div className="space-y-1 mt-2">
            ${profiles.map(p => {
              const isActive = !inRecruiterMode && activeProfile?.id === p.id;
              const label = formatRoleLabel(p.role?.name || p.role_id) || 'Unknown';
              const ctx = getProfileContextLabel(p);
              const isExpired = p.expires_at && new Date(p.expires_at) < new Date();
              const pLogoUrl = p.institution_id && p.institution_logo_url
                ? (getInstitutionLogoUrl({ logo_url: p.institution_logo_url }) || p.institution_logo_url)
                : (p.company_id && p.company_logo_url ? (getCompanyLogoUrl({ logo_url: p.company_logo_url }) || p.company_logo_url) : null);
              const isIthrasProfile = !p.institution_id && !p.company_id;
              const displayLogoUrl = pLogoUrl || (isIthrasProfile ? ITHRAS_FALLBACK : null);
              return html`
                <button
                  key=${p.id}
                  onClick=${() => { if (!isActive && !isExpired) { onSwitchProfile?.(p.id); setOpen(false); } }}
                  disabled=${isActive || isExpired}
                  className=${`w-full text-left p-2.5 rounded-[var(--app-radius-sm)] transition-colors flex items-center gap-2 ${isActive ? 'bg-[var(--app-accent-soft)] border border-[rgba(0,113,227,0.2)]' : isExpired ? 'opacity-40 cursor-not-allowed' : 'hover:bg-[var(--app-surface-muted)]'}`}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden shrink-0 bg-[var(--app-surface)] border border-[var(--app-border-soft)]">
                    ${displayLogoUrl === ITHRAS_FALLBACK ? html`
                      <${IthrasIcon} size="28px" theme="dark" />
                    ` : displayLogoUrl ? html`
                      <img src=${displayLogoUrl} alt="" loading="lazy" className="max-h-full max-w-full object-contain" onError=${(e) => { e.target.style.display = 'none'; }} />
                    ` : html`
                      <span className="text-xs font-semibold text-[var(--app-text-muted)]">${(ctx || label || '?')[0]}</span>
                    `}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-[var(--app-text-primary)] truncate">${ctx}</p>
                    <p className="text-[10px] text-[var(--app-text-muted)] truncate">${label}</p>
                  </div>
                  ${isActive ? html`<span className="text-[9px] font-semibold text-[var(--app-accent)] uppercase shrink-0">Active</span>` : ''}
                  ${isExpired ? html`<span className="text-[9px] font-semibold text-amber-600 uppercase shrink-0">Expired</span>` : ''}
                </button>
              `;
            })}
            ${canAccessRecruiterMode ? html`
              <div className="border-t border-[var(--app-border-soft)] mt-2 pt-2">
                <button
                  onClick=${() => { navigate('hr-outreach'); setOpen(false); }}
                  className=${`w-full text-left p-2.5 rounded-[var(--app-radius-sm)] transition-colors flex items-center gap-2 ${inRecruiterMode ? 'bg-[var(--app-accent-soft)] border border-[rgba(0,113,227,0.2)]' : 'hover:bg-[var(--app-surface-muted)]'}`}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-[var(--app-accent-soft)] border border-[var(--app-border-soft)]">
                    <svg className="w-5 h-5 text-[var(--app-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-[var(--app-text-primary)]">Recruiter</p>
                    <p className="text-[10px] text-[var(--app-text-muted)]">Opportunities & recruiter outreach</p>
                  </div>
                  ${inRecruiterMode ? html`<span className="text-[9px] font-semibold text-[var(--app-accent)] uppercase shrink-0">Active</span>` : ''}
                </button>
              </div>
            ` : ''}
            </div>
          </div>
        </div>
      ` : open && !isSidebar ? html`
        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 w-72 max-h-80 overflow-y-auto bg-[var(--app-surface)] rounded-[var(--app-radius-md)] border border-[var(--app-border-soft)] shadow-[var(--app-shadow-floating)] z-[110]">
          <div className="p-2 space-y-1">
            ${profiles.map(p => {
              const isActive = !inRecruiterMode && activeProfile?.id === p.id;
              const label = formatRoleLabel(p.role?.name || p.role_id) || 'Unknown';
              const ctx = getProfileContextLabel(p);
              const isExpired = p.expires_at && new Date(p.expires_at) < new Date();
              const pLogoUrl = p.institution_id && p.institution_logo_url
                ? (getInstitutionLogoUrl({ logo_url: p.institution_logo_url }) || p.institution_logo_url)
                : (p.company_id && p.company_logo_url ? (getCompanyLogoUrl({ logo_url: p.company_logo_url }) || p.company_logo_url) : null);
              const isIthrasProfile = !p.institution_id && !p.company_id;
              const displayLogoUrl = pLogoUrl || (isIthrasProfile ? ITHRAS_FALLBACK : null);
              return html`
                <button
                  key=${p.id}
                  onClick=${() => { if (!isActive && !isExpired) { onSwitchProfile?.(p.id); setOpen(false); } }}
                  disabled=${isActive || isExpired}
                  className=${`w-full text-left p-2.5 rounded-[var(--app-radius-sm)] transition-colors flex items-center gap-2 ${isActive ? 'bg-[var(--app-accent-soft)] border border-[rgba(0,113,227,0.2)]' : isExpired ? 'opacity-40 cursor-not-allowed' : 'hover:bg-[var(--app-surface-muted)]'}`}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden shrink-0 bg-[var(--app-surface)] border border-[var(--app-border-soft)]">
                    ${displayLogoUrl === ITHRAS_FALLBACK ? html`
                      <${IthrasIcon} size="28px" theme="dark" />
                    ` : displayLogoUrl ? html`
                      <img src=${displayLogoUrl} alt="" loading="lazy" className="max-h-full max-w-full object-contain" onError=${(e) => { e.target.style.display = 'none'; }} />
                    ` : html`
                      <span className="text-xs font-semibold text-[var(--app-text-muted)]">${(ctx || label || '?')[0]}</span>
                    `}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-[var(--app-text-primary)] truncate">${ctx}</p>
                    <p className="text-[10px] text-[var(--app-text-muted)] truncate">${label}</p>
                  </div>
                  ${isActive ? html`<span className="text-[9px] font-semibold text-[var(--app-accent)] uppercase shrink-0">Active</span>` : ''}
                  ${isExpired ? html`<span className="text-[9px] font-semibold text-amber-600 uppercase shrink-0">Expired</span>` : ''}
                </button>
              `;
            })}
            ${canAccessRecruiterMode ? html`
              <div className="border-t border-[var(--app-border-soft)] mt-2 pt-2">
                <button
                  onClick=${() => { navigate('hr-outreach'); setOpen(false); }}
                  className=${`w-full text-left p-2.5 rounded-[var(--app-radius-sm)] transition-colors flex items-center gap-2 ${inRecruiterMode ? 'bg-[var(--app-accent-soft)] border border-[rgba(0,113,227,0.2)]' : 'hover:bg-[var(--app-surface-muted)]'}`}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-[var(--app-accent-soft)] border border-[var(--app-border-soft)]">
                    <svg className="w-5 h-5 text-[var(--app-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-[var(--app-text-primary)]">Recruiter</p>
                    <p className="text-[10px] text-[var(--app-text-muted)]">Opportunities & recruiter outreach</p>
                  </div>
                  ${inRecruiterMode ? html`<span className="text-[9px] font-semibold text-[var(--app-accent)] uppercase shrink-0">Active</span>` : ''}
                </button>
              </div>
            ` : ''}
          </div>
        </div>
      ` : ''}
    </div>
  `;
};

export default ModeSwitcher;
