/**
 * Reusable empty state component.
 * @param {{ icon: React.ReactNode, message: string, cta?: { label: string, onClick: () => void } }} props
 */
import React from 'react';
import htm from 'htm';
import { Inbox } from 'lucide-react';

const html = htm.bind(React.createElement);

const EmptyState = ({ icon, message, cta }) => {
  const Icon = icon ?? Inbox;
  return html`
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gray-100 text-gray-400 mb-4">
        <${Icon} className="w-6 h-6" />
      </div>
      <p className="text-sm text-gray-500 font-medium">${message}</p>
      ${cta ? html`
        <button
          onClick=${cta.onClick}
          className="mt-4 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          ${cta.label}
        </button>
      ` : null}
    </div>
  `;
};

export default EmptyState;
