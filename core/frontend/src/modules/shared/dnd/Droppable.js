import React from 'react';
import htm from 'htm';
import { useDroppable } from '@dnd-kit/core';

const html = htm.bind(React.createElement);

/**
 * Droppable wrapper component
 * Creates a drop zone that accepts specific draggable types
 */
const Droppable = ({ 
  id, 
  accepts = [], // Array of draggable type strings
  children, 
  className = '', 
  style = {},
  isOver = false,
  isActive = false,
  data = {} // Additional data to pass to drop handler
}) => {
  const { setNodeRef, isOver: isOverFromHook } = useDroppable({
    id,
    data: {
      accepts,
      type: id.includes('_drop') || id === 'canvas_root' ? id.replace(/_drop$/, '').replace('canvas_root', 'canvas_root') : undefined,
      ...data, // Merge additional data
    },
  });

  const isOverDropZone = isOver || isOverFromHook;
  
  const dropStyle = {
    ...style,
    backgroundColor: isOverDropZone ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
    border: isOverDropZone ? '2px dashed rgba(59, 130, 246, 0.5)' : '2px dashed transparent',
    borderRadius: isOverDropZone ? '4px' : '0',
    transition: 'all 0.2s ease',
  };

  return html`
    <div
      ref=${setNodeRef}
      style=${dropStyle}
      className=${`droppable ${isOverDropZone ? 'drop-over' : ''} ${isActive ? 'drop-active' : ''} ${className}`}
    >
      ${children}
    </div>
  `;
};

export default Droppable;
