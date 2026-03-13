/**
 * Tour step definitions per role.
 * Each step: { target (CSS selector), title, content, view? (navigate before showing) }
 *
 * ~140+ steps across all roles, covering every view, interaction, and micro-feature.
 */
import { UserRole } from '../../shared/types.js';

const CANDIDATE_STEPS = [
  // -- Dashboard (8 steps) --
  { target: '[data-tour-id="candidate-header"]', title: 'Welcome to Your Placement Hub', content: 'Meet Priya, a final-year MBA student. This is your command center for campus placements — real-time governance tracking, shortlist caps, and active recruitment windows all in one view.', view: 'dashboard' },
  { target: '[data-tour-id="governance-cards"]', title: 'Governance at a Glance', content: 'The Master Shortlist Registry shows your used slots vs. cap (3/15 used). Tier Enforcement tracks per-tier limits — ensuring fair distribution across Tier 1 consulting, Tier 2 finance, and Tier 3 sectors. This is institutional-grade compliance built into the student experience.', view: 'dashboard' },
  { target: '[data-tour-id="company-grid"]', title: 'Live Company Intelligence', content: 'Every recruiting company is here — Apex Consulting (₹35L, Consulting), Goldman Sachs (₹32L, Finance), Amazon (₹25L, Tech), and more. Click any card to see job descriptions, compensation ranges, required skills, and Hire Archives showing past placements by name, year, and role.', view: 'dashboard' },
  { target: '[data-tour-id="view-cycle-intel"]', title: 'Cycle Intelligence Engine', content: '24 companies, 156 roles, 892 applications, ₹28.5L average compensation — all computed in real-time. Drill into historical vs. current cycles, compare year-over-year trends, and access granular placement summaries by company.', view: 'dashboard' },
  { target: '[data-tour-id="offers-section"]', title: 'My Offers', content: 'Pending offers from recruiters appear here. Accept or decline each offer with one click. Offers show company, role, and CTC — manage your placement outcomes in real time.', view: 'dashboard' },
  { target: '[data-tour-id="notification-bell"]', title: 'Real-Time Notifications', content: 'The notification bell lights up when something needs your attention — new shortlists, offer updates, deadline reminders, and stage progressions. Never miss a critical placement event.', view: 'dashboard' },
  { target: '[data-tour-id="profile-switcher"]', title: 'Profile Switching', content: 'If you belong to multiple institutions or programs, switch profiles without logging out. Your active profile determines which placements, governance rules, and company data you see.', view: 'dashboard' },
  { target: '[data-tour-id="application-cards"]', title: 'Application Progress at a Glance', content: 'Each application card shows your current stage in the pipeline — Application, Shortlist, Interview — with color-coded status indicators. Expand any card to see the full stage-by-stage progress timeline.', view: 'dashboard' },

  // -- Active Processes (3 steps) --
  { target: '[data-tour-id="active-processes-header"]', title: 'Active Recruitment Pipeline', content: 'Track every process you\'re part of with live status cards. Apex Consulting (Shortlisted), Goldman Sachs (Submitted), Amazon (Submitted) — each card shows company, workflow stage, and real-time progression status.', view: 'active_processes' },
  { target: '[data-tour-id="process-card"]', title: 'Process Detail Cards', content: 'Each card shows the company logo, job title, sector, and your current stage. Color-coded badges — green for Shortlisted, blue for Submitted, amber for In Progress — give instant status at a glance.', view: 'active_processes' },
  { target: '[data-tour-id="process-filters"]', title: 'Filter by Status or Sector', content: 'Filter active processes by status (All, Submitted, Shortlisted, Interview) or by sector (Consulting, Finance, Technology). Quickly find the processes that need your attention.', view: 'active_processes' },

  // -- Applications (5 steps) --
  { target: '[data-tour-id="applications-header"]', title: 'My Applications', content: 'A unified view of all your submissions. Each application shows the workflow name, associated role, and status — Shortlisted (green), Submitted (blue), Rejected (red). This is your single source of truth for placement tracking.', view: 'applications' },
  { target: '[data-tour-id="application-card"]', title: 'Expandable Application Cards', content: 'Click any application to expand it and see the full stage pipeline — Application → Shortlist → Interview. Each stage shows whether you\'ve Passed, are In Progress, or haven\'t reached it yet. Stage transitions are tracked with timestamps.', view: 'applications' },
  { target: '[data-tour-id="stage-pipeline"]', title: 'Visual Stage Pipeline', content: 'The stage pipeline shows your journey through the recruitment process. Green checkmarks for passed stages, a pulsing dot for your current stage, and gray circles for upcoming stages. This is real-time visibility into a traditionally opaque process.', view: 'applications' },
  { target: '[data-tour-id="workflows-list"]', title: 'Apply to Open Positions', content: 'Open placement cycles appear with real-time status badges. Select from your verified CVs (Standard CV, Consulting Format) and submit with one click. Applications are auto-tracked across the recruitment pipeline.', view: 'applications' },
  { target: '[data-tour-id="withdraw-btn"]', title: 'Withdraw Applications', content: 'Changed your mind? Withdraw any active application. The system updates your shortlist count and tier allocation in real-time, freeing up governance slots for other opportunities.', view: 'applications' },

  // -- CV Maker (6 steps) --
  { target: '[data-tour-id="cvmaker-header"]', title: 'CV Maker — Template-Driven', content: 'Build institution-compliant CVs using allocated templates. Standard CV and Consulting Format are pre-configured with mandatory sections. Multi-CV support lets you tailor submissions per company sector.', view: 'cv' },
  { target: '[data-tour-id="cvmaker-list"]', title: 'CV Portfolio Management', content: 'Your CV portfolio shows all drafts and verified CVs. Status indicators — Verified (green), Draft (gray), Submitted (blue) — let you track which CVs are ready for applications.', view: 'cv' },
  { target: '[data-tour-id="cv-section-cards"]', title: 'Drag-and-Drop Section Ordering', content: 'Reorder CV sections by dragging them. The template defines which sections are mandatory, but you control the order. Each section card shows completion status and field count.', view: 'cv' },
  { target: '[data-tour-id="cv-edit-inline"]', title: 'Inline Field Editing', content: 'Click any field to edit it in place — text, dates, numbers, bullet lists, and dropdowns. Changes auto-save. Rich field types handle everything from GPA to project descriptions.', view: 'cv' },
  { target: '[data-tour-id="cv-photo-upload"]', title: 'Profile Photo Upload', content: 'Upload your profile photo directly into the CV. The system crops and formats it to fit the template\'s photo slot. Change requests go through placement team verification.', view: 'cv' },
  { target: '[data-tour-id="cv-pdf-preview"]', title: 'PDF Preview & Download', content: 'Preview your CV as a formatted PDF exactly as recruiters will see it. Download for offline review, or submit directly to open workflows. The PDF is generated server-side with consistent formatting.', view: 'cv' },

  // -- Calendar (3 steps) --
  { target: '[data-tour-id="calendar-header"]', title: 'Personal Calendar', content: 'Your weekly timetable with class blocks, exam slots, and personal time. The system cross-references your availability with interview scheduling to prevent conflicts.', view: 'calendar' },
  { target: '[data-tour-id="calendar-grid"]', title: 'Smart Scheduling', content: 'Monday through Friday with color-coded blocks — Classes (blue), Exams (red), Personal (purple). Add, edit, or delete blocks. When recruiters schedule interviews, conflicts are automatically flagged.', view: 'calendar' },
  { target: '[data-tour-id="calendar-add-block"]', title: 'Add Timetable Blocks', content: 'Click any empty slot to add a block — choose the type (Class, Exam, Personal, Interview), set the time range, and mark it as recurring if needed. Your availability is automatically shared with the placement system.', view: 'calendar' },

  // -- Intelligence (5 steps) --
  { target: '[data-tour-id="nav-intelligence"]', title: 'Cycle Intelligence Deep Dive', content: 'Access comprehensive placement analytics — historical hire data, sector-wise breakdowns, compensation benchmarks, and predictive insights powered by Ithras Intelligence.', view: 'intelligence' },
  { target: '[data-tour-id="cycle-selector"]', title: 'Select a Cycle to Analyze', content: 'Choose from active and historical cycles to see detailed analytics. Each cycle shows its status, date range, and number of participating companies.', view: 'intelligence' },
  { target: '[data-tour-id="analytics-cards"]', title: 'Key Metrics at a Glance', content: 'Offer rate percentage, median CTC, total applications, and total offers — computed in real-time from actual placement data. These aren\'t estimates; they\'re live numbers from the institutional database.', view: 'intelligence' },
  { target: '[data-tour-id="sector-chart"]', title: 'Sector Distribution', content: 'Visual breakdown of jobs by sector — see how many roles are in Consulting, Finance, Technology, and General Management. Understand the sector landscape before making application decisions.', view: 'intelligence' },
  { target: '[data-tour-id="funnel-chart"]', title: 'Application Funnel', content: 'From Submitted to Shortlisted to In Progress to Selected — the funnel shows conversion rates at each stage. See how many candidates make it through each gate across the entire cycle.', view: 'intelligence' },

  // -- Completion --
  { target: '[data-tour-id="nav-dashboard"]', title: 'Tour Complete!', content: 'You\'ve explored the complete student placement experience — governance-aware dashboards, stage-by-stage application tracking, template-driven CV building, intelligent scheduling, and real-time cycle analytics. Every feature gives students information parity with the placement cell.', view: 'dashboard' },
];

const RECRUITER_STEPS = [
  // -- Dashboard (4 steps) --
  { target: '[data-tour-id="recruiter-header"]', title: 'Recruitment Command Center', content: 'Welcome to Apex Consulting\'s recruitment gateway. As a campus recruiter, you manage multi-institution pipelines from a single interface — across all partner institutions and lateral hiring channels.', view: 'dashboard' },
  { target: '[data-tour-id="institution-cards"]', title: 'Institutional Intelligence', content: 'Each institution card shows your live pipeline — hires, roles, and pending applications. Click to see job cards and "Manage Candidates" to open your recruitment workflow.', view: 'dashboard' },
  { target: '[data-tour-id="context-intelligence"]', title: 'Context Intelligence Panel', content: 'Institution-level analytics at your fingertips — historical hire counts, median compensation, and sector distribution for each partner institution. Make data-driven decisions about where to focus your recruiting efforts.', view: 'dashboard' },
  { target: '[data-tour-id="notification-bell"]', title: 'Recruiter Notifications', content: 'Get notified when placement teams approve your JDs, when candidates apply to your workflows, and when stage progression approvals come through. Real-time updates keep you in sync with the placement process.', view: 'dashboard' },

  // -- Workflows (6 steps) --
  { target: '[data-tour-id="workflow-detail-header"]', title: 'Placement Cycle Management', content: 'Your placement cycles define the recruitment pipeline. Each cycle has a multi-stage structure and tracks all candidate applications in real-time.', view: 'workflows' },
  { target: '[data-tour-id="workflow-pipeline"]', title: 'Multi-Stage Pipeline', content: 'Application → Shortlist → Interview Round 1 → Final Interview → Offer. Each stage shows candidate count, progression controls, and CV download capabilities. Bulk operations like "Progress Selected to Interview" streamline high-volume recruiting.', view: 'workflows' },
  { target: '[data-tour-id="jd-submission-form"]', title: 'JD Submission Form', content: 'Submit a new Job Description with all the details: title, description, sector classification, slot assignment, and full compensation breakdown (fixed, variable, ESOPs, joining bonus, performance bonus). The placement team reviews before candidates see it.', view: 'workflows' },
  { target: '[data-tour-id="compensation-fields"]', title: 'Compensation Breakdown', content: 'Specify Fixed CTC (₹28L), Variable (₹6L), ESOPs Vested (₹0), Joining Bonus (₹3L), and Performance Bonus (₹4L). Top-decile classification determines governance tier placement. Every compensation detail is visible to candidates pre-application.', view: 'workflows' },
  { target: '[data-tour-id="student-progression"]', title: 'Student Progression Selector', content: 'Select multiple candidates and progress them to the next stage with a single action. Choose the target stage, and the system creates an approval request (if required) or moves them immediately. Bulk shortlisting made efficient.', view: 'workflows' },
  { target: '[data-tour-id="add-to-shortlist-btn"], [data-tour-id="create-offer-btn"]', title: 'Shortlist & Offer Actions', content: 'Add candidates to your shortlist or create offers directly from the workflow. "Add to shortlist" and "Create offer" appear for applications with an associated job. Accept/decline actions in the candidate portal complete the cycle.', view: 'workflows' },

  // -- Jobs (2 steps) --
  { target: '[data-tour-id="nav-jobs"]', title: 'Opportunity Hub', content: 'Post and manage job opportunities. Submit JDs with compensation details, sector classification, and required skills. The placement team reviews and approves before candidates see the listing — a governed approval workflow.', view: 'jobs' },
  { target: '[data-tour-id="job-cards"]', title: 'Job Portfolio', content: 'Each job card shows title, sector, slot, compensation, and submission status (Pending, Approved, Rejected). Track all your active and historical postings across institutions.', view: 'jobs' },

  // -- Calendar (3 steps) --
  { target: '[data-tour-id="recruiter-calendar-header"]', title: 'Interview Calendar', content: 'Schedule and manage engagement slots across institutions. View availability across the calendar — Interview slots, Presentation slots, and Networking events color-coded for quick identification.', view: 'calendar' },
  { target: '[data-tour-id="recruiter-calendar-grid"]', title: 'Slot Management', content: 'Create interview slots for specific roles, set capacity limits, and view student availability in real-time. The system checks against student timetables to maximize interview attendance.', view: 'calendar' },
  { target: '[data-tour-id="add-slot-btn"]', title: 'Add Interview Slots', content: 'Click to create a new interview slot — set the date, time, duration, and capacity. The system shows you how many candidates are available in that window based on their timetable data.', view: 'calendar' },

  // -- Applications (3 steps) --
  { target: '[data-tour-id="nav-applications"]', title: 'Application Pipeline', content: 'Review all candidate applications with their CVs, status, and stage progression. Shortlist, reject, or advance candidates through the pipeline with full audit trails.', view: 'applications' },
  { target: '[data-tour-id="cv-download-btn"]', title: 'Download CVs', content: 'Download individual CVs as PDFs or bulk-download all CVs for a workflow stage as a ZIP file. CVs are formatted using the institution\'s template — consistent, professional, and verified.', view: 'applications' },
  { target: '[data-tour-id="application-status-badges"]', title: 'Status Tracking', content: 'Each application shows its current status with color-coded badges — Submitted, Shortlisted, In Interview, Selected, or Rejected. Filter and sort to manage high-volume pipelines efficiently.', view: 'applications' },

  // -- Request Approvals (2 steps) --
  { target: '[data-tour-id="request-approvals-header"]', title: 'Application Request Approvals', content: 'When the placement team creates application requests for your workflows, they appear here. Review and approve requests to open application windows for candidates.', view: 'request-approvals' },
  { target: '[data-tour-id="approval-action-btns"]', title: 'Approve or Reject', content: 'Each request shows the workflow, institution, and scheduling details. Approve to open the application window, or reject with a reason. All decisions are logged in the audit trail.', view: 'request-approvals' },

  // -- Completion --
  { target: '[data-tour-id="nav-dashboard"]', title: 'Tour Complete!', content: 'You\'ve seen the complete recruiter experience — multi-institution management, governed JD submissions, multi-stage pipelines, compensation configuration, integrated calendar scheduling, bulk operations, and intelligent candidate tracking. Every interaction is tracked and auditable.', view: 'dashboard' },
];

const PLACEMENT_TEAM_STEPS = [
  // -- Dashboard (4 steps) --
  { target: '[data-tour-id="placement-header"]', title: 'Governance Dashboard', content: 'Welcome to the Placement Dashboard. This is your operational command center — students, companies, active jobs, and pending CV reviews. Every metric updates in real-time as the placement cycle progresses.', view: 'dashboard' },
  { target: '[data-tour-id="placement-stats"]', title: 'Live Placement Metrics', content: 'Seven key indicators at a glance: Total Students (120), Active Companies (24), Active Job Postings (42), Active Cycles (1), Pending CV Reviews (14), Total Shortlists (245), and Verified CVs (98). Each metric is clickable for drill-down analysis.', view: 'dashboard' },
  { target: '[data-tour-id="placement-actions"]', title: 'Quick Actions & System Status', content: 'One-click access to critical tasks — Review Pending CVs, Manage Active Cycles, View Applications. System Status shows real-time health: Database (Healthy), API Services (Operational), CV Templates (Active).', view: 'dashboard' },
  { target: '[data-tour-id="notification-bell"]', title: 'Placement Notifications', content: 'Get notified when recruiters submit new JDs, when students apply, when CV verifications are pending, and when approval requests need your attention. The notification center is your to-do list.', view: 'dashboard' },

  // -- Governance Flow (5 steps) --
  { target: '[data-tour-id="governance-flow-header"]', title: 'Governance Flow', content: 'The policy engine that powers fair placements. Create reusable policy templates with tier enforcement, shortlist caps, and stage-gated restrictions. Apply templates to cycles with one click.', view: 'policy_approvals' },
  { target: '[data-tour-id="policy-templates"]', title: 'Policy Templates', content: 'Reusable governance templates define company levels, placement stages, and student statuses. Edit existing templates or create new ones. Apply to any cycle — the system enforces all rules automatically.', view: 'policy_approvals' },
  { target: '[data-tour-id="policy-editor"]', title: 'Policy Editor Deep Dive', content: 'Configure global caps: maxShortlists (12), sectorDistribution ([6,4,2] across tiers), topDecileExempt (true/false), offerReleaseMode (SCHEDULED or ROLLING). These rules are enforced programmatically — no manual compliance checking needed.', view: 'policy_approvals' },
  { target: '[data-tour-id="policy-caps"]', title: 'Shortlist Caps & Sector Distribution', content: 'Max 12 shortlists per student, distributed as 6 Tier 1 + 4 Tier 2 + 2 Tier 3. Top-decile students can be exempt. Batch eligibility rules restrict which student batches can apply to which cycles.', view: 'policy_approvals' },
  { target: '[data-tour-id="policy-lateral"]', title: 'Lateral Hiring Rules', content: 'Lateral institutions use ROLLING governance — no fixed offer release times, relaxed shortlist caps (50 vs 12), and distinct approval chains. The governance engine automatically detects lateral vs standard institutions.', view: 'policy_approvals' },

  // -- Recruitment Cycles (4 steps) --
  { target: '[data-tour-id="recruitment-cycles-header"]', title: 'Recruitment Cycles', content: 'Create and manage placement cycles with policy, programs, and batches. Each cycle has multi-stage pipelines (Application → Shortlist → Interview → Offer) with approval gates.', view: 'recruitment_cycles' },
  { target: '[data-tour-id="cycle-create-btn"]', title: 'Create New Cycle', content: 'Start a new placement cycle: name it, set the type (FINAL or SUMMER), assign a date range, and choose the governing policy. The cycle starts in DRAFT and transitions through APPLICATIONS_OPEN → APPLICATIONS_CLOSED → OFFERS_IN_PROGRESS → COMPLETED.', view: 'recruitment_cycles' },
  { target: '[data-tour-id="workflow-list"]', title: 'Active Placement Cycles', content: 'Each card shows status, company, and "Manage Stages" for pipeline configuration. Active workflows show real-time student counts at each stage.', view: 'recruitment_cycles' },
  { target: '[data-tour-id="cycle-analytics"]', title: 'Cycle Analytics', content: 'Offer rate, median CTC, sector distribution, application funnel, and top recruiters — all computed from live data. Use these analytics for mid-cycle decision making and post-cycle reporting.', view: 'recruitment_cycles' },

  // -- Approval Queue (3 steps) --
  { target: '[data-tour-id="approval-queue-header"]', title: 'Approval Queue', content: 'All pending decisions in one queue. JD Submissions from companies need review before candidates can apply. Stage Progressions need approval before candidates advance — every critical decision is governed.', view: 'approval-queue' },
  { target: '[data-tour-id="approval-items"]', title: 'Pending Approvals', content: 'JD Submission (Goldman Sachs IB Analyst), Stage Progression (3 students from Shortlist to Interview), JD Submission (Amazon PM). Review details, approve, or reject with reasoning — full audit trail maintained.', view: 'approval-queue' },
  { target: '[data-tour-id="approval-detail"]', title: 'Approval Detail & Actions', content: 'Click any approval to see full details — the requested data, who requested it, when, and why. Approve or reject with a single click. Rejection requires a reason, which is communicated back to the requester.', view: 'approval-queue' },

  // -- CV Templates (2 steps) --
  { target: '[data-tour-id="nav-cv-templates"]', title: 'CV Template Builder', content: 'Design institution-specific CV templates — Standard (5 sections), Consulting Format (5 sections), Finance Format (Draft). Configure mandatory sections, field types, and validation rules. Published templates are automatically allocated to programs.', view: 'cv-templates' },
  { target: '[data-tour-id="template-activation"]', title: 'Template Activation', content: 'Toggle templates between Draft and Published. Published templates are available to students for CV creation. Each template defines sections, field types, and mandatory vs optional fields.', view: 'cv-templates' },

  // -- CV Verification (2 steps) --
  { target: '[data-tour-id="nav-cv-verification"]', title: 'CV Verification Pipeline', content: 'Review and approve student CVs before they enter the placement pipeline. Each submission is checked against template compliance, factual accuracy, and institutional guidelines.', view: 'cv-verification' },
  { target: '[data-tour-id="verification-actions"]', title: 'Verify, Approve, or Reject', content: 'For each CV entry, check proof URLs, verify claims, and mark as verified or flag for revision. Students see their verification status in real-time and can resubmit corrected entries.', view: 'cv-verification' },

  // -- Master Calendar (2 steps) --
  { target: '[data-tour-id="nav-master_calendar"]', title: 'Master Calendar', content: 'Institution-wide schedule showing all recruitment events, interview slots, and placement activities. 186 available slots, 42 tentative, 28 unavailable — cross-referenced with student timetables to optimize scheduling and minimize conflicts.', view: 'master_calendar' },
  { target: '[data-tour-id="calendar-conflicts"]', title: 'Scheduling Conflict Detection', content: 'The master calendar automatically detects when company interview slots overlap with student classes or exams. Conflict alerts help you reschedule before students are affected.', view: 'master_calendar' },

  // -- Request Applications (2 steps) --
  { target: '[data-tour-id="request-applications-header"]', title: 'Application Requests', content: 'Create application requests to open windows for specific workflows and companies. Set scheduling parameters — when applications open and close. Recruiters approve before the window activates.', view: 'request_applications' },
  { target: '[data-tour-id="request-create-btn"]', title: 'Create Application Request', content: 'Select the workflow, company, and institution. Set the open and close dates. Submit for recruiter approval. Once approved, candidates can apply during the specified window.', view: 'request_applications' },

  // -- Completion --
  { target: '[data-tour-id="nav-dashboard"]', title: 'Tour Complete!', content: 'You\'ve explored the complete placement governance system — from policy enforcement and cycle management to approval queues, CV verification, and master calendar scheduling. Every decision is governed, every action is auditable, and every metric is real-time.', view: 'dashboard' },
];

const SYSTEM_ADMIN_STEPS = [
  // -- People (4 steps) --
  { target: '[data-tour-id="admin-header"]', title: 'Platform Command Center', content: 'Welcome to the Ithras System Administration console. You have full oversight of every institution, company, user, and permission across the platform. This is the operational backbone of a multi-tenant placement ecosystem. Start with Institutions or Companies, then drill down to manage users within each org.', view: 'system-admin/institutions' },
  { target: '[data-tour-id="people-search"]', title: 'User Directory', content: 'Search across 600+ users by name, email, or role. Every user — from System Admins and Placement Teams to Candidates and Recruiters — is centrally managed here. Filters let you isolate by role for bulk operations.', view: 'system-admin/people' },
  { target: '[data-tour-id="people-list"]', title: 'User Records', content: 'Each user record shows name, email, role, and institutional/company affiliation. Click any user to see full profile details, activity logs, and permission sets. RBAC is enforced at every API endpoint.', view: 'system-admin/people' },
  { target: '[data-tour-id="admin-tabs"]', title: 'Multi-Domain Management', content: 'Navigate between Institutions, Companies, All Users, and Access Control tabs. Start with Institutions or Companies to manage users by org; use All Users for cross-org search. Each domain provides full CRUD operations with audit logging.', view: 'system-admin/institutions' },

  // -- Institutions (3 steps) --
  { target: '[data-tour-id="institutions-list"]', title: 'Institutional Partners', content: 'Each institution has programs, student counts, and placement governance policies. Add new institutions or manage existing partnerships.', view: 'system-admin/institutions' },
  { target: '[data-tour-id="institution-programs"]', title: 'Program & Policy Configuration', content: 'Each institution has programs with batch management and policy assignments. Configure program-level governance: which batches are eligible for which cycles, and what shortlist caps apply per program.', view: 'system-admin/institutions' },
  { target: '[data-tour-id="institution-create"]', title: 'Add New Institution', content: 'Create a new institutional partner: name, tier classification (Tier 1, Tier 2, Lateral), location, and logo. The system provisions default programs and governance templates automatically.', view: 'system-admin/institutions' },

  // -- Companies (2 steps) --
  { target: '[data-tour-id="companies-list"]', title: 'Recruiting Organizations', content: 'Apex Consulting (12 hires last year), Goldman Sachs (8), Amazon (15), BCG (10). Track recruiting activity, assign recruiter accounts, and manage company-institution relationships across the platform.', view: 'system-admin/companies' },
  { target: '[data-tour-id="company-detail"]', title: 'Company Analytics', content: 'Drill into any company to see cumulative hires, median compensation, sector classification, and linked recruiter accounts. Historical data spans 3+ years for trend analysis.', view: 'system-admin/companies' },

  // -- Access Control (2 steps) --
  { target: '[data-tour-id="access-roles"]', title: 'Role-Based Access Control', content: '8 role definitions from System Admin (24 permissions) to Faculty Observer (4 permissions). Predefined system roles, custom roles like Department Coordinator, and granular permission management. Every action is permission-gated.', view: 'system-admin/access' },
  { target: '[data-tour-id="permission-matrix"]', title: 'Permission Matrix', content: 'View and edit permissions per role in a visual matrix. Categories include User Management, Placement Operations, CV Management, Analytics, and System Administration. Custom roles can be created for institution-specific needs.', view: 'system-admin/access' },

  // -- Telemetry (4 steps) --
  { target: '[data-tour-id="telemetry-header"]', title: 'Platform Telemetry', content: 'Real-time observability — 45,892 requests, 98.7% success rate, 42ms average latency. Monitor API health, track active users, diagnose errors, and analyze user behavior across the entire platform.', view: 'telemetry/overview' },
  { target: '[data-tour-id="telemetry-stats"]', title: 'Performance Metrics', content: 'P50 (28ms), P95 (145ms), P99 (320ms) latency distribution. 34 active users, 412 client errors, 184 server errors. Every API endpoint is instrumented with request-level telemetry and error tracking.', view: 'telemetry/overview' },
  { target: '[data-tour-id="telemetry-timeseries"]', title: 'Traffic Analysis', content: '24-hour traffic patterns with request volume, average latency, and error rates plotted over time. Identify peak usage windows, detect anomalies, and correlate performance degradation with deployment events.', view: 'telemetry/overview' },
  { target: '[data-tour-id="telemetry-db-health"]', title: 'Database Health', content: 'Monitor database connection pool utilization, query latency, and table sizes. Get alerts when connection pools are exhausted or when query performance degrades beyond thresholds.', view: 'telemetry/overview' },

  // -- Analytics (3 steps) --
  { target: '[data-tour-id="analytics-header"]', title: 'Analytics Suite', content: 'Query the platform database directly, build visual dashboards, and schedule automated reports. The analytics suite gives you complete data access — from raw SQL to drag-and-drop chart builders.', view: 'analytics' },
  { target: '[data-tour-id="sql-editor"]', title: 'SQL Editor', content: 'Write and execute SQL queries against the platform database. Results appear in an interactive table with sorting, filtering, and export capabilities. Save frequently used queries for quick access.', view: 'analytics' },
  { target: '[data-tour-id="visual-query"]', title: 'Visual Query Builder', content: 'Build queries without SQL. Select tables, columns, filters, and groupings from dropdown menus. The visual builder generates optimized SQL and renders results as tables or charts.', view: 'analytics' },

  // -- Database, Migrations, Simulator, Testing (4 steps) --
  { target: '[data-tour-id="database-header"]', title: 'Database Management', content: 'Browse database tables, view schemas, and inspect row counts. Direct access to the data layer for debugging and analysis — with read-only safeguards for production environments.', view: 'database' },
  { target: '[data-tour-id="migrations-header"]', title: 'Migration Management', content: 'View applied and pending database migrations. Run migrations to update the schema when new features are deployed. Each migration is versioned and reversible.', view: 'system-admin/migrations' },
  { target: '[data-tour-id="simulator-header"]', title: 'Simulator', content: 'Generate test data and run business-flow scenarios. The simulator creates institutions, companies, students, and applications — perfect for demo environments and regression testing. Five scenario types test the full business flow.', view: 'simulator' },
  { target: '[data-tour-id="testing-header"]', title: 'Testing Portal', content: 'Run backend (pytest), frontend (Vitest), E2E (Playwright), and simulator scenario test suites from the UI. View results, pass/fail counts, and detailed output. Monitor platform quality in real-time.', view: 'system-admin/testing' },

  // -- Completion --
  { target: '[data-tour-id="admin-header"]', title: 'Tour Complete!', content: 'You\'ve explored the complete system administration experience — multi-tenant user management, institutional partnerships, RBAC governance, full-stack telemetry, analytics suite, database management, simulator, and automated testing. Every operation is logged, every permission is enforced.', view: 'system-admin/institutions' },
];

/**
 * Multi-view demo scenarios — chain multiple views into a narrative.
 * Used by GuidedDemosPage for "Storyline" demos.
 */
export const DEMO_SCENARIOS = [
  {
    id: 'student_journey',
    label: 'Student Journey',
    description: 'Follow a student from CV creation through application, stage progression, to receiving an offer.',
    role: UserRole.CANDIDATE,
    icon: 'user',
    views: ['cv', 'applications', 'active_processes', 'intelligence', 'dashboard'],
  },
  {
    id: 'recruiter_onboarding',
    label: 'Recruiter Onboarding',
    description: 'Walk through institution selection, JD submission, candidate review, and interview scheduling.',
    role: UserRole.RECRUITER,
    icon: 'briefcase',
    views: ['dashboard', 'workflows', 'applications', 'calendar'],
  },
  {
    id: 'full_placement_cycle',
    label: 'Full Placement Cycle',
    description: 'Create a cycle, set governance policy, approve workflows, and track student outcomes.',
    role: UserRole.PLACEMENT_TEAM,
    icon: 'workflow',
    views: ['recruitment_cycles', 'policy_approvals', 'approval-queue', 'cv-verification', 'master_calendar'],
  },
  {
    id: 'governance_setup',
    label: 'Governance Setup',
    description: 'Configure placement policies, set shortlist caps, and manage approval chains.',
    role: UserRole.PLACEMENT_TEAM,
    icon: 'governance',
    views: ['policy_approvals', 'recruitment_cycles', 'approval-queue'],
  },
  {
    id: 'system_health_check',
    label: 'System Health Check',
    description: 'Monitor platform telemetry, run test suites, check database health, and review analytics.',
    role: UserRole.SYSTEM_ADMIN,
    icon: 'chart',
    views: ['telemetry/overview', 'analytics', 'system-admin/testing', 'database'],
  },
];

export const getTutorialSteps = (role) => {
  switch (role) {
    case UserRole.CANDIDATE:
    case 'CANDIDATE':
      return CANDIDATE_STEPS;
    case UserRole.RECRUITER:
    case 'RECRUITER':
      return RECRUITER_STEPS;
    case UserRole.PLACEMENT_TEAM:
    case UserRole.PLACEMENT_ADMIN:
    case 'PLACEMENT_TEAM':
    case 'PLACEMENT_ADMIN':
      return PLACEMENT_TEAM_STEPS;
    case UserRole.SYSTEM_ADMIN:
    case 'SYSTEM_ADMIN':
      return SYSTEM_ADMIN_STEPS;
    default:
      return [];
  }
};

/** Steps for a single page/view only. Used for per-page guided demos. */
export const getTutorialStepsForPage = (role, view) => {
  const steps = getTutorialSteps(role);
  return steps.filter((s) => s.view === view);
};

/** Unique views that have at least one tutorial step. Used to show/hide Guided Demo button. */
export const getPagesWithTutorials = (role) => {
  const steps = getTutorialSteps(role);
  return [...new Set(steps.map((s) => s.view).filter(Boolean))];
};

export const ROLES_WITH_TUTORIALS = [
  { id: UserRole.PLACEMENT_TEAM, label: 'Placement Team', description: 'Governance dashboard, policy editor, cycle management, approvals, CV verification, and master calendar', icon: 'clipboard' },
  { id: UserRole.RECRUITER, label: 'Recruiter', description: 'Multi-institution pipelines, JD submissions, compensation config, interview scheduling, and offer management', icon: 'briefcase' },
  { id: UserRole.CANDIDATE, label: 'Student Candidate', description: 'Company intelligence, application tracking, stage pipeline, CV builder, cycle analytics, and personal calendar', icon: 'user' },
  { id: UserRole.SYSTEM_ADMIN, label: 'System Admin', description: 'Platform telemetry, analytics suite, user management, RBAC, database, simulator, and testing', icon: 'settings' },
];

/** Roles shown on the login screen's guided demo picker. Excludes System Admin (available when logged in via Guided Demos). */
export const ROLES_FOR_LOGIN_DEMO = ROLES_WITH_TUTORIALS.filter((r) => r.id !== UserRole.SYSTEM_ADMIN);

/** Human-readable labels for tutorial pages. */
const VIEW_LABELS = {
  dashboard: 'Home',
  active_processes: 'Active Processes',
  applications: 'My Applications',
  cv: 'Profile',
  calendar: 'My Calendar',
  intelligence: 'Cycle Intelligence',
  workflows: 'Placement Cycles',
  jobs: 'Opportunity Hub',
  policy_approvals: 'Governance Flow',
  'recruitment_cycles': 'Recruitment Cycles',
  'approval-queue': 'Approval Queue',
  'cv-templates': 'CV Template Builder',
  'cv-verification': 'CV Verification',
  master_calendar: 'Master Calendar',
  request_applications: 'Application Requests',
  'request-approvals': 'Request Approvals',
  'system-admin/people': 'User Management',
  'system-admin/institutions': 'Institutional Partners',
  'system-admin/companies': 'Recruiting Organizations',
  'system-admin/access': 'Access Control',
  'telemetry/overview': 'Telemetry',
  analytics: 'Analytics Suite',
  database: 'Database Management',
  'system-admin/migrations': 'Migrations',
  simulator: 'Simulator',
  'system-admin/testing': 'Testing Portal',
};

const ROLE_VIEW_LABEL_OVERRIDES = {
  [UserRole.RECRUITER]: { calendar: 'Interview Calendar', applications: 'Applications' },
};

/** Icon identifiers for tutorial page blocks. Mapped to SVG in GuidedDemoSidebar. */
const VIEW_ICONS = {
  dashboard: 'dashboard',
  active_processes: 'lightning',
  applications: 'document',
  cv: 'user',
  calendar: 'calendar',
  intelligence: 'chart',
  workflows: 'workflow',
  jobs: 'briefcase',
  policy_approvals: 'governance',
  'recruitment_cycles': 'workflow',
  'approval-queue': 'check',
  'cv-templates': 'document',
  'cv-verification': 'check',
  master_calendar: 'calendar',
  request_applications: 'document',
  'request-approvals': 'check',
  'system-admin/people': 'users',
  'system-admin/institutions': 'building',
  'system-admin/companies': 'building',
  'system-admin/access': 'lock',
  'telemetry/overview': 'chart',
  analytics: 'chart',
  database: 'settings',
  'system-admin/migrations': 'settings',
  simulator: 'lightning',
  'system-admin/testing': 'check',
};

/** Returns { label, description, icon } for a tutorial page. */
export const getPageTutorialMeta = (role, view) => {
  const steps = getTutorialStepsForPage(role, view);
  const firstStep = steps[0];
  const roleOverrides = ROLE_VIEW_LABEL_OVERRIDES[role];
  const label = (roleOverrides && roleOverrides[view]) || VIEW_LABELS[view] || view;
  const description = firstStep?.title || '';
  const icon = VIEW_ICONS[view] || 'document';
  return { label, description, icon };
};

/** Returns demo scenarios for a given role. */
export const getDemoScenariosForRole = (role) => {
  return DEMO_SCENARIOS.filter((s) => s.role === role || s.role === String(role));
};
