import React, { useState, useEffect } from 'react';
import htm from 'htm';
import { getStudentAvailability } from '/core/frontend/src/modules/shared/services/api.js';
import { Calendar } from 'lucide-react';

const html = htm.bind(React.createElement);

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const BLOCK_TYPE_COLORS = {
  CLASS: 'bg-[rgba(0,113,227,0.14)] text-[var(--app-accent-hover)]',
  EXAM: 'bg-[rgba(220,38,38,0.14)] text-[var(--app-danger)]',
  PERSONAL: 'bg-[rgba(147,51,234,0.14)] text-[rgb(126,34,206)]',
  INTERVIEW: 'bg-emerald-100 text-emerald-700',
  PRESENTATION: 'bg-amber-100 text-amber-700',
  NETWORKING: 'bg-sky-100 text-sky-700',
  PLACEMENT: 'bg-sky-100 text-sky-700',
};

/**
 * ProfileCalendarSection - compact read-only view of a candidate's weekly availability.
 * Shown on public profiles so recruiters can see when the candidate is typically busy.
 * For own profile: offers "Manage calendar" link.
 */
const ProfileCalendarSection = ({ profileUserId, isOwnProfile, navigate, visibility = 'public' }) => {
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profileUserId) {
      setLoading(false);
      return;
    }
    getStudentAvailability(profileUserId)
      .then((data) => {
        setBlocks(data?.timetable_blocks || []);
      })
      .catch(() => setBlocks([]))
      .finally(() => setLoading(false));
  }, [profileUserId]);

  if (visibility !== 'public') return null;
  if (loading) {
    return html`
      <section className="bg-[var(--app-surface)] rounded-xl border border-[var(--app-border-soft)] p-6 shadow-[var(--app-shadow-subtle)]">
        <div className="flex items-center gap-2 mb-4">
          <${Calendar} className="w-5 h-5 text-[var(--app-text-muted)]" strokeWidth={1.5} />
          <h2 className="text-sm font-semibold text-[var(--app-text-primary)] uppercase tracking-wider">Availability</h2>
        </div>
        <div className="h-20 animate-pulse bg-[var(--app-surface-muted)] rounded-lg" />
      </section>
    `;
  }

  const hasBlocks = blocks.length > 0;
  const blocksByDay = DAYS.map((_, dayIdx) =>
    blocks.filter((b) => b.day_of_week === dayIdx)
  );

  return html`
    <section className="bg-[var(--app-surface)] rounded-xl border border-[var(--app-border-soft)] p-6 shadow-[var(--app-shadow-subtle)]">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <${Calendar} className="w-5 h-5 text-[var(--app-text-muted)]" strokeWidth={1.5} />
          <h2 className="text-sm font-semibold text-[var(--app-text-primary)] uppercase tracking-wider">Availability</h2>
        </div>
        ${isOwnProfile && navigate ? html`
          <button
            onClick=${() => navigate('calendar')}
            className="text-xs font-semibold text-[var(--app-accent)] hover:underline flex items-center gap-1.5"
          >
            Manage calendar
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
          </button>
        ` : null}
      </div>
      ${!hasBlocks ? html`
        <p className="text-sm text-[var(--app-text-muted)]">
          ${isOwnProfile ? 'Add timetable blocks to show when you\'re typically busy. This helps recruiters schedule interviews.' : 'No availability data yet.'}
        </p>
        ${isOwnProfile && navigate ? html`
          <button
            onClick=${() => navigate('calendar')}
            className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-[var(--app-accent)] text-white text-xs font-semibold rounded-xl hover:bg-[var(--app-accent-hover)] transition-colors"
          >
            <${Calendar} className="w-4 h-4" strokeWidth={1.5} />
            Set up calendar
          </button>
        ` : null}
      ` : html`
        <p className="text-xs text-[var(--app-text-muted)] mb-4">Weekly schedule (busy times)</p>
        <div className="space-y-3">
          ${blocksByDay.map((dayBlocks, dayIdx) => {
            if (dayBlocks.length === 0) return null;
            return html`
              <div key=${dayIdx} className="flex items-start gap-3">
                <span className="w-24 shrink-0 text-xs font-medium text-[var(--app-text-secondary)]">${DAYS[dayIdx]}</span>
                <div className="flex flex-wrap gap-2 min-w-0">
                  ${dayBlocks.map((block) => html`
                    <span
                      key=${block.id}
                      className=${`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold uppercase ${BLOCK_TYPE_COLORS[block.block_type] || 'bg-[var(--app-surface-muted)] text-[var(--app-text-secondary)]'}`}
                    >
                      ${block.block_type || 'Block'}
                      <span className="font-normal opacity-90">${block.start_time || ''}–${block.end_time || ''}</span>
                    </span>
                  `)}
                </div>
              </div>
            `;
          })}
        </div>
      `}
    </section>
  `;
};

export default ProfileCalendarSection;
