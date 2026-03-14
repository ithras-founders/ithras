import React, { useEffect } from 'react';
import htm from 'htm';
import CATPrepPortal from './CATPrepPortal.js';

const html = htm.bind(React.createElement);

const PreparationPortal = ({ user, view = 'preparation', navigate }) => {
  const viewParts = (view || 'preparation').split('/').filter(Boolean);
  const subView = viewParts[1] || 'home';
  const postId = viewParts[2] === 'post' ? viewParts[3] : null;

  useEffect(() => {
    if (subView === 'community' && navigate) {
      navigate(postId ? `feed/communities/post/${postId}` : 'feed/community/MBA_PREP');
    }
  }, [subView, postId, navigate]);

  if (subView === 'cat') {
    return html`<${CATPrepPortal} user=${user} view=${view} navigate=${navigate} />`;
  }

  const navItems = [
    { id: 'home', label: 'Home', view: 'preparation' },
    { id: 'cat', label: 'CAT Prep', view: 'preparation/cat' },
    { id: 'community', label: 'Community', view: 'feed/community/MBA_PREP' },
  ];

  return html`
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      <nav className="flex gap-4 mb-6 border-b border-[var(--app-border-soft)] pb-4">
        ${navItems.map((item) => html`
          <button
            key=${item.id}
            onClick=${() => navigate?.(item.view)}
            className=${`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
              (subView === 'community' && item.id === 'community') || ((!subView || subView === 'home') && item.id === 'home')
                ? 'bg-[var(--app-accent-soft)] text-[var(--app-accent)]'
                : 'text-[var(--app-text-secondary)] hover:text-[var(--app-text-primary)]'
            }`}
          >
            ${item.label}
          </button>
        `)}
      </nav>

      ${subView === 'home' && html`
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[var(--app-surface)] rounded-2xl border border-[var(--app-border-soft)] p-6 hover:border-[var(--app-accent)] transition-colors">
            <div className="w-12 h-12 rounded-xl bg-[var(--app-accent-soft)] flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-[var(--app-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-[var(--app-text-primary)] mb-2">Interview Prep</h3>
            <p className="text-sm text-[var(--app-text-secondary)] mb-4">Practice questions, company-specific prep, and role-based material. AI-generated prep tailored to your target companies.</p>
            <span className="text-xs font-semibold text-[var(--app-accent)] uppercase tracking-wider">Coming soon</span>
          </div>

          <div
            onClick=${() => navigate?.('feed/community/MBA_PREP')}
            className="bg-[var(--app-surface)] rounded-2xl border border-[var(--app-border-soft)] p-6 hover:border-[var(--app-accent)] transition-colors cursor-pointer"
          >
            <div className="w-12 h-12 rounded-xl bg-[var(--app-accent-soft)] flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-[var(--app-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l3.586-3.586a1.994 1.994 0 001.414.586" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-[var(--app-text-primary)] mb-2">Community</h3>
            <p className="text-sm text-[var(--app-text-secondary)] mb-4">Theme-based discussions for CAT, PI, WAT, GD. Share experiences and get peer feedback.</p>
            <span className="text-xs font-semibold text-[var(--app-accent)] uppercase tracking-wider">Open</span>
          </div>
        </div>
      `}

      ${subView === 'community' && html`
        <p className="text-[var(--app-text-muted)] py-8">Redirecting to Community...</p>
      `}
    </div>
  `;
};

export default PreparationPortal;
