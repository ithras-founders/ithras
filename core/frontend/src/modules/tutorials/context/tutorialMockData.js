/**
 * Role-specific mock data for guided tutorial mode.
 * This data is only used when isTutorialMode is true and never appears on actual pages.
 */
import { CycleCategory } from '../../shared/types.js';

const createDemoUser = (role) => ({
  id: 'demo',
  email: 'demo@tutorial',
  name: 'Demo User',
  role,
  institution: 'Demo Institute',
  institution_id: 'inst-demo',
  company_id: role === 'RECRUITER' ? 'demo-company' : undefined,
  companyId: role === 'RECRUITER' ? 'demo-company' : undefined,
});

const CANDIDATE_MOCK = {
  user: createDemoUser('CANDIDATE'),
  institution: { id: 'inst-demo', name: 'Demo Institute', logo_url: null },
  policy: {
    id: 'demo-policy',
    name: 'Placement Policy 2024-25',
    status: 'ACTIVE',
    globalCaps: { maxShortlists: 15, distribution: [3, 5, 7] },
    levels: ['Tier 1', 'Tier 2', 'Tier 3'],
    usedPerTier: [1, 2, 0],
  },
  companies: [
    { id: 'c1', name: 'Apex Consulting', logo: null, sector: 'Consulting' },
    { id: 'c2', name: 'Goldman Sachs', logo: null, sector: 'Finance' },
    { id: 'c3', name: 'Amazon', logo: null, sector: 'Technology' },
    { id: 'c4', name: 'Hindustan Unilever', logo: null, sector: 'FMCG' },
    { id: 'c5', name: 'Bain & Company', logo: null, sector: 'Consulting' },
    { id: 'c6', name: 'Microsoft', logo: null, sector: 'Technology' },
    { id: 'c7', name: 'JP Morgan', logo: null, sector: 'Finance' },
    { id: 'c8', name: 'Flipkart', logo: null, sector: 'E-Commerce' },
  ],
  jobs: [
    { id: 'j1', company_id: 'c1', title: 'Associate Consultant', slot: 'Slot 1', fixed_comp: 3500000, sector: 'Consulting', skills: ['Strategy', 'Problem Solving', 'Communication'] },
    { id: 'j2', company_id: 'c1', title: 'Business Analyst', slot: 'Slot 1', fixed_comp: 2800000, sector: 'Consulting', skills: ['Analytics', 'Excel', 'SQL'] },
    { id: 'j3', company_id: 'c2', title: 'Investment Banking Analyst', slot: 'Slot 1', fixed_comp: 3200000, sector: 'Finance', skills: ['Financial Modeling', 'Valuation'] },
    { id: 'j4', company_id: 'c3', title: 'Product Manager', slot: 'Slot 1', fixed_comp: 2500000, sector: 'Technology', skills: ['Product Strategy', 'Data Analysis'] },
    { id: 'j5', company_id: 'c4', title: 'Management Trainee', slot: 'Slot 1', fixed_comp: 2200000, sector: 'FMCG', skills: ['Marketing', 'Brand Management'] },
    { id: 'j6', company_id: 'c5', title: 'Associate Consultant', slot: 'Slot 1', fixed_comp: 3400000, sector: 'Consulting', skills: ['Strategy', 'Analytics'] },
    { id: 'j7', company_id: 'c6', title: 'Program Manager', slot: 'Slot 2', fixed_comp: 2600000, sector: 'Technology', skills: ['Project Management', 'Agile'] },
    { id: 'j8', company_id: 'c7', title: 'Equity Research Analyst', slot: 'Slot 2', fixed_comp: 2000000, sector: 'Finance', skills: ['Research', 'Financial Analysis'] },
  ],
  cycles: [
    { id: 'cy1', name: 'Final Placements 2024-25', category: CycleCategory.CURRENT },
    { id: 'cy2', name: 'Final Placements 2023-24', category: CycleCategory.HISTORICAL },
  ],
  shortlists: [
    { id: 's1', company_id: 'c1', status: 'Active' },
    { id: 's2', company_id: 'c3', status: 'Active' },
  ],
  historicalHires: [
    { id: 'h1', company_id: 'c1', name: 'Arjun Mehta', year: '2024', role: 'Associate Consultant' },
    { id: 'h2', company_id: 'c1', name: 'Sneha Patel', year: '2024', role: 'Business Analyst' },
    { id: 'h3', company_id: 'c2', name: 'Vikram Singh', year: '2024', role: 'IB Analyst' },
    { id: 'h4', company_id: 'c3', name: 'Priya Sharma', year: '2024', role: 'Product Manager' },
  ],
  workflows: [
    { id: 'wf1', name: 'Apex Associate Consultant 2025', description: 'Full-time placement workflow for Apex consulting roles', institution_id: 'inst-demo', status: 'ACTIVE' },
    { id: 'wf2', name: 'Goldman Sachs IB Analyst', description: 'Investment Banking Analyst recruitment', institution_id: 'inst-demo', status: 'ACTIVE' },
    { id: 'wf3', name: 'Amazon Product Manager', description: 'PM recruitment pipeline for Amazon India', institution_id: 'inst-demo', status: 'ACTIVE' },
  ],
  applications: [
    { id: 'a1', workflow_id: 'wf1', student_id: 'demo', status: 'SHORTLISTED', cv_id: 'cv1', job_id: 'j1' },
    { id: 'a2', workflow_id: 'wf2', student_id: 'demo', status: 'SUBMITTED', cv_id: 'cv1', job_id: 'j3' },
    { id: 'a3', workflow_id: 'wf3', student_id: 'demo', status: 'SUBMITTED', cv_id: 'cv2', job_id: 'j4' },
  ],
  offers: [
    { id: 'offer1', application_id: 'a1', candidate_id: 'demo', company_id: 'c1', job_id: 'j1', status: 'PENDING', ctc: 3500000, company_name: 'Apex Consulting', job_title: 'Associate Consultant', deadline: '2025-04-15T23:59:59Z' },
  ],
  cvs: [
    { id: 'cv1', candidate_id: 'demo', status: 'VERIFIED', template_id: 'tpl-demo', pdf_url: '/uploads/cv-demo.pdf', updated_at: '2025-01-15T10:30:00Z' },
    { id: 'cv2', candidate_id: 'demo', status: 'VERIFIED', template_id: 'tpl-consulting', pdf_url: '/uploads/cv-consulting.pdf', updated_at: '2025-01-20T14:00:00Z' },
    { id: 'cv3', candidate_id: 'demo', status: 'DRAFT', template_id: 'tpl-finance', pdf_url: null, updated_at: '2025-01-22T09:00:00Z' },
  ],
  activeProcesses: [
    { id: 'ap1', company_id: 'c1', workflow_id: 'wf1', status: 'SHORTLISTED', company: { name: 'Apex Consulting' } },
    { id: 'ap2', company_id: 'c2', workflow_id: 'wf2', status: 'SUBMITTED', company: { name: 'Goldman Sachs' } },
    { id: 'ap3', company_id: 'c3', workflow_id: 'wf3', status: 'SUBMITTED', company: { name: 'Amazon' } },
  ],
  cycleStats: {
    totalCompanies: 24,
    totalRoles: 156,
    totalApplications: 892,
    avgCompensation: '28.5L',
  },
  placementSummary: [
    { company: 'Apex Consulting', roles: 15, hires: 12 },
    { company: 'Goldman Sachs', roles: 8, hires: 6 },
    { company: 'Amazon', roles: 12, hires: 10 },
    { company: 'Bain & Company', roles: 10, hires: 8 },
    { company: 'Hindustan Unilever', roles: 6, hires: 5 },
  ],
  timetableBlocks: [
    { id: 'tb1', day_of_week: 0, start_time: '09:00', end_time: '10:30', block_type: 'CLASS', recurring: true },
    { id: 'tb2', day_of_week: 0, start_time: '11:00', end_time: '12:30', block_type: 'CLASS', recurring: true },
    { id: 'tb3', day_of_week: 0, start_time: '14:00', end_time: '15:30', block_type: 'CLASS', recurring: true },
    { id: 'tb4', day_of_week: 1, start_time: '09:00', end_time: '10:30', block_type: 'CLASS', recurring: true },
    { id: 'tb5', day_of_week: 1, start_time: '11:00', end_time: '12:30', block_type: 'CLASS', recurring: true },
    { id: 'tb6', day_of_week: 1, start_time: '14:00', end_time: '16:00', block_type: 'PERSONAL', recurring: false },
    { id: 'tb7', day_of_week: 2, start_time: '10:00', end_time: '12:00', block_type: 'CLASS', recurring: true },
    { id: 'tb8', day_of_week: 2, start_time: '14:00', end_time: '15:30', block_type: 'CLASS', recurring: true },
    { id: 'tb9', day_of_week: 3, start_time: '09:00', end_time: '11:00', block_type: 'CLASS', recurring: true },
    { id: 'tb10', day_of_week: 3, start_time: '15:00', end_time: '17:00', block_type: 'EXAM', recurring: false },
    { id: 'tb11', day_of_week: 4, start_time: '09:00', end_time: '10:30', block_type: 'CLASS', recurring: true },
    { id: 'tb12', day_of_week: 4, start_time: '11:00', end_time: '12:00', block_type: 'PERSONAL', recurring: false },
    { id: 'tb13', day_of_week: 4, start_time: '14:00', end_time: '16:00', block_type: 'CLASS', recurring: true },
  ],
  stageProgress: {
    'a1': [
      { id: 'sp1', stage_id: 'stg1', stage_name: 'Application', status: 'PASSED', moved_at: '2025-01-20T10:00:00Z' },
      { id: 'sp2', stage_id: 'stg2', stage_name: 'Shortlist', status: 'IN_PROGRESS', moved_at: '2025-02-05T14:30:00Z' },
      { id: 'sp3', stage_id: 'stg3', stage_name: 'Interview', status: 'NOT_STARTED' },
    ],
    'a2': [
      { id: 'sp4', stage_id: 'stg1', stage_name: 'Application', status: 'IN_PROGRESS', moved_at: '2025-02-10T09:00:00Z' },
      { id: 'sp5', stage_id: 'stg2', stage_name: 'Shortlist', status: 'NOT_STARTED' },
    ],
    'a3': [
      { id: 'sp6', stage_id: 'stg1', stage_name: 'Application', status: 'IN_PROGRESS', moved_at: '2025-02-15T11:00:00Z' },
      { id: 'sp7', stage_id: 'stg2', stage_name: 'Case Study', status: 'NOT_STARTED' },
      { id: 'sp8', stage_id: 'stg3', stage_name: 'Final Round', status: 'NOT_STARTED' },
    ],
  },
  cycleAnalytics: {
    'cy1': {
      total_jobs: 156, total_applications: 892, total_offers: 108, accepted_offers: 95,
      offer_rate_pct: 12.1, median_ctc: 28.5,
      sector_distribution: { Consulting: 45, Finance: 38, Technology: 42, 'General Management': 18, FMCG: 13 },
      stage_funnel: { SUBMITTED: 892, SHORTLISTED: 420, IN_PROGRESS: 185, SELECTED: 108 },
      top_recruiters: [
        { company: 'Apex Consulting', offers: 12 },
        { company: 'Amazon', offers: 10 },
        { company: 'BCG', offers: 8 },
        { company: 'Goldman Sachs', offers: 6 },
        { company: 'Microsoft', offers: 5 },
      ],
    },
  },
  notifications: [
    { id: 'n1', title: 'Shortlisted by Apex Consulting', message: 'You have been shortlisted for the Associate Consultant role.', notification_type: 'SHORTLIST', is_read: false, created_at: '2025-02-28T10:00:00Z' },
    { id: 'n2', title: 'Offer Received', message: 'Apex Consulting has extended an offer for ₹35L CTC. Respond by April 15.', notification_type: 'OFFER', is_read: false, created_at: '2025-02-27T14:00:00Z' },
    { id: 'n3', title: 'Application Update', message: 'Your application for Goldman Sachs IB Analyst is under review.', notification_type: 'APPLICATION_UPDATE', is_read: true, created_at: '2025-02-26T09:00:00Z' },
    { id: 'n4', title: 'Deadline Reminder', message: 'Amazon PM application window closes in 2 days.', notification_type: 'REMINDER', is_read: false, created_at: '2025-02-25T08:00:00Z' },
    { id: 'n5', title: 'CV Verified', message: 'Your Standard CV has been verified by the placement team.', notification_type: 'CV_UPDATE', is_read: true, created_at: '2025-02-24T16:00:00Z' },
  ],
};

const RECRUITER_MOCK = {
  user: createDemoUser('RECRUITER'),
  company: { id: 'demo-company', name: 'Apex Consulting', logo: null },
  institutions: [
    { id: 'inst1', name: 'Demo Institution', tier: 'Tier 1' },
    { id: 'inst2', name: 'Partner Business School', tier: 'Tier 1' },
    { id: 'lateral', name: 'Lateral Hiring', tier: 'Lateral' },
  ],
  jobs: [
    { id: 'j1', title: 'Associate Consultant', sector: 'Consulting', slot: 'Slot 1', institutionId: 'inst1', fixed_comp: 3500000 },
    { id: 'j2', title: 'Business Analyst', sector: 'Analytics', slot: 'Slot 1', institutionId: 'inst1', fixed_comp: 2800000 },
    { id: 'j3', title: 'Digital Consultant', sector: 'Technology', slot: 'Slot 2', institutionId: 'inst1', fixed_comp: 3000000 },
    { id: 'j4', title: 'Associate Consultant', sector: 'Consulting', slot: 'Slot 1', institutionId: 'inst2', fixed_comp: 3500000 },
  ],
  cycles: [
    { id: 'cy1', name: 'Final Placements 2024-25', category: CycleCategory.CURRENT, stats: [{ companyId: 'demo-company', totalHires: 12 }] },
    { id: 'cy2', name: 'Placements 2023-24', category: CycleCategory.HISTORICAL, stats: [{ companyId: 'demo-company', totalHires: 8 }] },
  ],
  companies: [],
  workflows: [
    { id: 'wf-r1', name: 'Apex Associate 2025', description: 'Associate Consultant recruitment', company_id: 'demo-company', institution_id: 'inst1', status: 'ACTIVE', stages: [
      { id: 'ws1', name: 'Application', stage_type: 'APPLICATION', stage_number: 1 },
      { id: 'ws2', name: 'Shortlist', stage_type: 'SHORTLIST', stage_number: 2 },
      { id: 'ws3', name: 'Interview Round 1', stage_type: 'INTERVIEW', stage_number: 3 },
      { id: 'ws4', name: 'Final Interview', stage_type: 'INTERVIEW', stage_number: 4 },
      { id: 'ws5', name: 'Offer', stage_type: 'OFFER', stage_number: 5 },
    ]},
    { id: 'wf-r2', name: 'Apex Analyst 2025', description: 'Business Analyst recruitment', company_id: 'demo-company', institution_id: 'inst1', status: 'ACTIVE' },
    { id: 'wf-r3', name: 'Apex Associate Partner 2025', description: 'Associate Consultant at partner institution', company_id: 'demo-company', institution_id: 'inst2', status: 'DRAFT' },
  ],
  calendarSlots: [
    { id: 'cs1', start_time: new Date(Date.now() + 86400000).toISOString(), end_time: new Date(Date.now() + 90000000).toISOString(), slot_type: 'INTERVIEW', status: 'AVAILABLE', job_id: 'j1' },
    { id: 'cs2', start_time: new Date(Date.now() + 172800000).toISOString(), end_time: new Date(Date.now() + 176400000).toISOString(), slot_type: 'PRESENTATION', status: 'BOOKED', job_id: 'j2' },
    { id: 'cs3', start_time: new Date(Date.now() + 259200000).toISOString(), end_time: new Date(Date.now() + 262800000).toISOString(), slot_type: 'NETWORKING', status: 'AVAILABLE', job_id: null },
  ],
  applications: [
    { id: 'ra1', workflow_id: 'wf-r1', student_id: 'stu1', student_name: 'Arjun Mehta', status: 'SHORTLISTED', current_stage_id: 'ws2', job_id: 'j1' },
    { id: 'ra2', workflow_id: 'wf-r1', student_id: 'stu2', student_name: 'Priya Sharma', status: 'SUBMITTED', current_stage_id: 'ws1', job_id: 'j1' },
    { id: 'ra3', workflow_id: 'wf-r1', student_id: 'stu3', student_name: 'Rohan Gupta', status: 'SHORTLISTED', current_stage_id: 'ws3', job_id: 'j1' },
    { id: 'ra4', workflow_id: 'wf-r2', student_id: 'stu4', student_name: 'Sneha Patel', status: 'SUBMITTED', current_stage_id: 'ws1', job_id: 'j2' },
  ],
  companyOffers: [
    { id: 'co1', application_id: 'ra1', candidate_id: 'stu1', company_id: 'demo-company', job_id: 'j1', status: 'PENDING', ctc: 3500000 },
  ],
  institutionStats: {
    'inst1': { totalHires: 12, roles: 3, pendingApplications: 45 },
    'inst2': { totalHires: 8, roles: 1, pendingApplications: 22 },
  },
  jdSubmissions: [
    { id: 'jd1', workflow_id: 'wf-r1', company_id: 'demo-company', job_title: 'Associate Consultant', status: 'APPROVED', sector: 'Consulting', fixed_comp: 3500000, submitted_at: '2025-01-10T10:00:00Z', approved_at: '2025-01-12T14:00:00Z' },
    { id: 'jd2', workflow_id: 'wf-r2', company_id: 'demo-company', job_title: 'Business Analyst', status: 'PENDING', sector: 'Analytics', fixed_comp: 2800000, submitted_at: '2025-02-20T09:00:00Z' },
    { id: 'jd3', workflow_id: 'wf-r3', company_id: 'demo-company', job_title: 'Digital Consultant', status: 'REJECTED', sector: 'Technology', fixed_comp: 3000000, submitted_at: '2025-02-15T11:00:00Z', rejection_reason: 'Compensation below threshold for Slot 2' },
  ],
  applicationRequests: [
    { id: 'ar1', workflow_id: 'wf-r1', institution_id: 'inst1', status: 'APPROVED', request_type: 'OPEN_APPLICATIONS', scheduled_open_at: '2025-02-01T00:00:00Z', scheduled_close_at: '2025-02-28T23:59:59Z' },
    { id: 'ar2', workflow_id: 'wf-r2', institution_id: 'inst1', status: 'PENDING', request_type: 'OPEN_APPLICATIONS', scheduled_open_at: '2025-03-01T00:00:00Z', scheduled_close_at: '2025-03-15T23:59:59Z' },
  ],
  notifications: [
    { id: 'rn1', title: 'JD Approved', message: 'Your JD for Associate Consultant has been approved.', notification_type: 'JD_APPROVAL', is_read: true, created_at: '2025-01-12T14:00:00Z' },
    { id: 'rn2', title: 'New Application', message: 'Priya Sharma has applied for Associate Consultant.', notification_type: 'APPLICATION', is_read: false, created_at: '2025-02-28T10:30:00Z' },
    { id: 'rn3', title: 'Stage Progression Approved', message: '3 candidates progressed to Interview Round 1.', notification_type: 'PROGRESSION', is_read: false, created_at: '2025-02-28T09:00:00Z' },
    { id: 'rn4', title: 'JD Rejected', message: 'Your JD for Digital Consultant was rejected. Reason: Compensation below threshold.', notification_type: 'JD_REJECTION', is_read: true, created_at: '2025-02-16T10:00:00Z' },
  ],
};

const PLACEMENT_TEAM_MOCK = {
  user: createDemoUser('PLACEMENT_TEAM'),
  policy: {
    id: 'demo-policy',
    name: 'Placement Governance 2024-25',
    status: 'ACTIVE',
    levels: ['Tier 1', 'Tier 2', 'Tier 3'],
    globalCaps: { maxShortlists: 15, distribution: [3, 5, 7] },
  },
  policyTemplates: [
    { id: 'tpl-gov-1', template_name: 'Standard Governance', levels: ['Tier 1', 'Tier 2', 'Tier 3'], stages: ['Applications', 'Shortlist', 'Interview', 'Offer'], student_statuses: ['Registered', 'Shortlisted', 'Placed'], status: 'ACTIVE' },
    { id: 'tpl-gov-2', template_name: 'Consulting Placement Policy', levels: ['Consulting', 'Finance', 'Tech'], stages: ['Applications', 'Shortlist', 'GD', 'Interview', 'Offer'], student_statuses: ['Eligible', 'Shortlisted', 'Offered'], status: 'ACTIVE' },
    { id: 'tpl-gov-3', template_name: 'Lateral Recruitment Policy', levels: ['Experienced Hire'], stages: ['Screening', 'Technical', 'Final', 'Offer'], student_statuses: ['Applied', 'In Process', 'Selected'], status: 'DRAFT' },
  ],
  proposals: [
    { id: 'prop1', name: 'Increase Tier 1 Cap', status: 'PENDING', proposer: 'Placement Committee', description: 'Proposal to increase Tier 1 shortlist cap from 3 to 4 for consulting firms' },
    { id: 'prop2', name: 'Add Tech Sector Tier', status: 'UNDER_REVIEW', proposer: 'Faculty Advisor', description: 'Create a separate tier classification for technology companies' },
  ],
  companies: [
    { id: 'c1', name: 'Apex Consulting' },
    { id: 'c2', name: 'Goldman Sachs' },
    { id: 'c3', name: 'Amazon' },
    { id: 'c4', name: 'Bain & Company' },
    { id: 'c5', name: 'Microsoft' },
    { id: 'c6', name: 'JP Morgan' },
  ],
  jobs: [
    { id: 'pj1', company_id: 'c1', title: 'Associate Consultant', sector: 'Consulting', jd_status: 'Approved', fixed_comp: 3500000 },
    { id: 'pj2', company_id: 'c2', title: 'IB Analyst', sector: 'Finance', jd_status: 'Submitted', fixed_comp: 3200000 },
    { id: 'pj3', company_id: 'c3', title: 'Product Manager', sector: 'Technology', jd_status: 'Approved', fixed_comp: 2500000 },
    { id: 'pj4', company_id: 'c4', title: 'Associate Consultant', sector: 'Consulting', jd_status: 'Approved', fixed_comp: 3400000 },
    { id: 'pj5', company_id: 'c5', title: 'Program Manager', sector: 'Technology', jd_status: 'Approved', fixed_comp: 2600000 },
    { id: 'pj6', company_id: 'c6', title: 'Equity Research Analyst', sector: 'Finance', jd_status: 'Submitted', fixed_comp: 2000000 },
  ],
  programs: [
    { id: 'prog-mba', name: 'MBA (2-Year)', institution_id: 'inst-demo' },
    { id: 'prog-pgpex', name: 'PGPEX (1-Year)', institution_id: 'inst-demo' },
    { id: 'prog-mbaex', name: 'MBA for Executives', institution_id: 'inst-demo' },
  ],
  batches: [
    { id: 'batch1', program_id: 'prog-mba', name: 'MBA 2024', year: 2024 },
    { id: 'batch2', program_id: 'prog-mba', name: 'MBA 2025', year: 2025 },
    { id: 'batch3', program_id: 'prog-pgpex', name: 'PGPEX 2025', year: 2025 },
  ],
  cycles: [
    { id: 'cy1', name: 'Final Placements 2024-25', status: 'APPLICATIONS_OPEN', start_date: '2025-01-15T00:00:00Z', end_date: '2025-04-30T23:59:59Z', created_at: '2024-12-01T10:00:00Z' },
    { id: 'cy2', name: 'Summer Internships 2025', status: 'SHORTLISTING', start_date: '2025-02-01T00:00:00Z', end_date: '2025-03-31T23:59:59Z', created_at: '2025-01-10T10:00:00Z' },
    { id: 'cy3', name: 'Final Placements 2023-24', status: 'CLOSED', start_date: '2024-01-15T00:00:00Z', end_date: '2024-04-30T23:59:59Z', created_at: '2023-12-01T10:00:00Z' },
  ],
  workflows: [
    { id: 'wf-pt-1', name: 'Apex Placements 2025', institution_id: 'inst-demo', company_id: 'c1', status: 'ACTIVE', stages: [
      { id: 'ps1', name: 'Application', stage_type: 'APPLICATION', stage_number: 1 },
      { id: 'ps2', name: 'Shortlist', stage_type: 'SHORTLIST', stage_number: 2 },
      { id: 'ps3', name: 'Interview', stage_type: 'INTERVIEW', stage_number: 3 },
      { id: 'ps4', name: 'Offer', stage_type: 'OFFER', stage_number: 4 },
    ]},
    { id: 'wf-pt-2', name: 'Goldman Sachs IB 2025', institution_id: 'inst-demo', company_id: 'c2', status: 'ACTIVE' },
    { id: 'wf-pt-3', name: 'Amazon PM Pipeline 2025', institution_id: 'inst-demo', company_id: 'c3', status: 'DRAFT' },
  ],
  approvals: [
    { id: 'appr1', approval_type: 'JD_SUBMISSION', workflow_id: 'wf-pt-2', status: 'PENDING', created_at: '2025-02-28T10:00:00Z', requested_data: { submission_id: 'jd-sub1', job_title: 'IB Analyst', sector: 'Finance' } },
    { id: 'appr2', approval_type: 'STAGE_PROGRESSION', workflow_id: 'wf-pt-1', status: 'PENDING', created_at: '2025-02-28T09:30:00Z', requested_data: { student_ids: ['stu1', 'stu2', 'stu3'], from_stage: 'Shortlist', to_stage: 'Interview' }, user_name: 'Priya Sharma', user_email: 'priya2024@email.iimcal.ac.in' },
    { id: 'appr3', approval_type: 'JD_SUBMISSION', workflow_id: 'wf-pt-3', status: 'PENDING', created_at: '2025-02-28T09:00:00Z', requested_data: { submission_id: 'jd-sub2', job_title: 'Product Manager', sector: 'Technology' } },
    { id: 'appr4', approval_type: 'STAGE_PROGRESSION', workflow_id: 'wf-pt-1', status: 'PENDING', created_at: '2025-02-27T16:00:00Z', requested_data: { student_ids: ['stu4'], from_stage: 'Interview', to_stage: 'Offer' }, user_name: 'Arjun Mehta', user_email: 'arjun2024@email.iimcal.ac.in' },
  ],
  cvTemplates: [
    { id: 'cvt1', name: 'Standard CV', sections: ['Personal Info', 'Education', 'Work Experience', 'Achievements', 'Extra-curricular'], status: 'PUBLISHED' },
    { id: 'cvt2', name: 'Consulting Format', sections: ['Summary', 'Education', 'Professional Experience', 'Leadership', 'Skills'], status: 'PUBLISHED' },
    { id: 'cvt3', name: 'Finance Format', sections: ['Profile', 'Education', 'Work Experience', 'Certifications', 'Interests'], status: 'DRAFT' },
  ],
  cvSubmissions: [
    { id: 'cvsub1', candidate_id: 'stu1', status: 'SUBMITTED', template_id: 'cvt1', updated_at: '2025-02-26T14:30:00Z', data: {}, student_name: 'Priya Sharma' },
    { id: 'cvsub2', candidate_id: 'stu2', status: 'SUBMITTED', template_id: 'cvt2', updated_at: '2025-02-27T09:15:00Z', data: {}, student_name: 'Arjun Mehta' },
    { id: 'cvsub3', candidate_id: 'stu3', status: 'VERIFIED', template_id: 'cvt1', updated_at: '2025-02-25T16:45:00Z', data: {}, student_name: 'Rohan Gupta' },
    { id: 'cvsub4', candidate_id: 'stu4', status: 'SUBMITTED', template_id: 'cvt2', updated_at: '2025-02-28T08:00:00Z', data: {}, student_name: 'Sneha Patel' },
    { id: 'cvsub5', candidate_id: 'stu5', status: 'REJECTED', template_id: 'cvt1', updated_at: '2025-02-24T11:20:00Z', data: {}, student_name: 'Vikram Singh' },
    { id: 'cvsub6', candidate_id: 'stu6', status: 'SUBMITTED', template_id: 'cvt1', updated_at: '2025-02-28T10:30:00Z', data: {}, student_name: 'Ananya Das' },
    { id: 'cvsub7', candidate_id: 'stu7', status: 'VERIFIED', template_id: 'cvt2', updated_at: '2025-02-23T13:00:00Z', data: {}, student_name: 'Rahul Joshi' },
    { id: 'cvsub8', candidate_id: 'stu8', status: 'SUBMITTED', template_id: 'cvt3', updated_at: '2025-02-27T15:45:00Z', data: {}, student_name: 'Meera Nair' },
    { id: 'cvsub9', candidate_id: 'stu9', status: 'DRAFT', template_id: 'cvt1', updated_at: '2025-02-22T09:30:00Z', data: {}, student_name: 'Karan Malhotra' },
    { id: 'cvsub10', candidate_id: 'stu10', status: 'SUBMITTED', template_id: 'cvt2', updated_at: '2025-02-28T07:15:00Z', data: {}, student_name: 'Divya Reddy' },
    { id: 'cvsub11', candidate_id: 'stu11', status: 'VERIFIED', template_id: 'cvt1', updated_at: '2025-02-20T10:00:00Z', data: {}, student_name: 'Aditya Kumar' },
    { id: 'cvsub12', candidate_id: 'stu12', status: 'SUBMITTED', template_id: 'cvt2', updated_at: '2025-02-26T16:30:00Z', data: {}, student_name: 'Neha Verma' },
    { id: 'cvsub13', candidate_id: 'stu13', status: 'SUBMITTED', template_id: 'cvt1', updated_at: '2025-02-28T11:00:00Z', data: {}, student_name: 'Siddharth Rao' },
    { id: 'cvsub14', candidate_id: 'stu14', status: 'VERIFIED', template_id: 'cvt2', updated_at: '2025-02-21T14:15:00Z', data: {}, student_name: 'Pooja Iyer' },
  ],
  cvStudents: [
    { id: 'stu1', name: 'Priya Sharma', email: 'priya2024@email.iimcal.ac.in', role: 'CANDIDATE' },
    { id: 'stu2', name: 'Arjun Mehta', email: 'arjun2024@email.iimcal.ac.in', role: 'CANDIDATE' },
    { id: 'stu3', name: 'Rohan Gupta', email: 'rohan2024@email.iimcal.ac.in', role: 'CANDIDATE' },
    { id: 'stu4', name: 'Sneha Patel', email: 'sneha2024@email.iimcal.ac.in', role: 'CANDIDATE' },
    { id: 'stu5', name: 'Vikram Singh', email: 'vikram2024@email.iimcal.ac.in', role: 'CANDIDATE' },
    { id: 'stu6', name: 'Ananya Das', email: 'ananya2024@email.iimcal.ac.in', role: 'CANDIDATE' },
    { id: 'stu7', name: 'Rahul Joshi', email: 'rahul2024@email.iimcal.ac.in', role: 'CANDIDATE' },
    { id: 'stu8', name: 'Meera Nair', email: 'meera2024@email.iimcal.ac.in', role: 'CANDIDATE' },
    { id: 'stu9', name: 'Karan Malhotra', email: 'karan2024@email.iimcal.ac.in', role: 'CANDIDATE' },
    { id: 'stu10', name: 'Divya Reddy', email: 'divya2024@email.iimcal.ac.in', role: 'CANDIDATE' },
    { id: 'stu11', name: 'Aditya Kumar', email: 'aditya2024@email.iimcal.ac.in', role: 'CANDIDATE' },
    { id: 'stu12', name: 'Neha Verma', email: 'neha2024@email.iimcal.ac.in', role: 'CANDIDATE' },
    { id: 'stu13', name: 'Siddharth Rao', email: 'sid2024@email.iimcal.ac.in', role: 'CANDIDATE' },
    { id: 'stu14', name: 'Pooja Iyer', email: 'pooja2024@email.iimcal.ac.in', role: 'CANDIDATE' },
  ],
  masterCalendar: {
    institutions: [
      { id: 'inst-demo', name: 'Demo Institution' },
      { id: 'inst-iima', name: 'Partner Business School' },
    ],
    companies: [
      { id: 'c1', name: 'Apex Consulting' },
      { id: 'c2', name: 'Goldman Sachs' },
      { id: 'c3', name: 'Amazon' },
      { id: 'c4', name: 'Bain & Company' },
      { id: 'c5', name: 'Microsoft' },
    ],
    summary: { total_available: 186, total_tentative: 42, total_unavailable: 28, total_slots: 256 },
    slots: [
      { id: 'ms1', start_time: new Date(Date.now() + 86400000).toISOString(), end_time: new Date(Date.now() + 90000000).toISOString(), slot_type: 'INTERVIEW', status: 'AVAILABLE', available: 45, unavailable: 3, company: 'Apex Consulting' },
      { id: 'ms2', start_time: new Date(Date.now() + 172800000).toISOString(), end_time: new Date(Date.now() + 176400000).toISOString(), slot_type: 'PRESENTATION', status: 'BOOKED', available: 120, unavailable: 0, company: 'Goldman Sachs' },
      { id: 'ms3', start_time: new Date(Date.now() + 259200000).toISOString(), end_time: new Date(Date.now() + 262800000).toISOString(), slot_type: 'INTERVIEW', status: 'AVAILABLE', available: 38, unavailable: 8, company: 'Amazon' },
      { id: 'ms4', start_time: new Date(Date.now() + 345600000).toISOString(), end_time: new Date(Date.now() + 349200000).toISOString(), slot_type: 'NETWORKING', status: 'AVAILABLE', available: 95, unavailable: 5, company: 'Bain & Company' },
      { id: 'ms5', start_time: new Date(Date.now() + 432000000).toISOString(), end_time: new Date(Date.now() + 435600000).toISOString(), slot_type: 'INTERVIEW', status: 'AVAILABLE', available: 52, unavailable: 6, company: 'Microsoft' },
      { id: 'ms6', start_time: new Date(Date.now() + 518400000).toISOString(), end_time: new Date(Date.now() + 522000000).toISOString(), slot_type: 'PRESENTATION', status: 'BOOKED', available: 110, unavailable: 2, company: 'Apex Consulting' },
      { id: 'ms7', start_time: new Date(Date.now() + 604800000).toISOString(), end_time: new Date(Date.now() + 608400000).toISOString(), slot_type: 'INTERVIEW', status: 'AVAILABLE', available: 42, unavailable: 4, company: 'Goldman Sachs' },
    ],
  },
  cycleOps: {
    activeCycles: [
      { id: 'cy1', name: 'Final Placements 2024-25', status: 'APPLICATIONS_OPEN', companiesEnrolled: 24, studentsRegistered: 120, totalApplications: 892, applicationWindowStart: '2025-01-15T00:00:00Z', applicationWindowEnd: '2025-02-28T23:59:59Z', shortlistDeadline: '2025-03-15T23:59:59Z', interviewWindow: '2025-03-20T00:00:00Z', offersDeadline: '2025-04-15T23:59:59Z' },
      { id: 'cy2', name: 'Summer Internships 2025', status: 'SHORTLISTING', companiesEnrolled: 18, studentsRegistered: 95, totalApplications: 540, applicationWindowStart: '2025-02-01T00:00:00Z', applicationWindowEnd: '2025-02-20T23:59:59Z', shortlistDeadline: '2025-03-01T23:59:59Z', interviewWindow: '2025-03-05T00:00:00Z', offersDeadline: '2025-03-25T23:59:59Z' },
    ],
    closedCycles: [
      { id: 'cy3', name: 'Final Placements 2023-24', status: 'CLOSED', companiesEnrolled: 22, studentsRegistered: 115, totalApplications: 810, placedStudents: 108, avgCompensation: '27.2L', topSector: 'Consulting' },
    ],
    slotTransitions: [
      { id: 'st1', cycleId: 'cy1', fromSlot: 'Slot 1', toSlot: 'Slot 2', scheduledDate: '2025-03-01T00:00:00Z', status: 'SCHEDULED', affectedCompanies: 8 },
      { id: 'st2', cycleId: 'cy1', fromSlot: 'Slot 2', toSlot: 'Slot 3', scheduledDate: '2025-03-15T00:00:00Z', status: 'PENDING', affectedCompanies: 12 },
    ],
  },
  governanceStats: {
    totalStudents: 120,
    totalCompanies: 24,
    activeCycles: 2,
    pendingCVs: 14,
    totalShortlists: 245,
    verifiedCVs: 98,
    activeJobs: 42,
  },
  applicationRequests: [
    { id: 'ar1', workflow_id: 'wf-pt-1', company_id: 'c1', institution_id: 'inst-demo', status: 'APPROVED', request_type: 'OPEN_APPLICATIONS', requested_by: 'pt-user', scheduled_open_at: '2025-02-01T00:00:00Z', scheduled_close_at: '2025-02-28T23:59:59Z' },
    { id: 'ar2', workflow_id: 'wf-pt-2', company_id: 'c2', institution_id: 'inst-demo', status: 'PENDING', request_type: 'OPEN_APPLICATIONS', requested_by: 'pt-user', scheduled_open_at: '2025-03-01T00:00:00Z', scheduled_close_at: '2025-03-15T23:59:59Z' },
    { id: 'ar3', workflow_id: 'wf-pt-3', company_id: 'c3', institution_id: 'inst-demo', status: 'PENDING', request_type: 'OPEN_APPLICATIONS', requested_by: 'pt-user', scheduled_open_at: '2025-03-05T00:00:00Z', scheduled_close_at: '2025-03-20T23:59:59Z' },
    { id: 'ar4', workflow_id: 'wf-pt-1', company_id: 'c4', institution_id: 'inst-demo', status: 'REJECTED', request_type: 'OPEN_APPLICATIONS', requested_by: 'pt-user', rejection_reason: 'Cycle window has passed' },
  ],
  stageProgressions: [
    { id: 'sp1', workflow_id: 'wf-pt-1', from_stage: 'Application', to_stage: 'Shortlist', student_count: 15, status: 'COMPLETED', completed_at: '2025-02-20T10:00:00Z' },
    { id: 'sp2', workflow_id: 'wf-pt-1', from_stage: 'Shortlist', to_stage: 'Interview', student_count: 8, status: 'PENDING', requested_at: '2025-02-28T09:30:00Z' },
    { id: 'sp3', workflow_id: 'wf-pt-2', from_stage: 'Application', to_stage: 'Shortlist', student_count: 12, status: 'PENDING', requested_at: '2025-02-27T16:00:00Z' },
  ],
  studentDirectory: [
    { id: 'stu1', name: 'Priya Sharma', roll_number: 'MBA2024001', program: 'MBA', applications: 3, status: 'SHORTLISTED', cgpa: 8.2 },
    { id: 'stu2', name: 'Arjun Mehta', roll_number: 'MBA2024002', program: 'MBA', applications: 2, status: 'SUBMITTED', cgpa: 7.8 },
    { id: 'stu3', name: 'Rohan Gupta', roll_number: 'MBA2024003', program: 'MBA', applications: 4, status: 'IN_INTERVIEW', cgpa: 8.5 },
    { id: 'stu4', name: 'Sneha Patel', roll_number: 'MBA2024004', program: 'MBA', applications: 1, status: 'SUBMITTED', cgpa: 7.5 },
    { id: 'stu5', name: 'Vikram Singh', roll_number: 'MBA2024005', program: 'MBA', applications: 3, status: 'SELECTED', cgpa: 8.8 },
    { id: 'stu6', name: 'Ananya Das', roll_number: 'MBA2024006', program: 'MBA', applications: 2, status: 'SHORTLISTED', cgpa: 7.9 },
    { id: 'stu7', name: 'Rahul Joshi', roll_number: 'MBA2024007', program: 'MBA', applications: 5, status: 'IN_INTERVIEW', cgpa: 8.1 },
    { id: 'stu8', name: 'Meera Nair', roll_number: 'PGPEX2025001', program: 'PGPEX', applications: 2, status: 'SUBMITTED', cgpa: 7.6 },
    { id: 'stu9', name: 'Karan Malhotra', roll_number: 'MBA2024008', program: 'MBA', applications: 3, status: 'SHORTLISTED', cgpa: 8.3 },
    { id: 'stu10', name: 'Divya Reddy', roll_number: 'MBA2024009', program: 'MBA', applications: 1, status: 'SUBMITTED', cgpa: 7.4 },
  ],
  notifications: [
    { id: 'pn1', title: 'New JD Submitted', message: 'Goldman Sachs has submitted a JD for IB Analyst. Review and approve.', notification_type: 'JD_SUBMISSION', is_read: false, created_at: '2025-02-28T10:00:00Z' },
    { id: 'pn2', title: 'Stage Progression Request', message: '3 students need approval to move from Shortlist to Interview.', notification_type: 'APPROVAL_PENDING', is_read: false, created_at: '2025-02-28T09:30:00Z' },
    { id: 'pn3', title: 'CV Verification Pending', message: '4 new CVs submitted for verification.', notification_type: 'CV_REVIEW', is_read: false, created_at: '2025-02-27T16:00:00Z' },
    { id: 'pn4', title: 'Cycle Status Update', message: 'Summer Internships 2025 moved to SHORTLISTING phase.', notification_type: 'CYCLE_UPDATE', is_read: true, created_at: '2025-02-26T10:00:00Z' },
    { id: 'pn5', title: 'Application Request Approved', message: 'Recruiter approved application window for Apex Consulting.', notification_type: 'REQUEST_APPROVED', is_read: true, created_at: '2025-02-25T14:00:00Z' },
  ],
  cycleAnalytics: {
    'cy1': {
      total_jobs: 42, total_applications: 892, total_offers: 108, accepted_offers: 95,
      offer_rate_pct: 12.1, median_ctc: 28.5,
      sector_distribution: { Consulting: 12, Finance: 10, Technology: 12, 'General Management': 5, FMCG: 3 },
      stage_funnel: { SUBMITTED: 892, SHORTLISTED: 420, IN_PROGRESS: 185, SELECTED: 108 },
      top_recruiters: [
        { company: 'Apex Consulting', offers: 12 },
        { company: 'Amazon', offers: 10 },
        { company: 'BCG', offers: 8 },
      ],
    },
  },
};

const SYSTEM_ADMIN_MOCK = {
  user: { ...createDemoUser('SYSTEM_ADMIN'), institution_id: undefined },
  allUsers: [
    { id: 'u1', name: 'Shashank Gandham', email: 'shashank@ithraslabs.in', role: 'SYSTEM_ADMIN', institution_id: null, company_id: null },
    { id: 'u2', name: 'Dr. Rajesh Kumar', email: 'placement@iimcal.ac.in', role: 'PLACEMENT_TEAM', institution_id: 'inst-iimcal', company_id: null },
    { id: 'u3', name: 'Priya Sharma', email: 'priya2024@email.iimcal.ac.in', role: 'CANDIDATE', institution_id: 'inst-iimcal', company_id: null },
    { id: 'u4', name: 'Arjun Mehta', email: 'arjun2024@email.iimcal.ac.in', role: 'CANDIDATE', institution_id: 'inst-iimcal', company_id: null },
    { id: 'u5', name: 'Sneha Patel', email: 'sneha2024@email.iimcal.ac.in', role: 'CANDIDATE', institution_id: 'inst-iimcal', company_id: null },
    { id: 'u6', name: 'Vikram Singh', email: 'vikram@apexconsulting.com', role: 'RECRUITER', institution_id: null, company_id: 'comp-mck' },
    { id: 'u7', name: 'Ananya Das', email: 'ananya@goldmansachs.com', role: 'RECRUITER', institution_id: null, company_id: 'comp-gs' },
    { id: 'u8', name: 'Prof. Anil Gupta', email: 'faculty@iimcal.ac.in', role: 'FACULTY_OBSERVER', institution_id: 'inst-iimcal', company_id: null },
    { id: 'u9', name: 'Rahul Joshi', email: 'placement_admin@iimcal.ac.in', role: 'PLACEMENT_ADMIN', institution_id: 'inst-iimcal', company_id: null },
    { id: 'u10', name: 'Neha Verma', email: 'neha@amazon.in', role: 'RECRUITER', institution_id: null, company_id: 'comp-amz' },
  ],
  institutions: [
    { id: 'inst-iimcal', name: 'Demo Institution', tier: 'Tier 1', location: 'Kolkata, India', programs: [
      { id: 'prog-mba', name: 'MBA (2-Year)', students: 480 },
      { id: 'prog-pgpex', name: 'PGPEX (1-Year)', students: 55 },
      { id: 'prog-mbaex', name: 'MBA for Executives', students: 120 },
    ]},
    { id: 'inst-iima', name: 'Partner Business School', tier: 'Tier 1', location: 'Ahmedabad, India', programs: [
      { id: 'prog-pgp', name: 'PGP', students: 420 },
    ]},
  ],
  companies: [
    { id: 'comp-mck', name: 'Apex Consulting', logo: null, last_year_hires: 12 },
    { id: 'comp-gs', name: 'Goldman Sachs', logo: null, last_year_hires: 8 },
    { id: 'comp-amz', name: 'Amazon', logo: null, last_year_hires: 15 },
    { id: 'comp-bcg', name: 'BCG', logo: null, last_year_hires: 10 },
  ],
  roles: [
    { id: 'role-sa', name: 'System Admin', type: 'PREDEFINED', is_system: true, permissions: Array(24).fill(null).map((_, i) => ({ code: 'perm_' + (i + 1) })), description: 'Full platform access' },
    { id: 'role-pt', name: 'Placement Team', type: 'PREDEFINED', is_system: true, permissions: Array(18).fill(null).map((_, i) => ({ code: 'perm_' + (i + 1) })), description: 'Placement governance and approvals' },
    { id: 'role-pa', name: 'Placement Admin', type: 'PREDEFINED', is_system: false, permissions: Array(20).fill(null).map((_, i) => ({ code: 'perm_' + (i + 1) })), description: 'Extended placement control' },
    { id: 'role-cand', name: 'Candidate', type: 'PREDEFINED', is_system: true, permissions: Array(6).fill(null).map((_, i) => ({ code: 'perm_' + (i + 1) })), description: 'Student applicant' },
    { id: 'role-rec', name: 'Recruiter', type: 'PREDEFINED', is_system: true, permissions: Array(10).fill(null).map((_, i) => ({ code: 'perm_' + (i + 1) })), description: 'Company recruitment manager' },
    { id: 'role-fac', name: 'Faculty Observer', type: 'PREDEFINED', is_system: false, permissions: Array(4).fill(null).map((_, i) => ({ code: 'perm_' + (i + 1) })), description: 'Read-only faculty access' },
    { id: 'role-ia', name: 'Institution Admin', type: 'PREDEFINED', is_system: false, permissions: Array(14).fill(null).map((_, i) => ({ code: 'perm_' + (i + 1) })), description: 'Institution-level management' },
    { id: 'role-custom', name: 'Department Coordinator', type: 'CUSTOM', is_system: false, permissions: Array(8).fill(null).map((_, i) => ({ code: 'perm_' + (i + 1) })), description: 'Custom role for department heads' },
  ],
  telemetryData: {
    summary: {
      total_requests: 45892,
      success_rate: 0.987,
      avg_latency_ms: 42,
      p50_ms: 28,
      p95_ms: 145,
      p99_ms: 320,
      active_users: 34,
      success_count: 45296,
      '4xx_count': 412,
      '5xx_count': 184,
    },
    timeseries: Array.from({ length: 24 }, (_, i) => ({
      ts: Math.floor(Date.now() / 1000) - (23 - i) * 3600,
      count: Math.floor(Math.random() * 200 + 100),
      avg_ms: Math.floor(Math.random() * 40 + 25),
      errors: Math.floor(Math.random() * 5),
    })),
    metrics: {
      metrics: [
        { method: 'GET', path: '/api/v1/users', total: 8420, '2xx': 8350, '4xx': 50, '5xx': 20, avg_ms: 35, p50_ms: 22, p95_ms: 98, p99_ms: 210 },
        { method: 'POST', path: '/api/v1/auth/login', total: 5200, '2xx': 4800, '4xx': 380, '5xx': 20, avg_ms: 85, p50_ms: 65, p95_ms: 220, p99_ms: 450 },
        { method: 'GET', path: '/api/v1/companies', total: 4100, '2xx': 4090, '4xx': 8, '5xx': 2, avg_ms: 28, p50_ms: 18, p95_ms: 75, p99_ms: 150 },
        { method: 'GET', path: '/api/v1/jobs', total: 3800, '2xx': 3780, '4xx': 15, '5xx': 5, avg_ms: 45, p50_ms: 30, p95_ms: 120, p99_ms: 280 },
        { method: 'POST', path: '/api/v1/applications', total: 2400, '2xx': 2350, '4xx': 42, '5xx': 8, avg_ms: 120, p50_ms: 95, p95_ms: 320, p99_ms: 500 },
        { method: 'GET', path: '/api/v1/workflows', total: 2100, '2xx': 2095, '4xx': 3, '5xx': 2, avg_ms: 38, p50_ms: 25, p95_ms: 85, p99_ms: 180 },
      ],
    },
    clientApi: {
      endpoints: [
        { method: 'GET', path: '/api/v1/users', avg_ms: 145, p50_ms: 110, p95_ms: 380, count: 850 },
        { method: 'POST', path: '/api/v1/auth/login', avg_ms: 220, p50_ms: 180, p95_ms: 520, count: 420 },
        { method: 'GET', path: '/api/v1/companies', avg_ms: 95, p50_ms: 72, p95_ms: 240, count: 620 },
      ],
    },
    pages: {
      pages: [
        { product: 'profiles', view: 'dashboard', count: 245, avg_duration_ms: 35000 },
        { product: 'profiles', view: 'applications', count: 180, avg_duration_ms: 48000 },
        { product: 'recruitment-university', view: 'workflow-manager', count: 120, avg_duration_ms: 62000 },
        { product: 'cv', view: 'cv', count: 95, avg_duration_ms: 180000 },
        { product: 'calendar', view: 'calendar', count: 78, avg_duration_ms: 25000 },
      ],
    },
    activeUsers: {
      active_count: 34,
      users: [
        { user_id: 'priya2024', events: 245, pages_visited: 12, last_seen: Math.floor(Date.now() / 1000) - 120 },
        { user_id: 'arjun2024', events: 198, pages_visited: 8, last_seen: Math.floor(Date.now() / 1000) - 300 },
        { user_id: 'vikram_mck', events: 156, pages_visited: 6, last_seen: Math.floor(Date.now() / 1000) - 600 },
        { user_id: 'placement_team', events: 320, pages_visited: 15, last_seen: Math.floor(Date.now() / 1000) - 60 },
        { user_id: 'sneha2024', events: 134, pages_visited: 7, last_seen: Math.floor(Date.now() / 1000) - 900 },
      ],
    },
    dbHealth: {
      total_tables: 18,
      database_size_bytes: 52428800,
      tables: [
        { table_name: 'users', table_schema: 'public', row_count: 655, size_bytes: 8388608 },
        { table_name: 'applications', table_schema: 'public', row_count: 2840, size_bytes: 12582912 },
        { table_name: 'workflows', table_schema: 'public', row_count: 48, size_bytes: 1048576 },
        { table_name: 'jobs', table_schema: 'public', row_count: 156, size_bytes: 4194304 },
        { table_name: 'cvs', table_schema: 'public', row_count: 1240, size_bytes: 6291456 },
        { table_name: 'shortlists', table_schema: 'public', row_count: 3200, size_bytes: 5242880 },
        { table_name: 'roles', table_schema: 'public', row_count: 8, size_bytes: 65536 },
        { table_name: 'permissions', table_schema: 'public', row_count: 42, size_bytes: 131072 },
        { table_name: 'user_role_assignments', table_schema: 'public', row_count: 680, size_bytes: 2097152 },
      ],
      connections: { total: 12, active: 4, idle: 7, idle_in_transaction: 1 },
    },
    sessions: {
      sessions: [
        { session_id: 'ses_lx9k2m_a1b2c3d4', user_id: 'priya2024', client_ip: '103.21.58.193', browser: 'Chrome', os: 'macOS', device: 'Desktop', start_ts: Math.floor(Date.now() / 1000) - 3200, end_ts: Math.floor(Date.now() / 1000) - 120, duration_seconds: 3080, server_events: 48, client_events: 32, total_events: 80, pages_visited: 8, pages: ['dashboard', 'applications', 'cv', 'calendar', 'profile'], api_calls: 48, errors: 1, avg_response_ms: 38.2 },
        { session_id: 'ses_lx9k3n_e5f6g7h8', user_id: 'arjun2024', client_ip: '49.36.128.42', browser: 'Firefox', os: 'Windows', device: 'Desktop', start_ts: Math.floor(Date.now() / 1000) - 5400, end_ts: Math.floor(Date.now() / 1000) - 300, duration_seconds: 5100, server_events: 62, client_events: 45, total_events: 107, pages_visited: 12, pages: ['dashboard', 'applications', 'cv', 'calendar', 'profile', 'workflow-manager'], api_calls: 62, errors: 0, avg_response_ms: 42.5 },
        { session_id: 'ses_lx9k4p_i9j0k1l2', user_id: 'vikram_mck', client_ip: '182.73.195.88', browser: 'Chrome', os: 'Windows', device: 'Desktop', start_ts: Math.floor(Date.now() / 1000) - 1800, end_ts: Math.floor(Date.now() / 1000) - 600, duration_seconds: 1200, server_events: 25, client_events: 18, total_events: 43, pages_visited: 5, pages: ['dashboard', 'company-portal', 'workflow-detail'], api_calls: 25, errors: 2, avg_response_ms: 55.1 },
        { session_id: 'ses_lx9k5q_m3n4o5p6', user_id: 'placement_team', client_ip: '122.161.74.210', browser: 'Safari', os: 'macOS', device: 'Desktop', start_ts: Math.floor(Date.now() / 1000) - 7200, end_ts: Math.floor(Date.now() / 1000) - 60, duration_seconds: 7140, server_events: 156, client_events: 98, total_events: 254, pages_visited: 15, pages: ['governance', 'approval-queue', 'policy-templates', 'analytics', 'telemetry'], api_calls: 156, errors: 3, avg_response_ms: 31.8 },
        { session_id: 'ses_lx9k6r_q7r8s9t0', user_id: 'sneha2024', client_ip: '157.49.226.115', browser: 'Chrome', os: 'Android', device: 'Mobile', start_ts: Math.floor(Date.now() / 1000) - 900, end_ts: Math.floor(Date.now() / 1000) - 450, duration_seconds: 450, server_events: 12, client_events: 8, total_events: 20, pages_visited: 3, pages: ['dashboard', 'applications'], api_calls: 12, errors: 0, avg_response_ms: 68.3 },
        { session_id: 'ses_lx9k7s_u1v2w3x4', user_id: 'recruiter_gs', client_ip: '203.192.238.65', browser: 'Edge', os: 'Windows', device: 'Desktop', start_ts: Math.floor(Date.now() / 1000) - 4500, end_ts: Math.floor(Date.now() / 1000) - 1200, duration_seconds: 3300, server_events: 88, client_events: 55, total_events: 143, pages_visited: 9, pages: ['dashboard', 'company-portal', 'workflow-detail', 'shortlist'], api_calls: 88, errors: 1, avg_response_ms: 45.0 },
        { session_id: 'ses_lx9k8t_y5z6a7b8', user_id: 'admin_iima', client_ip: '14.139.38.192', browser: 'Chrome', os: 'Linux', device: 'Desktop', start_ts: Math.floor(Date.now() / 1000) - 2400, end_ts: Math.floor(Date.now() / 1000) - 180, duration_seconds: 2220, server_events: 95, client_events: 60, total_events: 155, pages_visited: 11, pages: ['telemetry', 'user-management', 'roles', 'database', 'audit'], api_calls: 95, errors: 0, avg_response_ms: 28.7 },
        { session_id: 'ses_lx9k9u_c9d0e1f2', user_id: 'rahul2024', client_ip: '106.51.142.87', browser: 'Safari', os: 'iOS', device: 'Mobile', start_ts: Math.floor(Date.now() / 1000) - 600, end_ts: Math.floor(Date.now() / 1000) - 240, duration_seconds: 360, server_events: 8, client_events: 6, total_events: 14, pages_visited: 2, pages: ['dashboard', 'cv'], api_calls: 8, errors: 0, avg_response_ms: 72.1 },
      ],
      total_sessions: 8,
      avg_duration_seconds: 2856,
      avg_pages_per_session: 8.1,
      browser_distribution: { Chrome: 4, Firefox: 1, Safari: 2, Edge: 1 },
      os_distribution: { macOS: 2, Windows: 3, Android: 1, Linux: 1, iOS: 1 },
      device_distribution: { Desktop: 6, Mobile: 2 },
    },
    funnels: {
      funnels: [
        {
          id: 'candidate-apply', name: 'Candidate Application Flow',
          description: 'Login → Dashboard → View Role → Submit Application',
          total_sessions: 284, conversion: 34.2,
          steps: [
            { label: 'Login', count: 284, percentage: 100, drop_off: 0 },
            { label: 'Dashboard', count: 268, percentage: 94.4, drop_off: 5.6 },
            { label: 'View Roles', count: 185, percentage: 65.1, drop_off: 31.0 },
            { label: 'Submit Application', count: 97, percentage: 34.2, drop_off: 47.6 },
          ],
        },
        {
          id: 'cv-builder', name: 'CV Builder Flow',
          description: 'Login → CV Maker → Select Template → Generate CV',
          total_sessions: 156, conversion: 52.6,
          steps: [
            { label: 'Login', count: 156, percentage: 100, drop_off: 0 },
            { label: 'Open CV Maker', count: 142, percentage: 91.0, drop_off: 9.0 },
            { label: 'Select Template', count: 118, percentage: 75.6, drop_off: 16.9 },
            { label: 'Generate CV', count: 82, percentage: 52.6, drop_off: 30.5 },
          ],
        },
        {
          id: 'recruiter-workflow', name: 'Recruiter Hiring Flow',
          description: 'Login → Company Portal → Post Role → Review Shortlist',
          total_sessions: 68, conversion: 41.2,
          steps: [
            { label: 'Login', count: 68, percentage: 100, drop_off: 0 },
            { label: 'Company Portal', count: 64, percentage: 94.1, drop_off: 5.9 },
            { label: 'Create Workflow', count: 42, percentage: 61.8, drop_off: 34.4 },
            { label: 'Review Shortlist', count: 28, percentage: 41.2, drop_off: 33.3 },
          ],
        },
        {
          id: 'calendar-schedule', name: 'Interview Scheduling Flow',
          description: 'Login → Calendar → Check Slots → Schedule',
          total_sessions: 92, conversion: 28.3,
          steps: [
            { label: 'Login', count: 92, percentage: 100, drop_off: 0 },
            { label: 'Open Calendar', count: 85, percentage: 92.4, drop_off: 7.6 },
            { label: 'Check Available Slots', count: 52, percentage: 56.5, drop_off: 38.8 },
            { label: 'Schedule Interview', count: 26, percentage: 28.3, drop_off: 50.0 },
          ],
        },
        {
          id: 'governance-policy', name: 'Policy Governance Flow',
          description: 'Dashboard → Create Policy → Submit for Approval → Approve',
          total_sessions: 34, conversion: 61.8,
          steps: [
            { label: 'Governance Dashboard', count: 34, percentage: 100, drop_off: 0 },
            { label: 'Create Policy', count: 28, percentage: 82.4, drop_off: 17.6 },
            { label: 'Submit for Approval', count: 25, percentage: 73.5, drop_off: 10.7 },
            { label: 'Approve Policy', count: 21, percentage: 61.8, drop_off: 16.0 },
          ],
        },
      ],
    },
    alerts: {
      alerts: [
        { id: 'alert-1', type: 'error_spike', severity: 'critical', title: '5xx Error Rate Elevated', message: '184 server errors (0.4% of 45,892 requests)', metric_value: 0.4, threshold: 2.0, unit: '%', detected_at: Math.floor(Date.now() / 1000) - 300, hint: 'Check server logs for stack traces. Common causes: database timeouts, memory exhaustion, unhandled exceptions.' },
        { id: 'alert-2', type: 'latency_degradation', severity: 'warning', title: 'P95 Latency Elevated', message: 'P95 latency at 520ms (threshold: 500ms)', metric_value: 520, threshold: 500, unit: 'ms', detected_at: Math.floor(Date.now() / 1000) - 600, hint: 'Investigate slow database queries, N+1 patterns, or external API latency.' },
        { id: 'alert-3', type: 'recurring_error', severity: 'warning', title: 'Recurring Error: ValidationError', message: '12 occurrences on /api/v1/applications', metric_value: 12, threshold: 3, unit: 'occurrences', detected_at: Math.floor(Date.now() / 1000) - 180, route: '/api/v1/applications', sample_error: 'Field "resume_url" is required', hint: 'Repeated ValidationError on /api/v1/applications. Check error logs and add safeguards.' },
        { id: 'alert-4', type: 'endpoint_degradation', severity: 'warning', title: 'Endpoint Degradation: /api/v1/auth/login', message: '7.7% error rate (400/5200)', metric_value: 7.7, threshold: 20.0, unit: '%', detected_at: Math.floor(Date.now() / 1000) - 900, route: '/api/v1/auth/login', hint: 'This endpoint has an unusually high error rate. Investigate handler logic and dependencies.' },
        { id: 'alert-5', type: 'tail_latency', severity: 'warning', title: 'P99 Tail Latency Spike', message: 'P99 latency at 2,100ms — worst 1% of requests', metric_value: 2100, threshold: 2000, unit: 'ms', detected_at: Math.floor(Date.now() / 1000) - 1200, hint: 'Profile the slowest endpoints. Consider query optimization, connection pooling, or caching.' },
      ],
      total: 5,
      critical_count: 1,
      warning_count: 4,
    },
  },
  simulatorScenarios: [
    { id: 'application_flow', label: 'Application Flow', description: 'End-to-end student application lifecycle', steps_count: 12, status: 'available' },
    { id: 'jd_submission_flow', label: 'JD Submission Flow', description: 'Recruiter JD submission and PT approval', steps_count: 10, status: 'available' },
    { id: 'governance_flow', label: 'Governance Flow', description: 'Policy enforcement and approval chains', steps_count: 11, status: 'available' },
    { id: 'offer_flow', label: 'Offer Flow', description: 'Offer lifecycle: accept, reject, withdraw', steps_count: 9, status: 'available' },
    { id: 'cycle_management_flow', label: 'Cycle Management', description: 'Full cycle lifecycle transitions', steps_count: 8, status: 'available' },
  ],
  testSuites: [
    { id: 'backend', label: 'Backend (pytest)', category: 'business', last_status: 'passed', last_run_id: 'run-1' },
    { id: 'simulator', label: 'Simulator Scenarios', category: 'business', last_status: 'passed', last_run_id: 'run-2' },
    { id: 'frontend', label: 'Frontend (Vitest)', category: 'technology', last_status: 'passed', last_run_id: 'run-3' },
    { id: 'e2e', label: 'E2E (Playwright)', category: 'technology', last_status: null, last_run_id: null },
  ],
  migrations: [
    { version: '001', name: 'initial_schema', applied_at: '2024-12-01T10:00:00Z', status: 'applied' },
    { version: '002', name: 'add_governance_tables', applied_at: '2024-12-15T10:00:00Z', status: 'applied' },
    { version: '003', name: 'add_cv_templates', applied_at: '2025-01-05T10:00:00Z', status: 'applied' },
    { version: '004', name: 'add_telemetry_tables', applied_at: '2025-01-20T10:00:00Z', status: 'applied' },
    { version: '005', name: 'add_offer_management', applied_at: '2025-02-10T10:00:00Z', status: 'applied' },
    { version: '006', name: 'add_application_requests', applied_at: null, status: 'pending' },
  ],
  notifications: [
    { id: 'an1', title: 'Critical Alert', message: '5xx Error Rate Elevated — 184 server errors detected.', notification_type: 'SYSTEM_ALERT', is_read: false, created_at: '2025-02-28T10:00:00Z' },
    { id: 'an2', title: 'New Institution Request', message: 'A business school has requested platform onboarding.', notification_type: 'ADMIN', is_read: false, created_at: '2025-02-27T14:00:00Z' },
    { id: 'an3', title: 'Migration Available', message: 'Migration 006 (add_application_requests) is ready to apply.', notification_type: 'MIGRATION', is_read: false, created_at: '2025-02-26T09:00:00Z' },
  ],
};

export const getTutorialMockData = (role) => {
  switch (role) {
    case 'CANDIDATE':
      return CANDIDATE_MOCK;
    case 'RECRUITER':
      return RECRUITER_MOCK;
    case 'PLACEMENT_TEAM':
    case 'PLACEMENT_ADMIN':
      return PLACEMENT_TEAM_MOCK;
    case 'SYSTEM_ADMIN':
      return SYSTEM_ADMIN_MOCK;
    default:
      return { user: createDemoUser(role), policy: null, companies: [], jobs: [], cycles: [] };
  }
};
