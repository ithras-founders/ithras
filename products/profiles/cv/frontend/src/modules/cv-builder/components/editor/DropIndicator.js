import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

/**
 * Visual indicator showing where an item will be dropped
 */
const DropIndicator = ({ position, isVisible = false }) => {
  if (!isVisible || !position) {
    return null;
  }

  const style = {
    position: 'absolute',
    left: 0,
    right: 0,
    top: position === 'top' ? '-2px' : 'auto',
    bottom: position === 'bottom' ? '-2px' : 'auto',
    height: '2px',
    backgroundColor: '#3b82f6',
    zIndex: 1000,
    pointerEvents: 'none',
  };

  return html`
    <div style=${style} className="drop-indicator">
      <div style=${{ 
        position: 'absolute', 
        left: '50%', 
        top: '-4px', 
        transform: 'translateX(-50%)',
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: '#3b82f6',
      }} />
    </div>
  `;
};

export default DropIndicator;
