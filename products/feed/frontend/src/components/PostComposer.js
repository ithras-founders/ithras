/**
 * PostComposer - Create a post (discussion-style only).
 */
import React, { useState, useEffect, useRef } from 'react';
import htm from 'htm';
import { getMyCommunities, getCommunity, createPost } from '../services/feedApi.js';

const html = htm.bind(React.createElement);

const chrome = {
  fieldBg: 'var(--app-surface-muted)',
  fieldBorder: 'var(--app-border-soft)',
  mutedText: 'var(--app-text-muted)',
  secondaryText: 'var(--app-text-secondary)',
  popoverBg: 'var(--app-surface)',
  popoverBorder: 'var(--app-border-soft)',
  rowHover: 'var(--app-surface-hover)',
  rowActive: 'var(--app-accent-soft)',
};

const TagsInput = ({ tags, onChange, placeholder = '+ Add tag' }) => {
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
      ${(tags || []).map((t, i) => html`
        <span
          key=${`tag-${i}-${String(t)}`}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors border"
          style=${{
            background: 'var(--app-surface-subtle)',
            color: 'var(--app-text-secondary)',
            borderColor: 'var(--app-border-soft)',
          }}
        >
          ${t}
          <button type="button" onClick=${() => onChange((tags || []).filter((_, idx) => idx !== i))} className="hover:opacity-70 leading-none p-0.5 rounded" aria-label="Remove tag">×</button>
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
          className="w-24 py-1.5 px-2 text-xs rounded-lg outline-none ith-focus-ring"
          style=${{ border: `1px solid ${chrome.fieldBorder}`, background: chrome.fieldBg, color: 'var(--app-text-primary)' }}
        />
      ` : html`
        <button
          type="button"
          onClick=${() => setShowInput(true)}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium transition-colors ith-focus-ring"
          style=${{ color: chrome.mutedText, background: 'transparent' }}
          onMouseEnter=${(e) => { e.currentTarget.style.background = 'var(--app-surface-hover)'; }}
          onMouseLeave=${(e) => { e.currentTarget.style.background = 'transparent'; }}
        >
          ${placeholder}
        </button>
      `}
    </div>
  `;
};

const userInitials = (user) => {
  const n = user?.full_name || user?.username || user?.email || '';
  if (!n) return '?';
  return n
    .split(/[\s@]+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
};

const PostComposer = ({ onSuccess, communityId, channelId, user }) => {
  const [communities, setCommunities] = useState([]);
  const [selectedCommunity, setSelectedCommunity] = useState(communityId || null);
  const [selectedChannel, setSelectedChannel] = useState(channelId || null);
  const [communityDetail, setCommunityDetail] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [expandNonce, setExpandNonce] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [search, setSearch] = useState('');
  const popoverRef = useRef(null);

  const openExpanded = () => {
    setExpandNonce((n) => n + 1);
    setExpanded(true);
  };

  useEffect(() => {
    if (!expanded) return;
    setTitle('');
    setContent('');
    setTags([]);
    setError('');
  }, [expanded, expandNonce]);

  useEffect(() => {
    getMyCommunities()
      .then((r) => setCommunities(r.items || []))
      .catch(() => setCommunities([]));
  }, []);

  useEffect(() => {
    if (!selectedCommunity) {
      setCommunityDetail(null);
      setSelectedChannel(null);
      return;
    }
    getCommunity(selectedCommunity)
      .then(setCommunityDetail)
      .catch(() => setCommunityDetail(null));
  }, [selectedCommunity]);

  useEffect(() => {
    if (communityId) setSelectedCommunity(communityId);
    if (channelId) setSelectedChannel(channelId);
  }, [communityId, channelId]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setPopoverOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const channels = communityDetail?.channels || [];
  const hasChannels = communityDetail?.has_channels && channels.length > 0;
  const effectiveChannel = hasChannels ? (selectedChannel || channels[0]?.id) : null;
  const channelName = channels.find((c) => c.id === effectiveChannel)?.name || 'General';

  const selectedComm = communities.find((c) => c.id === selectedCommunity) || communityDetail;
  const communityName = selectedComm?.name || 'Select community';
  const communityInitials = (communityName || 'C').slice(0, 2).toUpperCase();

  const filteredCommunities = search.trim()
    ? communities.filter((c) => (c.name || '').toLowerCase().includes(search.toLowerCase()))
    : communities;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCommunity) {
      setError('Please select a community');
      return;
    }
    if (!content.trim()) {
      setError('Add some content.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await createPost({
        communityId: selectedCommunity,
        channelId: hasChannels ? effectiveChannel : null,
        type: 'discussion',
        title: title.trim(),
        content: content.trim(),
        tags,
      });
      setTitle('');
      setContent('');
      setTags([]);
      setExpanded(false);
      onSuccess?.();
    } catch (err) {
      setError(err.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCommunity = (c) => {
    setSelectedCommunity(c.id);
    setSelectedChannel(null);
    setPopoverOpen(false);
    setSearch('');
  };

  const fieldStyle = {
    borderColor: chrome.fieldBorder,
    background: chrome.fieldBg,
    color: 'var(--app-text-primary)',
  };

  if (!expanded) {
    return html`
      <div
        className="rounded-[var(--app-radius-card)] border p-3 sm:p-4"
        style=${{
          background: 'var(--app-surface)',
          borderColor: 'var(--app-border-soft)',
          boxShadow: 'var(--app-shadow-card)',
        }}
      >
        <button
          type="button"
          onClick=${openExpanded}
          className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors ith-focus-ring"
          style=${{ color: 'var(--app-text-primary)' }}
          onMouseEnter=${(e) => { e.currentTarget.style.background = 'var(--app-surface-hover)'; }}
          onMouseLeave=${(e) => { e.currentTarget.style.background = 'transparent'; }}
        >
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
            style=${{ background: 'var(--app-accent-soft)', color: 'var(--app-accent)' }}
            aria-hidden="true"
          >
            ${userInitials(user)}
          </span>
          <span className="min-w-0 flex-1 text-sm" style=${{ color: 'var(--app-text-muted)' }}>
            Start a post in your communities…
          </span>
        </button>
      </div>
    `;
  }

  const submitDisabled = loading || !selectedCommunity || !content.trim();

  return html`
    <div
      className="rounded-[var(--app-radius-card)] border p-4 sm:p-6"
      style=${{
        background: 'var(--app-surface)',
        borderColor: 'var(--app-border-soft)',
        boxShadow: 'var(--app-shadow-card)',
      }}
    >
      <form onSubmit=${handleSubmit} className="space-y-4">
        ${error ? html`
          <div className="px-4 py-2.5 rounded-xl text-sm border" style=${{ background: 'var(--app-danger-soft)', color: 'var(--app-danger)', borderColor: 'var(--app-border-soft)' }}>${error}</div>
        ` : null}

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.14em]" style=${{ color: chrome.mutedText }}>Posting in</span>
          <div className="relative" ref=${popoverRef}>
            <button
              type="button"
              onClick=${() => setPopoverOpen(!popoverOpen)}
              className="group inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors ith-focus-ring"
              style=${{ borderColor: chrome.fieldBorder, background: chrome.fieldBg, color: chrome.secondaryText }}
              onMouseEnter=${(e) => { e.currentTarget.style.borderColor = 'var(--app-border-strong)'; e.currentTarget.style.background = 'var(--app-surface-hover)'; }}
              onMouseLeave=${(e) => { e.currentTarget.style.borderColor = chrome.fieldBorder; e.currentTarget.style.background = chrome.fieldBg; }}
            >
              <span
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold"
                style=${{
                  background: selectedCommunity ? 'var(--app-accent)' : 'var(--app-surface-subtle)',
                  color: selectedCommunity ? '#ffffff' : 'var(--app-text-muted)',
                }}
              >
                ${communityInitials}
              </span>
              <span className="max-w-[200px] truncate sm:max-w-[280px]">${communityName}${hasChannels ? ` · ${channelName}` : ''}</span>
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4 shrink-0 transition" style=${{ color: chrome.mutedText, transform: popoverOpen ? 'rotate(180deg)' : 'none' }}>
                <path d="m5 7.5 5 5 5-5" />
              </svg>
            </button>
            ${popoverOpen ? html`
              <div
                className="absolute left-0 top-full z-50 mt-2 min-w-[280px] rounded-2xl border py-2"
                style=${{ background: chrome.popoverBg, borderColor: chrome.popoverBorder, boxShadow: 'var(--app-shadow-floating)' }}
              >
                <div className="px-3 pb-2">
                  <input
                    type="text"
                    value=${search}
                    onChange=${(e) => setSearch(e.target.value)}
                    placeholder="Search communities..."
                    className="w-full rounded-xl px-3 py-2 text-sm outline-none ith-focus-ring placeholder:opacity-50"
                    style=${{ ...fieldStyle, border: `1px solid ${chrome.fieldBorder}` }}
                    autoFocus
                  />
                </div>
                <div className="max-h-64 overflow-y-auto custom-scrollbar">
                  ${filteredCommunities.length === 0 ? html`
                    <p className="px-4 py-3 text-sm" style=${{ color: chrome.mutedText }}>No communities found</p>
                  ` : filteredCommunities.map((c) => html`
                    <button
                      key=${c.id}
                      type="button"
                      onClick=${() => handleSelectCommunity(c)}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ith-focus-ring"
                      style=${{ color: 'var(--app-text-primary)', background: selectedCommunity === c.id ? chrome.rowActive : 'transparent' }}
                      onMouseEnter=${(e) => { if (selectedCommunity !== c.id) e.currentTarget.style.background = chrome.rowHover; }}
                      onMouseLeave=${(e) => { e.currentTarget.style.background = selectedCommunity === c.id ? chrome.rowActive : 'transparent'; }}
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-semibold" style=${{ background: 'var(--app-surface-subtle)', color: 'var(--app-text-secondary)' }}>
                        ${(c.name || 'C').slice(0, 2).toUpperCase()}
                      </span>
                      <span className="truncate">${c.name || 'Community'}</span>
                    </button>
                  `)}
                </div>
              </div>
            ` : null}
          </div>
          ${hasChannels && selectedCommunity ? html`
            <select
              value=${effectiveChannel || ''}
              onChange=${(e) => setSelectedChannel(e.target.value ? parseInt(e.target.value, 10) : null)}
              className="rounded-full border px-3.5 py-2 text-sm font-medium outline-none ith-focus-ring cursor-pointer"
              style=${{ borderColor: chrome.fieldBorder, background: chrome.fieldBg, color: chrome.secondaryText }}
            >
              ${channels.map((ch) => html`<option key=${ch.id} value=${ch.id}>${ch.name}</option>`)}
            </select>
          ` : null}
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick=${() => setExpanded(false)}
            className="text-xs font-semibold uppercase tracking-wider ith-focus-ring rounded-lg px-2 py-1"
            style=${{ color: 'var(--app-text-muted)' }}
          >
            Collapse
          </button>
        </div>

        <input
          type="text"
          value=${title}
          onChange=${(e) => setTitle(e.target.value)}
          placeholder="Title (optional)"
          className="h-12 w-full rounded-2xl border px-4 text-sm outline-none transition placeholder:opacity-50 ith-focus-ring"
          style=${fieldStyle}
        />

        <textarea
          value=${content}
          onChange=${(e) => setContent(e.target.value)}
          placeholder="What would you like to share?"
          rows=${4}
          className="w-full rounded-2xl border px-4 py-3 text-sm outline-none transition resize-none placeholder:opacity-50 ith-focus-ring"
          style=${fieldStyle}
          required
        />

        <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
          <${TagsInput} tags=${tags} onChange=${setTags} />
          <button
            type="submit"
            disabled=${submitDisabled}
            className="rounded-2xl px-6 py-2.5 text-sm font-semibold text-white transition ith-focus-ring disabled:opacity-45 disabled:cursor-not-allowed"
            style=${{ background: 'var(--app-accent)', boxShadow: 'var(--app-shadow-primary)' }}
            onMouseEnter=${(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.filter = 'brightness(1.08)'; }}
            onMouseLeave=${(e) => { e.currentTarget.style.filter = ''; }}
          >
            ${loading ? 'Posting…' : 'Post'}
          </button>
        </div>
      </form>
    </div>
  `;
};

export default PostComposer;
