/**
 * Clean default data structures for team comparison.
 */

export const mockDefaultPair = {
  teamA: {
    id: 1,
    name: 'Team A',
    rank: 1,
    final_score: 85.0,
    status_label: 'SHORTLISTED',
    breakdown: {
      tech: 8.5,
      repo: 8.0,
      pitch: 8.0,
      velocity: 8.5,
    },
    members: [],
  },
  teamB: {
    id: 2,
    name: 'Team B',
    rank: 2,
    final_score: 82.0,
    status_label: 'ELIGIBLE',
    breakdown: {
      tech: 8.0,
      repo: 8.2,
      pitch: 7.5,
      velocity: 8.0,
    },
    members: [],
  },
};

export const mockEvaluatorsList = [];
export const mockAlternativeContenders = [];
