import React, { useState, useEffect } from 'react';
import htm from 'htm';
import { updateMe, getNotificationPreferences, updateNotificationPreferences } from '../services/api.js';
import { PageWrapper, SectionCard, Input, Button } from '../primitives/index.js';
import { useToast } from '../index.js';

const html = htm.bind(React.createElement);

/** Coerce to string for safe render - never pass objects to React children */
const safeStr = (v) => (v == null ? '' : String(v));

const AccountSettingsPage = (props) => {
  const { user, navigate, onUserUpdate, onLogout, subview = 'account-settings' } = props ?? {};
  const toast = useToast();

  const safeName = safeStr(user?.name ?? '').trim() || '';
  const safeEmail = safeStr(user?.email ?? '').trim() || '';
  const safeEmailHidden = Boolean(user?.email_hidden);

  const [name, setName] = useState(safeName);
  const [email, setEmail] = useState(safeEmail);
  const [emailHidden, setEmailHidden] = useState(safeEmailHidden);
  const [savingIdentity, setSavingIdentity] = useState(false);
  const [savingContact, setSavingContact] = useState(false);
  const [savingNotif, setSavingNotif] = useState(false);
  const [notifPrefs, setNotifPrefs] = useState([]);
  const [loadingNotif, setLoadingNotif] = useState(true);

  useEffect(() => {
    if (user) {
      setName(safeStr(user.name ?? '').trim() || '');
      setEmail(safeStr(user.email ?? '').trim() || '');
      setEmailHidden(Boolean(user.email_hidden));
    }
  }, [user]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getNotificationPreferences();
        setNotifPrefs(res?.items || []);
      } catch (e) {
        console.error(e);
        setNotifPrefs([]);
      } finally {
        setLoadingNotif(false);
      }
    };
    load();
  }, []);

  const handleSaveIdentity = async (e) => {
    e?.preventDefault?.();
    if (!user) return;
    setSavingIdentity(true);
    try {
      const payload = {};
      const curName = safeStr(user.name ?? '').trim();
      const curEmail = safeStr(user.email ?? '').trim();
      if (name.trim() !== curName) payload.name = name.trim();
      if (email.trim().toLowerCase() !== curEmail) payload.email = email.trim().toLowerCase();
      if (Object.keys(payload).length === 0) {
        setSavingIdentity(false);
        return;
      }
      const res = await updateMe(payload);
      if (res?.user) onUserUpdate?.(res.user);
      toast.success('Account updated');
    } catch (err) {
      toast.error(safeStr(err?.message) || 'Failed to update account');
    } finally {
      setSavingIdentity(false);
    }
  };

  const handleEmailHiddenChange = async (checked) => {
    setEmailHidden(checked);
    if (!user) return;
    setSavingContact(true);
    try {
      const res = await updateMe({ email_hidden: checked });
      if (res?.user) onUserUpdate?.(res.user);
      toast.success(checked ? 'Email hidden on profile' : 'Email visible on profile');
    } catch (err) {
      toast.error(safeStr(err?.message) || 'Failed to update');
      setEmailHidden(!checked);
    } finally {
      setSavingContact(false);
    }
  };

  const getPrefEnabled = (channel) => {
    const p = notifPrefs.find((x) => x.channel === channel);
    return p?.enabled ?? true;
  };

  const handleNotifPrefChange = async (channel, enabled) => {
    setSavingNotif(true);
    try {
      await updateNotificationPreferences({ channel, enabled });
      setNotifPrefs((prev) => {
        const existing = prev.find((x) => x.channel === channel);
        if (existing) {
          return prev.map((x) => (x.id === existing.id ? { ...x, enabled } : x));
        }
        return [...prev, { id: 'new', channel, notification_type: null, enabled }];
      });
      toast.success(enabled ? 'Notifications enabled' : 'Notifications disabled');
    } catch (err) {
      toast.error(safeStr(err?.message) || 'Failed to update preferences');
    } finally {
      setSavingNotif(false);
    }
  };

  const displayName = safeStr(name);
  const displayEmail = safeStr(email);
  const buttonText = savingIdentity ? 'Saving...' : 'Save';

  const showAccount = subview === 'account-settings';
  const showContact = subview === 'account-settings-contact';
  const showMessaging = subview === 'account-settings-messaging';

  return html`
    <${PageWrapper}>
      <div className="max-w-2xl space-y-6">
        ${showAccount ? html`<${SectionCard} title="Account">
          <p className="text-[var(--app-text-secondary)] text-sm mb-4">
            Update your display name or email. Email must be unique and is used to sign in.
          </p>
          <form onSubmit=${handleSaveIdentity} className="space-y-4">
            <${Input}
              label="Display name"
              id="account-name"
              type="text"
              value=${displayName}
              onChange=${(e) => setName(safeStr(e?.target?.value ?? ''))}
              placeholder="Your name"
            />
            <${Input}
              label="Email"
              id="account-email"
              type="email"
              value=${displayEmail}
              onChange=${(e) => setEmail(safeStr(e?.target?.value ?? ''))}
              placeholder="you@example.com"
            />
            <${Button} type="submit" variant="primary" disabled=${savingIdentity}>
              ${buttonText}
            <//>
          </form>
        <//>` : null}

        ${showContact ? html`<${SectionCard} title="Contact preferences">
          <p className="text-[var(--app-text-secondary)] text-sm mb-4">
            Control how your contact information appears to others on your public profile.
          </p>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked=${emailHidden}
              onChange=${(e) => handleEmailHiddenChange(e.target.checked)}
              disabled=${savingContact}
              className="w-4 h-4 rounded border-[var(--app-border)] text-[var(--app-accent)] focus:ring-[var(--app-accent)]"
            />
            <span className="text-[var(--app-text-primary)] font-medium">Hide email on public profile</span>
          </label>
          ${savingContact ? html`<p className="text-xs text-[var(--app-text-muted)] mt-2">Updating...</p>` : null}
        <//>` : null}

        ${showMessaging ? html`<${SectionCard} title="Messaging preferences">
          <p className="text-[var(--app-text-secondary)] text-sm mb-4">
            Choose how you receive notifications (e.g. new messages, application updates).
          </p>
          ${loadingNotif ? html`<p className="text-sm text-[var(--app-text-muted)]">Loading...</p>` : html`
            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked=${getPrefEnabled('in_app')}
                  onChange=${(e) => handleNotifPrefChange('in_app', e.target.checked)}
                  disabled=${savingNotif}
                  className="w-4 h-4 rounded border-[var(--app-border)] text-[var(--app-accent)] focus:ring-[var(--app-accent)]"
                />
                <span className="text-[var(--app-text-primary)] font-medium">In-app notifications</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked=${getPrefEnabled('email')}
                  onChange=${(e) => handleNotifPrefChange('email', e.target.checked)}
                  disabled=${savingNotif}
                  className="w-4 h-4 rounded border-[var(--app-border)] text-[var(--app-accent)] focus:ring-[var(--app-accent)]"
                />
                <span className="text-[var(--app-text-primary)] font-medium">Email notifications</span>
              </label>
            </div>
          `}
        <//>` : null}

        <div className="pt-6 border-t border-[var(--app-border-soft)]">
          <h3 className="text-sm font-semibold text-[var(--app-text-primary)] mb-2">Sign out</h3>
          <p className="text-sm text-[var(--app-text-secondary)] mb-4">Sign out of your account on this device.</p>
          <button
            onClick=${() => onLogout?.()}
            className="px-4 py-2 text-sm font-medium text-[var(--app-danger)] border border-[var(--app-danger)]/30 rounded-[var(--app-radius-sm)] hover:bg-[var(--app-danger-soft)] transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    <//>
  `;
};

export default AccountSettingsPage;
