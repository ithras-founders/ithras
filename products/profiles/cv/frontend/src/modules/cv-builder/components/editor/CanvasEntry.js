import React from 'react';
import htm from 'htm';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Droppable from '/core/frontend/src/modules/shared/dnd/Droppable.js';
import { DRAG_TYPES } from './dragTypes.js';

const html = htm.bind(React.createElement);

/**
 * Canvas Entry Component - Renderable entry/row on the canvas
 */
const CanvasEntry = ({
  entry,
  sectionId,
  index,
  isSelected,
  onSelect,
  onDelete,
  children,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `entry_${entry.id}`,
    data: {
      type: DRAG_TYPES.CANVAS_ENTRY,
      entryId: entry.id,
      sectionId,
      index,
    },
    disabled: false, // Entries can always be reordered unless section lockOrder is true
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const leftBucketStyle = {
    width: entry.leftBucketWidth || '1.2in',
    minWidth: entry.leftBucketWidth || '1.2in',
  };

  const entryStyle = { ...style };
  if (!isSelected && entry.backgroundColor) {
    entryStyle.backgroundColor = entry.backgroundColor;
  }

  return html`
    <div
      ref=${setNodeRef}
      style=${entryStyle}
      className=${`mb-2 border rounded p-3 ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'} ${!isSelected && !entry.backgroundColor ? 'bg-gray-50' : ''} ${isDragging ? 'opacity-50' : ''}`}
    >
      <div
        className="flex items-center justify-between mb-2 cursor-pointer"
        onClick=${() => onSelect && onSelect({ type: 'entry', id: entry.id, sectionId, entry })}
      >
        <div className="flex items-center gap-2 flex-1">
          <div
            className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
            ...${attributes}
            ...${listeners}
          >
            ⋮⋮
          </div>
          <div className="flex-1">
            <div className="font-semibold text-sm text-gray-700">
              ${entry.name}
              ${entry.repeatable ? html`<span className="text-xs text-gray-500 ml-2">(Repeatable)</span>` : ''}
            </div>
          </div>
        </div>
        ${isSelected ? html`
          <button
            onClick=${(e) => { e.stopPropagation(); onDelete && onDelete(entry.id); }}
            className="px-2 py-1 text-red-500 hover:bg-red-50 rounded text-xs"
          >
            Delete
          </button>
        ` : ''}
      </div>

      ${entry.layout === 'two_column' ? html`
        <div className="flex gap-2" style=${{ alignItems: entry.alignment === 'center' ? 'center' : 'flex-start' }}>
          <${Droppable}
            id=${`entry_${entry.id}_left_bucket`}
            accepts=${[DRAG_TYPES.BUILDING_BLOCK_FIELD_TEXT, DRAG_TYPES.BUILDING_BLOCK_FIELD_NUMBER, DRAG_TYPES.BUILDING_BLOCK_FIELD_YEAR, DRAG_TYPES.BUILDING_BLOCK_FIELD_DATE, DRAG_TYPES.CANVAS_FIELD]}
            className="border-2 border-dashed border-gray-300 rounded p-2 min-h-[40px]"
            style=${leftBucketStyle}
            data=${{ type: 'entry_left_bucket', sectionId, entryId: entry.id, insertIndex: null }}
          >
            <div className="text-xs text-gray-400 mb-1">Left Bucket</div>
            ${children?.leftBucket || html`
              <div className="text-xs text-gray-300">Drop fields here</div>
            `}
          <//>
          
          <${Droppable}
            id=${`entry_${entry.id}_right_content`}
            accepts=${Object.values(DRAG_TYPES).filter(t => t.startsWith('building_block_field_') || t === DRAG_TYPES.CANVAS_FIELD)}
            className="flex-1 border-2 border-dashed border-gray-300 rounded p-2 min-h-[40px]"
            data=${{ type: 'entry_right_content', sectionId, entryId: entry.id, insertIndex: null }}
          >
            <div className="text-xs text-gray-400 mb-1">Right Content</div>
            ${children?.rightContent || html`
              <div className="text-xs text-gray-300">Drop fields here</div>
            `}
          <//>
        </div>
      ` : html`
        <${Droppable}
          id=${`entry_${entry.id}_full_width`}
          accepts=${Object.values(DRAG_TYPES).filter(t => t.startsWith('building_block_field_') || t === DRAG_TYPES.CANVAS_FIELD)}
          className="border-2 border-dashed border-gray-300 rounded p-2 min-h-[40px]"
          data=${{ type: 'entry_right_content', sectionId, entryId: entry.id, insertIndex: null }}
        >
          <div className="text-xs text-gray-400 mb-1">Content</div>
          ${children?.fullWidth || html`
            <div className="text-xs text-gray-300">Drop fields here</div>
          `}
        <//>
      `}
    </div>
  `;
};

export default CanvasEntry;
