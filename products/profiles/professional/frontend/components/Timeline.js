/**
 * Vertical timeline for company milestones.
 */
import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

/**
 * @param {{ events: Array<{ date: string, label: string, description: string }> }} props
 */
const Timeline = ({ events = [] }) => {
  if (events.length === 0) return null;

  return html`
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-gray-900 mb-6">Company timeline</h2>
      <div className="relative">
        <div className="absolute left-4 top-2 bottom-2 w-px bg-gray-200" />
        <div className="space-y-6">
          ${events.map((e, i) =>
            html`
              <div key=${i} className="relative flex gap-4 pl-10">
                <div className="absolute left-2 top-1.5 w-4 h-4 rounded-full bg-gray-300 border-2 border-white shadow-sm" />
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">${e.date}</p>
                  <p className="font-semibold text-gray-900 mt-0.5">${e.label}</p>
                  <p className="text-sm text-gray-600 mt-1">${e.description}</p>
                </div>
              </div>
            `
          )}
        </div>
      </div>
    </div>
  `;
};

export default Timeline;
