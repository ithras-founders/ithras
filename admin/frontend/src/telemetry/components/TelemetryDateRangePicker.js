/**
 * TelemetryDateRangePicker - Time range presets and custom range.
 */
import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

const PRESETS = [
  { value: '1h', label: 'Last 1 hour' },
  { value: '24h', label: 'Last 24 hours' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: 'custom', label: 'Custom' },
];

const TelemetryDateRangePicker = ({ range = {}, onChange }) => {
  const preset = range.preset || '24h';

  const applyPreset = (p) => {
    const now = new Date();
    let from = new Date(now);
    if (p === '1h') from.setHours(from.getHours() - 1);
    else if (p === '24h') from.setDate(from.getDate() - 1);
    else if (p === '7d') from.setDate(from.getDate() - 7);
    else if (p === '30d') from.setDate(from.getDate() - 30);
    else return;
    onChange({
      from: from.toISOString(),
      to: now.toISOString(),
      preset: p,
    });
  };

  return html`
    <div className="flex flex-wrap items-center gap-3">
      <select
        value=${preset}
        onChange=${(e) => applyPreset(e.target.value)}
        className="px-3 py-2 text-sm border rounded-lg"
        style=${{ borderColor: 'var(--app-border-soft)' }}
      >
        ${PRESETS.map((p) => html`<option key=${p.value} value=${p.value}>${p.label}</option>`)}
      </select>
      ${preset === 'custom' ? html`
        <input
          type="datetime-local"
          value=${range.from ? new Date(range.from).toISOString().slice(0, 16) : ''}
          onChange=${(e) => onChange({ ...range, from: e.target.value ? new Date(e.target.value).toISOString() : range.from })}
          className="px-3 py-2 text-sm border rounded-lg"
          style=${{ borderColor: 'var(--app-border-soft)' }}
        />
        <span style=${{ color: 'var(--app-text-muted)' }}>to</span>
        <input
          type="datetime-local"
          value=${range.to ? new Date(range.to).toISOString().slice(0, 16) : ''}
          onChange=${(e) => onChange({ ...range, to: e.target.value ? new Date(e.target.value).toISOString() : range.to })}
          className="px-3 py-2 text-sm border rounded-lg"
          style=${{ borderColor: 'var(--app-border-soft)' }}
        />
      ` : null}
    </div>
  `;
};

export default TelemetryDateRangePicker;
