/**
 * Recruitment Scoring Configuration & Multi-Factor Criteria
 * Directly maps to FastAPI Decision Engine criteria and rule schemas.
 */

export const mockWeightPresets = {
  balanced: {
    id: 'balanced',
    name: 'Balanced Recruiter Model',
    label: 'Balanced (35/35/10/20)',
    weights: {
      w1: 35, // Years of Experience
      w2: 35, // GitHub Technical Activity
      w3: 10, // Presentation / Interview
      w4: 20, // Technical Skills Match
    },
    description: 'Balanced recruitment model prioritizing technical proficiency and hands-on domain experience.',
    curve: 'z_score',
  },
  tech: {
    id: 'tech',
    name: 'Technical / Developer Focus',
    label: 'Technical Heavy (20/50/10/20)',
    weights: {
      w1: 20,
      w2: 50,
      w3: 10,
      w4: 20,
    },
    description: 'Emphasizes verified public GitHub commits, code quality, and hands-on repository output.',
    curve: 'z_score',
  },
  experience: {
    id: 'experience',
    name: 'Seniority & Track Record',
    label: 'Experience Heavy (50/25/10/15)',
    weights: {
      w1: 50,
      w2: 25,
      w3: 10,
      w4: 15,
    },
    description: 'Prioritizes seasoned practitioners with demonstrated years in relevant engineering domains.',
    curve: 'min_max',
  },
  equal: {
    id: 'equal',
    name: 'Equal Weight Distribution',
    label: 'Equal Spread (25x4)',
    weights: {
      w1: 25,
      w2: 25,
      w3: 25,
      w4: 25,
    },
    description: 'Equal 25% weight across all four preliminary recruitment vectors.',
    curve: 'z_score',
  },
};

export const mockScoringCriteria = [
  {
    id: 'w1',
    key: 'experience_years',
    code: 'EXP',
    name: 'Years of Experience',
    mappedSource: 'candidate.experience_years',
    description: 'Average years of industry or academic experience across team members.',
    defaultWeight: 35,
    color: '#2563eb',
    bgColor: 'bg-primary-container',
    textColor: 'text-on-primary-container',
    accentColor: 'accent-primary',
    statInfo: 'Average Experience Signal',
    curveBadge: 'Normalized Standard Curve',
    min: 0,
    max: 70,
  },
  {
    id: 'w2',
    key: 'github_composite_score',
    code: 'GIT',
    name: 'GitHub Technical Activity',
    mappedSource: 'candidate.github_url (commits, repo volume)',
    description: 'Verified public contributions, repository volume, and language diversity.',
    defaultWeight: 35,
    color: '#10b981',
    bgColor: 'bg-[#10b981]',
    textColor: 'text-on-primary',
    accentColor: 'accent-[#10b981]',
    statInfo: 'Verified via GitHub REST API',
    curveBadge: '5,000 req/hr Authenticated',
    min: 0,
    max: 70,
  },
  {
    id: 'w3',
    key: 'presentation',
    code: 'PRS',
    name: 'Interview & Presentation',
    mappedSource: 'evaluation.presentation_score',
    description: 'Qualitative interview score, live pitch clarity, and communication effectiveness.',
    defaultWeight: 10,
    color: '#ffe24c',
    bgColor: 'bg-secondary-fixed',
    textColor: 'text-on-secondary-fixed',
    accentColor: 'accent-secondary',
    statInfo: 'Jury / Recruiter Notes',
    curveBadge: '1-10 Scale Normalized',
    min: 0,
    max: 70,
  },
  {
    id: 'w4',
    key: 'skills',
    code: 'SKL',
    name: 'Technical Skills Match',
    mappedSource: 'candidate.skills (declared technologies)',
    description: 'Count and breadth of required technical frameworks, languages, and proficiencies.',
    defaultWeight: 20,
    color: '#8b5cf6',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-900',
    accentColor: 'accent-purple-600',
    statInfo: 'Keyword & Framework Parsing',
    curveBadge: 'Linear Skill Mapping',
    min: 0,
    max: 70,
  },
];

export const initialBinaryHardGates = [
  {
    id: 'gate4',
    name: 'Team Size Range (2 to 4 members)',
    description: 'Requires candidate submissions to have at least 2 members and at most 4 members.',
    type: 'TEAM_SIZE_BETWEEN',
    scope: 'TEAM',
    criterionKey: 'team_size',
    threshold: '2-4 members',
    enabled: true,
  },
  {
    id: 'gate2',
    name: 'Minimum Experience Threshold',
    description: 'Requires candidates to possess at least 0.5 years (6 months) of relevant experience.',
    type: 'NUMBER_GTE',
    scope: 'MEMBER',
    criterionKey: 'experience_years',
    threshold: '≥ 0.5 years',
    enabled: true,
  },
  {
    id: 'gate1',
    name: 'Valid GitHub Profile Requirement',
    description: 'Ensures candidates supply an accessible GitHub profile URL for technical verification.',
    type: 'NOT_EMPTY',
    scope: 'MEMBER',
    criterionKey: 'github_url',
    threshold: 'Profile Present',
    enabled: false,
  },
];

export const mockDisqualifiedBlocklist = [];

export const mockSimulationTeams = [];

export function computeSimulationRankings() {
  return [];
}
