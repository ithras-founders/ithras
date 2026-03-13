import React from 'react';
import htm from 'htm';
import Draggable from '/core/frontend/src/modules/shared/dnd/Draggable.js';
import { DRAG_TYPES } from './dragTypes.js';

const html = htm.bind(React.createElement);

/**
 * Building Blocks Panel - Left sidebar with draggable template blocks.
 * Drill-down: only show relevant blocks based on selection.
 * - Template selected: add Section only
 * - Section selected: add Entry only
 * - Entry selected: add Fields, Special, Layout
 * - Field selected: no add blocks
 */
const BuildingBlocksPanel = ({ selectedElement }) => {
  const selType = selectedElement?.type || 'template';

  const allCategories = [
    {
      name: 'Sections',
      blocks: [
        { type: DRAG_TYPES.BUILDING_BLOCK_SECTION, label: 'Section', icon: '📑', description: 'Container for entries and fields' },
      ],
    },
    {
      name: 'Entries',
      blocks: [
        { type: DRAG_TYPES.BUILDING_BLOCK_ENTRY_SINGLE, label: 'Single Entry', icon: '📝', description: 'One-time entry (e.g., Personal Info)' },
        { type: DRAG_TYPES.BUILDING_BLOCK_ENTRY_REPEATABLE, label: 'Repeatable Entry', icon: '📋', description: 'Multiple entries (e.g., Education, Experience)' },
      ],
    },
    {
      name: 'Fields',
      blocks: [
        { type: DRAG_TYPES.BUILDING_BLOCK_FIELD_TEXT, label: 'Text', icon: '📄', description: 'Single-line text input' },
        { type: DRAG_TYPES.BUILDING_BLOCK_FIELD_MULTILINE, label: 'Multiline', icon: '📝', description: 'Multi-line text area' },
        { type: DRAG_TYPES.BUILDING_BLOCK_FIELD_BULLET_LIST, label: 'Bullet List', icon: '•', description: 'List of bullet points' },
        { type: DRAG_TYPES.BUILDING_BLOCK_FIELD_NUMBER, label: 'Number', icon: '🔢', description: 'Numeric input' },
        { type: DRAG_TYPES.BUILDING_BLOCK_FIELD_DATE, label: 'Date', icon: '📅', description: 'Date picker' },
        { type: DRAG_TYPES.BUILDING_BLOCK_FIELD_YEAR, label: 'Year', icon: '📆', description: 'Year input' },
        { type: DRAG_TYPES.BUILDING_BLOCK_FIELD_DROPDOWN, label: 'Dropdown', icon: '▼', description: 'Select from options' },
        { type: DRAG_TYPES.BUILDING_BLOCK_FIELD_TOGGLE, label: 'Toggle', icon: '☑️', description: 'Yes/No checkbox' },
        { type: DRAG_TYPES.BUILDING_BLOCK_TABLE, label: 'Table', icon: '📊', description: 'Tabular data with columns' },
        { type: DRAG_TYPES.BUILDING_BLOCK_FIELD_PROOF, label: 'Proof/File', icon: '📎', description: 'Upload image or PDF proof' },
      ],
    },
    {
      name: 'Special',
      blocks: [
        { type: DRAG_TYPES.BUILDING_BLOCK_FIXED_TEXT, label: 'Fixed Text', icon: '📌', description: 'Static text (e.g., college name)' },
        { type: DRAG_TYPES.BUILDING_BLOCK_AUTO_VARIABLE, label: 'Auto Variable', icon: '🔗', description: 'Auto-filled from profile (name, email, etc.)' },
        { type: DRAG_TYPES.BUILDING_BLOCK_IMAGE, label: 'Image', icon: '🖼️', description: 'Profile photo or logo' },
        { type: DRAG_TYPES.BUILDING_BLOCK_DIVIDER, label: 'Divider', icon: '─', description: 'Horizontal divider line' },
        { type: DRAG_TYPES.BUILDING_BLOCK_SPACER, label: 'Spacer', icon: '↕️', description: 'Vertical spacing block' },
      ],
    },
    {
      name: 'Layout',
      blocks: [
        { type: DRAG_TYPES.BUILDING_BLOCK_TWO_COLUMN, label: 'Two Column', icon: '⬌', description: 'Left bucket + right content layout' },
        { type: DRAG_TYPES.BUILDING_BLOCK_FULL_WIDTH, label: 'Full Width', icon: '⬛', description: 'Full-width block layout' },
      ],
    },
  ];

  // Drill-down: filter categories by selection
  const blockCategories = (() => {
    if (selType === 'template') {
      return allCategories.filter(c => c.name === 'Sections');
    }
    if (selType === 'section') {
      return allCategories.filter(c => c.name === 'Entries');
    }
    if (selType === 'entry') {
      return allCategories.filter(c =>
        ['Fields', 'Special', 'Layout'].includes(c.name)
      );
    }
    // Field selected: show nothing (or could show contextual options)
    return [];
  })();

  const hintText = selType === 'template'
    ? 'Select nothing to add sections. Click a section to add entries.'
    : selType === 'section'
      ? 'Add entries to this section.'
      : selType === 'entry'
        ? 'Add fields, special blocks, or change layout.'
        : 'Select a section or entry to add blocks.';

  return html`
    <div className="w-64 bg-white border-r border-gray-200 h-full overflow-y-auto">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Building Blocks</h3>
        <p className="text-xs text-gray-500 mt-1">${hintText}</p>
      </div>
      
      <div className="p-2">
        ${blockCategories.length === 0 ? html`
          <div className="p-4 text-sm text-gray-500 text-center">
            Select a section or entry above to add blocks.
          </div>
        ` : blockCategories.map(category => html`
          <div key=${category.name} className="mb-6">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">
              ${category.name}
            </h4>
            <div className="space-y-1">
              ${category.blocks.map(block => html`
                <${Draggable}
                  key=${block.type}
                  id=${`building_block_${block.type}`}
                  data=${{ type: block.type, blockData: block }}
                  className="p-3 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-lg cursor-grab active:cursor-grabbing transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">${block.icon}</span>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-700">${block.label}</div>
                      <div className="text-xs text-gray-500">${block.description}</div>
                    </div>
                  </div>
                <//>
              `)}
            </div>
          </div>
        `)}
      </div>
    </div>
  `;
};

export default BuildingBlocksPanel;
