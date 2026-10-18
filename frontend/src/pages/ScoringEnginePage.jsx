import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import SchemaHeader from '../components/schema/SchemaHeader';
import SchemaSidebar from '../components/schema/SchemaSidebar';
import ScoringHeaderBanner from '../components/scoring/ScoringHeaderBanner';
import ScoringKpiGrid from '../components/scoring/ScoringKpiGrid';
import CriteriaMultipliersCard from '../components/scoring/CriteriaMultipliersCard';
import BinaryHardGatesCard from '../components/scoring/BinaryHardGatesCard';
import ShortlistShiftPreviewTable from '../components/scoring/ShortlistShiftPreviewTable';
import ScoringBottomBar from '../components/scoring/ScoringBottomBar';
import DisqualifiedBlocklistModal from '../components/scoring/DisqualifiedBlocklistModal';
import TeamScoreDetailModal from '../components/scoring/TeamScoreDetailModal';
import ConfigSnapshotModal from '../components/scoring/ConfigSnapshotModal';
import SimulationRunModal from '../components/scoring/SimulationRunModal';
import { mockDatasetInfo } from '../data/mockSchema';
import {
  mockWeightPresets,
  initialBinaryHardGates,
  mockDisqualifiedBlocklist,
  mockSimulationTeams,
  computeSimulationRankings,
} from '../data/mockScoring';

export default function ScoringEnginePage({ onNavigateHome, onProceedToRankedResults }) {
  const navigate = useNavigate();

  // Model & weights state
  const [weights, setWeights] = useState({
    w1: 35,
    w2: 25,
    w3: 20,
    w4: 20,
  });
  const [activePreset, setActivePreset] = useState('balanced');
  const [curveType, setCurveType] = useState('z_score'); // 'z_score' | 'min_max'
  const [autoBalance, setAutoBalance] = useState(true);
  const [topQuota, setTopQuota] = useState(40);
  const [activeStage, setActiveStage] = useState('scoring-engine');

  // Hard Gates & Disqualified list state
  const [gates, setGates] = useState(initialBinaryHardGates);
  const [blocklist, setBlocklist] = useState(mockDisqualifiedBlocklist);

  // Modals & UI state
  const [showBlocklistModal, setShowBlocklistModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showRunModal, setShowRunModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [isComputing, setIsComputing] = useState(false);
  const [toast, setToast] = useState(null);

  const showNotification = (msg) => {
    setToast(msg);
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Model name calculation
  const modelName = useMemo(() => {
    if (activePreset && mockWeightPresets[activePreset]) {
      return mockWeightPresets[activePreset].name;
    }
    return 'Custom Tuning';
  }, [activePreset]);

  // Total weight sum
  const totalSum = useMemo(() => {
    return weights.w1 + weights.w2 + weights.w3 + weights.w4;
  }, [weights]);

  // Active gates count
  const activeGatesCount = useMemo(() => {
    return gates.filter((g) => g.enabled).length;
  }, [gates]);

  // Disqualified count based on active gates & overrides
  const disqualifiedCount = useMemo(() => {
    const enabledGateIds = new Set(gates.filter((g) => g.enabled).map((g) => g.id));
    return blocklist.filter((t) => enabledGateIds.has(t.gate_id) && t.status !== 'overridden').length;
  }, [gates, blocklist]);

  // Dynamically compute simulated rankings for bubble teams
  const simulatedTeams = useMemo(() => {
    const activeGateIds = gates.filter((g) => g.enabled).map((g) => g.id);
    return computeSimulationRankings(mockSimulationTeams, weights, curveType, activeGateIds);
  }, [weights, curveType, gates]);

  // Handle weight slider change
  const handleWeightChange = (id, newVal) => {
    const clampedVal = Math.max(0, Math.min(70, newVal));

    if (autoBalance) {
      // Proportional balancing across remaining 3 sliders
      const otherKeys = ['w1', 'w2', 'w3', 'w4'].filter((k) => k !== id);
      const remainingTarget = 100 - clampedVal;
      const currentOthersSum = otherKeys.reduce((acc, k) => acc + weights[k], 0) || 1;

      const newWeights = { ...weights, [id]: clampedVal };
      let distributedSum = 0;

      otherKeys.forEach((k, idx) => {
        if (idx === otherKeys.length - 1) {
          // Put remainder into last key to avoid rounding drift
          newWeights[k] = Math.max(0, remainingTarget - distributedSum);
        } else {
          const ratio = weights[k] / currentOthersSum;
          const share = Math.round(remainingTarget * ratio);
          newWeights[k] = Math.max(0, share);
          distributedSum += newWeights[k];
        }
      });

      setWeights(newWeights);
    } else {
      setWeights((prev) => ({ ...prev, [id]: clampedVal }));
    }

    setActivePreset('custom');
  };

  // Select preset
  const handleSelectPreset = (presetId) => {
    const preset = mockWeightPresets[presetId];
    if (preset) {
      setWeights(preset.weights);
      setActivePreset(presetId);
      if (preset.curve) {
        setCurveType(preset.curve);
      }
      showNotification(`⚡ Preset applied: "${preset.name}". Weights normalized to 100%.`);
    }
  };

  // Normalize weights to 100%
  const handleNormalizeWeights = () => {
    const sum = totalSum || 1;
    const nw1 = Math.round((weights.w1 / sum) * 100);
    const nw2 = Math.round((weights.w2 / sum) * 100);
    const nw3 = Math.round((weights.w3 / sum) * 100);
    const nw4 = 100 - (nw1 + nw2 + nw3);

    setWeights({ w1: nw1, w2: nw2, w3: nw3, w4: nw4 });
    showNotification('✓ Multiplier vector normalized to exactly 100.0%.');
  };

  // Toggle normalization curve
  const handleToggleCurve = () => {
    const nextCurve = curveType === 'z_score' ? 'min_max' : 'z_score';
    setCurveType(nextCurve);
    showNotification(
      `Normalization curve switched to ${nextCurve === 'z_score' ? 'Z-Score Gaussian' : 'Min-Max Linear'}.`
    );
  };

  // Toggle hard gate
  const handleToggleGate = (gateId) => {
    setGates((prev) =>
      prev.map((g) => {
        if (g.id === gateId) {
          const nextState = !g.enabled;
          showNotification(
            `${g.ruleName} ${nextState ? 'ENFORCED' : 'DISABLED'}. Recalculating candidate pool.`
          );
          return { ...g, enabled: nextState };
        }
        return g;
      })
    );
  };

  // Grant or revoke Jury Override for disqualified team
  const handleOverrideTeam = (teamId, reason) => {
    setBlocklist((prev) =>
      prev.map((t) => {
        if (t.id === teamId) {
          if (reason) {
            showNotification(`✓ Jury Override granted for ${teamId}. Reason logged to audit_log.`);
            return { ...t, status: 'overridden', override_reason: reason };
          } else {
            showNotification(`Exemption revoked for ${teamId}. Team marked disqualified.`);
            return { ...t, status: 'disqualified', override_reason: null };
          }
        }
        return t;
      })
    );
  };

  // Reset to Baseline
  const handleResetBaseline = () => {
    const defaultPreset = mockWeightPresets.balanced;
    setWeights(defaultPreset.weights);
    setActivePreset('balanced');
    setCurveType('z_score');
    setGates(initialBinaryHardGates);
    showNotification('↺ Engine configuration reset to default Baseline (Balanced v3, 4 Gates).');
  };

  // Preview shortlist impact
  const handlePreviewImpact = () => {
    setIsComputing(true);
    setTimeout(() => {
      setIsComputing(false);
      showNotification('✨ Shortlist simulation updated: boundary rank displacements recalculated.');
    }, 500);
  };

  // Run scoring engine
  const handleRunEngine = () => {
    setShowRunModal(true);
  };

  // Proceed to Ranked Results (Stage 04)
  const handleProceedToRankedResults = () => {
    setShowRunModal(false);
    showNotification('🔒 State Sealed: SHA-256 seal 0x8f92b7c4 verified. Advancing to Stage 04: Ranked Results...');
    setTimeout(() => {
      if (onProceedToRankedResults) {
        onProceedToRankedResults();
      } else {
        navigate('/ranked-results');
      }
    }, 700);
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
      showNotification('Stage 04: Ranked Results preview loaded.');
      if (onProceedToRankedResults) {
        setTimeout(onProceedToRankedResults, 400);
      } else {
        setTimeout(() => navigate('/ranked-results'), 400);
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
            <span className="material-symbols-outlined text-secondary-fixed text-xl">info</span>
            <span className="font-label-md text-label-md">{toast}</span>
          </div>
        </div>
      )}

      {/* Persistent App Header */}
      <SchemaHeader
        datasetInfo={mockDatasetInfo}
        onNavigateHome={() => (onNavigateHome ? onNavigateHome() : navigate('/'))}
      />

      {/* Left Pipeline Sidebar */}
      <SchemaSidebar
        activeStage={activeStage}
        onStageSelect={handleStageSelect}
      />

      {/* Main Workspace Area (offset by sidebar width 72 / 18rem) */}
      <div className="pl-72">
        <main className="w-full min-h-[calc(100vh-4rem)] pt-16 bg-surface px-gutter-lg py-gutter-lg">
          <div className="flex flex-col gap-space-lg relative max-w-7xl mx-auto">
            {/* Header Banner */}
            <ScoringHeaderBanner
              onResetBaseline={handleResetBaseline}
              onPreviewImpact={handlePreviewImpact}
              onRunEngine={handleRunEngine}
              isComputing={isComputing}
            />

            {/* Top Bento KPI Matrix */}
            <ScoringKpiGrid
              modelName={modelName}
              totalSum={totalSum}
              curveType={curveType}
              topQuota={topQuota}
              totalCandidateTeams={mockDatasetInfo.total_teams}
              activeGatesCount={activeGatesCount}
              disqualifiedCount={disqualifiedCount}
              onOpenGatesModal={() => setShowBlocklistModal(true)}
            />

            {/* Main Two-Column Scoring Engine Workspace */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
              {/* Left Column: Multipliers & Interactive Sliders (7 cols) */}
              <div className="lg:col-span-7 flex flex-col gap-space-md">
                <CriteriaMultipliersCard
                  weights={weights}
                  onWeightChange={handleWeightChange}
                  activePreset={activePreset}
                  onSelectPreset={handleSelectPreset}
                  curveType={curveType}
                  onToggleCurve={handleToggleCurve}
                  autoBalance={autoBalance}
                  onToggleAutoBalance={() => setAutoBalance(!autoBalance)}
                  onNormalizeWeights={handleNormalizeWeights}
                />
              </div>

              {/* Right Column: Binary Hard Gates (5 cols) */}
              <div className="lg:col-span-5 flex flex-col gap-space-md">
                <BinaryHardGatesCard
                  gates={gates}
                  onToggleGate={handleToggleGate}
                  disqualifiedCount={disqualifiedCount}
                  totalCandidateTeams={mockDatasetInfo.total_teams}
                  onOpenBlocklist={() => setShowBlocklistModal(true)}
                />
              </div>
            </div>

            {/* Bottom Section: Live Shortlist Shift Preview (Bubble Teams) */}
            <ShortlistShiftPreviewTable
              teams={simulatedTeams}
              topQuota={topQuota}
              curveType={curveType}
              onSelectTeam={(team) => setSelectedTeam(team)}
            />

            {/* Persistent Action Callout Bar */}
            <ScoringBottomBar
              onProceed={handleRunEngine}
              onInspectConfig={() => setShowConfigModal(true)}
            />
          </div>
        </main>
      </div>

      {/* Modals */}
      <DisqualifiedBlocklistModal
        isOpen={showBlocklistModal}
        onClose={() => setShowBlocklistModal(false)}
        blocklist={blocklist}
        onOverrideTeam={handleOverrideTeam}
      />

      <TeamScoreDetailModal
        isOpen={!!selectedTeam}
        onClose={() => setSelectedTeam(null)}
        team={selectedTeam}
        weights={weights}
        curveType={curveType}
      />

      <ConfigSnapshotModal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        weights={weights}
        curveType={curveType}
        gates={gates}
        topQuota={topQuota}
      />

      <SimulationRunModal
        isOpen={showRunModal}
        onClose={() => setShowRunModal(false)}
        onProceedToRankedResults={handleProceedToRankedResults}
        modelName={modelName}
        topQuota={topQuota}
        disqualifiedCount={disqualifiedCount}
        curveType={curveType}
      />
    </div>
  );
}
