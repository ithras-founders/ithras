import React from 'react';
import htm from 'htm';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Droppable from '/core/frontend/src/modules/shared/dnd/Droppable.js';
import FloatingSectionToolbar from './FloatingSectionToolbar.js';
import { DRAG_TYPES } from './dragTypes.js';

const html = htm.bind(React.createElement);

/**
 * Canvas Section Component - Renderable section on the canvas
 */
const CanvasSection = ({ 
  section, 
  index, 
  isSelected, 
  onSelect,
  onDelete,
  onUpdate,
  children 
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `section_${section.id}`,
    data: {
      type: DRAG_TYPES.CANVAS_SECTION,
      sectionId: section.id,
      index,
    },
    disabled: section.lockOrder,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return html`
    <div
      ref=${setNodeRef}
      style=${style}
      className=${`mb-4 border-2 rounded-lg ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'} ${isDragging ? 'opacity-50' : ''}`}
    >
      <div
        className="flex items-center justify-between p-3 bg-gray-100 border-b border-gray-200 cursor-pointer"
        onClick=${() => onSelect && onSelect({ type: 'section', id: section.id, section })}
      >
        <div className="flex items-center gap-2 flex-1">
          ${!section.lockOrder ? html`
            <div
              className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
              ...${attributes}
              ...${listeners}
            >
              ⋮⋮
            </div>
          ` : html`
            <div className="text-gray-400 text-xs">🔒</div>
          `}
          <div className="flex-1">
            <div className="font-bold text-gray-800">
              ${section.title}
              ${section.mandatory ? html`<span className="text-red-500 ml-1">*</span>` : ''}
            </div>
            <div className="text-xs text-gray-500">
              ${section.entryTypes?.length || 0} entries
            </div>
          </div>
        </div>
        ${isSelected ? html`
          <button
            onClick=${(e) => { e.stopPropagation(); onDelete && onDelete(section.id); }}
            className="px-2 py-1 text-red-500 hover:bg-red-50 rounded text-sm"
          >
            Delete
          </button>
        ` : ''}
      </div>
      ${isSelected && onUpdate ? html`
        <${FloatingSectionToolbar} section=${section} onUpdate=${onUpdate} />
      ` : ''}
      <${Droppable}
        id=${`section_${section.id}_entry_drop`}
        accepts=${[DRAG_TYPES.BUILDING_BLOCK_ENTRY_SINGLE, DRAG_TYPES.BUILDING_BLOCK_ENTRY_REPEATABLE, DRAG_TYPES.CANVAS_ENTRY]}
        className="min-h-[100px] p-2"
        data=${{ type: 'section_entry_drop', sectionId: section.id, insertIndex: null }}
      >
        ${children || html`
          <div className="text-center text-gray-400 text-sm py-8">
            Drop entries here or click "Add Entry" button
          </div>
        `}
      <//>
    </div>
  `;
};

export default CanvasSection;
