/**
 * Community creation page - form with institutions/orgs dropdowns, optional channels.
 */
import React, { useState, useEffect } from 'react';
import htm from 'htm';
import { apiRequest } from '/shared/services/apiBase.js';
import { createCommunity, createChannel } from './services/communityAdminApi.js';
import CommunityForm from './components/CommunityForm.js';

const html = htm.bind(React.createElement);

const ArrowLeftIcon = () => html`
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="m12 19-7-7 7-7"/>
    <path d="M19 12H5"/>
  </svg>
`;

const CommunityCreatePage = ({ onBack, onCreated }) => {
  const [institutions, setInstitutions] = useState([]);
  const [organisations, setOrganisations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      apiRequest('/v1/admin/institutions/listed').catch(() => ({ listed: [] })),
      apiRequest('/v1/admin/organisations/listed').catch(() => ({ listed: [] })),
    ]).then(([instRes, orgRes]) => {
      setInstitutions(instRes?.listed || []);
      setOrganisations(orgRes?.listed || []);
    });
  }, []);

  const handleSubmit = async (payload) => {
    setLoading(true);
    setError('');
    try {
      const { channels, ...rest } = payload;
      const res = await createCommunity(rest);
      const cid = res?.id;
      if (cid && channels?.length) {
        for (const ch of channels) {
          if (ch.name?.trim()) await createChannel(cid, { name: ch.name.trim(), description: ch.description || '' });
        }
      }
      if (onCreated) onCreated(cid);
      else {
        window.history.pushState(null, '', `/admin/communities/${cid}`);
        window.dispatchEvent(new CustomEvent('ithras:path-changed'));
      }
    } catch (e) {
      setError(e.message || 'Failed to create community');
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    if (onBack) onBack();
    else {
      window.history.pushState(null, '', '/admin/communities');
      window.dispatchEvent(new CustomEvent('ithras:path-changed'));
    }
  };

  return html`
    <div>
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick=${goBack}
          className="flex items-center gap-2 px-3 py-2 rounded-xl font-medium transition-colors hover:bg-[var(--app-surface-hover)]"
          style=${{ color: 'var(--app-text-secondary)' }}
        >
          <${ArrowLeftIcon} />
          Back
        </button>
      </div>
      ${error ? html`<div className="mb-6 p-4 bg-red-50 rounded-xl text-sm text-red-600">${error}</div>` : null}
      <${CommunityForm}
        institutions=${institutions}
        organisations=${organisations}
        onSubmit=${handleSubmit}
        onCancel=${goBack}
      />
      ${loading ? html`<div className="mt-4 text-sm" style=${{ color: 'var(--app-text-muted)' }}>Creating...</div>` : null}
    </div>
  `;
};

export default CommunityCreatePage;
