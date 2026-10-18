/**
 * Mock Data for Stage 06: Stability Stress Testing & Cutoff Sensitivity
 * Conforming strictly to:
 * - DESIGN.md (Neo-Memphis pop-studio aesthetic & design tokens)
 * - frontend/DATABASE_DESIGN.md (runs, pairwise_comparisons, audit_log, criteria)
 * - frontend/schema.sql (SQLite schema definition)
 */

export const mockStabilityMetrics = {
  stability_index: 92.5,
  iterations: 10000,
  successful_runs: 9250,
  vulnerable_count: 3,
  safe_anchors_count: 32,
  max_displacement: 3,
  perturbation_range: '±15%',
  cutoff_rank: 40,
  cutoff_delta_pts: 0.10,
  jury_lockdown_time: '02:00 AM SGT',
};

export const mockStressPresets = {
  baseline: {
    id: 'baseline',
    label: 'Baseline (35/25/20/20)',
    weights: { tech: 35, github: 25, track: 20, velocity: 20 },
    description: 'Standard calibrated evaluation model with 35% technical depth weight.',
  },
  code_heavy: {
    id: 'code_heavy',
    label: 'Code-Heavy Stress',
    weights: { tech: 45, github: 30, track: 15, velocity: 10 },
    description: 'Heavy 75% bias toward technical architecture and git commit health.',
  },
  presentation: {
    id: 'presentation',
    label: 'Presentation-Biased',
    weights: { tech: 25, github: 20, track: 30, velocity: 25 },
    description: 'Elevated weights on track alignment, product demo, and sprint velocity.',
  },
  equal: {
    id: 'equal',
    label: 'Equal Weights (25%)',
    weights: { tech: 25, github: 25, track: 25, velocity: 25 },
    description: 'Uniform 25% weight spread across all 4 vector categories.',
  },
};

export const mockBubbleTeams = [
  {
    team_id: 360,
    external_id: 'T-0360',
    name: 'QuantumLedger',
    base_rank: 36,
    range: '#34 - #38',
    volatility_sigma: 1.2,
    base_stat: 'IN',
    base_stat_type: 'in', // 'in' | 'out'
    perturbed_profile: 'Invariant: 99.4% inside cut',
    risk_level: 'SAFE',
    risk_type: 'safe', // 'safe' | 'fragile' | 'bubble' | 'contender' | 'waitlist'
    survival_rate: 99.4,
    tech_score: 87.2,
    github_score: 86.8,
    track_score: 84.0,
    velocity_score: 85.0,
    commits_last_4h: 8,
    members: ['Viktor Vance', 'Sora Tanaka'],
  },
  {
    team_id: 370,
    external_id: 'T-0370',
    name: 'Aetheria AI',
    base_rank: 37,
    range: '#35 - #39',
    volatility_sigma: 1.5,
    base_stat: 'IN',
    base_stat_type: 'in',
    perturbed_profile: 'Invariant: 96.2% inside cut',
    risk_level: 'SAFE',
    risk_type: 'safe',
    survival_rate: 96.2,
    tech_score: 86.8,
    github_score: 86.0,
    track_score: 86.5,
    velocity_score: 84.5,
    commits_last_4h: 12,
    members: ['Chloe Dupont', 'Hassan Al-Mansoor'],
  },
  {
    team_id: 380,
    external_id: 'T-0380',
    name: 'ZeroTrace',
    base_rank: 38,
    range: '#35 - #41',
    volatility_sigma: 2.8,
    base_stat: 'IN',
    base_stat_type: 'in',
    perturbed_profile: 'AT RISK: Drops to #41 if Tech < 30%',
    risk_level: 'FRAGILE',
    risk_type: 'fragile',
    survival_rate: 82.4,
    tech_score: 85.4,
    github_score: 88.0,
    track_score: 81.2,
    velocity_score: 83.0,
    commits_last_4h: 4,
    members: ['Alexei Romanov', 'Priya Sharma'],
  },
  {
    team_id: 390,
    external_id: 'T-0390',
    name: 'LuminaPay',
    base_rank: 39,
    range: '#37 - #42',
    volatility_sigma: 2.4,
    base_stat: 'IN',
    base_stat_type: 'in',
    perturbed_profile: 'AT RISK: Drops to #42 if Velocity drops',
    risk_level: 'FRAGILE',
    risk_type: 'fragile',
    survival_rate: 78.6,
    tech_score: 84.9,
    github_score: 83.5,
    track_score: 87.0,
    velocity_score: 82.8,
    commits_last_4h: 6,
    members: ['Mateo Rossi', 'Yuki Sato'],
  },
  {
    team_id: 400,
    external_id: 'T-0077',
    name: 'NovaPulse',
    base_rank: 40,
    range: '#38 - #44',
    volatility_sigma: 3.1,
    base_stat: 'IN',
    base_stat_type: 'in',
    perturbed_profile: '⚠️ CRITICAL: 52% survival rate!',
    risk_level: 'BUBBLE',
    risk_type: 'bubble',
    survival_rate: 52.0,
    tech_score: 84.6,
    github_score: 82.0,
    track_score: 86.0,
    velocity_score: 84.0,
    commits_last_4h: 15,
    members: ['Jordan Bell', 'Samantha Reed', 'Zack Taylor'],
  },
  {
    team_id: 410,
    external_id: 'T-0391',
    name: 'SynapseDB',
    base_rank: 41,
    range: '#39 - #43',
    volatility_sigma: 2.2,
    base_stat: 'OUT',
    base_stat_type: 'out',
    perturbed_profile: '44% promotion chance if Tech > 38%',
    risk_level: 'CONTENDER',
    risk_type: 'contender',
    survival_rate: 44.0,
    tech_score: 84.5,
    github_score: 86.0,
    track_score: 83.0,
    velocity_score: 85.0,
    commits_last_4h: 11,
    members: ['Dmitri Ivanov', 'Nadia Nour', 'Chen Wei'],
  },
  {
    team_id: 420,
    external_id: 'T-0420',
    name: 'DeFiNexus',
    base_rank: 42,
    range: '#40 - #45',
    volatility_sigma: 2.0,
    base_stat: 'OUT',
    base_stat_type: 'out',
    perturbed_profile: '18% promotion rate under niche sweeps',
    risk_level: 'WAITLIST',
    risk_type: 'waitlist',
    survival_rate: 18.2,
    tech_score: 83.8,
    github_score: 84.0,
    track_score: 82.5,
    velocity_score: 83.2,
    commits_last_4h: 3,
    members: ['Lucas Moura', 'Fatima Zahra'],
  },
];

/**
 * Recalculates simulated Monte Carlo stability results when sliders move.
 */
export function calculateMonteCarloPerturbations(weights) {
  const { tech, github, track, velocity } = weights;
  const total = tech + github + track + velocity || 100;

  // Normalized ratios
  const rTech = tech / total;
  const rGit = github / total;
  const rTrack = track / total;
  const rVel = velocity / total;

  // Calculate composite shifts for key bubble teams
  // In Tech-heavy, SynapseDB (#41) surges over NovaPulse (#40)
  const novaPulseScore = 84.6 * rTech + 82.0 * rGit + 86.0 * rTrack + 84.0 * rVel;
  const synapseScore = 86.5 * rTech + 86.0 * rGit + 81.0 * rTrack + 83.0 * rVel;

  const isInverted = synapseScore > novaPulseScore;

  // Overall stability index calculation
  const driftPenalty = Math.abs(tech - 35) * 0.4 + Math.abs(github - 25) * 0.3 + Math.abs(track - 20) * 0.2 + Math.abs(velocity - 20) * 0.2;
  const stabilityIndex = Math.max(78.5, Math.min(96.8, 92.5 - driftPenalty)).toFixed(1);
  const successfulRuns = Math.round((stabilityIndex / 100) * 10000);

  return {
    stabilityIndex: parseFloat(stabilityIndex),
    successfulRuns,
    isInverted,
    novaPulseScore: novaPulseScore.toFixed(2),
    synapseScore: synapseScore.toFixed(2),
  };
}
