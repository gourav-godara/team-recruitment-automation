/**
 * API Client for Team Recruitment Automation Backend
 * Base URL configured via VITE_API_BASE_URL (defaults to http://localhost:8000/api/v1)
 *
 * Implements public anonymous no-login session propagation with dual transport:
 * 1. Automatic 'X-Session-ID' request header from localStorage
 * 2. 'credentials: include' for HttpOnly session cookie synchronization
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

/**
 * Returns or generates a persistent anonymous session ID stored in localStorage.
 */
export function getOrCreateSessionId() {
  let sessionId = localStorage.getItem('recruitment_session_id');
  if (!sessionId) {
    // Generate a secure client-side temporary token until confirmed by backend
    sessionId = 'sess_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('recruitment_session_id', sessionId);
  }
  return sessionId;
}

export function setSessionId(newSessionId) {
  if (newSessionId) {
    localStorage.setItem('recruitment_session_id', newSessionId);
  }
}

/**
 * Generic fetch wrapper with timeout, JSON formatting, anonymous session headers, and clear error handling.
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const sessionId = getOrCreateSessionId();

  const headers = {
    'X-Session-ID': sessionId,
    ...(options.headers || {}),
  };

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
      credentials: 'include',
      ...options,
      headers,
    });
  } catch (err) {
    const errorMsg = err.message || 'Network request failed';
    throw new Error(`Connection error to ${url}: ${errorMsg}. Please ensure the backend is running at ${API_BASE_URL}.`, { cause: err });
  }

  // Update session ID if returned in response headers
  const serverSession = response.headers.get('x-session-id');
  if (serverSession) {
    setSessionId(serverSession);
  }

  if (!response.ok) {
    let errorDetail = `HTTP ${response.status} ${response.statusText}`;
    try {
      const errorJson = await response.json();
      if (errorJson.detail) {
        if (typeof errorJson.detail === 'string') {
          errorDetail = errorJson.detail;
        } else if (Array.isArray(errorJson.detail)) {
          // Cleanly format FastAPI / Pydantic validation errors into plain recruiter English
          const msgs = errorJson.detail.map((err) => {
            let msg = err.msg || err.message || '';
            msg = msg.replace(/^Value error,\s*/i, '');
            if (msg.toLowerCase().includes('weights must sum to 1.0') || msg.toLowerCase().includes('must sum to 1')) {
              return 'Scoring criteria weights must add up to 100%. Click the "Auto-Balance" button to auto-adjust.';
            }
            if (err.loc && Array.isArray(err.loc)) {
              const field = err.loc[err.loc.length - 1];
              if (field && !msg.toLowerCase().includes(field.toLowerCase())) {
                return `${field}: ${msg}`;
              }
            }
            return msg;
          }).filter(Boolean);
          errorDetail = msgs.length > 0 ? msgs.join('. ') : 'Validation error in request parameters.';
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
    // Clean any remaining raw Pydantic prefix
    errorDetail = errorDetail.replace(/^Value error,\s*/i, '');
    const error = new Error(errorDetail);
    error.status = response.status;
    throw error;
  }

  // If response is raw binary/blob or CSV
  const contentType = response.headers.get('content-type') || '';
  if (
    options.responseType === 'blob' ||
    contentType.includes('text/csv') ||
    contentType.includes('application/zip') ||
    contentType.includes('application/octet-stream')
  ) {
    return response.blob();
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

// ----------------------------------------------------------------------
// Anonymous Session Endpoints
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
 */
export async function createCampaign(payload) {
  const body = {
    name: payload.name?.trim(),
  };
  return request('/campaigns', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/**
 * Gets active anonymous session metadata (dataset counts, run counts).
 * GET /session
 */
export async function getSession() {
  return request('/session');
}

/**
 * Gets datasets and runs executed within the current anonymous session.
 * GET /session/history
 */
export async function getSessionHistory() {
  return request('/session/history');
}

/**
 * Resets session, clearing local cookie and token.
 * POST /session/reset
 */
export async function resetSession() {
  const result = await request('/session/reset', { method: 'POST' });
  if (result?.session_id) {
    setSessionId(result.session_id);
  } else {
    localStorage.removeItem('recruitment_session_id');
  }
  return result;
}

// ----------------------------------------------------------------------
// Imports & Data Quality Endpoints
// ----------------------------------------------------------------------

/**
 * Uploads a candidate registration dataset (CSV file, raw string, or JSON).
 * POST /imports?filename=...&persist=true
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
    headers['Content-Type'] = filename.endsWith('.json') ? 'application/json' : 'text/csv';
  } else if (fileOrContent instanceof File || fileOrContent instanceof Blob) {
    body = await fileOrContent.text();
    headers['Content-Type'] = fileOrContent.name?.endsWith('.json') ? 'application/json' : 'text/csv';
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

  const datasetId = result.import_id !== undefined ? result.import_id : result.dataset_id;
  return {
    ...result,
    dataset_id: datasetId,
  };
}

/**
 * Retrieves details and raw teams for an imported dataset.
 * GET /imports/{dataset_id}
 */
export async function getDataset(datasetId) {
  return request(`/imports/${datasetId}`);
}

/**
 * Retrieves the comprehensive Data Quality Report for an imported dataset.
 * GET /imports/{dataset_id}/quality-report
 */
export async function getQualityReport(datasetId) {
  try {
    return await request(`/imports/${datasetId}/quality-report`);
  } catch (err) {
    if (err.status === 404) {
      return await request(`/imports/${datasetId}/quality`);
    }
    throw err;
  }
}

// ----------------------------------------------------------------------
// Rules Catalog Endpoints
// ----------------------------------------------------------------------

/**
 * Retrieves catalog of available rule types, templates, and operators.
 * GET /rules/types
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

// ----------------------------------------------------------------------
// Decision Engine Evaluation Endpoints
// ----------------------------------------------------------------------

/**
 * Helper to build and validate the evaluation request payload according to backend specs.
 */
export function buildEvaluatePayload(datasetId, topX, ruleSettings = [], weights = {}) {
  // Validate weights
  const weightValues = Object.values(weights);
  const totalWeight = weightValues.reduce((acc, val) => acc + Number(val || 0), 0);
  if (Math.abs(totalWeight - 1.0) > 0.005) {
    throw new Error(
      `Scoring weights must sum to 1.0 (current sum: ${totalWeight.toFixed(4)}). Please balance your criteria weights before running.`
    );
  }

  // Validate and format rules to match backend RuleConfig schema
  const activeRules = [];
  for (const rule of ruleSettings) {
    if (!rule.enabled) continue;

    if (rule.rule_type === 'TEAM_SIZE_BETWEEN' || rule.type === 'TEAM_SIZE_BETWEEN' || rule.id === 'gate_team_size') {
      const min = Number(rule.min_value ?? (Array.isArray(rule.value) ? rule.value[0] : 2));
      const max = Number(rule.max_value ?? (Array.isArray(rule.value) ? rule.value[1] : 5));
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
        name: rule.name || rule.id,
        scope: rule.scope || 'MEMBER',
        field: rule.field,
        operator: rule.operator,
        value: rule.value,
        aggregation: rule.aggregation || 'ANY',
      });
    } else if (rule.type === 'COUNT_AT_LEAST') {
      activeRules.push({
        name: rule.name || 'Minimum Count per Team',
        scope: 'MEMBER',
        field: rule.field || 'declared_gender',
        operator: '==',
        value: rule.target_value || 'female',
        aggregation: 'ANY',
      });
    } else if (rule.type === 'NUMBER_GTE') {
      activeRules.push({
        name: rule.name || 'Minimum Value Check',
        scope: 'MEMBER',
        field: rule.field || 'experience_years',
        operator: '>=',
        value: Number(rule.threshold || 1.0),
        aggregation: 'ANY',
      });
    }
  }

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
 * POST /evaluations/evaluate (or POST /evaluations)
 */
export async function evaluate(payload) {
  try {
    return await request('/evaluations/evaluate', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  } catch (err) {
    if (err.status === 404) {
      return await request('/evaluations', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    }
    throw err;
  }
}

// ----------------------------------------------------------------------
// Results, Leaderboard, Overrides & Comparisons
// ----------------------------------------------------------------------

/**
 * Retrieves a previously evaluated run and its team rankings.
 * GET /evaluations/runs/{run_id}
 */
export async function getRun(runId) {
  try {
    return await request(`/evaluations/runs/${runId}`);
  } catch (err) {
    if (err.status === 404) {
      return await request(`/evaluations/${runId}`);
    }
    throw err;
  }
}

/**
 * Retrieves the high-performance leaderboard view for an evaluation run.
 * GET /evaluations/{run_id}/leaderboard
 */
export async function getLeaderboard(runId) {
  return request(`/evaluations/${runId}/leaderboard`);
}

/**
 * Applies a manual reviewer override (pin, exclude, waitlist) to a team.
 * POST /evaluations/runs/{run_id}/overrides
 */
export async function applyOverride(runId, teamIdOrCode, action, reason) {
  return request(`/evaluations/runs/${runId}/overrides`, {
    method: 'POST',
    body: JSON.stringify({
      team_id_or_code: String(teamIdOrCode),
      action,
      reason,
    }),
  });
}

/**
 * Performs a head-to-head pairwise comparison between two evaluated teams.
 * POST /evaluations/runs/{run_id}/compare
 */
export async function compareTeams(runId, teamAId, teamBId) {
  return request(`/evaluations/runs/${runId}/compare`, {
    method: 'POST',
    body: JSON.stringify({
      team_a_id: teamAId,
      team_b_id: teamBId,
    }),
  });
}

/**
 * Executes a sensitivity simulation comparing base run with adjusted weights/top_x.
 * POST /evaluations/runs/{run_id}/sensitivity
 */
export async function runSensitivity(runId, newConfig) {
  const body = newConfig.new_config ? newConfig : { new_config: newConfig };
  try {
    return await request(`/evaluations/runs/${runId}/sensitivity`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  } catch (err) {
    if (err.status === 404) {
      return await request(`/evaluations/${runId}/sensitivity-preview`, {
        method: 'POST',
        body: JSON.stringify(body),
      });
    }
    throw err;
  }
}

// ----------------------------------------------------------------------
// Exports Endpoints
// ----------------------------------------------------------------------

/**
 * Downloads evaluated results as an RFC 4180 CSV file or audit ZIP bundle.
 */
export async function downloadCsv(runId, filename = null, type = 'full') {
  let endpoint;
  let defaultExt;

  if (type === 'bundle') {
    endpoint = `/evaluations/${runId}/export/bundle`;
    defaultExt = '.zip';
  } else if (type === 'shortlist') {
    endpoint = `/evaluations/${runId}/export/shortlist`;
    defaultExt = '.csv';
  } else {
    endpoint = `/exports/evaluations/${runId}`;
    defaultExt = '.csv';
  }

  let blob;
  try {
    blob = await request(endpoint, { responseType: 'blob' });
  } catch (err) {
    if (err.status === 404) {
      try {
        blob = await request(`/exports/runs/${runId}/csv`, { responseType: 'blob' });
      } catch {
        blob = await request(`/evaluations/${runId}/export`, { responseType: 'blob' });
      }
    } else {
      throw err;
    }
  }

  const blobUrl = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = blobUrl;
  anchor.download =
    filename ||
    (type === 'bundle'
      ? `recruitment_audit_package_run_${runId}.zip`
      : `evaluation_results_run_${runId}${defaultExt}`);
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(blobUrl);

  return true;
}

// ----------------------------------------------------------------------
// GitHub Profile & Enrichment Endpoints
// ----------------------------------------------------------------------

/**
 * Fetches public developer profile metrics from GitHub.
 * GET /github/profile?url_or_username=...
 */
export async function getGitHubProfile(urlOrUsername, forceRefresh = false) {
  const params = new URLSearchParams({
    url_or_username: urlOrUsername,
    force_refresh: String(forceRefresh),
  });
  return request(`/github/profile?${params.toString()}`);
}

/**
 * Enriches candidate profile and generates Core Decision Engine signals.
 * POST /github/enrich
 */
export async function enrichGitHub(urlOrUsername, forceRefresh = false) {
  return request('/github/enrich', {
    method: 'POST',
    body: JSON.stringify({
      url_or_username: urlOrUsername,
      force_refresh: forceRefresh,
    }),
  });
}

export default {
  getCampaigns,
  createCampaign,
  getSession,
  getSessionHistory,
  resetSession,
  uploadImport,
  getDataset,
  getQualityReport,
  getRulesCatalog,
  evaluate,
  buildEvaluatePayload,
  getRun,
  getLeaderboard,
  applyOverride,
  compareTeams,
  runSensitivity,
  downloadCsv,
  getGitHubProfile,
  enrichGitHub,
};
