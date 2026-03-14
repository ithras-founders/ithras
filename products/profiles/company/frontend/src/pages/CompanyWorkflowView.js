import React, { useState, useEffect } from 'react';
import htm from 'htm';
import { getWorkflows, getWorkflowStages, getApplications, getJDSubmission, createJDSubmission, createShortlist, createOffer, getOffers, getApiBaseUrl } from '/core/frontend/src/modules/shared/services/api.js';
import { useToast, SkeletonLoader, EmptyState, ApiError } from '/core/frontend/src/modules/shared/index.js';
import JDSubmissionForm from '../components/JDSubmissionForm.js';
import StudentProgressionSelector from '../components/StudentProgressionSelector.js';
import CVDownloadButton from '../components/CVDownloadButton.js';

const html = htm.bind(React.createElement);

const CompanyWorkflowView = ({ user, navigate, onScheduleInterview }) => {
  const toast = useToast();
  const [workflows, setWorkflows] = useState([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [stages, setStages] = useState([]);
  const [applications, setApplications] = useState([]);
  const [jdSubmission, setJdSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showJDForm, setShowJDForm] = useState(false);
  const [currentStage, setCurrentStage] = useState(null);
  const [shortlisting, setShortlisting] = useState(null);
  const [offering, setOffering] = useState(null);
  const [companyOffers, setCompanyOffers] = useState([]);
  const [applicationsTotal, setApplicationsTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const APPLICATIONS_PAGE_SIZE = 20;

  useEffect(() => {
    fetchWorkflows();
  }, [user?.company_id]);

  useEffect(() => {
    if (selectedWorkflow) {
      fetchWorkflowDetails();
    }
  }, [selectedWorkflow]);

  const fetchWorkflows = async () => {
    try {
      setLoading(true);
      setFetchError(null);
      const data = await getWorkflows({ company_id: user.company_id });
      setWorkflows(data);
      if (data.length > 0 && !selectedWorkflow) {
        setSelectedWorkflow(data[0]);
      }
    } catch (error) {
      console.error('Failed to fetch workflows:', error);
      setFetchError(error?.message || 'Failed to load workflows');
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkflowDetails = async (append = false) => {
    if (!selectedWorkflow) return;
    
    try {
      const offset = append ? applications.length : 0;
      const [stagesData, applicationsRes, offersData] = await Promise.all([
        getWorkflowStages(selectedWorkflow.id),
        getApplications({
          workflow_id: selectedWorkflow.id,
          limit: APPLICATIONS_PAGE_SIZE,
          offset,
        }),
        user?.company_id ? getOffers({ company_id: user.company_id }).catch(() => []) : Promise.resolve([])
      ]);
      setStages(stagesData);
      const items = applicationsRes?.items ?? applicationsRes ?? [];
      const total = applicationsRes?.total ?? items.length;
      setApplications((prev) => (append ? [...prev, ...items] : items));
      setApplicationsTotal(total);
      setCompanyOffers(offersData || []);
      
      // Check for JD submission
      // Note: This would need a new endpoint or we check via workflow
      setShowJDForm(selectedWorkflow.status === 'DRAFT');
    } catch (error) {
      console.error('Failed to fetch workflow details:', error);
      toast.error(error?.message || 'Failed to load workflow details');
    } finally {
      setLoadingMore(false);
    }
  };

  const loadMoreApplications = () => {
    setLoadingMore(true);
    fetchWorkflowDetails(true);
  };

  const handleJDSubmit = async (jdData) => {
    try {
      await createJDSubmission({
        ...jdData,
        workflow_id: selectedWorkflow.id,
        company_id: user.company_id
      });
      setShowJDForm(false);
      fetchWorkflows();
      toast.success('JD submitted for approval');
    } catch (error) {
      toast.error('Failed to submit JD: ' + (error.message || 'Unknown error'));
    }
  };

  const handleAddToShortlist = async (app) => {
    if (!app.job_id) {
      toast.error('Application has no associated job');
      return;
    }
    try {
      setShortlisting(app.id);
      await createShortlist({ candidate_id: app.student_id, job_id: app.job_id });
      toast.success('Candidate added to shortlist');
      fetchWorkflowDetails();
    } catch (error) {
      toast.error(error.message || 'Failed to add to shortlist');
    } finally {
      setShortlisting(null);
    }
  };

  const handleCreateOffer = async (app) => {
    if (!app.job_id || !user?.company_id) {
      toast.error('Application or company missing');
      return;
    }
    try {
      setOffering(app.id);
      await createOffer({
        application_id: app.id,
        candidate_id: app.student_id,
        company_id: user.company_id,
        job_id: app.job_id,
      });
      toast.success('Offer created');
      fetchWorkflowDetails();
    } catch (error) {
      toast.error(error.message || 'Failed to create offer');
    } finally {
      setOffering(null);
    }
  };

  if (loading) {
    return html`<div className="p-8" aria-busy="true" aria-label="Loading workflows"><${SkeletonLoader} lines=${5} title=${true} /></div>`;
  }

  if (fetchError) {
    return html`<div className="p-6"><${ApiError} message=${fetchError} onRetry=${() => { setFetchError(null); fetchWorkflows(); }} /></div>`;
  }

  if (workflows.length === 0) {
    return html`<${EmptyState} title="No workflows" message="No placement cycles assigned to your company yet." />`;
  }

  return html`
    <div className="space-y-8 animate-in pb-20">
      ${workflows.length > 1 && html`
        <div className="flex gap-3 flex-wrap">
          ${workflows.map(workflow => html`
            <button
              key=${workflow.id}
              onClick=${() => setSelectedWorkflow(workflow)}
              className=${`px-6 py-3 rounded-xl text-sm font-semibold transition-colors ${
                selectedWorkflow?.id === workflow.id
                  ? 'bg-[var(--app-accent)] text-white'
                  : 'bg-[var(--app-surface)] border border-[var(--app-border-soft)] text-[var(--app-text-secondary)] hover:bg-[var(--app-surface-muted)]'
              }`}
            >
              ${workflow.name}
            </button>
          `)}
        </div>
      `}

      ${selectedWorkflow && html`
        <div className="space-y-6">
          <div className="bg-[var(--app-surface)] p-8 rounded-[var(--app-radius-lg)] border border-[var(--app-border-soft)] shadow-[var(--app-shadow-subtle)]" data-tour-id="workflow-pipeline">
            <div className="flex items-center justify-between mb-6" data-tour-id="workflow-detail-header">
              <div>
                <h3 className="text-2xl font-semibold text-[var(--app-text-primary)]">${selectedWorkflow.name}</h3>
                <p className="text-sm text-[var(--app-text-secondary)] mt-1">${selectedWorkflow.description || 'No description'}</p>
              </div>
              <span className=${`px-4 py-2 rounded-xl text-[10px] font-semibold uppercase ${
                selectedWorkflow.status === 'ACTIVE' ? 'bg-[rgba(52,199,89,0.12)] text-[var(--app-success)]' :
                selectedWorkflow.status === 'COMPLETED' ? 'bg-[var(--app-surface-muted)] text-[var(--app-text-secondary)]' :
                selectedWorkflow.status === 'DRAFT' ? 'bg-[var(--app-surface-muted)] text-[var(--app-text-secondary)]' :
                'bg-[var(--app-accent-soft)] text-[var(--app-accent)]'
              }`}>
                ${selectedWorkflow.status}
              </span>
            </div>

            ${selectedWorkflow.status === 'DRAFT' && !jdSubmission && html`
              <div className="p-6 bg-[var(--app-accent-soft)] border border-[rgba(0,113,227,0.2)] rounded-2xl mb-6">
                <p className="text-sm font-bold text-[var(--app-text-primary)] mb-4">
                  Placement team has created a placement cycle for your company. Please submit JD and compensation details.
                </p>
                <button
                  onClick=${() => setShowJDForm(true)}
                  className="px-6 py-3 bg-[var(--app-accent)] text-white rounded-xl text-sm font-semibold uppercase tracking-widest hover:bg-[var(--app-accent-hover)]"
                >
                  Submit JD Form
                </button>
              </div>
            `}

            ${(selectedWorkflow.status === 'ACTIVE' || selectedWorkflow.status === 'COMPLETED') && html`
              <div className="space-y-6">
                ${selectedWorkflow.status === 'COMPLETED' && html`
                  <div className="p-4 bg-[var(--app-surface-muted)] border border-[var(--app-border-soft)] rounded-xl mb-4">
                    <p className="text-sm font-bold text-[var(--app-text-secondary)]">Applications closed. View and download CVs below.</p>
                  </div>
                `}
                <div>
                  <h4 className="text-lg font-semibold text-[var(--app-text-primary)] mb-4">Applications (${applications.length})</h4>
                  <div className="flex gap-3 mb-4">
                    <${CVDownloadButton} workflowId=${selectedWorkflow.id} />
                  </div>
                  <div className="space-y-2">
                    ${applications.map(app => html`
                      <div key=${app.id} className="p-4 bg-[var(--app-surface-muted)] rounded-xl flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-[var(--app-text-primary)]">Application ${app.id.slice(-8)}</p>
                          <p className="text-xs text-[var(--app-text-secondary)]">Status: ${app.status}</p>
                          ${app.student_id && navigate && html`
                            <button onClick=${() => navigate('candidate/' + app.student_id)} className="text-[10px] font-semibold text-[var(--app-accent)] hover:underline mt-1">
                              View profile →
                            </button>
                          `}
                        </div>
                        <div className="flex gap-2 items-center">
                          ${app.job_id && selectedWorkflow.status === 'ACTIVE' && !companyOffers.some(o => o.application_id === app.id && o.status === 'PENDING') && html`
                            <button
                              data-tour-id="add-to-shortlist-btn"
                              onClick=${() => handleAddToShortlist(app)}
                              disabled=${shortlisting === app.id}
                              aria-label=${`Add ${app.student_id?.slice(-8) || 'candidate'} to shortlist`}
                              className="px-4 py-2 bg-[var(--app-success)]/20 text-[var(--app-success)] rounded-lg text-[10px] font-semibold uppercase hover:bg-[var(--app-success)]/30 disabled:opacity-50"
                            >
                              ${shortlisting === app.id ? 'Adding...' : 'Add to shortlist'}
                            </button>
                          `}
                          ${app.job_id && selectedWorkflow.status === 'ACTIVE' && !companyOffers.some(o => o.application_id === app.id) && html`
                            <button
                              data-tour-id="create-offer-btn"
                              onClick=${() => handleCreateOffer(app)}
                              disabled=${offering === app.id}
                              aria-label=${`Create offer for ${app.student_id?.slice(-8) || 'candidate'}`}
                              className="px-4 py-2 bg-amber-500/20 text-amber-600 rounded-lg text-[10px] font-semibold uppercase hover:bg-amber-500/30 disabled:opacity-50"
                            >
                              ${offering === app.id ? 'Creating...' : 'Create offer'}
                            </button>
                          `}
                          ${onScheduleInterview && app.job_id && selectedWorkflow.status === 'ACTIVE' && html`
                            <button
                              onClick=${() => onScheduleInterview(app, selectedWorkflow)}
                              className="px-4 py-2 bg-violet-500/20 text-violet-600 rounded-lg text-[10px] font-semibold uppercase hover:bg-violet-500/30"
                            >
                              Schedule interview
                            </button>
                          `}
                          <a
                            href=${`${getApiBaseUrl()}/v1/applications/${app.id}/cv`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-[var(--app-accent-soft)] text-[var(--app-accent)] rounded-lg text-[10px] font-semibold uppercase hover:bg-[var(--app-accent-soft)]"
                          >
                            Download PDF
                          </a>
                        </div>
                      </div>
                    `)}
                  </div>
                  ${applicationsTotal > applications.length && html`
                    <button
                      onClick=${loadMoreApplications}
                      disabled=${loadingMore}
                      className="mt-4 px-4 py-2 text-sm font-medium text-[var(--app-accent)] hover:underline disabled:opacity-50"
                    >
                      ${loadingMore ? 'Loading...' : `Load more (${applications.length} of ${applicationsTotal})`}
                    </button>
                  `}
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-[var(--app-text-primary)] mb-4">Stages</h4>
                  <div className="space-y-4">
                    ${stages.map((stage, idx) => {
                      const stageApplications = applications.filter(a => a.current_stage_id === stage.id);
                      return html`
                        <div key=${stage.id} className="p-6 bg-[var(--app-surface-muted)] rounded-2xl">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h5 className="text-sm font-semibold text-[var(--app-text-primary)]">${stage.stage_number}. ${stage.name}</h5>
                              <p className="text-xs text-[var(--app-text-secondary)]">${stage.stage_type}</p>
                            </div>
                            <span className="text-xs font-bold text-[var(--app-text-secondary)]">${stageApplications.length} students</span>
                          </div>
                          ${stageApplications.length > 0 && idx < stages.length - 1 && selectedWorkflow.status === 'ACTIVE' && html`
                            <${StudentProgressionSelector}
                              workflowId=${selectedWorkflow.id}
                              stageId=${stage.id}
                              studentIds=${stageApplications.map(a => a.student_id)}
                              requestedBy=${user.id}
                            />
                          `}
                        </div>
                      `;
                    })}
                  </div>
                </div>
              </div>
            `}
          </div>
        </div>
      `}

      ${showJDForm && html`
        <${JDSubmissionForm}
          workflowId=${selectedWorkflow.id}
          onClose=${() => setShowJDForm(false)}
          onSubmit=${handleJDSubmit}
        />
      `}
    </div>
  `;
};

export default CompanyWorkflowView;
