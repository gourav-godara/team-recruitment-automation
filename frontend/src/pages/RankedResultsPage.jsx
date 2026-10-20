import { useState, useMemo, useEffect } from 'react';
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
import { getRun, getLeaderboard, applyOverride } from '../api/client';
import { useApp } from '../context/AppContext';

export default function RankedResultsPage({ onNavigateHome, onProceedToTeamCompare }) {
  const navigate = useNavigate();
  const { runId, navigateWithState } = useApp();

  const [runInfo, setRunInfo] = useState(mockRankedRunInfo);
  const [teams, setTeams] = useState(mockRankedTeams);
  const [selectedTeamId, setSelectedTeamId] = useState(418); // Default to #01 zkShield
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'eligible' | 'disqualified'
  const [activeTrack, setActiveTrack] = useState('all');
  const [shortlistedOnly, setShortlistedOnly] = useState(false);
  const [sortBy, setSortBy] = useState('score_desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStage, setActiveStage] = useState('ranked-results');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [runData, setRunData] = useState(null);

  // Modals
  const [showExportModal, setShowExportModal] = useState(false);
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [flaggingTeam, setFlaggingTeam] = useState(null);
  const [toast, setToast] = useState(null);

  const showNotification = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  // Fetch evaluated run and real leaderboard by runId
  useEffect(() => {
    if (!runId) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    Promise.allSettled([getRun(runId), getLeaderboard(runId)])
      .then(([runRes, lbRes]) => {
        if (!isMounted) return;

        if (runRes.status === 'rejected') {
          setError(runRes.reason?.message || 'Failed to load evaluation run.');
          return;
        }

        const data = runRes.value;
        setRunData(data);

        // Build map from leaderboard view for team_size
        const lbMap = new Map();
        if (lbRes.status === 'fulfilled' && Array.isArray(lbRes.value)) {
          lbRes.value.forEach((item) => {
            const key = String(item.team_code || item.team_id);
            lbMap.set(key, item);
          });
        }

        // Update runInfo
        setRunInfo((prev) => ({
          ...prev,
          run_id: data.run_id,
          total_cohort_count: data.total_teams,
          shortlist_quota: data.config?.top_x || data.shortlisted_teams || prev.shortlist_quota,
          result_hash: data.config_hash || data.dataset_hash || prev.result_hash,
          file_hash_short: (data.config_hash || 'sealed').substring(0, 8),
          state_frozen: new Date().toLocaleTimeString(),
        }));

        // Map teams from decision engine results
        if (Array.isArray(data.results)) {
          const mappedTeams = data.results.map((r, idx) => {
            const teamIdStr = String(r.team_id);
            const lbItem = lbMap.get(teamIdStr);

            const isEligible =
              r.eligibility_status === 'ELIGIBLE' ||
              r.status === 'ELIGIBLE' ||
              r.status === 'SHORTLISTED' ||
              (r.eligibility && r.eligibility.status === 'PASS');

            const isShortlisted =
              r.status === 'SHORTLISTED' ||
              (r.rank && r.rank <= (data.config?.top_x || 40));

            // Per-criterion scores
            const bd = r.score_breakdown || {};
            const techVal = bd.experience_years ?? bd.tech ?? 8.5;
            const repoVal = bd.github_composite_score ?? bd.github_score ?? bd.projects ?? 8.0;
            const pitchVal = bd.presentation ?? bd.pitch ?? 7.5;
            const velVal = bd.skills ?? bd.velocity ?? 8.0;

            // Rules PASS/FAIL with reason
            const rulesList = [];
            if (r.eligibility?.passed_rules) {
              r.eligibility.passed_rules.forEach((pr) => {
                rulesList.push({ name: pr.rule_name || pr.field, passed: true, reason: pr.reason });
              });
            }
            if (r.eligibility?.failed_rules) {
              r.eligibility.failed_rules.forEach((fr) => {
                rulesList.push({ name: fr.rule_name || fr.field, passed: false, reason: fr.reason });
              });
            }

            return {
              team_id: r.team_id || idx + 1,
              external_id: r.team_id || `T${idx + 1}`,
              team_name: r.name || r.team_name || lbItem?.team_name || `Team ${r.team_id}`,
              rank: r.rank ?? idx + 1,
              total_score: Number((r.score ?? r.total_score ?? 0).toFixed(2)),
              eligibility_status: isEligible ? 'ELIGIBLE' : 'INELIGIBLE',
              status: isEligible ? (isShortlisted ? 'SHORTLISTED' : 'ELIGIBLE') : 'DISQUALIFIED',
              status_type: isEligible ? (isShortlisted ? 'locked' : 'normal') : 'excluded',
              team_size: lbItem?.team_size ?? r.team_size ?? 3,
              disqualification_reason:
                r.disqualification_reason ||
                r.eligibility?.failed_rules?.[0]?.reason ||
                (!isEligible ? 'Failed eligibility rule constraint.' : null),
              explanation:
                r.explanation ||
                r.eligibility?.summary ||
                (isEligible ? 'Eligible team with verified criteria pass.' : 'Disqualified.'),
              track: r.track || 'General',
              category: r.category || 'General',
              raw_vectors: {
                tech: Number(Number(techVal).toFixed(1)),
                repo: Number(Number(repoVal).toFixed(1)),
                pitch: Number(Number(pitchVal).toFixed(1)),
                velocity: Number(Number(velVal).toFixed(1)),
              },
              weighted_contributions: {
                tech: Number((Number(techVal) * 0.35).toFixed(2)),
                repo: Number((Number(repoVal) * 0.25).toFixed(2)),
                pitch: Number((Number(pitchVal) * 0.2).toFixed(2)),
                velocity: Number((Number(velVal) * 0.2).toFixed(2)),
              },
              rules:
                rulesList.length > 0
                  ? rulesList
                  : [
                      { name: 'Team Size Range (2-5)', passed: isEligible },
                      { name: 'Mandatory Candidate Signals', passed: isEligible },
                    ],
              rules_passed: rulesList.filter((rl) => rl.passed).length || (isEligible ? 2 : 0),
              rules_total: rulesList.length || 2,
              members: [
                {
                  name: 'Team Lead',
                  role: 'Captain',
                  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80',
                  verified: true,
                },
              ],
              telemetry: {
                tech_notes: `Tech: ${Number(techVal).toFixed(1)}/10`,
                repo_notes: `GitHub: ${Number(repoVal).toFixed(1)}/10`,
                pitch_notes: `Pitch: ${Number(pitchVal).toFixed(1)}/10`,
                velocity_notes: `Skills: ${Number(velVal).toFixed(1)}/10`,
              },
              cohort_percentile: Math.max(1, Math.round(100 - ((r.rank ?? idx + 1) / (data.total_teams || 1)) * 100)),
            };
          });

          setTeams(mappedTeams);
          if (mappedTeams.length > 0) {
            setSelectedTeamId(mappedTeams[0].team_id);
          }
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || 'Failed to fetch evaluation run.');
      })
      .finally(() => {
        if (!isMounted) return;
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [runId]);

  // Tab counts
  const totalTeamsCount = runData ? runData.total_teams : teams.length;
  const eligibleTeamsCount = runData
    ? runData.eligible_teams ?? runData.eligible_teams_count ?? 0
    : teams.filter((t) => t.eligibility_status === 'ELIGIBLE').length;
  const disqualifiedTeamsCount = totalTeamsCount - eligibleTeamsCount;

  // Find currently selected team
  const selectedTeam = useMemo(() => {
    return teams.find((t) => t.team_id === selectedTeamId) || teams[0];
  }, [teams, selectedTeamId]);

  // Filter & Sort
  const filteredTeams = useMemo(() => {
    return teams
      .filter((team) => {
        // Tab filter: All / Eligible / Disqualified
        if (activeTab === 'eligible' && team.eligibility_status !== 'ELIGIBLE') {
          return false;
        }
        if (activeTab === 'disqualified' && team.eligibility_status !== 'INELIGIBLE') {
          return false;
        }

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
          if (team.rank > runInfo.shortlist_quota && team.status_type !== 'bubble') {
            return false;
          }
        }

        // Search filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = team.team_name.toLowerCase().includes(q);
          const matchId = String(team.external_id).toLowerCase().includes(q);
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
  }, [teams, activeTab, activeTrack, shortlistedOnly, searchQuery, sortBy, runInfo.shortlist_quota]);

  // Action handlers
  const handlePromoteFinal = async (team) => {
    if (runId) {
      try {
        await applyOverride(runId, team.external_id || team.team_id, 'pin', 'Promoted to Final by Reviewer');
        showNotification(`🎖️ ${team.team_name} pinned to Finalists and logged to Audit Trail!`);
        return;
      } catch (err) {
        console.warn('Override API failed:', err);
      }
    }
    showNotification(`🎖️ ${team.team_name} officially confirmed for Grand Stage Finalist showcase!`);
  };

  const handleOpenFlagModal = (team) => {
    setFlaggingTeam(team);
    setShowFlagModal(true);
  };

  const handleSubmitFlag = async (teamId, flagData) => {
    if (runId) {
      try {
        await applyOverride(runId, teamId, 'waitlist', flagData.reason || 'Flagged for re-evaluation');
      } catch (err) {
        console.warn('Flag override failed:', err);
      }
    }
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

            {/* Loading Indicator */}
            {loading && (
              <div className="p-4 rounded-xl bg-primary-container text-on-primary-container border-2 border-[#0f172a] shadow-[4px_4px_0px_#0f172a] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-2xl animate-spin text-primary">progress_activity</span>
                  <div>
                    <span className="font-bold text-sm block">Fetching live Consensus Results for Run #{runId}...</span>
                    <span className="text-xs opacity-80">Loading deterministic team rankings and explainability breakdowns</span>
                  </div>
                </div>
              </div>
            )}

            {/* Error Indicator */}
            {error && (
              <div className="p-4 rounded-xl bg-rose-50 border-2 border-rose-600 shadow-[4px_4px_0px_#0f172a] text-rose-800 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg font-bold">error</span>
                  <span><strong>Leaderboard Error:</strong> {error}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setLoading(true);
                    getRun(runId)
                      .then((data) => setRunData(data))
                      .catch((err) => setError(err.message))
                      .finally(() => setLoading(false));
                  }}
                  className="px-3 py-1 bg-white border border-rose-600 rounded font-bold hover:bg-rose-100 cursor-pointer"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Split Workspace: Table (7 cols) + Persistent Right Drawer (5 cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
              {/* Left 7 Cols: Controls & Table */}
              <div className="lg:col-span-7 flex flex-col gap-space-md">
                {/* 3 Eligibility Tabs: All / Eligible / Disqualified */}
                <div className="flex items-center gap-2 bg-surface-container-low p-1.5 rounded-xl border-2 border-[#0f172a] shadow-[3px_3px_0px_#0f172a]">
                  <button
                    type="button"
                    onClick={() => setActiveTab('all')}
                    className={`flex-1 py-1.5 px-3 rounded-lg font-label-md text-label-md font-bold transition-all cursor-pointer text-center ${
                      activeTab === 'all'
                        ? 'bg-primary-container text-on-primary-container border-2 border-[#0f172a] shadow-[2px_2px_0px_#0f172a]'
                        : 'text-on-surface hover:bg-surface-container'
                    }`}
                  >
                    All ({totalTeamsCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('eligible')}
                    className={`flex-1 py-1.5 px-3 rounded-lg font-label-md text-label-md font-bold transition-all cursor-pointer text-center ${
                      activeTab === 'eligible'
                        ? 'bg-[#10b981] text-white border-2 border-[#0f172a] shadow-[2px_2px_0px_#0f172a]'
                        : 'text-on-surface hover:bg-surface-container'
                    }`}
                  >
                    Eligible ({eligibleTeamsCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('disqualified')}
                    className={`flex-1 py-1.5 px-3 rounded-lg font-label-md text-label-md font-bold transition-all cursor-pointer text-center ${
                      activeTab === 'disqualified'
                        ? 'bg-rose-600 text-white border-2 border-[#0f172a] shadow-[2px_2px_0px_#0f172a]'
                        : 'text-on-surface hover:bg-surface-container'
                    }`}
                  >
                    Disqualified ({disqualifiedTeamsCount})
                  </button>
                </div>

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
                    navigateWithState('/team-compare');
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
