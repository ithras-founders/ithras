import React, { useState, useEffect, useCallback } from 'react';
import htm from 'htm';
import {
  listPrepCommunityChannels,
  listPrepCommunityPosts,
  getPrepCommunityPost,
  createPrepCommunityPost,
  listPrepCommunityComments,
  createPrepCommunityComment,
} from '/core/frontend/src/modules/shared/services/api/preparation.js';
import { listFeedChannels } from '/core/frontend/src/modules/shared/services/api/feed.js';
import ChannelFilters from '/products/feed/channel/frontend/src/ChannelFilters.js';

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

const PinIcon = () => html`
  <svg className="w-4 h-4 text-[var(--app-accent)]" fill="currentColor" viewBox="0 0 20 20">
    <path d="M5 5a2 2 0 012-2h6a2 2 0 012 2v2l-2 2V5H7v4l-2-2V5z" />
    <path d="M3 15h14v2H3v-2z" />
  </svg>
`;

const FeedCommunitiesView = ({ user, view, navigate }) => {
  const viewParts = (view || 'feed/communities').split('/').filter(Boolean);
  const postId = viewParts[2] === 'post' ? viewParts[3] : null;
  const isPostDetail = !!postId;

  const [channels, setChannels] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [newChannel, setNewChannel] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [visibilityFilter, setVisibilityFilter] = useState(null);

  const fetchChannels = useCallback(async () => {
    try {
      const data = visibilityFilter
        ? (await listFeedChannels({ visibility: visibilityFilter }))?.items || []
        : await listPrepCommunityChannels();
      setChannels(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || 'Failed to load channels');
      setChannels([]);
    }
  }, [visibilityFilter]);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 50 };
      const data = await listPrepCommunityPosts(params);
      setPosts(Array.isArray(data) ? data : []);
      setError(null);
    } catch (e) {
      setError(e.message || 'Failed to load posts');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchChannels(); }, [fetchChannels]);
  useEffect(() => { if (!isPostDetail) fetchPosts(); }, [isPostDetail, fetchPosts]);

  const handleCreatePost = async (e) => {
    e?.preventDefault();
    const ch = newChannel || (channels[0]?.code);
    if (!newTitle.trim() || !newBody.trim() || !ch) return;
    setSubmitting(true);
    try {
      await createPrepCommunityPost({ channel: ch, title: newTitle.trim(), body: newBody.trim(), tags: [] });
      setShowCreate(false);
      setNewTitle('');
      setNewBody('');
      setNewChannel(channels[0]?.code || '');
      fetchPosts();
    } catch (e) {
      setError(e.message || 'Failed to create post');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePostClick = (id) => {
    if (navigate) navigate(`feed/communities/post/${id}`);
  };

  const handleBack = () => {
    if (navigate) navigate('feed/communities');
  };

  if (isPostDetail) {
    return html`<${FeedCommunityPostDetail} postId=${postId} user=${user} onBack=${handleBack} />`;
  }

  return html`
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <h2 className="text-lg font-semibold text-[var(--app-text-primary)]">Discussion Feed</h2>
        <div className="flex items-center gap-3">
          <${ChannelFilters} visibilityFilter=${visibilityFilter} onVisibilityFilter=${setVisibilityFilter} />
          <button
            onClick=${() => setShowCreate(!showCreate)}
          className="px-4 py-2 rounded-lg bg-[var(--app-accent)] text-white text-sm font-medium hover:opacity-90"
          >
            ${showCreate ? 'Cancel' : 'Create post'}
          </button>
        </div>
      </div>

      ${showCreate && html`
        <form onSubmit=${handleCreatePost} className="bg-[var(--app-surface)] border border-[var(--app-border-soft)] rounded-xl p-4 space-y-3 shadow-[var(--app-shadow-subtle)]">
          <input
            type="text"
            placeholder="Title"
            value=${newTitle}
            onChange=${(e) => setNewTitle(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[var(--app-border-soft)] bg-[var(--app-bg)] text-[var(--app-text-primary)]"
            required
          />
          <textarea
            placeholder="Body"
            value=${newBody}
            onChange=${(e) => setNewBody(e.target.value)}
            rows=${4}
            className="w-full px-3 py-2 rounded-lg border border-[var(--app-border-soft)] bg-[var(--app-bg)] text-[var(--app-text-primary)]"
            required
          />
          <select
            value=${newChannel || channels[0]?.code}
            onChange=${(e) => setNewChannel(e.target.value)}
            className="px-3 py-2 rounded-lg border border-[var(--app-border-soft)] bg-[var(--app-bg)] text-[var(--app-text-primary)]"
          >
            ${channels.map((c) => html`<option key=${c.code} value=${c.code}>${c.name}</option>`)}
          </select>
          <button
            type="submit"
            disabled=${submitting}
            className="px-4 py-2 rounded-lg bg-[var(--app-accent)] text-white text-sm font-medium disabled:opacity-50"
          >
            ${submitting ? 'Posting...' : 'Post'}
          </button>
        </form>
      `}

      ${error && html`<p className="text-red-500 text-sm">${error}</p>`}

      ${loading ? html`<p className="text-[var(--app-text-secondary)]">Loading...</p>` : html`
        <div className="space-y-3">
          ${posts.length === 0 ? html`<p className="text-[var(--app-text-secondary)] py-8 text-center">No posts yet. Be the first to start a discussion!</p>` : posts.map((post) => html`
            <div
              key=${post.id}
              onClick=${() => handlePostClick(post.id)}
              className="bg-[var(--app-surface)] border border-[var(--app-border-soft)] rounded-xl p-4 hover:border-[var(--app-accent)] cursor-pointer transition-colors shadow-[var(--app-shadow-subtle)]"
            >
              <div className="flex items-start gap-2">
                ${post.pinned_at && html`<${PinIcon} />`}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-[var(--app-text-primary)]">${post.title}</h3>
                  <p className="text-sm text-[var(--app-text-secondary)] mt-1 line-clamp-2">${post.body}</p>
                  <p className="text-xs text-[var(--app-text-muted)] mt-2">${formatTimeAgo(post.created_at)}</p>
                </div>
              </div>
            </div>
          `)}
        </div>
      `}
    </div>
  `;
};

const FeedCommunityPostDetail = ({ postId, user, onBack }) => {
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

      <div className="bg-[var(--app-surface)] border border-[var(--app-border-soft)] rounded-xl p-4 shadow-[var(--app-shadow-subtle)]">
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
            <div key=${c.id} className="bg-[var(--app-surface)] border border-[var(--app-border-soft)] rounded-xl p-3 shadow-[var(--app-shadow-subtle)]">
              <p className="text-[var(--app-text-primary)] whitespace-pre-wrap">${c.body}</p>
              <p className="text-xs text-[var(--app-text-muted)] mt-1">${formatTimeAgo(c.created_at)}</p>
            </div>
          `)}
        </div>
      </div>
    </div>
  `;
};

export default FeedCommunitiesView;
