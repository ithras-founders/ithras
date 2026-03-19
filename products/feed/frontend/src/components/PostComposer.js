/**
 * PostComposer - Premium post composer with searchable community selector.
 * Matches CommunityComposer styling; community/channel dropdown actually works.
 */
import React, { useState, useEffect, useRef } from 'react';
import htm from 'htm';
import { getMyCommunities, getCommunity, createPost } from '../services/feedApi.js';

const html = htm.bind(React.createElement);

const POST_TYPE_CHIPS = [
  { key: 'discussion', label: 'Discussion' },
  { key: 'question', label: 'Question' },
  { key: 'announcement', label: 'Announcement' },
];

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
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors"
          style=${{ background: 'rgba(0,0,0,0.04)', color: 'var(--app-text-secondary)' }}
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

const PostComposer = ({ onSuccess, communityId, channelId }) => {
  const [communities, setCommunities] = useState([]);
  const [selectedCommunity, setSelectedCommunity] = useState(communityId || null);
  const [selectedChannel, setSelectedChannel] = useState(channelId || null);
  const [communityDetail, setCommunityDetail] = useState(null);
  const [postType, setPostType] = useState('discussion');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [search, setSearch] = useState('');
  const popoverRef = useRef(null);

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
    setLoading(true);
    setError('');
    try {
      await createPost({
        communityId: selectedCommunity,
        channelId: hasChannels ? effectiveChannel : null,
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

  return html`
    <div
      className="rounded-3xl border p-4 shadow-sm sm:p-6"
      style=${{ background: 'var(--app-surface)', borderColor: 'var(--app-border-soft)' }}
    >
      <form onSubmit=${handleSubmit} className="space-y-4">
        ${error ? html`
          <div className="px-4 py-2.5 rounded-xl text-sm" style=${{ background: 'var(--app-danger-soft)', color: 'var(--app-danger)' }}>${error}</div>
        ` : null}

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-[0.18em]" style=${{ color: '#94a3b8' }}>
            Posting in
          </span>
          <div className="relative" ref=${popoverRef}>
            <button
              type="button"
              onClick=${() => setPopoverOpen(!popoverOpen)}
              className="group inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition hover:border-slate-300 hover:bg-white"
              style=${{ borderColor: '#e2e8f0', background: '#f8fafc', color: '#475569' }}
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold" style=${{ background: selectedCommunity ? '#0f172a' : '#e2e8f0', color: selectedCommunity ? '#ffffff' : '#64748b' }}>
                ${communityInitials}
              </span>
              <span className="max-w-[200px] truncate sm:max-w-[280px]">${communityName}${hasChannels ? ` · ${channelName}` : ''}</span>
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4 shrink-0 transition" style=${{ color: '#94a3b8', transform: popoverOpen ? 'rotate(180deg)' : 'none' }}>
                <path d="m5 7.5 5 5 5-5" />
              </svg>
            </button>
            ${popoverOpen ? html`
              <div
                className="absolute left-0 top-full z-50 mt-2 min-w-[280px] rounded-2xl border bg-white py-2 shadow-lg"
                style=${{ borderColor: '#e2e8f0' }}
              >
                <div className="px-3 pb-2">
                  <input
                    type="text"
                    value=${search}
                    onChange=${(e) => setSearch(e.target.value)}
                    placeholder="Search communities..."
                    className="w-full rounded-xl border px-3 py-2 text-sm outline-none placeholder:opacity-60"
                    style=${{ borderColor: '#e2e8f0', background: '#f8fafc' }}
                    autoFocus
                  />
                </div>
                <div className="max-h-64 overflow-y-auto">
                  ${filteredCommunities.length === 0 ? html`
                    <p className="px-4 py-3 text-sm" style=${{ color: '#64748b' }}>No communities found</p>
                  ` : filteredCommunities.map((c) => html`
                    <button
                      key=${c.id}
                      type="button"
                      onClick=${() => handleSelectCommunity(c)}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition hover:bg-[#f1f5f9]"
                      style=${{ color: selectedCommunity === c.id ? '#0f172a' : '#334155', background: selectedCommunity === c.id ? '#f1f5f9' : 'transparent' }}
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-semibold" style=${{ background: '#e2e8f0', color: '#475569' }}>
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
              className="rounded-full border px-3.5 py-2 text-sm font-medium outline-none"
              style=${{ borderColor: '#e2e8f0', background: '#f8fafc', color: '#475569' }}
            >
              ${channels.map((ch) => html`
                <option key=${ch.id} value=${ch.id}>${ch.name}</option>
              `)}
            </select>
          ` : null}
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
          value=${content}
          onChange=${(e) => setContent(e.target.value)}
          placeholder="Share something with your community..."
          rows=${4}
          className="mb-4 w-full rounded-2xl border px-4 py-3 text-sm outline-none transition resize-none placeholder:opacity-60 focus:border-[var(--app-border-strong)] focus:bg-[var(--app-surface)]"
          style=${{ borderColor: '#e2e8f0', background: '#f8fafc', color: 'var(--app-text-primary)' }}
          required
        />

        <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
          <${TagsInput} tags=${tags} onChange=${setTags} />
          <button
            type="submit"
            disabled=${loading || !content.trim() || !selectedCommunity}
            className="rounded-2xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
            style=${{ background: '#0f172a' }}
          >
            ${loading ? 'Posting…' : 'Post'}
          </button>
        </div>
      </form>
    </div>
  `;
};

export default PostComposer;
