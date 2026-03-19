/**
 * ExpandedComposer - Premium conversation starter.
 * Post type chips, body-first, progressive disclosure.
 */
import React, { useState, useRef, useEffect } from 'react';
import htm from 'htm';
import { createPost } from '../../services/feedApi.js';
import { POST_TYPES } from '../../types.js';

const html = htm.bind(React.createElement);

const POST_TYPE_CHIPS = [
  { key: 'discussion', label: 'Discussion' },
  { key: 'question', label: 'Question' },
  { key: 'announcement', label: 'Announcement' },
];

const HELPER_PROMPTS = {
  discussion: 'Share context, ideas, or start a conversation.',
  question: 'Ask something specific to get helpful answers.',
  resource: 'Share a resource with a brief summary.',
  announcement: 'Share important updates with the community.',
};

const TagIcon = () => html`<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/><path d="M7 7h.01"/></svg>`;
const AttachIcon = () => html`<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>`;
const EmojiIcon = () => html`<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>`;

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
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors"
          style=${{ background: 'rgba(0,0,0,0.04)', color: 'var(--app-text-secondary)' }}
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
          className="w-20 py-1 px-2 text-xs rounded-lg border-0 bg-transparent focus:ring-1 focus:ring-[var(--app-accent)] focus:outline-none"
          style=${{ border: '1px solid var(--app-border-soft)' }}
        />
      ` : html`
        <button
          type="button"
          onClick=${() => setShowInput(true)}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium transition hover:bg-[rgba(0,0,0,0.04)]"
          style=${{ color: '#64748b' }}
        >
          ${placeholder}
        </button>
      `}
    </div>
  `;
};

const ExpandedComposer = ({ onSuccess, onCancel, communityId, channelId, community }) => {
  const [postType, setPostType] = useState('discussion');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const textareaRef = useRef(null);

  const channels = community?.channels || [];
  const hasChannels = community?.has_channels && channels.length > 0;
  const selectedChannel = hasChannels ? (channelId || channels[0]?.id) : null;
  const channelName = channels.find((c) => c.id === selectedChannel)?.name || 'General';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!communityId) return;
    setLoading(true);
    setError('');
    try {
      await createPost({
        communityId,
        channelId: hasChannels ? selectedChannel : null,
        type: postType,
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

  const helperPrompt = HELPER_PROMPTS[postType] || HELPER_PROMPTS.discussion;
  const communityShortName = (community?.name || '').slice(0, 28) + ((community?.name || '').length > 28 ? '…' : '');
  const communityInitials = (community?.name || 'C').slice(0, 2).toUpperCase();

  return html`
    <form onSubmit=${handleSubmit} className="space-y-4">
      ${error ? html`
        <div className="px-4 py-2.5 rounded-xl text-sm" style=${{ background: 'var(--app-danger-soft)', color: 'var(--app-danger)' }}>${error}</div>
      ` : null}

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-[0.18em]" style=${{ color: '#94a3b8' }}>
          Posting in
        </span>
        <span
          className="inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium"
          style=${{ borderColor: '#e2e8f0', background: '#f8fafc', color: '#475569' }}
        >
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold" style=${{ background: '#0f172a', color: '#ffffff' }}>
            ${communityInitials}
          </span>
          <span className="max-w-[240px] truncate sm:max-w-none">${community?.name || 'Community'} · ${channelName}</span>
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4 shrink-0" style=${{ color: 'var(--app-text-muted)' }}>
            <path d="m5 7.5 5 5 5-5" />
          </svg>
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        ${POST_TYPE_CHIPS.map((t) => {
          const isActive = postType === t.key;
          return html`
            <button
              key=${t.key}
              type="button"
              onClick=${() => setPostType(t.key)}
              className="rounded-full px-3.5 py-2 text-sm font-medium transition"
              style=${{
                background: isActive ? '#0f172a' : '#f1f5f9',
                color: isActive ? '#ffffff' : '#475569',
                boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              ${t.label}
            </button>
          `;
        })}
      </div>

      <input
        type="text"
        value=${title}
        onChange=${(e) => setTitle(e.target.value)}
        placeholder="Add a title"
        className="mb-3 h-12 w-full rounded-2xl border px-4 text-sm outline-none transition placeholder:opacity-60 focus:border-[var(--app-border-strong)] focus:bg-[var(--app-surface)]"
        style=${{ borderColor: '#e2e8f0', background: '#f8fafc', color: 'var(--app-text-primary)' }}
      />

      <textarea
        ref=${textareaRef}
        value=${content}
        onChange=${(e) => setContent(e.target.value)}
        placeholder="Share something with your community..."
        rows=${4}
        className="mb-4 w-full rounded-2xl border px-4 py-3 text-sm outline-none transition resize-none placeholder:opacity-60 focus:border-[var(--app-border-strong)] focus:bg-[var(--app-surface)]"
        style=${{ borderColor: '#e2e8f0', background: '#f8fafc', color: 'var(--app-text-primary)' }}
        required
      />

      <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
        <${TagsInput} tags=${tags} onChange=${setTags} placeholder="+ Add tag" />
        <button
          type="submit"
          disabled=${loading || !content.trim()}
          className="rounded-2xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
          style=${{ background: '#0f172a' }}
        >
          ${loading ? 'Posting…' : 'Post'}
        </button>
      </div>
    </form>
  `;
};

export default ExpandedComposer;
