/**
 * InboxSidebar - Left nav: inbox sections, filters, compose.
 */
import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

const InboxIcon = () => html`
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
    <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
  </svg>
`;

const UsersIcon = () => html`
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
`;

const UserPlusIcon = () => html`
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <line x1="19" y1="8" x2="19" y2="14"/>
    <line x1="22" y1="11" x2="16" y2="11"/>
  </svg>
`;

const ArchiveIcon = () => html`
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="1" y="4" width="22" height="5" rx="1"/>
    <path d="M2 9v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9"/>
  </svg>
`;

const ComposeIcon = () => html`
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
`;

const sections = [
  { key: 'priority', label: 'Priority', icon: InboxIcon, helper: 'Direct messages from people you’re connected with.' },
  { key: 'following', label: 'Following', icon: UsersIcon, helper: 'People you follow but aren’t connected to yet.' },
  { key: 'requests', label: 'Requests', icon: UserPlusIcon, helper: 'Invites to start a conversation (followers).' },
  { key: 'other', label: 'Other', icon: InboxIcon, helper: 'Everyone who doesn’t fit Priority or Following.' },
  { key: 'archived', label: 'Archived', icon: ArchiveIcon, helper: 'Threads you’ve moved out of the main inbox.' },
];

const InboxSidebar = ({ activeSection, onSectionChange, onCompose, counts = {}, collapsed = false }) => html`
  <div className="flex flex-col h-full">
    <div className=${`p-4 border-b ${collapsed ? 'px-2' : ''}`} style=${{ borderColor: 'var(--app-border-soft)' }}>
      <button
        onClick=${onCompose}
        className=${`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium text-sm transition-colors ${collapsed ? 'px-2' : 'px-4'}`}
        style=${{
          background: 'var(--app-accent)',
          color: 'white',
        }}
        title="New message"
      >
        <${ComposeIcon} />
        ${!collapsed ? 'New message' : null}
      </button>
    </div>
    <nav className="flex-1 py-3 px-2 overflow-y-auto" aria-label="Inbox sections">
      ${sections.map((s) => {
        const isActive = activeSection === s.key;
        const count = counts[s.key] ?? 0;
        return html`
          <button
            key=${s.key}
            onClick=${() => onSectionChange(s.key)}
            title=${collapsed ? s.label : undefined}
            className=${`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-left transition-colors ${collapsed ? 'justify-center px-2' : ''}`}
            style=${{
              background: isActive ? 'var(--app-accent-soft)' : 'transparent',
              color: isActive ? 'var(--app-accent)' : 'var(--app-text-secondary)',
            }}
          >
            <span className="flex-shrink-0 flex items-center justify-center"><${s.icon} /></span>
            ${!collapsed
              ? html`
                  <span className="flex flex-1 min-w-0 items-center gap-2">
                    <span className="flex-1 min-w-0">
                      <span className="block">${s.label}</span>
                      <span className="block text-[11px] font-normal leading-snug mt-0.5" style=${{ color: 'var(--app-text-muted)' }}>
                        ${s.helper}
                      </span>
                    </span>
                    ${count > 0
                      ? html`
                          <span
                            className="flex-shrink-0 min-w-[20px] h-5 flex items-center justify-center rounded-full text-xs font-medium px-1.5"
                            style=${{ background: 'var(--app-accent-soft)', color: 'var(--app-accent)' }}
                          >
                            ${count}
                          </span>
                        `
                      : null}
                  </span>
                `
              : null}
          </button>
        `;
      })}
    </nav>
  </div>
`;

export default InboxSidebar;
