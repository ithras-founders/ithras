/**
 * Pagination controls - prev/next, page size, count display.
 */
import React from 'react';
import htm from 'htm';
import Button from './Button.js';

const html = htm.bind(React.createElement);

const PaginationControls = ({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [20, 50, 100],
  className = '',
}) => {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const canPrev = page > 1;
  const canNext = page < totalPages;
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return html`
    <div className=${`flex flex-wrap items-center justify-between gap-4 ${className}`.trim()}>
      <span className="text-sm text-[var(--app-text-secondary)]">
        ${total === 0 ? 'No items' : `Showing ${start}–${end} of ${total}`}
      </span>
      <div className="flex items-center gap-3">
        ${onPageSizeChange ? html`
          <label className="flex items-center gap-2 text-sm">
            <span className="text-[var(--app-text-muted)]">Per page:</span>
            <select
              value=${pageSize}
              onChange=${(e) => onPageSizeChange(Number(e.target.value))}
              className="px-3 py-1.5 rounded-lg border border-[var(--app-border-soft)] text-sm bg-[var(--app-surface)]"
            >
              ${pageSizeOptions.map(s => html`<option key=${s} value=${s}>${s}</option>`)}
            </select>
          </label>
        ` : null}
        <div className="flex items-center gap-2">
          <${Button} variant="secondary" size="sm" onClick=${() => onPageChange(Math.max(1, page - 1))} disabled=${!canPrev}>
            Previous
          <//>
          <span className="text-sm text-[var(--app-text-muted)]">Page ${page} of ${totalPages}</span>
          <${Button} variant="secondary" size="sm" onClick=${() => onPageChange(Math.min(totalPages, page + 1))} disabled=${!canNext}>
            Next
          <//>
        </div>
      </div>
    </div>
  `;
};

export default PaginationControls;
