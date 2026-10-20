import { createContext, useContext, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const location = useLocation();
  const navigate = useNavigate();

  // Read initial values from URL params or sessionStorage
  const [campaignId, setCampaignIdState] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('campaign_id') || sessionStorage.getItem('app_campaign_id') || null;
  });

  const [datasetId, setDatasetIdState] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('dataset_id') || sessionStorage.getItem('app_dataset_id') || null;
  });

  const [runId, setRunIdState] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('run_id') || sessionStorage.getItem('app_run_id') || null;
  });

  const [uploadedDataset, setUploadedDataset] = useState(null);
  const [evaluationResult, setEvaluationResult] = useState(null);

  // Keep state synchronized with URL search params whenever the route changes
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlCampaign = params.get('campaign_id');
    const urlDataset = params.get('dataset_id');
    const urlRun = params.get('run_id');

    if (urlCampaign && urlCampaign !== campaignId) {
      setCampaignIdState(urlCampaign);
      sessionStorage.setItem('app_campaign_id', urlCampaign);
    }
    if (urlDataset && urlDataset !== datasetId) {
      setDatasetIdState(urlDataset);
      sessionStorage.setItem('app_dataset_id', urlDataset);
    }
    if (urlRun && urlRun !== runId) {
      setRunIdState(urlRun);
      sessionStorage.setItem('app_run_id', urlRun);
    }
  }, [location.search]);

  const setCampaignId = (id) => {
    const val = id ? String(id) : null;
    setCampaignIdState(val);
    if (val) sessionStorage.setItem('app_campaign_id', val);
    else sessionStorage.removeItem('app_campaign_id');
  };

  const setDatasetId = (id) => {
    const val = id ? String(id) : null;
    setDatasetIdState(val);
    if (val) sessionStorage.setItem('app_dataset_id', val);
    else sessionStorage.removeItem('app_dataset_id');
  };

  const setRunId = (id) => {
    const val = id ? String(id) : null;
    setRunIdState(val);
    if (val) sessionStorage.setItem('app_run_id', val);
    else sessionStorage.removeItem('app_run_id');
  };

  /**
   * Helper to navigate to a new stage route while preserving active IDs in query params
   */
  const navigateWithState = (pathname, overrides = {}) => {
    const cid = overrides.campaignId !== undefined ? overrides.campaignId : campaignId;
    const did = overrides.datasetId !== undefined ? overrides.datasetId : datasetId;
    const rid = overrides.runId !== undefined ? overrides.runId : runId;

    const params = new URLSearchParams();
    if (cid) params.set('campaign_id', cid);
    if (did) params.set('dataset_id', did);
    if (rid) params.set('run_id', rid);

    const queryString = params.toString();
    navigate(`${pathname}${queryString ? `?${queryString}` : ''}`);
  };

  return (
    <AppContext.Provider
      value={{
        campaignId,
        setCampaignId,
        datasetId,
        setDatasetId,
        runId,
        setRunId,
        uploadedDataset,
        setUploadedDataset,
        evaluationResult,
        setEvaluationResult,
        navigateWithState,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
