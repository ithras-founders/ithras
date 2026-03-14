import React from 'react';
import htm from 'htm';
import { EmptyState } from '/core/frontend/src/modules/shared/index.js';

const html = htm.bind(React.createElement);

const ActiveProcessesView = ({ activeShortlists, companies }) => {
  const processes = (activeShortlists || []).map(s => ({
    id: s.id,
    company_id: s.company_id,
    status: s.status,
    company: companies.find(c => c.id === s.company_id) || { name: 'Unknown' },
  }));

  return html`
    <div className="space-y-12 animate-in pb-20">
      <div className="grid gap-6">
        ${processes.length === 0 ? html`
          <${EmptyState}
            title="No active processes yet"
            message="When you're shortlisted or have applications in progress, they'll appear here."
          />
        ` : processes.map(p => html`
          <div key=${p.id} className="bg-[var(--app-surface)] p-8 rounded-[var(--app-radius-md)] border border-[var(--app-border-soft)] shadow-[var(--app-shadow-subtle)] flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-[var(--app-text-primary)]">${p.company?.name || companies.find(c => c.id === p.company_id)?.name || 'Company'}</h3>
              <p className="text-sm text-[var(--app-text-secondary)] mt-1">Process ID: ${p.id}</p>
            </div>
            <span className=${`px-4 py-2 rounded-xl text-[10px] font-semibold uppercase ${
              p.status === 'Active' || p.status === 'SHORTLISTED' ? 'bg-[rgba(52,199,89,0.12)] text-[var(--app-success)]' :
              p.status === 'SUBMITTED' ? 'bg-[var(--app-accent-soft)] text-[var(--app-accent)]' :
              'bg-[var(--app-surface-muted)] text-[var(--app-text-secondary)]'
            }`}>${p.status}</span>
          </div>
        `)}
      </div>
    </div>
  `;
};

export default ActiveProcessesView;
