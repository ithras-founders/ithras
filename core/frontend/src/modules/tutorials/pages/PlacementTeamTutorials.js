import React from 'react';
import htm from 'htm';
import TutorialViewer from '../components/TutorialViewer.js';
import { tutorialSections } from '../data/placementTeamContent.js';

const html = htm.bind(React.createElement);

const PlacementTeamTutorials = ({ user, navigate }) => {
  return html`
    <${TutorialViewer}
      tutorialSections=${tutorialSections}
      role="PLACEMENT_TEAM"
      user=${user}
      navigate=${navigate}
    />
  `;
};

export default PlacementTeamTutorials;
