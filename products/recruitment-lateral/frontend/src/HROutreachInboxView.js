import React, { useState, useEffect } from 'react';
import htm from 'htm';
import { getOutreachList, respondOutreach } from '/core/frontend/src/modules/shared/services/api.js';
import { useToast, SkeletonLoader, EmptyState } from '/core/frontend/src/modules/shared/index.js';

const html = htm.bind(React.createElement);

const HROutreachInboxView = ({ user }) => {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(null);

  const isRecruiter = user?.role === 'RECRUITER';
  const role = isRecruiter ? 'recruiter' : 'candidate';

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getOutreachList(role);
        setItems(res?.items || []);
      } catch (e) {
        if (e?.status === 401) return; // Auth expired – useAuth will redirect to login
        console.error(e);
        toast.error(e?.message || 'Failed to load outreach');
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [role]);

  const handleRespond = async (outreachId, status) => {
    setResponding(outreachId);
    try {
      await respondOutreach(outreachId, status);
      setItems((prev) => prev.map((o) => (o.id === outreachId ? { ...o, status } : o)));
      toast.success(status === 'ACCEPTED' ? 'Connection accepted' : 'Request declined');
    } catch (e) {
      toast.error(e?.message || 'Failed to respond');
    } finally {
      setResponding(null);
    }
  };

  const formatDate = (d) => {
    if (!d) return '';
    const dt = new Date(d);
    const now = new Date();
    const diff = now - dt;
    if (diff < 86400000) return dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diff < 604800000) return dt.toLocaleDateString([], { weekday: 'short' });
    return dt.toLocaleDateString();
  };

  if (loading) {
    return html`<div className="space-y-4"><${SkeletonLoader} variant="listRows" lines=${5} /></div>`;
  }

  if (items.length === 0) {
    return html`
      <div className="max-w-xl">
        <${EmptyState}
          title=${isRecruiter ? 'No outreach sent' : 'No opportunities yet'}
          message=${isRecruiter ? 'Send connection requests from Discovery after finding matching candidates.' : 'When recruiters reach out based on your profile, their messages will appear here.'}
          icon=${html`<svg className="w-12 h-12 text-[var(--app-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>`}
        />
      </div>
    `;
  }

  return html`
    <div className="space-y-4">
      <div className="divide-y divide-[var(--app-border-soft)] rounded-[var(--app-radius-md)] border border-[var(--app-border-soft)] overflow-hidden bg-[var(--app-surface)]">
        ${items.map((o) => html`
          <div
            key=${o.id}
            className="p-4 hover:bg-[var(--app-surface-muted)] transition-colors"
          >
            <div className="flex justify-between items-start gap-4">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-[var(--app-text-primary)]">
                  ${isRecruiter ? (o.candidate_name || o.candidate_email || 'Candidate') : (o.recruiter_name || o.company_name || 'Recruiter')}
                </p>
                ${o.job_profile_title ? html`
                  <p className="text-sm text-[var(--app-text-muted)] mt-0.5">${o.job_profile_title}</p>
                ` : null}
                ${o.company_name && !isRecruiter ? html`
                  <p className="text-sm text-[var(--app-text-muted)]">${o.company_name}</p>
                ` : null}
                ${o.message ? html`
                  <p className="text-sm text-[var(--app-text-secondary)] mt-2 line-clamp-2">${o.message}</p>
                ` : null}
                <p className="text-xs text-[var(--app-text-muted)] mt-2">${formatDate(o.created_at)}</p>
              </div>
              ${!isRecruiter && o.status === 'PENDING' ? html`
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick=${() => handleRespond(o.id, 'ACCEPTED')}
                    disabled=${responding === o.id}
                    className="px-3 py-1.5 text-sm font-medium rounded-[var(--app-radius-sm)] bg-[var(--app-accent)] text-white hover:opacity-90 disabled:opacity-50"
                  >
                    ${responding === o.id ? '...' : 'Accept'}
                  </button>
                  <button
                    onClick=${() => handleRespond(o.id, 'DECLINED')}
                    disabled=${responding === o.id}
                    className="px-3 py-1.5 text-sm font-medium rounded-[var(--app-radius-sm)] border border-[var(--app-border-soft)] text-[var(--app-text-secondary)] hover:bg-[var(--app-surface-muted)] disabled:opacity-50"
                  >
                    Decline
                  </button>
                </div>
              ` : html`
                <span className=${`text-xs font-medium px-2 py-1 rounded-full ${
                  o.status === 'ACCEPTED' ? 'bg-emerald-500/15 text-emerald-600' :
                  o.status === 'DECLINED' ? 'bg-rose-500/15 text-rose-600' :
                  'bg-amber-500/15 text-amber-600'
                }`}>
                  ${o.status}
                </span>
              `}
            </div>
          </div>
        `)}
      </div>
    </div>
  `;
};

export default HROutreachInboxView;
