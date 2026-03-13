import React, { useState, useEffect, useCallback } from 'react';
import htm from 'htm';
import { getTestSuites, getTestRuns, getTestRun, runTests, getTestEnvironment } from '/core/frontend/src/modules/shared/services/api.js';
import { useToast } from '/core/frontend/src/modules/shared/index.js';
import SkeletonLoader from '/core/frontend/src/modules/shared/components/SkeletonLoader.js';
import { PageWrapper, PageHeader, SectionCard, Button, StatusBadge } from '/core/frontend/src/modules/shared/primitives/index.js';

const html = htm.bind(React.createElement);

const SUITE_DESCRIPTIONS = {
  backend: 'Pytest: auth, cycles, workflows, offers, shortlists, applications, JD submissions, governance, bulk ops.',
  simulator: 'Scenario runner: application flow, JD submission, governance, offers, cycle management.',
  frontend: 'Vitest: core frontend components and modules.',
  e2e: 'Playwright: end-to-end flows (placement, governance, auth, recruitment-cycles, applications, offers).',
};

const TestingPortal = () => {
  const toast = useToast();
  const [suites, setSuites] = useState([]);
  const [env, setEnv] = useState(null);
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(null);
  const [selectedRun, setSelectedRun] = useState(null);
  const [runDetail, setRunDetail] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [suitesData, runsData, envData] = await Promise.all([
        getTestSuites(),
        getTestRuns(30),
        getTestEnvironment().catch(() => null),
      ]);
      setSuites(Array.isArray(suitesData) ? suitesData : []);
      setRuns(Array.isArray(runsData) ? runsData : []);
      setEnv(envData);
    } catch (err) {
      setSuites([]);
      setRuns([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (!selectedRun) { setRunDetail(null); return; }
    getTestRun(selectedRun)
      .then(setRunDetail)
      .catch(() => setRunDetail(null));
  }, [selectedRun]);

  const handleRun = async (suiteId) => {
    try {
      setRunning(suiteId);
      const result = await runTests(suiteId);
      toast.success(`Tests ${result.status === 'passed' ? 'passed' : 'failed'}`);
      setRuns(prev => [result, ...prev]);
      setSelectedRun(result.id);
      setRunDetail(result);
    } catch (err) {
      toast.error(err.message || 'Failed to run tests');
    } finally {
      setRunning(null);
    }
  };

  const statusBadge = (status) => {
    const variant = status === 'passed' ? 'success' : status === 'failed' ? 'danger' : 'default';
    return html`<${StatusBadge} variant=${variant}>${status}</${StatusBadge}>`;
  };

  const businessSuites = suites.filter(s => s.category === 'business');
  const technologySuites = suites.filter(s => s.category === 'technology');
  const nodeRequired = env && !env.node_available;
  const npxRequired = env && !env.npx_available;
  const suiteCard = (s) => {
    const needsNode = s.id === 'frontend';
    const needsNpx = s.id === 'e2e';
    const disabled = (needsNode && nodeRequired) || (needsNpx && npxRequired);
    return html`
      <${SectionCard} key=${s.id} title=${s.label} className="p-6">
        <p className="text-sm text-[var(--app-text-secondary)] mb-4">${SUITE_DESCRIPTIONS[s.id] || s.command}</p>
        ${s.last_status ? html`<p className="text-xs text-[var(--app-text-muted)] mb-2">Last: ${s.last_status} ${s.last_at ? html`<span className="opacity-75">(${new Date(s.last_at).toLocaleString()})</span>` : ''}</p>` : null}
        <${Button}
          variant="primary"
          size="sm"
          onClick=${() => !disabled && handleRun(s.id)}
          disabled=${running !== null || disabled}
        >
          ${running === s.id ? 'Running...' : disabled ? (needsNpx ? 'npx required' : 'Node.js required') : 'Run tests'}
        <//>
      <//>
    `;
  };

  return html`
    <${PageWrapper} className="w-full pb-20">
      <${PageHeader}
        title="Testing"
        subtitle="Run test suites covering business logic (API, workflows, offers) and technology (frontend, E2E)."
        actions=${html`
          <${Button} variant="secondary" size="sm" onClick=${fetchData} disabled=${loading}>
            ${loading ? 'Refreshing...' : 'Refresh'}
          <//>
        `}
      />

      ${nodeRequired ? html`
        <div className="p-4 bg-[var(--app-warning-soft)] border border-[rgba(245,158,11,0.2)] rounded-[var(--app-radius-md)] text-sm text-[var(--app-text-secondary)]">
          Frontend and E2E tests require Node.js. Backend tests can run without Node.
        </div>
      ` : null}

      <div className="space-y-6">
        ${loading && suites.length === 0 ? html`<${SkeletonLoader} variant="cards" lines=${6} />` : html`
          ${businessSuites.length > 0 ? html`
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                ${businessSuites.map(s => suiteCard(s))}
              </div>
            </div>
          ` : null}
          ${technologySuites.length > 0 ? html`
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                ${technologySuites.map(s => suiteCard(s))}
              </div>
            </div>
          ` : null}
        `}
      </div>

      <${SectionCard} title="Recent runs" className="p-6">
        ${loading ? html`<${SkeletonLoader} variant="lines" lines=${5} />` : html`
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--app-border-soft)]">
                  <th className="text-left py-2 font-semibold text-[var(--app-text-muted)]">ID</th>
                  <th className="text-left py-2 font-semibold text-[var(--app-text-muted)]">Suite</th>
                  <th className="text-left py-2 font-semibold text-[var(--app-text-muted)]">Status</th>
                  <th className="text-left py-2 font-semibold text-[var(--app-text-muted)]">Passed</th>
                  <th className="text-left py-2 font-semibold text-[var(--app-text-muted)]">Failed</th>
                  <th className="text-left py-2 font-semibold text-[var(--app-text-muted)]">Duration</th>
                </tr>
              </thead>
              <tbody>
                ${runs.length === 0 ? html`
                  <tr><td colSpan="6" className="py-4 text-[var(--app-text-muted)] text-center">No runs yet. Run a suite above.</td></tr>
                ` : runs.map(r => html`
                  <tr
                    key=${r.id}
                    onClick=${() => setSelectedRun(r.id)}
                    className=${`border-b border-[var(--app-border-soft)] cursor-pointer hover:bg-[var(--app-surface-muted)] ${selectedRun === r.id ? 'bg-[var(--app-surface-muted)]' : ''}`}
                  >
                    <td className="py-2 font-mono text-xs">${r.id}</td>
                    <td className="py-2">${r.suite}</td>
                    <td className="py-2">${statusBadge(r.status)}</td>
                    <td className="py-2">${r.passed ?? '—'}</td>
                    <td className="py-2">${r.failed ?? '—'}</td>
                    <td className="py-2">${r.duration_seconds != null ? `${r.duration_seconds}s` : '—'}</td>
                  </tr>
                `)}
              </tbody>
            </table>
          </div>
        `}
      <//>

      ${runDetail && runDetail.output ? html`
        <${SectionCard} title=${`Output (run ${runDetail.id})`} className="p-6">
          <h3 className="text-sm font-semibold text-[var(--app-text-primary)] mb-3">Output (run ${runDetail.id})</h3>
          <pre className="p-4 bg-[var(--app-surface-muted)] rounded-[var(--app-radius-md)] text-xs font-mono overflow-x-auto overflow-y-auto max-h-96 whitespace-pre-wrap break-words">${runDetail.output}</pre>
        <//>
      ` : null}
    <//>
  `;
};

export default TestingPortal;
