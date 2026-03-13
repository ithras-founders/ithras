import React from 'react';
import htm from 'htm';
import { useDraggable } from '@dnd-kit/core';

const html = htm.bind(React.createElement);

/**
 * Draggable wrapper component
 * Makes any child element draggable
 */
const Draggable = ({ id, data, disabled = false, children, className = '', style = {} }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
    data,
    disabled,
  });

  const dragStyle = {
    ...style,
    opacity: isDragging ? 0.5 : 1,
    cursor: disabled ? 'not-allowed' : isDragging ? 'grabbing' : 'grab',
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
  };

  return html`
    <div
      ref=${setNodeRef}
      style=${dragStyle}
      className=${`${className} ${isDragging ? 'dragging' : ''}`}
      ...${attributes}
      ...${listeners}
    >
      ${children}
    </div>
  `;
};

/**
 * Drag Handle component
 * Use this to make only a specific part of the draggable element the handle
 */
export const DragHandle = ({ children, className = '' }) => {
  return html`
    <div className=${`drag-handle ${className}`} style=${{ cursor: 'grab' }}>
      ${children || html`<span>⋮⋮</span>`}
    </div>
  `;
};

export default Draggable;
