import React, { useState } from 'react';
import htm from 'htm';
import { DndContext, PointerSensor, KeyboardSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';

const html = htm.bind(React.createElement);

/**
 * Shared Drag Context Provider
 * Wraps @dnd-kit/core's DndContext with sensible defaults
 */
const DragContextProvider = ({ children, onDragEnd, onDragStart, onDragOver, collisionDetection = closestCenter }) => {
  const [activeId, setActiveId] = useState(null);
  const [draggedItem, setDraggedItem] = useState(null);

  // Configure sensors for pointer (mouse/touch) and keyboard
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
    setDraggedItem(event.active.data.current);
    if (onDragStart) {
      onDragStart(event);
    }
  };

  const handleDragOver = (event) => {
    if (onDragOver) {
      onDragOver(event);
    }
  };

  const handleDragEnd = (event) => {
    setActiveId(null);
    setDraggedItem(null);
    if (onDragEnd) {
      onDragEnd(event);
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
    setDraggedItem(null);
  };

  return html`
    <${DndContext}
      sensors=${sensors}
      collisionDetection=${collisionDetection}
      onDragStart=${handleDragStart}
      onDragOver=${handleDragOver}
      onDragEnd=${handleDragEnd}
      onDragCancel=${handleDragCancel}
    >
      ${children}
    <//>
  `;
};

export default DragContextProvider;
