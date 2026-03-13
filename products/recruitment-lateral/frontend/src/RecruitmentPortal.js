import React, { useState } from 'react';
import htm from 'htm';
import { CompanyWorkflowView, RecruiterPortal } from '/products/profiles/company/frontend/src/index.js';
import AIShortlistView from './AIShortlistView.js';
import ScheduleInterviewModal from './ScheduleInterviewModal.js';
import HRJobProfilesView from './HRJobProfilesView.js';
import HRDiscoveryView from './HRDiscoveryView.js';
import HROutreachInboxView from './HROutreachInboxView.js';

const html = htm.bind(React.createElement);

/**
 * Main recruiter/professional shell. Routes to:
 * - hr-job-profiles: HRJobProfilesView (recruiters only)
 * - hr-discovery: HRDiscoveryView (recruiters only)
 * - hr-outreach: HROutreachInboxView (recruiters: sent; professionals/candidates: received)
 * - workflows: CompanyWorkflowView (placement cycles)
 * - ai-shortlist: AIShortlistView
 * - dashboard, jobs, applications, institutions, request-approvals: RecruiterPortal
 */
const RecruitmentPortal = ({ user, activeView, navigate }) => {
  const [scheduleModal, setScheduleModal] = useState(null);

  if (activeView === 'hr-job-profiles') {
    return html`<${HRJobProfilesView} user=${user} />`;
  }
  if (activeView === 'hr-discovery') {
    return html`<${HRDiscoveryView} user=${user} navigate=${navigate} />`;
  }
  if (activeView === 'hr-outreach') {
    return html`<${HROutreachInboxView} user=${user} />`;
  }
  if (activeView === 'workflows') {
    return html`
      <div>
        <${CompanyWorkflowView}
          user=${user}
          navigate=${navigate}
          onScheduleInterview=${(app, workflow) => setScheduleModal({ app, workflow })}
        />
        ${scheduleModal && html`
          <${ScheduleInterviewModal}
            application=${scheduleModal.app}
            workflow=${scheduleModal.workflow}
            user=${user}
            onClose=${() => setScheduleModal(null)}
            onSuccess=${() => setScheduleModal(null)}
          />
        `}
      </div>
    `;
  }
  if (activeView === 'ai-shortlist') {
    return html`<${AIShortlistView} user=${user} />`;
  }
  return html`<${RecruiterPortal} user=${user} activeView=${activeView} />`;
};

export default RecruitmentPortal;
