/**
 * Search result cards + section chrome (shared by overlay and full page).
 */
import React from 'react';
import htm from 'htm';
import { X, Users, Hash, MessageSquare, Building2, Landmark, Layers } from 'lucide-react';

const html = htm.bind(React.createElement);

export function navigateToSearchResult(href, { onClose } = {}) {
  if (!href) return;
  onClose?.();
  window.history.pushState(null, '', href);
  window.dispatchEvent(new CustomEvent('ithras:path-changed'));
}

export const FilterChip = ({ label, value, onRemove }) => html`
  <span
    className="inline-flex items-center gap-1 pl-2.5 pr-1 py-0.5 rounded-full text-xs font-medium border"
    style=${{ borderColor: 'var(--app-border-strong)', background: 'var(--app-surface-subtle)', color: 'var(--app-text-primary)' }}
  >
    <span className="text-[var(--app-text-muted)]">${label}:</span>
    ${value}
    <button
      type="button"
      className="p-0.5 rounded-full hover:bg-[var(--app-surface-hover)]"
      onClick=${onRemove}
      aria-label=${`Remove ${label} filter`}
    >
      <${X} size=${12} />
    </button>
  </span>
`;

export const PersonCard = ({ item, onNavigate }) => html`
  <button
    type="button"
    onClick=${() => onNavigate(item.href)}
    className="w-full text-left p-3 rounded-xl border transition-colors hover:bg-[var(--app-surface-hover)]"
    style=${{ borderColor: 'var(--app-border-soft)' }}
  >
    <div className="flex gap-3">
      <div
        className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-semibold"
        style=${{ background: 'var(--app-accent-soft)', color: 'var(--app-accent)' }}
      >
        ${(item.full_name || '?').slice(0, 2).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-[var(--app-text-primary)] truncate">${item.full_name}</p>
        <p className="text-sm text-[var(--app-text-secondary)] truncate">
          ${item.headline || [item.current_org, item.function].filter(Boolean).join(' · ') || '—'}
        </p>
        <p className="text-xs text-[var(--app-text-muted)] mt-0.5 truncate">
          ${[item.institution_name, item.graduation_year ? `'${String(item.graduation_year).slice(-2)}` : ''].filter(Boolean).join(' ')}
        </p>
        ${item.mutual_connections || item.mutual_communities
          ? html`<p className="text-xs text-[var(--app-accent)] mt-1">
              ${item.mutual_connections ? `${item.mutual_connections} mutual connection${item.mutual_connections !== 1 ? 's' : ''}` : ''}
              ${item.mutual_connections && item.mutual_communities ? ' · ' : ''}
              ${item.mutual_communities ? `${item.mutual_communities} shared communit${item.mutual_communities !== 1 ? 'ies' : 'y'}` : ''}
            </p>`
          : null}
      </div>
    </div>
  </button>
`;

export const CommunityCard = ({ item, onNavigate }) => html`
  <button
    type="button"
    onClick=${() => onNavigate(item.href)}
    className="w-full text-left p-3 rounded-xl border transition-colors hover:bg-[var(--app-surface-hover)]"
    style=${{ borderColor: 'var(--app-border-soft)' }}
  >
    <div className="flex justify-between gap-2">
      <p className="font-semibold text-[var(--app-text-primary)]">${item.name}</p>
      <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full flex-shrink-0" style=${{ background: 'var(--app-accent-soft)', color: 'var(--app-accent)' }}>
        ${item.type || 'community'}
      </span>
    </div>
    <p className="text-xs text-[var(--app-text-muted)] mt-1">${item.member_count?.toLocaleString?.() || item.member_count || 0} members</p>
    ${item.description ? html`<p className="text-sm text-[var(--app-text-secondary)] mt-1 line-clamp-2">${item.description}</p>` : null}
  </button>
`;

export const PostCard = ({ item, onNavigate }) => html`
  <button
    type="button"
    onClick=${() => onNavigate(item.href)}
    className="w-full text-left p-3 rounded-xl border transition-colors hover:bg-[var(--app-surface-hover)]"
    style=${{ borderColor: 'var(--app-border-soft)' }}
  >
    <p className="text-xs text-[var(--app-text-muted)]">${item.author_name} · ${item.community_name}${item.channel_name ? ` · ${item.channel_name}` : ''}</p>
    <p className="font-medium text-[var(--app-text-primary)] mt-1 line-clamp-2">${item.title || item.snippet || 'Post'}</p>
    ${item.snippet && item.title ? html`<p className="text-sm text-[var(--app-text-secondary)] mt-1 line-clamp-2">${item.snippet}</p>` : null}
    <p className="text-xs text-[var(--app-text-muted)] mt-2">
      ${item.useful_count || 0} useful · ${item.comment_count || 0} comments
    </p>
  </button>
`;

export const EntityRow = ({ item, onNavigate, subtitle }) => html`
  <button
    type="button"
    onClick=${() => onNavigate(item.href)}
    className="w-full flex items-center gap-3 p-2.5 rounded-lg text-left hover:bg-[var(--app-surface-hover)]"
  >
    <div className="w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center bg-[var(--app-surface-subtle)] text-[var(--app-text-secondary)]">
      <${Building2} size=${16} />
    </div>
    <div className="min-w-0">
      <p className="font-medium text-[var(--app-text-primary)] truncate">${item.name}</p>
      <p className="text-xs text-[var(--app-text-muted)]">${subtitle}</p>
    </div>
  </button>
`;

export const InstitutionEntityRow = ({ item, onNavigate, subtitle }) => html`
  <button
    type="button"
    onClick=${() => onNavigate(item.href)}
    className="w-full flex items-center gap-3 p-2.5 rounded-lg text-left hover:bg-[var(--app-surface-hover)]"
  >
    <div className="w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center bg-[var(--app-surface-subtle)] text-[var(--app-text-secondary)]">
      <${Landmark} size=${16} />
    </div>
    <div className="min-w-0">
      <p className="font-medium text-[var(--app-text-primary)] truncate">${item.name}</p>
      <p className="text-xs text-[var(--app-text-muted)]">${subtitle}</p>
    </div>
  </button>
`;

export const Section = ({ title, icon: Icon, children, total, onViewAll, showViewAll }) => html`
  <div className="mb-6">
    <div className="flex items-center justify-between mb-2 px-1">
      <div className="flex items-center gap-2 text-sm font-semibold text-[var(--app-text-secondary)]">
        ${Icon ? html`<${Icon} size=${16} />` : null}
        <span>${title}</span>
        ${total != null ? html`<span className="text-[var(--app-text-muted)] font-normal">(${total})</span>` : null}
      </div>
      ${showViewAll && onViewAll
        ? html`<button type="button" className="text-xs font-medium text-[var(--app-accent)] hover:underline" onClick=${onViewAll}>View all</button>`
        : null}
    </div>
    <div className="space-y-2">${children}</div>
  </div>
`;

export const SkeletonBlock = () => html`
  <div className="space-y-2 animate-pulse">
    ${[1, 2, 3].map((i) => html`<div key=${i} className="h-16 rounded-xl bg-[var(--app-surface-subtle)]" />`)}
  </div>
`;
