/**
 * Clean default data structures for ranked evaluation runs.
 */

export const mockRankedRunInfo = {
  run_id: '1',
  stage: '04',
  stage_name: 'SHORTLIST LEADERBOARD',
  title: 'Candidate Shortlisting Leaderboard',
  file_hash_short: 'sealed',
  state_frozen: 'Live',
  total_teams: 0,
  shortlist_quota: 5,
  quota_percentage: '5',
  passed_hard_gates: 0,
  cutoff_floor: 75.0,
  weight_model: 'Recruiter Weighted Model',
  weights: {
    tech: 35,
    repo: 35,
    pitch: 10,
    velocity: 20,
  },
};

export const mockRankedTeams = [];
