import React, { useState, useEffect } from 'react';
import htm from 'htm';
import { getWorkflows, generateAIShortlist, createShortlist } from '/core/frontend/src/modules/shared/services/api.js';
import { useToast, SkeletonLoader, EmptyState } from '/core/frontend/src/modules/shared/index.js';

const html = htm.bind(React.createElement);

const AIShortlistView = ({ user }) => {
  const toast = useToast();
  const [workflows, setWorkflows] = useState([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [maxCandidates, setMaxCandidates] = useState(5);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [confirming, setConfirming] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getWorkflows({ company_id: user?.company_id });
        setWorkflows(data);
        if (data.length > 0 && !selectedWorkflow) setSelectedWorkflow(data[0]);
      } catch (e) {
        console.error(e);
        toast.error('Failed to load workflows');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [user?.company_id]);

  const jobId = selectedWorkflow?.job_id;

  const handleGenerate = async () => {
    if (!selectedWorkflow || !jobId || !prompt.trim()) {
      toast.error('Select a workflow with a job and enter a prompt');
      return;
    }
    try {
      setGenerating(true);
      setCandidates([]);
      const res = await generateAIShortlist({
        workflow_id: selectedWorkflow.id,
        job_id: jobId,
        prompt: prompt.trim(),
        max_candidates: maxCandidates,
      });
      setCandidates(res.candidates || []);
      if (!(res.candidates?.length)) toast.info('No candidates matched the criteria');
    } catch (e) {
      toast.error(e?.message || 'AI shortlist failed');
    } finally {
      setGenerating(false);
    }
  };

  const handleConfirmShortlist = async (candidateId) => {
    if (!jobId) return;
    try {
      setConfirming(candidateId);
      await createShortlist({ candidate_id: candidateId, job_id: jobId });
      toast.success('Added to shortlist');
      setCandidates((prev) => prev.filter((c) => c.candidate_id !== candidateId));
    } catch (e) {
      toast.error(e?.message || 'Failed to add to shortlist');
    } finally {
      setConfirming(null);
    }
  };

  if (loading) {
    return html`<div className="p-8" aria-busy="true"><${SkeletonLoader} lines=${5} title=${true} /></div>`;
  }

  if (workflows.length === 0) {
    return html`<${EmptyState} title="No workflows" message="No placement cycles assigned. Complete a workflow first." />`;
  }

  return html`
    <div className="p-8 space-y-6 animate-in">
      <div className="flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs font-semibold text-[var(--app-text-muted)] uppercase mb-1">Workflow</label>
          <select
            value=${selectedWorkflow?.id || ''}
            onChange=${(e) => {
              const w = workflows.find((x) => x.id === e.target.value);
              setSelectedWorkflow(w);
            }}
            className="px-4 py-2 rounded-xl border border-[var(--app-border-soft)] bg-[var(--app-surface)] text-sm"
          >
            ${workflows.map((w) => html`<option key=${w.id} value=${w.id}>${w.name}</option>`)}
          </select>
        </div>
        ${!jobId && selectedWorkflow && html`
          <p className="text-sm text-amber-600">Submit JD for this workflow first to use AI shortlist.</p>
        `}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-semibold text-[var(--app-text-muted)] uppercase mb-1">Prompt</label>
          <input
            type="text"
            placeholder="e.g. Top 5 with consulting background"
            value=${prompt}
            onInput=${(e) => setPrompt(e.target.value)}
            className="w-full px-4 py-2 rounded-xl border border-[var(--app-border-soft)] bg-[var(--app-surface)] text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[var(--app-text-muted)] uppercase mb-1">Max</label>
          <input
            type="number"
            min=${1}
            max=${20}
            value=${maxCandidates}
            onChange=${(e) => setMaxCandidates(parseInt(e.target.value, 10) || 5)}
            className="w-16 px-3 py-2 rounded-xl border border-[var(--app-border-soft)] bg-[var(--app-surface)] text-sm"
          />
        </div>
        <button
          onClick=${handleGenerate}
          disabled=${generating || !prompt.trim() || !jobId}
          className="px-6 py-2.5 bg-[var(--app-accent)] text-white rounded-xl text-sm font-semibold hover:bg-[var(--app-accent-hover)] disabled:opacity-50"
        >
          ${generating ? 'Generating...' : 'Generate shortlist'}
        </button>
      </div>

      ${candidates.length > 0 && html`
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-[var(--app-text-primary)] mb-4">Suggested candidates</h3>
          <div className="space-y-3">
            ${candidates.map((c) => html`
              <div
                key=${c.candidate_id}
                className="p-4 bg-[var(--app-surface)] rounded-xl border border-[var(--app-border-soft)] flex items-center justify-between"
              >
                <div>
                  <p className="font-semibold text-[var(--app-text-primary)]">${c.candidate_name}</p>
                  <p className="text-sm text-[var(--app-text-secondary)]">${c.reasoning}</p>
                  <span className="text-xs text-[var(--app-accent)]">Score: ${(c.score * 100).toFixed(0)}%</span>
                </div>
                <button
                  onClick=${() => handleConfirmShortlist(c.candidate_id)}
                  disabled=${confirming === c.candidate_id}
                  className="px-4 py-2 bg-[var(--app-success)]/20 text-[var(--app-success)] rounded-lg text-sm font-semibold hover:bg-[var(--app-success)]/30 disabled:opacity-50"
                >
                  ${confirming === c.candidate_id ? 'Adding...' : 'Add to shortlist'}
                </button>
              </div>
            `)}
          </div>
        </div>
      `}
    </div>
  `;
};

export default AIShortlistView;
