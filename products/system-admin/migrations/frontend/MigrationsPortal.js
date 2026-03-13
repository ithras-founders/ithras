import React, { useState, useEffect, useCallback } from 'react';
import htm from 'htm';
import { getMigrationsStatus, runMigrations } from '/core/frontend/src/modules/shared/services/api.js';
import { useToast } from '/core/frontend/src/modules/shared/index.js';
import SkeletonLoader from '/core/frontend/src/modules/shared/components/SkeletonLoader.js';
import { PageWrapper, PageHeader, SectionCard, Button } from '/core/frontend/src/modules/shared/primitives/index.js';

const html = htm.bind(React.createElement);

const MigrationsPortal = () => {
  const toast = useToast();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [running, setRunning] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMigrationsStatus();
      setStatus(data);
    } catch (err) {
      setError(err.message || 'Failed to load migration status');
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  const handleRun = async () => {
    try {
      setRunning(true);
      const result = await runMigrations();
      if (result.success) {
        toast.success(result.message || 'Migrations completed');
        await fetchStatus();
      } else {
        toast.error(result.message || 'Migrations failed');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to run migrations');
    } finally {
      setRunning(false);
    }
  };

  if (loading && !status) {
    return html`
      <div className="w-full px-4 md:px-6 pt-6 pb-20">
        <${SkeletonLoader} variant="cards" lines=${4} />
      </div>
    `;
  }

  return html`
    <${PageWrapper} className="w-full pb-20">
      <${PageHeader}
        title="Migrations"
        subtitle="Run Alembic migrations on demand. DB_SETUP=TRUE at startup also runs migrations automatically."
        actions=${html`
          <${Button} variant="secondary" size="sm" onClick=${fetchStatus} disabled=${loading}>
            ${loading ? 'Refreshing...' : 'Refresh'}
          <//>
          <${Button} variant="primary" size="sm" onClick=${handleRun} disabled=${running || status?.is_up_to_date}>
            ${running ? 'Running...' : status?.is_up_to_date ? 'Up to date' : 'Run migrations'}
          <//>
        `}
      />

      ${error ? html`
        <div className="p-4 bg-[var(--app-danger-soft)] border border-[rgba(255,59,48,0.2)] rounded-[var(--app-radius-md)] text-[var(--app-danger)] text-sm">
          ${error}
        </div>
      ` : null}

      ${status ? html`
        <${SectionCard} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-[var(--app-surface-muted)] rounded-[var(--app-radius-md)]">
              <p className="text-xs font-semibold text-[var(--app-text-muted)] uppercase tracking-wider mb-1">Current</p>
              <p className="text-lg font-mono font-semibold text-[var(--app-text-primary)]">${status.current_revision || '—'}</p>
            </div>
            <div className="p-4 bg-[var(--app-surface-muted)] rounded-[var(--app-radius-md)]">
              <p className="text-xs font-semibold text-[var(--app-text-muted)] uppercase tracking-wider mb-1">Head</p>
              <p className="text-lg font-mono font-semibold text-[var(--app-text-primary)]">${status.head_revision || '—'}</p>
            </div>
            <div className="p-4 bg-[var(--app-surface-muted)] rounded-[var(--app-radius-md)]">
              <p className="text-xs font-semibold text-[var(--app-text-muted)] uppercase tracking-wider mb-1">Status</p>
              <p className=${'text-lg font-semibold ' + (status.is_up_to_date ? 'text-[var(--app-success)]' : 'text-[var(--app-warning)]')}>
                ${status.is_up_to_date ? 'Up to date' : `${status.pending?.length || 0} pending`}
              </p>
            </div>
          </div>

          <h3 className="text-sm font-semibold text-[var(--app-text-primary)] mb-3">Migration history</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--app-border-soft)]">
                  <th className="text-left py-2 font-semibold text-[var(--app-text-muted)]">Revision</th>
                  <th className="text-left py-2 font-semibold text-[var(--app-text-muted)]">Description</th>
                </tr>
              </thead>
              <tbody>
                ${(status.history || []).map(m => html`
                  <tr key=${m.revision} className="border-b border-[var(--app-border-soft)]">
                    <td className="py-2 font-mono text-xs">${m.revision}</td>
                    <td className="py-2 text-[var(--app-text-secondary)]">${m.doc || '—'}</td>
                  </tr>
                `)}
              </tbody>
            </table>
          </div>
        <//>
      ` : null}
    <//>
  `;
};

export default MigrationsPortal;
