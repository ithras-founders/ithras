import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

/**
 * Building block for fixed text
 */
const FixedTextBlock = ({ onAdd }) => {
  return html`
    <div className="p-2 border rounded hover:bg-gray-50 cursor-pointer">
      <div className="flex items-center gap-2">
        <span className="text-lg">📄</span>
        <span className="text-sm font-medium">Fixed Text</span>
      </div>
      <p className="text-xs text-gray-500 mt-1">Static text that appears on all CVs</p>
    </div>
  `;
};

export default FixedTextBlock;
