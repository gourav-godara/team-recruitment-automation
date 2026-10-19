/**
 * API Client for Team Recruitment Automation Backend
 * Base URL configured via VITE_API_BASE_URL (defaults to http://localhost:8000/api/v1)
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

/**
 * Retrieves the optional Supabase access token from localStorage.
 * Returns null if not present, ensuring requests work without authentication in dev/offline mode.
 */
function getAuthToken() {
  return localStorage.getItem('supabase_access_token') || localStorage.getItem('token') || null;
}

/**
 * Generic fetch wrapper with timeout, JSON formatting, auth headers, and readable error handling.
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers = {
    ...(options.headers || {}),
  };

  // Add optional Authorization header if a token exists
  const token = getAuthToken();
  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Set default JSON Content-Type only if not sending FormData, raw Blob, or custom type
  if (
    options.body &&
    !(options.body instanceof FormData) &&
    !(options.body instanceof Blob) &&
    !headers['Content-Type']
  ) {
    headers['Content-Type'] = 'application/json';
  }

  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (err) {
    // Distinguish CORS/network errors
    const errorMsg = err.message || 'Network request failed';
    throw new Error(`Connection error to ${url}: ${errorMsg}. Please ensure the backend is running at ${API_BASE_URL}.`);
  }

  if (!response.ok) {
    let errorDetail = `HTTP ${response.status} ${response.statusText}`;
    try {
      const errorJson = await response.json();
      if (errorJson.detail) {
        if (typeof errorJson.detail === 'string') {
          errorDetail = errorJson.detail;
        } else if (errorJson.detail.message) {
          errorDetail = errorJson.detail.message;
        } else {
          errorDetail = JSON.stringify(errorJson.detail);
        }
      } else if (errorJson.message) {
        errorDetail = errorJson.message;
      }
    } catch {
      const text = await response.text();
      if (text) errorDetail = text;
    }
    const error = new Error(errorDetail);
    error.status = response.status;
    throw error;
  }

  // If response is raw binary/blob or CSV
  const contentType = response.headers.get('content-type') || '';
  if (options.responseType === 'blob' || contentType.includes('text/csv') || contentType.includes('application/zip')) {
    return response.blob();
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

// ----------------------------------------------------------------------
// Campaigns Endpoints
// ----------------------------------------------------------------------

/**
 * Lists all recruitment campaigns.
 * GET /campaigns
 */
export async function getCampaigns() {
  return request('/campaigns');
}

/**
 * Creates a new recruitment campaign.
 * POST /campaigns
 * payload: { name: string, description?: string }
 */
export async function createCampaign(payload) {
  // Backend schema accepts { name: string }
  const body = {
    name: payload.name?.trim(),
  };
  return request('/campaigns', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// ----------------------------------------------------------------------
// Imports & Data Quality Endpoints
// ----------------------------------------------------------------------

/**
 * Uploads a candidate registration dataset (CSV file or raw string).
 * POST /imports?filename=...&campaign_id=...
 */
export async function uploadImport(fileOrContent, filename = 'registrations.csv', campaignId = null) {
  const queryParams = new URLSearchParams();
  if (filename) queryParams.set('filename', filename);
  if (campaignId !== null && campaignId !== undefined && campaignId !== '') {
    queryParams.set('campaign_id', String(campaignId));
  }
  queryParams.set('persist', 'true');

  const endpoint = `/imports?${queryParams.toString()}`;

  let body;
  let headers = {};

  if (typeof fileOrContent === 'string') {
    body = fileOrContent;
    headers['Content-Type'] = 'text/csv';
  } else if (fileOrContent instanceof File || fileOrContent instanceof Blob) {
    body = await fileOrContent.text();
    headers['Content-Type'] = 'text/csv';
  } else if (fileOrContent instanceof FormData) {
    body = fileOrContent;
  } else {
    body = JSON.stringify(fileOrContent);
    headers['Content-Type'] = 'application/json';
  }

  const result = await request(endpoint, {
    method: 'POST',
    headers,
    body,
  });

  // Ensure dataset_id is accessible whether the backend returns import_id or dataset_id
  const datasetId = result.import_id !== undefined ? result.import_id : result.dataset_id;
  return {
    ...result,
    dataset_id: datasetId,
  };
}

/**
 * Retrieves the comprehensive Data Quality Report for an imported dataset.
 * GET /imports/{dataset_id}/quality
 */
export async function getQualityReport(datasetId) {
  try {
    return await request(`/imports/${datasetId}/quality`);
  } catch (err) {
    if (err.status === 404) {
      // Fallback alias
      return await request(`/imports/${datasetId}/quality-report`);
    }
    throw err;
  }
}

// ----------------------------------------------------------------------
// Rules & Evaluation Endpoints
// ----------------------------------------------------------------------

/**
 * Retrieves catalog of available rule types, templates, and operators.
 * GET /rules/catalog (or /rules/types)
 */
export async function getRulesCatalog() {
  try {
    return await request('/rules/types');
  } catch (err) {
    if (err.status === 404) {
      return await request('/rules/catalog');
    }
    throw err;
  }
}

/**
 * Helper to build and validate the evaluation request payload according to backend specs.
 * Enforces:
 * 1. Weights sum to 1.0 (+/- 0.001)
 * 2. Only toggled-on rules are included
 * 3. Min team size <= Max team size
 */
export function buildEvaluatePayload(datasetId, topX, ruleSettings = [], weights = {}) {
  // Validate weights
  const weightValues = Object.values(weights);
  const totalWeight = weightValues.reduce((acc, val) => acc + Number(val || 0), 0);
  if (Math.abs(totalWeight - 1.0) > 0.001) {
    throw new Error(
      `Scoring weights must sum to 1.0 (current sum: ${totalWeight.toFixed(4)}). Please balance your sliders before running.`
    );
  }

  // Validate and format rules
  const activeRules = [];
  for (const rule of ruleSettings) {
    if (!rule.enabled) continue;

    if (rule.rule_type === 'TEAM_SIZE_BETWEEN' || rule.id === 'gate4' || rule.id === 'rule_team_size') {
      const min = Number(rule.min_value ?? (Array.isArray(rule.value) ? rule.value[0] : 2));
      const max = Number(rule.max_value ?? (Array.isArray(rule.value) ? rule.value[1] : 4));
      if (min > max) {
        throw new Error(`Minimum team size (${min}) cannot exceed maximum team size (${max}).`);
      }
      activeRules.push({
        name: rule.name || 'Team Size Range',
        scope: 'TEAM',
        field: 'team_size',
        operator: 'BETWEEN',
        value: [min, max],
      });
    } else if (rule.field && rule.operator) {
      activeRules.push({
        name: rule.name || rule.ruleName || rule.id,
        scope: rule.scope || 'MEMBER',
        field: rule.field,
        operator: rule.operator,
        value: rule.value,
        aggregation: rule.aggregation || 'ANY',
      });
    }
  }

  // Backend EvaluateDatasetRequest expects: { dataset_id, config: { top_x, weights, eligibility_rules } }
  return {
    dataset_id: Number(datasetId),
    config: {
      top_x: Number(topX || 40),
      weights,
      eligibility_rules: activeRules,
    },
  };
}

/**
 * Executes the Decision Engine evaluation on an imported dataset.
 * POST /evaluations/evaluate or POST /evaluations
 */
export async function evaluate(payload) {
  try {
    return await request('/evaluations', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  } catch (err) {
    if (err.status === 404) {
      // Fallback in case endpoint is /evaluations/evaluate
      return await request('/evaluations/evaluate', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    }
    throw err;
  }
}

// ----------------------------------------------------------------------
// Results & Sensitivity Endpoints
// ----------------------------------------------------------------------

/**
 * Retrieves a previously evaluated run and its team rankings.
 * GET /evaluations/runs/{run_id} or GET /evaluations/{run_id}
 */
export async function getRun(runId) {
  try {
    return await request(`/evaluations/${runId}`);
  } catch (err) {
    if (err.status === 404) {
      return await request(`/evaluations/runs/${runId}`);
    }
    throw err;
  }
}

/**
 * Retrieves the high-performance leaderboard view for an evaluation run (includes team_size).
 * GET /evaluations/{run_id}/leaderboard
 */
export async function getLeaderboard(runId) {
  return request(`/evaluations/${runId}/leaderboard`);
}

/**
 * Executes a "What-If" sensitivity simulation comparing base run with adjusted weights/top_x.
 * POST /evaluations/runs/{run_id}/sensitivity or POST /evaluations/{run_id}/sensitivity-preview
 */
export async function runSensitivity(runId, newConfig) {
  // Support either raw ScoringConfig or wrapped { new_config }
  const body = newConfig.new_config ? newConfig : { new_config: newConfig };

  try {
    return await request(`/evaluations/${runId}/sensitivity-preview`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  } catch (err) {
    if (err.status === 404) {
      return await request(`/evaluations/runs/${runId}/sensitivity`, {
        method: 'POST',
        body: JSON.stringify(body),
      });
    }
    throw err;
  }
}

// ----------------------------------------------------------------------
// CSV Export Endpoint
// ----------------------------------------------------------------------

/**
 * Downloads the evaluated CSV file as a browser file attachment.
 * GET /evaluations/{run_id}/export (or GET /exports/runs/{run_id}/csv)
 */
export async function downloadCsv(runId, filename = null, type = 'full') {
  let endpoint;
  let defaultExt = '.csv';

  if (type === 'shortlist') {
    endpoint = `/evaluations/${runId}/export/shortlist`;
    defaultExt = '.csv';
  } else if (type === 'bundle') {
    endpoint = `/evaluations/${runId}/export/bundle`;
    defaultExt = '.zip';
  } else if (type === 'config') {
    endpoint = `/evaluations/${runId}/export/config`;
    defaultExt = '.json';
  } else {
    endpoint = `/evaluations/${runId}/export`;
    defaultExt = '.csv';
  }

  let blob;
  try {
    blob = await request(endpoint, { responseType: 'blob' });
  } catch (err) {
    if (err.status === 404) {
      // Fallback to exports router path
      try {
        blob = await request(`/exports/evaluations/${runId}`, { responseType: 'blob' });
      } catch {
        blob = await request(`/exports/runs/${runId}/csv`, { responseType: 'blob' });
      }
    } else {
      throw err;
    }
  }

  // Trigger file download in browser
  const blobUrl = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = blobUrl;
  anchor.download =
    filename ||
    (type === 'shortlist'
      ? `shortlist_top_x_${runId}.csv`
      : type === 'bundle'
      ? `ShortlistIQ_Audit_Package_Run_${runId}.zip`
      : type === 'config'
      ? `Audit_Config_Manifest_Run_${runId}.json`
      : `evaluation_run_${runId}.csv`);
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(blobUrl);

  return true;
}

export default {
  getCampaigns,
  createCampaign,
  uploadImport,
  getQualityReport,
  getRulesCatalog,
  evaluate,
  buildEvaluatePayload,
  getRun,
  getLeaderboard,
  runSensitivity,
  downloadCsv,
};
