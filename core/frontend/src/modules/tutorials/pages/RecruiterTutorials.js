import React from 'react';
import htm from 'htm';
import TutorialViewer from '../components/TutorialViewer.js';
import { tutorialSections } from '../data/recruiterContent.js';

const html = htm.bind(React.createElement);

const RecruiterTutorials = ({ user, navigate }) => {
  return html`
    <${TutorialViewer}
      tutorialSections=${tutorialSections}
      role="RECRUITER"
      user=${user}
      navigate=${navigate}
    />
  `;
};

export default RecruiterTutorials;
