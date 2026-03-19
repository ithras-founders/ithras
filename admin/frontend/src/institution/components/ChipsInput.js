/**
 * Add/remove items as chips (for degrees, majors when used as tags).
 */
import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

const ChipsInput = ({ items = [], onChange, placeholder = 'Add...', addLabel = 'Add' }) => {
  const [inputVal, setInputVal] = React.useState('');

  const add = () => {
    const v = inputVal.trim();
    if (v && !(items || []).includes(v)) {
      onChange([...(items || []), v]);
      setInputVal('');
    }
  };

  const remove = (i) => {
    const next = (items || []).filter((_, idx) => idx !== i);
    onChange(next);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      add();
    }
  };

  return html`
    <div className="flex flex-wrap gap-2 p-2 border border-[var(--app-border-soft)] rounded-xl bg-white min-h-[44px]">
      ${(items || []).map((item, i) => html`
        <span
          key=${i}
          className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-sm"
          style=${{ background: 'var(--app-surface)', color: 'var(--app-text-primary)' }}
        >
          ${item}
          <button
            type="button"
            onClick=${() => remove(i)}
            className="ml-0.5 hover:text-red-600 transition-colors"
            aria-label="Remove"
          >
            ×
          </button>
        </span>
      `)}
      <div className="flex-1 flex gap-1 min-w-[120px]">
        <input
          type="text"
          value=${inputVal}
          onChange=${(e) => setInputVal(e.target.value)}
          onKeyDown=${handleKeyDown}
          placeholder=${placeholder}
          className="flex-1 min-w-0 py-1 px-2 border-0 bg-transparent focus:ring-0 focus:outline-none text-sm"
          style=${{ color: 'var(--app-text-primary)' }}
        />
        <button
          type="button"
          onClick=${add}
          className="text-sm font-medium"
          style=${{ color: 'var(--app-accent)' }}
        >
          + ${addLabel}
        </button>
      </div>
    </div>
  `;
};

export default ChipsInput;
