/**
 * Public organisation page - /o/{slug}
 */
import React, { useState, useEffect } from 'react';
import htm from 'htm';
import { getPublicOrganisation } from '/shared/services/index.js';
import IthrasLogo from '/shared/components/IthrasLogo.js';

const html = htm.bind(React.createElement);

const getInitials = (name) =>
  (name || '?')
    .split(/\s+/)
    .map((s) => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

const PublicOrganisationPage = ({ slug }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!slug) return;
    getPublicOrganisation(slug)
      .then(setData)
      .catch((e) => setError(e.message || 'Not found'))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return html`<div className="min-h-screen flex items-center justify-center text-[var(--app-text-muted)]">Loading...</div>`;
  if (error || !data) return html`<div className="min-h-screen flex flex-col items-center justify-center p-8"><p className="text-[var(--app-danger)]">${error || 'Organisation not found'}</p><a href="/" className="mt-4 text-[var(--app-accent)]">Go home</a></div>`;

  const org = data.organisation || {};
  const combos = data.combos || [];
  const current = data.current_count ?? 0;
  const alumni = data.alumni_count ?? 0;
  const total = data.total_count ?? current + alumni;
  const isPlaceholder = org.status === 'placeholder';

  return html`
    <div className="min-h-screen flex flex-col bg-[var(--app-bg)]">
      <header className="flex-shrink-0 flex items-center justify-between px-4 md:px-6 py-3 border-b border-[var(--app-border-soft)] bg-[var(--app-surface)]">
        <${IthrasLogo} size="sm" theme="dark" />
        <a href="/" className="text-sm font-medium text-[var(--app-text-secondary)]">Ithras</a>
      </header>
      <main className="flex-1 p-8 max-w-2xl mx-auto w-full">
        ${isPlaceholder ? html`
          <div className="mb-4 p-4 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 text-sm">
            Pending verification. This organisation has been added by a user and is awaiting admin approval.
          </div>
        ` : null}
        <div className="app-card p-6 rounded-xl border border-[var(--app-border-soft)] bg-[var(--app-surface)]">
          <div className="flex items-start gap-4">
            ${org.logo_url
              ? html`<img src=${org.logo_url} alt="" className="h-16 w-16 rounded-lg object-cover flex-shrink-0" />`
              : html`
                <div
                  className="h-16 w-16 rounded-lg flex items-center justify-center text-xl font-semibold flex-shrink-0"
                  style=${{ background: 'var(--app-surface-subtle)', color: 'var(--app-text-muted)' }}
                >
                  ${getInitials(org.name)}
                </div>
              `}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-semibold text-[var(--app-text-primary)]">${org.name || slug}</h1>
              <div className="flex gap-4 mt-2 text-sm text-[var(--app-text-secondary)]">
                <span>${current} current</span>
                <span>${alumni} alumni</span>
                <span>${total} total</span>
              </div>
              ${org.website ? html`<a href=${org.website} target="_blank" rel="noopener noreferrer" className="mt-2 text-sm text-[var(--app-accent)] hover:underline block">${org.website}</a>` : null}
            </div>
          </div>
          ${org.description ? html`<p className="mt-4 text-sm text-[var(--app-text-secondary)] leading-relaxed">${org.description}</p>` : null}
        </div>
        ${combos.length > 0 ? html`
          <section className="mt-8">
            <h2 className="text-lg font-semibold text-[var(--app-text-primary)] mb-4">Roles</h2>
            <div className="space-y-2">
              ${combos.map((c, i) => html`
                <div key=${i} className="app-card p-3 rounded-lg border border-[var(--app-border-soft)]">
                  <p className="font-medium">${c.title}</p>
                  ${(c.business_unit || c.function) ? html`<p className="text-sm text-[var(--app-text-secondary)]">${[c.business_unit, c.function].filter(Boolean).join(' · ')}</p>` : null}
                </div>
              `)}
            </div>
          </section>
        ` : null}
      </main>
    </div>
  `;
};

export default PublicOrganisationPage;
