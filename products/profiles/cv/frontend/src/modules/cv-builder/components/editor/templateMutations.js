/**
 * Pure functions for updating template config
 * All functions return new config objects (immutable updates)
 */

/**
 * Add a new section to the template
 */
export const addSection = (config, sectionData, insertIndex = null) => {
  const newSections = [...(config.sections || [])];
  const newSection = {
    id: sectionData.id || `section_${Date.now()}`,
    title: sectionData.title || 'New Section',
    mandatory: sectionData.mandatory || false,
    lockOrder: sectionData.lockOrder !== undefined ? sectionData.lockOrder : true,
    candidateCanReorder: sectionData.candidateCanReorder !== undefined ? sectionData.candidateCanReorder : false,
    candidateCanEditTitle: sectionData.candidateCanEditTitle !== undefined ? sectionData.candidateCanEditTitle : false,
    visibilityRule: sectionData.visibilityRule || 'always',
    layoutStyle: sectionData.layoutStyle || 'two_column',
    entryTypes: sectionData.entryTypes || [],
    order: insertIndex !== null ? insertIndex : newSections.length,
    spacingOverrides: sectionData.spacingOverrides || null,
  };

  if (insertIndex !== null && insertIndex >= 0 && insertIndex <= newSections.length) {
    newSections.splice(insertIndex, 0, newSection);
  } else {
    newSections.push(newSection);
  }

  // Recalculate order indices
  const reorderedSections = newSections.map((s, i) => ({ ...s, order: i }));

  return {
    ...config,
    sections: reorderedSections,
  };
};

/**
 * Reorder sections
 */
export const reorderSections = (config, fromIndex, toIndex) => {
  const newSections = [...(config.sections || [])];
  const [movedSection] = newSections.splice(fromIndex, 1);
  newSections.splice(toIndex, 0, movedSection);
  
  // Recalculate order indices
  const reorderedSections = newSections.map((s, i) => ({ ...s, order: i }));

  return {
    ...config,
    sections: reorderedSections,
  };
};

/**
 * Delete a section
 */
export const deleteSection = (config, sectionId) => {
  const newSections = (config.sections || []).filter(s => s.id !== sectionId);
  const reorderedSections = newSections.map((s, i) => ({ ...s, order: i }));

  return {
    ...config,
    sections: reorderedSections,
  };
};

/**
 * Update a section
 */
export const updateSection = (config, sectionId, updates) => {
  const newSections = (config.sections || []).map(section => 
    section.id === sectionId ? { ...section, ...updates } : section
  );

  return {
    ...config,
    sections: newSections,
  };
};

/**
 * Add a new entry to a section
 */
export const addEntry = (config, sectionId, entryData, insertIndex = null) => {
  const newSections = (config.sections || []).map(section => {
    if (section.id !== sectionId) return section;

    const newEntryTypes = [...(section.entryTypes || [])];
    const newEntry = {
      id: entryData.id || `entry_${Date.now()}`,
      name: entryData.name || 'New Entry',
      repeatable: entryData.repeatable || false,
      minEntries: entryData.minEntries || 0,
      maxEntries: entryData.maxEntries || null,
      layout: entryData.layout || 'two_column',
      leftBucketWidth: entryData.leftBucketWidth || '1.2in',
      rightContentWidth: entryData.rightContentWidth || 'auto',
      alignment: entryData.alignment || 'top',
      leftBucketContentSource: entryData.leftBucketContentSource || 'fixed',
      leftBucketText: entryData.leftBucketText || null,
      leftBucketVariable: entryData.leftBucketVariable || null,
      leftBucketFieldId: entryData.leftBucketFieldId || null,
      candidateCanReorder: entryData.candidateCanReorder !== undefined ? entryData.candidateCanReorder : false,
      fields: entryData.fields || [],
    };

    if (insertIndex !== null && insertIndex >= 0 && insertIndex <= newEntryTypes.length) {
      newEntryTypes.splice(insertIndex, 0, newEntry);
    } else {
      newEntryTypes.push(newEntry);
    }

    return {
      ...section,
      entryTypes: newEntryTypes,
    };
  });

  return {
    ...config,
    sections: newSections,
  };
};

/**
 * Reorder entries within a section
 */
export const reorderEntries = (config, sectionId, fromIndex, toIndex) => {
  const newSections = (config.sections || []).map(section => {
    if (section.id !== sectionId) return section;

    const newEntryTypes = [...(section.entryTypes || [])];
    const [movedEntry] = newEntryTypes.splice(fromIndex, 1);
    newEntryTypes.splice(toIndex, 0, movedEntry);

    return {
      ...section,
      entryTypes: newEntryTypes,
    };
  });

  return {
    ...config,
    sections: newSections,
  };
};

/**
 * Delete an entry from a section
 */
export const deleteEntry = (config, sectionId, entryId) => {
  const newSections = (config.sections || []).map(section => {
    if (section.id !== sectionId) return section;

    return {
      ...section,
      entryTypes: (section.entryTypes || []).filter(e => e.id !== entryId),
    };
  });

  return {
    ...config,
    sections: newSections,
  };
};

/**
 * Update an entry
 */
export const updateEntry = (config, sectionId, entryId, updates) => {
  const newSections = (config.sections || []).map(section => {
    if (section.id !== sectionId) return section;

    return {
      ...section,
      entryTypes: (section.entryTypes || []).map(entry =>
        entry.id === entryId ? { ...entry, ...updates } : entry
      ),
    };
  });

  return {
    ...config,
    sections: newSections,
  };
};

/**
 * Add a field to an entry
 */
export const addField = (config, sectionId, entryId, fieldData, targetArea = 'right_content', insertIndex = null) => {
  const newSections = (config.sections || []).map(section => {
    if (section.id !== sectionId) return section;

    return {
      ...section,
      entryTypes: (section.entryTypes || []).map(entry => {
        if (entry.id !== entryId) return entry;

        const newFields = [...(entry.fields || [])];
        const fieldType = fieldData.type || 'text';
        const newField = {
          id: fieldData.id || `field_${Date.now()}`,
          label: fieldData.label || 'New Field',
          type: fieldType,
          required: fieldData.required || false,
          validation: fieldData.validation || null,
          overflowRule: fieldData.overflowRule || null,
          pdfMapping: {
            location: targetArea,
            format: fieldData.pdfMapping?.format || 'normal',
            prefix: fieldData.pdfMapping?.prefix || '',
            suffix: fieldData.pdfMapping?.suffix || '',
            ...fieldData.pdfMapping,
          },
          options: fieldData.options || null,
          placeholder: fieldData.placeholder || '',
          ...(fieldType === 'table' ? {
            columns: fieldData.columns || [{ id: 'col_0', label: 'Column 1', type: 'text' }, { id: 'col_1', label: 'Column 2', type: 'text' }],
            repeatableRows: fieldData.repeatableRows !== false,
          } : {}),
        };

        if (insertIndex !== null && insertIndex >= 0 && insertIndex <= newFields.length) {
          newFields.splice(insertIndex, 0, newField);
        } else {
          newFields.push(newField);
        }

        return {
          ...entry,
          fields: newFields,
        };
      }),
    };
  });

  return {
    ...config,
    sections: newSections,
  };
};

/**
 * Reorder fields within an entry
 */
export const reorderFields = (config, sectionId, entryId, fromIndex, toIndex) => {
  const newSections = (config.sections || []).map(section => {
    if (section.id !== sectionId) return section;

    return {
      ...section,
      entryTypes: (section.entryTypes || []).map(entry => {
        if (entry.id !== entryId) return entry;

        const newFields = [...(entry.fields || [])];
        const [movedField] = newFields.splice(fromIndex, 1);
        newFields.splice(toIndex, 0, movedField);

        return {
          ...entry,
          fields: newFields,
        };
      }),
    };
  });

  return {
    ...config,
    sections: newSections,
  };
};

/**
 * Move a field between left bucket and right content areas
 */
export const moveField = (config, sectionId, entryId, fieldId, fromArea, toArea) => {
  const newSections = (config.sections || []).map(section => {
    if (section.id !== sectionId) return section;

    return {
      ...section,
      entryTypes: (section.entryTypes || []).map(entry => {
        if (entry.id !== entryId) return entry;

        return {
          ...entry,
          fields: (entry.fields || []).map(field => {
            if (field.id !== fieldId) return field;

            return {
              ...field,
              pdfMapping: {
                ...field.pdfMapping,
                location: toArea,
              },
            };
          }),
        };
      }),
    };
  });

  return {
    ...config,
    sections: newSections,
  };
};

/**
 * Delete a field from an entry
 */
export const deleteField = (config, sectionId, entryId, fieldId) => {
  const newSections = (config.sections || []).map(section => {
    if (section.id !== sectionId) return section;

    return {
      ...section,
      entryTypes: (section.entryTypes || []).map(entry => {
        if (entry.id !== entryId) return entry;

        return {
          ...entry,
          fields: (entry.fields || []).filter(f => f.id !== fieldId),
        };
      }),
    };
  });

  return {
    ...config,
    sections: newSections,
  };
};

/**
 * Update a field
 */
export const updateField = (config, sectionId, entryId, fieldId, updates) => {
  const newSections = (config.sections || []).map(section => {
    if (section.id !== sectionId) return section;

    return {
      ...section,
      entryTypes: (section.entryTypes || []).map(entry => {
        if (entry.id !== entryId) return entry;

        return {
          ...entry,
          fields: (entry.fields || []).map(field =>
            field.id === fieldId ? { ...field, ...updates } : field
          ),
        };
      }),
    };
  });

  return {
    ...config,
    sections: newSections,
  };
};

/**
 * Update global template settings
 */
export const updateTemplateSettings = (config, updates) => {
  return {
    ...config,
    ...updates,
  };
};
