/**
 * Community Detail Page - multi-tab management: Overview, Channels, Members, Moderation, Settings, Visibility, Activity.
 */
import React, { useState, useEffect, useCallback } from 'react';
import htm from 'htm';
import {
  getCommunity,
  listChannels,
  listMembers,
  listPosts,
  getCommunityActivity,
  updateCommunity,
  archiveCommunity,
  deleteCommunity,
  createChannel,
  updateChannel,
  deleteChannel,
  updateMemberRole,
  removeMember,
  banMember,
  updatePostModeration,
  flagPost,
} from './services/communityAdminApi.js';
import SectionCard from '/admin/frontend/src/institution/components/SectionCard.js';
import ChannelManagementTable from './components/ChannelManagementTable.js';
import CommunityMembersTable from './components/CommunityMembersTable.js';
import CommunityModerationTable from './components/CommunityModerationTable.js';
import EmptyState from './components/EmptyState.js';
import ChannelForm from './components/ChannelForm.js';

const html = htm.bind(React.createElement);

const ArrowLeftIcon = () => html`
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="m12 19-7-7 7-7"/>
    <path d="M19 12H5"/>
  </svg>
`;

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'channels', label: 'Channels' },
  { id: 'members', label: 'Members' },
  { id: 'moderation', label: 'Moderation' },
  { id: 'settings', label: 'Settings' },
  { id: 'visibility', label: 'Visibility' },
  { id: 'activity', label: 'Activity Log' },
];

const CommunityDetailPage = ({ communityId, onBack }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [community, setCommunity] = useState(null);
  const [channels, setChannels] = useState([]);
  const [members, setMembers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [settingsForm, setSettingsForm] = useState(null);
  const [visibilityForm, setVisibilityForm] = useState(null);
  const [channelModal, setChannelModal] = useState(null);
  const [dirtySettings, setDirtySettings] = useState(false);
  const [dirtyVisibility, setDirtyVisibility] = useState(false);

  const refresh = useCallback(() => {
    if (!communityId) return;
    setLoading(true);
    setError('');
    getCommunity(communityId)
      .then((c) => {
        setCommunity(c);
        setSettingsForm({ name: c.name, description: c.description, rules: c.rules, posting_permission: c.posting_permission });
        setVisibilityForm({ visibility: c.visibility, discoverable: c.discoverable, join_approval_required: c.join_approval_required });
        if (c.has_channels) {
          return listChannels(communityId).then((r) => setChannels(r.items || []));
        }
        setChannels([]);
      })
      .catch((e) => setError(e.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, [communityId]);

  useEffect(refresh, [refresh]);

  useEffect(() => {
    if (!communityId) return;
    if (activeTab === 'members') listMembers(communityId).then((r) => setMembers(r.items || []));
    if (activeTab === 'moderation') listPosts(communityId).then((r) => setPosts(r.items || []));
    if (activeTab === 'activity') getCommunityActivity(communityId).then((r) => setActivity(r.items || []));
    if (activeTab === 'channels' && community?.has_channels) listChannels(communityId).then((r) => setChannels(r.items || []));
  }, [communityId, activeTab, community?.has_channels]);

  const saveSettings = async () => {
    if (!communityId || !settingsForm) return;
    setSaving(true);
    setError('');
    try {
      await updateCommunity(communityId, {
        name: settingsForm.name,
        description: settingsForm.description,
        rules: settingsForm.rules,
        posting_permission: settingsForm.posting_permission,
      });
      setDirtySettings(false);
      refresh();
    } catch (e) {
      setError(e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const saveVisibility = async () => {
    if (!communityId || !visibilityForm) return;
    setSaving(true);
    setError('');
    try {
      await updateCommunity(communityId, visibilityForm);
      setDirtyVisibility(false);
      refresh();
    } catch (e) {
      setError(e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async () => {
    if (!communityId || !confirm('Archive this community?')) return;
    setSaving(true);
    setError('');
    try {
      await archiveCommunity(communityId);
      onBack?.();
    } catch (e) {
      setError(e.message || 'Failed to archive');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!communityId || !confirm('Permanently delete this community? This cannot be undone.')) return;
    setSaving(true);
    setError('');
    try {
      await deleteCommunity(communityId);
      onBack?.();
    } catch (e) {
      setError(e.message || 'Failed to delete');
    } finally {
      setSaving(false);
    }
  };

  const handleAddChannel = () => setChannelModal({ mode: 'create' });
  const handleEditChannel = (ch) => setChannelModal({ mode: 'edit', channel: ch });
  const handleSubmitChannel = async (data) => {
    try {
      if (channelModal.mode === 'create') {
        await createChannel(communityId, data);
      } else {
        await updateChannel(channelModal.channel.id, data);
      }
      setChannelModal(null);
      listChannels(communityId).then((r) => setChannels(r.items || []));
      refresh();
    } catch (e) {
      setError(e.message || 'Failed to save channel');
    }
  };
  const handleDeleteChannel = async (ch) => {
    if (!confirm(`Delete channel "${ch.name}"?`)) return;
    try {
      await deleteChannel(ch.id);
      listChannels(communityId).then((r) => setChannels(r.items || []));
      refresh();
    } catch (e) {
      setError(e.message || 'Failed to delete');
    }
  };

  const handlePromoteMember = (m) => {
    const next = m.role === 'moderator' ? 'admin' : 'moderator';
    updateMemberRole(communityId, m.userId, { role: next }).then(() => listMembers(communityId).then((r) => setMembers(r.items || [])));
  };
  const handleRemoveMember = async (m) => {
    if (!confirm(`Remove ${m.fullName || 'this member'}?`)) return;
    await removeMember(communityId, m.userId);
    listMembers(communityId).then((r) => setMembers(r.items || []));
    refresh();
  };
  const handleBanMember = async (m) => {
    if (!confirm(`Ban ${m.fullName || 'this member'}? They will be removed and cannot rejoin.`)) return;
    await banMember(communityId, m.userId);
    listMembers(communityId).then((r) => setMembers(r.items || []));
    refresh();
  };

  const handleHidePost = (p) => updatePostModeration(p.id, { moderation_status: 'hidden' }).then(() => listPosts(communityId).then((r) => setPosts(r.items || [])));
  const handleRemovePost = (p) => updatePostModeration(p.id, { moderation_status: 'removed' }).then(() => listPosts(communityId).then((r) => setPosts(r.items || [])));
  const handleLockPost = (p) => updatePostModeration(p.id, { is_locked: !p.isLocked }).then(() => listPosts(communityId).then((r) => setPosts(r.items || [])));
  const handleFlagPost = (p) => flagPost(p.id).then(() => listPosts(communityId).then((r) => setPosts(r.items || [])));

  if (loading && !community) {
    return html`
      <div className="flex items-center justify-center py-16">
        <div className="animate-pulse" style=${{ color: 'var(--app-text-muted)' }}>Loading...</div>
      </div>
    `;
  }
  if (error && !community) {
    return html`
      <div className="p-6">
        <div className="p-4 bg-red-50 rounded-xl text-red-600">${error}</div>
        <button onClick=${onBack} className="mt-4" style=${{ color: 'var(--app-accent)' }}>← Back</button>
      </div>
    `;
  }
  if (!community) return null;

  return html`
    <div className="max-w-4xl pb-24">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick=${onBack}
          className="flex items-center gap-2 px-3 py-2 rounded-xl font-medium transition-colors hover:bg-[var(--app-surface-hover)]"
          style=${{ color: 'var(--app-text-secondary)' }}
        >
          <${ArrowLeftIcon} />
          Back
        </button>
      </div>
      ${error ? html`<div className="mb-6 p-4 bg-red-50 rounded-xl text-sm text-red-600">${error}</div>` : null}

      <div className="rounded-2xl border border-[var(--app-border-soft)] bg-white shadow-sm overflow-hidden mb-6" style=${{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div className="p-6 border-b border-[var(--app-border-soft)]" style=${{ background: 'var(--app-surface-subtle)' }}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold truncate" style=${{ color: 'var(--app-text-primary)' }}>${community.name}</h1>
              <span className="inline-block mt-1 px-2.5 py-0.5 text-xs font-medium rounded-lg" style=${{ background: 'var(--app-surface)', color: 'var(--app-text-secondary)' }}>
                ${(community.type || 'public').charAt(0).toUpperCase() + (community.type || 'public').slice(1)}
              </span>
              ${community.parent_entity_name ? html`<p className="mt-1 text-sm" style=${{ color: 'var(--app-text-muted)' }}>${community.parent_entity_name}</p>` : null}
              ${community.description ? html`<p className="mt-2 text-sm max-w-xl" style=${{ color: 'var(--app-text-secondary)' }}>${community.description}</p>` : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick=${handleArchive} className="px-4 py-2 rounded-xl font-medium border border-amber-200 hover:bg-amber-50 text-amber-700">Archive</button>
              <button onClick=${handleDelete} className="px-4 py-2 rounded-xl font-medium hover:bg-red-50" style=${{ color: 'var(--app-danger)' }}>Delete</button>
            </div>
          </div>
          <div className="flex flex-wrap gap-6 mt-4 text-sm" style=${{ color: 'var(--app-text-secondary)' }}>
            <span>${community.member_count ?? 0} members</span>
            <span>${community.channel_count ?? 0} channels</span>
            <span>${community.post_count ?? 0} posts</span>
            <span>${community.active_users_30d ?? 0} active (30d)</span>
            <span>${community.created_at ? new Date(community.created_at).toLocaleDateString() : ''}</span>
          </div>
        </div>
      </div>

      <div className="border-b border-[var(--app-border-soft)] mb-6">
        <nav className="flex gap-1 overflow-x-auto">
          ${TABS.map((t) => html`
            <button
              key=${t.id}
              onClick=${() => setActiveTab(t.id)}
              className="px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors"
              style=${{
                borderColor: activeTab === t.id ? 'var(--app-accent)' : 'transparent',
                color: activeTab === t.id ? 'var(--app-accent)' : 'var(--app-text-secondary)',
              }}
            >
              ${t.label}
            </button>
          `)}
        </nav>
      </div>

      <div>
        ${activeTab === 'overview' && html`
          <div className="space-y-6">
            <${SectionCard} title="Summary">
              <p className="text-sm" style=${{ color: 'var(--app-text-secondary)' }}>${community.description || 'No description.'}</p>
              <div className="mt-4 flex flex-wrap gap-4 text-sm">
                <span>Status: <strong>${community.status || 'listed'}</strong></span>
                <span>Visibility: <strong>${community.visibility || 'public'}</strong></span>
              </div>
            </${SectionCard}>
          </div>
        `}

        ${activeTab === 'channels' && html`
          <${community.has_channels
            ? html`<${ChannelManagementTable}
              channels=${channels}
              onAdd=${handleAddChannel}
              onEdit=${handleEditChannel}
              onDelete=${handleDeleteChannel}
            />`
            : html`<${EmptyState} heading="Channels disabled" description="This community does not have channels enabled." />`
          }
        `}

        ${activeTab === 'members' && html`
          <${CommunityMembersTable}
            members=${members}
            onPromote=${handlePromoteMember}
            onRemove=${handleRemoveMember}
            onBan=${handleBanMember}
          />
        `}

        ${activeTab === 'moderation' && html`
          <${CommunityModerationTable}
            posts=${posts}
            onHide=${handleHidePost}
            onRemove=${handleRemovePost}
            onLock=${handleLockPost}
            onFlag=${handleFlagPost}
          />
        `}

        ${activeTab === 'settings' && html`
          <${SectionCard} title="Community settings">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style=${{ color: 'var(--app-text-primary)' }}>Name</label>
                <input
                  type="text"
                  value=${settingsForm?.name || ''}
                  onChange=${(e) => { setSettingsForm({ ...settingsForm, name: e.target.value }); setDirtySettings(true); }}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  style=${{ borderColor: 'var(--app-border-soft)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style=${{ color: 'var(--app-text-primary)' }}>Description</label>
                <textarea
                  value=${settingsForm?.description || ''}
                  onChange=${(e) => { setSettingsForm({ ...settingsForm, description: e.target.value }); setDirtySettings(true); }}
                  rows=${4}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  style=${{ borderColor: 'var(--app-border-soft)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style=${{ color: 'var(--app-text-primary)' }}>Rules</label>
                <textarea
                  value=${settingsForm?.rules || ''}
                  onChange=${(e) => { setSettingsForm({ ...settingsForm, rules: e.target.value }); setDirtySettings(true); }}
                  rows=${3}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  style=${{ borderColor: 'var(--app-border-soft)' }}
                  placeholder="Community rules..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style=${{ color: 'var(--app-text-primary)' }}>Posting permission</label>
                <select
                  value=${settingsForm?.posting_permission || 'members'}
                  onChange=${(e) => { setSettingsForm({ ...settingsForm, posting_permission: e.target.value }); setDirtySettings(true); }}
                  className="px-3 py-2 border rounded-lg text-sm"
                  style=${{ borderColor: 'var(--app-border-soft)' }}
                >
                  <option value="anyone">Anyone</option>
                  <option value="members">Members only</option>
                  <option value="moderators">Moderators only</option>
                </select>
              </div>
              ${dirtySettings ? html`
                <button onClick=${saveSettings} disabled=${saving} className="px-4 py-2 rounded-lg text-sm font-medium text-white" style=${{ background: 'var(--app-accent)' }}>
                  ${saving ? 'Saving...' : 'Save'}
                </button>
              ` : null}
            </div>
          </${SectionCard}>
        `}

        ${activeTab === 'visibility' && html`
          <${SectionCard} title="Visibility & discovery">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style=${{ color: 'var(--app-text-primary)' }}>Visibility</label>
                <select
                  value=${visibilityForm?.visibility || 'public'}
                  onChange=${(e) => { setVisibilityForm({ ...visibilityForm, visibility: e.target.value }); setDirtyVisibility(true); }}
                  className="px-3 py-2 border rounded-lg text-sm"
                  style=${{ borderColor: 'var(--app-border-soft)' }}
                >
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="discoverable"
                  checked=${visibilityForm?.discoverable !== false}
                  onChange=${(e) => { setVisibilityForm({ ...visibilityForm, discoverable: e.target.checked }); setDirtyVisibility(true); }}
                />
                <label htmlFor="discoverable" className="text-sm" style=${{ color: 'var(--app-text-primary)' }}>Discoverable in search</label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="join_approval"
                  checked=${visibilityForm?.join_approval_required === true}
                  onChange=${(e) => { setVisibilityForm({ ...visibilityForm, join_approval_required: e.target.checked }); setDirtyVisibility(true); }}
                />
                <label htmlFor="join_approval" className="text-sm" style=${{ color: 'var(--app-text-primary)' }}>Join approval required</label>
              </div>
              ${dirtyVisibility ? html`
                <button onClick=${saveVisibility} disabled=${saving} className="px-4 py-2 rounded-lg text-sm font-medium text-white" style=${{ background: 'var(--app-accent)' }}>
                  ${saving ? 'Saving...' : 'Save'}
                </button>
              ` : null}
            </div>
          </${SectionCard}>
        `}

        ${activeTab === 'activity' && html`
          ${activity.length ? html`
            <div className="overflow-x-auto rounded-xl border" style=${{ borderColor: 'var(--app-border-soft)' }}>
              <table className="w-full text-sm">
                <thead style=${{ background: 'var(--app-surface-subtle)' }}>
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold" style=${{ color: 'var(--app-text-primary)' }}>Action</th>
                    <th className="text-left px-4 py-3 font-semibold" style=${{ color: 'var(--app-text-primary)' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  ${activity.map((a) => html`
                    <tr key=${a.id} className="border-t" style=${{ borderColor: 'var(--app-border-soft)' }}>
                      <td className="px-4 py-3" style=${{ color: 'var(--app-text-primary)' }}>${a.action || '—'}</td>
                      <td className="px-4 py-3 text-xs" style=${{ color: 'var(--app-text-muted)' }}>${(a.timestamp || a.created_at) ? new Date(a.timestamp || a.created_at).toLocaleString() : '—'}</td>
                    </tr>
                  `)}
                </tbody>
              </table>
            </div>
          ` : html`
            <${EmptyState} heading="No admin actions yet" description="Moderation and admin actions will appear here." />
          `}
        `}
      </div>

      ${channelModal ? html`
        <${ChannelForm}
          channel=${channelModal.channel}
          onSubmit=${handleSubmitChannel}
          onCancel=${() => setChannelModal(null)}
        />
      ` : null}
    </div>
  `;
};

export default CommunityDetailPage;
