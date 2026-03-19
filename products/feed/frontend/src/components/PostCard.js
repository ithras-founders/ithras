/**
 * PostCard - Single post display with context, reactions, comments, save.
 */
import React, { useState } from 'react';
import htm from 'htm';
import { addReaction, removeReaction, savePost, unsavePost, markUseful } from '../services/feedApi.js';

const html = htm.bind(React.createElement);

const formatTime = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diff = (now - d) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString();
};

const PostCard = ({
  post,
  onRefresh,
  isSaved,
  onSaveChange,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const contentPreview = post.content?.length > 200 && !expanded
    ? post.content.slice(0, 200) + '...'
    : post.content;

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      if (isSaved) {
        await unsavePost(post.id);
        onSaveChange?.(false);
      } else {
        await savePost(post.id);
        onSaveChange?.(true);
      }
      onRefresh?.();
    } catch (_) {}
    setSaving(false);
  };

  const typeLabel = (post.type || 'discussion').replace(/^./, (c) => c.toUpperCase());

  return html`
    <article
      className="rounded-xl border p-5"
      style=${{ borderColor: 'var(--app-border-soft)', background: 'var(--app-surface)' }}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-sm mb-1" style=${{ color: 'var(--app-text-muted)' }}>
            <span key="community" className="font-medium" style=${{ color: 'var(--app-text-primary)' }}>${post.community_name || 'Community'}</span>
            ${post.channel_name ? html`<span key="sep">·</span><span key="channel">${post.channel_name}</span>` : null}
          </div>
          <div className="flex items-center gap-2 text-xs" style=${{ color: 'var(--app-text-muted)' }}>
            <span>${post.author_name || 'Anonymous'}</span>
            <span>·</span>
            <span>${formatTime(post.created_at)}</span>
            <span
              className="px-2 py-0.5 rounded text-xs"
              style=${{ background: 'var(--app-surface-subtle)', color: 'var(--app-text-secondary)' }}
            >
              ${typeLabel}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick=${handleSave}
          disabled=${saving}
          className="p-1.5 rounded hover:bg-[var(--app-surface-hover)]"
          style=${{ color: isSaved ? 'var(--app-accent)' : 'var(--app-text-muted)' }}
          title=${isSaved ? 'Unsave' : 'Save'}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill=${isSaved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
            <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
          </svg>
        </button>
      </div>
      ${post.title ? html`
        <h4 className="text-base font-semibold mb-2" style=${{ color: 'var(--app-text-primary)' }}>${post.title}</h4>
      ` : null}
      <div className="text-sm leading-relaxed mb-4" style=${{ color: 'var(--app-text-secondary)' }}>
        ${contentPreview}
        ${post.content?.length > 200 && !expanded ? html`
          <button
            type="button"
            onClick=${() => setExpanded(true)}
            className="ml-1 text-[var(--app-accent)] hover:underline"
          >
            Read more
          </button>
        ` : null}
      </div>
      ${(post.tags || []).length > 0 ? html`
        <div className="flex flex-wrap gap-1.5 mb-4">
          ${(post.tags || []).map((t, i) => html`
            <span key=${`tag-${i}-${String(t)}`} className="px-2 py-0.5 rounded text-xs" style=${{ background: 'var(--app-accent-soft)', color: 'var(--app-accent)' }}>${t}</span>
          `)}
        </div>
      ` : null}
      <div className="flex items-center gap-4 text-sm" style=${{ color: 'var(--app-text-muted)' }}>
        <span>${post.comment_count || 0} comments</span>
        ${post.type === 'question' ? html`
          <button
            type="button"
            onClick=${async () => { try { await markUseful(post.id); onRefresh?.(); } catch (_) {} }}
            className="hover:text-[var(--app-accent)]"
          >
            Mark useful
          </button>
        ` : null}
      </div>
    </article>
  `;
};

export default PostCard;
