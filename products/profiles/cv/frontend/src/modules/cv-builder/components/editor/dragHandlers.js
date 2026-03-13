import { DRAG_TYPES, isBuildingBlock, isCanvasElement, getFieldTypeFromDragType } from './dragTypes.js';
import * as mutations from './templateMutations.js';

/**
 * Validate if a drop is allowed
 */
export const validateDrop = (draggedItem, dropTarget) => {
  if (!draggedItem || !dropTarget) return false;

  const dragType = draggedItem.type;
  const targetType = dropTarget.type;
  const targetData = dropTarget.data || {};
  const draggedData = draggedItem.data || {};

  // Building blocks can be dropped on canvas or specific containers
  if (isBuildingBlock(dragType)) {
    // Sections can be dropped on canvas root, section drop zones, OR on another section (insert at that position)
    if (dragType === DRAG_TYPES.BUILDING_BLOCK_SECTION) {
      return targetType === 'canvas_root' || targetType === 'canvas_section_drop' || targetType === DRAG_TYPES.CANVAS_SECTION;
    }
    
    // Entries can be dropped on sections (via drop zone OR dropping on section/entry sortable)
    if (dragType === DRAG_TYPES.BUILDING_BLOCK_ENTRY_SINGLE || 
        dragType === DRAG_TYPES.BUILDING_BLOCK_ENTRY_REPEATABLE) {
      return targetType === 'section_entry_drop' || 
             (targetType === DRAG_TYPES.CANVAS_SECTION && targetData.sectionId) ||
             (targetType === DRAG_TYPES.CANVAS_ENTRY && targetData.sectionId);
    }
    
    // Fields can be dropped on entries (left bucket, right content, OR on entry sortable)
    // Table uses building_block_table (not building_block_field_*) but behaves like a field
    if (dragType.startsWith('building_block_field_') || dragType === DRAG_TYPES.BUILDING_BLOCK_TABLE) {
      return targetType === 'entry_left_bucket' || targetType === 'entry_right_content' ||
             (targetType === DRAG_TYPES.CANVAS_ENTRY && targetData.sectionId && targetData.entryId);
    }
    
    // Special blocks can be dropped in sections or entries
    if ([DRAG_TYPES.BUILDING_BLOCK_FIXED_TEXT, 
         DRAG_TYPES.BUILDING_BLOCK_AUTO_VARIABLE,
         DRAG_TYPES.BUILDING_BLOCK_IMAGE,
         DRAG_TYPES.BUILDING_BLOCK_DIVIDER,
         DRAG_TYPES.BUILDING_BLOCK_SPACER].includes(dragType)) {
      return targetType === 'section_entry_drop' || 
             targetType === 'entry_right_content' ||
             targetType === 'canvas_root';
    }
    
    // Layout blocks convert entries
    if (dragType === DRAG_TYPES.BUILDING_BLOCK_TWO_COLUMN ||
        dragType === DRAG_TYPES.BUILDING_BLOCK_FULL_WIDTH) {
      return targetType === 'entry_layout_change';
    }
  }

  // Canvas elements can be reordered within their containers
  if (isCanvasElement(dragType)) {
    // Sections can be reordered - check if dropping on another section or section drop zone
    if (dragType === DRAG_TYPES.CANVAS_SECTION) {
      // Allow dropping on another section (for reordering) or on section drop zone
      if (targetType === DRAG_TYPES.CANVAS_SECTION) {
        return true; // Reordering sections
      }
      return targetType === 'canvas_section_drop' || targetType === 'canvas_root';
    }
    
    // Entries can be reordered within section
    if (dragType === DRAG_TYPES.CANVAS_ENTRY) {
      // Allow dropping on another entry in the same section (for reordering) or on entry drop zone
      if (targetType === DRAG_TYPES.CANVAS_ENTRY) {
        return targetData.sectionId === draggedData.sectionId; // Same section
      }
      return targetType === 'section_entry_drop' && targetData.sectionId === draggedData.sectionId;
    }
    
    // Fields can be reordered or moved between areas
    if (dragType === DRAG_TYPES.CANVAS_FIELD) {
      // Allow dropping on another field (for reordering) or on drop zones
      if (targetType === DRAG_TYPES.CANVAS_FIELD) {
        // Check if same entry (for reordering) or different area (for moving)
        return targetData.entryId === draggedData.entryId;
      }
      return targetType === 'entry_left_bucket' || 
             targetType === 'entry_right_content' ||
             targetType === 'entry_field_reorder';
    }
  }

  return false;
};

/**
 * Process drag end event and update template config
 */
export const handleDragEnd = (event, config, setConfig) => {
  const { active, over } = event;
  
  if (!over) {
    return; // Dropped outside valid target
  }

  const draggedItem = {
    type: active.data.current?.type,
    data: active.data.current || {},
  };
  
  // Determine drop target type - could be a sortable item or a droppable zone
  let dropTargetType = 'unknown';
  const overData = over.data.current || {};
  
  // Check if it's a sortable item (has a type field matching our drag types)
  if (overData.type && (isCanvasElement(overData.type) || isBuildingBlock(overData.type))) {
    dropTargetType = overData.type;
  } else if (overData.type) {
    // It's a droppable zone with a type field
    dropTargetType = overData.type;
  } else {
    // Try to infer from ID pattern
    if (over.id.startsWith('section_') && over.id !== `section_${active.id.replace('section_', '')}`) {
      dropTargetType = DRAG_TYPES.CANVAS_SECTION;
    } else if (over.id.startsWith('entry_') && over.id !== `entry_${active.id.replace('entry_', '')}`) {
      dropTargetType = DRAG_TYPES.CANVAS_ENTRY;
    } else if (over.id.startsWith('field_') && over.id !== `field_${active.id.replace('field_', '')}`) {
      dropTargetType = DRAG_TYPES.CANVAS_FIELD;
    } else if (over.id === 'canvas_root' || over.id.includes('_drop')) {
      dropTargetType = over.id.includes('section') ? 'section_entry_drop' : 
                      over.id.includes('left_bucket') ? 'entry_left_bucket' :
                      over.id.includes('right_content') ? 'entry_right_content' :
                      'canvas_root';
    }
  }
  
  const dropTarget = {
    id: over.id,
    type: dropTargetType,
    data: overData,
  };

  // Validate drop
  if (!validateDrop(draggedItem, dropTarget)) {
    console.warn('Invalid drop target', { draggedItem, dropTarget });
    return;
  }

  const dragType = draggedItem.type;

  // Handle building block drops (adding new elements)
  if (isBuildingBlock(dragType)) {
    if (dragType === DRAG_TYPES.BUILDING_BLOCK_SECTION) {
      let insertIndex = config.sections.length;
      if (dropTarget.data.insertIndex !== undefined) {
        insertIndex = dropTarget.data.insertIndex;
      } else if (dropTarget.type === DRAG_TYPES.CANVAS_SECTION && dropTarget.data.index !== undefined) {
        // Dropping on a section: insert after it
        insertIndex = dropTarget.data.index + 1;
      } else if (dropTarget.type === DRAG_TYPES.CANVAS_SECTION && dropTarget.data.sectionId) {
        const idx = config.sections.findIndex(s => s.id === dropTarget.data.sectionId);
        insertIndex = idx >= 0 ? idx + 1 : config.sections.length;
      }
      const newConfig = mutations.addSection(config, {
        title: 'New Section',
        mandatory: false,
        lockOrder: true,
        candidateCanReorder: false,
        candidateCanEditTitle: false,
        visibilityRule: 'always',
        layoutStyle: 'two_column',
      }, insertIndex);
      setConfig(newConfig);
      return;
    }

    if (dragType === DRAG_TYPES.BUILDING_BLOCK_ENTRY_SINGLE || 
        dragType === DRAG_TYPES.BUILDING_BLOCK_ENTRY_REPEATABLE) {
      let sectionId = dropTarget.data.sectionId;
      let insertIndex = dropTarget.data.insertIndex;
      if (!sectionId && dropTarget.type === DRAG_TYPES.CANVAS_SECTION) {
        sectionId = dropTarget.data.sectionId || (over.id && over.id.startsWith('section_') ? over.id.replace('section_', '') : null);
      }
      if (!sectionId && dropTarget.type === DRAG_TYPES.CANVAS_ENTRY) {
        sectionId = dropTarget.data.sectionId;
        if (insertIndex === undefined && dropTarget.data.index !== undefined) insertIndex = dropTarget.data.index + 1;
      }
      if (!sectionId) return;
      const newConfig = mutations.addEntry(config, sectionId, {
        name: 'New Entry',
        repeatable: dragType === DRAG_TYPES.BUILDING_BLOCK_ENTRY_REPEATABLE,
        layout: 'two_column',
        leftBucketWidth: '1.2in',
        leftBucketContentSource: 'fixed',
      }, insertIndex);
      setConfig(newConfig);
      return;
    }

    if (dragType.startsWith('building_block_field_') || dragType === DRAG_TYPES.BUILDING_BLOCK_TABLE) {
      const sectionId = dropTarget.data.sectionId;
      const entryId = dropTarget.data.entryId;
      // When dropping on entry sortable (CANVAS_ENTRY), default to right_content
      const targetArea = dropTarget.type === 'entry_left_bucket' ? 'left_bucket' : 'right_content';
      const insertIndex = dropTarget.data.insertIndex !== undefined 
        ? dropTarget.data.insertIndex 
        : null;
      
      if (!sectionId || !entryId) return;
      
      const fieldType = getFieldTypeFromDragType(dragType);
      const newConfig = mutations.addField(config, sectionId, entryId, {
        label: 'New Field',
        type: fieldType,
        required: false,
      }, targetArea, insertIndex);
      setConfig(newConfig);
      return;
    }

    // Handle special blocks
    if (dragType === DRAG_TYPES.BUILDING_BLOCK_FIXED_TEXT) {
      // Add as a special element in section or entry
      // Implementation depends on how special blocks are stored
      console.log('Fixed text block drop', dropTarget);
    }
    
    if (dragType === DRAG_TYPES.BUILDING_BLOCK_AUTO_VARIABLE) {
      // Add auto-variable block
      console.log('Auto variable block drop', dropTarget);
    }
  }

  // Handle canvas element reordering
  if (isCanvasElement(dragType)) {
    if (dragType === DRAG_TYPES.CANVAS_SECTION) {
      const fromIndex = draggedItem.data.index;
      
      // If dropping on another section, calculate the target index
      let toIndex = fromIndex;
      if (dropTarget.type === DRAG_TYPES.CANVAS_SECTION) {
        // Dropping on another section - find its index
        const targetSectionId = dropTarget.data.sectionId || dropTarget.id.replace('section_', '');
        toIndex = config.sections.findIndex(s => s.id === targetSectionId);
        if (toIndex === -1) toIndex = fromIndex;
        // If dragging down, adjust index
        if (toIndex > fromIndex) {
          toIndex = toIndex + 1;
        }
      } else if (dropTarget.data.insertIndex !== undefined) {
        toIndex = dropTarget.data.insertIndex;
      } else {
        // Default to end
        toIndex = config.sections.length;
      }
      
      if (toIndex !== fromIndex && toIndex >= 0 && toIndex <= config.sections.length) {
        const newConfig = mutations.reorderSections(config, fromIndex, toIndex);
        setConfig(newConfig);
      }
      return;
    }

    if (dragType === DRAG_TYPES.CANVAS_ENTRY) {
      const sectionId = draggedItem.data.sectionId;
      const fromIndex = draggedItem.data.index;
      
      // If dropping on another entry, calculate the target index
      let toIndex = fromIndex;
      if (dropTarget.type === DRAG_TYPES.CANVAS_ENTRY && dropTarget.data.sectionId === sectionId) {
        // Dropping on another entry in the same section
        const targetEntryId = dropTarget.data.entryId || dropTarget.id.replace('entry_', '');
        const section = config.sections.find(s => s.id === sectionId);
        if (section) {
          toIndex = (section.entryTypes || []).findIndex(e => e.id === targetEntryId);
          if (toIndex === -1) toIndex = fromIndex;
          // If dragging down, adjust index
          if (toIndex > fromIndex) {
            toIndex = toIndex + 1;
          }
        }
      } else if (dropTarget.data.insertIndex !== undefined) {
        toIndex = dropTarget.data.insertIndex;
      }
      
      if (toIndex !== null && toIndex !== fromIndex && toIndex >= 0) {
        const section = config.sections.find(s => s.id === sectionId);
        if (section && toIndex <= (section.entryTypes || []).length) {
          const newConfig = mutations.reorderEntries(config, sectionId, fromIndex, toIndex);
          setConfig(newConfig);
        }
      }
      return;
    }

    if (dragType === DRAG_TYPES.CANVAS_FIELD) {
      const sectionId = draggedItem.data.sectionId;
      const entryId = draggedItem.data.entryId;
      const fieldId = draggedItem.data.fieldId;
      const fromArea = draggedItem.data.currentArea;
      
      // Check if dropping on another field (reordering) or on a drop zone (moving)
      if (dropTarget.type === DRAG_TYPES.CANVAS_FIELD && dropTarget.data.entryId === entryId) {
        // Reordering within same entry
        const targetFieldId = dropTarget.data.fieldId || dropTarget.id.replace('field_', '');
        const section = config.sections.find(s => s.id === sectionId);
        const entry = section?.entryTypes?.find(e => e.id === entryId);
        if (entry) {
          const fromIndex = (entry.fields || []).findIndex(f => f.id === fieldId);
          let toIndex = (entry.fields || []).findIndex(f => f.id === targetFieldId);
          if (toIndex === -1) toIndex = fromIndex;
          // If dragging down, adjust index
          if (toIndex > fromIndex) {
            toIndex = toIndex + 1;
          }
          if (fromIndex !== toIndex && toIndex >= 0) {
            const newConfig = mutations.reorderFields(config, sectionId, entryId, fromIndex, toIndex);
            setConfig(newConfig);
          }
        }
      } else if (dropTarget.type === 'entry_left_bucket' || dropTarget.type === 'entry_right_content') {
        // Moving between areas
        const toArea = dropTarget.type === 'entry_left_bucket' ? 'left_bucket' : 'right_content';
        if (fromArea !== toArea && dropTarget.data.entryId === entryId) {
          const newConfig = mutations.moveField(config, sectionId, entryId, fieldId, fromArea, toArea);
          setConfig(newConfig);
        }
      } else if (dropTarget.type === 'entry_field_reorder') {
        const toIndex = dropTarget.data.insertIndex;
        const section = config.sections.find(s => s.id === sectionId);
        const entry = section?.entryTypes?.find(e => e.id === entryId);
        if (entry) {
          const fromIndex = (entry.fields || []).findIndex(f => f.id === fieldId);
          if (fromIndex !== toIndex && toIndex >= 0) {
            const newConfig = mutations.reorderFields(config, sectionId, entryId, fromIndex, toIndex);
            setConfig(newConfig);
          }
        }
      }
      return;
    }
  }
};

/**
 * Handle drag over to show drop indicators
 */
export const handleDragOver = (event, setDropIndicator) => {
  const { over } = event;
  
  if (!over) {
    setDropIndicator(null);
    return;
  }

  const dropTarget = {
    id: over.id,
    type: over.data.current?.type || 'unknown',
    data: over.data.current || {},
  };

  // Set drop indicator position
  setDropIndicator({
    targetId: over.id,
    insertIndex: over.data.current?.insertIndex,
    type: dropTarget.type,
  });
};
