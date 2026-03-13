import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

const StagePipeline = ({ stages }) => {
  if (!stages || stages.length === 0) return null;
  return html`
    <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-[var(--app-border-soft)]">
      ${stages.map((s, i) => {
        const passed = s.progress_status === 'PASSED';
        const current = s.is_current || s.progress_status === 'IN_PROGRESS';
        const failed = s.progress_status === 'FAILED';
        const bg = passed ? 'bg-[var(--app-success)]/15 text-[var(--app-success)]' : current ? 'bg-[var(--app-accent-soft)] text-[var(--app-accent)]' : failed ? 'bg-[rgba(255,59,48,0.12)] text-[var(--app-danger)]' : 'bg-[var(--app-surface-muted)] text-[var(--app-text-muted)]';
        const icon = passed ? '✓' : current ? '●' : failed ? '✕' : '○';
        return html`
          <span key=${s.stage_id || i} className="flex items-center gap-1.5">
            <span className=${`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${bg}`}>
              <span className="text-[10px]">${icon}</span>
              <span>${s.name}</span>
            </span>
            ${i < stages.length - 1 ? html`<span className="text-[var(--app-text-muted)]/50">→</span>` : ''}
          </span>
        `;
      })}
    </div>
  `;
};

export default StagePipeline;
