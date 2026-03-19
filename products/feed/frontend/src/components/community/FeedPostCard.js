/**
 * FeedPostCard - Matches premium mockup layout.
 * Top: community • channel + bookmark
 * Row 2: avatar, author, time, type pill
 * Content: title, body
 * Footer: comments, Follow, View post
 */
import React, { useState, useEffect, useRef } from 'react';
import htm from 'htm';
import { savePost, unsavePost, listComments, addComment } from '../../services/feedApi.js';

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

const typeLabel = (t) => (t || 'discussion').replace(/^./, (c) => c.toUpperCase());

const CommentIcon = () => html`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M8 10h8M8 14h5"/><path d="M5 19.5V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9l-4 3.5Z"/></svg>`;
const FollowIcon = () => html`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m7 12 4 4 6-8"/></svg>`;
const BookmarkIcon = (filled) => html`<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill=${filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8"><path d="M6.75 4.75h10.5a1 1 0 0 1 1 1v14.5l-6.25-3-6.25 3V5.75a1 1 0 0 1 1-1Z"/></svg>`;

const FeedPostCard = ({ post, onRefresh, user, isSaved: isSavedProp, onSaveChange }) => {
  const isSaved = isSavedProp ?? post.is_saved ?? false;
  const [saving, setSaving] = useState(false);
  const [commentsExpanded, setCommentsExpanded] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const commentsFetchedRef = useRef(false);

  const commentCount = commentsExpanded && !commentsLoading ? comments.length : (post.comment_count || 0);
  const communityName = post.community_name || post.community?.name || 'Community';
  const channelName = post.channel_name || post.channel?.name || 'General';

  useEffect(() => {
    if (commentsExpanded && !commentsFetchedRef.current) {
      commentsFetchedRef.current = true;
      setCommentsLoading(true);
      listComments(post.id)
        .then((r) => setComments(r.items || []))
        .catch(() => setComments([]))
        .finally(() => setCommentsLoading(false));
    }
    if (!commentsExpanded) commentsFetchedRef.current = false;
  }, [commentsExpanded, post.id]);

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

  const handleAddComment = async (e) => {
    e.preventDefault();
    const text = commentText.trim();
    if (!text || submittingComment) return;
    setSubmittingComment(true);
    try {
      await addComment(post.id, text);
      setCommentText('');
      const r = await listComments(post.id);
      setComments(r.items || []);
      onRefresh?.();
    } catch (_) {}
    setSubmittingComment(false);
  };

  return html`
    <article
      className="rounded-3xl border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-6"
      style=${{
        background: 'var(--app-surface)',
        borderColor: 'var(--app-border-soft)',
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-sm" style=${{ color: 'var(--app-text-muted)' }}>
            <span className="font-semibold" style=${{ color: 'var(--app-text-secondary)' }}>${communityName}</span>
            <span>•</span>
            <span>${channelName}</span>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs sm:text-sm" style=${{ color: 'var(--app-text-muted)' }}>
            <div className="flex items-center gap-2">
              <div
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                style=${{ background: '#e2e8f0', color: '#475569' }}
              >
                ${(post.author_name || '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?'}
              </div>
              <span style=${{ color: 'var(--app-text-secondary)' }}>${post.author_name || 'Anonymous'}</span>
            </div>
            <span>•</span>
            <span>${formatTime(post.created_at)}</span>
            <span
              className="rounded-full px-2.5 py-1 text-xs font-medium"
              style=${{ background: '#f1f5f9', color: '#475569' }}
            >
              ${typeLabel(post.type)}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick=${handleSave}
          disabled=${saving}
          className="rounded-full p-2 transition hover:bg-[rgba(0,0,0,0.04)]"
          style=${{ color: isSaved ? '#0f172a' : 'var(--app-text-muted)' }}
          title=${isSaved ? 'Unsave' : 'Save'}
        >
          <${BookmarkIcon} filled=${isSaved} />
        </button>
      </div>

      <div className="mt-5">
        ${post.title ? html`
          <h2 className="text-xl font-semibold tracking-tight" style=${{ color: 'var(--app-text-primary)' }}>${post.title}</h2>
        ` : null}
        <p className="mt-2 text-[15px] leading-7" style=${{ color: 'var(--app-text-secondary)' }}>${post.content || ''}</p>
      </div>

      <div className="mt-5 flex items-center justify-between border-t pt-4" style=${{ borderColor: 'rgba(0,0,0,0.06)' }}>
        <div className="flex items-center gap-5 text-sm" style=${{ color: 'var(--app-text-muted)' }}>
          <button
            type="button"
            onClick=${() => setCommentsExpanded(!commentsExpanded)}
            className="flex items-center gap-2 transition hover:opacity-80"
            style=${{ color: commentsExpanded ? '#0f172a' : 'inherit' }}
          >
            <${CommentIcon} />
            <span>${commentCount} comments</span>
          </button>
          <button type="button" className="flex items-center gap-2 transition hover:opacity-80">
            <${FollowIcon} />
            <span>Follow</span>
          </button>
        </div>
        <button
          type="button"
          onClick=${() => setCommentsExpanded(true)}
          className="text-sm font-medium transition hover:opacity-80"
          style=${{ color: 'var(--app-text-secondary)' }}
        >
          View post
        </button>
      </div>

      ${commentsExpanded ? html`
        <div className="mt-4 space-y-4 pt-4" style=${{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
          ${commentsLoading ? html`
            <p className="text-sm" style=${{ color: 'var(--app-text-muted)' }}>Loading comments…</p>
          ` : comments.length === 0 ? html`
            <p className="text-sm" style=${{ color: 'var(--app-text-muted)' }}>No comments yet. Be the first to reply.</p>
          ` : html`
            <div className="space-y-3">
              ${comments.map((c) => html`
                <div key=${c.id} className="flex gap-3">
                  <span className="text-sm font-medium shrink-0" style=${{ color: 'var(--app-text-primary)' }}>${c.author_name || 'Anonymous'}</span>
                  <p className="text-sm flex-1" style=${{ color: 'var(--app-text-secondary)' }}>${c.content}</p>
                  <span className="text-xs shrink-0" style=${{ color: 'var(--app-text-muted)' }}>${formatTime(c.created_at)}</span>
                </div>
              `)}
            </div>
          `}
          <form onSubmit=${handleAddComment} className="flex gap-2 mt-4">
            <input
              type="text"
              value=${commentText}
              onChange=${(e) => setCommentText(e.target.value)}
              placeholder="Add a reply…"
              className="flex-1 rounded-2xl border px-4 py-2.5 text-sm outline-none transition placeholder:opacity-60"
              style=${{ borderColor: 'var(--app-border-soft)', background: 'var(--app-surface)' }}
              disabled=${submittingComment}
            />
            <button
              type="submit"
              disabled=${!commentText.trim() || submittingComment}
              className="rounded-2xl px-4 py-2.5 text-sm font-semibold text-white transition disabled:opacity-50"
              style=${{ background: '#0f172a' }}
            >
              ${submittingComment ? '…' : 'Reply'}
            </button>
          </form>
        </div>
      ` : null}
    </article>
  `;
};

export default FeedPostCard;
