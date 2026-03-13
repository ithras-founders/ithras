import { useState, useEffect, useCallback } from 'react';
import { getActivePolicy, getCompanies, getJobs, getCompanyHires, getUserShortlists, getCycles, getOffers, getApplications, getCVs, getApplicationStageProgress } from '/core/frontend/src/modules/shared/services/api.js';
import { isDemoUser } from '/core/frontend/src/modules/shared/utils/demoUtils.js';
import { useTutorialContext } from '/core/frontend/src/modules/tutorials/index.js';
import { getTutorialMockData } from '/core/frontend/src/modules/tutorials/context/tutorialMockData.js';

const DEFAULT_STAGES = [
  { name: 'Application', stage_number: 1 },
  { name: 'Shortlist', stage_number: 2 },
  { name: 'Interview', stage_number: 3 },
  { name: 'Offer', stage_number: 4 },
];

const getMockStageProgress = (app) => {
  const status = app.status || 'SUBMITTED';
  let currentIdx = 0;
  if (status === 'SUBMITTED') currentIdx = 1;
  else if (status === 'SHORTLISTED') currentIdx = 2;
  else if (status === 'OFFERED' || status === 'PENDING') currentIdx = 3;
  return {
    application_id: app.id,
    application_status: status,
    stages: DEFAULT_STAGES.map((s, i) => ({
      ...s,
      stage_id: `s${i + 1}`,
      stage_type: s.name.toUpperCase().replace(' ', '_'),
      is_current: i === currentIdx,
      progress_status: i < currentIdx ? 'PASSED' : i === currentIdx ? 'IN_PROGRESS' : 'NOT_STARTED',
      moved_at: i < currentIdx ? new Date().toISOString() : null,
    })),
  };
};

export function useCandidateData(user) {
  const { isTutorialMode, getTutorialData } = useTutorialContext();
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);
  const [activePolicy, setActivePolicy] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [historicalHires, setHistoricalHires] = useState([]);
  const [cycles, setCycles] = useState([]);
  const [activeShortlists, setActiveShortlists] = useState([]);
  const [applications, setApplications] = useState([]);
  const [cvs, setCVs] = useState([]);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [expandedApplicationId, setExpandedApplicationId] = useState(null);
  const [stageProgressCache, setStageProgressCache] = useState({});
  const [loadingStageProgress, setLoadingStageProgress] = useState(null);
  const [respondingOffer, setRespondingOffer] = useState(null);

  const fetchOffers = useCallback(() => {
    if (user) getOffers({ candidate_id: user.id }).then(o => setOffers(o || [])).catch(() => setOffers([]));
  }, [user?.id]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setFetchError(null);
      const [policy, companiesRes, jobsData, cyclesData, shortlistsData, offersData, applicationsData, cvsData] = await Promise.all([
        getActivePolicy().catch(() => null),
        getCompanies({ limit: 500 }),
        getJobs(),
        getCycles(),
        user ? getUserShortlists(user.id).catch(() => []) : Promise.resolve([]),
        user ? getOffers({ candidate_id: user.id }).catch(() => []) : Promise.resolve([]),
        user ? getApplications({ student_id: user.id }).catch(() => []) : Promise.resolve([]),
        user ? getCVs({ candidate_id: user.id }).catch(() => []) : Promise.resolve([])
      ]);
      setActivePolicy(policy);
      setCompanies(companiesRes?.items ?? []);
      setJobs(jobsData);
      setCycles(cyclesData);
      setActiveShortlists(shortlistsData || []);
      setOffers(offersData || []);
      setApplications(Array.isArray(applicationsData) ? applicationsData : []);
      setCVs(Array.isArray(cvsData) ? cvsData : []);
      setHistoricalHires([]);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setFetchError(error?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (isTutorialMode || isDemoUser(user)) {
      const mock = getTutorialData('CANDIDATE') ?? getTutorialMockData('CANDIDATE');
      setActivePolicy(mock.policy);
      setCompanies(mock.companies || []);
      setJobs(mock.jobs || []);
      setCycles(mock.cycles || []);
      setActiveShortlists(mock.shortlists || []);
      setOffers(mock.offers || []);
      setApplications(mock.applications || []);
      setCVs(mock.cvs || []);
      setHistoricalHires(mock.historicalHires || []);
      setLoading(false);
      return;
    }
    fetchData();
  }, [user?.id, isTutorialMode, fetchData]);

  useEffect(() => {
    if (isTutorialMode || isDemoUser(user)) return;
    if (!selectedCompanyId) {
      setHistoricalHires([]);
      return;
    }
    getCompanyHires(selectedCompanyId)
      .then((hires) => setHistoricalHires(hires || []))
      .catch(() => setHistoricalHires([]));
  }, [selectedCompanyId, isTutorialMode, user?.id]);

  const loadStageProgress = useCallback(async (appId) => {
    if (stageProgressCache[appId]) return;
    if (isTutorialMode || isDemoUser(user)) {
      const app = applications.find((a) => a.id === appId);
      if (app) setStageProgressCache((c) => ({ ...c, [appId]: getMockStageProgress(app) }));
      return;
    }
    setLoadingStageProgress(appId);
    try {
      const data = await getApplicationStageProgress(appId);
      setStageProgressCache((c) => ({ ...c, [appId]: data }));
    } catch {
      setStageProgressCache((c) => ({ ...c, [appId]: null }));
    } finally {
      setLoadingStageProgress(null);
    }
  }, [applications, isTutorialMode, user, stageProgressCache]);

  const toggleApplicationExpand = (appId) => {
    const next = expandedApplicationId === appId ? null : appId;
    setExpandedApplicationId(next);
    if (next) loadStageProgress(next);
  };

  return {
    loading,
    fetchError,
    fetchData,
    fetchOffers,
    activePolicy,
    companies,
    jobs,
    cycles,
    activeShortlists,
    applications,
    cvs,
    offers,
    historicalHires,
    selectedCompanyId,
    setSelectedCompanyId,
    respondingOffer,
    setRespondingOffer,
    expandedApplicationId,
    toggleApplicationExpand,
    stageProgressCache,
    loadStageProgress,
    loadingStageProgress,
    isTutorialMode,
    isDemoUser: isDemoUser(user),
    getTutorialData,
    user,
  };
}
