import React, { useState, useCallback } from 'react';
import htm from 'htm';
import { useTutorialContext } from '../context/TutorialContext.js';
import {
  ROLES_WITH_TUTORIALS,
  getPagesWithTutorials,
  getPageTutorialMeta,
  getDemoScenariosForRole,
} from '../context/tutorialSteps.js';

const html = htm.bind(React.createElement);

const TUTORIAL_ROLE_IDS = new Set(ROLES_WITH_TUTORIALS.map((r) => r.id));

const BLOCK_ICONS = {
  dashboard: html`<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>`,
  lightning: html`<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>`,
  document: html`<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>`,
  user: html`<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>`,
  calendar: html`<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>`,
  chart: html`<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>`,
  workflow: html`<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>`,
  briefcase: html`<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>`,
  governance: html`<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>`,
  check: html`<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`,
  building: html`<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>`,
  users: html`<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>`,
  lock: html`<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>`,
  settings: html`<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>`,
};

const GuidedDemosPage = ({ user, navigate, onStartPageTutorial }) => {
  const { isTutorialMode, demoRole, startPageTutorial, effectiveUser } = useTutorialContext();
  const displayUser = effectiveUser || user;
  const role = isTutorialMode ? demoRole : displayUser?.role;
  const [activeTab, setActiveTab] = useState('pages');
  const [runningScenario, setRunningScenario] = useState(null);
  const [scenarioStep, setScenarioStep] = useState(0);

  const pages = role && TUTORIAL_ROLE_IDS.has(role) ? getPagesWithTutorials(role) : [];
  const scenarios = role && TUTORIAL_ROLE_IDS.has(role) ? getDemoScenariosForRole(role) : [];

  const handleBlockClick = useCallback((view) => {
    navigate(view);
    if (isTutorialMode) {
      startPageTutorial(demoRole, view);
    } else {
      onStartPageTutorial(displayUser?.role || role, view);
    }
  }, [navigate, isTutorialMode, demoRole, displayUser, role, startPageTutorial, onStartPageTutorial]);

  const handleStartScenario = useCallback((scenario) => {
    if (runningScenario) return;
    setRunningScenario(scenario.id);
    setScenarioStep(0);

    const runStep = (idx) => {
      if (idx >= scenario.views.length) {
        setRunningScenario(null);
        setScenarioStep(0);
        return;
      }
      setScenarioStep(idx);
      const view = scenario.views[idx];
      navigate(view);
      if (isTutorialMode) {
        startPageTutorial(demoRole, view);
      } else {
        onStartPageTutorial(displayUser?.role || role, view);
      }
    };

    runStep(0);
  }, [runningScenario, navigate, isTutorialMode, demoRole, displayUser, role, startPageTutorial, onStartPageTutorial]);

  if (!role || !TUTORIAL_ROLE_IDS.has(role)) {
    return html`
      <div className="p-12 max-w-2xl mx-auto">
        <p className="text-[var(--app-text-muted)]">Guided demos are available for Student Candidate, Recruiter, Placement Team, and System Administrator roles.</p>
      </div>
    `;
  }

  const renderPageBlocks = () => html`
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      ${pages.map((view) => {
        const meta = getPageTutorialMeta(role, view);
        const iconEl = BLOCK_ICONS[meta.icon] || BLOCK_ICONS.document;
        return html`
          <button
            key=${view}
            onClick=${() => handleBlockClick(view)}
            className="w-full flex items-start gap-4 p-5 rounded-[var(--app-radius-lg)] border border-[var(--app-border-soft)] bg-[var(--app-surface)] hover:bg-[var(--app-surface-muted)] hover:border-[var(--app-border-strong)] transition-all duration-200 text-left app-focus-ring"
          >
            <div className="flex-shrink-0 w-12 h-12 rounded-[var(--app-radius-md)] bg-[var(--app-surface-muted)] flex items-center justify-center text-[var(--app-accent)]">${iconEl}</div>
            <div className="min-w-0 flex-1">
              <p className="text-base font-bold text-[var(--app-text-primary)]">${meta.label}</p>
              <p className="text-sm text-[var(--app-text-muted)] mt-1 line-clamp-2">${meta.description}</p>
            </div>
            <svg className="w-5 h-5 text-[var(--app-text-muted)] flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        `;
      })}
    </div>
  `;

  const renderScenarios = () => html`
    <div className="space-y-4">
      ${scenarios.length === 0 ? html`
        <p className="text-[var(--app-text-muted)] text-sm">No storyline demos available for this role yet.</p>
      ` : scenarios.map((scenario) => {
        const iconEl = BLOCK_ICONS[scenario.icon] || BLOCK_ICONS.workflow;
        const isRunning = runningScenario === scenario.id;
        return html`
          <div
            key=${scenario.id}
            className="rounded-[var(--app-radius-lg)] border border-[var(--app-border-soft)] bg-[var(--app-surface)] p-5"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-[var(--app-radius-md)] bg-gradient-to-br from-[var(--app-accent)] to-[var(--app-accent-hover)] flex items-center justify-center text-white">${iconEl}</div>
              <div className="min-w-0 flex-1">
                <p className="text-base font-bold text-[var(--app-text-primary)]">${scenario.label}</p>
                <p className="text-sm text-[var(--app-text-secondary)] mt-1">${scenario.description}</p>
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  ${scenario.views.map((view, idx) => {
                    const meta = getPageTutorialMeta(role, view);
                    const isActive = isRunning && scenarioStep === idx;
                    const isDone = isRunning && scenarioStep > idx;
                    return html`
                      <span key=${view} className="flex items-center gap-1">
                        ${idx > 0 ? html`
                          <svg className="w-3 h-3 text-[var(--app-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                          </svg>
                        ` : null}
                        <span className=${`text-xs px-2 py-0.5 rounded-full ${
                          isActive ? 'bg-[var(--app-accent)] text-white font-semibold' :
                          isDone ? 'bg-green-100 text-green-700' :
                          'bg-[var(--app-surface-muted)] text-[var(--app-text-muted)]'
                        }`}>${meta.label}</span>
                      </span>
                    `;
                  })}
                </div>
              </div>
              <button
                onClick=${() => handleStartScenario(scenario)}
                disabled=${!!runningScenario}
                className=${`flex-shrink-0 px-4 py-2 rounded-[var(--app-radius-md)] text-sm font-medium transition-all duration-200 ${
                  runningScenario ? 'opacity-50 cursor-not-allowed bg-[var(--app-surface-muted)] text-[var(--app-text-muted)]' :
                  'bg-[var(--app-accent)] text-white hover:bg-[var(--app-accent-hover)]'
                }`}
              >
                ${isRunning ? 'Running...' : 'Start Storyline'}
              </button>
            </div>
          </div>
        `;
      })}
    </div>
  `;

  return html`
    <div className="p-6 md:p-10 max-w-4xl mx-auto">
      ${navigate ? html`
        <button
          onClick=${() => navigate('dashboard')}
          className="flex items-center gap-2 mb-6 text-sm font-medium text-[var(--app-text-secondary)] hover:text-[var(--app-text-primary)] transition-colors app-focus-ring"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Home
        </button>
      ` : null}
      <div className="flex gap-1 mb-6 p-1 bg-[var(--app-surface-muted)] rounded-[var(--app-radius-md)] w-fit">
        <button
          onClick=${() => setActiveTab('pages')}
          className=${`px-4 py-2 rounded-[var(--app-radius-sm)] text-sm font-medium transition-all duration-200 ${
            activeTab === 'pages' ? 'bg-[var(--app-surface)] text-[var(--app-text-primary)] shadow-sm' : 'text-[var(--app-text-muted)] hover:text-[var(--app-text-secondary)]'
          }`}
        >
          Page Demos (${pages.length})
        </button>
        <button
          onClick=${() => setActiveTab('storylines')}
          className=${`px-4 py-2 rounded-[var(--app-radius-sm)] text-sm font-medium transition-all duration-200 ${
            activeTab === 'storylines' ? 'bg-[var(--app-surface)] text-[var(--app-text-primary)] shadow-sm' : 'text-[var(--app-text-muted)] hover:text-[var(--app-text-secondary)]'
          }`}
        >
          Storylines (${scenarios.length})
        </button>
      </div>

      ${activeTab === 'pages' ? renderPageBlocks() : renderScenarios()}
    </div>
  `;
};

export default GuidedDemosPage;
