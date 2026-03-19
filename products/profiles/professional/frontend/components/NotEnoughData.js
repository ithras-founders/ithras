/**
 * Shown when there isn't enough data for charts or insights.
 */
import React from 'react';
import htm from 'htm';
import { BarChart3 } from 'lucide-react';

const html = htm.bind(React.createElement);

const NotEnoughData = ({ message = 'Not enough data available to display this section.' }) => html`
  <div className="rounded-xl border border-gray-200 bg-white p-8 flex flex-col items-center justify-center text-center">
    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gray-100 text-gray-400 mb-4">
      <${BarChart3} className="w-6 h-6" />
    </div>
    <p className="text-sm text-gray-500 font-medium">${message}</p>
  </div>
`;

export default NotEnoughData;
