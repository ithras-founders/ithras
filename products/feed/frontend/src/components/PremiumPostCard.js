/**
 * PremiumPostCard — unified premium post card used in all feed views.
 *
 * Props:
 *   post         – post data object from API
 *   onRefresh    – called after a mutating action (save, react, comment)
 *   user         – current user object (optional, used for avatar initials in reply input)
 *   isSaved      – controlled saved state (optional, falls back to post.is_saved)
 *   onSaveChange – called with (boolean) when saved state changes
 */
import React, { useState, useEffect, useRef } from 'react';
import htm from 'htm';
import { addReaction, removeReaction, savePost, unsavePost, listComments, addComment } from '../services/feedApi.js';

const html = htm.bind(React.createElement);

const REACTIONS = [
  { type: 'upvote',    emoji: '👍', label: 'Like' },
  { type: 'love',      emoji: '❤️', label: 'Love' },
  { type: 'insightful',emoji: '💡', label: 'Insightful' },
  { type: 'celebrate', emoji: '🎉', label: 'Celebrate' },
];

const formatTime = (iso) => {
  if (!iso) return '';
  const utc = /[Z+\-]\d*$/.test(iso) ? iso : iso + 'Z';
  const d = new Date(utc);
  const now = new Date();
  const diff = (now - d) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const typeLabel = (t) => (t || 'discussion').replace(/^./, (c) => c.toUpperCase());

const strHue = (str) => {
  let h = 5381;
  for (let i = 0; i < (str || '').length; i++) h = ((h << 5) + h) ^ str.charCodeAt(i);
  return (h >>> 0) % 360;
};

const communityColors = (name) => {
  const hue = strHue(name || 'c');
  return { bg: `hsl(${hue},55%,91%)`, color: `hsl(${hue},55%,36%)` };
};

const authorColors = (name) => {
  const hue = (strHue(name || 'a') + 137) % 360;
  return { bg: `hsl(${hue},52%,90%)`, color: `hsl(${hue},52%,35%)` };
};

const initials = (name) =>
  (name || '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?';

const TYPE_COLORS = {
  question:   { bg: '#fef3c7', color: '#92400e' },
  discussion: { bg: '#ede9fe', color: '#5b21b6' },
  update:     { bg: '#dcfce7', color: '#166534' },
  resource:   { bg: '#dbeafe', color: '#1e40af' },
  event:      { bg: '#fce7f3', color: '#9d174d' },
};

const getTypeStyle = (t) => TYPE_COLORS[t] || { bg: '#f1f5f9', color: '#475569' };

const BookmarkIcon = ({ filled }) => html`
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
    fill=${filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8">
    <path d="M6.75 4.75h10.5a1 1 0 0 1 1 1v14.5l-6.25-3-6.25 3V5.75a1 1 0 0 1 1-1Z"/>
  </svg>`;

const EyeIcon = () => html`
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>`;

const ChatIcon = () => html`
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M8 10h8M8 14h5"/>
    <path d="M5 19.5V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9l-4 3.5Z"/>
  </svg>`;

const SendIcon = () => html`
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2">
    <path d="m22 2-7 20-4-9-9-4 20-7Z"/>
    <path d="M22 2 11 13"/>
  </svg>`;

const PremiumPostCard = ({ post, onRefresh, user, isSaved: isSavedProp, onSaveChange }) => {
  const isSaved = isSavedProp ?? post.is_saved ?? false;
  const [saving, setSaving] = useState(false);

  const initReactionCounts = () => ({
    upvote: 0, love: 0, insightful: 0, celebrate: 0,
    ...(post.reaction_counts || {}),
  });
  const initUserReactions = () => Array.isArray(post.user_reactions) ? [...post.user_reactions] : [];

  const [reactionCounts, setReactionCounts] = useState(initReactionCounts);
  const [userReactions, setUserReactions] = useState(initUserReactions);
  const [reacting, setReacting] = useState(null);

  const [expanded, setExpanded] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const fetchedRef = useRef(false);

  const communityName = post.community_name || post.community?.name || 'Community';
  const channelName = post.channel_name || post.channel?.name || '';
  const typeStyle = getTypeStyle(post.type);
  const commCols = communityColors(communityName);
  const authCols = authorColors(post.author_name || '');

  const PREVIEW_LEN = 280;
  const contentFull = post.content || '';
  const contentShow = !expanded && contentFull.length > PREVIEW_LEN
    ? contentFull.slice(0, PREVIEW_LEN) + '…'
    : contentFull;

  useEffect(() => {
    setReactionCounts(initReactionCounts());
    setUserReactions(initUserReactions());
  }, [post.id, JSON.stringify(post.reaction_counts), JSON.stringify(post.user_reactions)]);

  useEffect(() => {
    if (commentsOpen && !fetchedRef.current) {
      fetchedRef.current = true;
      setCommentsLoading(true);
      listComments(post.id)
        .then((r) => setComments(r.items || []))
        .catch(() => setComments([]))
        .finally(() => setCommentsLoading(false));
    }
    if (!commentsOpen) fetchedRef.current = false;
  }, [commentsOpen, post.id]);

  const handleReact = async (type) => {
    if (reacting) return;
    setReacting(type);
    const isActive = userReactions.includes(type);
    const prevCounts = { ...reactionCounts };
    const prevReactions = [...userReactions];
    if (isActive) {
      setReactionCounts((c) => ({ ...c, [type]: Math.max(0, (c[type] || 0) - 1) }));
      setUserReactions((r) => r.filter((t) => t !== type));
      try { await removeReaction(post.id, type); onRefresh?.(); }
      catch (_) { setReactionCounts(prevCounts); setUserReactions(prevReactions); }
    } else {
      setReactionCounts((c) => ({ ...c, [type]: (c[type] || 0) + 1 }));
      setUserReactions((r) => [...r, type]);
      try { await addReaction(post.id, type); onRefresh?.(); }
      catch (_) { setReactionCounts(prevCounts); setUserReactions(prevReactions); }
    }
    setReacting(null);
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      if (isSaved) { await unsavePost(post.id); onSaveChange?.(false); }
      else { await savePost(post.id); onSaveChange?.(true); }
      onRefresh?.();
    } catch (_) {}
    setSaving(false);
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    const text = commentText.trim();
    if (!text || submitting) return;
    setSubmitting(true);
    try {
      await addComment(post.id, text);
      setCommentText('');
      const r = await listComments(post.id);
      setComments(r.items || []);
      onRefresh?.();
    } catch (_) {}
    setSubmitting(false);
  };

  const displayCommentCount = commentsOpen && !commentsLoading
    ? comments.length
    : (post.comment_count || 0);

  const userInitials = user ? initials(user.full_name || user.username || '') : '?';
  const userAuthCols = authorColors(user?.full_name || user?.username || 'u');

  return html`
    <article
      className="rounded-3xl border transition-all duration-200 hover:-translate-y-0.5"
      style=${{
        background: 'var(--app-surface)',
        borderColor: 'var(--app-border-soft)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
      }}
    >
      <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-0">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div
            className="flex-shrink-0 flex items-center justify-center rounded-xl text-sm font-bold select-none"
            style=${{
              width: '42px',
              height: '42px',
              background: commCols.bg,
              color: commCols.color,
              marginTop: '1px',
            }}
          >
            ${communityName[0]?.toUpperCase() || 'C'}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 text-sm">
              <span className="font-semibold truncate" style=${{ color: 'var(--app-text-primary)' }}>
                ${communityName}
              </span>
              ${channelName ? html`
                <span style=${{ color: 'var(--app-text-muted)' }}>·</span>
                <span className="truncate" style=${{ color: 'var(--app-text-muted)', fontSize: '13px' }}>
                  #${channelName}
                </span>
              ` : null}
            </div>

            <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
              <div
                className="flex-shrink-0 flex items-center justify-center rounded-full font-semibold select-none"
                style=${{
                  width: '22px',
                  height: '22px',
                  background: authCols.bg,
                  color: authCols.color,
                  fontSize: '9px',
                }}
              >
                ${initials(post.author_name)}
              </div>
              <span className="text-xs font-medium" style=${{ color: 'var(--app-text-secondary)' }}>
                ${post.author_name || 'Anonymous'}
              </span>
              <span className="text-xs" style=${{ color: 'var(--app-text-muted)' }}>·</span>
              <span className="text-xs" style=${{ color: 'var(--app-text-muted)' }}>
                ${formatTime(post.created_at)}
              </span>
              <span
                className="inline-block rounded-full px-2 py-0.5 text-xs font-medium"
                style=${{ background: typeStyle.bg, color: typeStyle.color }}
              >
                ${typeLabel(post.type)}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick=${handleSave}
          disabled=${saving}
          className="flex-shrink-0 rounded-full p-1.5 transition-colors hover:bg-[rgba(0,0,0,0.05)]"
          style=${{ color: isSaved ? '#0f172a' : 'var(--app-text-muted)', marginTop: '-2px' }}
          title=${isSaved ? 'Unsave' : 'Save'}
        >
          <${BookmarkIcon} filled=${isSaved} />
        </button>
      </div>

      <div className="px-5 pt-4">
        ${post.title ? html`
          <h2
            className="text-[17px] font-semibold tracking-tight leading-snug mb-2"
            style=${{ color: 'var(--app-text-primary)' }}
          >
            ${post.title}
          </h2>
        ` : null}

        ${contentShow ? html`
          <p className="text-[14.5px] leading-[1.7]" style=${{ color: 'var(--app-text-secondary)' }}>
            ${contentShow}
            ${!expanded && contentFull.length > PREVIEW_LEN ? html`
              <button
                type="button"
                onClick=${() => setExpanded(true)}
                className="ml-1 font-medium hover:underline"
                style=${{ color: 'var(--app-accent)' }}
              >
                Read more
              </button>
            ` : null}
          </p>
        ` : null}

        ${(post.tags || []).length > 0 ? html`
          <div className="flex flex-wrap gap-1.5 mt-3">
            ${(post.tags || []).map((tag, i) => html`
              <span
                key=${`${post.id}-tag-${i}`}
                className="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium"
                style=${{ background: 'var(--app-accent-soft)', color: 'var(--app-accent)' }}
              >
                #${tag}
              </span>
            `)}
          </div>
        ` : null}
      </div>

      <div
        className="mt-4 px-5 pb-4 flex items-center justify-between gap-4 border-t pt-3"
        style=${{ borderColor: 'rgba(0,0,0,0.06)' }}
      >
        <div className="flex items-center gap-1 flex-wrap">
          ${REACTIONS.map(({ type, emoji, label }) => {
            const active = userReactions.includes(type);
            const count = reactionCounts[type] || 0;
            return html`
              <button
                key=${type}
                type="button"
                onClick=${() => handleReact(type)}
                disabled=${!!reacting}
                title=${label}
                className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-all select-none"
                style=${{
                  background: active ? 'var(--app-accent-soft)' : 'var(--app-surface-subtle, #f8fafc)',
                  color: active ? 'var(--app-accent)' : 'var(--app-text-muted)',
                  border: active ? '1px solid var(--app-accent-soft)' : '1px solid transparent',
                  transform: reacting === type ? 'scale(0.92)' : 'scale(1)',
                }}
              >
                <span style=${{ fontSize: '14px', lineHeight: 1 }}>${emoji}</span>
                ${count > 0 ? html`<span>${count}</span>` : null}
              </button>
            `;
          })}
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            type="button"
            onClick=${() => setCommentsOpen((o) => !o)}
            className="flex items-center gap-1.5 text-xs transition-opacity hover:opacity-80"
            style=${{ color: commentsOpen ? 'var(--app-text-primary)' : 'var(--app-text-muted)' }}
          >
            <${ChatIcon} />
            <span>${displayCommentCount}</span>
          </button>
          ${post.view_count > 0 ? html`
            <div className="flex items-center gap-1 text-xs" style=${{ color: 'var(--app-text-muted)' }}>
              <${EyeIcon} />
              <span>${post.view_count}</span>
            </div>
          ` : null}
          ${post.save_count > 0 ? html`
            <div className="flex items-center gap-1 text-xs" style=${{ color: 'var(--app-text-muted)' }}>
              <${BookmarkIcon} filled=${false} />
              <span>${post.save_count}</span>
            </div>
          ` : null}
        </div>
      </div>

      ${commentsOpen ? html`
        <div
          className="px-5 pb-5 pt-1 space-y-4 border-t"
          style=${{ borderColor: 'rgba(0,0,0,0.06)' }}
        >
          ${commentsLoading ? html`
            <p className="text-xs pt-2" style=${{ color: 'var(--app-text-muted)' }}>Loading…</p>
          ` : comments.length === 0 ? html`
            <p className="text-xs pt-2" style=${{ color: 'var(--app-text-muted)' }}>
              No comments yet. Be the first to reply.
            </p>
          ` : html`
            <div className="space-y-4 pt-2">
              ${comments.map((c) => {
                const cCols = authorColors(c.author_name || '');
                return html`
                  <div key=${c.id} className="flex gap-2.5">
                    <div
                      className="flex-shrink-0 flex items-center justify-center rounded-full font-semibold select-none mt-0.5"
                      style=${{
                        width: '28px',
                        height: '28px',
                        background: cCols.bg,
                        color: cCols.color,
                        fontSize: '10px',
                      }}
                    >
                      ${initials(c.author_name)}
                    </div>
                    <div
                      className="flex-1 rounded-2xl px-3.5 py-2.5"
                      style=${{ background: 'var(--app-surface-subtle, #f8fafc)', border: '1px solid var(--app-border-soft)' }}
                    >
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-xs font-semibold" style=${{ color: 'var(--app-text-primary)' }}>
                          ${c.author_name || 'Anonymous'}
                        </span>
                        <span className="text-[11px]" style=${{ color: 'var(--app-text-muted)' }}>
                          ${formatTime(c.created_at)}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed" style=${{ color: 'var(--app-text-secondary)' }}>
                        ${c.content}
                      </p>
                    </div>
                  </div>
                `;
              })}
            </div>
          `}

          <form onSubmit=${handleAddComment} className="flex gap-2.5 items-center pt-1">
            <div
              className="flex-shrink-0 flex items-center justify-center rounded-full font-semibold select-none"
              style=${{
                width: '28px',
                height: '28px',
                background: userAuthCols.bg,
                color: userAuthCols.color,
                fontSize: '10px',
              }}
            >
              ${userInitials}
            </div>
            <div className="flex-1 flex gap-2 items-center">
              <input
                type="text"
                value=${commentText}
                onChange=${(e) => setCommentText(e.target.value)}
                placeholder="Write a reply…"
                disabled=${submitting}
                className="flex-1 rounded-2xl border px-3.5 py-2 text-sm outline-none transition-colors placeholder:opacity-50"
                style=${{
                  borderColor: 'var(--app-border-soft)',
                  background: 'var(--app-surface)',
                  color: 'var(--app-text-primary)',
                }}
              />
              <button
                type="submit"
                disabled=${!commentText.trim() || submitting}
                className="flex-shrink-0 flex items-center justify-center rounded-full transition-all disabled:opacity-40"
                style=${{
                  width: '34px',
                  height: '34px',
                  background: commentText.trim() ? 'var(--app-accent)' : 'var(--app-surface-subtle, #f1f5f9)',
                  color: commentText.trim() ? '#fff' : 'var(--app-text-muted)',
                }}
                title="Send reply"
              >
                ${submitting ? html`<span style=${{ fontSize: '12px' }}>…</span>` : html`<${SendIcon} />`}
              </button>
            </div>
          </form>
        </div>
      ` : null}
    </article>
  `;
};

export default PremiumPostCard;
