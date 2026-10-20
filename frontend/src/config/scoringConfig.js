/**
 * Default Scoring Configuration and Recruiter Criteria
 * Directly aligns with FastAPI Decision Engine schemas.
 */

export const DEFAULT_SCORING_CRITERIA = [
  {
    key: 'experience_years',
    name: 'Years of Experience',
    description: 'Average years of professional or relevant experience across team members',
    category: 'Experience',
    defaultWeight: 35,
    min: 0,
    max: 100,
    unit: '%',
    icon: 'work_history',
    badge_bg: 'bg-amber-100',
    badge_color: 'text-amber-800',
  },
  {
    key: 'github_composite_score',
    name: 'GitHub Technical Activity',
    description: 'Verified public repositories, commit volume, stars, and language diversity',
    category: 'Technical',
    defaultWeight: 35,
    min: 0,
    max: 100,
    unit: '%',
    icon: 'code',
    badge_bg: 'bg-blue-100',
    badge_color: 'text-blue-800',
  },
  {
    key: 'skills',
    name: 'Skills Match',
    description: 'Count and relevance of declared technical skills and proficiencies',
    category: 'Skills',
    defaultWeight: 20,
    min: 0,
    max: 100,
    unit: '%',
    icon: 'psychology',
    badge_bg: 'bg-emerald-100',
    badge_color: 'text-emerald-800',
  },
  {
    key: 'presentation',
    name: 'Interview & Presentation',
    description: 'Pitch presentation, communication, or qualitative jury review score',
    category: 'Soft Skills',
    defaultWeight: 10,
    min: 0,
    max: 100,
    unit: '%',
    icon: 'co_present',
    badge_bg: 'bg-purple-100',
    badge_color: 'text-purple-800',
  },
];

export const DEFAULT_WEIGHT_PRESETS = [
  {
    id: 'balanced',
    name: 'Balanced Recruiter Standard',
    description: 'Equal emphasis on technical execution and domain experience',
    weights: {
      experience_years: 35,
      github_composite_score: 35,
      skills: 20,
      presentation: 10,
    },
  },
  {
    id: 'tech_heavy',
    name: 'Technical / Developer Focus',
    description: 'Prioritizes verified GitHub commits, code quality, and technical skills',
    weights: {
      experience_years: 20,
      github_composite_score: 55,
      skills: 20,
      presentation: 5,
    },
  },
  {
    id: 'experience_heavy',
    name: 'Seniority & Track Record',
    description: 'Prioritizes seasoned practitioners with demonstrated years in the field',
    weights: {
      experience_years: 50,
      github_composite_score: 25,
      skills: 15,
      presentation: 10,
    },
  },
];

export const DEFAULT_HARD_GATES = [
  {
    id: 'gate_team_size',
    name: 'Allowed Team Size (2 to 4 members)',
    description: 'Disqualifies solo candidates or oversized teams beyond 4 members',
    scope: 'TEAM',
    field: 'team_size',
    operator: 'BETWEEN',
    value: [2, 4],
    active: true,
  },
  {
    id: 'gate_min_exp',
    name: 'Minimum Experience (at least 0.5 yrs)',
    description: 'Requires candidate to possess at least 6 months of declared experience',
    scope: 'MEMBER',
    field: 'experience_years',
    operator: '>=',
    value: 0.5,
    active: true,
  },
];
