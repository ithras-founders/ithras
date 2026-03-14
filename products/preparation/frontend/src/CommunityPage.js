import React, { useState, useEffect, useCallback } from 'react';
import htm from 'htm';
import {
  listPrepCommunityChannels,
  listPrepCommunityPosts,
  createPrepCommunityPost,
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

const PinIcon = () => html`
  <svg className="w-4 h-4 text-[var(--app-accent)]" fill="currentColor" viewBox="0 0 20 20">
    <path d="M5 5a2 2 0 012-2h6a2 2 0 012 2v2l-2 2V5H7v4l-2-2V5z" />
    <path d="M3 15h14v2H3v-2z" />
  </svg>
`;

const CommunityPage = ({ user, activeChannel, onChannelChange, onPostClick, navigate }) => {
  const [channels, setChannels] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [newChannel, setNewChannel] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const channel = activeChannel || (channels[0]?.code);

  const fetchChannels = useCallback(async () => {
    try {
      const data = await listPrepCommunityChannels();
      setChannels(Array.isArray(data) ? data : []);
      if (!activeChannel && data?.[0]?.code) {
        onChannelChange?.(data[0].code);
      }
    } catch (e) {
      setError(e.message || 'Failed to load channels');
    }
  }, [activeChannel, onChannelChange]);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listPrepCommunityPosts({ limit: 50 });
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
  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const handleCreatePost = async (e) => {
    e?.preventDefault();
    if (!newTitle.trim() || !newBody.trim() || !newChannel) return;
    setSubmitting(true);
    try {
      await createPrepCommunityPost({ channel: newChannel, title: newTitle.trim(), body: newBody.trim(), tags: [] });
      setShowCreate(false);
      setNewTitle('');
      setNewBody('');
      setNewChannel(channel || channels[0]?.code || '');
      fetchPosts();
    } catch (e) {
      setError(e.message || 'Failed to create post');
    } finally {
      setSubmitting(false);
    }
  };

  return html`
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-[var(--app-text-primary)]">Discussion Feed</h2>
        <button
          onClick=${() => setShowCreate(!showCreate)}
          className="px-4 py-2 rounded-lg bg-[var(--app-accent)] text-white text-sm font-medium hover:opacity-90"
        >
          ${showCreate ? 'Cancel' : 'Create post'}
        </button>
      </div>

      ${showCreate && html`
        <form onSubmit=${handleCreatePost} className="bg-[var(--app-surface)] border border-[var(--app-border-soft)] rounded-xl p-4 space-y-3">
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
            value=${newChannel || channel}
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
              onClick=${() => onPostClick?.(post.id)}
              className="bg-[var(--app-surface)] border border-[var(--app-border-soft)] rounded-xl p-4 hover:border-[var(--app-accent)] cursor-pointer transition-colors"
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

export default CommunityPage;
