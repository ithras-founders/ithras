import React, { useState } from 'react';
import htm from 'htm';
import TutorialNavigation from './TutorialNavigation.js';
import TutorialSection from './TutorialSection.js';

const html = htm.bind(React.createElement);

/**
 * Main tutorial viewer component
 * Displays tutorials with navigation sidebar and content area
 */
const TutorialViewer = ({ tutorialSections, role, user, navigate }) => {
  const [activeSection, setActiveSection] = useState(null);
  const [activeSubsection, setActiveSubsection] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Initialize with first section/subsection
  React.useEffect(() => {
    if (tutorialSections && tutorialSections.length > 0) {
      const firstSection = tutorialSections[0];
      setActiveSection(firstSection.id);
      if (firstSection.subsections && firstSection.subsections.length > 0) {
        setActiveSubsection(firstSection.subsections[0].id);
      }
    }
  }, [tutorialSections]);

  // Filter sections based on search query
  const filteredSections = React.useMemo(() => {
    if (!searchQuery.trim()) return tutorialSections;
    
    const query = searchQuery.toLowerCase();
    return tutorialSections.filter(section => {
      const sectionMatches = section.title.toLowerCase().includes(query);
      const subsectionMatches = section.subsections?.some(sub => 
        sub.title.toLowerCase().includes(query) || 
        sub.content?.toLowerCase().includes(query)
      );
      return sectionMatches || subsectionMatches;
    });
  }, [tutorialSections, searchQuery]);

  const currentSection = tutorialSections?.find(s => s.id === activeSection);
  const currentSubsection = currentSection?.subsections?.find(s => s.id === activeSubsection);

  return html`
    <div className="flex min-h-screen bg-[var(--app-bg)]">
      <${TutorialNavigation}
        sections=${filteredSections}
        activeSection=${activeSection}
        activeSubsection=${activeSubsection}
        onSectionClick=${setActiveSection}
        onSubsectionClick=${(sectionId, subsectionId) => {
          setActiveSection(sectionId);
          setActiveSubsection(subsectionId);
        }}
        searchQuery=${searchQuery}
        onSearchChange=${setSearchQuery}
        role=${role}
        navigate=${navigate}
      />
      
      <div className="flex-1 ml-[280px] lg:ml-[320px]">
        <main className="max-w-4xl mx-auto p-8 pb-20">
          ${currentSubsection ? html`
            <${TutorialSection}
              section=${currentSection}
              subsection=${currentSubsection}
              role=${role}
              user=${user}
            />
          ` : html`
            <div className="bg-[var(--app-surface)] rounded-[var(--app-radius-lg)] border border-[var(--app-border-soft)] shadow-[var(--app-shadow-subtle)] p-12 text-center">
              <div className="w-24 h-24 bg-[var(--app-accent-soft)] rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-[var(--app-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-[var(--app-text-primary)] mb-2">Welcome to Tutorials</h2>
              <p className="text-[var(--app-text-secondary)] font-medium">Select a section from the sidebar to begin</p>
            </div>
          `}
        </main>
      </div>
    </div>
  `;
};

export default TutorialViewer;
