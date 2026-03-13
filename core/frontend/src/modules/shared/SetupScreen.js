import React from 'react';
import htm from 'htm';
import IthrasLogo from './components/IthrasLogo.js';
import { Button } from './primitives/index.js';

const html = htm.bind(React.createElement);

const PHASE_LABELS = {
  schema: 'Applying database schema...',
  seeds: 'Seeding initial data...',
  done: 'Setup complete',
};

export const SetupScreen = ({
  status,
  message,
  phase,
  currentStep,
  totalSteps,
  steps,
  progressPercent,
  dbUnreachable,
  onRetry,
}) => {
  const progress =
    progressPercent != null && progressPercent >= 0
      ? progressPercent
      : (totalSteps || 0) > 0
        ? ((currentStep || 0) / (totalSteps || 1)) * 100
        : 0;
  const displayMessage =
    message ||
    (phase ? PHASE_LABELS[phase] || phase : 'Preparing database...');
  const showRetry = (status === 'error' || dbUnreachable) && onRetry;

  return html`
    <div className="min-h-screen bg-[var(--app-bg)] flex items-center justify-center p-8 font-sans">
      <div className="max-w-md w-full app-card rounded-[var(--app-radius-lg)] shadow-[var(--app-shadow-card)] p-[var(--app-space-8)] border border-[var(--app-border-soft)]">
        <div className="flex items-center gap-3 mb-6">
          <${IthrasLogo} size="md" theme="dark" />
          <h1 className="text-2xl font-semibold text-[var(--app-text-primary)] tracking-tight">Setting up ithras</h1>
        </div>

        <p className="text-[var(--app-text-secondary)] mb-6">${displayMessage}</p>

        ${dbUnreachable
          ? html`
              <div className="mb-6 p-4 bg-[rgba(245,158,11,0.1)] border border-[rgba(245,158,11,0.25)] rounded-[var(--app-radius-md)] text-sm text-[rgb(146,64,14)]">
                <strong>Database unreachable.</strong> Check DATABASE_URL and CLOUDSQL_INSTANCE (for Cloud SQL Unix socket).
              </div>
            `
          : null}

        <div className="mb-6">
          <div className="h-2 bg-[var(--app-bg-elevated)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--app-accent)] rounded-full transition-all duration-300"
              style=${{ width: `${Math.min(100, progress)}%` }}
            />
          </div>
          <p className="text-sm text-[var(--app-text-muted)] mt-2">
            ${totalSteps > 0 ? `${currentStep} of ${totalSteps} steps` : `${Math.round(progress)}%`}
          </p>
        </div>

        ${steps && steps.length > 0
          ? html`
              <ul className="space-y-3">
                ${steps.map((s) =>
                  html`
                    <li key=${s.id} className="flex items-center gap-3 text-sm">
                      ${s.status === 'done'
                        ? html`<span className="text-[var(--app-success)] font-bold">✓</span>`
                        : s.status === 'in_progress'
                          ? html`<span className="animate-spin text-[var(--app-accent)] font-bold">⟳</span>`
                          : html`<span className="text-[var(--app-text-muted)]/50">○</span>`}
                      <span
                        className=${s.status === 'done'
                          ? 'text-[var(--app-text-muted)]'
                          : s.status === 'in_progress'
                            ? 'text-[var(--app-text-primary)] font-medium'
                            : 'text-[var(--app-text-muted)]'}
                      >
                        ${s.name}
                      </span>
                    </li>
                  `
                )}
              </ul>
            `
          : null}

        ${showRetry
          ? html`
              <div className="mt-[var(--app-space-6)]">
                <${Button} onClick=${onRetry} variant="primary" className="w-full py-3">
                  Retry
                <//>
              </div>
            `
          : null}
      </div>
    </div>
  `;
};
