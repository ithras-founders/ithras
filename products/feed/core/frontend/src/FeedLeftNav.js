/**
 * Feed Left Nav - Mode Switcher + Communities for use in Layout sidebar.
 * Renders in Layout (desktop) and GeneralFeedPortal (mobile).
 */
import React, { useState, useEffect, useCallback } from 'react';
import htm from 'htm';
import {
  listPrepCommunities,
  listPrepCommunityChannels,
  joinPrepCommunity,
  leavePrepCommunity,
} from '/core/frontend/src/modules/shared/services/api/preparation.js';
import ModeSwitcher from '/core/frontend/src/modules/shared/components/ModeSwitcher.js';
import { iconMap } from '/core/frontend/src/modules/shared/ui/icons/iconMap.js';

const html = htm.bind(React.createElement);

const CHANNEL_ICON_MAP = {
  SCHOOL_PI_IIMA: iconMap.trophy,
  SCHOOL_PI_IIMB: iconMap.award,
  SCHOOL_PI_XLRI: iconMap.target,
  CAT_STRATEGY: iconMap.institutions,
  WAT_REVIEW: iconMap.penLine,
  GD_REVIEW: iconMap.messageCircle,
};

const CommunitySkeleton = ({ dark = false }) => html`
  <div className=${`h-14 rounded-lg animate-pulse ${dark ? 'bg-white/10' : 'bg-slate-100'}`} />
`;

const CommunityCard = ({ community, isActive, onNavigate, onJoin, onLeave, compact, user, darkSidebar }) => {
  const cover = community.cover_image_url;
  const initial = (community.name || '?').charAt(0).toUpperCase();
  const avatarBg = darkSidebar ? 'bg-gradient-to-br from-orange-400/20 to-orange-500/30' : 'bg-gradient-to-br from-[var(--app-accent-soft)] to-[var(--app-accent)]/20';
  const avatarText = darkSidebar ? 'text-orange-400' : 'text-[var(--app-accent)]';
  const textCls = darkSidebar ? 'text-slate-300' : 'text-[var(--app-text-primary)]';
  const joinCls = darkSidebar ? 'text-indigo-400 hover:underline' : 'text-[var(--app-accent)] hover:underline';
  const cardBorder = darkSidebar ? (isActive ? 'border-indigo-500/50 bg-indigo-500/10' : 'border-white/10 hover:border-white/20') : (isActive ? 'border-[var(--app-accent)] bg-[var(--app-accent-soft)]/30' : 'border-[var(--app-border-soft)] hover:border-[var(--app-border-strong)] hover:shadow-[var(--app-shadow-card)]');
  return html`
    <div className=${`rounded-lg border transition-all duration-200 overflow-hidden ${cardBorder}`}>
      <button
        onClick=${() => onNavigate?.(`feed/community/${community.code}`)}
        className="w-full min-w-0 text-left flex items-center gap-3 p-3"
      >
        <div className=${`w-12 h-12 rounded-lg flex-shrink-0 overflow-hidden ${avatarBg} flex items-center justify-center`}>
          ${cover ? html`<img src=${cover} alt="" className="w-full h-full object-cover" />` : html`<span className=${`text-lg font-bold ${avatarText}`}>${initial}</span>`}
        </div>
        <div className="flex-1 min-w-0">
          <p className=${`font-semibold truncate ${textCls}`}>${community.name}</p>
          ${!compact && community.member_count != null ? html`<p className="text-xs text-slate-400">${community.member_count} members</p>` : null}
        </div>
      </button>
      ${user && (onJoin || onLeave) ? html`
        <div className="px-3 pb-2">
          ${community.is_joined
            ? html`<button onClick=${(e) => { e.stopPropagation(); onLeave?.(community); }} className=${darkSidebar ? 'text-xs font-medium text-slate-400 hover:text-[var(--app-danger)]' : 'text-xs font-medium text-[var(--app-text-muted)] hover:text-[var(--app-danger)]'}>Leave</button>`
            : html`<button onClick=${(e) => { e.stopPropagation(); onJoin?.(community); }} className=${`text-xs font-medium ${joinCls}`}>Join</button>`}
        </div>
      ` : null}
    </div>
  `;
};

const ChannelCard = ({ channel, isActive, onNavigate, user, darkSidebar }) => {
  const img = channel.image_url;
  const IconComponent = CHANNEL_ICON_MAP[channel.code] || iconMap.institutions;
  const activeCls = darkSidebar ? 'bg-indigo-500 text-white border-r-2 border-r-white font-semibold' : 'bg-gradient-to-r from-[var(--cobalt-soft)] to-[var(--cobalt-softer)] text-[var(--cobalt-600)] border-l-2 border-l-[var(--cobalt-600)]';
  const inactiveCls = darkSidebar ? 'text-slate-300 hover:bg-white/8 hover:text-white' : 'text-[var(--slate-600)] hover:bg-[var(--slate-100)] hover:text-[var(--feed-text-primary)]';
  return html`
    <button
      onClick=${() => onNavigate?.(`feed/communities/${channel.code}`)}
      className=${`w-full min-w-0 text-left flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all duration-200 ${isActive ? activeCls : inactiveCls}`}
    >
      <div className=${`w-8 h-8 rounded-lg flex-shrink-0 overflow-hidden flex items-center justify-center ${darkSidebar ? (isActive ? 'bg-white/20' : 'bg-white/10') : 'bg-[var(--slate-100)]'}`}>
        ${img ? html`<img src=${img} alt="" className="w-full h-full object-cover" />` : html`<${IconComponent} className=${`w-4 h-4 ${darkSidebar && isActive ? 'text-white' : 'text-[var(--cobalt-600)]'}`} />`}
      </div>
      <span className="flex-1 truncate text-sm font-medium">${channel.name}</span>
      ${user && channel.is_joined ? html`<span className=${`text-[10px] uppercase font-semibold ${darkSidebar && isActive ? 'text-white' : 'text-[var(--cobalt-600)]'}`}>Joined</span>` : null}
    </button>
  `;
};

const FeedLeftNav = ({ user, navigate, activeView, profiles, activeProfile, onSwitchProfile, collapsed, onCollapsedChange, onJoinLeave, refreshTrigger, compact = false, darkSidebar = false }) => {
  const viewParts = (activeView || 'feed').split('/').filter(Boolean);
  const communityChannel = viewParts[0] === 'feed' && viewParts[1] === 'communities' && viewParts[2] && viewParts[2] !== 'post' ? viewParts[2] : null;
  const communityCode = viewParts[0] === 'feed' && viewParts[1] === 'community' && viewParts[2] ? viewParts[2] : null;
  const isGlobalFeed = activeView === 'feed' || (viewParts[0] === 'feed' && !viewParts[1] && !viewParts[2]);
  const isCommunitiesAll = activeView === 'feed/communities' || (viewParts[1] === 'communities' && !communityChannel);

  const [communities, setCommunities] = useState([]);
  const [channels, setChannels] = useState([]);
  const [communitiesLoading, setCommunitiesLoading] = useState(true);
  const [channelsLoading, setChannelsLoading] = useState(true);

  const loadCommunities = useCallback(async () => {
    setCommunitiesLoading(true);
    try {
      const data = await listPrepCommunities();
      setCommunities(Array.isArray(data) ? data : []);
    } catch (_) {
      setCommunities([]);
    } finally {
      setCommunitiesLoading(false);
    }
  }, []);

  const loadChannels = useCallback(async () => {
    setChannelsLoading(true);
    try {
      const data = await listPrepCommunityChannels();
      setChannels(Array.isArray(data) ? data : []);
    } catch (_) {
      setChannels([]);
    } finally {
      setChannelsLoading(false);
    }
  }, []);

  const loadSidebar = useCallback(async () => {
    await Promise.all([loadCommunities(), loadChannels()]);
  }, [loadCommunities, loadChannels]);

  useEffect(() => {
    loadSidebar();
  }, [loadSidebar, refreshTrigger]);

  const handleJoinCommunity = async (comm) => {
    try {
      await joinPrepCommunity(comm.id || comm.code);
      loadSidebar();
      onJoinLeave?.();
    } catch (_) {}
  };

  const handleLeaveCommunity = async (comm) => {
    try {
      await leavePrepCommunity(comm.id || comm.code);
      loadSidebar();
      onJoinLeave?.();
    } catch (_) {}
  };

  const sidebarItem = (label, targetView, isActive, IconComp, isSecondary = false) => {
    const activeCls = darkSidebar ? 'bg-indigo-500 text-white border-r-2 border-r-white font-semibold' : 'bg-gradient-to-r from-[var(--cobalt-soft)] to-[var(--cobalt-softer)] text-[var(--cobalt-600)] border-l-2 border-l-[var(--cobalt-600)]';
    const inactiveCls = darkSidebar ? (isSecondary ? 'text-indigo-400 hover:bg-white/8 hover:text-white' : 'text-slate-300 hover:bg-white/8 hover:text-white') : 'text-[var(--slate-600)] hover:bg-[var(--slate-100)] hover:text-[var(--feed-text-primary)]';
    return html`
    <button
      onClick=${() => navigate?.(targetView)}
      className=${`w-full min-w-0 text-left flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 truncate ${isActive ? activeCls : inactiveCls}`}
    >
      ${IconComp ? html`<div className=${`w-8 h-8 rounded-lg flex-shrink-0 overflow-hidden flex items-center justify-center ${darkSidebar ? (isActive ? 'bg-white/20' : 'bg-white/10') : 'bg-[var(--slate-100)]'}`}><${IconComp} className=${`w-4 h-4 ${darkSidebar && isActive ? 'text-white' : (isSecondary ? 'text-indigo-400' : 'text-[var(--cobalt-600)]')}`} /></div>` : null}
      <span className="flex-1 truncate">${label}</span>
    </button>
  `;
  };

  const joinedCommunities = communities.filter((c) => c.is_joined);
  const exploreCommunities = communities.filter((c) => !c.is_joined);
  const displayCommunities = joinedCommunities.length > 0 ? joinedCommunities : communities;

  const content = html`
    <div className="space-y-6">
      ${(profiles?.length >= 1 || onSwitchProfile) ? html`
      <div className=${`mb-3 w-full ${collapsed ? 'flex justify-center' : ''}`}>
        <${ModeSwitcher}
          profiles=${profiles || []}
          activeProfile=${activeProfile}
          onSwitchProfile=${onSwitchProfile}
          navigate=${navigate}
          user=${user}
          activeView=${activeView}
          placement="sidebar"
          compact=${collapsed}
        />
      </div>
      ` : null}
      <div>
        <h3 className=${`text-xs font-bold uppercase tracking-wider px-2 mb-2 ${darkSidebar ? 'text-slate-300' : 'text-[var(--slate-500)]'}`}>My Communities</h3>
        <div className="space-y-1.5">
          ${sidebarItem('Global', 'feed', isGlobalFeed, iconMap.globe, false)}
          ${sidebarItem('All Channels', 'feed/communities', isCommunitiesAll, iconMap.layoutList, true)}
          ${communitiesLoading
            ? [1, 2].map((i) => html`<${CommunitySkeleton} key=${i} dark=${darkSidebar} />`)
            : displayCommunities.map((comm) => html`
                <div key=${comm.id || comm.code} className="space-y-0.5">
                  <${CommunityCard}
                    community=${comm}
                    isActive=${communityCode === comm.code}
                    onNavigate=${navigate}
                    onJoin=${handleJoinCommunity}
                    onLeave=${handleLeaveCommunity}
                    user=${user}
                    compact=${true}
                    darkSidebar=${darkSidebar}
                  />
                  ${comm.channels && comm.channels.length > 0 ? html`
                    <div className=${`ml-2 pl-2 border-l space-y-0.5 mt-1 ${darkSidebar ? 'border-white/20' : 'border-[var(--app-border-soft)]'}`}>
                      ${comm.channels.slice(0, 4).map((ch) => html`
                        <${ChannelCard}
                          key=${ch.code}
                          channel=${ch}
                          isActive=${communityChannel === ch.code}
                          onNavigate=${navigate}
                          user=${user}
                          darkSidebar=${darkSidebar}
                        />
                      `)}
                    </div>
                  ` : null}
                </div>
              `)}
        </div>
      </div>
      <div>
        <h3 className=${`text-xs font-bold uppercase tracking-wider px-2 mb-2 ${darkSidebar ? 'text-slate-300' : 'text-[var(--slate-500)]'}`}>Explore</h3>
        <div className="space-y-1.5">
          ${communitiesLoading
            ? [1, 2].map((i) => html`<${CommunitySkeleton} key=${`ex-${i}`} dark=${darkSidebar} />`)
            : exploreCommunities.length > 0
              ? exploreCommunities.map((comm) => html`
                  <${CommunityCard}
                    key=${comm.id || comm.code}
                    community=${comm}
                    isActive=${false}
                    onNavigate=${navigate}
                    onJoin=${handleJoinCommunity}
                    onLeave=${handleLeaveCommunity}
                    user=${user}
                    compact=${true}
                    darkSidebar=${darkSidebar}
                  />
                `)
              : channels.length > 0
                ? channels.slice(0, 4).map((c) => html`
                    <${ChannelCard} key=${c.code} channel=${c} isActive=${communityChannel === c.code} onNavigate=${navigate} user=${user} darkSidebar=${darkSidebar} />
                  `)
                : html`<p className=${`text-sm px-3 py-2 ${darkSidebar ? 'text-slate-400' : 'text-[var(--slate-500)]'}`}>No communities yet.</p>`}
        </div>
      </div>
    </div>
  `;

  if (compact) {
    return content;
  }

  if (collapsed) {
    const activeCls = darkSidebar ? 'bg-indigo-500 text-white' : 'bg-[var(--cobalt-soft)] text-[var(--cobalt-600)]';
    const inactiveCls = darkSidebar ? 'text-slate-300 hover:bg-white/8 hover:text-white' : 'text-[var(--slate-500)] hover:bg-[var(--slate-100)]';
    return html`
      <div className="flex flex-col items-center gap-2">
        <button onClick=${() => navigate?.('feed')} className=${`p-2 rounded-lg ${isGlobalFeed ? activeCls : inactiveCls}`} title="Global">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0v6a2 2 0 01-2 2m0 0V5a2 2 0 012-2m0 6a2 2 0 012 2v6m-6-4a2 2 0 012-2m0 6V5a2 2 0 012 2" /></svg>
        </button>
        <button onClick=${() => navigate?.('feed/communities')} className=${`p-2 rounded-lg ${isCommunitiesAll ? activeCls : inactiveCls}`} title="All Channels">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
      </div>
    `;
  }

  return content;
};

export default FeedLeftNav;
export { FeedLeftNav };
