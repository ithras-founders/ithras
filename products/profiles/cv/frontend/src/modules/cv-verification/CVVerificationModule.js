import React, { useState, useEffect } from 'react';
import htm from 'htm';
import { getCVs, getCV, verifyCV, getUsers, getCVTemplate, verifyCVEntry } from '/core/frontend/src/modules/shared/services/api.js';
import { UserRole } from '/core/frontend/src/modules/shared/types.js';
import { useToast } from '/core/frontend/src/modules/shared/index.js';
import { DynamicCVPreview } from '/core/frontend/src/modules/shared/cv/index.js';
import { useTutorialContext } from '/core/frontend/src/modules/tutorials/index.js';
import { getTutorialMockData } from '/core/frontend/src/modules/tutorials/context/tutorialMockData.js';

const html = htm.bind(React.createElement);

const getProofUrl = (url) => {
  if (!url) return '';
  return url.startsWith('/') && typeof window !== 'undefined' && window.API_URL
    ? (window.API_URL || '/api').replace('/api', '') + url
    : url;
};

const getVerificationStatus = (cvData, sectionId, entryIndex, bulletIndex) => {
  const ver = cvData?.verification || {};
  const sec = ver[sectionId] || {};
  const entryKey = String(entryIndex ?? 0);
  const entryVer = sec[entryKey];
  if (!entryVer) return null;
  if (bulletIndex != null) {
    const bullets = entryVer.bullets || {};
    return bullets[String(bulletIndex)] || null;
  }
  return entryVer.entry || (typeof entryVer.status === 'string' ? entryVer : null);
};

const extractVerifiablePoints = (cvData, template) => {
  const sections = template?.config?.sections || [];
  const points = [];
  const includedSections = cvData._includedSections || {};

  sections.forEach((section) => {
    if (section.optional && includedSections[section.id] === false) return;
    const sectionData = cvData[section.id] || {};
    const entries = sectionData.entries || [];
    const proofLevel = entries[0]?._proofLevel || 'point';

    if (proofLevel === 'section' && entries[0]?._sectionProofUrl) {
      points.push({
        sectionId: section.id,
        sectionTitle: section.title,
        entryIndex: 0,
        bulletIndex: -1,
        label: 'Entire Section',
        text: `All points in "${section.title}"`,
        proofUrl: entries[0]._sectionProofUrl,
        proofType: 'section',
      });
    }

    if (section.layoutStyle === 'vertical_label_grouped') {
      const et = (section.entryTypes || [])[0];
      const hasAchievementBuckets = et?.fields?.some((f) => f.id === 'achievementBuckets');
      const hasLegacyAchievements = et?.fields?.some((f) => f.id === 'achievements');
      if (hasAchievementBuckets || hasLegacyAchievements) {
        entries.forEach((entry, ei) => {
          const buckets = Array.isArray(entry.achievementBuckets) && entry.achievementBuckets.length > 0
            ? entry.achievementBuckets
            : (Array.isArray(entry.achievements) ? [{ label: 'Key Achievements', bullets: entry.achievements }] : []);
          let globalBi = 0;
          buckets.forEach((bucket) => {
            if (proofLevel === 'category' && bucket.proofUrl) {
              points.push({
                sectionId: section.id,
                sectionTitle: section.title,
                entryIndex: ei,
                bulletIndex: -1,
                label: `${entry.company || 'Experience'} - ${bucket.label || 'Category'}`,
                text: `All points in "${bucket.label}"`,
                proofUrl: bucket.proofUrl,
                proofType: 'category',
              });
            }
            const bullets = bucket.bullets || [];
            bullets.forEach((item) => {
              const text = typeof item === 'object' ? item?.text : item;
              if (!text) return;
              points.push({
                sectionId: section.id,
                sectionTitle: section.title,
                entryIndex: ei,
                bulletIndex: globalBi++,
                label: `${entry.company || 'Experience'} - ${entry.role || ''} > ${bucket.label || 'Achievements'}`,
                text,
                proofUrl: proofLevel === 'point' ? (typeof item === 'object' ? item?.proofUrl : null) : null,
                proofType: 'point',
              });
            });
          });
        });
      }
    } else if (section.layoutStyle === 'label_left_content_right' && (section.subCategories || section.useDynamicBuckets)) {
      entries.forEach((entry, ei) => {
        const buckets = section.useDynamicBuckets && Array.isArray(entry.buckets) && entry.buckets.length > 0
          ? entry.buckets
          : (section.subCategories || []).map((sub) => ({ label: sub.label, bullets: entry[sub.fieldId] || [] }));
        let globalBi = 0;
        buckets.forEach((bucket) => {
          if (proofLevel === 'category' && bucket.proofUrl) {
            points.push({
              sectionId: section.id,
              sectionTitle: section.title,
              entryIndex: ei,
              bulletIndex: -1,
              label: bucket.label,
              text: `All points in "${bucket.label}"`,
              proofUrl: bucket.proofUrl,
              proofType: 'category',
            });
          }
          const bullets = bucket.bullets || [];
          bullets.forEach((item) => {
            const text = typeof item === 'object' ? item?.text : item;
            if (!text) return;
            points.push({
              sectionId: section.id,
              sectionTitle: section.title,
              entryIndex: ei,
              bulletIndex: globalBi++,
              label: bucket.label,
              text,
              proofUrl: proofLevel === 'point' ? (typeof item === 'object' ? item?.proofUrl : null) : null,
              proofType: 'point',
              subFieldId: bucket.label,
            });
          });
        });
      });
    }
  });

  return points;
};

const CVVerificationModule = ({ user }) => {
  const toast = useToast();
  const { isTutorialMode, getTutorialData } = useTutorialContext();
  const [cvs, setCVs] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCV, setSelectedCV] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [rejectNotes, setRejectNotes] = useState('');
  const [rejectingPoint, setRejectingPoint] = useState(null);
  const [pointRejectNotes, setPointRejectNotes] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [verifyingPointKey, setVerifyingPointKey] = useState(null);
  const [selectedProofUrl, setSelectedProofUrl] = useState(null);
  const [showRejectCVModal, setShowRejectCVModal] = useState(false);

  useEffect(() => {
    if (isTutorialMode) {
      const mock = getTutorialData('PLACEMENT_TEAM') ?? getTutorialMockData('PLACEMENT_TEAM');
      const allCvs = mock.cvSubmissions || [];
      const filtered = filterStatus ? allCvs.filter(cv => cv.status === filterStatus) : allCvs;
      setCVs(filtered);
      setStudents(mock.cvStudents || []);
      setLoading(false);
      return;
    }
    fetchData();
  }, [filterStatus, isTutorialMode]);

  useEffect(() => {
    if (selectedCV?.template_id && !selectedTemplate) {
      getCVTemplate(selectedCV.template_id)
        .then(setSelectedTemplate)
        .catch(() => setSelectedTemplate(null));
    } else if (!selectedCV) {
      setSelectedTemplate(null);
      setSelectedProofUrl(null);
    }
  }, [selectedCV?.id, selectedCV?.template_id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const filters = {};
      if (user.institution_id) filters.institution_id = user.institution_id;
      if (filterStatus) filters.status = filterStatus;

      const [cvsData, usersRes] = await Promise.all([
        getCVs(filters),
        getUsers({ role: UserRole.CANDIDATE, limit: 500 })
      ]);

      setCVs(Array.isArray(cvsData) ? cvsData : []);
      setStudents(usersRes?.items ?? []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setCVs([]);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCV = async (cvId, status, notes) => {
    try {
      await verifyCV(cvId, { status, verified_by: user.id, notes });
      toast.success(`CV ${status.toLowerCase()} successfully!`);
      fetchData();
      setSelectedCV(null);
    } catch (error) {
      toast.error('Failed to verify CV: ' + (error.message || 'Unknown error'));
    }
  };

  const pointKey = (p) => `${p.sectionId}-${p.entryIndex}-${p.bulletIndex}`;

  const handleVerifyPoint = async (cvId, point, status, notes) => {
    setVerifyingPointKey(pointKey(point));
    try {
      await verifyCVEntry(cvId, {
        section_id: point.sectionId,
        entry_index: point.entryIndex,
        bullet_index: point.bulletIndex,
        status,
        notes: notes || '',
        verified_by: user.id,
      });
      if (selectedCV?.id === cvId) {
        const updated = await getCV(cvId);
        setSelectedCV(updated);
      }
      toast.success(`Point ${status.toLowerCase()}`);
    } catch (error) {
      toast.error('Failed: ' + (error.message || 'Unknown error'));
    } finally {
      setVerifyingPointKey(null);
    }
  };

  const handleVerifyAllRemaining = async () => {
    if (!selectedCV) return;
    const unverified = points.filter(p => {
      const ver = getVerificationStatus(selectedCV.data, p.sectionId, p.entryIndex, p.bulletIndex);
      return !ver;
    });
    for (const point of unverified) {
      await handleVerifyPoint(selectedCV.id, point, 'VERIFIED', '');
    }
    toast.success('All remaining points verified');
  };

  const getStudentName = (candidateId) => {
    const student = students.find(s => s.id === candidateId);
    return student ? student.name : 'Unknown';
  };

  const getStudentUser = (candidateId) => {
    return students.find(s => s.id === candidateId) || { id: candidateId, name: 'Unknown', email: '' };
  };

  const points = selectedCV?.data && selectedTemplate
    ? extractVerifiablePoints(selectedCV.data, selectedTemplate)
    : [];

  const verifiedCount = points.filter(p => {
    const ver = getVerificationStatus(selectedCV?.data, p.sectionId, p.entryIndex, p.bulletIndex);
    return ver?.status === 'VERIFIED';
  }).length;

  const rejectedCount = points.filter(p => {
    const ver = getVerificationStatus(selectedCV?.data, p.sectionId, p.entryIndex, p.bulletIndex);
    return ver?.status === 'REJECTED';
  }).length;

  const groupedPoints = points.reduce((acc, point) => {
    const key = point.sectionTitle;
    if (!acc[key]) acc[key] = [];
    acc[key].push(point);
    return acc;
  }, {});

  if (loading) {
    return html`<div className="p-20 text-center text-[var(--app-text-muted)]">Loading...</div>`;
  }

  const canModify = selectedCV && selectedCV.status !== 'VERIFIED' && selectedCV.status !== 'REJECTED';

  const renderProofViewer = () => {
    if (!selectedProofUrl) {
      return html`
        <div className="flex flex-col items-center justify-center h-full text-[var(--app-text-muted)] p-8">
          <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" className="mb-3 opacity-50">
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>
          </svg>
          <p className="text-sm">Click a proof to preview it here</p>
        </div>
      `;
    }
    const url = getProofUrl(selectedProofUrl);
    const isImage = /\.(png|jpg|jpeg|gif|webp)$/i.test(selectedProofUrl);
    const isPDF = /\.pdf$/i.test(selectedProofUrl);

    return html`
      <div className="h-full flex flex-col">
        <div className="px-3 py-2 bg-[var(--app-surface-muted)] border-b border-[var(--app-border-soft)] flex items-center justify-between">
          <span className="text-xs font-medium text-[var(--app-text-muted)] uppercase">Proof Viewer</span>
          <div className="flex items-center gap-2">
            <a href=${url} target="_blank" rel="noopener noreferrer" className="text-xs text-[var(--app-accent)] hover:underline">Open in new tab</a>
            <button onClick=${() => setSelectedProofUrl(null)} className="text-[var(--app-text-muted)] hover:text-[var(--app-text-secondary)]">
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-[var(--app-bg-elevated)]">
          ${isImage ? html`
            <img src=${url} alt="Proof" className="max-w-full max-h-full object-contain rounded shadow-[var(--app-shadow-card)]" />
          ` : isPDF ? html`
            <iframe src=${url} className="w-full h-full border-0 rounded shadow-[var(--app-shadow-card)]" style=${{ minHeight: '500px' }} />
          ` : html`
            <div className="text-center text-[var(--app-text-muted)]">
              <p className="mb-2">Cannot preview this file type</p>
              <a href=${url} target="_blank" rel="noopener noreferrer" className="text-[var(--app-accent)] hover:underline">Download</a>
            </div>
          `}
        </div>
      </div>
    `;
  };

  const renderPointRow = (point, idx) => {
    const ver = getVerificationStatus(selectedCV?.data, point.sectionId, point.entryIndex, point.bulletIndex);
    const isVerifying = verifyingPointKey === pointKey(point);
    const hasProof = !!point.proofUrl;
    const statusColor = ver?.status === 'VERIFIED' ? 'bg-[rgba(5,150,105,0.08)] border-[rgba(5,150,105,0.22)]'
      : ver?.status === 'REJECTED' ? 'bg-[rgba(220,38,38,0.08)] border-[rgba(220,38,38,0.22)]'
      : 'bg-[var(--app-surface)] border-[var(--app-border-soft)]';

    return html`
      <div key=${idx} className=${'border rounded-[var(--app-radius-sm)] p-3 transition-all hover:shadow-[var(--app-shadow-subtle)] ' + statusColor}>
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-semibold text-[var(--app-text-muted)] uppercase tracking-wider mb-0.5">${point.label}</div>
            <p className="text-sm text-[var(--app-text-primary)] leading-snug">${point.text}</p>
            ${ver?.notes ? html`<p className="text-xs text-[var(--app-text-muted)] mt-1 italic">${ver.notes}</p>` : ''}
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            ${hasProof ? html`
              <button
                onClick=${() => setSelectedProofUrl(point.proofUrl)}
                className=${'px-2 py-1 rounded text-xs font-medium transition-colors '
                  + (selectedProofUrl === point.proofUrl ? 'bg-[var(--app-accent)] text-white' : 'bg-[var(--app-accent-soft)] text-[var(--app-accent)] hover:bg-[rgba(0,113,227,0.14)] border border-[rgba(0,113,227,0.25)]')}
                title="View proof"
              >
                ${/\.(png|jpg|jpeg|gif|webp)$/i.test(point.proofUrl) ? html`
                  <img src=${getProofUrl(point.proofUrl)} alt="" className="h-5 w-5 object-cover rounded inline-block mr-1" />
                ` : ''}
                Proof
              </button>
            ` : html`
              <span className="text-[10px] text-[var(--app-text-muted)] px-2 py-1">No proof</span>
            `}

            ${ver ? html`
              <span className=${'px-2 py-1 rounded text-xs font-bold '
                + (ver.status === 'VERIFIED' ? 'bg-[rgba(5,150,105,0.14)] text-[var(--app-success)]' : 'bg-[rgba(220,38,38,0.14)] text-[var(--app-danger)]')}>
                ${ver.status === 'VERIFIED' ? html`
                  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24" className="inline -mt-0.5"><polyline points="20 6 9 17 4 12"/></svg>
                ` : html`
                  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24" className="inline -mt-0.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                `}
              </span>
            ` : canModify ? html`
              <button
                onClick=${() => handleVerifyPoint(selectedCV.id, point, 'VERIFIED', '')}
                disabled=${isVerifying}
                className="p-1.5 rounded-md bg-[rgba(5,150,105,0.08)] text-[var(--app-success)] hover:bg-[rgba(5,150,105,0.14)] border border-[rgba(5,150,105,0.22)] transition-colors disabled:opacity-50"
                title="Verify this point"
              >
                ${isVerifying ? html`<div className="w-3 h-3 border border-green-600 border-t-transparent rounded-full animate-spin"></div>` : html`
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                `}
              </button>
              <button
                onClick=${() => { setRejectingPoint(point); setPointRejectNotes(''); }}
                disabled=${isVerifying}
                className="p-1.5 rounded-md bg-[rgba(220,38,38,0.08)] text-[var(--app-danger)] hover:bg-[rgba(220,38,38,0.14)] border border-[rgba(220,38,38,0.22)] transition-colors disabled:opacity-50"
                title="Reject this point"
              >
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  };

  const hasFilter = !!filterStatus;
  const clearFilter = () => setFilterStatus('');

  return html`
    <div className="p-6 space-y-6">
      <div className="p-4 bg-[var(--app-surface-muted)] rounded-xl border border-[var(--app-border-soft)]">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <span className="text-xs font-semibold text-[var(--app-text-muted)] uppercase tracking-wider">Filters</span>
          <div className="flex items-center gap-3">
            <select
              value=${filterStatus}
              onChange=${e => setFilterStatus(e.target.value)}
              aria-label="Filter CVs by status"
              className="px-4 py-3 min-w-[180px] border border-[var(--app-border-soft)] rounded-xl text-sm bg-[var(--app-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--app-accent)]/30"
            >
              <option value="">All Statuses</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="VERIFIED">Verified</option>
              <option value="REJECTED">Rejected</option>
              <option value="DRAFT">Draft</option>
            </select>
            ${hasFilter ? html`
              <button onClick=${clearFilter} className="text-xs font-semibold text-[var(--app-accent)] hover:underline">
                Clear
              </button>
            ` : null}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        ${cvs.length === 0 ? html`
          <div className="col-span-full bg-[var(--app-surface)] rounded-[var(--app-radius-md)] border border-[var(--app-border-soft)] p-10 text-center text-[var(--app-text-muted)]">
            No CVs found matching the filters.
          </div>
        ` : cvs.map(cv => {
          const statusStyles = {
            VERIFIED: 'border-[rgba(5,150,105,0.22)] bg-[rgba(5,150,105,0.08)]',
            REJECTED: 'border-[rgba(220,38,38,0.22)] bg-[rgba(220,38,38,0.08)]',
            SUBMITTED: 'border-[rgba(0,113,227,0.25)] bg-[var(--app-accent-soft)]',
            DRAFT: 'border-[var(--app-border-soft)] bg-[var(--app-surface-muted)]',
          };
          const badgeStyles = {
            VERIFIED: 'bg-[rgba(5,150,105,0.14)] text-[var(--app-success)]',
            REJECTED: 'bg-[rgba(220,38,38,0.14)] text-[var(--app-danger)]',
            SUBMITTED: 'bg-[rgba(0,113,227,0.14)] text-[var(--app-accent-hover)]',
            DRAFT: 'bg-[var(--app-bg-elevated)] text-[var(--app-text-secondary)]',
          };
          return html`
            <div
              key=${cv.id}
              onClick=${() => setSelectedCV(cv)}
              className=${'p-4 rounded-[var(--app-radius-md)] border cursor-pointer hover:shadow-[var(--app-shadow-card)] transition-all ' + (statusStyles[cv.status] || 'border-[var(--app-border-soft)] bg-[var(--app-surface)]')}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-[var(--app-text-primary)]">${getStudentName(cv.candidate_id)}</h4>
                <span className=${'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ' + (badgeStyles[cv.status] || 'bg-[var(--app-bg-elevated)] text-[var(--app-text-secondary)]')}>
                  ${cv.status}
                </span>
              </div>
              <div className="text-xs text-[var(--app-text-muted)]">
                ${cv.updated_at ? new Date(cv.updated_at).toLocaleDateString() : ''}
              </div>
            </div>
          `;
        })}
      </div>

      ${selectedCV && html`
        <div className="fixed inset-0 bg-black/35 backdrop-blur-[1px] z-50 flex" onClick=${(e) => { if (e.target === e.currentTarget) setSelectedCV(null); }}>
          <div className="flex w-full h-full">
            <div className="flex-1 flex flex-col bg-[var(--app-surface)] max-w-[55%] h-full overflow-hidden border-r border-[var(--app-border-soft)]">
              <div className="px-4 py-3 border-b border-[var(--app-border-soft)] bg-[var(--app-surface)] sticky top-0 z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-[var(--app-text-primary)]">${getStudentName(selectedCV.candidate_id)}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className=${'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase '
                        + (selectedCV.status === 'VERIFIED' ? 'bg-[rgba(5,150,105,0.14)] text-[var(--app-success)]' :
                           selectedCV.status === 'REJECTED' ? 'bg-[rgba(220,38,38,0.14)] text-[var(--app-danger)]' :
                           selectedCV.status === 'SUBMITTED' ? 'bg-[rgba(0,113,227,0.14)] text-[var(--app-accent-hover)]' :
                           'bg-[var(--app-bg-elevated)] text-[var(--app-text-secondary)]')}>
                        ${selectedCV.status}
                      </span>
                      ${points.length > 0 ? html`
                        <span className="text-xs text-[var(--app-text-muted)]">
                          ${verifiedCount}/${points.length} verified
                          ${rejectedCount > 0 ? html` <span className="text-[var(--app-danger)]">(${rejectedCount} rejected)</span>` : ''}
                        </span>
                      ` : ''}
                    </div>
                  </div>
                  <button onClick=${() => setSelectedCV(null)} className="p-2 rounded-[var(--app-radius-sm)] hover:bg-[var(--app-bg-elevated)] text-[var(--app-text-muted)]">
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
                  </button>
                </div>

                ${points.length > 0 ? html`
                  <div className="mt-2 w-full h-1.5 bg-[var(--app-bg-elevated)] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500 bg-[var(--app-success)]" style=${{ width: `${points.length > 0 ? (verifiedCount / points.length) * 100 : 0}%` }}></div>
                  </div>
                ` : ''}
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                ${points.length === 0 ? html`
                  <div className="text-center text-[var(--app-text-muted)] py-8">
                    <p>No verifiable points found.</p>
                    <p className="text-xs mt-1">The candidate may not have added any bullet points yet.</p>
                  </div>
                ` : Object.entries(groupedPoints).map(([sectionTitle, sectionPoints]) => html`
                  <div key=${sectionTitle}>
                    <h4 className="text-xs font-bold text-[var(--app-text-muted)] uppercase tracking-wider mb-2 px-1">${sectionTitle}</h4>
                    <div className="space-y-2">
                      ${sectionPoints.map((point, idx) => renderPointRow(point, `${sectionTitle}-${idx}`))}
                    </div>
                  </div>
                `)}
              </div>

              ${canModify ? html`
                <div className="px-4 py-3 border-t border-[var(--app-border-soft)] bg-[var(--app-surface)] flex items-center gap-2">
                  <button
                    onClick=${handleVerifyAllRemaining}
                    className="flex-1 px-4 py-2.5 bg-[var(--app-success)] text-white rounded-[var(--app-radius-sm)] font-semibold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                  >
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                    Verify All Remaining
                  </button>
                  <button
                    onClick=${() => { setShowRejectCVModal(true); setRejectNotes(''); }}
                    className="px-4 py-2.5 bg-[rgba(220,38,38,0.08)] text-[var(--app-danger)] border border-[rgba(220,38,38,0.22)] rounded-[var(--app-radius-sm)] font-semibold text-sm hover:bg-[rgba(220,38,38,0.14)] transition-colors"
                  >
                    Reject CV
                  </button>
                </div>
              ` : ''}
            </div>

            <div className="flex-1 bg-[var(--app-surface-muted)] h-full overflow-hidden flex flex-col">
              ${renderProofViewer()}
            </div>
          </div>
        </div>
      `}

      ${rejectingPoint && selectedCV && html`
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[1px] z-[70] flex items-center justify-center p-4">
          <div className="bg-[var(--app-surface)] rounded-[var(--app-radius-md)] max-w-md w-full p-6 shadow-[var(--app-shadow-floating)]">
            <h3 className="text-lg font-bold text-[var(--app-text-primary)] mb-1">Reject Point</h3>
            <p className="text-sm text-[var(--app-text-muted)] mb-3">"${rejectingPoint.text.substring(0, 60)}${rejectingPoint.text.length > 60 ? '...' : ''}"</p>
            <textarea
              value=${pointRejectNotes}
              onChange=${e => setPointRejectNotes(e.target.value)}
              placeholder="Reason for rejection (required)..."
              className="w-full px-3 py-2 rounded-[var(--app-radius-sm)] border border-[var(--app-border-soft)] mb-4 min-h-[80px] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--app-danger)]"
              rows="3"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick=${() => { setRejectingPoint(null); setPointRejectNotes(''); }}
                className="flex-1 px-4 py-2 bg-[var(--app-bg-elevated)] text-[var(--app-text-primary)] rounded-[var(--app-radius-sm)] font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick=${async () => {
                  await handleVerifyPoint(selectedCV.id, rejectingPoint, 'REJECTED', pointRejectNotes);
                  setRejectingPoint(null);
                  setPointRejectNotes('');
                }}
                disabled=${!pointRejectNotes.trim()}
                className="flex-1 px-4 py-2 bg-[var(--app-danger)] text-white rounded-[var(--app-radius-sm)] font-medium text-sm disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      `}

      ${showRejectCVModal && selectedCV && html`
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[1px] z-[70] flex items-center justify-center p-4">
          <div className="bg-[var(--app-surface)] rounded-[var(--app-radius-md)] max-w-md w-full p-6 shadow-[var(--app-shadow-floating)]">
            <h3 className="text-lg font-bold text-[var(--app-text-primary)] mb-1">Reject CV</h3>
            <p className="text-sm text-[var(--app-text-muted)] mb-3">This will reject the entire CV for ${getStudentName(selectedCV.candidate_id)}.</p>
            <textarea
              value=${rejectNotes}
              onChange=${e => setRejectNotes(e.target.value)}
              placeholder="Reason for rejection (required)..."
              className="w-full px-3 py-2 rounded-[var(--app-radius-sm)] border border-[var(--app-border-soft)] mb-4 min-h-[100px] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--app-danger)]"
              rows="4"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick=${() => { setShowRejectCVModal(false); setRejectNotes(''); }}
                className="flex-1 px-4 py-2 bg-[var(--app-bg-elevated)] text-[var(--app-text-primary)] rounded-[var(--app-radius-sm)] font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick=${async () => {
                  await handleVerifyCV(selectedCV.id, 'REJECTED', rejectNotes);
                  setShowRejectCVModal(false);
                  setRejectNotes('');
                }}
                disabled=${!rejectNotes.trim()}
                className="flex-1 px-4 py-2 bg-[var(--app-danger)] text-white rounded-[var(--app-radius-sm)] font-medium text-sm disabled:opacity-50"
              >
                Reject CV
              </button>
            </div>
          </div>
        </div>
      `}
    </div>
  `;
};

export default CVVerificationModule;
