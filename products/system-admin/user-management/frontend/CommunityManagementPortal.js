import React, { useState, useEffect, useCallback } from 'react';
import htm from 'htm';
import {
  listPrepAdminPosts,
  listPrepModerators,
  assignPrepModerator,
  removePrepModerator,
  unhidePrepPost,
  pinPrepPost,
  unpinPrepPost,
} from '/core/frontend/src/modules/shared/services/api/preparation.js';
import { getUsers } from '/core/frontend/src/modules/shared/services/api/core.js';

const html = htm.bind(React.createElement);

const formatTimeAgo = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const s = Math.floor((now - d) / 1000);
  if (s < 60) return 'Just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return d.toLocaleDateString();
};

const CommunityManagementPortal = ({ onBack }) => {
  const [tab, setTab] = useState('moderation');
  const [posts, setPosts] = useState([]);
  const [moderators, setModerators] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('HIDDEN');

  const fetchModerationPosts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listPrepAdminPosts({ status: statusFilter, limit: 50 });
      setPosts(Array.isArray(data) ? data : []);
      setError(null);
    } catch (e) {
      setError(e.message || 'Failed to load posts');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  const fetchModerators = useCallback(async () => {
    try {
      const data = await listPrepModerators();
      setModerators(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || 'Failed to load moderators');
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await getUsers?.({ limit: 200 }) || { items: [] };
      setUsers(res?.items ?? []);
    } catch (_) {
      setUsers([]);
    }
  }, []);

  useEffect(() => {
    if (tab === 'moderation') fetchModerationPosts();
    else fetchModerators();
  }, [tab, fetchModerationPosts, fetchModerators]);

  useEffect(() => {
    if (tab === 'moderators') fetchUsers();
  }, [tab, fetchUsers]);

  const handleUnhide = async (postId) => {
    try {
      await unhidePrepPost(postId);
      fetchModerationPosts();
    } catch (e) {
      setError(e.message);
    }
  };

  const handlePin = async (postId) => {
    try {
      await pinPrepPost(postId);
      fetchModerationPosts();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleUnpin = async (postId) => {
    try {
      await unpinPrepPost(postId);
      fetchModerationPosts();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleAssignModerator = async (userId) => {
    try {
      await assignPrepModerator(userId);
      fetchModerators();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleRemoveModerator = async (userId) => {
    try {
      await removePrepModerator(userId);
      fetchModerators();
    } catch (e) {
      setError(e.message);
    }
  };

  return html`
    <div className="w-full px-4 md:px-6 pt-6 pb-20 space-y-6">
      ${onBack && html`
        <button onClick=${onBack} className="text-sm text-[var(--app-accent)] hover:underline flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
          Back
        </button>
      `}

      <h1 className="text-2xl font-semibold text-[var(--app-text-primary)]">Community Management</h1>

      <div className="flex gap-2 border-b border-[var(--app-border-soft)] pb-2">
        <button
          onClick=${() => setTab('moderation')}
          className=${`px-3 py-1.5 rounded-lg text-sm font-medium ${tab === 'moderation' ? 'bg-[var(--app-accent-soft)] text-[var(--app-accent)]' : 'text-[var(--app-text-secondary)]'}`}
        >
          Moderation Queue
        </button>
        <button
          onClick=${() => setTab('moderators')}
          className=${`px-3 py-1.5 rounded-lg text-sm font-medium ${tab === 'moderators' ? 'bg-[var(--app-accent-soft)] text-[var(--app-accent)]' : 'text-[var(--app-text-secondary)]'}`}
        >
          Moderators
        </button>
      </div>

      ${error && html`<p className="text-red-500 text-sm">${error}</p>`}

      ${tab === 'moderation' && html`
        <div className="space-y-4">
          <div className="flex gap-2">
            <select
              value=${statusFilter}
              onChange=${(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-[var(--app-border-soft)] bg-[var(--app-bg)] text-[var(--app-text-primary)]"
            >
              <option value="HIDDEN">Hidden</option>
              <option value="DELETED">Deleted</option>
              <option value="ACTIVE">Active</option>
            </select>
          </div>
          ${loading ? html`<p className="text-[var(--app-text-secondary)]">Loading...</p>` : html`
            <div className="space-y-3">
              ${posts.length === 0 ? html`<p className="text-[var(--app-text-secondary)] py-4">No posts in this status.</p>` : posts.map((post) => html`
                <div key=${post.id} className="bg-[var(--app-surface)] border border-[var(--app-border-soft)] rounded-xl p-4">
                  <h3 className="font-semibold text-[var(--app-text-primary)]">${post.title}</h3>
                  <p className="text-sm text-[var(--app-text-muted)] mt-1">${post.channel} · ${formatTimeAgo(post.created_at)} · Status: ${post.status}</p>
                  <div className="flex gap-2 mt-2">
                    ${post.status !== 'ACTIVE' && html`
                      <button onClick=${() => handleUnhide(post.id)} className="px-3 py-1 rounded bg-green-600 text-white text-sm">Unhide</button>
                    `}
                    ${post.pinned_at ? html`
                      <button onClick=${() => handleUnpin(post.id)} className="px-3 py-1 rounded bg-gray-600 text-white text-sm">Unpin</button>
                    ` : html`
                      <button onClick=${() => handlePin(post.id)} className="px-3 py-1 rounded bg-[var(--app-accent)] text-white text-sm">Pin</button>
                    `}
                  </div>
                </div>
              `)}
            </div>
          `}
        </div>
      `}

      ${tab === 'moderators' && html`
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-[var(--app-text-primary)]">Current Moderators</h2>
          <div className="space-y-2">
            ${moderators.map((m) => html`
              <div key=${m.user_id} className="flex items-center justify-between bg-[var(--app-surface)] border border-[var(--app-border-soft)] rounded-lg p-3">
                <span className="text-[var(--app-text-primary)]">${m.name || m.email} (${m.role_id})</span>
                <button onClick=${() => handleRemoveModerator(m.user_id)} className="text-red-500 text-sm hover:underline">Remove</button>
              </div>
            `)}
          </div>
          <h2 className="text-lg font-semibold text-[var(--app-text-primary)] mt-6">Add Moderator</h2>
          <select
            onChange=${(e) => { const v = e.target.value; if (v) handleAssignModerator(v); e.target.value = ''; }}
            className="px-3 py-2 rounded-lg border border-[var(--app-border-soft)] bg-[var(--app-bg)] text-[var(--app-text-primary)] w-full max-w-md"
          >
            <option value="">Select user...</option>
            ${users.filter((u) => !moderators.some((m) => m.user_id === u.id)).map((u) => html`
              <option key=${u.id} value=${u.id}>${u.name || u.email} (${u.email})</option>
            `)}
          </select>
        </div>
      `}
    </div>
  `;
};

export default CommunityManagementPortal;
