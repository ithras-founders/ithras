/**
 * Tutorials Product - Frontend Exports
 * Export all tutorial components and pages
 */

// Guided demo and tour
export { default as TutorialRoleSelector } from './components/TutorialRoleSelector.js';
export { default as GuidedTour } from './components/GuidedTour.js';
export { TutorialProvider, useTutorialContext } from './context/TutorialContext.js';

// Core components
export { default as TutorialViewer } from './components/TutorialViewer.js';
export { default as TutorialNavigation } from './components/TutorialNavigation.js';
export { default as TutorialSection } from './components/TutorialSection.js';
export { default as FeatureExplanation } from './components/FeatureExplanation.js';
export { default as FeatureSpotlight, SPOTLIGHT_DEFINITIONS } from './components/FeatureSpotlight.js';

// Role-specific tutorial pages
export { default as CandidateTutorials } from './pages/CandidateTutorials.js';
export { default as RecruiterTutorials } from './pages/RecruiterTutorials.js';
export { default as PlacementTeamTutorials } from './pages/PlacementTeamTutorials.js';
export { default as PlacementAdminTutorials } from './pages/PlacementAdminTutorials.js';
export { default as InstitutionAdminTutorials } from './pages/InstitutionAdminTutorials.js';
export { default as SystemAdminTutorials } from './pages/SystemAdminTutorials.js';
export { default as FacultyObserverTutorials } from './pages/FacultyObserverTutorials.js';
export { default as GuidedDemosPage } from './pages/GuidedDemosPage.js';
