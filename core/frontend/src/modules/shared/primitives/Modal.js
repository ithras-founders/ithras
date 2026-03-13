/**
 * Unified Modal primitive - enterprise design system.
 * Overlay + centered card, accessible, consistent styling.
 */
import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

const Modal = ({ open, onClose, title, children, size = 'md', className = '' }) => {
  if (!open) return null;

  const sizeClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl max-h-[85vh] overflow-y-auto',
    '3xl': 'max-w-3xl max-h-[85vh] overflow-y-auto',
    full: 'max-w-[90vw] max-h-[85vh] overflow-y-auto',
  }[size] || 'max-w-md';

  return html`
    <div
      className="fixed inset-0 bg-black/30 backdrop-blur-[1px] z-[100] flex items-center justify-center p-[var(--app-space-4)]"
      onClick=${onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby=${title ? 'modal-title' : undefined}
    >
      <div
        className=${`app-card bg-[var(--app-surface)] rounded-[var(--app-radius-md)] shadow-[var(--app-shadow-floating)] w-full ${sizeClass} p-[var(--app-space-6)] animate-in ${className}`.trim()}
        onClick=${(e) => e.stopPropagation()}
      >
        ${title ? html`
          <h2 id="modal-title" className="text-[var(--app-text-xl)] font-semibold text-[var(--app-text-primary)] mb-[var(--app-space-4)]">
            ${title}
          </h2>
        ` : null}
        ${children}
      </div>
    </div>
  `;
};

export default Modal;
