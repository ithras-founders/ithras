/**
 * Minimal chrome for shared LongForm post URLs (anonymous readers).
 */
import React from 'react';
import htm from 'htm';
import LongFormPostPage from './LongFormPostPage.js';

const html = htm.bind(React.createElement);

const PublicLongFormPostShell = ({ publicationSlug, postSlug }) => html`
  <div className="min-h-screen" style=${{ background: 'var(--app-bg)' }}>
    <header
      className="sticky top-0 z-40 flex items-center justify-between gap-4 px-4 py-3 border-b"
      style=${{ borderColor: 'var(--app-border-soft)', background: 'var(--app-surface)', backdropFilter: 'blur(12px)' }}
    >
      <a
        href="/"
        className="text-sm font-bold ith-focus-ring rounded-md px-1 py-0.5"
        style=${{ color: 'var(--app-text-primary)' }}
      >
        Ithras
      </a>
      <div className="flex items-center gap-2">
        <a
          href="/register"
          className="text-sm font-medium px-3 py-1.5 rounded-lg ith-focus-ring"
          style=${{ color: 'var(--app-accent)' }}
        >
          Sign up
        </a>
        <a
          href="/"
          className="text-sm font-medium px-3 py-1.5 rounded-lg ith-focus-ring text-white"
          style=${{ background: 'var(--app-accent)' }}
        >
          Log in
        </a>
      </div>
    </header>
    <${LongFormPostPage} user=${null} publicationSlug=${publicationSlug} postSlug=${postSlug} />
  </div>
`;

export default PublicLongFormPostShell;
