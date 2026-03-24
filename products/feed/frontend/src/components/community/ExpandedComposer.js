/**
 * ExpandedComposer - Full post form inside community shell (discussion only).
 */
import React, { useState, useRef, useEffect } from 'react';
import htm from 'htm';
import { createPost } from '../../services/feedApi.js';

const html = htm.bind(React.createElement);

const TagsInput = ({ tags, onChange, placeholder = 'Add tags…' }) => {
  const [val, setVal] = useState('');
  const [showInput, setShowInput] = useState(false);
  const inputRef = useRef(null);

  const add = () => {
    const v = val.trim();
    if (v && !tags.includes(v)) {
      onChange([...tags, v]);
      setVal('');
      setShowInput(false);
    }
  };

  useEffect(() => {
    if (showInput && inputRef.current) inputRef.current.focus();
  }, [showInput]);

  return html`
    <div className="flex flex-wrap items-center gap-1.5">
      ${tags.map((t, i) => html`
        <span
          key=${i}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors border"
          style=${{ background: 'var(--app-surface-subtle)', color: 'var(--app-text-secondary)', borderColor: 'var(--app-border-soft)' }}
        >
          ${t}
          <button type="button" onClick=${() => onChange(tags.filter((_, idx) => idx !== i))} className="hover:opacity-70 leading-none p-0.5 rounded" aria-label="Remove tag">×</button>
        </span>
      `)}
      ${showInput ? html`
        <input
          ref=${inputRef}
          type="text"
          value=${val}
          onChange=${(e) => setVal(e.target.value)}
          onKeyDown=${(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } if (e.key === 'Escape') { setShowInput(false); setVal(''); } }}
          onBlur=${() => { if (!val.trim()) setShowInput(false); add(); }}
          placeholder="Tag name"
          className="w-20 py-1 px-2 text-xs rounded-lg outline-none ith-focus-ring"
          style=${{ border: '1px solid var(--app-border-soft)', background: 'var(--app-surface-muted)', color: 'var(--app-text-primary)' }}
        />
      ` : html`
        <button
          type="button"
          onClick=${() => setShowInput(true)}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium transition-colors ith-focus-ring"
          style=${{ color: 'var(--app-text-muted)' }}
          onMouseEnter=${(e) => { e.currentTarget.style.background = 'var(--app-surface-hover)'; }}
          onMouseLeave=${(e) => { e.currentTarget.style.background = 'transparent'; }}
        >
          ${placeholder}
        </button>
      `}
    </div>
  `;
};

const ExpandedComposer = ({
  onSuccess,
  onCancel,
  communityId,
  channelId,
  community,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const channels = community?.channels || [];
  const hasChannels = community?.has_channels && channels.length > 0;
  const selectedChannel = hasChannels ? (channelId || channels[0]?.id) : null;
  const channelName = channels.find((c) => c.id === selectedChannel)?.name || 'General';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!communityId) return;
    if (!content.trim()) {
      setError('Add some content.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await createPost({
        communityId,
        channelId: hasChannels ? selectedChannel : null,
        type: 'discussion',
        title: title.trim(),
        content: content.trim(),
        tags,
      });
      setTitle('');
      setContent('');
      setTags([]);
      onSuccess?.();
    } catch (err) {
      setError(err.message || 'Failed to post');
    } finally {
      setLoading(false);
    }
  };

  const communityInitials = (community?.name || 'C').slice(0, 2).toUpperCase();

  return html`
    <form onSubmit=${handleSubmit} className="space-y-4">
      ${error ? html`
        <div className="px-4 py-2.5 rounded-xl text-sm" style=${{ background: 'var(--app-danger-soft)', color: 'var(--app-danger)' }}>${error}</div>
      ` : null}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.14em]" style=${{ color: 'var(--app-text-muted)' }}>Posting in</span>
          <span
            className="inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium"
            style=${{ borderColor: 'var(--app-border-soft)', background: 'var(--app-surface-muted)', color: 'var(--app-text-secondary)' }}
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold" style=${{ background: 'var(--app-accent)', color: '#ffffff' }}>
              ${communityInitials}
            </span>
            <span className="max-w-[240px] truncate sm:max-w-none">${community?.name || 'Community'} · ${channelName}</span>
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4 shrink-0" style=${{ color: 'var(--app-text-muted)' }}>
              <path d="m5 7.5 5 5 5-5" />
            </svg>
          </span>
        </div>
        ${onCancel
          ? html`
              <button
                type="button"
                onClick=${onCancel}
                className="text-xs font-semibold uppercase tracking-wider ith-focus-ring rounded-lg px-2 py-1"
                style=${{ color: 'var(--app-text-muted)' }}
              >
                Collapse
              </button>
            `
          : null}
      </div>

      <input
        type="text"
        value=${title}
        onChange=${(e) => setTitle(e.target.value)}
        placeholder="Title (optional)"
        className="h-12 w-full rounded-2xl border px-4 text-sm outline-none transition placeholder:opacity-50 ith-focus-ring"
        style=${{ borderColor: 'var(--app-border-soft)', background: 'var(--app-surface-muted)', color: 'var(--app-text-primary)' }}
      />

      <textarea
        value=${content}
        onChange=${(e) => setContent(e.target.value)}
        placeholder="What would you like to share?"
        rows=${4}
        className="w-full rounded-2xl border px-4 py-3 text-sm outline-none transition resize-none placeholder:opacity-50 ith-focus-ring"
        style=${{ borderColor: 'var(--app-border-soft)', background: 'var(--app-surface-muted)', color: 'var(--app-text-primary)' }}
        required
      />

      <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
        <${TagsInput} tags=${tags} onChange=${setTags} placeholder="+ Add tag" />
        <button
          type="submit"
          disabled=${loading || !content.trim()}
          className="rounded-2xl px-6 py-2.5 text-sm font-semibold text-white transition disabled:opacity-45 disabled:cursor-not-allowed ith-focus-ring"
          style=${{ background: 'var(--app-accent)', boxShadow: 'var(--app-shadow-primary)' }}
        >
          ${loading ? 'Posting…' : 'Post'}
        </button>
      </div>
    </form>
  `;
};

export default ExpandedComposer;
