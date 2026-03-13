import React, { useState, useEffect } from 'react';
import htm from 'htm';
import {
  getSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  getReports,
} from '/core/frontend/src/modules/shared/services/api.js';
import { useToast, useDialog } from '/core/frontend/src/modules/shared/index.js';

const html = htm.bind(React.createElement);

const Scheduler = () => {
  const toast = useToast();
  const { confirm } = useDialog();
  const [schedules, setSchedules] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formReportId, setFormReportId] = useState('');
  const [formCron, setFormCron] = useState('0 9 * * 1');
  const [formRecipients, setFormRecipients] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [schedData, reportData] = await Promise.all([getSchedules(), getReports()]);
      setSchedules(schedData || []);
      setReports(reportData || []);
    } catch (err) {
      console.error('Failed to fetch:', err);
      setSchedules([]);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async () => {
    if (!formReportId) return;
    setSaving(true);
    try {
      await createSchedule({
        report_id: parseInt(formReportId, 10),
        cron_expr: formCron,
        recipients: formRecipients ? formRecipients.split(/[,\s]+/).map(s => s.trim()).filter(Boolean) : [],
        enabled: true,
      });
      await fetchData();
      setShowForm(false);
      setFormReportId('');
      setFormCron('0 9 * * 1');
      setFormRecipients('');
    } catch (err) {
      toast.error('Failed to create schedule: ' + (err.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleEnabled = async (s) => {
    try {
      await updateSchedule(s.id, { enabled: !s.enabled });
      await fetchData();
    } catch (err) {
      toast.error('Failed to update: ' + (err.message || 'Unknown error'));
    }
  };

  const handleDelete = async (id) => {
    if (!(await confirm({ message: 'Delete this schedule?' }))) return;
    try {
      await deleteSchedule(id);
      await fetchData();
    } catch (err) {
      toast.error('Failed to delete: ' + (err.message || 'Unknown error'));
    }
  };

  const getReportName = (reportId) => {
    const r = reports.find(x => x.id === reportId);
    return r?.name || `Report #${reportId}`;
  };

  return html`
    <div className="space-y-10 animate-in pb-20">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-semibold text-[var(--app-text-primary)] tracking-tighter">Scheduler</h2>
          <p className="text-[var(--app-text-secondary)] font-medium italic mt-2">
            Schedule reports to run. Cron format (e.g. 0 9 * * 1 = Mondays 9am). Full cron worker can be added later.
          </p>
        </div>
        <button
          onClick=${() => setShowForm(true)}
          className="px-6 py-3 bg-[var(--app-accent)] text-white rounded-xl text-sm font-bold uppercase hover:bg-[var(--app-accent-hover)]"
        >
          + New Schedule
        </button>
      </header>

      <div className="bg-[var(--app-surface)] p-10 rounded-[var(--app-radius-lg)] border border-[var(--app-border-soft)] shadow-[var(--app-shadow-subtle)]">
        ${showForm ? html`
          <div className="mb-6 p-6 bg-[var(--app-surface-muted)] rounded-xl space-y-4">
            <h3 className="font-bold text-[var(--app-text-primary)]">New Schedule</h3>
            <div>
              <label className="block text-sm font-medium text-[var(--app-text-secondary)] mb-1">Report</label>
              <select
                value=${formReportId}
                onChange=${(e) => setFormReportId(e.target.value)}
                className="w-full px-4 py-2 border border-[var(--app-border-soft)] rounded-lg"
              >
                <option value="">Select report...</option>
                ${reports.map(r => html`<option key=${r.id} value=${r.id}>${r.name}</option>`)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--app-text-secondary)] mb-1">Cron expression (min hr day month dow)</label>
              <input
                type="text"
                value=${formCron}
                onChange=${(e) => setFormCron(e.target.value)}
                placeholder="0 9 * * 1"
                className="w-full px-4 py-2 border border-[var(--app-border-soft)] rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--app-text-secondary)] mb-1">Recipients (comma-separated emails)</label>
              <input
                type="text"
                value=${formRecipients}
                onChange=${(e) => setFormRecipients(e.target.value)}
                placeholder="user@example.com"
                className="w-full px-4 py-2 border border-[var(--app-border-soft)] rounded-lg"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick=${handleCreate}
                disabled=${saving || !formReportId}
                className="px-4 py-2 bg-[var(--app-accent)] text-white rounded-lg font-medium disabled:opacity-50"
              >
                ${saving ? 'Creating...' : 'Create'}
              </button>
              <button onClick=${() => setShowForm(false)} className="px-4 py-2 text-[var(--app-text-secondary)]">
                Cancel
              </button>
            </div>
          </div>
        ` : ''}

        ${loading ? html`<div className="py-12 text-center text-[var(--app-text-muted)]">Loading...</div>` : schedules.length === 0 ? html`
          <div className="py-12 text-center text-[var(--app-text-muted)]">No schedules. Create one to run reports on a schedule.</div>
        ` : html`
          <div className="space-y-3">
            ${schedules.map(s => html`
              <div key=${s.id} className="flex items-center justify-between p-4 border border-[var(--app-border-soft)] rounded-xl">
                <div>
                  <span className="font-bold text-[var(--app-text-primary)]">${getReportName(s.report_id)}</span>
                  <span className="ml-3 text-sm text-[var(--app-text-secondary)] font-mono">${s.cron_expr || '—'}</span>
                  ${s.recipients?.length ? html`
                    <span className="ml-3 text-sm text-[var(--app-text-muted)]">→ ${s.recipients.join(', ')}</span>
                  ` : ''}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick=${() => handleToggleEnabled(s)}
                    className=${`px-3 py-1 rounded-lg text-xs font-medium ${s.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-[var(--app-surface-muted)] text-[var(--app-text-secondary)]'}`}
                  >
                    ${s.enabled ? 'Enabled' : 'Disabled'}
                  </button>
                  <button
                    onClick=${() => handleDelete(s.id)}
                    className="text-[var(--app-danger)] hover:bg-[rgba(255,59,48,0.12)] px-3 py-1 rounded-lg text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            `)}
          </div>
        `}
      </div>
    </div>
  `;
};

export default Scheduler;
