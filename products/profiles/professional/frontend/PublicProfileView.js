/**
 * Public profile view - read-only by slug. Route: /p/{slug}
 * Uses AppShell + Feed sidebar + FeedLayout right rail (same chrome as the rest of the app).
 */
import React, { useState, useEffect } from 'react';
import htm from 'htm';
import { getPublicProfile } from '/shared/services/index.js';
import { getProfileOverlap } from '/products/network/frontend/src/services/networkApi.js';
import { AppShell } from '/shared/components/appShell/index.js';
import FeedSidebar from '/products/feed/frontend/src/components/FeedSidebar.js';
import FeedLayout from '/products/feed/frontend/src/components/FeedLayout.js';
import ProfileLayout from '/shared/components/ProfileLayout.js';
import ConnectionButton from '/products/network/frontend/src/components/ConnectionButton.js';
import ProfilePublicRightRail from '/products/profiles/professional/frontend/ProfilePublicRightRail.js';

const html = htm.bind(React.createElement);

const PublicProfileView = ({ slug, user, onLogout }) => {
  const [profile, setProfile] = useState(null);
  const [education, setEducation] = useState([]);
  const [experience, setExperience] = useState([]);
  const [additionalResponsibilities, setAdditionalResponsibilities] = useState([]);
  const [otherAchievements, setOtherAchievements] = useState([]);
  const [overlap, setOverlap] = useState(null);
  const [overlapLoading, setOverlapLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!slug) return;
    getPublicProfile(slug)
      .then((res) => {
        setProfile(res?.profile);
        setEducation(res?.education || []);
        setExperience(res?.experience || []);
        setAdditionalResponsibilities(res?.additional_responsibilities || []);
        setOtherAchievements(res?.other_achievements || []);
      })
      .catch((err) => setError(err.message || 'Profile not found'))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (!slug || !user) return;
    setOverlapLoading(true);
    getProfileOverlap(slug)
      .then((data) => setOverlap(data))
      .catch(() => setOverlap(null))
      .finally(() => setOverlapLoading(false));
  }, [slug, user]);

  const feedSidebar = html`
    <${FeedSidebar} activeView="" onNavigate=${() => {}} pathPrefix="/feed" showSettings=${Boolean(user)} onLogout=${onLogout} />
  `;

  const overlapBadges = user ? overlap?.overlap_badges || [] : [];
  const mutualConnections = user ? overlap?.mutual_connections || [] : [];
  const mutualCount = user ? overlap?.mutual_connections_count ?? 0 : 0;
  const viewedName = profile?.full_name || '';

  const profileConnectSlot = !user
    ? null
    : overlapLoading
      ? html`<div className="mt-3 py-2 text-sm" style=${{ color: 'var(--app-text-muted)' }}>Loading...</div>`
      : overlap?.target_user_id
        ? html`
            <${ConnectionButton}
              userId=${overlap.target_user_id}
              connectionStatus=${overlap.connection_status}
              isFollowing=${overlap.is_following}
              followId=${overlap.follow_id}
              onConnectionSent=${() => getProfileOverlap(slug).then(setOverlap)}
              onFollowChange=${() => getProfileOverlap(slug).then(setOverlap)}
            />
          `
        : html`
            <button
              type="button"
              className="mt-3 w-full rounded-xl py-2.5 font-medium text-white transition-opacity hover:opacity-90"
              style=${{ background: 'var(--app-accent)' }}
            >
              Connect
            </button>
          `;

  const rightRail = html`
    <${ProfilePublicRightRail}
      user=${user}
      mutualConnections=${mutualConnections}
      mutualCount=${mutualCount}
      overlapBadges=${overlapBadges}
      viewedProfileName=${viewedName}
    />
  `;

  const profileBody = html`
    <div className="px-1 sm:px-2 max-w-[1600px] mx-auto w-full">
      <p className="text-xs font-medium mb-3" style=${{ color: 'var(--app-text-muted)' }}>
        <strong style=${{ color: 'var(--app-text-secondary)' }}>Public profile</strong>
        ${user ? ' — read-only for visitors.' : ' — sign in for connect, mutuals, and more context.'}
      </p>
      <${ProfileLayout}
        profile=${profile}
        education=${education}
        experience=${experience}
        additionalResponsibilities=${additionalResponsibilities}
        otherAchievements=${otherAchievements}
        isOwnProfile=${false}
        profileConnectSlot=${profileConnectSlot}
        overlapBadges=${overlapBadges}
        mutualConnections=${mutualConnections}
        mutualCount=${mutualCount}
      />
    </div>
  `;

  if (loading) {
    return html`
      <${AppShell}
        user=${user}
        onLogout=${onLogout}
        navItems=${[]}
        showSettings=${Boolean(user)}
        sidebarContent=${feedSidebar}
        searchPlaceholder="Search…"
      >
        <${FeedLayout} leftSidebar=${null} rightSidebar=${rightRail}>
          <div className="flex items-center justify-center min-h-[40vh] text-[var(--app-text-muted)] px-4">Loading profile…</div>
        </${FeedLayout}>
      </${AppShell}>
    `;
  }

  if (error && !profile) {
    return html`
      <${AppShell}
        user=${user}
        onLogout=${onLogout}
        navItems=${[]}
        showSettings=${Boolean(user)}
        sidebarContent=${feedSidebar}
        searchPlaceholder="Search…"
      >
        <${FeedLayout} leftSidebar=${null} rightSidebar=${rightRail}>
          <main className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center">
            <h1 className="text-2xl font-semibold text-[var(--app-text-primary)] mb-2">Profile not found</h1>
            <p className="text-[var(--app-text-secondary)] mb-8 max-w-md">This profile does not exist or is no longer available.</p>
            <a
              href="/"
              onClick=${(e) => {
                e.preventDefault();
                window.history.pushState(null, '', '/');
                window.dispatchEvent(new CustomEvent('ithras:path-changed'));
              }}
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl font-medium text-white bg-[var(--app-accent)] hover:opacity-90 transition-opacity"
            >
              ${user ? 'Home' : 'Back to sign in'}
            </a>
          </main>
        </${FeedLayout}>
      </${AppShell}>
    `;
  }

  return html`
    <${AppShell}
      user=${user}
      onLogout=${onLogout}
      navItems=${[]}
      showSettings=${Boolean(user)}
      sidebarContent=${feedSidebar}
      searchPlaceholder="Search…"
    >
      <${FeedLayout} leftSidebar=${null} rightSidebar=${rightRail}>${profileBody}</${FeedLayout}>
    </${AppShell}>
  `;
};

export default PublicProfileView;
