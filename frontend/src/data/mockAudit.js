/**
 * Mock Data for Stage 07: Export & Cryptographic Audit
 * Conforming strictly to:
 * - DESIGN.md (Neo-Memphis pop-studio aesthetic & design tokens)
 * - frontend/DATABASE_DESIGN.md (runs, audit_log, run_results, digital_signatures)
 * - frontend/schema.sql (SQLite schema definition)
 */

import { mockRankedTeams } from './mockRankedResults';

export const mockAuditLedger = {
  stage: '07',
  stage_name: 'AUDIT LEDGER & SIGNING',
  title: 'Export & Cryptographic Audit',
  subtitle:
    'Seal finalized consensus rankings, generate SHA-256 tamper-evident verification receipts, and export complete audit bundles for sponsors, judges, and public announcement.',
  block_number: 19842910,
  dataset_name: 'submissions_final_v3.csv',
  file_hash_short: '8f9b2c',
  root_merkle_hash: '8f9b2c01d94ea277b07542d937013ac9fb0e89104d49a372e591bc31289f2a',
  ingestion_fingerprint: 'submissions_final_v3.csv',
  ingestion_meta: '4.8 MB, 482 items, SHA-256: 9b2d87e0fa...1a4c9',
  weight_matrix_name: 'Balanced_v3 [35, 25, 20, 20]',
  weight_weights: { tech: 35, github: 25, track: 20, velocity: 20 },
  monte_carlo_seed: '0x489D2F8A (10,000 runs)',
  timestamp_utc: '2025-10-18T14:32:00.491Z',
  unix_timestamp: 1760797920,
  digital_signature_ecdsa: 'MEQCIFZ93u0pX+7uY8k3m1ByNCA1A0zP5vQ7kQ6eZ9k2l3AiAK8L7mY8xP9q0w1e2r3t4y5u6i7o8p9',
  ipfs_cid: 'bafybeigdyrzt5sfp7oi4e892u317adfq2n3k9z81a4e',
  short_ipfs: 'bafybeigdyrzt5sfp7...4e',
  verification_url: 'https://shortlistiq.io/audit/verify?hash=8f9b2c01d94ea277b07542d937013ac9fb0e89104d49a372e591bc31289f2a',
  total_teams: 482,
  shortlist_count: 40,
  shortlist_percentage: '8.3%',
  quorum_leads: '8 / 8 Leads',
  quorum_percent: '100% Signed',
  stability_confidence: '92.5% Robust',
  stability_runs: '10k Runs',
  algorithm_drift: '0.00%',
  verification_latency: '22ms',
};

export const mockJurySigners = [
  {
    id: 'judge-1',
    name: 'Alex Rivers',
    role: 'Tier-1 Jury Lead',
    status: 'Signed & Approved',
    isSigned: true,
    timestamp: '14:28:11 UTC',
    signature: 'sig: 0x98f2b3e871da0...489',
    full_signature: '0x98f2b3e871da0672e819ac48942b109af32e8b91a',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBw4Nhka-9QzVk9PycqvdsXv5b78iXBCOUxlSDsYD1xmwDqEdp8ppfOprgm8AQBXjU7g2BZlIBJnOEYrJIeMqpsiF4bc00coJWYaTplt1lYl5Cz861-9jFz7r5yWhnJVH-IY_VoO5wXcjWV4PKy3eJKsO-nXWEYjsJYAl37TniLMUnGpvKlwnRvRuGDBS6WAdii-MJ8sngLGAhIYdUzMyRAv9UxxAeRz8nZfCGoxPA',
    fallback_initials: 'AR',
  },
  {
    id: 'judge-2',
    name: 'Dr. Elena Rostova',
    role: 'AI & Systems Lead',
    status: 'Signed & Approved',
    isSigned: true,
    timestamp: '14:29:45 UTC',
    signature: 'sig: 0x5a119c4e20b3f...21c',
    full_signature: '0x5a119c4e20b3f8901bca21cb478e1a90c91028ba',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBDQV8SpXHHRBfcc9oTG1okfG9Z5rsz7UNzbQtdiOTkQTreU5nnNOIoA-T2knSXF1l5QoCWYZYlwrqVBgIbugoT1pfLG24BMfbLaPvyApbVHohVgfYzgNhsTr1YH6qubXS_LZo-kCe9R3sCJjmB1JN51k3STOViackX1rsO8plCHtzvAaSzQkgfFcW4lR8TaDNsTKIcvhNJp_1Kv6ntNtTxP2y0Rv2mUrJTNdVxrNo',
    fallback_initials: 'ER',
  },
  {
    id: 'judge-3',
    name: 'Marcus Chen',
    role: 'DeFi & Infra Lead',
    status: 'Signed & Approved',
    isSigned: true,
    timestamp: '14:31:02 UTC',
    signature: 'sig: 0x7c38de921ab07...f9a',
    full_signature: '0x7c38de921ab0791efbc1f9a620e981bd35712e09',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB8Us69kPtN7TZjine9uA9LM0fdTjs7Syx0C060B-j6sv7HtRHlZTyZvJrogj6WeSpiQT_OT_mc6GsBpnDkAoYFtcgmMXXO44QL49o3rD8J2YDHXLH0C2alIuebHZHwd-nr5YHudGrf2OW09jLmwYpSab51zuu1EKmCw6mfQsxIqLYwOkKCEzxAs0nGfHnZNL2bx2HZ079SzcSoxPtv2UxADsgQlSkc-pV8dl5H6hI',
    fallback_initials: 'MC',
  },
  {
    id: 'judge-4',
    name: 'Sarah Lin',
    role: 'Security & UX Lead',
    status: 'Signed & Approved',
    isSigned: true,
    timestamp: '14:31:58 UTC',
    signature: 'sig: 0x11e47d8b5c924...80e',
    full_signature: '0x11e47d8b5c92451009cf80ea3b1982cf0912ab74',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAgqCCMUvXsMudv0f2zBL0O5L3T5YjuPW9wpEhC48DNhOsYxrw8YfxmJpbxWM_5miVw5Cg37eR22qsWNOFDuJ2OsaoH32jh4JgarL2ZQ76oqoLa9WosJrqt44fyriSyXQeu6b93Eh-lWlZnG-o_69UA1N-tw3w_av-ki4RViDkhvQFJ1GdXrjtbtWAgE9GFgu7PlEDTJc1BU25we_HuESF34b7M7aLd1aGV-fuxvjE',
    fallback_initials: 'SL',
  },
];

export const mockExportBundles = [
  {
    id: 'bundle-finalist',
    title: 'Public Finalist Roster',
    badge: '.csv & .json',
    badgeBg: 'bg-secondary-fixed text-on-secondary-fixed',
    icon: 'format_list_numbered',
    iconBg: 'bg-primary-fixed text-primary',
    description:
      'Formatted list of Top 40 teams, tracks, weighted scores, repo links, and presentation URLs ready for stage projection and website publish.',
    meta: [
      { label: 'Size', value: '142 KB' },
      { label: 'Checksum', value: 'ed41a8' },
    ],
    buttonText: 'Download Finalist CSV',
    buttonIcon: 'download',
    filename: 'Finalist_Roster_Top40.csv',
  },
  {
    id: 'bundle-manifest',
    title: 'Complete Audit Manifest',
    badge: '.json',
    badgeBg: 'bg-primary-container text-on-primary-container',
    icon: 'code_blocks',
    iconBg: 'bg-secondary-fixed text-on-secondary-fixed',
    description:
      'Contains raw criteria weights, z-score parameters, reviewer variance matrix, git commit hashes, and signed digital signatures.',
    meta: [
      { label: 'Size', value: '840 KB' },
      { label: 'Schema', value: 'Strict JSON Schema v2.4' },
    ],
    buttonText: 'Download JSON Manifest',
    buttonIcon: 'data_object',
    filename: 'Audit_Manifest_v2.4.json',
  },
  {
    id: 'bundle-tracks',
    title: 'Sponsor & Track Prize Reports',
    badge: '.pdf / .csv',
    badgeBg: 'bg-[#f43f5e] text-on-primary',
    icon: 'emoji_events',
    iconBg: 'bg-tertiary-fixed text-tertiary',
    description:
      'Per-track breakdown for DeFi, AI/Agents, Infra, Security, and Mobile tracks with sub-category rankings for prize sponsors.',
    meta: [
      { label: 'Tracks', value: '5 Track Dossiers' },
      { label: 'Status', value: 'Sponsor Sign-off ready' },
    ],
    buttonText: 'Generate Track Reports',
    buttonIcon: 'print',
    filename: 'Track_Prize_Reports.zip',
  },
  {
    id: 'bundle-deliberation',
    title: 'Judge Variance & Deliberation Log',
    badge: '.csv',
    badgeBg: 'bg-surface-dim text-on-surface',
    icon: 'analytics',
    iconBg: 'bg-surface-container-high text-on-surface',
    description:
      'Anonymized reviewer score distributions, outlier moderation history, and recorded tie-breaker consensus resolution notes.',
    meta: [
      { label: 'Audited', value: '482 Submissions Audited' },
      { label: 'Privacy', value: 'Anonymized IDs' },
    ],
    buttonText: 'Export Deliberation Notes',
    buttonIcon: 'history_edu',
    filename: 'Deliberation_Variance_Log.csv',
  },
];

// Helper to generate the exact Top 40 Finalist CSV content
export function generateFinalistCsv(teams = mockRankedTeams) {
  const top40 = teams.slice(0, 40);
  const headers = [
    'rank',
    'external_id',
    'team_name',
    'track',
    'category',
    'total_score',
    'tech_depth',
    'repo_health',
    'presentation',
    'velocity',
    'status',
    'merkle_leaf_hash',
  ];

  const rows = top40.map((t, idx) => [
    t.rank || idx + 1,
    `"${t.external_id || `T-${String(100 + idx).padStart(4, '0')}`}"`,
    `"${t.team_name || t.name}"`,
    `"${t.track || 'General'}"`,
    `"${t.category || 'DeFi'}"`,
    Number(t.total_score || 90 - idx * 0.4).toFixed(2),
    t.raw_vectors?.tech || 9.0,
    t.raw_vectors?.repo || 8.8,
    t.raw_vectors?.pitch || 9.1,
    t.raw_vectors?.velocity || 8.9,
    `"LOCKED_STAGE_FINALIST"`,
    `"0x${(10000000 + idx * 83719).toString(16).padEnd(16, '0')}"`,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
}

// Helper to generate full JSON audit manifest
export function generateAuditManifestJson(teams = mockRankedTeams) {
  const manifest = {
    $schema: 'https://shortlistiq.io/schemas/audit-manifest-v2.4.json',
    header: {
      generator: 'ShortlistIQ Deterministic Engine v2.4.1',
      dataset: 'submissions_final_v3.csv',
      block_height: 19842910,
      timestamp: '2025-10-18T14:32:00.491Z',
      unix_time: 1760797920,
    },
    consensus: {
      root_merkle_hash: '8f9b2c01d94ea277b07542d937013ac9fb0e89104d49a372e591bc31289f2a',
      input_sha256: '9b2d87e0fa3b42c81e9f127da5b81a4c90ef2918a',
      ecdsa_signature: 'MEQCIFZ93u0pX+7uY8k3m1ByNCA1A0zP5vQ7kQ6eZ9k2l3AiAK8L7mY8xP9q0w1e2r3t4y5u6i7o8p9',
      ipfs_cid: 'bafybeigdyrzt5sfp7oi4e892u317adfq2n3k9z81a4e',
      algorithmic_drift_pct: 0.0,
      reproducibility: '100% Deterministic',
    },
    evaluation_model: {
      name: 'Balanced_v3',
      weights: {
        technical_depth: 0.35,
        github_repository_health: 0.25,
        track_alignment: 0.20,
        sprint_velocity: 0.20,
      },
      monte_carlo_iterations: 10000,
      random_seed: '0x489D2F8A',
      stability_robustness_pct: 92.5,
    },
    signers: mockJurySigners.map((j) => ({
      name: j.name,
      role: j.role,
      status: j.status,
      timestamp: j.timestamp,
      signature: j.full_signature,
    })),
    shortlist_summary: {
      total_submissions: 482,
      shortlisted_count: 40,
      quota_percent: 8.3,
      top_40_teams: teams.slice(0, 40).map((t, idx) => ({
        rank: t.rank || idx + 1,
        external_id: t.external_id || `T-${String(100 + idx).padStart(4, '0')}`,
        name: t.team_name || t.name,
        track: t.track,
        score: t.total_score,
      })),
    },
  };

  return JSON.stringify(manifest, null, 2);
}

// Helper to generate deliberation variance log CSV
export function generateDeliberationCsv() {
  const headers = [
    'submission_id',
    'anonymized_alias',
    'track',
    'jury_assigned_count',
    'raw_mean_score',
    'variance_sigma',
    'outlier_adjusted',
    'moderation_notes',
  ];
  const sampleRows = [
    ['T-0418', 'Sub-Alpha-418', 'Privacy Infra', '6', '94.8', '0.42', 'NO', 'High consensus; zero outlier deviation'],
    ['T-0102', 'Sub-Beta-102', 'DeFi & Payments', '5', '93.4', '0.61', 'NO', 'Unanimous high score across liquidity model'],
    ['T-0205', 'Sub-Gamma-205', 'AI & Agents', '6', '92.1', '0.78', 'YES', 'Judge #3 high dev moderated with z-score trim'],
    ['T-0360', 'Sub-Delta-360', 'Security', '6', '85.2', '0.94', 'NO', 'Tie-breaker consensus resolved in favor of security audit'],
    ['T-0044', 'Sub-Epsilon-044', 'Mobile & UX', '5', '84.6', '1.12', 'YES', 'Boundary bubble verification passed (cutoff #40)'],
  ];
  return [headers.join(','), ...sampleRows.map((r) => r.join(','))].join('\r\n');
}
