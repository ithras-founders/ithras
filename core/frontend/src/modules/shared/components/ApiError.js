/**
 * Shared API error display - surfaces failed API call messages inline.
 * Use when you need to show errors in-context rather than only via toast.
 */
import React from 'react';
import htm from 'htm';
const html = htm.bind(React.createElement);

const ApiError = ({ message, onRetry, ...props }) => html`
  <div
    role="alert"
    aria-live="polite"
    className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300"
    ...${props}
  >
    <p className="text-sm font-medium">${message || 'Something went wrong. Please try again.'}</p>
    ${onRetry ? html`
      <button
        onClick=${onRetry}
        className="mt-2 text-xs font-semibold uppercase tracking-wider text-red-600 dark:text-red-400 hover:underline"
      >
        Retry
      </button>
    ` : null}
  </div>
`;

export default ApiError;
