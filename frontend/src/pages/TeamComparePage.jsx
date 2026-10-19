import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SchemaHeader from '../components/schema/SchemaHeader';
import SchemaSidebar from '../components/schema/SchemaSidebar';
import CompareHeaderBanner from '../components/compare/CompareHeaderBanner';
import CompareOverviewBento from '../components/compare/CompareOverviewBento';
import ContenderCard from '../components/compare/ContenderCard';
import JuryRubricDeliberationMatrix from '../components/compare/JuryRubricDeliberationMatrix';
import ConsensusDecisionDock from '../components/compare/ConsensusDecisionDock';
import CandidateSwapModal from '../components/compare/CandidateSwapModal';
import ExportDossierModal from '../components/compare/ExportDossierModal';
import { mockDatasetInfo } from '../data/mockSchema';
import { mockDefaultPair, mockEvaluatorsList } from '../data/mockCompare';
import { useApp } from '../context/AppContext';

export default function TeamComparePage({ onNavigateHome, onProceedToStage06 }) {
  const navigate = useNavigate();
  const { campaignId, datasetId, runId, navigateWithState } = useApp();

  const [teamA, setTeamA] = useState(mockDefaultPair.teamA);
  const [teamB, setTeamB] = useState(mockDefaultPair.teamB);
  const [evaluators] = useState(mockEvaluatorsList);
  const [chosenCandidate, setChosenCandidate] = useState('nova'); // 'nova' | 'synapse' | 'both'
  const [activeStage, setActiveStage] = useState('team-compare');

  // Modals
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [swapTargetSlot, setSwapTargetSlot] = useState('B');
  const [showDossierModal, setShowDossierModal] = useState(false);
  const [toast, setToast] = useState(null);

  const showNotification = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  // Selection toggle handler
  const toggleCandidateSelection = (chosen) => {
    setChosenCandidate(chosen);

    if (chosen === 'nova') {
      setTeamA((prev) => ({
        ...prev,
        status_label: 'FINALIST #40 LOCKED',
        status_type: 'locked',
      }));
      setTeamB((prev) => ({
        ...prev,
        status_label: 'RESERVE ALTERNATE #41',
        status_type: 'challenger_out',
      }));
      showNotification('✓ NovaPulse (#40) confirmed for Tier-1 finalist berth.');
    } else if (chosen === 'synapse') {
      setTeamB((prev) => ({
        ...prev,
        status_label: 'PROMOTED TO FINALIST #40',
        status_type: 'promoted',
      }));
      setTeamA((prev) => ({
        ...prev,
        status_label: 'RESERVE ALTERNATE #41',
        status_type: 'challenger_out',
      }));
      showNotification('⚖️ SynapseDB promoted to Slot #40 (+0.10 override granted).');
    } else if (chosen === 'both') {
      setTeamA((prev) => ({
        ...prev,
        status_label: 'FINALIST #40 LOCKED',
        status_type: 'locked',
      }));
      setTeamB((prev) => ({
        ...prev,
        status_label: 'FINALIST #41 EXPANDED',
        status_type: 'locked',
      }));
      showNotification('🎉 Quota expanded to 41 finalists! Both teams qualify.');
    }
  };

  // Decision summary text
  const decisionSummaryText =
    chosenCandidate === 'nova'
      ? 'NovaPulse (#40) confirmed for Tier-1 finalist berth. Technical architecture weight holds precedent.'
      : chosenCandidate === 'synapse'
      ? 'SynapseDB promoted to Slot #40 (+0.10 override). Peer codebase velocity & zero AST overlap prioritized.'
      : 'Quota expanded to 41 finalist teams approved by Jury Lead Alex Rivers.';

  // Handle candidate swap
  const handleSwapCandidate = (cand, slot) => {
    if (slot === 'A') {
      setTeamA((prev) => ({
        ...prev,
        id: cand.id,
        name: cand.name,
        rank: cand.rank,
        final_score: cand.score,
        track: cand.track,
      }));
      showNotification(`Contender Slot A updated to ${cand.name} (#${cand.rank})`);
    } else {
      setTeamB((prev) => ({
        ...prev,
        id: cand.id,
        name: cand.name,
        rank: cand.rank,
        final_score: cand.score,
        track: cand.track,
      }));
      showNotification(`Contender Slot B updated to ${cand.name} (#${cand.rank})`);
    }
  };

  // Confirm consensus
  const handleConfirmConsensus = () => {
    showNotification('🔒 State Sealed: Pairwise tie-breaker consensus stamped to SHA-256 ledger!');
  };

  // Proceed to Stage 06: Stability Stress
  const handleProceedStage06 = () => {
    showNotification('Proceeding to Stage 06: Stability Stress Testing & Cutoff Sensitivity...');
    setTimeout(() => {
      if (onProceedToStage06) {
        onProceedToStage06();
      } else {
        navigateWithState('/stability-stress');
      }
    }, 600);
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
      navigateWithState('/export-audit');
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
            <span className="material-symbols-outlined text-secondary-fixed text-xl font-bold">
              compare_arrows
            </span>
            <span className="font-label-md text-label-md font-bold">{toast}</span>
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
          <div className="flex flex-col w-full max-w-7xl mx-auto">
            {/* Top Breadcrumb & Action Utilities */}
            <CompareHeaderBanner
              onSwapCandidates={() => setShowSwapModal(true)}
              onExportDossier={() => setShowDossierModal(true)}
              onConfirmConsensus={handleConfirmConsensus}
            />

            {/* Metric Overview Bento Cards */}
            <CompareOverviewBento
              teamAName={teamA.name}
              teamBName={teamB.name}
              boundaryDelta="0.10"
              quorumRatio="3 / 4"
              quorumPct={75}
            />

            {/* MAIN ARENA: Side-by-Side Contenders */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-lg mb-space-lg">
              {/* Left Contender: NovaPulse (#40) */}
              <ContenderCard
                team={teamA}
                isSelected={chosenCandidate === 'nova' || chosenCandidate === 'both'}
                onVote={() => toggleCandidateSelection('nova')}
                cardId="team-card-nova"
              />

              {/* Right Contender: SynapseDB (#41) */}
              <ContenderCard
                team={teamB}
                isSelected={chosenCandidate === 'synapse' || chosenCandidate === 'both'}
                onVote={() => toggleCandidateSelection('synapse')}
                cardId="team-card-synapse"
              />
            </div>

            {/* Deliberation & Jury Matrix */}
            <JuryRubricDeliberationMatrix
              evaluators={evaluators}
              teamAName={teamA.name}
              teamBName={teamB.name}
              verdictWinner={chosenCandidate === 'synapse' ? 'SDB' : 'NP'}
            />

            {/* Consensus Decision Action Dock (Bottom callout) */}
            <ConsensusDecisionDock
              onKeepNova={() => toggleCandidateSelection('nova')}
              onPromoteSynapse={() => toggleCandidateSelection('synapse')}
              onExpandQuota={() => toggleCandidateSelection('both')}
              onProceedToStage06={handleProceedStage06}
              decisionSummaryText={decisionSummaryText}
            />
          </div>
        </main>
      </div>

      {/* Modals */}
      <CandidateSwapModal
        isOpen={showSwapModal}
        onClose={() => setShowSwapModal(false)}
        onSelectCandidate={handleSwapCandidate}
        targetSlot={swapTargetSlot}
      />

      <ExportDossierModal
        isOpen={showDossierModal}
        onClose={() => setShowDossierModal(false)}
        teamA={teamA}
        teamB={teamB}
        evaluators={evaluators}
      />
    </div>
  );
}
