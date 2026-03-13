import React from 'react';
import htm from 'htm';
import TutorialViewer from '../components/TutorialViewer.js';
import { tutorialSections } from '../data/candidateContent.js';

const html = htm.bind(React.createElement);

const CandidateTutorials = ({ user, navigate }) => {
  return html`
    <${TutorialViewer}
      tutorialSections=${tutorialSections}
      role="CANDIDATE"
      user=${user}
      navigate=${navigate}
    />
  `;
};

export default CandidateTutorials;
