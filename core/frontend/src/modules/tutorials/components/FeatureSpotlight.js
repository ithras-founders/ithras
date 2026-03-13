import React, { useState, useRef, useEffect, useCallback } from 'react';
import htm from 'htm';
import { useTutorialContext } from '../context/TutorialContext.js';

const html = htm.bind(React.createElement);

/**
 * FeatureSpotlight wraps any UI element and adds a pulsing beacon + tooltip
 * when the user is in tutorial/demo mode. In normal mode, renders children only.
 *
 * Usage:
 *   <FeatureSpotlight featureId="shortlist-cap" title="Shortlist Cap" description="...">
 *     <SomeComponent />
 *   </FeatureSpotlight>
 */
const FeatureSpotlight = ({
  featureId,
  title,
  description,
  children,
  position = 'bottom',
  showBeacon = true,
}) => {
  const { isTutorialMode } = useTutorialContext();
  const [isOpen, setIsOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const wrapperRef = useRef(null);
  const tooltipRef = useRef(null);

  const handleClickOutside = useCallback((e) => {
    if (
      wrapperRef.current && !wrapperRef.current.contains(e.target) &&
      tooltipRef.current && !tooltipRef.current.contains(e.target)
    ) {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, handleClickOutside]);

  if (!isTutorialMode || dismissed) {
    return children;
  }

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-3',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-3',
    left: 'right-full top-1/2 -translate-y-1/2 mr-3',
    right: 'left-full top-1/2 -translate-y-1/2 ml-3',
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-[var(--app-accent)] border-l-transparent border-r-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-[var(--app-accent)] border-l-transparent border-r-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-[var(--app-accent)] border-t-transparent border-b-transparent border-r-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-[var(--app-accent)] border-t-transparent border-b-transparent border-l-transparent',
  };

  return html`
    <div
      ref=${wrapperRef}
      className="relative inline-block"
      data-spotlight-id=${featureId}
    >
      ${children}

      ${showBeacon && !isOpen ? html`
        <button
          onClick=${() => setIsOpen(true)}
          className="absolute -top-1 -right-1 z-10 w-5 h-5 flex items-center justify-center"
          aria-label=${`Learn about ${title}`}
        >
          <span className="absolute inline-flex w-full h-full rounded-full bg-[var(--app-accent)] opacity-40 animate-ping" />
          <span className="relative inline-flex w-3 h-3 rounded-full bg-[var(--app-accent)] border-2 border-white shadow-sm" />
        </button>
      ` : null}

      ${isOpen ? html`
        <div
          ref=${tooltipRef}
          className=${`absolute z-50 ${positionClasses[position]} w-72 bg-[var(--app-surface)] rounded-[var(--app-radius-lg)] border border-[var(--app-accent)] shadow-lg`}
          style=${{ boxShadow: '0 0 0 1px var(--app-accent), 0 4px 16px rgba(0,0,0,0.12)' }}
        >
          <div className=${`absolute w-0 h-0 border-[6px] ${arrowClasses[position]}`} />
          <div className="p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h4 className="text-sm font-bold text-[var(--app-text-primary)]">${title}</h4>
              <button
                onClick=${() => { setIsOpen(false); setDismissed(true); }}
                className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded text-[var(--app-text-muted)] hover:text-[var(--app-text-primary)] hover:bg-[var(--app-surface-muted)]"
                aria-label="Dismiss"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-xs text-[var(--app-text-secondary)] leading-relaxed">${description}</p>
          </div>
        </div>
      ` : null}
    </div>
  `;
};

/**
 * Spotlight definition registry. Components can query this to know
 * which spotlights exist for a given view.
 */
export const SPOTLIGHT_DEFINITIONS = {
  // -- Candidate --
  'shortlist-cap': { title: 'Shortlist Cap', description: 'Your institution limits the total number of shortlists you can hold. This counter shows your current usage vs the maximum allowed.', position: 'bottom' },
  'tier-distribution': { title: 'Tier Distribution', description: 'Shortlists are distributed across company tiers (Tier 1, Tier 2, Tier 3). This ensures you explore a diverse set of opportunities.', position: 'bottom' },
  'cv-status-badge': { title: 'CV Status', description: 'Your CV can be in Draft (gray), Submitted (blue), or Verified (green) status. Only verified CVs can be attached to applications.', position: 'right' },
  'offer-deadline': { title: 'Offer Deadline', description: 'Each offer has a response deadline. Accept or decline before this date — expired offers are automatically declined.', position: 'bottom' },
  'stage-pipeline': { title: 'Stage Pipeline', description: 'This visual shows your progress through the recruitment stages: Application, Shortlist, Interview, and Offer. Green = passed, pulsing = current.', position: 'bottom' },

  // -- Recruiter --
  'compensation-breakdown': { title: 'Compensation Breakdown', description: 'Total CTC = Fixed + Variable + ESOPs Vested + Joining Bonus + Performance Bonus. All components are visible to candidates before they apply.', position: 'bottom' },
  'bulk-progress': { title: 'Bulk Progression', description: 'Select multiple candidates and progress them to the next stage with one click. The system creates an approval request if required by governance policy.', position: 'left' },
  'jd-status': { title: 'JD Status', description: 'Your Job Description goes through: Draft → Submitted → Under Review → Approved/Rejected. Only approved JDs are visible to candidates.', position: 'right' },
  'slot-assignment': { title: 'Slot Assignment', description: 'Each job is assigned to a slot (Slot 1, 2, 3...). Slot transitions are governed by the placement team and affect which companies recruit simultaneously.', position: 'bottom' },

  // -- Placement Team --
  'policy-caps': { title: 'Policy Caps', description: 'Global caps define the maximum shortlists per student (e.g., 12) and their distribution across tiers. Top-decile exemptions can be enabled per policy.', position: 'bottom' },
  'approval-type-badge': { title: 'Approval Type', description: 'Approvals come in two types: JD Submission (company wants to post a job) and Stage Progression (recruiter wants to advance candidates). Each requires different review criteria.', position: 'right' },
  'cycle-status': { title: 'Cycle Status', description: 'Cycles transition through: DRAFT → APPLICATIONS_OPEN → APPLICATIONS_CLOSED → OFFERS_IN_PROGRESS → COMPLETED. Each transition can be triggered manually or scheduled.', position: 'bottom' },
  'cv-verification-status': { title: 'Verification Status', description: 'CVs go through: Submitted → Under Review → Verified/Rejected. Verified CVs are locked from editing. Rejected CVs include feedback for the student.', position: 'right' },

  // -- System Admin --
  'telemetry-p95': { title: 'P95 Latency', description: '95th percentile response time — 95% of requests complete faster than this value. A key SLO metric for platform health monitoring.', position: 'bottom' },
  'rbac-permission': { title: 'Permission Gate', description: 'Every API endpoint checks the user\'s role permissions before executing. System Admin has all 24 permissions; Faculty Observer has only 4.', position: 'right' },
  'db-connection-pool': { title: 'Connection Pool', description: 'Shows active, idle, and in-transaction database connections. Pool exhaustion causes request failures — monitor this during peak traffic.', position: 'bottom' },
};

export default FeatureSpotlight;
