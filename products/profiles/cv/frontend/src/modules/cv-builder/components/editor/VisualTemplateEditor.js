import React, { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react';
import htm from 'htm';
import { pointerWithin } from '@dnd-kit/core';
import DragContextProvider from '/core/frontend/src/modules/shared/dnd/DragContextProvider.js';
import { useUndoRedo } from '/core/frontend/src/modules/shared/hooks/useUndoRedo.js';
import BuildingBlocksPanel from './BuildingBlocksPanel.js';
import TemplateCanvas from './TemplateCanvas.js';
import PropertiesPanel from './PropertiesPanel.js';
import { handleDragEnd as processDragEnd } from './dragHandlers.js';
import { handleKeyboard, navigateSelection } from './keyboardHandlers.js';
import * as mutations from './templateMutations.js';

const html = htm.bind(React.createElement);

/**
 * Main Visual Template Editor Component
 * Orchestrates the 3-panel layout (Building Blocks, Canvas, Properties)
 */
const VisualTemplateEditor = ({ 
  initialConfig, 
  onSave, 
  onConfigChange,
  templateId,
  configRef 
}) => {
  const {
    state: config,
    setState: setConfig,
    undo,
    redo,
    canUndo,
    canRedo,
    reset,
  } = useUndoRedo(initialConfig || {
    page: { size: "A4", margins: { top: 20, bottom: 20, left: 20, right: 20 } },
    typography: { baseFont: { family: "serif", size: 10.5, lineHeight: 1.2 } },
    spacing: { lineSpacing: 1.2, sectionSpacing: 8.0 },
    overflowPolicy: { allowOverflow: true, restrictOverflow: false },
    sections: [],
  });

  const [selectedElement, setSelectedElement] = useState({ type: 'template' }); // Start with template selected
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // 'saving', 'saved', 'error'
  const autosaveTimeoutRef = React.useRef(null);
  const skipNextConfigNotifyRef = useRef(false);
  const prevInitialConfigRef = useRef(null);

  // Reset config when initialConfig changes (e.g. template select, tab switch)
  // Use JSON comparison to avoid reset loops when parent echoes our updates
  useEffect(() => {
    if (!initialConfig) return;
    try {
      const configStr = JSON.stringify(initialConfig);
      if (prevInitialConfigRef.current === configStr) return;
      prevInitialConfigRef.current = configStr;
      skipNextConfigNotifyRef.current = true;
      reset(initialConfig);
    } catch {
      reset(initialConfig);
    }
  }, [initialConfig, reset]);

  // Keep configRef in sync so parent can read latest config when Save is clicked
  useLayoutEffect(() => {
    if (configRef) configRef.current = config;
  }, [config, configRef]);

  // Notify parent of config changes - skip when we just reset from parent to break sync loop
  useEffect(() => {
    if (skipNextConfigNotifyRef.current) {
      skipNextConfigNotifyRef.current = false;
      return;
    }
    if (onConfigChange) {
      onConfigChange(config);
    }
  }, [config, onConfigChange]);

  // Autosave functionality (debounced)
  useEffect(() => {
    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current);
    }

    autosaveTimeoutRef.current = setTimeout(() => {
      if (onSave && templateId) {
        handleAutosave();
      }
    }, 500); // 500ms debounce

    return () => {
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }
    };
  }, [config]);

  const handleAutosave = async () => {
    if (!onSave || !templateId) return;

    setSaving(true);
    setSaveStatus('saving');
    try {
      await onSave(config);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(null), 2000);
    } catch (error) {
      console.error('Autosave failed:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleDragEnd = useCallback((event) => {
    processDragEnd(event, config, setConfig);
  }, [config, setConfig]);

  const handleSelect = useCallback((element) => {
    setSelectedElement(element);
  }, []);

  const handleDelete = useCallback((type, data) => {
    let newConfig;
    
    if (type === 'section') {
      newConfig = mutations.deleteSection(config, data.sectionId);
    } else if (type === 'entry') {
      newConfig = mutations.deleteEntry(config, data.sectionId, data.entryId);
    } else if (type === 'field') {
      newConfig = mutations.deleteField(config, data.sectionId, data.entryId, data.fieldId);
    }

    if (newConfig) {
      setConfig(newConfig);
      setSelectedElement(null);
    }
  }, [config, setConfig]);

  const handlePropertyUpdate = useCallback((type, data) => {
    let newConfig;

    if (type === 'template') {
      newConfig = mutations.updateTemplateSettings(config, data);
    } else if (type === 'section') {
      newConfig = mutations.updateSection(config, data.sectionId, data.updates);
    } else if (type === 'entry') {
      newConfig = mutations.updateEntry(config, data.sectionId, data.entryId, data.updates);
    } else if (type === 'field') {
      newConfig = mutations.updateField(config, data.sectionId, data.entryId, data.fieldId, data.updates);
    }

    if (newConfig) {
      setConfig(newConfig);
    }
  }, [config, setConfig]);

  const handleKeyboardEvent = useCallback((event) => {
    handleKeyboard(event, selectedElement, config, {
      onDelete: handleDelete,
      onNavigate: (direction, currentSelection, config) => {
        const newSelection = navigateSelection(direction, currentSelection || selectedElement, config);
        setSelectedElement(newSelection);
      },
      onUndo: undo,
      onRedo: redo,
    });
  }, [selectedElement, config, handleDelete, undo, redo]);

  // Keyboard event listener
  useEffect(() => {
    window.addEventListener('keydown', handleKeyboardEvent);
    return () => {
      window.removeEventListener('keydown', handleKeyboardEvent);
    };
  }, [handleKeyboardEvent]);

  // Click outside to deselect (but allow template selection via canvas click)
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Don't deselect if clicking on canvas page background (which selects template)
      if (event.target.closest('.page-background')) {
        return;
      }
      if (!event.target.closest('.template-canvas') && !event.target.closest('.properties-panel') && !event.target.closest('.building-blocks-panel')) {
        // Only deselect if not clicking on any editor component
        if (selectedElement?.type !== 'template') {
          setSelectedElement({ type: 'template' });
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [selectedElement]);

  return html`
    <${DragContextProvider} collisionDetection=${pointerWithin} onDragEnd=${handleDragEnd}>
      <div className="flex min-h-[500px] bg-gray-50">
        <!-- Building Blocks Panel (Left) -->
        <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto building-blocks-panel">
          <${BuildingBlocksPanel} selectedElement=${selectedElement} />
        </div>

        <!-- Canvas (Center) - min-h-0 allows flex child to shrink and enable scrolling -->
        <div className="flex-1 min-h-0 template-canvas">
          <div className="h-full min-h-0 flex flex-col">
            <!-- Toolbar -->
            <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick=${undo}
                  disabled=${!canUndo}
                  className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Undo (Ctrl+Z)"
                >
                  ↶ Undo
                </button>
                <button
                  onClick=${redo}
                  disabled=${!canRedo}
                  className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Redo (Ctrl+Shift+Z)"
                >
                  ↷ Redo
                </button>
              </div>
              <div className="flex items-center gap-2">
                ${saveStatus === 'saving' ? html`
                  <span className="text-sm text-gray-500">Saving...</span>
                ` : saveStatus === 'saved' ? html`
                  <span className="text-sm text-green-600">✓ Saved</span>
                ` : saveStatus === 'error' ? html`
                  <span className="text-sm text-red-600">✗ Save failed</span>
                ` : ''}
              </div>
            </div>

            <!-- Canvas Area -->
            <div className="flex-1 min-h-0 overflow-y-auto">
              <${TemplateCanvas}
                config=${config}
                selectedElement=${selectedElement}
                onSelect=${handleSelect}
                onDelete=${handleDelete}
                onDragEnd=${handleDragEnd}
                onPropertyUpdate=${handlePropertyUpdate}
              />
            </div>
          </div>
        </div>

        <!-- Properties Panel (Right) -->
        <div className="properties-panel">
          <${PropertiesPanel}
            selectedElement=${selectedElement}
            config=${config}
            onUpdate=${handlePropertyUpdate}
          />
        </div>
      </div>
    <//>
  `;
};

export default VisualTemplateEditor;
