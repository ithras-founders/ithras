import React, { useEffect, useState } from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

const Toast = ({ message, type = 'success', onDismiss, duration = 4000 }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const show = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(show);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 200);
    }, duration);
    return () => clearTimeout(t);
  }, [duration, onDismiss]);

  const isError = type === 'error';
  const styleClass = isError
    ? 'bg-[var(--status-danger-bg)] border-[rgba(255,59,48,0.2)] text-[var(--status-danger-text)]'
    : 'bg-[var(--status-success-bg)] border-[rgba(52,199,89,0.2)] text-[var(--status-success-text)]';
  return html`
    <div
      className=${`flex items-center gap-[var(--app-space-3)] px-[var(--app-space-4)] py-[var(--app-space-3)] rounded-[var(--app-radius-md)] border transition-all duration-200 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'} ${styleClass}`}
      role="alert"
    >
      ${isError ? html`<svg className="w-5 h-5 flex-shrink-0 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>` : html`<svg className="w-5 h-5 flex-shrink-0 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`}
      <span className="text-sm font-medium">${typeof message === 'string' ? message : (message?.message ?? JSON.stringify(message ?? ''))}</span>
    </div>
  `;
};

export default Toast;
