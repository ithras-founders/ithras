/**
 * Drag item types for CV template builder
 * Used to identify what type of element is being dragged
 */

export const DRAG_TYPES = {
  // Building blocks (from left panel)
  BUILDING_BLOCK_SECTION: 'building_block_section',
  BUILDING_BLOCK_ENTRY_SINGLE: 'building_block_entry_single',
  BUILDING_BLOCK_ENTRY_REPEATABLE: 'building_block_entry_repeatable',
  BUILDING_BLOCK_FIELD_TEXT: 'building_block_field_text',
  BUILDING_BLOCK_FIELD_MULTILINE: 'building_block_field_multiline',
  BUILDING_BLOCK_FIELD_BULLET_LIST: 'building_block_field_bullet_list',
  BUILDING_BLOCK_FIELD_NUMBER: 'building_block_field_number',
  BUILDING_BLOCK_FIELD_DATE: 'building_block_field_date',
  BUILDING_BLOCK_FIELD_YEAR: 'building_block_field_year',
  BUILDING_BLOCK_FIELD_DROPDOWN: 'building_block_field_dropdown',
  BUILDING_BLOCK_FIELD_TOGGLE: 'building_block_field_toggle',
  BUILDING_BLOCK_FIXED_TEXT: 'building_block_fixed_text',
  BUILDING_BLOCK_AUTO_VARIABLE: 'building_block_auto_variable',
  BUILDING_BLOCK_IMAGE: 'building_block_image',
  BUILDING_BLOCK_DIVIDER: 'building_block_divider',
  BUILDING_BLOCK_SPACER: 'building_block_spacer',
  BUILDING_BLOCK_TWO_COLUMN: 'building_block_two_column',
  BUILDING_BLOCK_FULL_WIDTH: 'building_block_full_width',
  BUILDING_BLOCK_TABLE: 'building_block_table',
  BUILDING_BLOCK_TABLE_ROW: 'building_block_table_row',
  
  // Canvas elements (already on canvas, being reordered)
  CANVAS_SECTION: 'canvas_section',
  CANVAS_ENTRY: 'canvas_entry',
  CANVAS_FIELD: 'canvas_field',
};

/**
 * Get field type from building block drag type
 */
export const getFieldTypeFromDragType = (dragType) => {
  const mapping = {
    [DRAG_TYPES.BUILDING_BLOCK_FIELD_TEXT]: 'text',
    [DRAG_TYPES.BUILDING_BLOCK_FIELD_MULTILINE]: 'multiline',
    [DRAG_TYPES.BUILDING_BLOCK_FIELD_BULLET_LIST]: 'bullet_list',
    [DRAG_TYPES.BUILDING_BLOCK_FIELD_NUMBER]: 'number',
    [DRAG_TYPES.BUILDING_BLOCK_FIELD_DATE]: 'date',
    [DRAG_TYPES.BUILDING_BLOCK_FIELD_YEAR]: 'year',
    [DRAG_TYPES.BUILDING_BLOCK_FIELD_DROPDOWN]: 'dropdown',
    [DRAG_TYPES.BUILDING_BLOCK_FIELD_TOGGLE]: 'toggle',
    [DRAG_TYPES.BUILDING_BLOCK_TABLE]: 'table',
    [DRAG_TYPES.BUILDING_BLOCK_FIELD_PROOF]: 'proof',
  };
  return mapping[dragType] || null;
};

/**
 * Check if drag type is a building block
 */
export const isBuildingBlock = (dragType) => {
  return dragType.startsWith('building_block_');
};

/**
 * Check if drag type is a canvas element
 */
export const isCanvasElement = (dragType) => {
  return dragType.startsWith('canvas_');
};
