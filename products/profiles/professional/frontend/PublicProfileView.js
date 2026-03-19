/**
 * Public profile view - read-only by slug. Route: /p/{slug}
 */
import React, { useState, useEffect } from 'react';
import htm from 'htm';
import { getPublicProfile } from '/shared/services/index.js';
import { getProfileOverlap } from '/products/network/frontend/src/services/networkApi.js';
import IthrasLogo from '/shared/components/IthrasLogo.js';
import ProfileLayout from '/shared/components/ProfileLayout.js';
import ConnectionButton from '/products/network/frontend/src/components/ConnectionButton.js';
import OverlapBadge from '/products/network/frontend/src/components/OverlapBadge.js';

const html = htm.bind(React.createElement);

const PublicProfileView = ({ slug, user, onBack }) => {
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

  if (loading) return html`
    <div className="min-h-screen flex flex-col bg-[var(--app-bg)]">
      <header className="flex-shrink-0 flex items-center justify-between px-4 md:px-6 py-3 border-b border-[var(--app-border-soft)] bg-[var(--app-surface)]">
        <${IthrasLogo} size="sm" theme="dark" />
      </header>
      <div className="flex-1 flex items-center justify-center text-[var(--app-text-muted)]">Loading...</div>
    </div>
  `;

  if (error && !profile) {
    return html`
      <div className="min-h-screen flex flex-col bg-[var(--app-bg)]">
        <header className="flex-shrink-0 flex items-center justify-between px-4 md:px-6 py-3 border-b border-[var(--app-border-soft)] bg-[var(--app-surface)]">
          <${IthrasLogo} size="sm" theme="dark" />
        </header>
        <main className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <h1 className="text-2xl font-semibold text-[var(--app-text-primary)] mb-2">Profile not found</h1>
          <p className="text-[var(--app-text-secondary)] mb-8 max-w-md">This profile doesn't exist or is no longer available.</p>
          <a href="/" className="inline-flex items-center justify-center px-6 py-3 rounded-xl font-medium text-white bg-[var(--app-accent)] hover:opacity-90 transition-opacity">
            Back to sign in
          </a>
        </main>
      </div>
    `;
  }

  const profileConnectSlot = !user ? null : overlapLoading ? html`
    <div className="mt-3 py-2 text-sm" style=${{ color: 'var(--app-text-muted)' }}>Loading...</div>
  ` : overlap?.target_user_id ? html`
    <${ConnectionButton}
      userId=${overlap.target_user_id}
      connectionStatus=${overlap.connection_status}
      isFollowing=${overlap.is_following}
      followId=${overlap.follow_id}
      onConnectionSent=${() => getProfileOverlap(slug).then(setOverlap)}
      onFollowChange=${() => getProfileOverlap(slug).then(setOverlap)}
    />
  ` : html`
    <button className="mt-3 w-full rounded-xl py-2.5 font-medium text-white transition-opacity hover:opacity-90" style=${{ background: '#1E6EF2' }}>
      Connect
    </button>
  `;

  const overlapBadges = overlap?.overlap_badges || [];
  const mutualConnections = overlap?.mutual_connections || [];
  const mutualCount = overlap?.mutual_connections_count ?? 0;

  return html`
    <div className="min-h-screen flex flex-col bg-[var(--app-bg)]">
      <header className="flex-shrink-0 flex items-center justify-between px-4 md:px-6 py-3 border-b border-[var(--app-border-soft)] bg-[var(--app-surface)]">
        <${IthrasLogo} size="sm" theme="dark" />
        ${onBack ? html`<button onClick=${onBack} className="text-sm font-medium text-[var(--app-accent)]">Go back</button>` : html`<a href="/" className="text-sm font-medium text-[var(--app-text-secondary)]">Ithras</a>`}
      </header>
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
};

export default PublicProfileView;
