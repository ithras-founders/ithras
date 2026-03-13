
import { UserRole, PolicyStatus, RestrictionLevel, CycleType, ProcessStatus, CycleCategory, Sector, Slot } from '../types.js';

export const institutions = [
  { id: 'inst1', name: 'IIM Calcutta', tier: 'Tier 1', location: 'Kolkata' },
  { id: 'inst2', name: 'IIM Ahmedabad', tier: 'Tier 1', location: 'Ahmedabad' },
  { id: 'lateral', name: 'Lateral Hiring', tier: 'Lateral', location: 'Global' }
];

export const activePolicy = {
  id: 'p1',
  institutionId: 'inst1',
  status: PolicyStatus.ACTIVE,
  levels: [
    { name: 'Elite', color: 'indigo', restrictions: [RestrictionLevel.OFFER] },
    { name: 'Premium', color: 'blue', restrictions: [RestrictionLevel.SHORTLIST, RestrictionLevel.OFFER] },
    { name: 'Standard', color: 'slate', restrictions: [RestrictionLevel.APPLICATION, RestrictionLevel.SHORTLIST, RestrictionLevel.OFFER] }
  ],
  stages: [
    { id: 's1', name: 'Pre-process', rules: 'No restrictions on applications.' },
    { id: 's2', name: 'Slot 1 Interviews', rules: 'Max 12 shortlists, sector distribution applies per governance template.' },
    { id: 's3', name: 'Offer Acceptance', rules: 'One-offer exit policy.' }
  ],
  globalCaps: {
    maxShortlists: 12,
    distribution: [6, 4, 2]
  }
};

export const pendingProposal = {
  id: 'prop1',
  proposedBy: 'Vikram Singh (PT)',
  timestamp: '2024-05-20T10:00:00Z',
  changes: {
    maxShortlists: 14,
    newLevel: 'Super Elite'
  },
  policyData: { ...activePolicy, status: PolicyStatus.PROPOSED, globalCaps: { ...activePolicy.globalCaps, maxShortlists: 14 } }
};

export const mockUsers = [
  { id: 'c1', name: 'Rahul Sharma', email: 'rahul@iimc.ac.in', role: UserRole.CANDIDATE, institution: 'IIM Calcutta', gpa: '3.8/4', background: 'IIT Delhi, CS' },
  { id: 'pt1', name: 'Vikram Singh', email: 'vikram@iimc.ac.in', role: UserRole.PLACEMENT_TEAM, institutionId: 'inst1' },
  { id: 'sa1', name: 'Admin One', email: 'admin@system.com', role: UserRole.SYSTEM_ADMIN },
];

export const initialCompanies = [
  { id: 'comp1', name: 'McKinsey & Co', logo: 'mckinsey.svg', tier: 'Elite', regStatus: ProcessStatus.APPROVED },
  { id: 'comp2', name: 'BCG', logo: 'bcg.svg', tier: 'Elite', regStatus: ProcessStatus.APPROVED },
  { id: 'comp3', name: 'Amazon', logo: 'amazon.svg', tier: 'Premium', regStatus: ProcessStatus.APPROVED },
];

export const cycles = [
  { id: 'cy1', name: 'Finals 24-25', type: CycleType.FINAL, category: CycleCategory.CURRENT, status: ProcessStatus.APPLICATIONS_OPEN },
  { id: 'cy3', name: 'Finals 23-24', type: CycleType.FINAL, category: CycleCategory.HISTORICAL, status: ProcessStatus.CLOSED, stats: [
    { companyId: 'comp1', applicants: 450, shortlists: 45, totalHires: 20 }
  ]}
];

export const historicalHires = [
  { id: 'h1', name: 'Ananya Iyer', companyId: 'comp1', year: 2024, role: 'Associate', cycleId: 'cy3' }
];

export const initialJobs = [
  { id: 'j1', companyId: 'comp1', title: 'Consultant', sector: Sector.CONSULTING, slot: Slot.SLOT_1, fixed_comp: 3200000, jd_details: 'Strategic advisory role.' },
  { id: 'j2', companyId: 'comp2', title: 'Strategy Lead', sector: Sector.STRATEGY, slot: Slot.SLOT_1, fixed_comp: 3000000, jd_details: 'Core strategy functions.' }
];

export const resolveLogo = (logoFile) => logoFile ? `./assets/logos/${logoFile}` : null;
