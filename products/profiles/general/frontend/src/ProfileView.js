import React, { useState, useEffect } from 'react';
import htm from 'htm';
import { Input } from '/shared/primitives/index.js';
import { apiRequest } from '/shared/services/apiBase.js';
import { AppShell } from '/shared/components/appShell/index.js';

const html = htm.bind(React.createElement);

/**
 * Profile view - view and edit own profile.
 */
export const ProfileView = ({ user, onLogout }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');

  useEffect(() => {
    apiRequest('/v1/profile/me')
      .then((res) => {
        setProfile(res?.profile);
        setFullName(res?.profile?.full_name || '');
        setDateOfBirth(res?.profile?.date_of_birth?.slice(0, 10) || '');
      })
      .catch((err) => setError(err.message || 'Failed to load profile'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setError('');
    try {
      const res = await apiRequest('/v1/profile/me', {
        method: 'PATCH',
        body: JSON.stringify({ full_name: fullName, date_of_birth: dateOfBirth || null }),
      });
      setProfile(res?.profile);
      setEditMode(false);
    } catch (err) {
      setError(err.serverDetail || err.message || 'Failed to update profile');
    }
  };

  if (loading) return html`
    <${AppShell} user=${user} onLogout=${onLogout} navItems=${[]} showSettings=${true}>
      <div className="p-8 animate-pulse">Loading profile...</div>
    </${AppShell}>
  `;
  if (error && !profile) return html`
    <${AppShell} user=${user} onLogout=${onLogout} navItems=${[]} showSettings=${true}>
      <div className="p-8 text-red-600">${error}</div>
    </${AppShell}>
  `;

  return html`
    <${AppShell} user=${user} onLogout=${onLogout} navItems=${[]} showSettings=${true}>
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-semibold text-[var(--app-text-primary)] mb-6">Your Profile</h1>
      ${error ? html`<div className="mb-4 p-3 bg-red-50 rounded-lg text-sm text-red-600">${error}</div>` : null}
      <div className="app-card p-6 space-y-4">
        ${editMode
          ? html`
              <${Input}
                label="Full name"
                value=${fullName}
                onChange=${(e) => setFullName(e.target.value)}
              />
              <${Input}
                type="date"
                label="Date of birth"
                value=${dateOfBirth}
                onChange=${(e) => setDateOfBirth(e.target.value)}
              />
              <div className="flex gap-3">
                <button
                  onClick=${handleSave}
                  className="px-4 py-2 rounded-lg font-medium bg-[var(--app-accent)] text-white hover:opacity-90"
                >
                  Save
                </button>
                <button
                  onClick=${() => { setEditMode(false); setFullName(profile?.full_name || ''); setDateOfBirth(profile?.date_of_birth?.slice(0, 10) || ''); }}
                  className="px-4 py-2 rounded-lg font-medium border border-[var(--app-border-strong)] text-[var(--app-text-primary)]"
                >
                  Cancel
                </button>
              </div>
            `
          : html`
              <p><strong>Username:</strong> ${profile?.username || '-'}</p>
              <p><strong>Email:</strong> ${profile?.email || '-'}</p>
              <p><strong>Full name:</strong> ${profile?.full_name || '-'}</p>
              <p><strong>Date of birth:</strong> ${profile?.date_of_birth || '-'}</p>
              <button
                onClick=${() => setEditMode(true)}
                className="mt-4 px-4 py-2 rounded-lg font-medium border border-[var(--app-accent)] text-[var(--app-accent)] hover:bg-[var(--app-accent-soft)]"
              >
                Edit profile
              </button>
            `}
      </div>
    </div>
    </${AppShell}>
  `;
};

export default ProfileView;
