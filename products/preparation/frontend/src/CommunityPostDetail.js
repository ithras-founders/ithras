import React, { useState, useEffect, useCallback } from 'react';
import htm from 'htm';
import {
  getPrepCommunityPost,
  listPrepCommunityComments,
  createPrepCommunityComment,
} from '/core/frontend/src/modules/shared/services/api/preparation.js';

const html = htm.bind(React.createElement);

const formatTimeAgo = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const s = Math.floor((now - d) / 1000);
  if (s < 60) return 'Just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return d.toLocaleDateString();
};

const CommunityPostDetail = ({ postId, user, onBack }) => {
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [replyBody, setReplyBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    if (!postId) return;
    setLoading(true);
    try {
      const [postData, commentsData] = await Promise.all([
        getPrepCommunityPost(postId),
        listPrepCommunityComments(postId),
      ]);
      setPost(postData);
      setComments(Array.isArray(commentsData) ? commentsData : []);
      setError(null);
    } catch (e) {
      setError(e.message || 'Failed to load post');
      setPost(null);
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleReply = async (e) => {
    e?.preventDefault();
    if (!replyBody.trim()) return;
    setSubmitting(true);
    try {
      await createPrepCommunityComment(postId, replyBody.trim());
      setReplyBody('');
      fetchData();
    } catch (e) {
      setError(e.message || 'Failed to post reply');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return html`<p className="text-[var(--app-text-secondary)]">Loading...</p>`;
  if (error && !post) return html`<p className="text-red-500">${error}</p>`;
  if (!post) return html`<p className="text-[var(--app-text-secondary)]">Post not found.</p>`;

  return html`
    <div className="space-y-4">
      <button
        onClick=${onBack}
        className="text-sm text-[var(--app-accent)] hover:underline flex items-center gap-1"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
        Back to feed
      </button>

      <div className="bg-[var(--app-surface)] border border-[var(--app-border-soft)] rounded-xl p-4">
        <h1 className="text-xl font-semibold text-[var(--app-text-primary)]">${post.title}</h1>
        <p className="text-sm text-[var(--app-text-muted)] mt-1">${formatTimeAgo(post.created_at)}</p>
        <div className="mt-4 text-[var(--app-text-primary)] whitespace-pre-wrap">${post.body}</div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-[var(--app-text-primary)] mb-2">Replies (${comments.length})</h2>

        <form onSubmit=${handleReply} className="mb-4">
          <textarea
            placeholder="Write a reply..."
            value=${replyBody}
            onChange=${(e) => setReplyBody(e.target.value)}
            rows=${3}
            className="w-full px-3 py-2 rounded-lg border border-[var(--app-border-soft)] bg-[var(--app-bg)] text-[var(--app-text-primary)] mb-2"
          />
          <button
            type="submit"
            disabled=${submitting || !replyBody.trim()}
            className="px-4 py-2 rounded-lg bg-[var(--app-accent)] text-white text-sm font-medium disabled:opacity-50"
          >
            ${submitting ? 'Posting...' : 'Post reply'}
          </button>
        </form>

        <div className="space-y-3">
          ${comments.map((c) => html`
            <div key=${c.id} className="bg-[var(--app-surface)] border border-[var(--app-border-soft)] rounded-lg p-3">
              <p className="text-[var(--app-text-primary)] whitespace-pre-wrap">${c.body}</p>
              <p className="text-xs text-[var(--app-text-muted)] mt-1">${formatTimeAgo(c.created_at)}</p>
            </div>
          `)}
        </div>
      </div>
    </div>
  `;
};

export default CommunityPostDetail;
