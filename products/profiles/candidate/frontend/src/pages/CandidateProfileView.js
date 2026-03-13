import React, { useState, useEffect } from 'react';
import htm from 'htm';
import { getUserProfile, getUser, getCVs, getCV, getUsers, getInstitutions, getPrograms } from '/core/frontend/src/modules/shared/services/api.js';
import { SkeletonLoader, ApiError } from '/core/frontend/src/modules/shared/index.js';
import UnifiedProfileView from '/products/profiles/public/frontend/src/UnifiedProfileView.js';

const html = htm.bind(React.createElement);

const SimilarProfileItem = ({ profile, navigate }) => {
  const headline = [profile.program_name, profile.institution_name].filter(Boolean).join(' • ') || 'Candidate';
  return html`
    <button
      onClick=${() => navigate?.(`candidate/${profile.id}`)}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-transparent hover:border-[var(--app-border-soft)] hover:bg-[var(--app-surface-muted)] transition-colors duration-150 text-left"
    >
      <div className="w-10 h-10 rounded-full bg-[var(--app-surface-muted)] flex items-center justify-center text-sm font-semibold text-[var(--app-text-primary)] shrink-0">
        ${(profile.name || profile.email || '?')[0].toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-[var(--app-text-primary)] truncate">${profile.name || 'Unknown'}</p>
        <p className="text-xs text-[var(--app-text-secondary)] truncate">${headline}</p>
      </div>
    </button>
  `;
};

const CandidateProfileView = ({ candidateId, user, navigate }) => {
  const [profileData, setProfileData] = useState(null);
  const [cvData, setCvData] = useState(null);
  const [similarProfiles, setSimilarProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!candidateId) return;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        let data = await getUserProfile(candidateId).catch(() => null);
        if (!data) {
          const profileUser = await getUser(candidateId).catch(() => null);
          if (profileUser) {
            data = { user: profileUser, institution_links: [], organization_links: [], profile_type: 'public' };
          }
        }
        if (data) {
          setProfileData(data);
          const cvs = await getCVs({ candidate_id: candidateId }).catch(() => []);
          const cvList = Array.isArray(cvs) ? cvs : cvs?.items ?? [];
          const cv = cvList[0];
          if (cv) {
            const cvDetail = await getCV(cv.id).catch(() => null);
            setCvData(cvDetail || {});
          } else {
            setCvData({});
          }
          const u = data.user;
          let inst = null;
          const instId = u?.institution_id || data?.institution_links?.[0]?.institution_id;
          if (instId) {
            const instRes = await getInstitutions({ limit: 500 }).catch(() => ({ items: [] }));
            const insts = instRes?.items ?? [];
            inst = insts.find((i) => i.id === instId);
          }
          const progId = u?.program_id || data?.institution_links?.[0]?.program_id;
          const similarFilters = { role: 'CANDIDATE', limit: 8 };
          if (instId) similarFilters.institution_id = instId;
          if (progId) similarFilters.program_id = progId;
          const similarRes = await getUsers(similarFilters).catch(() => ({ items: [] }));
          const similar = (similarRes?.items ?? [])
            .filter((x) => x.id !== candidateId)
            .slice(0, 6)
            .map((x) => ({ ...x, institution_name: inst?.name || null, program_name: null }));
          setSimilarProfiles(similar);
        } else {
          setProfileData(null);
        }
      } catch (e) {
        setError(e?.message || 'Failed to load profile');
        setProfileData(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [candidateId]);

  const handleBack = () => navigate?.('dashboard');

  if (loading) {
    return html`
      <div className="min-h-screen bg-[var(--app-bg)] py-8 px-4">
        <div className="max-w-6xl mx-auto"><${SkeletonLoader} lines=${8} title=${true} /></div>
      </div>
    `;
  }
  if (error) {
    return html`
      <div className="min-h-screen bg-[var(--app-bg)] py-8 px-4">
        <div className="max-w-6xl mx-auto"><${ApiError} message=${error} onRetry=${() => window.location.reload()} /></div>
      </div>
    `;
  }
  if (!profileData) {
    return html`
      <div className="min-h-screen bg-[var(--app-bg)] py-8 px-4">
        <div className="max-w-6xl mx-auto text-center text-[var(--app-text-muted)] py-20">Candidate not found</div>
        <div className="text-center"><button onClick=${handleBack} className="text-[var(--app-accent)] hover:underline">← Back</button></div>
      </div>
    `;
  }

  return html`
    <div className="min-h-screen bg-[var(--app-bg)]">
      <div className="max-w-6xl mx-auto py-8 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10">
          <div className="min-w-0">
            <${UnifiedProfileView}
              profileData=${profileData}
              cvData=${cvData}
              onBack=${handleBack}
              viewer=${user}
              backLabel="Back"
              navigate=${navigate}
            />
          </div>
          ${similarProfiles.length > 0 ? html`
            <aside className="lg:sticky lg:top-8 lg:self-start hidden lg:block">
              <div className="bg-[var(--app-surface)] rounded-2xl border border-[var(--app-border-soft)] p-5">
                <h3 className="text-xs font-semibold text-[var(--app-text-secondary)] uppercase tracking-wider mb-4">Suggested Candidates</h3>
                <div className="space-y-0.5">
                  ${similarProfiles.map((p) => html`<${SimilarProfileItem} key=${p.id} profile=${p} navigate=${navigate} />`)}
                </div>
              </div>
            </aside>
          ` : null}
        </div>
      </div>
    </div>
  `;
};

export default CandidateProfileView;
