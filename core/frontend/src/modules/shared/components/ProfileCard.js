import React from 'react';
import htm from 'htm';
import { UserPlus, UserCheck } from 'lucide-react';
import { useNetworkStatus } from '../hooks/useNetworkStatus.js';

const html = htm.bind(React.createElement);

const ProfileCard = ({ profile, onClick, viewer, networkStatus, onNetworkChange, showNetworkButton: showNetworkButtonProp = true }) => {
  const profileId = profile?.id;
  const isOwnProfile = viewer?.id && profileId && viewer.id === profileId;
  const showNetworkButton =
    showNetworkButtonProp && viewer && profileId && !isOwnProfile;

  const { loading, toggle, label, status } = useNetworkStatus(
    profileId,
    viewer,
    networkStatus,
    onNetworkChange
  );

  const name = profile?.name || profile?.email || 'User';
  const headline = profile?.headline || profile?.student_subtype || profile?.role || '';
  const photoUrl = profile?.profile_photo_url || null;
  const initial = name.trim().charAt(0).toUpperCase();

  const handleNetworkClick = (e) => {
    e.stopPropagation();
    toggle();
  };

  return html`
    <div
      onClick=${onClick}
      className="bg-[var(--app-surface)] rounded-2xl border border-[var(--app-border-soft)] p-4 shadow-[var(--app-shadow-subtle)] hover:border-[var(--app-accent)]/40 hover:shadow-[var(--app-shadow-card)] transition-all duration-200 cursor-pointer border-l-4 border-l-transparent hover:border-l-[var(--app-accent)]"
    >
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--app-accent-soft)] to-[var(--app-accent)]/10 flex items-center justify-center flex-shrink-0 overflow-hidden ring-2 ring-[var(--app-border-soft)]">
          ${photoUrl ? html`<img src=${photoUrl} alt=${name} className="w-full h-full object-cover" />` : html`<span className="text-lg font-semibold text-[var(--app-accent)]">${initial}</span>`}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-[var(--app-text-primary)] truncate">${name}</h3>
          ${headline ? html`<p className="text-sm text-[var(--app-text-secondary)] truncate mt-0.5">${headline}</p>` : null}
        </div>
        ${showNetworkButton ? html`
          <button
            type="button"
            onClick=${handleNetworkClick}
            disabled=${loading}
            title=${label}
            className="flex-shrink-0 p-2 rounded-lg border border-[var(--app-border-soft)] bg-[var(--app-surface)] text-[var(--app-text-primary)] hover:bg-[var(--app-accent-soft)] hover:border-[var(--app-accent)]/50 transition-colors disabled:opacity-60"
          >
            ${status?.in_network || status?.following
              ? html`<${UserCheck} className="w-5 h-5" strokeWidth={1.5} />`
              : html`<${UserPlus} className="w-5 h-5" strokeWidth={1.5} />`}
          </button>
        ` : null}
      </div>
    </div>
  `;
};

export default ProfileCard;
