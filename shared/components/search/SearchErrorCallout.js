/**
 * Search API error: short public copy; developer setup collapsed by default.
 */
import React, { useState } from 'react';
import htm from 'htm';
import { SEARCH_DEV_DOC_PATH } from '/shared/utils/searchApiErrors.js';

const html = htm.bind(React.createElement);

/**
 * @param {{
 *   formatted: {
 *     shortTitle: string,
 *     userSummary: string | null,
 *     devHints: string[] | null,
 *     hints: string[] | null,
 *     rawMessage: string,
 *     showRawDetails: boolean,
 *   } | null,
 * }}
 */
const SearchErrorCallout = ({ formatted }) => {
  const [rawOpen, setRawOpen] = useState(false);
  if (!formatted) return null;
  const { shortTitle, userSummary, devHints, hints, rawMessage, showRawDetails } = formatted;
  return html`
    <div
      className="p-3 rounded-[var(--radius-lg)] text-sm mb-4 border"
      style=${{
        color: 'var(--status-danger-text, #b91c1c)',
        background: 'var(--app-danger-soft)',
        borderColor: 'var(--app-border-soft)',
      }}
      role="alert"
    >
      <p className="font-semibold">${shortTitle}</p>
      ${userSummary ? html`<p className="mt-2 text-xs leading-relaxed opacity-95">${userSummary}</p>` : null}
      ${devHints && devHints.length
        ? html`
            <details className="mt-3 rounded-lg border px-2 py-1.5" style=${{ borderColor: 'var(--app-border-soft)' }}>
              <summary
                className="text-xs font-medium cursor-pointer select-none ith-focus-ring rounded py-1"
                style=${{ color: 'var(--app-accent)' }}
              >
                Developer setup
              </summary>
              <ul className="mt-2 list-disc list-inside text-xs space-y-1 opacity-95 pl-0.5 pb-1">
                ${devHints.map((h, i) => html`<li key=${i}>${h}</li>`)}
              </ul>
              <p className="text-[11px] pb-2 text-[var(--app-text-muted)]">
                Full guide: <code className="text-[var(--app-text-secondary)]">${SEARCH_DEV_DOC_PATH}</code>
              </p>
            </details>
          `
        : null}
      ${hints && hints.length
        ? html`
            <ul className="mt-2 list-disc list-inside text-xs space-y-1 opacity-95">
              ${hints.map((h, i) => html`<li key=${i}>${h}</li>`)}
            </ul>
          `
        : null}
      ${showRawDetails
        ? html`
            <div className="mt-2">
              <button
                type="button"
                className="text-xs font-medium text-[var(--app-accent)] ith-focus-ring"
                onClick=${() => setRawOpen((o) => !o)}
              >
                ${rawOpen ? 'Hide' : 'Show'} technical details
              </button>
              ${rawOpen ? html`<pre className="mt-2 text-[10px] whitespace-pre-wrap break-all opacity-80">${rawMessage}</pre>` : null}
            </div>
          `
        : null}
    </div>
  `;
};

export default SearchErrorCallout;
