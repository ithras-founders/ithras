import React, { useState, useEffect, useCallback } from 'react';
import htm from 'htm';
import { getAuditLogs, getEntityAuditTrail } from '/core/frontend/src/modules/shared/services/api.js';
import { getTelemetryAuditLogs } from '/core/frontend/src/modules/shared/services/api/telemetry.js';
import { useTutorialContext } from '/core/frontend/src/modules/tutorials/index.js';

const html = htm.bind(React.createElement);

const DEMO_AUDIT_LOGS = [
  { id: 'al1', action: 'CV_VERIFIED', entity_type: 'cv', entity_id: 'cv-priya-001', user_name: 'Dr. Rajesh Kumar', timestamp: new Date(Date.now() - 180000).toISOString(), details: { student: 'Priya Sharma', template: 'Standard CV' } },
  { id: 'al2', action: 'APPROVAL_APPROVED', entity_type: 'approval', entity_id: 'appr-jd-001', user_name: 'Dr. Rajesh Kumar', timestamp: new Date(Date.now() - 900000).toISOString(), details: { type: 'JD Submission', company: 'Apex Consulting', role: 'Associate Consultant' } },
  { id: 'al3', action: 'APPLICATION_CREATED', entity_type: 'application', entity_id: 'app-arjun-001', user_name: 'Arjun Mehta', timestamp: new Date(Date.now() - 1800000).toISOString(), details: { workflow: 'Apex Placements 2025', role: 'Associate Consultant' } },
  { id: 'al4', action: 'WORKFLOW_UPDATED', entity_type: 'workflow', entity_id: 'wf-gs-001', user_name: 'Dr. Rajesh Kumar', timestamp: new Date(Date.now() - 3600000).toISOString(), details: { workflow: 'Goldman Sachs IB 2025', change: 'Stage added: Final Interview' } },
  { id: 'al5', action: 'CV_CREATED', entity_type: 'cv', entity_id: 'cv-sneha-001', user_name: 'Sneha Patel', timestamp: new Date(Date.now() - 5400000).toISOString(), details: { template: 'Consulting Format' } },
  { id: 'al6', action: 'SHORTLIST_RESPONSE', entity_type: 'shortlist', entity_id: 'sl-rohan-001', user_name: 'Vikram Singh', timestamp: new Date(Date.now() - 7200000).toISOString(), details: { company: 'Apex Consulting', student: 'Rohan Gupta', status: 'Accepted' } },
  { id: 'al7', action: 'USER_LOGIN', entity_type: 'user', entity_id: 'usr-divya-001', user_name: 'Divya Reddy', timestamp: new Date(Date.now() - 10800000).toISOString() },
  { id: 'al8', action: 'POLICY_UPDATED', entity_type: 'policy', entity_id: 'pol-001', user_name: 'Dr. Rajesh Kumar', timestamp: new Date(Date.now() - 14400000).toISOString(), details: { change: 'Tier 1 cap increased from 3 to 4' } },
  { id: 'al9', action: 'APPROVAL_CREATED', entity_type: 'approval', entity_id: 'appr-stage-002', user_name: 'Ananya Das', timestamp: new Date(Date.now() - 18000000).toISOString(), details: { type: 'Stage Progression', from: 'Shortlist', to: 'Interview', students: 3 } },
  { id: 'al10', action: 'CV_VERIFIED', entity_type: 'cv', entity_id: 'cv-aditya-001', user_name: 'Dr. Rajesh Kumar', timestamp: new Date(Date.now() - 21600000).toISOString(), details: { student: 'Aditya Kumar', template: 'Standard CV' } },
];

const ACTION_COLORS = {
  USER_LOGIN: 'bg-[var(--app-accent-soft)] text-[var(--app-accent)]',
  USER_CREATED: 'bg-[rgba(52,199,89,0.12)] text-[var(--app-success)]',
  USER_UPDATED: 'bg-[var(--app-surface-muted)] text-[var(--app-text-secondary)]',
  CV_CREATED: 'bg-[var(--app-accent-soft)] text-[var(--app-accent)]',
  CV_UPDATED: 'bg-[var(--app-accent-soft)] text-[var(--app-accent)]',
  CV_VERIFIED: 'bg-[rgba(52,199,89,0.12)] text-[var(--app-success)]',
  APPLICATION_CREATED: 'bg-[var(--app-accent-soft)] text-[var(--app-accent)]',
  SHORTLIST_RESPONSE: 'bg-[var(--app-accent-soft)] text-[var(--app-accent)]',
  APPROVAL_CREATED: 'bg-[var(--app-surface-muted)] text-[var(--app-text-secondary)]',
  APPROVAL_APPROVED: 'bg-[rgba(52,199,89,0.12)] text-[var(--app-success)]',
  APPROVAL_REJECTED: 'bg-[rgba(255,59,48,0.12)] text-[var(--app-danger)]',
  WORKFLOW_CREATED: 'bg-[var(--app-accent-soft)] text-[var(--app-accent)]',
  WORKFLOW_UPDATED: 'bg-[var(--app-accent-soft)] text-[var(--app-accent)]',
  STAGE_ADDED: 'bg-[var(--app-accent-soft)] text-[var(--app-accent)]',
  POLICY_CREATED: 'bg-[var(--app-surface-muted)] text-[var(--app-text-secondary)]',
  POLICY_UPDATED: 'bg-[var(--app-surface-muted)] text-[var(--app-text-secondary)]',
  PROFILE_CHANGE_REQUESTED: 'bg-[var(--app-surface-muted)] text-[var(--app-text-secondary)]',
  PROFILE_CHANGE_APPROVED: 'bg-[rgba(52,199,89,0.12)] text-[var(--app-success)]',
  PROFILE_CHANGE_REJECTED: 'bg-[rgba(255,59,48,0.12)] text-[var(--app-danger)]',
  INSTITUTION_CREATED: 'bg-[var(--app-accent-soft)] text-[var(--app-accent)]',
  INSTITUTION_UPDATED: 'bg-[var(--app-accent-soft)] text-[var(--app-accent)]',
  COMPANY_CREATED: 'bg-[var(--app-accent-soft)] text-[var(--app-accent)]',
  COMPANY_UPDATED: 'bg-[var(--app-accent-soft)] text-[var(--app-accent)]',
};

const ACTION_ICONS = {
  USER_LOGIN: 'M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0',
  CV_CREATED: 'M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z',
  APPROVAL_APPROVED: 'M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
  APPROVAL_REJECTED: 'M9.75 9.75l4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
};

const formatTimestamp = (v) => {
  if (!v) return '';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return '';
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
};

const formatAction = (action) =>
  (action || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

const parseDetails = (details) => {
  if (!details) return null;
  if (typeof details === 'object') return details;
  try { return JSON.parse(details); } catch { return null; }
};

const ACTION_TYPES = [
  'USER_LOGIN', 'USER_CREATED', 'USER_UPDATED',
  'CV_CREATED', 'CV_UPDATED', 'CV_VERIFIED',
  'APPLICATION_CREATED', 'SHORTLIST_RESPONSE',
  'APPROVAL_CREATED', 'APPROVAL_APPROVED', 'APPROVAL_REJECTED',
  'WORKFLOW_CREATED', 'WORKFLOW_UPDATED', 'STAGE_ADDED',
  'POLICY_CREATED', 'POLICY_UPDATED',
  'PROFILE_CHANGE_REQUESTED', 'PROFILE_CHANGE_APPROVED', 'PROFILE_CHANGE_REJECTED',
  'INSTITUTION_CREATED', 'INSTITUTION_UPDATED',
  'COMPANY_CREATED', 'COMPANY_UPDATED',
];

const AuditTrailPanel = ({
  entityType,
  entityId,
  institutionId,
  companyId,
  userId,
  logs: externalLogs,
  title = 'Activity Timeline',
  compact = false,
  limit: initialLimit = 20,
  showFilters = true,
  apiSource = 'audit',
}) => {
  const { isTutorialMode } = useTutorialContext();
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [actionFilter, setActionFilter] = useState('');
  const [displayLimit, setDisplayLimit] = useState(initialLimit);

  const fetchLogs = useCallback(async () => {
    if (externalLogs) {
      setLogs(externalLogs);
      setTotal(externalLogs.length);
      return;
    }
    if (isTutorialMode) {
      const filtered = actionFilter
        ? DEMO_AUDIT_LOGS.filter(l => l.action === actionFilter)
        : DEMO_AUDIT_LOGS;
      setLogs(filtered.slice(0, displayLimit));
      setTotal(filtered.length);
      return;
    }
    setLoading(true);
    try {
      let result;
      if (entityType && entityId) {
        result = await getEntityAuditTrail(entityType, entityId, { limit: displayLimit });
      } else {
        const filters = { limit: displayLimit };
        if (userId) filters.user_id = userId;
        if (institutionId) filters.institution_id = institutionId;
        if (companyId) filters.company_id = companyId;
        if (actionFilter) filters.action = actionFilter;
        result = apiSource === 'telemetry'
          ? await getTelemetryAuditLogs(filters)
          : await getAuditLogs(filters);
      }
      setLogs(result?.items || []);
      setTotal(result?.total || 0);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId, institutionId, companyId, userId, actionFilter, displayLimit, externalLogs, apiSource, isTutorialMode]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const handleLoadMore = () => setDisplayLimit(prev => prev + 20);

  return html`
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className=${compact ? 'text-sm font-bold text-[var(--app-text-secondary)]' : 'text-lg font-semibold text-[var(--app-text-primary)]'}>${title}</h3>
        ${total > 0 ? html`
          <span className="text-xs text-[var(--app-text-muted)] font-bold">${total} event${total !== 1 ? 's' : ''}</span>
        ` : ''}
      </div>

      ${showFilters && !entityId ? html`
        <div className="flex gap-2 flex-wrap">
          <select
            value=${actionFilter}
            onChange=${(e) => setActionFilter(e.target.value)}
            className="px-3 py-1.5 border border-[var(--app-border-soft)] rounded-lg text-sm bg-[var(--app-surface)]"
          >
            <option value="">All Actions</option>
            ${ACTION_TYPES.map(a => html`<option key=${a} value=${a}>${formatAction(a)}</option>`)}
          </select>
        </div>
      ` : ''}

      ${loading ? html`
        <div className="py-8 text-center text-[var(--app-text-muted)] animate-pulse text-sm">Loading activity...</div>
      ` : logs.length === 0 ? html`
        <div className="py-8 text-center text-[var(--app-text-muted)] text-sm">No activity recorded yet.</div>
      ` : html`
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-px bg-[var(--app-border-soft)]" />
          <div className="space-y-1">
            ${logs.map((log, idx) => {
              const colorClass = ACTION_COLORS[log.action] || 'bg-[var(--app-surface-muted)] text-[var(--app-text-secondary)]';
              const det = parseDetails(log.details);
              return html`
                <div key=${log.id || idx} className="relative pl-10 py-2 group">
                  <div className="absolute left-2.5 top-3 w-3 h-3 rounded-full border-2 border-[var(--app-surface)] shadow-[var(--app-shadow-subtle)] ${colorClass.split(' ')[0]}" />
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className=${'px-2 py-0.5 rounded text-[10px] font-bold uppercase ' + colorClass}>
                          ${formatAction(log.action)}
                        </span>
                        ${log.entity_type ? html`
                          <span className="text-[10px] text-[var(--app-text-muted)] font-mono">${log.entity_type}${log.entity_id ? ':' + (log.entity_id.length > 12 ? log.entity_id.slice(-12) : log.entity_id) : ''}</span>
                        ` : ''}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-[var(--app-text-secondary)]">
                        ${log.user_name ? html`<span className="font-medium text-[var(--app-text-secondary)]">${log.user_name}</span>` : ''}
                        ${log.user_email && !log.user_name ? html`<span>${log.user_email}</span>` : ''}
                        ${!log.user_name && !log.user_email && log.user_id ? html`<span className="font-mono text-[var(--app-text-muted)]">${log.user_id}</span>` : ''}
                      </div>
                      ${det ? html`
                        <div className="mt-1 text-xs text-[var(--app-text-muted)] truncate max-w-md">
                          ${Object.entries(det).filter(([, v]) => v != null && v !== '').slice(0, 3).map(([k, v]) => html`
                            <span key=${k} className="mr-3">${k.replace(/_/g, ' ')}: ${Array.isArray(v) ? v.join(', ') : String(v)}</span>
                          `)}
                        </div>
                      ` : ''}
                    </div>
                    <span className="text-[10px] text-[var(--app-text-muted)] whitespace-nowrap shrink-0 mt-0.5">
                      ${formatTimestamp(log.timestamp)}
                    </span>
                  </div>
                </div>
              `;
            })}
          </div>
        </div>
      `}

      ${!loading && logs.length < total ? html`
        <div className="text-center pt-2">
          <button
            onClick=${handleLoadMore}
            className="px-4 py-1.5 text-xs font-bold text-[var(--app-accent)] hover:bg-[var(--app-accent-soft)] rounded-lg transition-colors"
          >
            Load More (${total - logs.length} remaining)
          </button>
        </div>
      ` : ''}
    </div>
  `;
};

export default AuditTrailPanel;
