import React from 'react';
import htm from 'htm';
import { ROLES_WITH_TUTORIALS, getPagesWithTutorials } from '../context/tutorialSteps.js';

const html = htm.bind(React.createElement);

const TUTORIAL_ROLE_IDS = new Set(ROLES_WITH_TUTORIALS.map((r) => r.id));

const GuidedDemoButton = ({
  onStartPageTutorial,
  visible = true,
  currentView,
  currentRole,
}) => {
  const hasPageTutorial =
    currentView &&
    currentRole &&
    TUTORIAL_ROLE_IDS.has(currentRole) &&
    getPagesWithTutorials(currentRole).includes(currentView);

  const handleClick = () => {
    onStartPageTutorial(currentRole, currentView);
  };

  if (!visible || !hasPageTutorial || !onStartPageTutorial) return null;

  return html`
    <${React.Fragment}>
      <button
        onClick=${handleClick}
        className="fixed top-4 right-4 z-40 px-4 py-2 bg-[var(--app-accent)] text-white text-xs font-bold uppercase tracking-widest rounded-xl shadow-lg hover:bg-[var(--app-accent-hover)] transition-colors"
        title="Tour this page"
      >
        Guided Demo
      </button>
    <//>
  `;
};

export default GuidedDemoButton;
