import React, { useState } from 'react';
import htm from 'htm';
import { scheduleInterview } from '/core/frontend/src/modules/shared/services/api.js';
import { useToast } from '/core/frontend/src/modules/shared/index.js';
import { Button, Input, Modal } from '/core/frontend/src/modules/shared/primitives/index.js';

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
            <${Input}
              label="Date"
              type="date"
              value=${startDate}
              onChange=${(e) => setStartDate(e.target.value)}
              min=${today}
              required
              className="bg-[var(--app-surface-muted)]"
            />
          </div>
          <div>
            <${Input}
              label="Time"
              type="time"
              value=${startTime}
              onChange=${(e) => setStartTime(e.target.value)}
              required
              className="bg-[var(--app-surface-muted)]"
            />
          </div>
          <div>
            <${Input}
              label="Duration (min)"
              type="number"
              min=${15}
              max=${120}
              step=${15}
              value=${duration}
              onChange=${(e) => setDuration(parseInt(e.target.value, 10) || 30)}
              className="bg-[var(--app-surface-muted)]"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <${Button}
              type="button"
              onClick=${onClose}
              variant="secondary"
              className="flex-1"
            >
              Cancel
            <//>
            <${Button}
              type="submit"
              disabled=${submitting}
              className="flex-1"
            >
              ${submitting ? 'Scheduling...' : 'Schedule'}
            <//>
          </div>
        </form>
    <//>
  `;
};

export default ScheduleInterviewModal;
