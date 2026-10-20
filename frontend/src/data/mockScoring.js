/**
 * Mock Data for Stage 03: Scoring Engine & Multi-Factor Weights
 * Conforming strictly to:
 * - DESIGN.md (Neo-Memphis pop-studio aesthetic & design tokens)
 * - frontend/DATABASE_DESIGN.md (configs, criteria, runs, run_results, run_score_details, run_rule_results, overrides)
 * - frontend/schema.sql (SQLite schema definition)
 */

export const mockWeightPresets = {
  balanced: {
    id: 'balanced',
    name: 'Balanced v3',
    label: 'Balanced (35/25/20/20)',
    weights: {
      w1: 35, // Technical Depth & Architecture
      w2: 25, // Codebase & GitHub Health
      w3: 20, // Presentation, Pitch & Live Demo
      w4: 20, // Team Velocity & Sprint Momentum
    },
    description: 'Optimal generalist model balancing deep technical architecture with product execution and sprint velocity.',
    curve: 'z_score',
  },
  tech: {
    id: 'tech',
    name: 'Tech-Heavy Multiplier',
    label: 'Tech-Heavy (50/30/10/10)',
    weights: {
      w1: 50,
      w2: 30,
      w3: 10,
      w4: 10,
    },
    description: 'Prioritizes distributed systems complexity, smart contract security, and codebase commit volume.',
    curve: 'z_score',
  },
  pitch: {
    id: 'pitch',
    name: 'Product & Pitch Prioritized',
    label: 'Product & Pitch (25/20/35/20)',
    weights: {
      w1: 25,
      w2: 20,
      w3: 35,
      w4: 20,
    },
    description: 'Rewards exceptional UX polish, customer problem-solution fit, and compelling live video demonstration.',
    curve: 'min_max',
  },
  equal: {
    id: 'equal',
    name: 'Uniform Quad Distribution',
    label: 'Equal Spread (25x4)',
    weights: {
      w1: 25,
      w2: 25,
      w3: 25,
      w4: 25,
    },
    description: 'Equal 25% weight across all four preliminary judging vectors with zero skew.',
    curve: 'z_score',
  },
};

export const mockScoringCriteria = [
  {
    id: 'w1',
    key: 'judge_prelim_tech',
    code: 'W1',
    name: 'Technical Depth & Architecture',
    mappedSource: 'judge_prelim_tech',
    description: 'Evaluates system architecture, zero-knowledge circuits, smart contracts, and algorithm complexity.',
    defaultWeight: 35,
    color: '#2563eb',
    bgColor: 'bg-primary-container',
    textColor: 'text-on-primary-container',
    accentColor: 'accent-primary',
    statInfo: 'Weights standard dev: σ = 1.18',
    curveBadge: 'Z-score Curve Active',
    min: 5,
    max: 70,
  },
  {
    id: 'w2',
    key: 'github_repo_url',
    code: 'W2',
    name: 'Codebase & GitHub Health',
    mappedSource: 'github_repo_url (commits, tree depth)',
    description: 'Commit count distribution, tree depth, syntax AST validation, and test suite presence.',
    defaultWeight: 25,
    color: '#10b981',
    bgColor: 'bg-[#10b981]',
    textColor: 'text-on-primary',
    accentColor: 'accent-[#10b981]',
    statInfo: 'Automated AST semantic parsing enabled',
    curveBadge: 'Min commits threshold: 6',
    min: 5,
    max: 70,
  },
  {
    id: 'w3',
    key: 'demo_video_url',
    code: 'W3',
    name: 'Presentation, Pitch & Live Demo',
    mappedSource: 'demo_video_url + jury notes',
    description: 'Video demonstration conciseness, live application responsiveness, and problem statement articulation.',
    defaultWeight: 20,
    color: '#ffe24c',
    bgColor: 'bg-secondary-fixed',
    textColor: 'text-on-secondary-fixed',
    accentColor: 'accent-secondary',
    statInfo: 'Duration cutoff penalty: > 300 seconds',
    curveBadge: 'Loom/YouTube OCR sync: OK',
    min: 5,
    max: 70,
  },
  {
    id: 'w4',
    key: 'team_velocity',
    code: 'W4',
    name: 'Team Velocity & Sprint Momentum',
    mappedSource: 'cadence delta over 36 hrs',
    description: 'Continuous commits across the 36-hour sprint, cross-contributor parity, and PR cadence.',
    defaultWeight: 20,
    color: '#8b5cf6',
    bgColor: 'bg-[#8b5cf6]',
    textColor: 'text-on-primary',
    accentColor: 'accent-[#8b5cf6]',
    statInfo: 'Time-weighted burst penalty configured',
    curveBadge: 'Min contributor parity: 2 members',
    min: 5,
    max: 70,
  },
];

export const initialBinaryHardGates = [
  {
    id: 'gate1',
    ruleName: 'Git Commit Timestamp Window',
    criterionKey: 'hackathon_commit_window',
    icon: 'schedule',
    iconColor: 'text-primary',
    description: 'All production commits must fall strictly within the official 36-hour hackathon timeframe.',
    flaggedCount: 4,
    flaggedLabel: '4 teams violated',
    tolerance: 'tolerance: +15m',
    enabled: true,
  },
  {
    id: 'gate2',
    ruleName: 'Originality & Plagiarism AST Scan',
    criterionKey: 'plagiarism_overlap',
    icon: 'fingerprint',
    iconColor: 'text-tertiary',
    description: 'Syntactic code duplication against public template corpora must not exceed 25%.',
    flaggedCount: 2,
    flaggedLabel: '2 teams flagged (>45% overlap)',
    tolerance: 'AST-v4 model',
    enabled: true,
  },
  {
    id: 'gate3',
    ruleName: 'Working Public Demo / Video < 5m',
    criterionKey: 'demo_video_status',
    icon: 'videocam',
    iconColor: 'text-secondary',
    description: 'Video link must be public (200 OK HTTP) and recorded demonstration under 300 seconds.',
    flaggedCount: 6,
    flaggedLabel: '6 teams flagged (404 / >5m)',
    tolerance: 'HTTP Ping Verified',
    enabled: true,
  },
  {
    id: 'gate4',
    ruleName: 'Minimum Roster Size (2-5)',
    criterionKey: 'team_size',
    icon: 'group',
    iconColor: 'text-primary',
    description: 'Submissions must be built by verified teams containing between 2 and 5 hackathon registrants.',
    flaggedCount: 2,
    flaggedLabel: '2 solo entries flagged',
    tolerance: 'Devpost API check',
    enabled: true,
  },
];

export const mockDisqualifiedBlocklist = [
  {
    id: 'ETH-SG-0019',
    team_name: 'SolSync Offchain',
    gate_id: 'gate1',
    gate_name: 'Git Commit Timestamp Window',
    violation: 'Last 18 commits pushed 2 hours after official cutoff (T+38h 14m)',
    timestamp: '2026-10-18T10:14:22Z',
    status: 'disqualified',
    override_reason: null,
  },
  {
    id: 'ETH-SG-0144',
    team_name: 'ArbitragePulse',
    gate_id: 'gate1',
    gate_name: 'Git Commit Timestamp Window',
    violation: 'Initial commit history predates hackathon kickoff by 14 days',
    timestamp: '2026-10-17T04:12:00Z',
    status: 'disqualified',
    override_reason: null,
  },
  {
    id: 'ETH-SG-0283',
    team_name: 'DeFiNexus Bridge',
    gate_id: 'gate1',
    gate_name: 'Git Commit Timestamp Window',
    violation: 'Squashed commit with 110,000 LOC pushed 10 min before end',
    timestamp: '2026-10-18T07:50:00Z',
    status: 'disqualified',
    override_reason: null,
  },
  {
    id: 'ETH-SG-0401',
    team_name: 'ZkLend Rollup',
    gate_id: 'gate1',
    gate_name: 'Git Commit Timestamp Window',
    violation: 'Branch merged 48 minutes past soft deadline window',
    timestamp: '2026-10-18T08:48:00Z',
    status: 'disqualified',
    override_reason: null,
  },
  {
    id: 'ETH-SG-0055',
    team_name: 'AaveClone Rapid',
    gate_id: 'gate2',
    gate_name: 'Originality & Plagiarism AST Scan',
    violation: '54.2% AST token duplication against open-source Uniswap-v3 core contracts',
    timestamp: '2026-10-18T06:10:00Z',
    status: 'disqualified',
    override_reason: null,
  },
  {
    id: 'ETH-SG-0321',
    team_name: 'CopilotTemplate dApp',
    gate_id: 'gate2',
    gate_name: 'Originality & Plagiarism AST Scan',
    violation: '48.9% overlap with standard scaffold-eth starter template without diff',
    timestamp: '2026-10-18T05:30:00Z',
    status: 'disqualified',
    override_reason: null,
  },
  {
    id: 'ETH-SG-0072',
    team_name: 'VoidStream Live',
    gate_id: 'gate3',
    gate_name: 'Working Public Demo / Video < 5m',
    violation: 'Loom video URL returned HTTP 404 (Link expired or private access)',
    timestamp: '2026-10-18T07:22:00Z',
    status: 'disqualified',
    override_reason: null,
  },
  {
    id: 'ETH-SG-0165',
    team_name: 'OmniChat Audio',
    gate_id: 'gate3',
    gate_name: 'Working Public Demo / Video < 5m',
    violation: 'YouTube video duration is 9m 14s (exceeds mandatory 5m limit)',
    timestamp: '2026-10-18T07:45:00Z',
    status: 'disqualified',
    override_reason: null,
  },
  {
    id: 'ETH-SG-0209',
    team_name: 'PixelGuild NFT',
    gate_id: 'gate3',
    gate_name: 'Working Public Demo / Video < 5m',
    violation: 'Google Drive video link requires jury organization SSO permissions',
    timestamp: '2026-10-18T06:55:00Z',
    status: 'disqualified',
    override_reason: null,
  },
  {
    id: 'ETH-SG-0347',
    team_name: 'ChainSafe Relay',
    gate_id: 'gate3',
    gate_name: 'Working Public Demo / Video < 5m',
    violation: 'Submitted video link is placeholder "https://youtube.com/watch?v=TODO"',
    timestamp: '2026-10-18T07:59:00Z',
    status: 'disqualified',
    override_reason: null,
  },
  {
    id: 'ETH-SG-0412',
    team_name: 'GasLess Pay',
    gate_id: 'gate3',
    gate_name: 'Working Public Demo / Video < 5m',
    violation: 'Vimeo upload failed processing / corrupt video container codec',
    timestamp: '2026-10-18T07:11:00Z',
    status: 'disqualified',
    override_reason: null,
  },
  {
    id: 'ETH-SG-0478',
    team_name: 'HyperPay Wallet',
    gate_id: 'gate3',
    gate_name: 'Working Public Demo / Video < 5m',
    violation: 'Demo link broken, points to local localhost:3000 URL in submission form',
    timestamp: '2026-10-18T08:00:00Z',
    status: 'disqualified',
    override_reason: null,
  },
  {
    id: 'ETH-SG-0004',
    team_name: 'SoloHacker Prime',
    gate_id: 'gate4',
    gate_name: 'Minimum Roster Size (2-5)',
    violation: 'Only 1 registered hacker (Solo submission not permitted for hackathon tracks)',
    timestamp: '2026-10-17T02:00:00Z',
    status: 'disqualified',
    override_reason: null,
  },
  {
    id: 'ETH-SG-0450',
    team_name: 'LoneWolf Agent',
    gate_id: 'gate4',
    gate_name: 'Minimum Roster Size (2-5)',
    violation: '1 registered hacker listed on Devpost team sheet',
    timestamp: '2026-10-17T03:15:00Z',
    status: 'disqualified',
    override_reason: null,
  },
];

/**
 * Bubble and shortlist candidate teams for Stage 03 Live Simulation table.
 * Designed around cutoff rank 40 (quota horizon: 40 teams, 8.3% of 482 candidate teams).
 */
export const mockSimulationTeams = [
  {
    team_id: 772,
    external_id: 'team_772',
    team_name: 'ZeroLag Rollup',
    contributors: 4,
    track: 'Infrastructure',
    baselineRank: 40,
    rawScore: 88.4,
    // Vector scores on 0-100 scale: [W1: Tech, W2: Code, W3: Pitch, W4: Sprint]
    vectorScores: {
      w1: 94.2, // Tech
      w2: 91.5, // Repo
      w3: 82.0, // Pitch
      w4: 86.0, // Sprint
    },
    breakdownDetails: {
      w1_explanation: 'High throughput pipeline with ZK-STARK recursive validation',
      w2_explanation: '68 commits across 4 branches, 94% unit test branch coverage',
      w3_explanation: 'Crisp 3m 40s demo with live devnet test transactions',
      w4_explanation: 'Balanced commit distribution across all 4 contributors',
    },
  },
  {
    team_id: 309,
    external_id: 'team_309',
    team_name: 'zkPay Agent Mesh',
    contributors: 3,
    track: 'DeFi / AI',
    baselineRank: 41,
    rawScore: 87.9,
    vectorScores: {
      w1: 91.8,
      w2: 89.0,
      w3: 86.5,
      w4: 84.2,
    },
    breakdownDetails: {
      w1_explanation: 'Autonomous AI agent payments executing on intent-centric solver',
      w2_explanation: 'Rust crates built and tested with automated GitHub Actions CI',
      w3_explanation: 'High energy pitch with real-time browser agent automation demo',
      w4_explanation: 'Steady cadence with 42 commits over the 36-hour sprint',
    },
  },
  {
    team_id: 118,
    external_id: 'team_118',
    team_name: 'HyperSensor Oracle',
    contributors: 5,
    track: 'DePIN / IoT',
    baselineRank: 40,
    rawScore: 87.1,
    vectorScores: {
      w1: 89.5,
      w2: 88.0,
      w3: 87.0,
      w4: 84.0,
    },
    breakdownDetails: {
      w1_explanation: 'ESP32 firmware integration with cryptographic hardware attestation',
      w2_explanation: 'Clean monorepo with C++ firmware and TypeScript indexing microservices',
      w3_explanation: 'Live hardware sensor rig stream running during evaluation',
      w4_explanation: '5 contributors contributing regularly throughout sprint',
    },
  },
  {
    team_id: 442,
    external_id: 'team_442',
    team_name: 'OmniVault Smart Contract',
    contributors: 2,
    track: 'Security',
    baselineRank: 39,
    rawScore: 86.8,
    vectorScores: {
      w1: 90.0,
      w2: 92.0,
      w3: 79.5,
      w4: 81.0,
    },
    breakdownDetails: {
      w1_explanation: 'Formal verification using Certora and Halmos specifications',
      w2_explanation: 'Foundry test suite with 100% invariant fuzzing passing',
      w3_explanation: 'Pitch video lacked product use cases, focused purely on math spec',
      w4_explanation: '2 contributors, heavy commit activity clustered in final 8 hours',
    },
  },
  {
    team_id: 88,
    external_id: 'team_088',
    team_name: 'PeerProtocol Social Graph',
    contributors: 3,
    track: 'SocialFi',
    baselineRank: 38,
    rawScore: 86.2,
    vectorScores: {
      w1: 85.0,
      w2: 84.0,
      w3: 92.5,
      w4: 83.5,
    },
    breakdownDetails: {
      w1_explanation: 'Decentralized social graph protocol on Polygon ID credentials',
      w2_explanation: 'Frontend repository clean; smart contract contracts were standard forks',
      w3_explanation: 'Outstanding video pitch with viral UI and engaging narrative',
      w4_explanation: 'Sprint velocity peaked early with minimal backend changes in hours 24-36',
    },
  },
  {
    team_id: 512,
    external_id: 'team_512',
    team_name: 'SolanaStream Relay',
    contributors: 4,
    track: 'Infrastructure',
    baselineRank: 43,
    rawScore: 85.9,
    vectorScores: {
      w1: 88.0,
      w2: 87.5,
      w3: 83.0,
      w4: 86.0,
    },
    breakdownDetails: {
      w1_explanation: 'High-speed WebSocket data pump indexing shred streams directly',
      w2_explanation: 'Rust gRPC server with benchmark tests documented in README',
      w3_explanation: 'Technical screencast demonstrating sub-second block streaming',
      w4_explanation: 'Consistent 4-member commit velocity throughout sprint',
    },
  },
  {
    team_id: 201,
    external_id: 'team_201',
    team_name: 'NeuroPulse BCI',
    contributors: 3,
    track: 'AI / Health',
    baselineRank: 44,
    rawScore: 85.4,
    vectorScores: {
      w1: 89.0,
      w2: 82.0,
      w3: 88.0,
      w4: 82.0,
    },
    breakdownDetails: {
      w1_explanation: 'EEG signal classification network running on web workers',
      w2_explanation: 'Python notebook pipeline and React dashboard',
      w3_explanation: 'Live headset demonstration with brainwave spectral feedback',
      w4_explanation: 'Moderate commit count with 31 commits during sprint',
    },
  },
  {
    team_id: 644,
    external_id: 'team_644',
    team_name: 'QuantumKey KMS',
    contributors: 4,
    track: 'Security',
    baselineRank: 37,
    rawScore: 88.9,
    vectorScores: {
      w1: 93.0,
      w2: 90.0,
      w3: 81.0,
      w4: 87.5,
    },
    breakdownDetails: {
      w1_explanation: 'Post-quantum Kyber lattice cryptography implementation in WebAssembly',
      w2_explanation: 'Comprehensive test vector validation against NIST benchmarks',
      w3_explanation: 'Technical presentation focused heavily on cryptographic security proofs',
      w4_explanation: 'Solid continuous integration with commits from 3 of 4 team members',
    },
  },
];

/**
 * Calculates weighted score and simulated displacement for all teams.
 * Supports Z-Score curve and Min-Max curve.
 */
export function computeSimulationRankings(teams, weights, curve = 'z_score', activeGateIds = ['gate1', 'gate2', 'gate3', 'gate4']) {
  const { w1, w2, w3, w4 } = weights;
  const totalWeight = (w1 + w2 + w3 + w4) || 100;

  // Normalized weights summing to 1.0
  const nw1 = w1 / totalWeight;
  const nw2 = w2 / totalWeight;
  const nw3 = w3 / totalWeight;
  const nw4 = w4 / totalWeight;

  // 1. Calculate raw weighted composite for each team
  const evaluated = teams.map((team) => {
    const rawWeighted =
      team.vectorScores.w1 * nw1 +
      team.vectorScores.w2 * nw2 +
      team.vectorScores.w3 * nw3 +
      team.vectorScores.w4 * nw4;

    return {
      ...team,
      rawWeighted: parseFloat(rawWeighted.toFixed(2)),
    };
  });

  // 2. Apply normalization curve
  const scores = evaluated.map((t) => t.rawWeighted);
  const mean = scores.reduce((a, b) => a + b, 0) / (scores.length || 1);
  const stdDev = Math.sqrt(scores.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / (scores.length || 1)) || 1;
  const minScore = Math.min(...scores);
  const maxScore = Math.max(...scores);

  const scoredTeams = evaluated.map((team) => {
    let finalScore;
    if (curve === 'z_score') {
      // Z-score mapped to realistic 0-100 scale: base 88 + (z * 3.5)
      const z = (team.rawWeighted - mean) / stdDev;
      finalScore = parseFloat(Math.min(99.5, Math.max(70.0, 88.5 + z * 3.2)).toFixed(2));
    } else {
      // Min-Max linear scaling
      const ratio = (team.rawWeighted - minScore) / ((maxScore - minScore) || 1);
      finalScore = parseFloat((82.0 + ratio * 14.5).toFixed(2));
    }

    return {
      ...team,
      weightedScore: finalScore,
    };
  });

  // 3. Sort descending by score to simulate rank
  scoredTeams.sort((a, b) => b.weightedScore - a.weightedScore);

  // 4. Assign simulated ranks starting around pos 37
  return scoredTeams.map((team, index) => {
    const simulatedRank = 37 + index;
    const shift = team.baselineRank - simulatedRank; // positive means moved up!
    let displacementLabel = '0 SHIFT';
    let displacementType = 'neutral'; // 'positive' | 'negative' | 'new' | 'neutral'

    if (shift > 0) {
      if (simulatedRank <= 40 && team.baselineRank > 40) {
        displacementLabel = 'NEW IN';
        displacementType = 'new';
      } else {
        displacementLabel = `+${shift} POS`;
        displacementType = 'positive';
      }
    } else if (shift < 0) {
      displacementLabel = `${shift} POS`;
      displacementType = 'negative';
    }

    let quotaStatus;
    let quotaType; // 'locked' | 'safe' | 'wire' | 'drop' | 'eliminated'

    if (simulatedRank <= 38) {
      quotaStatus = 'LOCKED IN';
      quotaType = 'locked';
    } else if (simulatedRank === 39) {
      quotaStatus = 'BUBBLE SAFE';
      quotaType = 'safe';
    } else if (simulatedRank === 40) {
      quotaStatus = 'ON THE WIRE';
      quotaType = 'wire';
    } else if (simulatedRank === 41) {
      quotaStatus = 'DROP OUT';
      quotaType = 'drop';
    } else {
      quotaStatus = 'ELIMINATED';
      quotaType = 'eliminated';
    }

    return {
      ...team,
      simulatedRank,
      displacementLabel,
      displacementType,
      quotaStatus,
      quotaType,
      shift,
    };
  });
}
