import React, { useState, useEffect } from 'react';
import htm from 'htm';
import { getWorkflows, getApplications, createApplication, getCVs } from '/core/frontend/src/modules/shared/services/api.js';
import { useToast, SkeletonLoader } from '/core/frontend/src/modules/shared/index.js';
import { isDemoUser } from '/core/frontend/src/modules/shared/utils/demoUtils.js';
import { useTutorialContext } from '/core/frontend/src/modules/tutorials/index.js';
import { getTutorialMockData } from '/core/frontend/src/modules/tutorials/context/tutorialMockData.js';

const html = htm.bind(React.createElement);

const ApplicationSubmission = ({ user }) => {
  const toast = useToast();
  const { isTutorialMode, getTutorialData } = useTutorialContext();
  const [workflows, setWorkflows] = useState([]);
  const [myApplications, setMyApplications] = useState([]);
  const [cvs, setCvs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [selectedCV, setSelectedCV] = useState('');

  const useMock = isTutorialMode || isDemoUser(user);

  useEffect(() => {
    if (useMock) {
      const mock = getTutorialData('CANDIDATE') ?? getTutorialMockData('CANDIDATE');
      setWorkflows(mock.workflows || []);
      setMyApplications(mock.applications || []);
      setCvs(mock.cvs || []);
      setLoading(false);
      return;
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- getTutorialData omitted to prevent effect loops
  }, [user?.id, user?.institution_id, isTutorialMode]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [workflowsData, applicationsData, cvsData] = await Promise.all([
        getWorkflows({ institution_id: user.institution_id, status: 'ACTIVE' }),
        getApplications({ student_id: user.id }),
        getCVs({ candidate_id: user.id, status: 'VERIFIED' })
      ]);
      setWorkflows(workflowsData);
      setMyApplications(applicationsData);
      setCvs(cvsData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (workflowId) => {
    if (!selectedCV) {
      toast.error('Please select a CV');
      return;
    }

    if (useMock) {
      setMyApplications(prev => [...prev, { id: 'app-demo-' + Date.now(), workflow_id: workflowId, student_id: user.id, status: 'SUBMITTED', cv_id: selectedCV }]);
      toast.success('Application submitted successfully!');
      setSelectedWorkflow(null);
      setSelectedCV('');
      return;
    }

    try {
      await createApplication({
        student_id: user.id,
        workflow_id: workflowId,
        cv_id: selectedCV
      });
      toast.success('Application submitted successfully!');
      setSelectedWorkflow(null);
      setSelectedCV('');
      fetchData();
    } catch (error) {
      toast.error('Failed to submit application: ' + (error.message || 'Unknown error'));
    }
  };

  const getApplicationStatus = (workflowId) => {
    const app = myApplications.find(a => a.workflow_id === workflowId);
    return app ? app.status : null;
  };

  if (loading) {
    return html`<div className="p-6"><${SkeletonLoader} variant="listRows" lines=${5} /></div>`;
  }

  return html`
    <div className="space-y-8 animate-in pb-20">
      ${workflows.length === 0 ? html`
        <div className="space-y-4" data-tour-id="workflows-list">
          <div className="bg-[var(--app-surface)] p-12 rounded-[var(--app-radius-lg)] border border-[var(--app-border-soft)] shadow-[var(--app-shadow-subtle)] text-center">
            <p className="text-[var(--app-text-muted)] text-lg">${useMock ? 'Demo: No open placement cycles available.' : 'No open placement cycles available at the moment.'}</p>
          </div>
        </div>
      ` : html`
        <div className="space-y-4" data-tour-id="workflows-list">
          ${workflows.map(workflow => {
            const status = getApplicationStatus(workflow.id);
            const hasApplication = status !== null;
            
            return html`
              <div key=${workflow.id} className="bg-[var(--app-surface)] p-6 rounded-[var(--app-radius-md)] border border-[var(--app-border-soft)] shadow-[var(--app-shadow-subtle)]">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--app-text-primary)]">${workflow.name}</h3>
                    <p className="text-sm text-[var(--app-text-secondary)] mt-1">${workflow.description || 'No description'}</p>
                  </div>
                  ${hasApplication && html`
                    <span className=${`px-4 py-2 rounded-xl text-[10px] font-semibold uppercase ${
                      status === 'SUBMITTED' ? 'bg-[var(--app-accent-soft)] text-[var(--app-accent)]' :
                      status === 'SHORTLISTED' ? 'bg-[rgba(52,199,89,0.12)] text-[var(--app-success)]' :
                      status === 'REJECTED' ? 'bg-[rgba(255,59,48,0.12)] text-[var(--app-danger)]' :
                      'bg-[var(--app-surface-muted)] text-[var(--app-text-secondary)]'
                    }`}>
                      ${status}
                    </span>
                  `}
                </div>
                
                ${!hasApplication && html`
                  <div className="mt-4">
                    <label className="block text-xs font-semibold text-[var(--app-text-muted)] uppercase tracking-widest mb-2">Select CV</label>
                    ${cvs.length === 0 ? html`
                      <p className="text-sm text-[var(--app-text-secondary)] mb-4">No verified CVs available. Please create and verify a CV first.</p>
                    ` : html`
                      <select
                        value=${selectedCV}
                        onChange=${(e) => setSelectedCV(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-[var(--app-border-soft)] mb-4"
                      >
                        <option value="">Select a CV</option>
                        ${cvs.map(cv => html`
                          <option key=${cv.id} value=${cv.id}>
                            CV ${cv.id.slice(-8)} ${cv.template?.name ? `(${cv.template.name})` : ''}
                          </option>
                        `)}
                      </select>
                      <button
                        onClick=${() => handleSubmit(workflow.id)}
                        disabled=${!selectedCV}
                        className="px-6 py-3 bg-[var(--app-accent)] text-white rounded-xl text-sm font-semibold uppercase tracking-widest hover:bg-[var(--app-accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Submit Application
                      </button>
                    `}
                  </div>
                `}
              </div>
            `;
          })}
        </div>
      `}
    </div>
  `;
};

export default ApplicationSubmission;
