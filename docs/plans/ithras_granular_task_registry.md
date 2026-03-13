# Ithras Granular Task Registry

Trackable tasks for the Ithras Professional Suite implementation. Task ID format: `P{phase}-{domain}-{seq}`. Domains: ID=Identity, ORG=Organizations, PROF=Profile, CV, OPP=Opportunities, APP=Applications, REC=Recruitment, PLM=Placement, CAL=Calendar, ASM=Assessments, MSG=Messaging, GOV=Governance, ANL=Analytics, AUD=Audit, ADM=Admin. Layers: M=model, S=schema, G=migration, V=service, R=router, F=frontend, I=integration.

---

## Phase 1: Foundation (Tasks 001–145)

### Identity & Access (ID) — 28 tasks
| ID | Task | Layer |
|----|------|-------|
| P1-ID-001 | Create identity.py model module; split User, AuthSession from core | M |
| P1-ID-002 | User entity: ensure canonical fields (id, email, full_name, phone, is_active, created_at, updated_at) | M |
| P1-ID-003 | AuthSession entity and table | M |
| P1-ID-004 | IndividualInstitutionLink: verify schema, add role/scope fields if needed | M |
| P1-ID-005 | IndividualOrganizationLink: verify schema, add role/scope fields if needed | M |
| P1-ID-006 | identity.py schema module (Pydantic) | S |
| P1-ID-007 | UserRead, UserUpdate, ProfileSwitchRequest schemas | S |
| P1-ID-008 | Auth session migration (if new table) | G |
| P1-ID-009 | Link tables migration: any new columns | G |
| P1-ID-010 | Identity service: get_current_user, get_active_profile_context | V |
| P1-ID-011 | Identity service: switch_profile, validate_link_scope | V |
| P1-ID-012 | Auth router: session endpoints, logout | R |
| P1-ID-013 | Profile router: get profile, update profile, switch context | R |
| P1-ID-014 | Links router: list institution/org links (admin) | R |
| P1-ID-015 | Frontend: ModeSwitcher - verify institution/company link UX | F |
| P1-ID-016 | Frontend: profile context persistence across refresh | F |
| P1-ID-017 | Frontend: Settings - profile visibility controls | F |
| P1-ID-018 | Integration: auth middleware passes profile context to requests | I |
| P1-ID-019 | Scope-aware permission check: profile.self.edit | I |
| P1-ID-020 | Deprecate User.role, User.company_id, User.institution_id; migrate to links | M |
| P1-ID-021 | Role, Permission, RolePermission models - verify RBAC structure | M |
| P1-ID-022 | ScopeBinding or equivalent for institution/company/batch scope | M |
| P1-ID-023 | RBAC service: resolve_permissions(user, institution_id?, company_id?) | V |
| P1-ID-024 | Backend: add institution_id, company_id, batch_id to permission context | I |
| P1-ID-025 | Frontend permissions.js: map scope-aware checks | F |
| P1-ID-026 | Integration: derive role flags from links + RBAC | I |
| P1-ID-027 | Integration: nav visibility by persona + scope | I |
| P1-ID-028 | E2E: profile switch flow for candidate/recruiter | I |

### Organizations (ORG) — 12 tasks
| ID | Task | Layer |
|----|------|-------|
| P1-ORG-001 | Create organizations.py model; ensure Institution, Program, Batch, Company, BusinessUnit | M |
| P1-ORG-002 | Campus entity (if multi-campus) | M |
| P1-ORG-003 | organizations schemas: InstitutionRead, CompanyRead, BatchRead, etc. | S |
| P1-ORG-004 | Organization service: list institutions, list companies, get structure | V |
| P1-ORG-005 | Institution router: CRUD (admin) | R |
| P1-ORG-006 | Company router: CRUD, business units | R |
| P1-ORG-007 | Frontend: Institution structure view (programs, batches) | F |
| P1-ORG-008 | Frontend: Company admin - business units | F |
| P1-ORG-009 | Migration: Company description, headquarters, founding_year (if missing) | G |
| P1-ORG-010 | Integration: org structure used by eligibility, placement | I |
| P1-ORG-011 | Permission: institution.structure.view, institution.structure.manage | I |
| P1-ORG-012 | Permission: company.view, company.manage, company.business_units.manage | I |

### CV & Documents (CV) — 18 tasks
| ID | Task | Layer |
|----|------|-------|
| P1-CV-001 | cv.py: CV, CVVersion - verify canonical ownership | M |
| P1-CV-002 | CVTemplate entity | M |
| P1-CV-003 | CoverLetter entity (optional Phase 1) | M |
| P1-CV-004 | PortfolioAsset entity | M |
| P1-CV-005 | ResumeImportJob entity | M |
| P1-CV-006 | CVApproval entity or status field | M |
| P1-CV-007 | CV schemas: CVRead, CVVersionRead, CVCreate, CVUpdate | S |
| P1-CV-008 | CV migration: template_id, approval_status, portfolio refs | G |
| P1-CV-009 | CV service: create, duplicate, get versions | V |
| P1-CV-010 | CV service: tailor_to_role, export_pdf | V |
| P1-CV-011 | CV service: submit_for_approval, review_approval | V |
| P1-CV-012 | Resume import/parse service (or defer) | V |
| P1-CV-013 | CV router: CRUD, versions, export | R |
| P1-CV-014 | Frontend: CV builder - create, edit, duplicate version | F |
| P1-CV-015 | Frontend: CV builder - tailor to job | F |
| P1-CV-016 | Frontend: CV approval flow (placement view) | F |
| P1-CV-017 | Permission: cv.self.view, cv.self.manage, cv.review.approve | I |
| P1-CV-018 | Integration: CV data in application attachments | I |

### Opportunities (OPP) — 20 tasks
| ID | Task | Layer |
|----|------|-------|
| P1-OPP-001 | JobProfile vs JobPosting split: define ownership | M |
| P1-OPP-002 | opportunities.py: JobPosting, OpportunityFeedItem (if denorm) | M |
| P1-OPP-003 | SavedOpportunity entity | M |
| P1-OPP-004 | OpportunityAlert entity | M |
| P1-OPP-005 | CompanyFollow entity | M |
| P1-OPP-006 | Opportunities schemas | S |
| P1-OPP-007 | SavedOpportunity migration | G |
| P1-OPP-008 | Opportunity service: browse, search, filter | V |
| P1-OPP-009 | Opportunity service: save, unsave, follow company | V |
| P1-OPP-010 | Opportunity service: eligibility-based filtering | V |
| P1-OPP-011 | Unified feed service: campus + lateral merge | V |
| P1-OPP-012 | Opportunity router: list, search, get, save | R |
| P1-OPP-013 | Feed router: personalized feed | R |
| P1-OPP-014 | Frontend: unified opportunity feed (general-feed + recruitment) | F |
| P1-OPP-015 | Frontend: saved jobs, watchlist | F |
| P1-OPP-016 | Frontend: eligibility filter UI | F |
| P1-OPP-017 | Frontend: follow company | F |
| P1-OPP-018 | Permission: opportunities.view, opportunities.personalized.view | I |
| P1-OPP-019 | Integration: feed in candidate + professional dashboards | I |
| P1-OPP-020 | E2E: browse → save → apply flow | I |

### Applications (APP) — 22 tasks
| ID | Task | Layer |
|----|------|-------|
| P1-APP-001 | applications.py: Application, ApplicationStage - verify | M |
| P1-APP-002 | ApplicationTimelineEvent entity | M |
| P1-APP-003 | ApplicationAttachment entity | M |
| P1-APP-004 | ApplicationDecision or status enum | M |
| P1-APP-005 | Applications schemas | S |
| P1-APP-006 | ApplicationTimelineEvent migration | G |
| P1-APP-007 | ApplicationAttachment migration | G |
| P1-APP-008 | Application service: create (apply), withdraw | V |
| P1-APP-009 | Application service: get timeline, add event | V |
| P1-APP-010 | Application service: upload attachment | V |
| P1-APP-011 | Application router: list mine, get, apply, withdraw | R |
| P1-APP-012 | Application router: timeline, attachments | R |
| P1-APP-013 | Frontend: application tracker - list, status | F |
| P1-APP-014 | Frontend: application tracker - stage timeline | F |
| P1-APP-015 | Frontend: application tracker - document attachments | F |
| P1-APP-016 | Frontend: apply button, withdraw confirmation | F |
| P1-APP-017 | Permission: applications.self.view, applications.create, applications.withdraw | I |
| P1-APP-018 | Integration: application created from opportunity | I |
| P1-APP-019 | Integration: recruiter pipeline reads applications | I |
| P1-APP-020 | Offer entity: verify in placement; OfferVersion, OfferDecision | M |
| P1-APP-021 | Offer service: get offer status, accept/decline (candidate) | V |
| P1-APP-022 | Frontend: offers list, accept/decline | F |

### Recruitment - Job Profiles & Discovery (REC) — 25 tasks
| ID | Task | Layer |
|----|------|-------|
| P1-REC-001 | recruitment.py: JobProfile entity (split from JobPosting) | M |
| P1-REC-002 | HiringCriteria entity | M |
| P1-REC-003 | HiringManagerAssignment, RecruiterAssignment | M |
| P1-REC-004 | SavedSearch entity | M |
| P1-REC-005 | TalentPool, TalentPoolMember entities | M |
| P1-REC-006 | Shortlist, ShortlistEntry - verify in placement or recruitment | M |
| P1-REC-007 | Recruitment schemas | S |
| P1-REC-008 | JobProfile migration; JobPosting FK to JobProfile | G |
| P1-REC-009 | SavedSearch, TalentPool migrations | G |
| P1-REC-010 | JobProfile service: create, edit, assign, route approval | V |
| P1-REC-011 | JobProfile service: publish (create JobPosting) | V |
| P1-REC-012 | Discovery service: search talent, filter | V |
| P1-REC-013 | Discovery service: save search, add to pool | V |
| P1-REC-014 | Shortlist service: add, remove, advance, reject | V |
| P1-REC-015 | JobProfile router: CRUD | R |
| P1-REC-016 | Discovery router: search, saved searches, pools | R |
| P1-REC-017 | Shortlist router: list, manage entries | R |
| P1-REC-018 | Frontend: job profiles - create, edit requisition | F |
| P1-REC-019 | Frontend: discovery - search, filters | F |
| P1-REC-020 | Frontend: talent pools - create, add candidates | F |
| P1-REC-021 | Frontend: shortlist/pipeline board | F |
| P1-REC-022 | Permission: recruitment.job_profiles.*, recruitment.discovery.* | I |
| P1-REC-023 | Integration: JobProfile → JobPosting for opportunities | I |
| P1-REC-024 | Integration: shortlist stage movement UX | I |
| P1-REC-025 | E2E: create job → publish → discover → shortlist | I |

### Admin - User, Notifications, Setup (ADM) — 20 tasks
| ID | Task | Layer |
|----|------|-------|
| P1-ADM-001 | admin.py: SetupStep, SetupRun, SeedRegistry | M |
| P1-ADM-002 | User management: list, create, deactivate | V |
| P1-ADM-003 | User service: assign role, assign link | V |
| P1-ADM-004 | User router: admin CRUD | R |
| P1-ADM-005 | Frontend: user management table | F |
| P1-ADM-006 | Frontend: add user, assign institution/company link | F |
| P1-ADM-007 | Notifications: Notification, NotificationPreference entities | M |
| P1-ADM-008 | Notification service: list, mark read, preferences | V |
| P1-ADM-009 | Notification router | R |
| P1-ADM-010 | Frontend: bell tray, notification list | F |
| P1-ADM-011 | Frontend: notification preferences settings | F |
| P1-ADM-012 | Setup service: steps, run, status | V |
| P1-ADM-013 | Setup router: progress, rerun | R |
| P1-ADM-014 | Frontend: setup progress (system admin) | F |
| P1-ADM-015 | Permission: users.view, users.manage, setup.view, setup.manage | I |
| P1-ADM-016 | Permission: notifications.self.view, notifications.self.manage | I |
| P1-ADM-017 | Seed: default roles, permissions | G |
| P1-ADM-018 | Seed: demo institution, company, users | G |
| P1-ADM-019 | Integration: setup runs before first use | I |
| P1-ADM-020 | E2E: admin creates user, assigns link | I |

---

## Phase 2: Operational Strength (Tasks 146–280)

### Placement (PLM) — 45 tasks
| ID | Task | Layer |
|----|------|-------|
| P2-PLM-001 | placement.py: PlacementCycle, PlacementWindow | M |
| P2-PLM-002 | StudentRosterEntry, StudentProfile (or BatchMembership) | M |
| P2-PLM-003 | CompanyEngagement, JDSubmission | M |
| P2-PLM-004 | EligibilityRule, EligibilityEvaluation, EligibilityOverrideRequest | M |
| P2-PLM-005 | PlacementProcessStage, SlotAllocationPlan | M |
| P2-PLM-006 | PlacementOutcome | M |
| P2-PLM-007 | InstitutionAnnouncement | M |
| P2-PLM-008 | Placement schemas | S |
| P2-PLM-009 | Eligibility migration | G |
| P2-PLM-010 | CompanyEngagement, JDSubmission migrations | G |
| P2-PLM-011 | PlacementCycle service: create, open, close | V |
| P2-PLM-012 | Eligibility service: evaluate, override | V |
| P2-PLM-013 | CompanyWorkflow service: onboard, JD submission, approval | V |
| P2-PLM-014 | StudentRoster service: import, manage states | V |
| P2-PLM-015 | Placement router: cycles, eligibility, company workflows | R |
| P2-PLM-016 | Frontend: cycle control center | F |
| P2-PLM-017 | Frontend: eligibility rules, override requests | F |
| P2-PLM-018 | Frontend: company onboarding, JD submission workflow | F |
| P2-PLM-019 | Frontend: student roster, import | F |
| P2-PLM-020 | Permission: placement.* | I |
| P2-PLM-021 | PlacementCommunications: Announcement entity | M |
| P2-PLM-022 | Announcement service, router | V,R |
| P2-PLM-023 | Frontend: announcements, bulk messaging | F |

### Calendar (CAL) — 25 tasks
| ID | Task | Layer |
|----|------|-------|
| P2-CAL-001 | calendar.py: CalendarSlot, TimetableBlock - verify | M |
| P2-CAL-002 | SlotBooking, RoomAllocation | M |
| P2-CAL-003 | StudentSlotAvailability, InterviewAvailability | M |
| P2-CAL-004 | SchedulingConflict | M |
| P2-CAL-005 | Calendar schemas | S |
| P2-CAL-006 | Calendar migrations | G |
| P2-CAL-007 | Slot service: create, allocate, conflict detect | V |
| P2-CAL-008 | Booking service: book, cancel, reschedule | V |
| P2-CAL-009 | Availability service: set, get | V |
| P2-CAL-010 | Calendar router: slots, blocks, bookings | R |
| P2-CAL-011 | Frontend: slot planner | F |
| P2-CAL-012 | Frontend: timetable blocks | F |
| P2-CAL-013 | Frontend: student slot allocation | F |
| P2-CAL-014 | Frontend: conflict detection UI | F |
| P2-CAL-015 | Permission: calendar.slots.*, calendar.bookings.* | I |

### Governance (GOV) — 20 tasks
| ID | Task | Layer |
|----|------|-------|
| P2-GOV-001 | governance.py: Workflow, WorkflowStep - verify | M |
| P2-GOV-002 | WorkflowApproval, ApprovalRequest | M |
| P2-GOV-003 | ExceptionRequest, DecisionLog, EscalationRule | M |
| P2-GOV-004 | ScopeBinding | M |
| P2-GOV-005 | Governance schemas | S |
| P2-GOV-006 | Governance migrations | G |
| P2-GOV-007 | Workflow service: submit, approve, reject, escalate | V |
| P2-GOV-008 | Approval router: list pending, approve | R |
| P2-GOV-009 | Frontend: workflow inbox | F |
| P2-GOV-010 | Frontend: approval request detail, approve/reject | F |
| P2-GOV-011 | Integration: JD approval uses governance | I |
| P2-GOV-012 | Integration: eligibility override uses governance | I |

### Messaging (MSG) — 25 tasks
| ID | Task | Layer |
|----|------|-------|
| P2-MSG-001 | messaging.py: Conversation, ConversationParticipant | M |
| P2-MSG-002 | Message, MessageTemplate | M |
| P2-MSG-003 | Announcement, CommunicationCampaign | M |
| P2-MSG-004 | Messaging schemas | S |
| P2-MSG-005 | Conversation, Message migrations | G |
| P2-MSG-006 | Message service: send, list, archive | V |
| P2-MSG-007 | Conversation service: create, get threads | V |
| P2-MSG-008 | Message router: conversations, send | R |
| P2-MSG-009 | Frontend: inbox, conversation list | F |
| P2-MSG-010 | Frontend: message compose, thread view | F |
| P2-MSG-011 | Frontend: recruiter–candidate chat | F |
| P2-MSG-012 | Bulk messaging (placement) | V,R,F |

### Recruitment P2 (REC) — 20 tasks
| ID | Task | Layer |
|----|------|-------|
| P2-REC-026 | RecruiterNote, ShortlistDecision | M |
| P2-REC-027 | InterviewPlan, InterviewPanel, InterviewSlot | M |
| P2-REC-028 | InterviewFeedback, ScorecardTemplate | M |
| P2-REC-029 | Interview service: create plan, assign panel | V |
| P2-REC-030 | Interview service: schedule, collect feedback | V |
| P2-REC-031 | Interview router | R |
| P2-REC-032 | Frontend: interview scheduling | F |
| P2-REC-033 | Frontend: scorecard, feedback form | F |
| P2-REC-034 | Integration: calendar + recruitment for interviews | I |

---

## Phase 3: Enterprise Maturity (Tasks 281–380)

### Recruitment P3 - Offers (REC) — 15 tasks
| ID | Task | Layer |
|----|------|-------|
| P3-REC-046 | OfferVersion, CompensationApproval, JoinerStatus | M |
| P3-REC-047 | Offer service: create, route approval, release | V |
| P3-REC-048 | Offer service: revise, track decision | V |
| P3-REC-049 | Offer router: create, approve, issue | R |
| P3-REC-050 | Frontend: offer creation, approval flow | F |
| P3-REC-051 | Frontend: joiner pipeline | F |

### Analytics (ANL) — 25 tasks
| ID | Task | Layer |
|----|------|-------|
| P3-ANL-001 | RecruitmentMetricSnapshot, FunnelMetric | M |
| P3-ANL-002 | PlacementMetricSnapshot, ConversionMetric | M |
| P3-ANL-003 | UserInsightSnapshot, ProfileStrengthReport | M |
| P3-ANL-004 | Analytics schemas | S |
| P3-ANL-005 | Analytics migrations | G |
| P3-ANL-006 | Recruitment analytics service | V |
| P3-ANL-007 | Placement analytics service | V |
| P3-ANL-008 | Personal insights service | V |
| P3-ANL-009 | Analytics routers | R |
| P3-ANL-010 | Frontend: recruiter funnel dashboard | F |
| P3-ANL-011 | Frontend: placement outcomes dashboard | F |
| P3-ANL-012 | Frontend: profile strength, application performance | F |

### Audit (AUD) — 15 tasks
| ID | Task | Layer |
|----|------|-------|
| P3-AUD-001 | audit.py: AuditLog - verify | M |
| P3-AUD-002 | TelemetryEvent, ApiPerformanceMetric | M |
| P3-AUD-003 | Audit schemas | S |
| P3-AUD-004 | Audit router: list, filter | R |
| P3-AUD-005 | Frontend: audit explorer | F |

### Admin P3 (ADM) — 30 tasks
| ID | Task | Layer |
|----|------|-------|
| P3-ADM-021 | Company admin: recruiter assignment | V,R,F |
| P3-ADM-022 | Institution admin: program/batch management | V,R,F |
| P3-ADM-023 | Permissions & roles: ScopedAccessRule | M |
| P3-ADM-024 | Permission service: assign, scope | V |
| P3-ADM-025 | Frontend: roles, permissions UI | F |
| P3-ADM-026 | Telemetry: health dashboard | F |

---

## Phase 4: Ecosystem (Tasks 381–500+)

### Assessments (ASM) — 30 tasks
| ID | Task | Layer |
|----|------|-------|
| P4-ASM-001 | assessments.py: LearningPath, PreparationTask | M |
| P4-ASM-002 | PracticeSet, Assessment, AssessmentAttempt | M |
| P4-ASM-003 | MockInterview, ReadinessScore, SkillGapInsight | M |
| P4-ASM-004 | RoleFitInsight, PracticeResult | M |
| P4-ASM-005 | Assessments schemas, migrations | S,G |
| P4-ASM-006 | Readiness service, assessment service | V |
| P4-ASM-007 | Frontend: preparation hub, learning paths | F |
| P4-ASM-008 | Frontend: mock tests, readiness score | F |

### Profile - Network (PROF) — 25 tasks
| ID | Task | Layer |
|----|------|-------|
| P4-PROF-001 | profiles.py: Connection, ReferralRequest | M |
| P4-PROF-002 | MentorRelationship, Endorsement | M |
| P4-PROF-003 | ProfileSummary, EducationRecord, ExperienceRecord | M |
| P4-PROF-004 | Network service: connections, referrals | V |
| P4-PROF-005 | Frontend: network, people search | F |
| P4-PROF-006 | Frontend: connection request, endorse | F |

### Admin P4 (ADM) — 25 tasks
| ID | Task | Layer |
|----|------|-------|
| P4-ADM-051 | SupportCase, UserLookup | M |
| P4-ADM-052 | SimulationRun, TestScenario | M |
| P4-ADM-053 | FeatureFlag, ConfigEntry, ScopeOverride | M |
| P4-ADM-054 | Support service: lookup user, inspect | V |
| P4-ADM-055 | Simulator service: run scenario | V |
| P4-ADM-056 | Config service: flags, overrides | V |
| P4-ADM-057 | Frontend: support tools | F |
| P4-ADM-058 | Frontend: simulator | F |
| P4-ADM-059 | Frontend: feature flags, config | F |

---

## Cross-Cutting Tasks (50+)

| ID | Task | Phase |
|----|------|-------|
| X-001 | Scope-aware RBAC: backend middleware | All |
| X-002 | Scope-aware RBAC: frontend permissions.js | All |
| X-003 | Navigation: persona-specific nav from Module Map | All |
| X-004 | Route resolution: view + roleFlags + scope | All |
| X-005 | API boundary: owner-domain write enforcement | All |
| X-006 | Audit: log critical mutations | All |
| X-007 | Migration: JobProfile/JobPosting split | P1 |
| X-008 | Migration: ProfileSummary, Education, Experience | P1–P2 |
| X-009 | Migration: ApplicationTimelineEvent | P1 |
| X-010 | Migration: Conversation, Message | P2 |
| X-011 | Migration: Outreach, InterviewFeedback | P2 |
| X-012 | Migration: PlacementOutcome, EligibilityEvaluation | P2 |
| X-013 | Migration: FeatureFlag, Telemetry | P3 |
| X-014 | E2E: candidate placement flow | P2 |
| X-015 | E2E: recruiter lateral flow | P1–P2 |
| X-016 | E2E: institution admin cycle flow | P2 |

---

## Task Count Summary

| Phase | Est. Tasks |
|-------|------------|
| Phase 1 | ~145 |
| Phase 2 | ~135 |
| Phase 3 | ~100 |
| Phase 4 | ~80 |
| Cross-cutting | ~50 |
| **Total** | **~510** |
