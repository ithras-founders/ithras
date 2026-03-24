/**
 * Community Management - overview page with table and filters.
 */
import React, { useState, useEffect, useCallback } from 'react';
import htm from 'htm';
import { apiRequest } from '/shared/services/apiBase.js';
import {
  listCommunities,
  archiveCommunity,
  deleteCommunity,
} from './services/communityAdminApi.js';
import CommunityFilters from './components/CommunityFilters.js';
import CommunityTable from './components/CommunityTable.js';
import EmptyState from './components/EmptyState.js';

const html = htm.bind(React.createElement);

const CommunityManagement = ({ onNavigateToDetail, onNavigateToCreate, onNavigateToRequests }) => {
  const [communities, setCommunities] = useState([]);
  const [total, setTotal] = useState(0);
  const [institutions, setInstitutions] = useState([]);
  const [organisations, setOrganisations] = useState([]);
  const [filters, setFilters] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    listCommunities(filters)
      .then(({ items, total: t }) => {
        setCommunities(items);
        setTotal(t);
      })
      .catch((e) => setError(e.message || 'Failed to load communities'))
      .finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => {
    Promise.all([
      apiRequest('/v1/admin/institutions/listed').catch(() => ({ listed: [] })),
      apiRequest('/v1/admin/organisations/listed').catch(() => ({ listed: [] })),
    ]).then(([instRes, orgRes]) => {
      setInstitutions(instRes?.listed || []);
      setOrganisations(orgRes?.listed || []);
    });
  }, []);

  useEffect(load, [load]);

  const handleView = (c) => {
    if (onNavigateToDetail) onNavigateToDetail(c.id);
    else {
      window.history.pushState(null, '', `/admin/communities/${c.id}`);
      window.dispatchEvent(new CustomEvent('ithras:path-changed'));
    }
  };

  const handleEdit = (c) => {
    window.history.pushState(null, '', `/admin/communities/${c.id}`);
    window.dispatchEvent(new CustomEvent('ithras:path-changed'));
  };

  const handleManageChannels = (c) => {
    window.history.pushState(null, '', `/admin/communities/${c.id}`);
    window.dispatchEvent(new CustomEvent('ithras:path-changed'));
  };

  const handleModerate = (c) => {
    window.history.pushState(null, '', `/admin/communities/${c.id}`);
    window.dispatchEvent(new CustomEvent('ithras:path-changed'));
  };

  const handleArchive = async (c) => {
    if (!confirm(`Archive community "${c.name}"?`)) return;
    try {
      await archiveCommunity(c.id);
      load();
    } catch (e) {
      setError(e.message || 'Failed to archive');
    }
  };

  const handleDelete = async (c) => {
    if (!confirm(`Permanently delete community "${c.name}"? This cannot be undone.`)) return;
    try {
      await deleteCommunity(c.id);
      load();
    } catch (e) {
      setError(e.message || 'Failed to delete');
    }
  };

  const goToCreate = () => {
    if (onNavigateToCreate) onNavigateToCreate();
    else {
      window.history.pushState(null, '', '/admin/communities/new');
      window.dispatchEvent(new CustomEvent('ithras:path-changed'));
    }
  };

  const goToRequests = () => {
    if (onNavigateToRequests) onNavigateToRequests();
    else {
      window.history.pushState(null, '', '/admin/community-requests');
      window.dispatchEvent(new CustomEvent('ithras:path-changed'));
    }
  };

  const goToChannelRequests = () => {
    window.history.pushState(null, '', '/admin/channel-requests');
    window.dispatchEvent(new CustomEvent('ithras:path-changed'));
  };

  return html`
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold" style=${{ color: 'var(--app-text-primary)' }}>Community Management</h1>
        <div className="flex flex-wrap gap-2">
          <button
            onClick=${goToRequests}
            className="px-4 py-2 rounded-lg text-sm font-medium border"
            style=${{ borderColor: 'var(--app-border-soft)', color: 'var(--app-text-secondary)' }}
          >
            Community requests
          </button>
          <button
            onClick=${goToChannelRequests}
            className="px-4 py-2 rounded-lg text-sm font-medium border"
            style=${{ borderColor: 'var(--app-border-soft)', color: 'var(--app-text-secondary)' }}
          >
            Channel requests
          </button>
          <button
            onClick=${goToCreate}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white"
            style=${{ background: 'var(--app-accent)' }}
          >
            Create Community
          </button>
        </div>
      </div>
      ${error ? html`<div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">${error}</div>` : null}
      <${CommunityFilters}
        filters=${filters}
        onChange=${setFilters}
        institutions=${institutions}
        organisations=${organisations}
      />
      ${loading ? html`
        <div className="flex items-center gap-2 py-12 text-[var(--app-text-muted)]">
          <div className="animate-spin h-5 w-5 border-2 border-[var(--app-accent)] border-t-transparent rounded-full"></div>
          Loading...
        </div>
      ` : communities.length === 0 ? html`
        <${EmptyState}
          heading="No communities created yet"
          description="Create a community to get started, or approve a community request."
          action=${html`
            <button
              onClick=${goToCreate}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white"
              style=${{ background: 'var(--app-accent)' }}
            >
              Create Community
            </button>
          `}
        />
      ` : html`
        <${CommunityTable}
          communities=${communities}
          onView=${handleView}
          onEdit=${handleEdit}
          onManageChannels=${handleManageChannels}
          onModerate=${handleModerate}
          onArchive=${handleArchive}
          onDelete=${handleDelete}
        />
        ${total > communities.length ? html`<p className="mt-4 text-sm" style=${{ color: 'var(--app-text-muted)' }}>Showing ${communities.length} of ${total}</p>` : null}
      `}
    </div>
  `;
};

export default CommunityManagement;
