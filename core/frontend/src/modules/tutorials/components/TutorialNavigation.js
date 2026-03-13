import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

/**
 * Sidebar navigation for tutorials
 * Shows sections, subsections, and search functionality
 */
const TutorialNavigation = ({
  sections = [],
  activeSection,
  activeSubsection,
  onSectionClick,
  onSubsectionClick,
  searchQuery,
  onSearchChange,
  role,
  navigate,
}) => {
  const [expandedSections, setExpandedSections] = React.useState(new Set());

  React.useEffect(() => {
    // Expand active section
    if (activeSection) {
      setExpandedSections(prev => new Set([...prev, activeSection]));
    }
  }, [activeSection]);

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  const handleBack = () => navigate?.('dashboard');

  return html`
    <aside className="fixed inset-y-0 left-0 w-[280px] lg:w-[320px] bg-[var(--app-surface)] border-r border-[var(--app-border-soft)] flex flex-col z-[60] overflow-hidden">
      <div className="p-6 border-b border-[var(--app-border-soft)]">
        ${navigate ? html`
          <button
            onClick=${handleBack}
            className="flex items-center gap-2 mb-4 text-sm font-medium text-[var(--app-text-secondary)] hover:text-[var(--app-text-primary)] transition-colors app-focus-ring"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </button>
        ` : null}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-[var(--app-accent)] rounded-xl flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[var(--app-text-primary)]">Tutorials</h2>
            <p className="text-[10px] font-bold text-[var(--app-text-muted)] uppercase tracking-widest">${role || 'User'} Guide</p>
          </div>
        </div>
        
        <div className="relative">
          <input
            type="text"
            placeholder="Search tutorials..."
            value=${searchQuery}
            onChange=${(e) => onSearchChange(e.target.value)}
            className="w-full px-4 py-2.5 pl-10 bg-[var(--app-surface-muted)] border border-[var(--app-border-soft)] rounded-xl text-sm font-medium text-[var(--app-text-primary)] placeholder-[var(--app-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--app-accent)] focus:border-transparent"
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--app-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        ${sections.length === 0 ? html`
          <div className="px-6 py-8 text-center">
            <p className="text-[var(--app-text-muted)] font-medium text-sm">No tutorials found</p>
          </div>
        ` : sections.map(section => html`
          <div key=${section.id} className="mb-2">
            <button
              onClick=${() => {
                toggleSection(section.id);
                if (section.subsections && section.subsections.length > 0) {
                  onSubsectionClick(section.id, section.subsections[0].id);
                } else {
                  onSectionClick(section.id);
                }
              }}
              className=${`w-full flex items-center justify-between px-6 py-3 text-sm font-bold transition-colors ${
                activeSection === section.id
                  ? 'text-[var(--app-accent)] bg-[var(--app-accent-soft)]/50'
                  : 'text-[var(--app-text-secondary)] hover:bg-[var(--app-surface-muted)]'
              }`}
            >
              <span className="truncate">${section.title}</span>
              ${section.subsections && section.subsections.length > 0 ? html`
                <svg 
                  className=${`w-4 h-4 transition-transform ${
                    expandedSections.has(section.id) ? 'rotate-90' : ''
                  }`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              ` : ''}
            </button>
            
            ${expandedSections.has(section.id) && section.subsections ? html`
              <div className="pl-6 pr-2">
                ${section.subsections.map(subsection => html`
                  <button
                    key=${subsection.id}
                    onClick=${() => onSubsectionClick(section.id, subsection.id)}
                    className=${`w-full text-left px-4 py-2.5 text-sm font-medium rounded-lg transition-colors mb-1 ${
                      activeSubsection === subsection.id
                        ? 'text-[var(--app-accent)] bg-[var(--app-accent-soft)]/50'
                        : 'text-[var(--app-text-secondary)] hover:bg-[var(--app-surface-muted)]'
                    }`}
                  >
                    ${subsection.title}
                  </button>
                `)}
              </div>
            ` : ''}
          </div>
        `)}
      </nav>
    </aside>
  `;
};

export default TutorialNavigation;
