import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import SchemaHeader from '../components/schema/SchemaHeader';
import SchemaSidebar from '../components/schema/SchemaSidebar';
import RankedHeaderBanner from '../components/ranked/RankedHeaderBanner';
import RankedBentoMetrics from '../components/ranked/RankedBentoMetrics';
import RankedFilterToolbar from '../components/ranked/RankedFilterToolbar';
import RankedTableContainer from '../components/ranked/RankedTableContainer';
import TeamInspectionDrawer from '../components/ranked/TeamInspectionDrawer';
import ExportLedgerModal from '../components/ranked/ExportLedgerModal';
import FlagReevalModal from '../components/ranked/FlagReevalModal';
import { mockDatasetInfo } from '../data/mockSchema';
import { mockRankedRunInfo, mockRankedTeams } from '../data/mockRankedResults';

export default function RankedResultsPage({ onNavigateHome, onProceedToTeamCompare }) {
  const navigate = useNavigate();

  const [runInfo] = useState(mockRankedRunInfo);
  const [teams, setTeams] = useState(mockRankedTeams);
  const [selectedTeamId, setSelectedTeamId] = useState(418); // Default to #01 zkShield
  const [activeTrack, setActiveTrack] = useState('all');
  const [shortlistedOnly, setShortlistedOnly] = useState(true);
  const [sortBy, setSortBy] = useState('score_desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStage, setActiveStage] = useState('ranked-results');
  const [page, setPage] = useState(1);

  // Modals
  const [showExportModal, setShowExportModal] = useState(false);
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [flaggingTeam, setFlaggingTeam] = useState(null);
  const [toast, setToast] = useState(null);

  const showNotification = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  // Find currently selected team
  const selectedTeam = useMemo(() => {
    return teams.find((t) => t.team_id === selectedTeamId) || teams[0];
  }, [teams, selectedTeamId]);

  // Filter & Sort
  const filteredTeams = useMemo(() => {
    return teams
      .filter((team) => {
        // Track filter
        if (activeTrack !== 'all') {
          const trackLower = (team.category || team.track).toLowerCase();
          if (activeTrack === 'defi' && !trackLower.includes('defi') && !trackLower.includes('payments')) return false;
          if (activeTrack === 'ai' && !trackLower.includes('ai') && !trackLower.includes('agent')) return false;
          if (activeTrack === 'infra' && !trackLower.includes('infra') && !trackLower.includes('database')) return false;
          if (activeTrack === 'security' && !trackLower.includes('security')) return false;
        }

        // Shortlisted filter
        if (shortlistedOnly) {
          // Include top 40 plus boundary teams (#40, #41, #42)
          if (team.rank > runInfo.shortlist_quota + 2 && team.status_type !== 'bubble') {
            return false;
          }
        }

        // Search filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = team.team_name.toLowerCase().includes(q);
          const matchId = team.external_id.toLowerCase().includes(q);
          const matchTrack = team.track.toLowerCase().includes(q);
          if (!matchName && !matchId && !matchTrack) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'score_desc') return b.total_score - a.total_score;
        if (sortBy === 'tech_desc') return b.raw_vectors.tech - a.raw_vectors.tech;
        if (sortBy === 'velocity_desc') return b.raw_vectors.velocity - a.raw_vectors.velocity;
        if (sortBy === 'risk_asc') return a.jitter_risk_pct - b.jitter_risk_pct;
        return 0;
      });
  }, [teams, activeTrack, shortlistedOnly, searchQuery, sortBy, runInfo.shortlist_quota]);

  // Action handlers
  const handlePromoteFinal = (team) => {
    showNotification(`🎖️ ${team.team_name} officially confirmed for Grand Stage Finalist showcase!`);
  };

  const handleOpenFlagModal = (team) => {
    setFlaggingTeam(team);
    setShowFlagModal(true);
  };

  const handleSubmitFlag = (teamId, flagData) => {
    setTeams((prev) =>
      prev.map((t) =>
        t.team_id === teamId
          ? {
              ...t,
              status: 'FLAGGED REVIEW',
              status_type: 'bubble',
              telemetry: {
                ...t.telemetry,
                tech_notes: `Jury Flagged (${flagData.flagType}): ${flagData.reason}`,
              },
            }
          : t
      )
    );
    showNotification(`⚠️ Re-eval flag logged for team ${teamId}. Recorded to audit_log.`);
  };

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
    } else if (stageId === 'team-compare') {
      showNotification('Stage 05: Team Compare preview initialized.');
      if (onProceedToTeamCompare) {
        setTimeout(onProceedToTeamCompare, 400);
      } else {
        setTimeout(() => navigate('/team-compare'), 400);
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

      {/* Main Content Area (Offset by sidebar width 72) */}
      <div className="pl-72">
        <main className="w-full min-h-[calc(100vh-4rem)] pt-16 bg-surface px-gutter-lg py-gutter-lg">
          <div className="flex flex-col w-full gap-space-lg max-w-7xl mx-auto">
            {/* Top Breadcrumb & Audit Seal */}
            <RankedHeaderBanner
              runInfo={runInfo}
              onExportLedger={() => setShowExportModal(true)}
            />

            {/* Bento Metrics Trio */}
            <RankedBentoMetrics runInfo={runInfo} />

            {/* Split Workspace: Table (7 cols) + Persistent Right Drawer (5 cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
              {/* Left 7 Cols: Controls & Table */}
              <div className="lg:col-span-7 flex flex-col gap-space-md">
                {/* Filter Toolbar */}
                <RankedFilterToolbar
                  activeTrack={activeTrack}
                  onSelectTrack={setActiveTrack}
                  shortlistedOnly={shortlistedOnly}
                  onToggleShortlistedOnly={setShortlistedOnly}
                  sortBy={sortBy}
                  onSortChange={setSortBy}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                />

                {/* Ranked Table Container */}
                <RankedTableContainer
                  teams={filteredTeams}
                  selectedTeamId={selectedTeamId}
                  onSelectTeam={(team) => setSelectedTeamId(team.team_id)}
                  topQuota={runInfo.shortlist_quota}
                  cutoffScore={runInfo.cutoff_floor}
                  page={page}
                  totalPages={12}
                  onPageChange={setPage}
                />
              </div>

              {/* Right 5 Cols: Persistent Inspection Drawer */}
              <div className="lg:col-span-5">
                <TeamInspectionDrawer
                  team={selectedTeam}
                  onPromoteFinal={handlePromoteFinal}
                  onFlagReeval={handleOpenFlagModal}
                  onCompareTeam={() => {
                    showNotification(`Comparing ${selectedTeam.team_name} with cutoff horizon...`);
                    navigate('/team-compare');
                  }}
                />
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Modals */}
      <ExportLedgerModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        runInfo={runInfo}
        teams={teams}
      />

      <FlagReevalModal
        isOpen={showFlagModal}
        onClose={() => setShowFlagModal(false)}
        team={flaggingTeam}
        onSubmitFlag={handleSubmitFlag}
      />
    </div>
  );
}
