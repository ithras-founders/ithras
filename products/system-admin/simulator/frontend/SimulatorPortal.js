import React, { useState, useEffect, useCallback } from 'react';
import htm from 'htm';
import { generateSimulatorData, getSimulatorScenarios, runSimulatorScenario } from '/core/frontend/src/modules/shared/services/api/simulator.js';
import { useToast } from '/core/frontend/src/modules/shared/index.js';

const html = htm.bind(React.createElement);

const DEFAULTS = {
  num_colleges: 3,
  num_students_per_college: 10,
  num_companies: 3,
  num_recruiters_per_company: 1,
  num_placement_team_per_college: 1,
  num_cycles: 1,
  num_jobs_per_company: 2,
  max_applications_per_student: 3,
};

const SCENARIO_ICONS = {
  application_flow: '\u{1F4DD}',
  jd_submission_flow: '\u{1F4C4}',
  governance_flow: '\u{1F3DB}',
  offer_flow: '\u{1F4B0}',
  cycle_management_flow: '\u{1F504}',
};

const SCENARIO_SHOWCASE_VIEW = {
  application_flow: 'workflows',
  jd_submission_flow: 'workflows',
  governance_flow: 'approval-queue',
  offer_flow: 'applications',
  cycle_management_flow: 'recruitment_cycles',
};

const SimulatorPortal = ({ navigate }) => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('scenarios');

  // Quick Setup state
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [params, setParams] = useState(DEFAULTS);

  // Scenarios state
  const [scenarios, setScenarios] = useState([]);
  const [loadingScenarios, setLoadingScenarios] = useState(true);
  const [runningScenario, setRunningScenario] = useState(null);
  const [scenarioResults, setScenarioResults] = useState({});
  const [runningAll, setRunningAll] = useState(false);

  const fetchScenarios = useCallback(async () => {
    try {
      setLoadingScenarios(true);
      const data = await getSimulatorScenarios();
      setScenarios(Array.isArray(data) ? data : []);
    } catch (e) {
      setScenarios([]);
    } finally {
      setLoadingScenarios(false);
    }
  }, []);

  useEffect(() => { fetchScenarios(); }, [fetchScenarios]);

  // -- Quick Setup handlers -------------------------------------------------

  const handleChange = (key) => (e) => {
    const v = parseInt(e.target.value, 10);
    setParams((p) => ({ ...p, [key]: isNaN(v) ? DEFAULTS[key] : v }));
  };

  const handleGenerate = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await generateSimulatorData(params);
      setResult(res);
      toast.success('Simulator data generated successfully');
    } catch (e) {
      const msg = e?.message || e?.detail || JSON.stringify(e);
      toast.error(`Generate failed: ${msg}`);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCredentials = () => {
    if (!result?.users?.length) return;
    const lines = result.users.map((u) => `${u.email} / password`).join('\n');
    navigator.clipboard?.writeText(lines).then(
      () => toast.success('Login credentials copied to clipboard'),
      () => toast.error('Could not copy to clipboard')
    );
  };

  // -- Scenario handlers ----------------------------------------------------

  const runScenario = async (scenarioId) => {
    setRunningScenario(scenarioId);
    setScenarioResults((prev) => ({ ...prev, [scenarioId]: { status: 'running', steps: [] } }));
    try {
      const res = await runSimulatorScenario(scenarioId);
      setScenarioResults((prev) => ({ ...prev, [scenarioId]: res }));
      toast.success(`${scenarioId}: ${res.status}`);
      if (res.status === 'completed' && navigate) {
        const showcaseView = SCENARIO_SHOWCASE_VIEW[scenarioId];
        if (showcaseView) {
          toast.success('Scenario complete. Opening recruitment portal...');
          setTimeout(() => navigate(showcaseView), 300);
        }
      }
    } catch (e) {
      setScenarioResults((prev) => ({
        ...prev,
        [scenarioId]: { status: 'failed', steps: [], error: e?.message || String(e) },
      }));
      toast.error(`Scenario failed: ${e?.message || String(e)}`);
    } finally {
      setRunningScenario(null);
    }
  };

  const runAllScenarios = async () => {
    setRunningAll(true);
    for (const s of scenarios) {
      await runScenario(s.id);
    }
    setRunningAll(false);
    toast.success('All scenarios completed');
  };

  // -- Render helpers -------------------------------------------------------

  const stepStatusIcon = (status) => {
    if (status === 'passed') return html`<span className="text-[var(--app-success)] font-bold">\u2713</span>`;
    if (status === 'failed') return html`<span className="text-[var(--app-danger)] font-bold">\u2717</span>`;
    if (status === 'skipped') return html`<span className="text-[var(--app-text-muted)]">\u2014</span>`;
    return html`<span className="text-[var(--app-text-muted)] animate-pulse">\u25CB</span>`;
  };

  const tabClasses = (tab) =>
    `px-4 py-2.5 text-sm font-semibold rounded-t-lg border-b-2 transition-colors cursor-pointer ${
      activeTab === tab
        ? 'border-[var(--app-accent)] text-[var(--app-accent)] bg-[var(--app-surface)]'
        : 'border-transparent text-[var(--app-text-muted)] hover:text-[var(--app-text-primary)]'
    }`;

  // -- Scenarios tab --------------------------------------------------------

  const renderScenarios = () => {
    if (loadingScenarios) {
      return html`<div className="text-center py-12 text-[var(--app-text-muted)]">Loading scenarios...</div>`;
    }
    if (!scenarios.length) {
      return html`<div className="text-center py-12 text-[var(--app-text-muted)]">No scenarios available.</div>`;
    }

    return html`
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-[var(--app-text-secondary)]">
            Select a scenario to simulate a complete business flow against the database.
          </p>
          <button
            onClick=${runAllScenarios}
            disabled=${runningAll || runningScenario !== null}
            className="px-4 py-2 bg-[var(--app-accent)] text-white rounded-xl text-sm font-bold hover:bg-[var(--app-accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ${runningAll ? 'Running all...' : 'Run all scenarios'}
          </button>
        </div>

        ${scenarios.map((s) => {
          const res = scenarioResults[s.id];
          const isRunning = runningScenario === s.id;
          return html`
            <div key=${s.id} className="bg-[var(--app-surface)] border border-[var(--app-border-soft)] rounded-[var(--app-radius-lg)] p-5 shadow-[var(--app-shadow-subtle)]">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">${SCENARIO_ICONS[s.id] || '\u{1F9EA}'}</span>
                    <h3 className="text-base font-semibold text-[var(--app-text-primary)]">${s.label}</h3>
                    ${res?.status ? html`
                      <span className=${`text-xs font-bold px-2 py-0.5 rounded ${
                        res.status === 'completed' ? 'bg-[rgba(16,185,129,0.15)] text-[var(--app-success)]'
                        : res.status === 'running' ? 'bg-[var(--app-surface-muted)] text-[var(--app-accent)]'
                        : 'bg-[rgba(239,68,68,0.15)] text-[var(--app-danger)]'
                      }`}>${res.status}</span>
                    ` : null}
                  </div>
                  <p className="text-sm text-[var(--app-text-secondary)] mb-3">${s.description}</p>
                </div>
                <button
                  onClick=${() => runScenario(s.id)}
                  disabled=${isRunning || runningAll}
                  className="shrink-0 px-4 py-2 bg-[var(--app-accent)] text-white rounded-xl text-sm font-bold hover:bg-[var(--app-accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ${isRunning ? 'Running...' : 'Run'}
                </button>
              </div>

              ${res?.steps?.length ? html`
                <div className="mt-3 border-t border-[var(--app-border-soft)] pt-3">
                  <div className="grid gap-1">
                    ${res.steps.map((step, i) => html`
                      <div key=${i} className="flex items-center gap-2 text-sm py-1">
                        <span className="w-5 text-center">${stepStatusIcon(step.status)}</span>
                        <span className=${`flex-1 ${step.status === 'skipped' ? 'text-[var(--app-text-muted)]' : 'text-[var(--app-text-primary)]'}`}>
                          ${step.name}
                        </span>
                        ${step.entity_id ? html`<code className="text-xs text-[var(--app-text-muted)] font-mono">${step.entity_id}</code>` : null}
                        ${step.duration_ms ? html`<span className="text-xs text-[var(--app-text-muted)]">${step.duration_ms}ms</span>` : null}
                      </div>
                    `)}
                  </div>
                  ${res.total_duration_ms ? html`
                    <p className="text-xs text-[var(--app-text-muted)] mt-2 pt-2 border-t border-[var(--app-border-soft)]">
                      Total: ${res.total_duration_ms}ms
                      ${res.created_entities ? ` \u2022 Created: ${Object.entries(res.created_entities).map(([k, v]) => `${v.length} ${k}`).join(', ')}` : ''}
                    </p>
                  ` : null}
                  ${res.error ? html`
                    <p className="text-xs text-[var(--app-danger)] mt-2">${res.error}</p>
                  ` : null}
                </div>
              ` : null}
            </div>
          `;
        })}
      </div>
    `;
  };

  // -- Quick Setup tab ------------------------------------------------------

  const renderQuickSetup = () => html`
    <div>
      <p className="text-[var(--app-text-secondary)] mb-6 text-sm">
        Generate random colleges, students, companies, cycles, jobs, workflows, and applications for testing.
        All users have password <strong>password</strong>.
      </p>

      <div className="bg-[var(--app-surface)] border border-[var(--app-border-soft)] rounded-[var(--app-radius-md)] p-6 mb-6 shadow-[var(--app-shadow-subtle)]">
        <h3 className="text-base font-semibold text-[var(--app-text-primary)] mb-4">Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          ${Object.entries(params).map(([key, val]) => html`
            <div key=${key}>
              <label className="block text-xs font-medium text-[var(--app-text-muted)] mb-1">${key.replace(/_/g, ' ')}</label>
              <input
                type="number"
                min=${key.includes('num') || key.includes('max') ? 0 : 1}
                value=${val}
                onChange=${handleChange(key)}
                className="w-full px-3 py-2 rounded-[var(--app-radius-sm)] border border-[var(--app-border-strong)] bg-[var(--app-surface)] text-[var(--app-text-primary)]"
              />
            </div>
          `)}
        </div>
        <button
          onClick=${handleGenerate}
          disabled=${loading}
          className="mt-4 px-5 py-2.5 bg-[var(--app-accent)] text-white font-medium rounded-[var(--app-radius-sm)] hover:bg-[var(--app-accent-hover)] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          ${loading ? 'Generating...' : 'Generate'}
        </button>
      </div>

      ${result ? html`
        <div className="bg-[var(--app-surface)] border border-[var(--app-border-soft)] rounded-[var(--app-radius-md)] p-6 shadow-[var(--app-shadow-subtle)]">
          <h3 className="text-base font-semibold text-[var(--app-text-primary)] mb-2">Generated</h3>
          <p className="text-[var(--app-text-secondary)] text-sm mb-4">
            All users have password: <strong>${result.password || 'password'}</strong>.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="p-3 bg-[var(--app-surface-muted)] rounded-lg">
              <p className="text-xs font-semibold text-[var(--app-text-muted)] uppercase">Counts</p>
              <p className="text-sm mt-1">
                ${Object.entries(result.created_count || {}).map(([k, v]) => `${k}: ${v}`).join(', ')}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-[var(--app-text-primary)]">Users (email / role)</h4>
            <button
              onClick=${handleCopyCredentials}
              className="text-xs text-[var(--app-accent)] hover:underline"
            >
              Copy credentials
            </button>
          </div>
          <div className="max-h-64 overflow-y-auto border border-[var(--app-border-soft)] rounded-lg p-3 text-sm font-mono">
            ${(result.users || []).slice(0, 50).map((u) => {
              const roleStr = typeof u.role === 'string' ? u.role : (u.role?.name ?? u.role?.id ?? '');
              return html`<div key=${u.email} className="py-1">${u.email} \u2014 ${roleStr}</div>`;
            })}
            ${(result.users || []).length > 50 ? html`<div className="py-1 text-[var(--app-text-muted)]">... and ${result.users.length - 50} more</div>` : null}
          </div>
        </div>
      ` : null}
    </div>
  `;

  // -- Main render ----------------------------------------------------------

  return html`
    <div className="p-6 md:p-8 w-full max-w-5xl mx-auto">
      <div className="flex items-center gap-1 mb-6 border-b border-[var(--app-border-soft)]">
        <button className=${tabClasses('scenarios')} onClick=${() => setActiveTab('scenarios')}>
          Scenarios
        </button>
        <button className=${tabClasses('quick-setup')} onClick=${() => setActiveTab('quick-setup')}>
          Quick Setup
        </button>
      </div>

      ${activeTab === 'scenarios' ? renderScenarios() : renderQuickSetup()}
    </div>
  `;
};

export default SimulatorPortal;
