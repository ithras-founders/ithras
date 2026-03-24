/**
 * Professional profile view - own profile with edit/add education and experience.
 */
import React, { useState, useEffect, useCallback } from 'react';
import htm from 'htm';
import { apiRequest } from '/shared/services/apiBase.js';
import {
  updateProfile,
  addEducation,
  updateEducation,
  deleteEducation,
  addExperience,
  updateExperience,
  deleteExperience,
  addMovement,
  updateMovement,
  deleteMovement,
  addAdditionalResponsibility,
  updateAdditionalResponsibility,
  deleteAdditionalResponsibility,
  addOtherAchievement,
  updateOtherAchievement,
  deleteOtherAchievement,
} from '/shared/services/index.js';
import { AppShell } from '/shared/components/appShell/index.js';
import ProfileLayout from '/shared/components/ProfileLayout.js';
import FeedSidebar from '/products/feed/frontend/src/components/FeedSidebar.js';
import EducationForm from '/shared/components/EducationForm.js';
import ExperienceForm from '/shared/components/ExperienceForm.js';
import AdditionalResponsibilityForm from '/shared/components/AdditionalResponsibilityForm.js';
import OtherAchievementForm from '/shared/components/OtherAchievementForm.js';

const html = htm.bind(React.createElement);

const fetchProfile = () => apiRequest('/v1/profile/me');

const ProfessionalProfileView = ({ user, onLogout }) => {
  const [profile, setProfile] = useState(null);
  const [education, setEducation] = useState([]);
  const [experience, setExperience] = useState([]);
  const [additionalResponsibilities, setAdditionalResponsibilities] = useState([]);
  const [otherAchievements, setOtherAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingEducation, setEditingEducation] = useState(null);
  const [addingEducation, setAddingEducation] = useState(false);
  const [editingExperience, setEditingExperience] = useState(null);
  const [addingExperience, setAddingExperience] = useState(false);
  const [editingResponsibility, setEditingResponsibility] = useState(null);
  const [addingResponsibility, setAddingResponsibility] = useState(false);
  const [editingAchievement, setEditingAchievement] = useState(null);
  const [addingAchievement, setAddingAchievement] = useState(false);
  const [editingAbout, setEditingAbout] = useState(false);

  const refresh = useCallback(() => {
    fetchProfile()
      .then((res) => {
        setProfile(res?.profile);
        setEducation(res?.education || []);
        setExperience(res?.experience || []);
        setAdditionalResponsibilities(res?.additional_responsibilities || []);
        setOtherAchievements(res?.other_achievements || []);
      })
      .catch((err) => setError(err.message || 'Failed to load profile'));
  }, []);

  useEffect(() => {
    fetchProfile()
      .then((res) => {
        setProfile(res?.profile);
        setEducation(res?.education || []);
        setExperience(res?.experience || []);
        setAdditionalResponsibilities(res?.additional_responsibilities || []);
        setOtherAchievements(res?.other_achievements || []);
      })
      .catch((err) => setError(err.message || 'Failed to load profile'))
      .finally(() => setLoading(false));
  }, []);

  const handleSaveEducation = async (data) => {
    if (editingEducation?.id) {
      await updateEducation(editingEducation.id, data);
    } else {
      await addEducation(data);
    }
    refresh();
    setEditingEducation(null);
    setAddingEducation(false);
  };

  const handleDeleteEducation = async (entry) => {
    if (!confirm('Remove this education entry?')) return;
    await deleteEducation(entry.id);
    refresh();
  };

  const handleSaveExperience = async (payload) => {
    const { organisation_name, organisation_id, movements } = payload;
    const validMovements = movements.filter((m) => m.title && m.start_month);
    if (editingExperience?.id) {
      await updateExperience(editingExperience.id, { organisation_name, organisation_id });
      const existingMovs = (editingExperience.movements || []).filter((m) => m.id);
      const submittedIds = new Set(validMovements.map((m) => m.id).filter(Boolean));
      for (const m of existingMovs) {
        if (!submittedIds.has(m.id)) {
          try { await deleteMovement(m.id); } catch (_) {}
        }
      }
      for (const mov of validMovements) {
        if (mov.id && existingMovs.some((m) => m.id === mov.id)) {
          await updateMovement(mov.id, {
            business_unit: mov.business_unit,
            function: mov.function,
            title: mov.title,
            start_month: mov.start_month,
            end_month: mov.end_month,
          });
        } else {
          await addMovement({
            experience_group_id: editingExperience.id,
            business_unit: mov.business_unit || '',
            function: mov.function || '',
            title: mov.title,
            start_month: mov.start_month,
            end_month: mov.end_month || null,
          });
        }
      }
    } else {
      const res = await addExperience({ organisation_name, organisation_id });
      const egId = res.experience_group_id;
      for (const mov of validMovements) {
        await addMovement({
          experience_group_id: egId,
          business_unit: mov.business_unit || '',
          function: mov.function || '',
          title: mov.title,
          start_month: mov.start_month,
          end_month: mov.end_month || null,
        });
      }
    }
    refresh();
    setEditingExperience(null);
    setAddingExperience(false);
  };

  const handleDeleteExperience = async (org) => {
    if (!confirm('Remove this organisation and all its roles?')) return;
    await deleteExperience(org.id);
    refresh();
  };

  const handleSaveAbout = async (newSummary) => {
    await updateProfile({ summary: newSummary ?? '' });
    refresh();
    setEditingAbout(false);
  };

  const handleSaveResponsibility = async (data) => {
    if (editingResponsibility?.id) {
      await updateAdditionalResponsibility(editingResponsibility.id, data);
    } else {
      await addAdditionalResponsibility(data);
    }
    refresh();
    setEditingResponsibility(null);
    setAddingResponsibility(false);
  };

  const handleDeleteResponsibility = async (item) => {
    if (!confirm('Remove this responsibility?')) return;
    await deleteAdditionalResponsibility(item.id);
    refresh();
  };

  const handleSaveAchievement = async (data) => {
    if (editingAchievement?.id) {
      await updateOtherAchievement(editingAchievement.id, data);
    } else {
      await addOtherAchievement(data);
    }
    refresh();
    setEditingAchievement(null);
    setAddingAchievement(false);
  };

  const handleDeleteAchievement = async (item) => {
    if (!confirm('Remove this achievement?')) return;
    await deleteOtherAchievement(item.id);
    refresh();
  };

  const feedSidebar = html`
    <${FeedSidebar} activeView="" onNavigate=${() => {}} pathPrefix="/feed" showSettings=${true} onLogout=${onLogout} />
  `;
  if (loading) return html`
    <${AppShell} user=${user} onLogout=${onLogout} navItems=${[]} showSettings=${true} sidebarContent=${feedSidebar}>
      <div className="flex items-center justify-center p-8 text-[var(--app-text-muted)]">Loading profile...</div>
    </${AppShell}>
  `;
  if (error && !profile) return html`
    <${AppShell} user=${user} onLogout=${onLogout} navItems=${[]} showSettings=${true} sidebarContent=${feedSidebar}>
      <div className="flex items-center justify-center p-8 text-[var(--app-danger)]">${error}</div>
    </${AppShell}>
  `;

  const profileData = profile || { full_name: user?.full_name || user?.name || user?.email || 'Profile' };

  const educationFormOverride = (editingEducation || addingEducation)
    ? html`
        <${EducationForm}
          entry=${editingEducation || undefined}
          onSubmit=${handleSaveEducation}
          onCancel=${() => { setEditingEducation(null); setAddingEducation(false); }}
        />
      `
    : null;

  const experienceFormOverride = (editingExperience || addingExperience)
    ? html`
        <${ExperienceForm}
          org=${editingExperience || undefined}
          onSubmit=${handleSaveExperience}
          onCancel=${() => { setEditingExperience(null); setAddingExperience(false); }}
        />
      `
    : null;

  const AboutFormInline = () => {
    const [val, setVal] = React.useState(profile?.summary || '');
    const [saving, setSaving] = React.useState(false);
    const handleSave = async (e) => {
      e.preventDefault();
      setSaving(true);
      try {
        await handleSaveAbout(val);
      } finally {
        setSaving(false);
      }
    };
    return html`
      <form onSubmit=${handleSave} className="space-y-3">
        <textarea
          value=${val}
          onChange=${(e) => setVal(e.target.value)}
          placeholder="Add a short bio..."
          disabled=${saving}
          rows=${4}
          className="w-full px-4 py-2 app-input text-[var(--app-text-primary)] border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <div className="flex gap-2">
          <button type="button" onClick=${() => setEditingAbout(false)} disabled=${saving} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled=${saving} className="px-4 py-2 rounded-lg text-white" style=${{ background: 'var(--app-accent)' }}>${saving ? 'Saving...' : 'Save'}</button>
        </div>
      </form>
    `;
  };

  const aboutFormOverride = editingAbout ? html`<${AboutFormInline} />` : null;

  const responsibilityFormOverride = (editingResponsibility || addingResponsibility)
    ? html`
        <${AdditionalResponsibilityForm}
          entry=${editingResponsibility || undefined}
          onSubmit=${handleSaveResponsibility}
          onCancel=${() => { setEditingResponsibility(null); setAddingResponsibility(false); }}
        />
      `
    : null;

  const achievementFormOverride = (editingAchievement || addingAchievement)
    ? html`
        <${OtherAchievementForm}
          entry=${editingAchievement || undefined}
          onSubmit=${handleSaveAchievement}
          onCancel=${() => { setEditingAchievement(null); setAddingAchievement(false); }}
        />
      `
    : null;

  const clearAllEditing = () => {
    setEditingEducation(null);
    setAddingEducation(false);
    setEditingExperience(null);
    setAddingExperience(false);
    setEditingResponsibility(null);
    setAddingResponsibility(false);
    setEditingAchievement(null);
    setAddingAchievement(false);
    setEditingAbout(false);
  };

  return html`
    <${AppShell} user=${user} onLogout=${onLogout} navItems=${[]} showSettings=${true} sidebarContent=${feedSidebar}>
      <div className="mb-3 px-1" role="status">
        <p className="text-xs font-medium" style=${{ color: 'var(--app-text-muted)' }}>
          <strong style=${{ color: 'var(--app-text-secondary)' }}>Editing your profile</strong>
          — changes here update what others see on your public page.
        </p>
      </div>
      <${ProfileLayout}
        profile=${profileData}
        education=${education}
        experience=${experience}
        additionalResponsibilities=${additionalResponsibilities}
        otherAchievements=${otherAchievements}
        isOwnProfile=${true}
        summary=${profile?.summary}
        editingAbout=${editingAbout}
        onEditAbout=${() => { clearAllEditing(); setEditingAbout(true); }}
        aboutFormOverride=${aboutFormOverride}
        editable=${true}
        onEditEducation=${(e) => { clearAllEditing(); setEditingEducation(e); setAddingEducation(false); }}
        onAddEducation=${() => { clearAllEditing(); setAddingEducation(true); setEditingEducation(null); }}
        onDeleteEducation=${handleDeleteEducation}
        onEditExperience=${(o) => { clearAllEditing(); setEditingExperience(o); setAddingExperience(false); }}
        onAddExperience=${() => { clearAllEditing(); setAddingExperience(true); setEditingExperience(null); }}
        onDeleteExperience=${handleDeleteExperience}
        educationFormOverride=${educationFormOverride}
        experienceFormOverride=${experienceFormOverride}
        editingEducationId=${editingEducation?.id || null}
        addingEducation=${addingEducation}
        editingExperienceId=${editingExperience?.id || null}
        addingExperience=${addingExperience}
        onEditResponsibility=${(r) => { clearAllEditing(); setEditingResponsibility(r); setAddingResponsibility(false); }}
        onAddResponsibility=${() => { clearAllEditing(); setAddingResponsibility(true); setEditingResponsibility(null); }}
        onDeleteResponsibility=${handleDeleteResponsibility}
        responsibilityFormOverride=${responsibilityFormOverride}
        editingResponsibilityId=${editingResponsibility?.id || null}
        addingResponsibility=${addingResponsibility}
        onEditAchievement=${(a) => { clearAllEditing(); setEditingAchievement(a); setAddingAchievement(false); }}
        onAddAchievement=${() => { clearAllEditing(); setAddingAchievement(true); setEditingAchievement(null); }}
        onDeleteAchievement=${handleDeleteAchievement}
        achievementFormOverride=${achievementFormOverride}
        editingAchievementId=${editingAchievement?.id || null}
        addingAchievement=${addingAchievement}
        onProfilePhotoRefresh=${refresh}
      />
    </${AppShell}>
  `;
};

export default ProfessionalProfileView;
