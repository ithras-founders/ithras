import React, { useState, useEffect } from 'react';
import htm from 'htm';
import {
  getJobProfiles,
  getDiscoveryCandidates,
  getMatchStats,
  getInstitutions,
  aiRankCandidates,
  sendOutreach,
} from '/core/frontend/src/modules/shared/services/api.js';
import { useToast, SkeletonLoader, EmptyState } from '/core/frontend/src/modules/shared/index.js';

const html = htm.bind(React.createElement);

const HRDiscoveryView = ({ user, navigate }) => {
  const toast = useToast();
  const isProfessional = user?.role === 'PROFESSIONAL';
  const [profiles, setProfiles] = useState([]);
  const [selectedProfileId, setSelectedProfileId] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [total, setTotal] = useState(0);
  const [matchStats, setMatchStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [institutions, setInstitutions] = useState([]);
  const [rankedCandidates, setRankedCandidates] = useState(null);
  const [ranking, setRanking] = useState(false);
  const [outreachSending, setOutreachSending] = useState(null);

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
        if (profRes?.items?.length > 0 && !selectedProfileId) setSelectedProfileId(profRes.items[0].id);
      } catch (e) {
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [user?.company_id, isProfessional]);

  useEffect(() => {
    if (!selectedProfileId) {
      setCandidates([]);
      setTotal(0);
      setMatchStats(null);
      setLoadingCandidates(false);
      return;
    }
    setLoadingCandidates(true);
    Promise.all([
      getDiscoveryCandidates({ job_profile_id: selectedProfileId, limit: 50 }),
      getMatchStats(selectedProfileId),
    ])
      .then(([candRes, statsRes]) => {
        setCandidates(candRes?.items || []);
        setTotal(candRes?.total ?? 0);
        setMatchStats(statsRes);
      })
      .catch((e) => {
        toast.error(e?.message || 'Failed to load candidates');
        setCandidates([]);
        setTotal(0);
      })
      .finally(() => setLoadingCandidates(false));
  }, [selectedProfileId]);

  const handleProfileClick = (c) => navigate(`profile/${c.id}`);

  const handleAiRank = async () => {
    if (!selectedProfileId || candidates.length === 0) {
      toast.error('Select a profile and load candidates first');
      return;
    }
    setRanking(true);
    setRankedCandidates(null);
    try {
      const ids = candidates.map((c) => c.id);
      const res = await aiRankCandidates(selectedProfileId, ids, Math.min(20, ids.length));
      setRankedCandidates(res?.candidates || []);
      toast.success(`Ranked ${res?.candidates?.length || 0} candidates`);
    } catch (e) {
      toast.error(e?.message || 'AI rank failed');
    } finally {
      setRanking(false);
    }
  };

  const handleSendOutreach = async (candidateId, e) => {
    e?.stopPropagation?.();
    if (!selectedProfileId) {
      toast.error('Select a job profile first');
      return;
    }
    setOutreachSending(candidateId);
    try {
      await sendOutreach({
        candidate_id: candidateId,
        job_profile_id: selectedProfileId,
        message: `I'd like to connect regarding a role that may interest you.`,
      });
      toast.success('Outreach sent');
    } catch (err) {
      toast.error(err?.message || 'Failed to send outreach');
    } finally {
      setOutreachSending(null);
    }
  };

  if (loading) {
    return html`<div className="p-8" aria-busy="true"><${SkeletonLoader} lines=${5} title=${true} /></div>`;
  }

  if (isProfessional) {
    return html`
      <div className="max-w-xl p-8">
        <${EmptyState}
          title="For recruiters"
          message="Discovery lets recruiters find and shortlist candidates by job criteria. As a professional, you can view and respond to recruiter outreach in the Outreach section."
          icon=${html`<svg className="w-12 h-12 text-[var(--app-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>`}
        />
      </div>
    `;
  }

  return html`
    <div className="p-8 space-y-6 animate-in">
      <p className="text-sm text-[var(--app-text-secondary)]">
        Browse candidates who match your job profile criteria. Select a job profile to see matching candidates.
      </p>

      <div className="flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs font-semibold text-[var(--app-text-muted)] uppercase mb-1">Job Profile</label>
          <select
            value=${selectedProfileId}
            onChange=${(e) => { setSelectedProfileId(e.target.value); setRankedCandidates(null); }}
            className="px-4 py-2 rounded-xl border border-[var(--app-border-soft)] bg-[var(--app-surface)] text-sm min-w-[200px]"
          >
            <option value="">Select a profile...</option>
            ${profiles.map((p) => html`<option key=${p.id} value=${p.id}>${p.title || 'Untitled'}</option>`)}
          </select>
        </div>
        ${candidates.length > 0 && html`
          <button
            onClick=${handleAiRank}
            disabled=${ranking}
            className="px-4 py-2 bg-[var(--app-accent)] text-white rounded-xl text-sm font-semibold hover:bg-[var(--app-accent-hover)] disabled:opacity-50"
          >
            ${ranking ? 'Ranking...' : 'AI Rank'}
          </button>
        `}
      </div>

      ${matchStats && selectedProfileId && html`
        <div className="p-4 bg-[var(--app-accent-soft)] rounded-xl border border-[var(--app-accent)]/30">
          <p className="text-lg font-bold text-[var(--app-accent)]">${matchStats.total_matching ?? total} candidates match your criteria</p>
          ${matchStats.by_institution?.length > 0 && html`
            <p className="text-xs font-semibold text-[var(--app-text-muted)] mt-2">Top institutions</p>
            <div className="flex flex-wrap gap-3 mt-1 text-sm">
              ${matchStats.by_institution.slice(0, 8).map((i) => html`
                <span key=${i.id}>${i.name}: ${i.count}</span>
              `)}
            </div>
          `}
        </div>
      `}

      ${loadingCandidates ? html`
        <div className="space-y-3"><${SkeletonLoader} lines=${6} /></div>
      ` : candidates.length === 0 ? html`
        <${EmptyState}
          title="No candidates"
          message=${selectedProfileId ? 'No candidates match this job profile. Try relaxing criteria.' : 'Select a job profile to discover candidates.'}
        />
      ` : html`
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          ${candidates.map((c) => {
            const initial = (c.name || c.email || '?').charAt(0).toUpperCase();
            const headline = c.student_subtype || c.role || '';
            return html`
              <div
                key=${c.id}
                onClick=${() => handleProfileClick(c)}
                className="p-4 bg-[var(--app-surface)] rounded-2xl border border-[var(--app-border-soft)] hover:border-[var(--app-accent)]/40 cursor-pointer transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[var(--app-accent-soft)] flex items-center justify-center overflow-hidden flex-shrink-0">
                    ${c.profile_photo_url ? html`<img src=${c.profile_photo_url} alt="" className="w-full h-full object-cover" />` : html`<span className="text-lg font-semibold text-[var(--app-accent)]">${initial}</span>`}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[var(--app-text-primary)] truncate">${c.name || c.email || 'Unknown'}</h3>
                    ${headline && html`<p className="text-sm text-[var(--app-text-secondary)] truncate">${headline}</p>`}
                    ${c.cgpa != null && html`<p className="text-xs text-[var(--app-text-muted)]">CGPA: ${c.cgpa}</p>`}
                  </div>
                  <span className="text-xs text-[var(--app-accent)] font-medium">View</span>
                </div>
              </div>
            `;
          })}
        </div>
      `}
    </div>
  `;
};

export default HRDiscoveryView;
