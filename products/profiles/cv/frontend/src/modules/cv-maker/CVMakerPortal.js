import React, { useMemo, useState, useEffect } from 'react';
import htm from 'htm';
import {
  getTemplateAllocations,
  getTemplateAllocationsForUser,
  getCVTemplate,
  getCVs,
  getCV,
  getCVTemplates,
  getPrograms,
  createUserProfileChangeRequest,
  getUserProfileChangeRequests,
  getUserProfile,
  getApiBaseUrl,
} from '/core/frontend/src/modules/shared/services/api.js';
import { UserRole } from '/core/frontend/src/modules/shared/types.js';
import { useToast, SkeletonLoader } from '/core/frontend/src/modules/shared/index.js';
import { isDemoUser } from '/core/frontend/src/modules/shared/utils/demoUtils.js';
import { useTutorialContext } from '/core/frontend/src/modules/tutorials/index.js';
import { getTutorialMockData } from '/core/frontend/src/modules/tutorials/context/tutorialMockData.js';
import { migrateCVData, deriveEditableSections } from '/core/frontend/src/modules/shared/cv/index.js';
import TemplatePicker from './pages/TemplatePicker.js';
import VisualSectionCard from './components/VisualSectionCard.js';
import CVGeneratorView from './pages/CVGeneratorView.js';
import SectionEditModal from './components/SectionEditModal.js';
import ProfilePhoto from './components/ProfilePhoto.js';
import { sectionHasData, countWords, readingScore } from './utils/cvMakerUtils.js';

const html = htm.bind(React.createElement);
const STORAGE_KEY_LAST_TEMPLATE = 'cv-maker-last-template';

const CVMakerPortal = ({ user }) => {
  const toast = useToast();
  const { isTutorialMode, getTutorialData } = useTutorialContext();
  const [templates, setTemplates] = useState([]);
  const [allCVs, setAllCVs] = useState([]);
  const [activeCV, setActiveCV] = useState(null);
  const [loading, setLoading] = useState(true);
  const [screen, setScreen] = useState('profile');
  const [activeTab, setActiveTab] = useState(isTutorialMode ? 'cvs' : 'profile');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedCV, setSelectedCV] = useState(null);
  const [selectedSectionId, setSelectedSectionId] = useState(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [photoUrl, setPhotoUrl] = useState(user?.profile_photo_url || null);
  const [programName, setProgramName] = useState('');
  const [programs, setPrograms] = useState([]);
  const [profileRequests, setProfileRequests] = useState([]);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [submittingProfileRequest, setSubmittingProfileRequest] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState('');
  const [pdfPreviewTitle, setPdfPreviewTitle] = useState('');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editModalSection, setEditModalSection] = useState(null);
  const [editModalTemplate, setEditModalTemplate] = useState(null);
  const [editModalCV, setEditModalCV] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    roll_number: user?.roll_number || '',
    program_id: user?.program_id || '',
    sector_preferences: Array.isArray(user?.sector_preferences) ? user.sector_preferences.join(', ') : '',
  });

  const displayUser = profileData?.user || user;

  useEffect(() => {
    if (displayUser?.program?.name) setProgramName(displayUser.program.name);
    else if (displayUser?.program_id) setProgramName(displayUser.program_id);
  }, [displayUser?.program_id, displayUser?.program?.name]);

  useEffect(() => {
    setProfileForm({
      name: displayUser?.name || '',
      roll_number: displayUser?.roll_number || '',
      program_id: displayUser?.program_id || '',
      sector_preferences: Array.isArray(displayUser?.sector_preferences) ? displayUser.sector_preferences.join(', ') : '',
    });
  }, [displayUser?.name, displayUser?.roll_number, displayUser?.program_id, displayUser?.sector_preferences]);

  useEffect(() => {
    if (displayUser?.profile_photo_url) setPhotoUrl(displayUser.profile_photo_url);
  }, [displayUser?.profile_photo_url]);

  useEffect(() => {
    if (isTutorialMode || isDemoUser(user)) {
      const mock = getTutorialData('CANDIDATE') ?? getTutorialMockData('CANDIDATE');
      setTemplates([
        { id: 'tpl-demo', name: 'IIM Calcutta Standard', sections: [] },
        { id: 'tpl-consulting', name: 'Consulting Format', sections: [] },
        { id: 'tpl-finance', name: 'Finance Format', sections: [] },
      ]);
      setAllCVs(mock.cvs || []);
      setLoading(false);
      return;
    }
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.institution_id, isTutorialMode]);

  const resolvePdfUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${getApiBaseUrl().replace(/\/api$/, '')}${url}`;
  };

  const loadData = async () => {
    const isPlacementOrAdmin = [UserRole.SYSTEM_ADMIN, UserRole.PLACEMENT_TEAM, UserRole.PLACEMENT_ADMIN].includes(user?.role);
    const canSeeAllTemplates = isPlacementOrAdmin && !user?.institution_id;
    const isGeneralUser = (user?.role === 'CANDIDATE' || user?.role === 'PROFESSIONAL') && !user?.institution_id;

    if (!user?.institution_id && !canSeeAllTemplates && !isGeneralUser) {
      setLoading(false);
      toast.error('No institution linked to your account');
      return;
    }
    try {
      setLoading(true);
      let tplList = [];
      let programsList = [];
      let allocations = [];
      if (canSeeAllTemplates || isGeneralUser) {
        const resp = await getCVTemplates(null, null, { limit: 100 }).catch(() => ({ items: [] }));
        tplList = (resp?.items ?? resp ?? []).filter((t) => t && (t.status === 'PUBLISHED' || !t.status));
        if (tplList.length === 0 && isGeneralUser) {
          const fallback = await getCVTemplates(null, null, { limit: 1 }).catch(() => ({}));
          const items = fallback?.items ?? fallback;
          if (Array.isArray(items) && items[0]) tplList = [items[0]];
        }
      } else {
        const institutionIds = new Set();
        try {
          allocations = await getTemplateAllocationsForUser(user.id).catch(() => []);
        } catch (_) {
          allocations = [];
        }
        if (Array.isArray(allocations) && allocations.length === 0 && user?.institution_id) {
          allocations = await getTemplateAllocations(user.institution_id).catch(() => []);
        }
        if (user?.institution_id) institutionIds.add(user.institution_id);
        allocations.forEach((a) => { if (a?.institution_id) institutionIds.add(a.institution_id); });
        const publishedAllocs = Array.isArray(allocations)
          ? allocations.filter(a => a.status === 'PUBLISHED' || a.status === 'ALLOCATED')
          : [];
        tplList = await Promise.all(publishedAllocs.map(a => getCVTemplate(a.template_id)));
        const firstInstId = Array.from(institutionIds)[0] || user?.institution_id;
        if (firstInstId) programsList = await getPrograms(firstInstId).catch(() => []);
      }

      const [profileResp, cvList, reqList] = await Promise.all([
        getUserProfile(user.id).catch(() => null),
        getCVs({ candidate_id: user.id }).catch(() => []),
        getUserProfileChangeRequests(user.id).catch(() => []),
      ]);
      setProfileData(profileResp);
      const finalTpl = tplList.filter(Boolean);
      const cvArray = Array.isArray(cvList) ? cvList : [];

      setTemplates(finalTpl);
      setPrograms(Array.isArray(programsList) ? programsList : []);
      setProfileRequests(Array.isArray(reqList) ? reqList : []);
      setAllCVs(cvArray);

      const hasInstitutionContext = user?.institution_id || (Array.isArray(allocations) && allocations.length > 0);
      if (finalTpl.length === 0 && hasInstitutionContext) {
        toast.error('No templates allocated for your institution(s)');
      }

      if (cvArray.length > 0) {
        const latest = [...cvArray].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))[0];
        try {
          const full = await getCV(latest.id);
          const tpl = finalTpl.find(t => t.id === full.template_id) || finalTpl[0];
          if (tpl) {
            const parsed = migrateCVData(full.data != null && typeof full.data === 'object' ? { ...full.data } : {}, tpl);
            setActiveCV({ ...full, data: parsed, _tpl: tpl });
            setSelectedTemplateId((prev) => prev || full.template_id || tpl.id);
          }
        } catch (e) { console.warn('Operation failed:', e); }
      } else {
        setActiveCV(null);
      }
      if (!selectedTemplateId && finalTpl[0]) setSelectedTemplateId(finalTpl[0].id);
    } catch (err) {
      console.error('CVMakerPortal load:', err);
      toast.error(user?.institution_id
        ? 'Failed to load templates. No templates may be allocated for your institution.'
        : (err.message || 'Unknown error'));
      setTemplates([]);
      setAllCVs([]);
      setActiveCV(null);
      setPrograms([]);
      setProfileRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const pickProfileTemplate = () => {
    if (templates.length === 0) return null;
    const selected = templates.find((t) => t.id === selectedTemplateId);
    if (selected) return selected;
    try {
      const lastTemplateId = localStorage.getItem(STORAGE_KEY_LAST_TEMPLATE);
      const matched = templates.find(t => t.id === lastTemplateId);
      if (matched) return matched;
    } catch (_) { /* localStorage may be unavailable */ }
    return templates[0];
  };

  const openEditModal = (template, cv, sectionId) => {
    if (!template) return;
    const sections = template?.config?.sections || [];
    const sid = sectionId || sections[0]?.id;
    setEditModalTemplate(template);
    setEditModalCV(cv);
    setEditModalSection(sid);
    setEditModalOpen(true);
    try { localStorage.setItem(STORAGE_KEY_LAST_TEMPLATE, template.id); } catch (_) { /* localStorage may be unavailable */ }
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    setEditModalSection(null);
    setEditModalTemplate(null);
    setEditModalCV(null);
  };

  const openGeneratorView = (template, cv) => {
    setSelectedTemplate(template);
    setSelectedCV(cv);
    setSelectedSectionId(null);
    setScreen('generator_view');
    try { localStorage.setItem(STORAGE_KEY_LAST_TEMPLATE, template.id); } catch (_) { /* localStorage may be unavailable */ }
  };

  const handleGenerateCV = () => {
    if (templates.length === 0) {
      toast.error(user?.institution_id ? 'No templates allocated for your institution' : 'No templates available');
      return;
    }
    if (!activeCV) {
      toast.error('Complete your profile details first, then generate CV');
      return;
    }
    if (templates.length > 1 && !selectedTemplateId) {
      setScreen('generator_picker');
      return;
    }
    openGeneratorView(pickProfileTemplate(), activeCV);
  };

  const handleEditSection = (section) => {
    const tpl = pickProfileTemplate();
    if (!tpl) {
      toast.error('No templates available');
      return;
    }
    openEditModal(tpl, activeCV, section.id);
  };

  const handlePickTemplate = (template) => {
    setSelectedTemplateId(template.id);
    if (!activeCV) {
      toast.error('No profile CV found. Please complete profile sections first.');
      setScreen('profile');
      return;
    }
    openGeneratorView(template, activeCV);
  };


  const handleBackFromGenerator = () => {
    setScreen('profile');
    setSelectedTemplate(null);
    setSelectedCV(null);
    setSelectedSectionId(null);
  };

  const handleSubmitProfileUpdate = async () => {
    const nextPrefs = profileForm.sector_preferences.split(',').map((s) => s.trim()).filter(Boolean);
    const currentPrefs = Array.isArray(displayUser?.sector_preferences) ? displayUser.sector_preferences : [];
    const requestedChanges = {};
    if ((profileForm.name || '').trim() !== (displayUser?.name || '')) requestedChanges.name = (profileForm.name || '').trim();
    if ((profileForm.roll_number || '').trim() !== (displayUser?.roll_number || '')) requestedChanges.roll_number = (profileForm.roll_number || '').trim();
    if ((profileForm.program_id || '') !== (displayUser?.program_id || '')) requestedChanges.program_id = profileForm.program_id || null;
    if (JSON.stringify(nextPrefs) !== JSON.stringify(currentPrefs)) requestedChanges.sector_preferences = nextPrefs;
    if (Object.keys(requestedChanges).length === 0) {
      toast.error('No profile changes to submit');
      return;
    }
    try {
      setSubmittingProfileRequest(true);
      await createUserProfileChangeRequest(user.id, { requested_by: user.id, requested_changes: requestedChanges });
      toast.success('Profile update sent for placement approval');
      setShowProfileModal(false);
      const reqList = await getUserProfileChangeRequests(user.id).catch(() => []);
      setProfileRequests(Array.isArray(reqList) ? reqList : []);
    } catch (err) {
      toast.error(err.message || 'Failed to submit profile update request');
    } finally {
      setSubmittingProfileRequest(false);
    }
  };

  const handleOpenCVFromList = async (cvItem, mode = 'generator') => {
    try {
      const full = await getCV(cvItem.id);
      const tpl = templates.find((t) => t.id === full.template_id) || pickProfileTemplate();
      if (!tpl) {
        toast.error('Template missing for this CV');
        return;
      }
      const parsed = migrateCVData(full.data != null && typeof full.data === 'object' ? { ...full.data } : {}, tpl);
      const fullCV = { ...full, data: parsed, _tpl: tpl };
      if (mode === 'edit') {
        openEditModal(tpl, fullCV);
      } else {
        openGeneratorView(tpl, fullCV);
      }
    } catch (err) {
      toast.error(err.message || 'Unable to open CV');
    }
  };

  const handlePreviewSavedPdf = (url, title) => {
    if (!url) {
      toast.error('No saved PDF found for this CV');
      return;
    }
    setPdfPreviewUrl(resolvePdfUrl(url));
    setPdfPreviewTitle(title || 'Saved CV');
    setShowPdfModal(true);
  };

  const handleCVUpdated = (updated) => {
    if (!updated?.id) return;
    setAllCVs((prev) => prev.map((cv) => (cv.id === updated.id ? { ...cv, ...updated } : cv)));
    setSelectedCV((prev) => (prev?.id === updated.id ? { ...prev, ...updated } : prev));
    setActiveCV((prev) => (prev?.id === updated.id ? { ...prev, ...updated } : prev));
  };

  const handleEditModalSaved = async () => {
    await loadData();
    if (editModalCV?.id && screen === 'generator_view') {
      try {
        const full = await getCV(editModalCV.id);
        const tpl = editModalTemplate || templates.find((t) => t.id === full.template_id);
        if (tpl) {
          const parsed = migrateCVData(full.data != null && typeof full.data === 'object' ? { ...full.data } : {}, tpl);
          setSelectedCV({ ...full, data: parsed, _tpl: tpl });
        }
      } catch (e) { console.warn('Operation failed:', e); }
    }
    closeEditModal();
  };

  const profileTemplate = useMemo(
    () => templates.find((t) => t.id === selectedTemplateId) || activeCV?._tpl || templates[0] || null,
    [templates, selectedTemplateId, activeCV?._tpl]
  );
  const cvData = activeCV?.data || {};
  const sections = useMemo(
    () => deriveEditableSections(profileTemplate) || profileTemplate?.config?.sections || [],
    [profileTemplate]
  );
  const totalSections = sections.length || 1;
  const completedSections = sections.filter((section) => sectionHasData(section, cvData)).length;
  const completionPct = Math.round((completedSections / totalSections) * 100);
  const words = countWords(cvData);
  const latestProfileRequest = Array.isArray(profileRequests) && profileRequests.length > 0 ? profileRequests[0] : null;
  const pendingProfileRequest = Array.isArray(profileRequests) ? profileRequests.find((r) => r.status === 'PENDING') : null;
  const institutionName = displayUser?.institution?.name || displayUser?.institution_id || '';
  const sortedCVs = [...allCVs].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
  const isGeneralUser = (user?.role === 'CANDIDATE' || user?.role === 'PROFESSIONAL') && !user?.institution_id;

  if (loading) {
    return html`<div className="p-6"><${SkeletonLoader} variant="cards" lines=${4} /></div>`;
  }

  if (screen === 'generator_picker') {
    return html`<${TemplatePicker} templates=${templates} user=${displayUser} onPick=${handlePickTemplate} onBack=${() => setScreen('profile')} />`;
  }
  if (screen === 'generator_view' && selectedTemplate) {
    return html`
      <${React.Fragment}>
        <${CVGeneratorView}
          template=${selectedTemplate}
          templates=${templates}
          user=${displayUser}
          cv=${selectedCV}
          onBack=${handleBackFromGenerator}
          onPickTemplate=${() => setScreen('generator_picker')}
          onOpenEditModal=${() => openEditModal(selectedTemplate, selectedCV)}
          onCVUpdated=${handleCVUpdated}
        />
        ${editModalOpen && editModalTemplate ? html`
          <${SectionEditModal}
            template=${editModalTemplate}
            user=${displayUser}
            initialCV=${editModalCV}
            sectionId=${editModalSection}
            onClose=${closeEditModal}
            onSaved=${handleEditModalSaved}
          />
        ` : null}
      </${React.Fragment}>
    `;
  }

  return html`
    <div className="min-h-screen bg-[var(--app-bg)]">
      <div className="w-full max-w-none px-4 py-6">
        <div className="app-card rounded-[var(--app-radius-lg)] overflow-hidden" data-tour-id="cvmaker-header">
          <div className="px-6 py-6 border-b border-[var(--app-border-soft)]">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
              <div className="flex items-end gap-5">
                <${ProfilePhoto} user=${displayUser} photoUrl=${photoUrl} onPhotoChange=${setPhotoUrl} size=${96} />
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-semibold text-[var(--app-text-primary)] tracking-tight">${displayUser?.name || 'Candidate'}</h1>
                    ${user?.role === UserRole.CANDIDATE && !isGeneralUser ? html`
                      <button
                        onClick=${() => setShowProfileModal(true)}
                        disabled=${!!pendingProfileRequest}
                        title=${pendingProfileRequest ? 'Update Pending Approval' : 'Request Profile Update'}
                        className="p-1.5 rounded-[var(--app-radius-sm)] text-[var(--app-text-muted)] hover:text-[var(--app-accent)] hover:bg-[var(--app-accent-soft)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                    ` : ''}
                  </div>
                  <p className="text-sm text-[var(--app-text-muted)] mt-1">${[programName, institutionName].filter(Boolean).join(' · ')}</p>
                  <p className="text-sm text-[var(--app-text-secondary)] mt-1">${user?.email || '-'}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button onClick=${handleGenerateCV} className="app-button-primary px-5 py-2.5 text-sm font-medium">
                  Generate CV
                </button>
                <button
                  onClick=${() => handlePreviewSavedPdf(activeCV?.pdf_url, 'Latest Saved CV')}
                  disabled=${!activeCV?.pdf_url}
                  className="app-button-secondary px-5 py-2.5 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Preview Saved PDF
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="app-card p-4">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--app-text-muted)]">Profile Completion</p>
                <p className="text-2xl font-semibold text-[var(--app-text-primary)] mt-1.5">${completionPct}%</p>
                <p className="text-sm text-[var(--app-text-secondary)] mt-1">${completedSections}/${totalSections} sections complete</p>
              </div>
              <div className="app-card p-4">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--app-text-muted)]">Content Depth</p>
                <p className="text-2xl font-semibold text-[var(--app-text-primary)] mt-1.5">${words} words</p>
                <p className="text-sm text-[var(--app-text-secondary)] mt-1">${readingScore(words)}</p>
              </div>
              <div className="app-card p-4">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--app-text-muted)]">Saved CVs</p>
                <p className="text-2xl font-semibold text-[var(--app-text-primary)] mt-1.5">${allCVs.length}</p>
                <p className="text-sm text-[var(--app-text-secondary)] mt-1">${activeCV?.status ? `Latest: ${activeCV.status}` : 'Start building now'}</p>
              </div>
            </div>

            ${!isGeneralUser && latestProfileRequest ? html`
              <div className=${`mt-4 rounded-[var(--app-radius-sm)] border px-3 py-2 text-sm ${
                latestProfileRequest.status === 'PENDING'
                  ? 'bg-amber-50 border-amber-200 text-amber-800'
                  : latestProfileRequest.status === 'APPROVED'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}>
                ${latestProfileRequest.status === 'PENDING'
                  ? 'Your profile update request is pending placement-team approval.'
                  : latestProfileRequest.status === 'APPROVED'
                    ? 'Your latest profile update request was approved.'
                    : `Your latest profile update request was rejected${latestProfileRequest.rejection_reason ? `: ${latestProfileRequest.rejection_reason}` : '.'}`}
              </div>
            ` : ''}
          </div>
        </div>
      </div>

      <div className="w-full max-w-none px-4 pb-4">
        ${!isGeneralUser ? html`
        <div className="flex items-center justify-between gap-4 border-b border-[var(--app-border-soft)] pb-0">
          <div className="flex items-center gap-1">
            <button
              onClick=${() => setActiveTab('profile')}
              className=${`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${activeTab === 'profile' ? 'border-[var(--app-accent)] text-[var(--app-accent)]' : 'border-transparent text-[var(--app-text-secondary)] hover:text-[var(--app-text-primary)]'}`}
            >
              Profile
            </button>
            <button
              onClick=${() => setActiveTab('cvs')}
              className=${`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${activeTab === 'cvs' ? 'border-[var(--app-accent)] text-[var(--app-accent)]' : 'border-transparent text-[var(--app-text-secondary)] hover:text-[var(--app-text-primary)]'}`}
            >
              CVs
            </button>
          </div>

          ${activeTab === 'profile' ? html`
            <div className="flex items-center gap-2 py-3">
              <label className="text-xs font-medium text-[var(--app-text-muted)] uppercase tracking-wider">Template</label>
              <select
                value=${selectedTemplateId || ''}
                onChange=${(e) => setSelectedTemplateId(e.target.value)}
                className="app-input px-3 py-2 text-sm min-w-[200px]"
              >
                ${templates.map((tpl) => html`<option key=${tpl.id} value=${tpl.id}>${tpl.name || tpl.id}</option>`)}
              </select>
            </div>
          ` : null}
        </div>

        ${activeTab === 'profile' ? html`
          <div className="py-4">
            ${sections.length === 0 ? html`
              <div className="bg-[var(--app-surface)] rounded-[var(--app-radius-md)] border border-[var(--app-border-soft)] p-10 text-center text-[var(--app-text-muted)]">
                <p className="font-medium">No template allocated yet</p>
                <p className="text-sm mt-1">Contact your institution admin to get a CV template assigned.</p>
              </div>
            ` : html`
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                ${sections.map(section => html`
                  <${VisualSectionCard}
                    key=${section.id}
                    section=${section}
                    cvData=${cvData}
                    onEdit=${() => handleEditSection(section)}
                  />
                `)}
              </div>
            `}
          </div>
        ` : html`
          <div className="py-4 space-y-2" data-tour-id="cvmaker-list">
            ${sortedCVs.length === 0 ? html`
              <div className="bg-[var(--app-surface)] rounded-[var(--app-radius-md)] border border-[var(--app-border-soft)] p-8 text-center text-[var(--app-text-muted)]">
                No saved CVs yet. Generate and save a PDF to see it here.
              </div>
            ` : sortedCVs.map((cvItem) => {
              const tpl = templates.find((t) => t.id === cvItem.template_id);
              return html`
                <div key=${cvItem.id} className="bg-[var(--app-surface)] rounded-[var(--app-radius-md)] border border-[var(--app-border-soft)] p-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[var(--app-text-primary)]">${tpl?.name || cvItem.template_id || 'Template'}</p>
                      <p className="text-xs text-[var(--app-text-muted)]">Updated ${cvItem.updated_at ? new Date(cvItem.updated_at).toLocaleString() : '-'} · Status: ${cvItem.status || 'DRAFT'}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button onClick=${() => handleOpenCVFromList(cvItem, 'generator')} className="px-3 py-1.5 text-sm border border-[var(--app-border-soft)] rounded-[var(--app-radius-sm)]">Open Generator</button>
                      <button onClick=${() => handleOpenCVFromList(cvItem, 'edit')} className="px-3 py-1.5 text-sm border border-[var(--app-border-soft)] rounded-[var(--app-radius-sm)]">Edit</button>
                      <button onClick=${() => handlePreviewSavedPdf(cvItem.pdf_url, tpl?.name || 'Saved CV PDF')} disabled=${!cvItem.pdf_url} className="px-3 py-1.5 text-sm border border-[var(--app-border-soft)] rounded-[var(--app-radius-sm)] disabled:opacity-50">Preview PDF</button>
                      <a
                        href=${cvItem.pdf_url ? resolvePdfUrl(cvItem.pdf_url) : '#'}
                        download
                        className=${`px-3 py-1.5 text-sm border border-[var(--app-border-soft)] rounded-[var(--app-radius-sm)] ${cvItem.pdf_url ? '' : 'pointer-events-none opacity-50'}`}
                      >
                        Download
                      </a>
                    </div>
                  </div>
                </div>
              `;
            })}
          </div>
        `}
        ` : html`
        <div className="flex items-center gap-2 py-3 border-b border-[var(--app-border-soft)] pb-3">
          <label className="text-xs font-medium text-[var(--app-text-muted)] uppercase tracking-wider">Template</label>
          <select
            value=${selectedTemplateId || ''}
            onChange=${(e) => setSelectedTemplateId(e.target.value)}
            className="app-input px-3 py-2 text-sm min-w-[200px]"
          >
            ${templates.map((tpl) => html`<option key=${tpl.id} value=${tpl.id}>${tpl.name || tpl.id}</option>`)}
          </select>
        </div>
        <div className="py-4">
          ${sections.length === 0 ? html`
            <div className="bg-[var(--app-surface)] rounded-[var(--app-radius-md)] border border-[var(--app-border-soft)] p-10 text-center text-[var(--app-text-muted)]">
              <p className="font-medium">No template available</p>
              <p className="text-sm mt-1">Choose a template above or generate a CV to get started.</p>
            </div>
          ` : html`
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
              ${sections.map(section => html`
                <${VisualSectionCard}
                  key=${section.id}
                  section=${section}
                  cvData=${cvData}
                  onEdit=${() => handleEditSection(section)}
                />
              `)}
            </div>
          `}
        </div>
        `}
      </div>

      ${showProfileModal ? html`
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick=${() => !submittingProfileRequest && setShowProfileModal(false)}>
          <div className="bg-[var(--app-surface)] rounded-[var(--app-radius-lg)] border border-[var(--app-border-soft)] w-full max-w-xl p-6" onClick=${(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-[var(--app-text-primary)]">Request profile updates</h3>
            <p className="text-sm text-[var(--app-text-muted)] mt-1">Changes are sent to placement representatives for approval.</p>
            <div className="mt-4 space-y-3">
              <div><label className="block text-xs font-semibold text-[var(--app-text-secondary)] mb-1">Name</label><input value=${profileForm.name} onChange=${(e) => setProfileForm((p) => ({ ...p, name: e.target.value }))} className="w-full px-3 py-2 rounded-[var(--app-radius-sm)] border border-[var(--app-border-soft)] bg-[var(--app-bg)]" /></div>
              <div><label className="block text-xs font-semibold text-[var(--app-text-secondary)] mb-1">Roll number</label><input value=${profileForm.roll_number} onChange=${(e) => setProfileForm((p) => ({ ...p, roll_number: e.target.value }))} className="w-full px-3 py-2 rounded-[var(--app-radius-sm)] border border-[var(--app-border-soft)] bg-[var(--app-bg)]" /></div>
              <div>
                <label className="block text-xs font-semibold text-[var(--app-text-secondary)] mb-1">Program</label>
                <select value=${profileForm.program_id} onChange=${(e) => setProfileForm((p) => ({ ...p, program_id: e.target.value }))} className="w-full px-3 py-2 rounded-[var(--app-radius-sm)] border border-[var(--app-border-soft)] bg-[var(--app-bg)]">
                  <option value="">Select program</option>
                  ${programs.map((prg) => html`<option key=${prg.id} value=${prg.id}>${prg.name}</option>`)}
                </select>
              </div>
              <div><label className="block text-xs font-semibold text-[var(--app-text-secondary)] mb-1">Sector preferences (comma separated)</label><input value=${profileForm.sector_preferences} onChange=${(e) => setProfileForm((p) => ({ ...p, sector_preferences: e.target.value }))} className="w-full px-3 py-2 rounded-[var(--app-radius-sm)] border border-[var(--app-border-soft)] bg-[var(--app-bg)]" /></div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick=${() => setShowProfileModal(false)} disabled=${submittingProfileRequest} className="px-4 py-2 text-sm rounded-[var(--app-radius-sm)] border border-[var(--app-border-soft)]">Cancel</button>
              <button onClick=${handleSubmitProfileUpdate} disabled=${submittingProfileRequest} className="px-4 py-2 text-sm font-semibold text-white bg-[var(--app-accent)] rounded-[var(--app-radius-sm)] disabled:opacity-50">
                ${submittingProfileRequest ? 'Submitting...' : 'Submit for approval'}
              </button>
            </div>
          </div>
        </div>
      ` : ''}

      ${editModalOpen && editModalTemplate ? html`
        <${SectionEditModal}
          template=${editModalTemplate}
          user=${user}
          initialCV=${editModalCV}
          sectionId=${editModalSection}
          onClose=${closeEditModal}
          onSaved=${handleEditModalSaved}
        />
      ` : null}

      ${showPdfModal ? html`
        <div className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4" onClick=${() => setShowPdfModal(false)}>
          <div className="w-full max-w-6xl h-[88vh] bg-[var(--app-surface)] rounded-[var(--app-radius-lg)] border border-[var(--app-border-soft)] overflow-hidden flex flex-col" onClick=${(e) => e.stopPropagation()}>
            <div className="px-4 py-3 border-b border-[var(--app-border-soft)] flex items-center justify-between">
              <h3 className="font-semibold text-[var(--app-text-primary)]">${pdfPreviewTitle || 'PDF Preview'}</h3>
              <div className="flex items-center gap-2">
                <a href=${pdfPreviewUrl} download className="px-3 py-1.5 text-sm border border-[var(--app-border-soft)] rounded-[var(--app-radius-sm)]">Download</a>
                <button onClick=${() => setShowPdfModal(false)} className="px-3 py-1.5 text-sm border border-[var(--app-border-soft)] rounded-[var(--app-radius-sm)]">Close</button>
              </div>
            </div>
            <div className="flex-1 bg-[var(--app-bg-elevated)]">
              <iframe title="Saved PDF Preview" src=${pdfPreviewUrl} className="w-full h-full"></iframe>
            </div>
          </div>
        </div>
      ` : ''}
    </div>
  `;
};

export default CVMakerPortal;
