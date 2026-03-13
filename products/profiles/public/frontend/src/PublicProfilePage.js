import React, { useState, useEffect } from 'react';
import htm from 'htm';
import {
  getUserProfile,
  getUser,
  getCV,
  getCVs,
  getCVTemplates,
  getTemplateAllocationsForUser,
  getCVTemplate,
  getTemplateAllocations,
} from '/core/frontend/src/modules/shared/services/api.js';
import { useToast } from '/core/frontend/src/modules/shared/index.js';
import { migrateCVData } from '/core/frontend/src/modules/shared/cv/index.js';
import UnifiedProfileView from './UnifiedProfileView.js';
import SectionEditModal from '/products/profiles/cv/frontend/src/modules/cv-maker/components/SectionEditModal.js';
import GenerateCVModal from './GenerateCVModal.js';
import { UserRole } from '/core/frontend/src/modules/shared/types.js';

const html = htm.bind(React.createElement);

const PROFILE_TO_TEMPLATE_SECTION = {
  about: ['summary', 'about', 'objective', 'profile'],
  education: ['education', 'academic_qualifications', 'academic'],
  experience: ['experience', 'work_experience', 'industry_experience'],
  skills: ['skills', 'technical_skills', 'competencies'],
  positions: ['positions_of_responsibility', 'positions'],
  extra_curricular: ['extra_curricular', 'extra_curricular_achievements'],
};

/**
 * Public profile page - fetches user profile (with links) and CV data, renders UnifiedProfileView.
 * Used when view is profile/{userId} and product is profiles.
 */
const PublicProfilePage = ({ view, user, navigate }) => {
  const toast = useToast();
  const [profileData, setProfileData] = useState(null);
  const [cvData, setCvData] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editModalSectionId, setEditModalSectionId] = useState(null);
  const [editModalTemplate, setEditModalTemplate] = useState(null);
  const [editModalCV, setEditModalCV] = useState(null);
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [cvList, setCvList] = useState([]);

  const rawUserId = view?.startsWith('profile/') ? view.split('/')[1] : null;
  const profileUserId = rawUserId === 'me' ? (user?.id || null) : rawUserId;
  const isOwnProfile = user?.id && profileUserId && user.id === profileUserId;

  useEffect(() => {
    if (!profileUserId) {
      setLoading(false);
      return;
    }
    const load = async () => {
      setLoading(true);
      try {
        let data = await getUserProfile(profileUserId).catch(() => null);
        if (!data) {
          const profileUser = await getUser(profileUserId).catch(() => null);
          if (profileUser) {
            data = { user: profileUser, institution_links: [], organization_links: [], profile_type: 'public' };
          }
        }
        if (data) {
          setProfileData(data);
          const cvs = await getCVs({ candidate_id: profileUserId }).catch(() => []);
          const list = Array.isArray(cvs) ? cvs : cvs?.items ?? [];
          setCvList(list);
          const cv = list[0];
          if (cv) {
            const cvDetail = await getCV(cv.id).catch(() => null);
            setCvData(cvDetail || {});
          } else {
            setCvData({});
          }

          if (isOwnProfile && user?.id) {
            let tplList = [];
            const isPlacementOrAdmin = [UserRole.SYSTEM_ADMIN, UserRole.PLACEMENT_TEAM, UserRole.PLACEMENT_ADMIN].includes(user?.role);
            const canSeeAllTemplates = isPlacementOrAdmin && !user?.institution_id;
            const isGeneralUser = (user?.role === 'CANDIDATE' || user?.role === 'PROFESSIONAL') && !user?.institution_id;

            if (canSeeAllTemplates || isGeneralUser) {
              const resp = await getCVTemplates(null, null, { limit: 100 }).catch(() => ({ items: [] }));
              tplList = (resp?.items ?? resp ?? []).filter((t) => t && (t.status === 'PUBLISHED' || !t.status));
              if (tplList.length === 0 && isGeneralUser) {
                const fallback = await getCVTemplates(null, null, { limit: 1 }).catch(() => ({}));
                const items = fallback?.items ?? fallback;
                if (Array.isArray(items) && items[0]) tplList = [items[0]];
              }
            } else if (user?.institution_id) {
              let allocations = await getTemplateAllocationsForUser(user.id).catch(() => []);
              if (Array.isArray(allocations) && allocations.length === 0) {
                allocations = await getTemplateAllocations(user.institution_id).catch(() => []);
              }
              const publishedAllocs = Array.isArray(allocations)
                ? allocations.filter((a) => a.status === 'PUBLISHED' || a.status === 'ALLOCATED')
                : [];
              tplList = await Promise.all(publishedAllocs.map((a) => getCVTemplate(a.template_id))).catch(() => []);
            }
            setTemplates(tplList.filter(Boolean));
          }
        } else {
          setProfileData(null);
        }
      } catch {
        setProfileData(null);
        setCvData(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [profileUserId, isOwnProfile, user?.id, user?.role, user?.institution_id]);

  const primaryTemplate = templates.find((t) => t.id === cvData?.template_id) || templates[0];
  const cvRecord = cvData?.id ? (() => {
    const tpl = templates.find((t) => t.id === cvData.template_id) || primaryTemplate;
    if (!tpl) return cvData;
    const parsed = cvData.data != null && typeof cvData.data === 'object'
      ? migrateCVData({ ...cvData.data }, tpl)
      : {};
    return { ...cvData, data: parsed };
  })() : null;

  const openEditModal = (profileSectionKey) => {
    if (!primaryTemplate) {
      toast.error('No templates available');
      return;
    }
    const possibleIds = PROFILE_TO_TEMPLATE_SECTION[profileSectionKey];
    if (!possibleIds) return;
    const sections = primaryTemplate?.config?.sections || [];
    const section = sections.find((s) => possibleIds.includes(s.id));
    if (!section) {
      toast.error('Section not available for this template');
      return;
    }
    setEditModalTemplate(primaryTemplate);
    setEditModalCV(cvRecord);
    setEditModalSectionId(section.id);
    setEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    setEditModalSectionId(null);
    setEditModalTemplate(null);
    setEditModalCV(null);
  };

  const openGenerateModal = () => setGenerateModalOpen(true);
  const closeGenerateModal = () => setGenerateModalOpen(false);
  const handleCVRefreshed = async () => {
    try {
      const cvs = await getCVs({ candidate_id: profileUserId }).catch(() => []);
      const list = Array.isArray(cvs) ? cvs : cvs?.items ?? [];
      setCvList(list);
      if (list[0]) {
        const cvDetail = await getCV(list[0].id).catch(() => null);
        setCvData(cvDetail || cvData);
      }
    } catch (_) {}
  };

  const handleEditModalSaved = async () => {
    if (cvRecord?.id) {
      try {
        const updated = await getCV(cvRecord.id);
        setCvData(updated || cvData);
      } catch (e) {
        console.warn('Failed to refresh CV after save:', e);
      }
    } else {
      const cvs = await getCVs({ candidate_id: profileUserId }).catch(() => []);
      const cvList = Array.isArray(cvs) ? cvs : cvs?.items ?? [];
      const cv = cvList[0];
      if (cv) {
        const cvDetail = await getCV(cv.id).catch(() => null);
        setCvData(cvDetail || {});
      }
    }
    closeEditModal();
  };

  if (loading) {
    return html`
      <div className="w-full max-w-3xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-24 bg-[var(--app-surface-muted)] rounded" />
          <div className="h-32 bg-[var(--app-surface-muted)] rounded-2xl" />
        </div>
      </div>
    `;
  }
  if (!profileData) {
    return html`
      <div className="w-full max-w-3xl mx-auto px-4 py-8">
        <p className="text-[var(--app-text-muted)]">Profile not found.</p>
      </div>
    `;
  }
  const handleMessage = (otherUserId) => {
    try {
      sessionStorage.setItem('messagesOpenUserId', otherUserId);
    } catch (_) {}
    navigate('messages');
  };

  return html`
    <${UnifiedProfileView}
      profileData=${profileData}
      cvData=${cvData}
      viewer=${user}
      navigate=${navigate}
      isOwnProfile=${isOwnProfile}
      onEditSection=${isOwnProfile ? openEditModal : null}
      onGenerateCV=${isOwnProfile ? openGenerateModal : null}
      emailHidden=${profileData?.user?.email_hidden ?? false}
      onMessage=${!isOwnProfile && navigate ? handleMessage : null}
    />
    ${generateModalOpen ? html`
      <${GenerateCVModal}
        isOpen=${true}
        onClose=${closeGenerateModal}
        templates=${templates}
        savedCVs=${cvList}
        cvRecord=${cvRecord}
        cvData=${cvData}
        user=${user}
        onCVRefreshed=${handleCVRefreshed}
      />
    ` : null}
    ${editModalOpen && editModalTemplate && editModalSectionId ? html`
      <${SectionEditModal}
        template=${editModalTemplate}
        user=${user}
        initialCV=${editModalCV}
        sectionId=${editModalSectionId}
        onClose=${closeEditModal}
        onSaved=${handleEditModalSaved}
      />
    ` : null}
  `;
};

export default PublicProfilePage;
