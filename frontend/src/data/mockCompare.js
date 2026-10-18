/**
 * Mock Data for Stage 05: Team Comparison & Boundary Tie-Breaker
 * Conforming strictly to:
 * - DESIGN.md (Neo-Memphis pop-studio aesthetic & design tokens)
 * - frontend/DATABASE_DESIGN.md (pairwise_comparisons, overrides, audit_log, criteria)
 * - frontend/schema.sql (SQLite schema definition)
 */

export const mockDefaultPair = {
  teamA: {
    id: 'team_118',
    team_id: 118,
    name: 'NovaPulse',
    short_code: 'NP',
    logo_bg: 'bg-primary-container text-on-primary',
    rank: 40,
    status_label: 'ON THE WIRE // CUTOFF IN',
    status_type: 'cutoff_in', // 'cutoff_in' | 'challenger_out' | 'locked' | 'promoted'
    track: 'DePIN / IoT Track',
    description: 'Decentralized low-latency mesh bandwidth relay with custom embedded rust microkernel.',
    github_url: 'github.com/novapulse-core',
    demo_url: '3m 42s Demo',
    final_score: 89.40,
    raw_score: 87.10,
    rubric: {
      tech: { score: 9.2, weight_label: '35%', diff: '+0.60 ADVANTAGE', is_lead: true, pct: 92 },
      repo: { score: 8.0, weight_label: '25%', diff: '-1.50 LAG', is_lead: false, pct: 80 },
      pitch: { score: 8.8, weight_label: '20%', diff: '+0.40 ADVANTAGE', is_lead: true, pct: 88 },
      velocity: { score: 7.9, weight_label: '20%', diff: '-1.20 LAG', is_lead: false, pct: 79 },
    },
    forensics: {
      commits_count: 44,
      commits_label: '44 commits',
      midpoint_peak: 'Mid-Sprint Peak',
      sparkline_points: '0,22 10,24 20,20 30,12 40,16 50,8 60,6 70,18 80,10 90,4 100,6',
      ast_pct: '4.2%',
      ast_label: 'VERIFIED',
      ast_note: 'Within < 5% clean repo threshold',
      ast_flags: '0 boilerplates flag',
      demo_status: '3m 42s Public Stream',
      demo_note: 'Live hardware test shown',
      roster_count: '5 Hackers',
      roster_note: 'NUS & NTU IoT Labs',
      verified_ratio: '5/5',
      members: [
        {
          name: 'Jordan Bell',
          role: 'Lead Embedded Dev',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=face',
        },
        {
          name: 'Samantha Reed',
          role: 'Firmware & RF',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&crop=face',
        },
        {
          name: 'Zack Taylor',
          role: 'Protocol Architect',
          avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop&crop=face',
        },
      ],
    },
  },
  teamB: {
    id: 'team_309',
    team_id: 309,
    name: 'SynapseDB',
    short_code: 'SD',
    logo_bg: 'bg-secondary-fixed text-on-secondary-fixed',
    rank: 41,
    status_label: 'BUBBLE CONTENDER // CHAL-OUT',
    status_type: 'challenger_out',
    track: 'Databases & Infra Track',
    description: 'Sub-millisecond write consensus for distributed key-value storage with Zero-Knowledge verification.',
    github_url: 'github.com/synapse-distributed',
    demo_url: '4m 15s Loom',
    final_score: 89.30,
    raw_score: 86.80,
    rubric: {
      tech: { score: 8.6, weight_label: '35%', diff: '-0.60 LAG', is_lead: false, pct: 86 },
      repo: { score: 9.5, weight_label: '25%', diff: '+1.50 ADVANTAGE', is_lead: true, pct: 95 },
      pitch: { score: 8.4, weight_label: '20%', diff: '-0.40 LAG', is_lead: false, pct: 84 },
      velocity: { score: 9.1, weight_label: '20%', diff: '+1.20 ADVANTAGE', is_lead: true, pct: 91 },
    },
    forensics: {
      commits_count: 82,
      commits_label: '82 commits',
      midpoint_peak: 'Sustained Output',
      sparkline_points: '0,26 12,22 24,14 36,10 48,12 60,4 72,6 84,2 92,4 100,2',
      ast_pct: '1.8%',
      ast_label: 'ULTRA CLEAN',
      ast_note: 'Superior originality score',
      ast_flags: 'Zero external code snippets',
      demo_status: '4m 15s Loom (Pass Unlocked)',
      demo_note: 'Full distributed cluster run',
      roster_count: '3 Maintainers',
      roster_note: 'TiDB & Apache Foundation alumni',
      verified_ratio: '3/3',
      members: [
        {
          name: 'Dmitri Ivanov',
          role: 'Core Engine Maintainer',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&h=120&fit=crop&crop=face',
        },
        {
          name: 'Nadia Nour',
          role: 'Distributed Systems',
          avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&h=120&fit=crop&crop=face',
        },
        {
          name: 'Chen Wei',
          role: 'Rust KV Storage',
          avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&h=120&fit=crop&crop=face',
        },
      ],
    },
  },
};

export const mockEvaluatorsList = [
  {
    id: 'eval_1',
    name: 'Alex Rivers',
    role: 'Tier-1 Jury Lead',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face',
    score_nova: 88.0,
    score_synapse: 85.0,
    spread: '+3.0 (NP)',
    spread_type: 'np',
    rationale: 'Custom Rust driver on ESP32 is authentic hardware work. Harder to execute in 36 hours than database tests.',
    voted_for: 'NP',
  },
  {
    id: 'eval_2',
    name: 'Dr. Elena Rostova',
    role: 'Infra & Distributed Systems',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop&crop=face',
    score_nova: 84.0,
    score_synapse: 91.0,
    spread: '+7.0 (SDB)',
    spread_type: 'sdb',
    rationale: 'SynapseDB consensus algorithm is textbook perfection. AST check proves zero recycled Raft implementations.',
    voted_for: 'SDB',
  },
  {
    id: 'eval_3',
    name: 'Marcus Chen',
    role: 'Venture Scout & Ecosystem',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    score_nova: 92.0,
    score_synapse: 88.0,
    spread: '+4.0 (NP)',
    spread_type: 'np',
    rationale: 'DePIN token economics are well-balanced. Better product demo clarity and potential commercial spinout.',
    voted_for: 'NP',
  },
  {
    id: 'eval_4',
    name: 'Sarah Lin',
    role: 'Smart Contract Security',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face',
    score_nova: 86.0,
    score_synapse: 90.0,
    spread: '+4.0 (SDB)',
    spread_type: 'sdb',
    rationale: 'SynapseDB commit cadence is exceptional. Zero credential leaks and high unit test coverage (88%).',
    voted_for: 'SDB',
  },
];

export const mockAlternativeContenders = [
  { id: 'team_380', name: 'ZeroTrace', rank: 38, score: 89.65, track: 'Privacy' },
  { id: 'team_390', name: 'LuminaPay', rank: 39, score: 89.50, track: 'Payments' },
  { id: 'team_118', name: 'NovaPulse', rank: 40, score: 89.40, track: 'DePIN / IoT' },
  { id: 'team_309', name: 'SynapseDB', rank: 41, score: 89.30, track: 'Databases & Infra' },
  { id: 'team_420', name: 'DeFiNexus', rank: 42, score: 89.10, track: 'DeFi & Liquidity' },
  { id: 'team_430', name: 'Kuro Sentinel', rank: 43, score: 88.90, track: 'Security' },
];
