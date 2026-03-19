/**
 * Organisation Hero panel: logo, name, type badge, stats, actions, profile completeness.
 */
import React from 'react';
import htm from 'htm';
import ProfileCompletenessBar from '../institution/components/ProfileCompletenessBar.js';

const html = htm.bind(React.createElement);

const ExternalLinkIcon = () => html`
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
    <polyline points="15 3 21 3 21 9"/>
    <line x1="10" x2="21" y1="14" y2="3"/>
  </svg>
`;

const HeroPanel = ({ organisation, stats, onViewPublic, onSaveDraft, onPublish }) => {
  const buCount = organisation?.business_units_v2?.length ?? organisation?.business_units?.length ?? 0;
  const fnCount = organisation?.functions_v2?.length ?? organisation?.functions?.length ?? 0;
  const roleCount = organisation?.roles_v2?.length ?? organisation?.titles?.length ?? 0;

  return html`
    <div
      className="rounded-2xl border border-[var(--app-border-soft)] bg-white shadow-sm overflow-hidden mb-6"
      style=${{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
    >
      <div className="p-6 border-b border-[var(--app-border-soft)]" style=${{ background: 'var(--app-surface-subtle)' }}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4 min-w-0">
            ${organisation?.logo_url ? html`
              <img src=${organisation.logo_url} alt="" className="h-16 w-16 rounded-xl object-cover flex-shrink-0" />
            ` : html`
              <div
                className="h-16 w-16 rounded-xl flex items-center justify-center text-2xl font-semibold flex-shrink-0"
                style=${{ background: 'var(--app-surface)', color: 'var(--app-text-muted)' }}
              >
                ${(organisation?.name || '?').slice(0, 2).toUpperCase()}
              </div>
            `}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold truncate" style=${{ color: 'var(--app-text-primary)' }}>
                ${organisation?.name || 'Organisation'}
              </h1>
              ${organisation?.organisation_type ? html`
                <span
                  className="inline-block mt-1 px-2.5 py-0.5 text-xs font-medium rounded-lg"
                  style=${{ background: 'var(--app-surface)', color: 'var(--app-text-secondary)' }}
                >
                  ${organisation.organisation_type}
                </span>
              ` : null}
              ${(organisation?.headquarters || organisation?.industry) ? html`
                <p className="mt-1 text-sm truncate" style=${{ color: 'var(--app-text-muted)' }}>
                  ${[organisation?.industry, organisation?.headquarters].filter(Boolean).join(' · ')}
                </p>
              ` : null}
              ${organisation?.website ? html`
                <a
                  href=${organisation.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-1 text-sm hover:underline"
                  style=${{ color: 'var(--app-accent)' }}
                >
                  ${organisation.website}
                  <${ExternalLinkIcon} />
                </a>
              ` : null}
              ${organisation?.founded_year ? html`
                <span className="text-sm mt-1 block" style=${{ color: 'var(--app-text-muted)' }}>
                  Founded ${organisation.founded_year}
                </span>
              ` : null}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            ${onSaveDraft ? html`
              <button
                onClick=${onSaveDraft}
                className="px-4 py-2 rounded-xl font-medium border border-[var(--app-border-soft)] hover:bg-[var(--app-surface-hover)]"
                style=${{ color: 'var(--app-text-secondary)' }}
              >
                Save draft
              </button>
            ` : null}
            ${onPublish ? html`
              <button
                onClick=${onPublish}
                className="px-5 py-2 rounded-xl font-semibold text-white"
                style=${{ background: 'var(--app-accent)' }}
              >
                Publish
              </button>
            ` : null}
            ${onViewPublic && organisation?.slug ? html`
              <button
                onClick=${onViewPublic}
                className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium border border-[var(--app-border-soft)] hover:bg-[var(--app-surface-hover)]"
                style=${{ color: 'var(--app-text-secondary)' }}
              >
                View public page
                <${ExternalLinkIcon} />
              </button>
            ` : null}
          </div>
        </div>
        <div className="mt-4">
          <${ProfileCompletenessBar} institution=${organisation} />
        </div>
        ${stats ? html`
          <div className="flex flex-wrap gap-6 mt-4 text-sm" style=${{ color: 'var(--app-text-secondary)' }}>
            <span>${stats.current_count ?? 0} current</span>
            <span>${stats.alumni_count ?? 0} alumni</span>
            <span>${stats.total_count ?? 0} total</span>
            <span>${buCount} business units</span>
            <span>${fnCount} functions</span>
            <span>${roleCount} roles</span>
          </div>
        ` : null}
        ${organisation?.status === 'placeholder' ? html`
          <span className="inline-block mt-2 px-2.5 py-0.5 text-xs font-medium rounded-lg bg-amber-100 text-amber-800">
            Placeholder
          </span>
        ` : null}
      </div>
    </div>
  `;
};

export default HeroPanel;
