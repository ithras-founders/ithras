/**
 * Feed Utility Wing - Readiness Dashboard (CV Score, Daily Prep Streak, Top Mentors),
 * Upcoming Engagements (calendar view), and channel Leaderboard. Always visible on feed views.
 */
import React, { useState, useEffect, useCallback } from 'react';
import htm from 'htm';
import { getCalendarSlots, getStudentRelevantSlots } from '/core/frontend/src/modules/shared/services/api.js';
import { apiRequest } from '/core/frontend/src/modules/shared/services/api/apiBase.js';
import { iconMap } from '/core/frontend/src/modules/shared/ui/icons/iconMap.js';

const html = htm.bind(React.createElement);

const CollapsibleWidget = ({ title, icon: Icon, iconClassName = 'text-[var(--cobalt-600)]', headerContent, expanded, onToggle, children }) => {
  return html`
  <section className="rounded-lg border border-[var(--app-border-soft)] bg-white shadow-sm overflow-hidden shrink-0">
    <button
      onClick=${onToggle}
      className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left transition-colors hover:bg-[var(--slate-50)]/50"
      aria-expanded=${expanded}
    >
      ${headerContent || html`
        <h3 className="text-[10px] font-bold uppercase tracking-wider text-[#475569] flex items-center gap-1.5">
          <${Icon} className=${`w-3.5 h-3.5 flex-shrink-0 ${iconClassName}`} />
          ${title}
        </h3>
      `}
      <svg className=${`w-3.5 h-3.5 text-[#475569] flex-shrink-0 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>
    ${expanded ? html`<div className="px-3 py-2 border-t border-[var(--app-border-soft)]">${children}</div>` : null}
  </section>
`;
};

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const CV_SCORE_CIRCUMFERENCE = 100;

const CVScoreRing = ({ score }) => {
  const [offset, setOffset] = useState(CV_SCORE_CIRCUMFERENCE);
  useEffect(() => {
    const target = CV_SCORE_CIRCUMFERENCE - (score / 100) * CV_SCORE_CIRCUMFERENCE;
    const id = requestAnimationFrame(() => setOffset(target));
    return () => cancelAnimationFrame(id);
  }, [score]);
  return html`
    <div className="flex items-center justify-center">
      <div className="relative w-14 h-14">
        <svg className="w-14 h-14 -rotate-90" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="15.9155" fill="none" stroke="var(--slate-200)" strokeWidth="3" />
          <circle
            cx="18" cy="18" r="15.9155"
            fill="none" stroke="var(--cobalt-500)" strokeWidth="3" strokeLinecap="round"
            strokeDasharray=${`${CV_SCORE_CIRCUMFERENCE} ${CV_SCORE_CIRCUMFERENCE}`}
            strokeDashoffset=${offset}
            className="cv-score-ring"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-[var(--cobalt-600)]">${score}%</span>
      </div>
    </div>
  `;
};

const FEED_WIDGET_KEYS = { readiness: 'readiness', mentors: 'mentors', engagements: 'engagements', contributors: 'contributors' };

const FeedUtilityWing = ({ user, communityCode, channelCode, navigate }) => {
  const [widgetExpanded, setWidgetExpanded] = useState({
    [FEED_WIDGET_KEYS.readiness]: true,
    [FEED_WIDGET_KEYS.mentors]: true,
    [FEED_WIDGET_KEYS.engagements]: true,
    [FEED_WIDGET_KEYS.contributors]: true,
  });
  const toggleWidget = (key) => setWidgetExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  const [cvScore, setCvScore] = useState(null);
  const [cvLoading, setCvLoading] = useState(false);
  const [streak, setStreak] = useState(0);
  const [mentors, setMentors] = useState([]);
  const [mentorsLoading, setMentorsLoading] = useState(false);
  const [engagements, setEngagements] = useState([]);
  const [engagementsLoading, setEngagementsLoading] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [leaderboard, setLeaderboard] = useState([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [catMockCount, setCatMockCount] = useState(null);

  const loadCatMockCount = useCallback(async () => {
    if (!user) return;
    try {
      const res = await apiRequest('/v1/prep-cat/history?limit=100', { method: 'GET', quiet: true });
      setCatMockCount(res?.items?.length ?? 0);
    } catch (_) {
      setCatMockCount(null);
    }
  }, [user?.id]);

  const loadCvStrength = useCallback(async () => {
    if (!user) return;
    setCvLoading(true);
    try {
      const res = await apiRequest('/v1/prep-cv/readiness/me', { method: 'GET', quiet: true });
      setCvScore(res?.score ?? null);
    } catch (_) {
      setCvScore(null);
    } finally {
      setCvLoading(false);
    }
  }, [user?.id]);

  const loadStreak = useCallback(async () => {
    if (!user) return;
    try {
      const res = await apiRequest('/v1/prep-progress/me', { method: 'GET', quiet: true });
      setStreak(res?.daily_streak ?? 0);
    } catch (_) {
      setStreak(0);
    }
  }, [user?.id]);

  const loadMentors = useCallback(async () => {
    setMentorsLoading(true);
    try {
      const res = await apiRequest('/v1/prep-community/mentors?limit=5', { method: 'GET', quiet: true });
      setMentors(res?.items ?? []);
    } catch (_) {
      setMentors([]);
    } finally {
      setMentorsLoading(false);
    }
  }, []);

  const loadEngagements = useCallback(async () => {
    if (!user) return;
    setEngagementsLoading(true);
    try {
      const now = new Date();
      const end = new Date(now.getTime() + 31 * 24 * 60 * 60 * 1000);
      const startStr = now.toISOString().slice(0, 10);
      const endStr = end.toISOString().slice(0, 10);
      let slots = [];
      try {
        const data = await getStudentRelevantSlots(user.id, startStr, endStr);
        slots = data?.slots || [];
      } catch (_) {
        const data = await getCalendarSlots({ start_date: startStr, end_date: endStr });
        slots = Array.isArray(data) ? data : [];
      }
      setEngagements(slots);
    } catch (_) {
      setEngagements([]);
    } finally {
      setEngagementsLoading(false);
    }
  }, [user?.id]);

  const loadLeaderboard = useCallback(async () => {
    if (!channelCode) return;
    setLeaderboardLoading(true);
    try {
      const res = await apiRequest(`/v1/prep-community/channels/${encodeURIComponent(channelCode)}/leaderboard?limit=10`);
      setLeaderboard(res?.items ?? []);
    } catch (_) {
      setLeaderboard([]);
    } finally {
      setLeaderboardLoading(false);
    }
  }, [channelCode]);

  useEffect(() => {
    loadCvStrength();
  }, [loadCvStrength]);

  useEffect(() => {
    loadStreak();
  }, [loadStreak]);

  useEffect(() => {
    loadMentors();
  }, [loadMentors]);

  useEffect(() => {
    loadEngagements();
  }, [loadEngagements]);

  useEffect(() => {
    if (channelCode) loadLeaderboard();
    else setLeaderboard([]);
  }, [channelCode, loadLeaderboard]);

  useEffect(() => {
    loadCatMockCount();
  }, [loadCatMockCount]);

  const GaugeIcon = iconMap.gauge;
  const FlameIcon = iconMap.flame;
  const UserCircleIcon = iconMap.user;
  const BadgeCheckIcon = iconMap.badgeCheck;
  const CalendarIcon = iconMap.calendar;

  const { year, month } = calendarMonth;
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPad = firstDay.getDay();
  const daysInMonth = lastDay.getDate();
  const calendarDays = [];
  for (let i = 0; i < startPad; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);
  const engagementDates = new Set(
    engagements
      .filter((e) => e.start_time)
      .map((e) => new Date(e.start_time).toDateString())
  );
  const today = new Date();
  const isToday = (d) => d !== null && year === today.getFullYear() && month === today.getMonth() && d === today.getDate();

  const nextEngagements = engagements
    .filter((e) => e.start_time && new Date(e.start_time) >= today)
    .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
    .slice(0, 5);

  const monthLabel = new Date(year, month).toLocaleString('default', { month: 'short', year: 'numeric' });

  return html`
    <aside className="hidden lg:block w-[300px] shrink-0 pr-0">
      <div className="space-y-2 pt-0">
        <${CollapsibleWidget}
          title="Readiness Dashboard"
          icon=${GaugeIcon}
          iconClassName="text-[var(--cobalt-600)]"
          expanded=${widgetExpanded[FEED_WIDGET_KEYS.readiness]}
          onToggle=${() => toggleWidget(FEED_WIDGET_KEYS.readiness)}
        >
          <div className="space-y-2">
            <div className="rounded-lg border border-[var(--app-border-soft)] bg-white p-2">
              <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--slate-500)] mb-1">CV Score</p>
              ${cvLoading
                ? html`<div className="h-14 bg-[var(--slate-100)]/80 rounded-lg animate-pulse" />`
                : cvScore != null
                  ? html`<${CVScoreRing} score=${cvScore} />`
                  : html`<p className="text-xs text-[var(--slate-500)] py-2 leading-relaxed">Add a CV to see your strength</p>`}
            </div>
            <div className="pt-2 mt-2 border-t border-[var(--app-border-soft)]">
              <p className="text-[9px] font-semibold uppercase tracking-wider text-[#475569] mb-1">Daily Prep Streak</p>
              <div className="flex items-center gap-1.5">
                <${FlameIcon} className="w-4 h-4 text-[var(--cobalt-600)]" />
                <span className="text-lg font-bold text-[var(--feed-text-primary)]">${streak}</span>
                <span className="text-xs text-[#475569]">day${streak !== 1 ? 's' : ''}</span>
              </div>
            </div>
            ${navigate && html`
            <div className="pt-2 mt-2 border-t border-[var(--app-border-soft)]">
              <p className="text-[9px] font-semibold uppercase tracking-wider text-[#475569] mb-1">CAT Prep</p>
              <button
                onClick=${() => navigate('preparation/cat')}
                className="w-full py-2 rounded-lg bg-[var(--cobalt-600)] text-white font-medium text-xs hover:bg-[var(--cobalt-500)] transition-all duration-200"
              >
                ${catMockCount != null && catMockCount > 0 ? `${catMockCount} mock${catMockCount !== 1 ? 's' : ''} taken` : 'Take mock'}
              </button>
            </div>
            `}
          </div>
        <//>

        <${CollapsibleWidget}
          title="Top Mentors Online"
          icon=${UserCircleIcon}
          iconClassName="text-[var(--cobalt-600)]"
          expanded=${widgetExpanded[FEED_WIDGET_KEYS.mentors]}
          onToggle=${() => toggleWidget(FEED_WIDGET_KEYS.mentors)}
        >
          ${mentorsLoading
            ? html`<div className="space-y-2"><div className="h-6 bg-[var(--slate-100)]/80 rounded animate-pulse" /><div className="h-6 bg-[var(--slate-100)]/80 rounded animate-pulse" /><div className="h-6 bg-[var(--slate-100)]/80 rounded animate-pulse" /></div>`
            : mentors.length === 0
              ? html`<p className="text-xs text-[var(--slate-500)] py-2 leading-relaxed">No mentors online yet</p>`
              : html`
                  <div className="space-y-0.5">
                    ${mentors.map((m) => html`
                      <div key=${m.user_id || m.id} className="flex items-center gap-2 py-1.5">
                        <div className="w-6 h-6 rounded-full bg-[var(--status-success-bg)] flex items-center justify-center text-[var(--color-green-500)] text-[10px] font-semibold flex-shrink-0">
                          ${(m.name || m.email || '?').charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-[var(--feed-text-primary)] truncate">${m.name || 'Mentor'}</p>
                          ${m.verification_score != null ? html`<p className="text-[10px] text-[#475569]">Score: ${m.verification_score}</p>` : null}
                        </div>
                        ${m.is_verified ? html`<${BadgeCheckIcon} className="w-3 h-3 text-[var(--cobalt-600)] flex-shrink-0" />` : null}
                      </div>
                    `)}
                  </div>
                `}
        <//>

        <${CollapsibleWidget}
          title="Upcoming Engagements"
          icon=${CalendarIcon}
          iconClassName="text-[var(--cobalt-600)]"
          expanded=${widgetExpanded[FEED_WIDGET_KEYS.engagements]}
          onToggle=${() => toggleWidget(FEED_WIDGET_KEYS.engagements)}
        >
          ${engagementsLoading
              ? html`<div className="space-y-2"><div className="h-24 bg-[var(--slate-100)]/80 rounded animate-pulse" /><div className="h-12 bg-[var(--slate-100)]/80 rounded animate-pulse" /></div>`
            : html`
                <div>
                <div className="mb-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-[var(--feed-text-primary)]">${monthLabel}</span>
                    <div className="flex gap-0.5">
                      <button
                        onClick=${() => setCalendarMonth((m) => (m.month === 0 ? { year: m.year - 1, month: 11 } : { ...m, month: m.month - 1 }))}
                        className="p-1 rounded text-[#475569] hover:bg-[var(--slate-100)]/80 transition-all duration-200"
                        aria-label="Previous month"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                      </button>
                      <button
                        onClick=${() => setCalendarMonth((m) => (m.month === 11 ? { year: m.year + 1, month: 0 } : { ...m, month: m.month + 1 }))}
                        className="p-1 rounded text-[#475569] hover:bg-[var(--slate-100)]/80 transition-all duration-200"
                        aria-label="Next month"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-7 gap-x-0.5 gap-y-1 text-center">
                    ${DAY_LABELS.map((label) => html`<span key=${label} className="text-[9px] font-semibold text-[#475569]">${label}</span>`)}
                    ${calendarDays.map((d, i) => {
                      if (d === null) return html`<span key=${`pad-${i}`} />`;
                      const dateKey = new Date(year, month, d).toDateString();
                      const hasEngagement = engagementDates.has(dateKey);
                      return html`
                        <div
                          key=${d}
                          className=${`w-5 h-5 flex items-center justify-center text-[9px] font-medium rounded ${isToday(d) ? 'bg-[var(--cobalt-600)] text-white' : hasEngagement ? 'bg-[var(--cobalt-soft)] text-[var(--cobalt-600)]' : 'text-[var(--slate-600)]'}`}
                        >
                          ${d}
                        </div>
                      `;
                    })}
                  </div>
                </div>
                <div className="border-t border-[var(--app-border-soft)] pt-2 mt-2">
                  <p className="text-[9px] font-semibold uppercase tracking-wider text-[#475569] mb-1">Next up</p>
                  ${nextEngagements.length === 0
                    ? html`<p className="text-xs text-[var(--slate-500)] py-2 leading-relaxed">No upcoming engagements</p>`
                    : html`
                        <div className="space-y-0.5">
                          ${nextEngagements.map((slot) => html`
                            <div key=${slot.id} className="flex items-center gap-2 py-1.5">
                              <div className="w-7 h-7 rounded-lg bg-[var(--cobalt-soft)] flex flex-col items-center justify-center text-[var(--cobalt-600)] text-[9px] font-semibold leading-tight flex-shrink-0">
                                ${slot.start_time ? new Date(slot.start_time).getDate() : '-'}
                                <span className="text-[7px] opacity-80">${slot.start_time ? new Date(slot.start_time).toLocaleDateString('default', { month: 'short' }).slice(0, 1) : ''}</span>
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-medium text-[var(--feed-text-primary)] truncate">${slot.slot_type || 'Engagement'}</p>
                                <p className="text-[10px] text-[#475569]">${slot.start_time ? new Date(slot.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</p>
                              </div>
                            </div>
                          `)}
                        </div>
                      `}
                  ${navigate ? html`
                    <button
                      onClick=${() => navigate('calendar')}
                      className="mt-2 w-full py-1 text-[10px] font-medium text-[var(--cobalt-600)] hover:underline transition-all duration-200"
                    >
                      View full calendar
                    </button>
                  ` : null}
                </div>
                </div>
              `}
        <//>

        ${channelCode ? html`
        <${CollapsibleWidget}
          title="Top Contributors"
          icon=${iconMap.trophy}
          iconClassName="text-[var(--cobalt-600)]"
          expanded=${widgetExpanded[FEED_WIDGET_KEYS.contributors]}
          onToggle=${() => toggleWidget(FEED_WIDGET_KEYS.contributors)}
        >
          ${leaderboardLoading
            ? html`<div className="space-y-2"><div className="h-6 bg-[var(--slate-100)]/80 rounded animate-pulse" /><div className="h-6 bg-[var(--slate-100)]/80 rounded animate-pulse" /><div className="h-6 bg-[var(--slate-100)]/80 rounded animate-pulse" /></div>`
            : leaderboard.length === 0
              ? html`<p className="text-xs text-[var(--slate-500)] py-2 leading-relaxed">No contributions yet</p>`
              : html`
                  <div className="space-y-0.5">
                    ${leaderboard.map((item, idx) => html`
                      <div key=${item.user_id} className="flex items-center gap-2 py-1.5 min-w-0">
                        <span className="w-4 text-[10px] font-bold text-[#475569]">${idx + 1}</span>
                        <div className="w-5 h-5 rounded-full bg-[var(--cobalt-soft)] flex items-center justify-center text-[var(--cobalt-600)] text-[10px] font-semibold">
                          ${(item.name || '?').charAt(0).toUpperCase()}
                        </div>
                        <span className="flex-1 truncate text-xs font-medium text-[var(--feed-text-primary)]">${item.name || 'Anonymous'}</span>
                        <span className="text-[10px] font-semibold text-[var(--cobalt-600)]">${item.score ?? 0}</span>
                      </div>
                    `)}
                  </div>
                `}
        <//>
        ` : null}
      </div>
    </aside>
  `;
};

export default FeedUtilityWing;
export { CollapsibleWidget };
