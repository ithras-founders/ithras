import React from 'react';
import htm from 'htm';
import IthrasLogo from '../shared/components/IthrasLogo.js';
import SlideDeckContainer from './SlideDeckContainer.js';
import {
  CoverSlide,
  ChallengesSlide,
  EvidenceSlide,
  AchieveSlide,
  GovernanceSlide,
  StudentExperienceSlide,
  RecruiterCollaborationSlide,
  PlacementControlSlide,
  CalendarSlide,
  CVVerificationSlide,
  TimeSavingsSlide,
  SecuritySlide,
  StakeholderSlide,
  RoadmapSlide,
  CTASlide,
} from './slides/institutionSlides.js';

const html = htm.bind(React.createElement);

const SLIDES = [
  { id: 'cover', label: 'Cover', Component: CoverSlide },
  { id: 'challenges', label: 'Your Challenges', Component: ChallengesSlide },
  { id: 'evidence', label: 'The Evidence', Component: EvidenceSlide },
  { id: 'achieve', label: 'What You Achieve', Component: AchieveSlide },
  { id: 'governance', label: 'Governance Engine', Component: GovernanceSlide },
  { id: 'student', label: 'Student Experience', Component: StudentExperienceSlide },
  { id: 'recruiter', label: 'Recruiter Collaboration', Component: RecruiterCollaborationSlide },
  { id: 'placement', label: 'Placement Control Center', Component: PlacementControlSlide },
  { id: 'cv-verification', label: 'CV Verification', Component: CVVerificationSlide },
  { id: 'calendar', label: 'Calendar & Scheduling', Component: CalendarSlide },
  { id: 'savings', label: 'Before vs After', Component: TimeSavingsSlide },
  { id: 'security', label: 'Security & Compliance', Component: SecuritySlide },
  { id: 'stakeholder', label: 'Who Uses Ithras', Component: StakeholderSlide },
  { id: 'roadmap', label: 'Roadmap', Component: RoadmapSlide },
  { id: 'cta', label: 'CTA', Component: CTASlide },
];

const InstitutionPitchDeck = ({ onExit }) => {
  const topBarLeft = html`
    <${IthrasLogo} size="sm" theme="light" className="text-white/90" />
    <span className="text-sm font-medium text-white/50 hidden sm:inline">| Institution Deck</span>
  `;

  return html`
    <${SlideDeckContainer}
      slides=${SLIDES}
      onExit=${onExit}
      topBarLeft=${topBarLeft}
    />
  `;
};

export default InstitutionPitchDeck;
