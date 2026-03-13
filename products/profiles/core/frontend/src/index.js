import React, { useState } from 'react';
import htm from 'htm';
import { ToastProvider, toDisplayString } from '/core/frontend/src/modules/shared/index.js';
import AccountSettingsPage from '/core/frontend/src/modules/shared/pages/AccountSettingsPage.js';

const html = htm.bind(React.createElement);

/** Normalize user so name/email are always strings - prevents React #311 from malformed API data */
const sanitizeUser = (u) => {
  if (!u) return null;
  return {
    ...u,
    name: toDisplayString(u.name) || '',
    email: toDisplayString(u.email) || '',
    email_hidden: !!u.email_hidden,
  };
};

function LazyProfile({ loader, props: renderProps }) {
  const [mod, setMod] = useState(null);
  React.useEffect(() => {
    loader?.().then(setMod);
  }, []);
  if (!mod) return html`<div className="p-20 text-center animate-pulse">Loading...</div>`;
  if (!renderProps?.render) return html`<div className="p-8 text-[var(--app-text-muted)]">Unable to load.</div>`;
  return renderProps.render(mod);
}

/**
 * ProfilesShell - routes to the correct profile module based on view.
 * Used when view is profile/* (public profile) or account-settings.
 * Wraps content in ToastProvider so AccountSettingsPage and other profile views
 * have toast context (avoids React #311 when loaded via dynamic import).
 */
const ProfilesShell = ({ view, navigate, user, onUserUpdate }) => {
  const wrapWithToast = (content) => html`<${ToastProvider}>${content}<//>`;
  if (view === 'account-settings' || view === 'account-settings-contact' || view === 'account-settings-messaging') {
    if (!user) {
      return html`<div className="p-12 text-center text-[var(--app-text-muted)]">Please sign in to manage your account settings.</div>`;
    }
    return wrapWithToast(html`<${AccountSettingsPage} user=${sanitizeUser(user)} navigate=${navigate} onUserUpdate=${onUserUpdate} subview=${view} />`);
  }
  if (view?.startsWith('profile/')) {
    return wrapWithToast(html`<${LazyProfile}
      loader=${() => import('/products/profiles/public/frontend/src/index.js')}
      props=${{ render: (mod) => mod.PublicProfilePage ? html`<${mod.PublicProfilePage} view=${view} user=${user} navigate=${navigate} />` : html`<div>Loading...</div>` }}
    />`);
  }
  return html`<div className="p-8 text-[var(--app-text-muted)]">Unknown profile view.</div>`;
};

export default ProfilesShell;
