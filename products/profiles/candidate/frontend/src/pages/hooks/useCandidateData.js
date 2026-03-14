import { useState, useEffect, useCallback } from 'react';
import { getActivePolicy, getCompanies, getJobs, getCompanyHires, getUserShortlists, getCycles, getOffers, getApplications, getCVs, getApplicationStageProgress } from '/core/frontend/src/modules/shared/services/api.js';

export function useCandidateData(user) {
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
    fetchData();
  }, [user?.id, fetchData]);

  useEffect(() => {
    if (!selectedCompanyId) {
      setHistoricalHires([]);
      return;
    }
    getCompanyHires(selectedCompanyId)
      .then((hires) => setHistoricalHires(hires || []))
      .catch(() => setHistoricalHires([]));
  }, [selectedCompanyId, user?.id]);

  const loadStageProgress = useCallback(async (appId) => {
    if (stageProgressCache[appId]) return;
    setLoadingStageProgress(appId);
    try {
      const data = await getApplicationStageProgress(appId);
      setStageProgressCache((c) => ({ ...c, [appId]: data }));
    } catch {
      setStageProgressCache((c) => ({ ...c, [appId]: null }));
    } finally {
      setLoadingStageProgress(null);
    }
  }, [stageProgressCache]);

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
    user,
  };
}
