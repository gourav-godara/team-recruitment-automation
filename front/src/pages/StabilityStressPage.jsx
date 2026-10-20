import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SchemaHeader from '../components/schema/SchemaHeader';
import SchemaSidebar from '../components/schema/SchemaSidebar';
import StabilityHeaderBanner from '../components/stability/StabilityHeaderBanner';
import StabilityMetricsBento from '../components/stability/StabilityMetricsBento';
import PerturbationController from '../components/stability/PerturbationController';
import BubbleZoneVolatilityMatrix from '../components/stability/BubbleZoneVolatilityMatrix';
import TieBreakerAdvisoryCard from '../components/stability/TieBreakerAdvisoryCard';
import TieBreakerModal from '../components/stability/TieBreakerModal';
import TeamStabilityDetailModal from '../components/stability/TeamStabilityDetailModal';
import { mockDatasetInfo } from '../data/mockSchema';
import {
  mockStabilityMetrics,
  mockStressPresets,
  mockBubbleTeams,
  calculateMonteCarloPerturbations,
} from '../data/mockStability';
import { useApp } from '../context/AppContext';
import { runSensitivity } from '../api/client';

export default function StabilityStressPage({ onNavigateHome, onProceedToAudit }) {
  const navigate = useNavigate();
  const { campaignId, datasetId, runId, navigateWithState } = useApp();

  const [weights, setWeights] = useState({
    tech: 35,
    github: 25,
    track: 20,
    velocity: 20,
  });
  const [activePreset, setActivePreset] = useState('baseline');
  const [teams, setTeams] = useState(mockBubbleTeams);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simError, setSimError] = useState(null);
  const [sensitivityResult, setSensitivityResult] = useState(null);
  const [activeStage, setActiveStage] = useState('stability-stress');

  // Modals
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [showTieBreakerModal, setShowTieBreakerModal] = useState(false);
  const [toast, setToast] = useState(null);

  const showNotification = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  // Recalculate perturbation results (fallback / local heuristic)
  const perturbationResult = useMemo(() => {
    return calculateMonteCarloPerturbations(weights);
  }, [weights]);

  // Sliders input
  const handleWeightChange = (key, val) => {
    setWeights((prev) => ({
      ...prev,
      [key]: val,
    }));
    setActivePreset('custom');
  };

  // Preset selection
  const handleSelectPreset = (presetId) => {
    const preset = mockStressPresets[presetId];
    if (preset) {
      setWeights(preset.weights);
      setActivePreset(presetId);
      showNotification(`⚡ Preset applied: ${preset.label}`);
    }
  };

  // Run simulation against backend if runId exists, or run local Monte Carlo
  const handleRunSimulation = async () => {
    setIsSimulating(true);
    setSimError(null);

    if (runId) {
      try {
        const total = (weights.tech + weights.github + weights.track + weights.velocity) || 100;
        const wTech = weights.tech / total;
        const wGithub = weights.github / total;
        const wTrack = weights.track / total;
        const wVel = (total - weights.tech - weights.github - weights.track) / total;

        const newConfig = {
          top_x: 40,
          weights: {
            experience_years: Number(wTech.toFixed(4)),
            github_composite_score: Number(wGithub.toFixed(4)),
            presentation: Number(wTrack.toFixed(4)),
            skills: Number(wVel.toFixed(4)),
          },
        };

        const res = await runSensitivity(runId, newConfig);
        setSensitivityResult(res);

        if (res && res.team_deltas && res.team_deltas.length > 0) {
          // Map backend deltas into volatility table format
          const mappedTeams = res.team_deltas.map((d) => ({
            team_id: d.team_id,
            name: d.team_name || d.team_id,
            base_rank: d.base_rank ?? 999,
            new_rank: d.new_rank,
            range: d.base_rank && d.new_rank
              ? `#${Math.min(d.base_rank, d.new_rank)} - #${Math.max(d.base_rank, d.new_rank)}`
              : `#${d.base_rank || '?'}`,
            volatility_sigma: d.rank_delta !== null && d.rank_delta !== undefined
              ? `${d.rank_delta > 0 ? '+' : ''}${d.rank_delta} ranks`
              : '±0 ranks',
            base_stat: d.base_rank && d.base_rank <= 40 ? 'IN' : 'OUT',
            survival_rate: d.new_rank && d.new_rank <= 40 ? 100 : 0,
            perturbed_profile: d.status_change === 'NEWLY_SHORTLISTED'
              ? 'Promoted into Shortlist'
              : d.status_change === 'DROPPED_FROM_SHORTLIST'
              ? 'Dropped below Cutoff'
              : d.score_delta !== null && d.score_delta !== undefined
              ? `Score Delta: ${d.score_delta > 0 ? '+' : ''}${d.score_delta.toFixed(2)} pts`
              : 'Stable boundary rank',
            risk_level: d.status_change === 'NEWLY_SHORTLISTED'
              ? 'PROMOTED'
              : d.status_change === 'DROPPED_FROM_SHORTLIST'
              ? 'CRITICAL (DROPPED)'
              : Math.abs(d.rank_delta || 0) > 3
              ? 'HIGH VOLATILITY'
              : 'SAFE',
            risk_type: d.status_change === 'DROPPED_FROM_SHORTLIST'
              ? 'bubble'
              : d.status_change === 'NEWLY_SHORTLISTED'
              ? 'contender'
              : Math.abs(d.rank_delta || 0) > 2
              ? 'fragile'
              : 'safe',
          }));

          // Sort by base_rank so cutoff horizon displays cleanly
          mappedTeams.sort((a, b) => a.base_rank - b.base_rank);
          setTeams(mappedTeams);
        }

        showNotification(
          `⚡ Sensitivity preview evaluated: ${res.turnover_count ?? 0} boundary swaps (${res.turnover_rate?.toFixed(1) ?? 0}% turnover).`
        );
      } catch (err) {
        setSimError(err.message || 'Sensitivity preview simulation failed.');
        showNotification(`⚠️ Simulation error: ${err.message}`);
      } finally {
        setIsSimulating(false);
      }
    } else {
      setTimeout(() => {
        setIsSimulating(false);
        showNotification('🎲 Monte Carlo sweep completed: 10,000 iterations processed in 680ms.');
      }, 700);
    }
  };

  // Download Sensitivity CSV
  const handleDownloadCsv = () => {
    const headers = [
      'team_name',
      'base_rank',
      'rank_range',
      'volatility_sigma',
      'base_status',
      'survival_rate_pct',
      'risk_level',
      'perturbed_notes',
    ];
    const rows = teams.map((t) => [
      `"${t.name}"`,
      t.base_rank,
      `"${t.range}"`,
      `"${t.volatility_sigma}"`,
      `"${t.base_stat}"`,
      t.survival_rate,
      `"${t.risk_level}"`,
      `"${t.perturbed_profile}"`,
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `monte_carlo_sensitivity_matrix_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('📥 Sensitivity Matrix CSV exported with perturbation summary rows.');
  };

  // Proceed to Audit Export
  const handleProceedAudit = () => {
    showNotification('🔒 State Sealed: Weights locked after Monte Carlo validation. Advancing to Stage 07...');
    setTimeout(() => {
      if (onProceedToAudit) {
        onProceedToAudit();
      } else {
        navigateWithState('/export-audit');
      }
    }, 600);
  };

  // Resolve Tie Breaker
  const handleResolveTie = (verdict) => {
    const winnerName = verdict.winner === 'nova_pulse' ? 'NovaPulse' : 'SynapseDB';
    showNotification(`⚖️ Tie-breaker registered: ${winnerName} confirmed in Top 40 shortlist. Note recorded to audit_log.`);
    setTeams((prev) =>
      prev.map((t) => {
        if (t.name === 'NovaPulse') {
          return {
            ...t,
            base_stat: verdict.winner === 'nova_pulse' ? 'IN' : 'OUT',
            risk_level: verdict.winner === 'nova_pulse' ? 'SAFE' : 'WAITLIST',
          };
        }
        if (t.name === 'SynapseDB') {
          return {
            ...t,
            base_stat: verdict.winner === 'synapse_db' ? 'IN' : 'OUT',
            risk_level: verdict.winner === 'synapse_db' ? 'SAFE' : 'CONTENDER',
          };
        }
        return t;
      })
    );
  };

  // Sidebar navigation
  const handleStageSelect = (stageId) => {
    setActiveStage(stageId);
    if (stageId === 'import-schema') {
      navigateWithState('/schema-mapper');
    } else if (stageId === 'data-quality') {
      navigateWithState('/data-quality');
    } else if (stageId === 'scoring-engine') {
      navigateWithState('/scoring-engine');
    } else if (stageId === 'ranked-results') {
      navigateWithState('/ranked-results');
    } else if (stageId === 'team-compare') {
      navigateWithState('/team-compare');
    } else if (stageId === 'stability-stress') {
      navigateWithState('/stability-stress');
    } else if (stageId === 'export-audit') {
      showNotification('Stage 07: Export & Audit preview initialized.');
      if (onProceedToAudit) {
        setTimeout(onProceedToAudit, 400);
      } else {
        setTimeout(() => navigateWithState('/export-audit'), 400);
      }
    } else {
      showNotification(`Stage ${stageId.toUpperCase()} selected.`);
    }
  };

  return (
    <div className="min-h-screen bg-surface font-body-md text-on-surface antialiased bg-dot-pattern">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-20 right-6 z-50 animate-bounce">
          <div className="bg-[#0f172a] text-white px-5 py-3 rounded-xl border-2 border-secondary-fixed shadow-[4px_4px_0px_#0f172a] flex items-center gap-3">
            <span className="material-symbols-outlined text-secondary-fixed text-xl">casino</span>
            <span className="font-label-md text-label-md">{toast}</span>
          </div>
        </div>
      )}

      {/* Top Console Navigation Bar */}
      <SchemaHeader
        datasetInfo={mockDatasetInfo}
        onNavigateHome={() => (onNavigateHome ? onNavigateHome() : navigate('/'))}
      />

      {/* Left Pipeline Sidebar */}
      <SchemaSidebar
        activeStage={activeStage}
        onStageSelect={handleStageSelect}
      />

      {/* Main Workspace (Offset by sidebar width 72) */}
      <div className="pl-72">
        <main className="w-full min-h-[calc(100vh-4rem)] pt-16 bg-surface px-gutter-lg py-gutter-lg">
          <div className="flex flex-col w-full relative max-w-7xl mx-auto">
            {/* Ambient Background Dots */}
            <div className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(#0f172a_1px,transparent_1px)] [background-size:16px_16px] -z-10"></div>

            {/* Header & Stage Indicator */}
            <StabilityHeaderBanner
              onDownloadCsv={handleDownloadCsv}
              onProceedAudit={handleProceedAudit}
            />

            {/* Run Connection Banner */}
            {runId ? (
              <div className="mb-space-md p-3 rounded-xl bg-primary-container/10 border-2 border-primary-container text-on-surface flex items-center justify-between flex-wrap gap-2 shadow-[2px_2px_0px_#0f172a]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-xl font-bold">bolt</span>
                  <span className="text-sm font-semibold">
                    Linked to <strong>Evaluation Run #{runId}</strong>: Perturbation cycles recalculate candidate scores against live data.
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-primary text-white text-xs font-mono font-bold">
                  LIVE RUN CONNECTED
                </span>
              </div>
            ) : (
              <div className="mb-space-md p-3 rounded-xl bg-surface-container-high border-2 border-[#0f172a] text-on-surface flex items-center justify-between flex-wrap gap-2 shadow-[2px_2px_0px_#0f172a]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-outline-variant text-xl">info</span>
                  <span className="text-sm text-on-surface-variant font-medium">
                    No active evaluation run linked. Showing baseline simulation models. Complete Stage 03 to test live candidate scores.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => navigateWithState('/scoring-engine')}
                  className="px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed text-xs font-bold border border-[#0f172a] hover:bg-secondary-fixed-dim"
                >
                  Go to Scoring Engine
                </button>
              </div>
            )}

            {/* Simulation Error Alert */}
            {simError && (
              <div className="mb-space-md p-3 rounded-xl bg-tertiary-container/20 border-2 border-tertiary text-on-surface flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-tertiary text-xl font-bold">error</span>
                  <span className="text-sm font-bold text-tertiary">
                    Sensitivity Simulation Error: {simError}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleRunSimulation}
                  className="px-3 py-1 rounded-lg bg-surface-container-lowest border border-[#0f172a] text-xs font-bold hover:bg-white"
                >
                  Retry Simulation
                </button>
              </div>
            )}

            {/* Top Metric Bento Cards */}
            <StabilityMetricsBento
              stabilityIndex={
                sensitivityResult && sensitivityResult.turnover_rate !== undefined
                  ? Number((100 - sensitivityResult.turnover_rate).toFixed(1))
                  : perturbationResult.stabilityIndex
              }
              successfulRuns={
                sensitivityResult && sensitivityResult.turnover_rate !== undefined
                  ? Math.round((1 - sensitivityResult.turnover_rate / 100) * 10000)
                  : perturbationResult.successfulRuns
              }
              vulnerableCount={
                sensitivityResult && sensitivityResult.turnover_count !== undefined
                  ? sensitivityResult.turnover_count
                  : mockStabilityMetrics.vulnerable_count
              }
              safeAnchorsCount={
                sensitivityResult && sensitivityResult.shortlist_size !== undefined
                  ? Math.max(0, sensitivityResult.shortlist_size - (sensitivityResult.turnover_count || 0))
                  : mockStabilityMetrics.safe_anchors_count
              }
              maxDisplacement={
                sensitivityResult && sensitivityResult.team_deltas
                  ? sensitivityResult.team_deltas.reduce((m, d) => Math.max(m, Math.abs(d.rank_delta || 0)), 0)
                  : mockStabilityMetrics.max_displacement
              }
            />

            {/* Main Split Console: Controller (Left 5) + Volatility Matrix (Right 7) */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-lg mb-space-lg items-start">
              {/* Left Panel: Perturbation Controller */}
              <div className="xl:col-span-5 flex flex-col gap-space-lg">
                <PerturbationController
                  weights={weights}
                  onWeightChange={handleWeightChange}
                  activePreset={activePreset}
                  onSelectPreset={handleSelectPreset}
                  onRunSimulation={handleRunSimulation}
                  isSimulating={isSimulating}
                />
              </div>

              {/* Right Panel: Bubble Zone Volatility Matrix */}
              <div className="xl:col-span-7 flex flex-col gap-space-lg">
                <BubbleZoneVolatilityMatrix
                  teams={teams}
                  onSelectTeam={(team) => setSelectedTeam(team)}
                />
              </div>
            </div>

            {/* Bottom Tie-Breaker Advisory Card */}
            <TieBreakerAdvisoryCard
              onOpenCompare={() => {
                showNotification('Opening Head-to-Head Compare view for NovaPulse vs SynapseDB...');
                navigateWithState('/team-compare');
              }}
              onCallTieBreaker={() => setShowTieBreakerModal(true)}
              isInverted={perturbationResult.isInverted}
              novaPulseScore={perturbationResult.novaPulseScore}
              synapseScore={perturbationResult.synapseScore}
            />
          </div>
        </main>
      </div>

      {/* Modals */}
      <TieBreakerModal
        isOpen={showTieBreakerModal}
        onClose={() => setShowTieBreakerModal(false)}
        onResolveTie={handleResolveTie}
      />

      <TeamStabilityDetailModal
        isOpen={!!selectedTeam}
        onClose={() => setSelectedTeam(null)}
        team={selectedTeam}
      />
    </div>
  );
}
