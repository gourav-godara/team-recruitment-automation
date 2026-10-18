import { useState, useMemo } from 'react';
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

export default function StabilityStressPage({ onNavigateHome, onProceedToAudit }) {
  const navigate = useNavigate();

  const [weights, setWeights] = useState({
    tech: 35,
    github: 25,
    track: 20,
    velocity: 20,
  });
  const [activePreset, setActivePreset] = useState('baseline');
  const [teams, setTeams] = useState(mockBubbleTeams);
  const [isSimulating, setIsSimulating] = useState(false);
  const [activeStage, setActiveStage] = useState('stability-stress');

  // Modals
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [showTieBreakerModal, setShowTieBreakerModal] = useState(false);
  const [toast, setToast] = useState(null);

  const showNotification = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  // Recalculate perturbation results
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

  // Run 10k Monte Carlo cycles
  const handleRunSimulation = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setIsSimulating(false);
      showNotification('🎲 Monte Carlo sweep completed: 10,000 iterations processed in 680ms.');
    }, 700);
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
      t.volatility_sigma,
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
    showNotification('📥 Sensitivity Matrix CSV exported with 10,000 perturbation summary rows.');
  };

  // Proceed to Audit Export
  const handleProceedAudit = () => {
    showNotification('🔒 State Sealed: Weights locked after Monte Carlo validation. Advancing to Stage 07...');
    setTimeout(() => {
      if (onProceedToAudit) {
        onProceedToAudit();
      } else {
        navigate('/export-audit');
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
      navigate('/schema-mapper');
    } else if (stageId === 'data-quality') {
      navigate('/data-quality');
    } else if (stageId === 'scoring-engine') {
      navigate('/scoring-engine');
    } else if (stageId === 'ranked-results') {
      navigate('/ranked-results');
    } else if (stageId === 'stability-stress') {
      navigate('/stability-stress');
    } else if (stageId === 'export-audit') {
      showNotification('Stage 07: Export & Audit preview initialized.');
      if (onProceedToAudit) {
        setTimeout(onProceedToAudit, 400);
      } else {
        setTimeout(() => navigate('/export-audit'), 400);
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

            {/* Top Metric Bento Cards */}
            <StabilityMetricsBento
              stabilityIndex={perturbationResult.stabilityIndex}
              successfulRuns={perturbationResult.successfulRuns}
              vulnerableCount={mockStabilityMetrics.vulnerable_count}
              safeAnchorsCount={mockStabilityMetrics.safe_anchors_count}
              maxDisplacement={mockStabilityMetrics.max_displacement}
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
                navigate('/team-compare');
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
