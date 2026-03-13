import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

const normalizeItem = (item) => {
  if (item == null) return { text: '', proofUrl: '' };
  if (typeof item === 'object' && item !== null) return { text: item.text ?? '', proofUrl: item.proofUrl ?? '' };
  return { text: String(item), proofUrl: '' };
};

const DEFAULT_MAX_CHARS = 120;

const BulletListField = ({ field, value, onChange, error }) => {
  const maxChars = field.maxCharsPerLine || DEFAULT_MAX_CHARS;
  const rawItems = value || [];
  const items = rawItems.map((it) => normalizeItem(it));
  const maxItems = field.validation?.maxItems;

  const addItem = () => {
    if (!maxItems || items.length < maxItems) {
      const newItem = '';
      const newRaw = [...rawItems, newItem];
      onChange(newRaw);
    }
  };

  const updateItem = (index, newText) => {
    const newItems = [...rawItems];
    newItems[index] = newText;
    onChange(newItems);
  };

  const removeItem = (index) => {
    const newItems = rawItems.filter((_, i) => i !== index);
    onChange(newItems);
  };

  const moveItem = (index, direction) => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === items.length - 1)) return;
    const newItems = [...rawItems];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
    onChange(newItems);
  };

  return html`
    <div className="mb-4">
      <label className="block text-sm font-medium mb-1">
        ${field.label}
        ${field.required ? html`<span className="text-[var(--app-danger)]">*</span>` : ''}
      </label>
      ${field.richText ? html`<p className="text-xs text-[var(--app-text-muted)] mb-2">Use **bold** and *italic* for formatting</p>` : ''}
      <div className="space-y-2">
        ${items.map((item, index) => html`
          <div key=${index} className="flex items-start gap-2 group">
            <span className="text-[var(--app-text-muted)] mt-2.5 flex-shrink-0">•</span>
            <div className="flex-1 min-w-0 flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value=${item.text}
                  onChange=${e => updateItem(index, e.target.value)}
                  className="flex-1 px-3 py-2 border rounded"
                  placeholder="Bullet item"
                />
                <button
                  onClick=${() => moveItem(index, 'up')}
                  disabled=${index === 0}
                  className="px-2 py-1 bg-[var(--app-surface-muted)] rounded disabled:opacity-50"
                  title="Move up"
                >↑</button>
                <button
                  onClick=${() => moveItem(index, 'down')}
                  disabled=${index === items.length - 1}
                  className="px-2 py-1 bg-[var(--app-surface-muted)] rounded disabled:opacity-50"
                  title="Move down"
                >↓</button>
                <button
                  onClick=${() => removeItem(index)}
                  className="px-2 py-1 bg-[var(--app-danger)] text-white rounded"
                  title="Remove"
                >×</button>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className=${item.text.length > maxChars ? 'text-[var(--app-danger)] font-medium' : item.text.length > maxChars * 0.85 ? 'text-[var(--app-text-secondary)]' : 'text-[var(--app-text-muted)]'}>
                  ${item.text.length} / ~${maxChars}
                </span>
                ${item.text.length > maxChars ? html`<span className="text-[var(--app-danger)]">Overflows to 2nd line</span>` : ''}
              </div>
            </div>
          </div>
        `)}
        ${(!maxItems || items.length < maxItems) ? html`
          <button
            onClick=${addItem}
            className="px-3 py-1 bg-[var(--app-accent)] text-white rounded text-sm hover:bg-[var(--app-accent-hover)]"
          >
            + Add Item
          </button>
        ` : html`
          <div className="text-xs text-[var(--app-text-muted)]">Maximum ${maxItems} items reached</div>
        `}
      </div>
      ${error ? html`<div className="text-xs text-[var(--app-danger)] mt-1">${error}</div>` : ''}
    </div>
  `;
};

export default BulletListField;
