import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

const AUTO_POPULATED = ['name', 'email', 'roll_number', 'college_name', 'program', 'profile_photo', 'phone', 'linkedin_url', 'portfolio_url'];
const SUMMARY_ITEM_RE = /^summary_item_\d+$/;

const AutoVariables = ({ user, template, cvData = {}, onSummaryChange }) => {
  const config = template?.config || {};
  const autoVariables = config.autoVariables || [];
  const summaryBarItems = config.fixedElements?.summaryBar?.items || [];

  const summaryVars = [...new Set([
    ...autoVariables.filter((v) => typeof v === 'string' && SUMMARY_ITEM_RE.test(v)),
    ...summaryBarItems
      .filter((i) => typeof i === 'string')
      .map((i) => (i.match(/\{\{(\w+)\}\}/) || [])[1])
      .filter(Boolean),
  ])].sort((a, b) => {
    const na = parseInt(a.replace('summary_item_', ''), 10);
    const nb = parseInt(b.replace('summary_item_', ''), 10);
    return na - nb;
  });

  const displayVars = autoVariables.filter((v) => typeof v === 'string' && !SUMMARY_ITEM_RE.test(v));
  const hasAuto = displayVars.length > 0;
  const hasSummary = summaryVars.length > 0 && onSummaryChange != null;

  if (!hasAuto && !hasSummary) return null;

  const getVariableValue = (varName) => {
    switch (varName) {
      case 'name': return user?.name || 'N/A';
      case 'email': return user?.email || 'N/A';
      case 'roll_number': return user?.roll_number || user?.id || 'N/A';
      case 'college_name': return user?.institution?.name || 'N/A';
      case 'program': return user?.program || 'N/A';
      default: return 'N/A';
    }
  };

  const getSummaryValue = (varName) => {
    return cvData[varName] ?? cvData._summaryItems?.[parseInt(varName.replace('summary_item_', ''), 10) - 1] ?? '';
  };

  return html`
    <div className="space-y-4 mb-4">
      ${hasSummary ? html`
        <div className="border border-[rgba(245,158,11,0.24)] rounded-[var(--app-radius-sm)] p-4 bg-[rgba(245,158,11,0.1)]">
          <h2 className="text-lg font-semibold mb-3 text-[var(--app-text-primary)]">Summary Points (Top Banner)</h2>
          <p className="text-xs text-[rgb(146,64,14)] mb-3">Add 1–3 key highlights that appear in the dark bar below your name.</p>
          <div className="space-y-3">
            ${summaryVars.map((varName, idx) => html`
              <div key=${varName}>
                <label className="block text-xs font-medium text-[var(--app-text-secondary)] mb-1">${varName.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}</label>
                <input
                  type="text"
                  value=${getSummaryValue(varName)}
                  onChange=${(e) => onSummaryChange(varName, e.target.value)}
                  placeholder="e.g. IIM CALCUTTA TOP 6% | ABG INTERN"
                  className="w-full px-3 py-2 border border-[var(--app-border-soft)] rounded-[var(--app-radius-sm)] text-sm app-input app-focus-ring"
                />
              </div>
            `)}
          </div>
        </div>
      ` : ''}

      ${hasAuto ? html`
        <div className="border border-[var(--app-border-soft)] rounded-[var(--app-radius-sm)] p-4 bg-[var(--app-surface-muted)]">
          <h2 className="text-lg font-semibold mb-2 text-[var(--app-text-primary)]">Auto-Populated Information</h2>
          <div className="grid grid-cols-2 gap-2 text-sm">
            ${displayVars.map((varName) => html`
              <div key=${varName}>
                <span className="font-medium">${varName.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}:</span>
                <span className="ml-2">${getVariableValue(varName)}</span>
              </div>
            `)}
          </div>
          <p className="text-xs text-[var(--app-text-muted)] mt-2">This information will be automatically included in your CV.</p>
        </div>
      ` : ''}
    </div>
  `;
};

export default AutoVariables;
