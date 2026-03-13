import React from 'react';
import htm from 'htm';
import TutorialViewer from '../components/TutorialViewer.js';
import { tutorialSections } from '../data/systemAdminContent.js';

const html = htm.bind(React.createElement);

const SystemAdminTutorials = ({ user, navigate }) => {
  return html`
    <${TutorialViewer}
      tutorialSections=${tutorialSections}
      role="SYSTEM_ADMIN"
      user=${user}
      navigate=${navigate}
    />
  `;
};

export default SystemAdminTutorials;
