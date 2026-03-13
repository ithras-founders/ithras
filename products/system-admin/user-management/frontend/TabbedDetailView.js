import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

/**
 * Shared wrapper for detail views with back button, tab bar, and loading state.
 * @param {object} props
 * @param {string} props.title - entity title (e.g. institution name)
 * @param {string|React.ReactNode} [props.subtitle] - optional subtitle (string or React node for badges)
 * @param {Array<{id: string, label: string}>} props.tabs - tab definitions (for layout='tabs')
 * @param {Array<{id: string, label: string}>} [props.primaryTabs] - primary tab definitions (for layout='primary-secondary')
 * @param {Record<string, Array<{id: string, label: string}>>} [props.secondaryByPrimary] - map primary id -> secondary tabs
 * @param {string} props.activeTab - current tab id
 * @param {function} props.onTabChange - called with tab id
 * @param {function} props.onBack - back button handler
 * @param {boolean} props.loading - show loading skeleton
 * @param {React.ReactNode} [props.headerActions] - buttons rendered in the header area
 * @param {string} [props.layout='tabs'] - 'tabs' = single row, 'primary-secondary' = two-row horizontal
 * @param {React.ReactNode} props.children - tab content
 */
const TabbedDetailView = ({
  title,
  subtitle,
  tabs,
  primaryTabs,
  secondaryByPrimary = {},
  activeTab,
  onTabChange,
  onBack,
  loading,
  headerActions,
  layout = 'tabs',
  children,
}) => {
  if (loading) {
    return html`
      <div className="p-6 space-y-4 animate-pulse">
        <div className="h-8 bg-[var(--app-surface-muted)] rounded w-1/3"></div>
        <div className="h-4 bg-[var(--app-surface-muted)] rounded w-1/4"></div>
        <div className="h-64 bg-[var(--app-surface-muted)] rounded"></div>
      </div>
    `;
  }

  const usePrimarySecondary = layout === 'primary-secondary' && primaryTabs && primaryTabs.length > 0;

  const getActivePrimary = () => {
    if (!usePrimarySecondary) return null;
    for (const p of primaryTabs) {
      if (activeTab === p.id) return p.id;
      const secondaries = secondaryByPrimary[p.id] || [];
      if (secondaries.some(s => s.id === activeTab)) return p.id;
    }
    return primaryTabs[0]?.id || null;
  };

  const activePrimary = getActivePrimary();
  const secondaries = activePrimary ? (secondaryByPrimary[activePrimary] || []) : [];

  const renderNav = () => {
    if (usePrimarySecondary) {
      return html`
        <div className="space-y-2">
          <div className="flex gap-1 bg-[var(--app-surface-muted)] p-1 rounded-[var(--app-radius-card)] overflow-x-auto">
            ${primaryTabs.map((t) => html`
              <button
                key=${t.id}
                onClick=${() => {
                  const secs = secondaryByPrimary[t.id] || [];
                  onTabChange(secs.length > 0 ? secs[0].id : t.id);
                }}
                className=${'px-4 py-2.5 text-sm font-semibold rounded-xl whitespace-nowrap transition-all ' + (activePrimary === t.id ? 'bg-[var(--app-surface)] text-[var(--app-text-primary)] shadow-[var(--app-shadow-subtle)]' : 'text-[var(--app-text-secondary)] hover:text-[var(--app-text-primary)]')}
              >
                ${t.label}
              </button>
            `)}
          </div>
          ${secondaries.length > 0 ? html`
            <div className="flex gap-1">
              ${secondaries.map((s) => html`
                <button
                  key=${s.id}
                  onClick=${() => onTabChange(s.id)}
                  className=${'px-3 py-1.5 text-xs font-medium rounded-lg transition-all ' + (activeTab === s.id ? 'bg-[var(--app-accent-soft)] text-[var(--app-accent)]' : 'text-[var(--app-text-secondary)] hover:bg-[var(--app-surface-muted)] hover:text-[var(--app-text-primary)]')}
                >
                  ${s.label}
                </button>
              `)}
            </div>
          ` : null}
        </div>
      `;
    }
    return html`
      <div className="flex gap-1 bg-[var(--app-surface-muted)] p-1 rounded-[var(--app-radius-card)] overflow-x-auto">
        ${(tabs || []).map((t) => html`
          <button
            key=${t.id}
            onClick=${() => onTabChange(t.id)}
            className=${'px-4 py-2.5 text-sm font-semibold rounded-xl whitespace-nowrap transition-all ' + (activeTab === t.id ? 'bg-[var(--app-surface)] text-[var(--app-text-primary)] shadow-[var(--app-shadow-subtle)]' : 'text-[var(--app-text-secondary)] hover:text-[var(--app-text-primary)]')}
          >
            ${t.label}
          </button>
        `)}
      </div>
    `;
  };

  return html`
    <div className="p-6">
      <div className="flex items-center gap-3 mb-4">
        ${onBack ? html`
          <button onClick=${onBack} className="p-1 rounded-lg hover:bg-[var(--app-surface-muted)] transition-colors">
            <svg className="w-5 h-5 text-[var(--app-text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
          </button>
        ` : null}
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-[var(--app-text-primary)] truncate">${title || 'Detail'}</h2>
          ${subtitle ? html`<div className="text-sm text-[var(--app-text-muted)] flex items-center gap-2 flex-wrap">${typeof subtitle === 'string' ? subtitle : subtitle}</div>` : null}
        </div>
        ${headerActions || null}
      </div>

      <div className="mb-6">${renderNav()}</div>
      ${children}
    </div>
  `;
};

export default React.memo(TabbedDetailView);
