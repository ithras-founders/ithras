import React, { useState, useEffect } from 'react';
import htm from 'htm';
import {
  createJobProfile,
  getJobProfiles,
  getJobProfile,
  updateJobProfile,
  publishJobProfile,
  getMatchStats,
  extractJDFromText,
  createWorkflowFromProfile,
  getInstitutions,
} from '/core/frontend/src/modules/shared/services/api.js';
import { useToast, SkeletonLoader, EmptyState } from '/core/frontend/src/modules/shared/index.js';

const html = htm.bind(React.createElement);

const HRJobProfilesView = ({ user }) => {
  const toast = useToast();
  const isProfessional = user?.role === 'PROFESSIONAL';
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(!isProfessional);
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [matchStats, setMatchStats] = useState(null);
  const [matchStatsProfileId, setMatchStatsProfileId] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    jd_text: '',
    sector: '',
    min_cgpa: '',
    max_backlogs: '',
    skills_keywords: [],
    skills_input: '',
    experience_years_min: '',
  });
  const [extracting, setExtracting] = useState(false);
  const [creatingWorkflow, setCreatingWorkflow] = useState(null);
  const [institutions, setInstitutions] = useState([]);

  useEffect(() => {
    if (isProfessional) {
      setLoading(false);
      return;
    }
    const fetch = async () => {
      try {
        const [profRes, instRes] = await Promise.all([
          getJobProfiles(),
          getInstitutions({ limit: 500 }).catch(() => ({ items: [] })),
        ]);
        setProfiles(profRes?.items || []);
        setInstitutions(instRes?.items ?? []);
      } catch (e) {
        console.error(e);
        toast.error('Failed to load job profiles');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [user?.company_id, isProfessional]);

  const handleExtractJD = async () => {
    if (!form.jd_text.trim() || form.jd_text.length < 50) {
      toast.error('Paste at least 50 characters of JD text to extract');
      return;
    }
    setExtracting(true);
    try {
      const res = await extractJDFromText(form.jd_text);
      setForm((f) => ({
        ...f,
        title: res.title || f.title,
        sector: res.sector || f.sector,
        min_cgpa: res.min_cgpa ?? f.min_cgpa,
        skills_keywords: res.skills_keywords?.length ? res.skills_keywords : f.skills_keywords,
        experience_years_min: res.experience_years_min ?? f.experience_years_min,
      }));
      toast.success('Criteria extracted from JD');
    } catch (e) {
      toast.error(e?.message || 'Extraction failed');
    } finally {
      setExtracting(false);
    }
  };

  const [createWorkflowProfile, setCreateWorkflowProfile] = useState(null);
  const [createWorkflowInstId, setCreateWorkflowInstId] = useState('');

  const handleCreateWorkflow = async (profile, instId) => {
    const inst = instId || createWorkflowInstId;
    if (!inst?.trim()) {
      if (institutions.length > 0) {
        setCreateWorkflowProfile(profile);
      } else {
        toast.error('No institutions found. Add institutions first.');
      }
      return;
    }
    setCreatingWorkflow(profile.id);
    try {
      const res = await createWorkflowFromProfile(profile.id, {
        workflow_name: profile.title || 'New Workflow',
        institution_id: inst.trim(),
      });
      toast.success('Workflow created. Add stages in Placement Cycles.');
      setCreateWorkflowProfile(null);
      setCreateWorkflowInstId('');
    } catch (e) {
      toast.error(e?.message || 'Failed to create workflow');
    } finally {
      setCreatingWorkflow(null);
    }
  };

  const handleLoadStats = async (profileId) => {
    setLoadingStats(true);
    setMatchStats(null);
    setMatchStatsProfileId(null);
    try {
      const res = await getMatchStats(profileId);
      setMatchStats(res);
      setMatchStatsProfileId(profileId);
    } catch (e) {
      toast.error(e?.message || 'Failed to load match stats');
    } finally {
      setLoadingStats(false);
    }
  };

  const handleCreate = async () => {
    if (!form.title.trim()) {
      toast.error('Title is required');
      return;
    }
    setSaving(true);
    try {
      const       data = {
        title: form.title.trim(),
        jd_text: form.jd_text.trim() || null,
        sector: form.sector.trim() || null,
        min_cgpa: form.min_cgpa ? parseFloat(form.min_cgpa) : null,
        max_backlogs: form.max_backlogs ? parseInt(form.max_backlogs, 10) : null,
        skills_keywords: form.skills_keywords,
        experience_years_min: form.experience_years_min ? parseInt(form.experience_years_min, 10) : null,
      };
      await createJobProfile(data);
      toast.success('Job profile created');
      setCreating(false);
      setForm({ title: '', jd_text: '', sector: '', min_cgpa: '', max_backlogs: '', skills_keywords: [], skills_input: '', experience_years_min: '' });
      const res = await getJobProfiles();
      setProfiles(res?.items || []);
    } catch (e) {
      toast.error(e?.message || 'Failed to create');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async (id) => {
    try {
      await publishJobProfile(id);
      toast.success('Job profile published');
      const res = await getJobProfiles();
      setProfiles(res?.items || []);
    } catch (e) {
      toast.error(e?.message || 'Failed to publish');
    }
  };

  const addSkill = () => {
    const s = form.skills_input.trim();
    if (s && !form.skills_keywords.includes(s)) {
      setForm((f) => ({ ...f, skills_keywords: [...f.skills_keywords, s], skills_input: '' }));
    }
  };

  if (loading) {
    return html`<div className="p-8" aria-busy="true"><${SkeletonLoader} lines=${5} title=${true} /></div>`;
  }

  if (isProfessional) {
    return html`
      <div className="max-w-xl">
        <${EmptyState}
          title="For recruiters"
          message="Job Profiles let recruiters define role criteria and match candidates. As a professional, you can view and respond to recruiter outreach in the Outreach section."
          icon=${html`<svg className="w-12 h-12 text-[var(--app-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>`}
        />
      </div>
    `;
  }

  return html`
    <div className="p-8 space-y-6 animate-in">
      <div className="flex items-center justify-end">
        <button
          onClick=${() => setCreating(!creating)}
          className="px-4 py-2 bg-[var(--app-accent)] text-white rounded-xl text-sm font-semibold hover:bg-[var(--app-accent-hover)]"
        >
          ${creating ? 'Cancel' : 'Create Job Profile'}
        </button>
      </div>

      ${creating && html`
        <div className="p-6 bg-[var(--app-surface)] rounded-2xl border border-[var(--app-border-soft)] space-y-4">
          <h3 className="font-semibold text-[var(--app-text-primary)]">New Job Profile</h3>
          <div>
            <label className="block text-xs font-semibold text-[var(--app-text-muted)] uppercase mb-1">Title</label>
            <input
              value=${form.title}
              onInput=${(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Senior Analyst - Consulting"
              className="w-full px-4 py-2 rounded-xl border border-[var(--app-border-soft)] bg-[var(--app-surface-muted)] text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--app-text-muted)] uppercase mb-1">JD Text (optional – paste to AI extract)</label>
            <div className="flex gap-2">
              <textarea
                value=${form.jd_text}
                onInput=${(e) => setForm((f) => ({ ...f, jd_text: e.target.value }))}
                placeholder="Paste job description here (min 50 chars for AI extract)..."
                rows=${4}
                className="flex-1 px-4 py-2 rounded-xl border border-[var(--app-border-soft)] bg-[var(--app-surface-muted)] text-sm"
              />
            </div>
            <button
              onClick=${handleExtractJD}
              disabled=${extracting || !form.jd_text.trim() || form.jd_text.length < 50}
              className="mt-2 px-4 py-2 rounded-lg border border-[var(--app-accent)] text-[var(--app-accent)] text-sm font-medium hover:bg-[var(--app-accent-soft)] disabled:opacity-50"
            >
              ${extracting ? 'Extracting...' : 'Extract criteria from JD'}
            </button>
          </div>
          <div className="flex gap-4 flex-wrap">
            <div>
              <label className="block text-xs font-semibold text-[var(--app-text-muted)] uppercase mb-1">Sector</label>
              <input
                value=${form.sector}
                onInput=${(e) => setForm((f) => ({ ...f, sector: e.target.value }))}
                placeholder="Consulting, Tech..."
                className="w-40 px-4 py-2 rounded-xl border border-[var(--app-border-soft)] bg-[var(--app-surface-muted)] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--app-text-muted)] uppercase mb-1">Min CGPA</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="10"
                value=${form.min_cgpa}
                onInput=${(e) => setForm((f) => ({ ...f, min_cgpa: e.target.value }))}
                placeholder="e.g. 7.0"
                className="w-24 px-4 py-2 rounded-xl border border-[var(--app-border-soft)] bg-[var(--app-surface-muted)] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--app-text-muted)] uppercase mb-1">Max Backlogs</label>
              <input
                type="number"
                min="0"
                value=${form.max_backlogs}
                onInput=${(e) => setForm((f) => ({ ...f, max_backlogs: e.target.value }))}
                placeholder="0"
                className="w-24 px-4 py-2 rounded-xl border border-[var(--app-border-soft)] bg-[var(--app-surface-muted)] text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--app-text-muted)] uppercase mb-1">Skills (keywords)</label>
            <div className="flex gap-2 flex-wrap items-center">
              ${form.skills_keywords.map((s) => html`
                <span key=${s} className="px-2 py-1 bg-[var(--app-accent-soft)] text-[var(--app-accent)] rounded text-sm flex items-center gap-1">
                  ${s}
                  <button type="button" onClick=${() => setForm((f) => ({ ...f, skills_keywords: f.skills_keywords.filter((x) => x !== s) }))} className="text-xs">×</button>
                </span>
              `)}
              <input
                value=${form.skills_input}
                onInput=${(e) => setForm((f) => ({ ...f, skills_input: e.target.value }))}
                onKeyDown=${(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                placeholder="Add skill"
                className="w-28 px-3 py-1.5 rounded-lg border border-[var(--app-border-soft)] text-sm"
              />
              <button type="button" onClick=${addSkill} className="text-sm text-[var(--app-accent)] font-medium">Add</button>
            </div>
          </div>
          <button
            onClick=${handleCreate}
            disabled=${saving || !form.title.trim()}
            className="px-6 py-2.5 bg-[var(--app-accent)] text-white rounded-xl text-sm font-semibold hover:bg-[var(--app-accent-hover)] disabled:opacity-50"
          >
            ${saving ? 'Creating...' : 'Create'}
          </button>
        </div>
      `}

      ${profiles.length === 0 && !creating ? html`
        <${EmptyState} title="No job profiles" message="Create a job profile to define hiring criteria and see match stats." />
      ` : html`
        <div className="space-y-4">
          ${profiles.map((p) => html`
            <div key=${p.id} className="p-6 bg-[var(--app-surface)] rounded-2xl border border-[var(--app-border-soft)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-[var(--app-text-primary)]">${p.title || 'Untitled'}</h3>
                  <p className="text-sm text-[var(--app-text-muted)] mt-1">${p.status} ${p.sector ? '· ' + p.sector : ''} ${p.min_cgpa != null ? '· CGPA ≥ ' + p.min_cgpa : ''}</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick=${() => handleLoadStats(p.id)}
                    disabled=${loadingStats}
                    className="px-4 py-2 rounded-lg border border-[var(--app-border-soft)] text-sm font-medium hover:bg-[var(--app-surface-muted)] disabled:opacity-50"
                  >
                    ${loadingStats ? 'Loading...' : 'Match Stats'}
                  </button>
                  ${createWorkflowProfile?.id === p.id ? html`
                    <div className="flex gap-2 items-center">
                      <select
                        value=${createWorkflowInstId}
                        onChange=${(e) => setCreateWorkflowInstId(e.target.value)}
                        className="px-3 py-2 rounded-lg border border-[var(--app-border-soft)] text-sm"
                      >
                        <option value="">Select institution...</option>
                        ${institutions.map((i) => html`<option key=${i.id} value=${i.id}>${i.name || i.id}</option>`)}
                      </select>
                      <button onClick=${() => handleCreateWorkflow(p, createWorkflowInstId)} disabled=${!createWorkflowInstId || creatingWorkflow === p.id} className="px-4 py-2 bg-[var(--app-accent)] text-white rounded-lg text-sm font-medium">Create</button>
                      <button onClick=${() => setCreateWorkflowProfile(null)} className="text-sm text-[var(--app-text-muted)]">Cancel</button>
                    </div>
                  ` : html`
                    <button
                      onClick=${() => handleCreateWorkflow(p)}
                      disabled=${creatingWorkflow === p.id}
                      className="px-4 py-2 rounded-lg border border-[var(--app-accent)] text-[var(--app-accent)] text-sm font-medium hover:bg-[var(--app-accent-soft)] disabled:opacity-50"
                    >
                      ${creatingWorkflow === p.id ? 'Creating...' : 'Create Workflow'}
                    </button>
                  `}
                  ${p.status === 'DRAFT' && html`
                    <button
                      onClick=${() => handlePublish(p.id)}
                      className="px-4 py-2 bg-[var(--app-success)]/20 text-[var(--app-success)] rounded-lg text-sm font-semibold hover:bg-[var(--app-success)]/30"
                    >
                      Publish
                    </button>
                  `}
                </div>
              </div>
              ${matchStats && matchStatsProfileId === p.id && html`
                <div className="mt-4 p-4 bg-[var(--app-surface-muted)] rounded-xl">
                  <p className="text-lg font-bold text-[var(--app-accent)]">${matchStats.total_matching} candidates match</p>
                  ${matchStats.by_institution?.length > 0 && html`
                    <p className="text-xs font-semibold text-[var(--app-text-muted)] mt-2 uppercase">By institution</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      ${matchStats.by_institution.slice(0, 10).map((i) => html`
                        <span key=${i.id} className="text-sm">${i.name}: ${i.count}</span>
                      `)}
                    </div>
                  `}
                </div>
              `}
            </div>
          `)}
        </div>
      `}
    </div>
  `;
};

export default HRJobProfilesView;
