import React, { useState, useEffect } from 'react';
import htm from 'htm';
import { UserRole } from '/core/frontend/src/modules/shared/types.js';
import { Layout } from '/core/frontend/src/modules/shared/index.js';
import { CandidatePortal } from './modules/candidate/index.js';
import { RecruiterPortal } from './modules/recruiter/index.js';
import { AdminPortal, ApprovalQueue } from './modules/governance/index.js';
import { ApplicationSubmission } from './modules/candidate/index.js';
import { CompanyWorkflowView } from './modules/recruiter/index.js';

const html = htm.bind(React.createElement);

const App = () => {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('dashboard');

  useEffect(() => {
    const savedUser = localStorage.getItem('ithras_session');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('ithras_session');
  };

  if (!user) {
    return html`<div className="p-20 text-center">Please log in through core frontend</div>`;
  }

  const isGovernanceUser = [UserRole.FACULTY_OBSERVER, UserRole.PLACEMENT_TEAM, UserRole.PLACEMENT_ADMIN].includes(user.role);

  return html`
    <${Layout} user=${user} onLogout=${handleLogout} activeView=${view} setView=${setView}>
      ${user.role === UserRole.CANDIDATE ? html`
        ${['dashboard', 'active_processes', 'intelligence'].includes(view) ? html`
          <${CandidatePortal} user=${user} activeSubView=${view} setView=${setView} />
        ` : view === 'applications' ? html`
          <${ApplicationSubmission} user=${user} />
        ` : html`<div className="p-20 text-center font-semibold text-[var(--app-text-muted)] text-3xl italic">Engagement Registry Node Initializing...</div>`}
      ` : user.role === UserRole.RECRUITER ? html`
        ${view === 'workflows' ? html`
          <${CompanyWorkflowView} user=${user} />
        ` : html`
          <${RecruiterPortal} user=${user} activeView=${view} />
        `}
      ` : isGovernanceUser ? html`
        ${view === 'approval-queue' ? html`
          <${ApprovalQueue} user=${user} />
        ` : html`
          <${AdminPortal} user=${user} activeView=${view} />
        `}
      ` : html`<div className="p-20 text-center animate-in">Node Access Restricted.</div>`}
    <//>
  `;
};

export default App;
