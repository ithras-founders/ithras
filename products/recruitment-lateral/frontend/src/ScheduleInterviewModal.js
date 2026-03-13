import React, { useState } from 'react';
import htm from 'htm';
import { scheduleInterview } from '/core/frontend/src/modules/shared/services/api.js';
import { useToast } from '/core/frontend/src/modules/shared/index.js';
import Modal from '/core/frontend/src/modules/shared/primitives/Modal.js';

const html = htm.bind(React.createElement);

const ScheduleInterviewModal = ({ onClose, onSuccess, application, workflow, user }) => {
  const toast = useToast();
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [duration, setDuration] = useState(30);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!application?.student_id || !workflow?.id || !user?.company_id) {
      toast.error('Missing application, workflow, or company');
      return;
    }
    const jobId = application.job_id || workflow.job_id;
    const institutionId = workflow.institution_id;
    if (!jobId || !institutionId) {
      toast.error('Missing job or institution');
      return;
    }
    const startStr = `${startDate}T${startTime}:00`;
    try {
      setSubmitting(true);
      await scheduleInterview({
        candidate_id: application.student_id,
        application_id: application.id,
        workflow_id: workflow.id,
        job_id: jobId,
        company_id: user.company_id,
        institution_id: institutionId,
        start_time: startStr,
        duration_minutes: duration,
      });
      toast.success('Interview scheduled');
      onSuccess?.();
      onClose?.();
    } catch (err) {
      toast.error(err?.message || 'Failed to schedule');
    } finally {
      setSubmitting(false);
    }
  };

  const today = new Date().toISOString().slice(0, 10);

  return html`
    <${Modal} open=${true} onClose=${onClose} title="Schedule interview" size="md">
      <form onSubmit=${handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--app-text-muted)] uppercase mb-1">Date</label>
            <input
              type="date"
              value=${startDate}
              onChange=${(e) => setStartDate(e.target.value)}
              min=${today}
              required
              className="w-full px-4 py-2 rounded-xl border border-[var(--app-border-soft)] bg-[var(--app-surface-muted)] text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--app-text-muted)] uppercase mb-1">Time</label>
            <input
              type="time"
              value=${startTime}
              onChange=${(e) => setStartTime(e.target.value)}
              required
              className="w-full px-4 py-2 rounded-xl border border-[var(--app-border-soft)] bg-[var(--app-surface-muted)] text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--app-text-muted)] uppercase mb-1">Duration (min)</label>
            <input
              type="number"
              min=${15}
              max=${120}
              step=${15}
              value=${duration}
              onChange=${(e) => setDuration(parseInt(e.target.value, 10) || 30)}
              className="w-full px-4 py-2 rounded-xl border border-[var(--app-border-soft)] bg-[var(--app-surface-muted)] text-sm"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick=${onClose}
              className="flex-1 px-4 py-2 rounded-xl border border-[var(--app-border-soft)] text-[var(--app-text-secondary)] hover:bg-[var(--app-surface-muted)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled=${submitting}
              className="flex-1 px-4 py-2 rounded-xl bg-[var(--app-accent)] text-white font-semibold hover:bg-[var(--app-accent-hover)] disabled:opacity-50"
            >
              ${submitting ? 'Scheduling...' : 'Schedule'}
            </button>
          </div>
        </form>
    <//>
  `;
};

export default ScheduleInterviewModal;
