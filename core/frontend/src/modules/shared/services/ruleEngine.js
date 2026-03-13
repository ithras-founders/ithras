
import { ShortlistStatus } from '../types.js';

export const validateShortlistAcceptance = (newJob, existingShortlists, policyConfig) => {
  // Policy D: Rule 3: Top 10th percentile exemption
  if (policyConfig.TOP_DECILE_EXEMPTION_ENABLED && newJob.is_top_decile) return { valid: true };

  // Filter only Active (Held/Accepted) shortlists for caps
  const relevantEntries = existingShortlists.filter(s => 
    [ShortlistStatus.HELD, ShortlistStatus.ACCEPTED, ShortlistStatus.PREFERENTIAL].includes(s.entry.status) &&
    !(policyConfig.TOP_DECILE_EXEMPTION_ENABLED && s.job.is_top_decile)
  );

  // Policy D: Rule 1: Active Shortlist Cap
  if (relevantEntries.length >= policyConfig.ACTIVE_SHORTLIST_CAP) {
    return { valid: false, error: `ACTIVE_SHORTLIST_CAP_EXCEEDED (Max ${policyConfig.ACTIVE_SHORTLIST_CAP} non-exempt roles)` };
  }

  // Policy D: Rule 2: Sector distribution
  const sectorMap = {};
  relevantEntries.forEach(s => {
    sectorMap[s.job.sector] = (sectorMap[s.job.sector] || 0) + 1;
  });

  // Check potential new state
  sectorMap[newJob.sector] = (sectorMap[newJob.sector] || 0) + 1;
  const counts = Object.values(sectorMap).sort((a, b) => b - a);

  // Dynamic Rule check
  const limits = policyConfig.SECTOR_DISTRIBUTION; // e.g. [6, 4, 2]
  for (let i = 0; i < counts.length; i++) {
    if (i >= limits.length) {
      return { valid: false, error: `SECTOR_DIVERSITY_VIOLATION (Max ${limits.length} sectors allowed)` };
    }
    if (counts[i] > limits[i]) {
      return { valid: false, error: `SECTOR_DISTRIBUTION_VIOLATION (Max ${limits[i]} in ${i === 0 ? 'primary' : i === 1 ? 'secondary' : 'tertiary'} sector)` };
    }
  }

  return { valid: true };
};
