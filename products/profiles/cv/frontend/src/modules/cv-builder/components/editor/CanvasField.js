import React from 'react';
import htm from 'htm';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DRAG_TYPES } from './dragTypes.js';

const html = htm.bind(React.createElement);

/**
 * Canvas Field Component - Renderable field on the canvas
 */
const CanvasField = ({
  field,
  sectionId,
  entryId,
  index,
  currentArea,
  isSelected,
  onSelect,
  onDelete,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `field_${field.id}`,
    data: {
      type: DRAG_TYPES.CANVAS_FIELD,
      fieldId: field.id,
      sectionId,
      entryId,
      index,
      currentArea,
    },
  });

  const bg = field.pdfMapping?.backgroundColor || field.backgroundColor;
  const hasFieldBg = bg && (typeof bg !== 'string' || bg.toLowerCase() !== 'transparent');

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    ...(hasFieldBg && !isSelected ? { backgroundColor: bg } : {}),
  };

  const fieldIcons = {
    text: '📄',
    multiline: '📝',
    bullet_list: '•',
    number: '🔢',
    date: '📅',
    year: '📆',
    dropdown: '▼',
    toggle: '☑️',
  };

  return html`
    <div
      ref=${setNodeRef}
      style=${style}
      className=${`p-2 mb-1 border rounded ${isSelected ? 'border-blue-500 bg-blue-50' : hasFieldBg ? 'border-gray-200' : 'border-gray-200 bg-white'} ${isDragging ? 'opacity-50' : ''} cursor-pointer`}
      onClick=${() => onSelect && onSelect({ type: 'field', id: field.id, sectionId, entryId, field })}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1">
          <div
            className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
            ...${attributes}
            ...${listeners}
          >
            ⋮⋮
          </div>
          <span className="text-sm">${fieldIcons[field.type] || '📋'}</span>
          <div className="flex-1">
            <div className="text-sm font-medium text-gray-700">
              ${field.label}
              ${field.required ? html`<span className="text-red-500 ml-1">*</span>` : ''}
            </div>
            <div className="text-xs text-gray-500">
              ${field.type}
              ${field.pdfMapping?.location === 'left_bucket' ? ' (Left)' : ' (Right)'}
            </div>
          </div>
        </div>
        ${isSelected ? html`
          <button
            onClick=${(e) => { e.stopPropagation(); onDelete && onDelete(field.id); }}
            className="px-2 py-1 text-red-500 hover:bg-red-50 rounded text-xs"
          >
            ×
          </button>
        ` : ''}
      </div>
      ${field.validation?.maxChars ? html`
        <div className="text-xs text-gray-400 mt-1">
          Max ${field.validation.maxChars} chars
        </div>
      ` : ''}
    </div>
  `;
};

export default CanvasField;
