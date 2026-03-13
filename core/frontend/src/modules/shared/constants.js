
import { Sector } from './types.js';

export const POLICY_CONFIG = {
  ACTIVE_SHORTLIST_CAP: 12,
  PREFERENTIAL_SHORTLIST_CAP: 6,
  SWAP_WINDOW_HOURS: 12,
  SECTOR_DISTRIBUTION: [6, 4, 2], // 6 in primary, 4 in secondary, 2 in tertiary
  MIN_JD_SUBMISSION_DATE: '2024-12-15',
  SLOT_1_INTERVIEW_WEEK: '2025-02-01',
  SYNCHRONIZED_OFFER_RELEASE_DATE: '2025-02-08T18:00:00',
  SLOT_1_APPLICATION_LIMIT_PER_WEEK: 25,
};

export const RESUME_SECTIONS = {
  ACADEMICS: 'Academic Qualifications',
  DISTINCTIONS: 'Academic Distinctions & Co-Curricular',
  EXPERIENCE: 'Industry Experience',
  POSITIONS: 'Positions of Responsibility',
  EXTRA_CURRICULAR: 'Extra-Curricular Achievements'
};

export const SECTORS = Object.values(Sector);
