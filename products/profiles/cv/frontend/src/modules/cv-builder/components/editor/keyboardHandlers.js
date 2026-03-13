/**
 * Keyboard handlers for template editor
 * Provides keyboard shortcuts for navigation, editing, and deletion
 */

/**
 * Handle keyboard events in the editor
 */
export const handleKeyboard = (event, selectedElement, config, handlers) => {
  const { onDelete, onNavigate, onUndo, onRedo } = handlers;

  // Ctrl+Z / Cmd+Z: Undo
  if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
    event.preventDefault();
    if (onUndo) onUndo();
    return;
  }

  // Ctrl+Shift+Z / Cmd+Shift+Z: Redo
  if ((event.ctrlKey || event.metaKey) && event.key === 'z' && event.shiftKey) {
    event.preventDefault();
    if (onRedo) onRedo();
    return;
  }

  // Ctrl+Y: Redo (alternative)
  if ((event.ctrlKey || event.metaKey) && event.key === 'y') {
    event.preventDefault();
    if (onRedo) onRedo();
    return;
  }

  // Delete / Backspace: Delete selected element
  if ((event.key === 'Delete' || event.key === 'Backspace') && selectedElement) {
    event.preventDefault();
    if (onDelete) {
      const { type, id, section, entry } = selectedElement;
      if (type === 'field') {
        onDelete('field', { sectionId: section?.id, entryId: entry?.id, fieldId: id });
      } else if (type === 'entry') {
        onDelete('entry', { sectionId: section?.id, entryId: id });
      } else if (type === 'section') {
        onDelete('section', { sectionId: id });
      }
    }
    return;
  }

  // Arrow Up: Navigate to previous element
  if (event.key === 'ArrowUp' && !event.shiftKey && !event.ctrlKey && !event.metaKey) {
    event.preventDefault();
    if (onNavigate) {
      onNavigate('up', selectedElement, config);
    }
    return;
  }

  // Arrow Down: Navigate to next element
  if (event.key === 'ArrowDown' && !event.shiftKey && !event.ctrlKey && !event.metaKey) {
    event.preventDefault();
    if (onNavigate) {
      onNavigate('down', selectedElement, config);
    }
    return;
  }

  // Escape: Deselect
  if (event.key === 'Escape') {
    event.preventDefault();
    if (onNavigate) {
      onNavigate('deselect', null, config);
    }
    return;
  }
};

/**
 * Navigate selection in template structure
 */
export const navigateSelection = (direction, currentSelection, config) => {
  if (!currentSelection) {
    // If nothing selected, select first section or first element
    const sections = config.sections || [];
    if (sections.length > 0) {
      return { type: 'section', id: sections[0].id, section: sections[0] };
    }
    return null;
  }

  const { type, id, section, entry } = currentSelection;
  const sections = config.sections || [];

  if (direction === 'deselect') {
    return null;
  }

  if (type === 'template') {
    if (sections.length > 0) {
      return { type: 'section', id: sections[0].id, section: sections[0] };
    }
    return currentSelection;
  }

  if (type === 'section') {
    const sectionIndex = sections.findIndex(s => s.id === id);
    if (direction === 'up') {
      if (sectionIndex > 0) {
        const prevSection = sections[sectionIndex - 1];
        return { type: 'section', id: prevSection.id, section: prevSection };
      }
      return { type: 'template' };
    } else if (direction === 'down') {
      const currentSection = sections[sectionIndex];
      const entries = currentSection.entryTypes || [];
      if (entries.length > 0) {
        return { type: 'entry', id: entries[0].id, section: currentSection, entry: entries[0] };
      }
      if (sectionIndex < sections.length - 1) {
        const nextSection = sections[sectionIndex + 1];
        return { type: 'section', id: nextSection.id, section: nextSection };
      }
    }
    return currentSelection;
  }

  if (type === 'entry') {
    const sectionIndex = sections.findIndex(s => s.id === section.id);
    const currentSection = sections[sectionIndex];
    const entries = currentSection.entryTypes || [];
    const entryIndex = entries.findIndex(e => e.id === id);

    if (direction === 'up') {
      if (entryIndex > 0) {
        const prevEntry = entries[entryIndex - 1];
        return { type: 'entry', id: prevEntry.id, section: currentSection, entry: prevEntry };
      }
      return { type: 'section', id: section.id, section: currentSection };
    } else if (direction === 'down') {
      const currentEntry = entries[entryIndex];
      const fields = currentEntry.fields || [];
      if (fields.length > 0) {
        return { type: 'field', id: fields[0].id, section: currentSection, entry: currentEntry, field: fields[0] };
      }
      if (entryIndex < entries.length - 1) {
        const nextEntry = entries[entryIndex + 1];
        return { type: 'entry', id: nextEntry.id, section: currentSection, entry: nextEntry };
      }
      if (sectionIndex < sections.length - 1) {
        const nextSection = sections[sectionIndex + 1];
        return { type: 'section', id: nextSection.id, section: nextSection };
      }
    }
    return currentSelection;
  }

  if (type === 'field') {
    const sectionIndex = sections.findIndex(s => s.id === section.id);
    const currentSection = sections[sectionIndex];
    const entries = currentSection.entryTypes || [];
    const entryIndex = entries.findIndex(e => e.id === entry.id);
    const currentEntry = entries[entryIndex];
    const fields = currentEntry.fields || [];
    const fieldIndex = fields.findIndex(f => f.id === id);

    if (direction === 'up') {
      if (fieldIndex > 0) {
        const prevField = fields[fieldIndex - 1];
        return { type: 'field', id: prevField.id, section: currentSection, entry: currentEntry, field: prevField };
      }
      return { type: 'entry', id: entry.id, section: currentSection, entry: currentEntry };
    } else if (direction === 'down') {
      if (fieldIndex < fields.length - 1) {
        const nextField = fields[fieldIndex + 1];
        return { type: 'field', id: nextField.id, section: currentSection, entry: currentEntry, field: nextField };
      }
      if (entryIndex < entries.length - 1) {
        const nextEntry = entries[entryIndex + 1];
        return { type: 'entry', id: nextEntry.id, section: currentSection, entry: nextEntry };
      }
      if (sectionIndex < sections.length - 1) {
        const nextSection = sections[sectionIndex + 1];
        return { type: 'section', id: nextSection.id, section: nextSection };
      }
    }
    return currentSelection;
  }

  return currentSelection;
};
