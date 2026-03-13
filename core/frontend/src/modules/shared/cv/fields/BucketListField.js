import React from 'react';
import htm from 'htm';
import BulletListField from './BulletListField.js';

const html = htm.bind(React.createElement);

const normalizeBullet = (item) => {
  if (item == null) return { text: '', proofUrl: '' };
  if (typeof item === 'object' && item !== null) return { text: item.text ?? '', proofUrl: item.proofUrl ?? '' };
  return { text: String(item), proofUrl: '' };
};

const normalizeBucket = (b) => {
  if (!b || typeof b !== 'object') return { label: '', bullets: [], proofUrl: '' };
  const bullets = Array.isArray(b.bullets) ? b.bullets.map(normalizeBullet) : [];
  return { label: b.label ?? '', bullets, proofUrl: b.proofUrl ?? '' };
};

const BucketListField = ({ field, value, onChange, error, defaultBuckets = [] }) => {
  const rawBuckets = Array.isArray(value) ? value.map(normalizeBucket) : [];
  const buckets = rawBuckets.length > 0
    ? rawBuckets
    : (defaultBuckets.length > 0
      ? defaultBuckets.map(b => typeof b === 'string' ? { label: b, bullets: [], proofUrl: '' } : { label: b.label ?? b, bullets: [], proofUrl: '' })
      : [{ label: '', bullets: [], proofUrl: '' }]);

  const updateBucket = (index, updates) => {
    const next = [...buckets];
    next[index] = { ...next[index], ...updates };
    onChange(next);
  };

  const addBucket = () => {
    onChange([...buckets, { label: '', bullets: [], proofUrl: '' }]);
  };

  const removeBucket = (index) => {
    if (buckets.length <= 1) return;
    onChange(buckets.filter((_, i) => i !== index));
  };

  const moveBucket = (index, direction) => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === buckets.length - 1)) return;
    const next = [...buckets];
    const target = direction === 'up' ? index - 1 : index + 1;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const bulletField = {
    ...field,
    label: '',
    allowProofPerItem: false,
    richText: field.richText ?? true,
    bulletDateFormat: field.bulletDateFormat || 'trailing_year',
    validation: field.validation,
  };

  return html`
    <div className="space-y-4">
      ${buckets.map((bucket, idx) => html`
        <div key=${idx} className="border border-[var(--app-border-soft)] rounded-lg p-3 bg-[var(--app-surface-muted)]/30">
          <div className="flex gap-4 items-start mb-3">
            <div className="flex-1 flex items-center gap-2">
              <input
                type="text"
                value=${bucket.label}
                onChange=${e => updateBucket(idx, { label: e.target.value })}
                className="flex-1 max-w-xs px-3 py-2 border border-[var(--app-border-soft)] rounded font-semibold text-[var(--app-text-secondary)]"
                placeholder="Category label (e.g. Scholastic & Academic Honours)"
              />
              <div className="flex items-center gap-1">
                <button
                  onClick=${() => moveBucket(idx, 'up')}
                  disabled=${idx === 0}
                  className="p-1.5 text-[var(--app-text-secondary)] hover:text-[var(--app-text-secondary)] disabled:opacity-40"
                  title="Move up"
                >↑</button>
                <button
                  onClick=${() => moveBucket(idx, 'down')}
                  disabled=${idx === buckets.length - 1}
                  className="p-1.5 text-[var(--app-text-secondary)] hover:text-[var(--app-text-secondary)] disabled:opacity-40"
                  title="Move down"
                >↓</button>
                <button
                  onClick=${() => removeBucket(idx)}
                  disabled=${buckets.length <= 1}
                  className="p-1.5 text-[var(--app-danger)] hover:text-[var(--app-danger)] disabled:opacity-40"
                  title="Remove category"
                >×</button>
              </div>
            </div>
          </div>

          <div className="ml-2">
            <${BulletListField}
              field=${bulletField}
              value=${bucket.bullets}
              onChange=${bullets => updateBucket(idx, { bullets })}
              error=${null}
            />
          </div>
        </div>
      `)}
      <button
        onClick=${addBucket}
        className="w-full py-2 text-sm font-medium text-[var(--app-accent)] hover:bg-[var(--app-accent-soft)] rounded-lg border border-dashed border-[var(--app-border-soft)] transition-colors flex items-center justify-center gap-1"
      >
        + Add Category
      </button>
      ${error ? html`<div className="text-xs text-[var(--app-danger)] mt-1">${error}</div>` : ''}
    </div>
  `;
};

export default BucketListField;
