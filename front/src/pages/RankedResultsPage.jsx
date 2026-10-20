import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SchemaHeader from '../components/schema/SchemaHeader';
import SchemaSidebar from '../components/schema/SchemaSidebar';
import RankedHeaderBanner from '../components/ranked/RankedHeaderBanner';
import RankedBentoMetrics from '../components/ranked/RankedBentoMetrics';
import RankedFilterToolbar from '../components/ranked/RankedFilterToolbar';
import RankedTableContainer from '../components/ranked/RankedTableContainer';
import TeamInspectionDrawer from '../components/ranked/TeamInspectionDrawer';
import { getRun, getLeaderboard, downloadCsv } from '../api/client';
import { downloadEvaluationCsv } from '../utils/exportCsv';
import { useApp } from '../context/AppContext';

export default function RankedResultsPage() {
  const navigate = useNavigate();
  const { runId, navigateWithState } = useApp();

  const [runInfo, setRunInfo] = useState({
    run_id: runId || '1',
    total_teams: 0,
    shortlist_quota: 5,
    passed_hard_gates: 0,
    cutoff_floor: 75.0,
    weights: { experience_years: 35, github: 35, skills: 20, presentation: 10 },
  });

  const [teams, setTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'shortlisted' | 'waitlisted' | 'ineligible'
  const [sortBy, setSortBy] = useState('rank_asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
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

        // Build map from leaderboard view for candidate details
        const lbMap = new Map();
        if (lbRes.status === 'fulfilled' && Array.isArray(lbRes.value)) {
          lbRes.value.forEach((item) => {
            const key = String(item.team_code || item.team_id);
            lbMap.set(key, item);
          });
        }

        // Map teams from decision engine results
        if (Array.isArray(data.results)) {
          const quota = data.config?.top_x || 5;

          const mappedTeams = data.results.map((r, idx) => {
            const teamIdStr = String(r.team_id);
            const lbItem = lbMap.get(teamIdStr);

            const isEligible =
              r.eligibility_status === 'ELIGIBLE' ||
              r.status === 'ELIGIBLE' ||
              r.status === 'SHORTLISTED' ||
              (r.eligibility && r.eligibility.status === 'PASS');

            const rankNum = r.rank ?? idx + 1;
            const isShortlisted =
              r.status === 'SHORTLISTED' ||
              (isEligible && rankNum <= quota);

            // Per-criterion scores
            const bd = r.score_breakdown || {};
            const expVal = bd.experience_years ?? 3.0;
            const ghVal = bd.github_composite_score ?? bd.github_score ?? 80.0;
            const skillsVal = bd.skills ?? 8.0;
            const presVal = bd.presentation ?? 7.5;

            // Decision explanation in clear English
            let explanationText = r.explanation || r.decision_reason;
            if (!explanationText) {
              if (!isEligible) {
                explanationText = r.disqualification_reason || 'Team did not satisfy minimum eligibility gate requirements.';
              } else if (isShortlisted) {
                explanationText = `Ranked #${rankNum} with strong composite score (${Number(r.score ?? r.total_score ?? 0).toFixed(1)}/100). Passed all eligibility checks.`;
              } else {
                explanationText = `Passed all eligibility checks. Total score of ${Number(r.score ?? r.total_score ?? 0).toFixed(1)}/100 placed this team on the waitlist below top ${quota} quota.`;
              }
            }

            return {
              team_id: r.team_id || idx + 1,
              external_id: r.team_id || `T${idx + 1}`,
              team_name: r.name || r.team_name || lbItem?.team_name || `Team ${r.team_id}`,
              rank: rankNum,
              total_score: Number((r.score ?? r.total_score ?? 0).toFixed(2)),
              eligibility_status: isEligible ? 'ELIGIBLE' : 'DISQUALIFIED',
              status: isEligible ? (isShortlisted ? 'SHORTLISTED' : 'WAITLISTED') : 'INELIGIBLE',
              team_size: lbItem?.team_size ?? r.team_size ?? 3,
              disqualification_reason:
                r.disqualification_reason || (!isEligible ? 'Failed eligibility requirements.' : null),
              explanation: explanationText,
              score_details: [
                { key: 'experience_years', label: 'Years of Experience', raw_value: `${expVal} yrs`, weighted_score: (expVal * 3.5).toFixed(1) },
                { key: 'github_composite_score', label: 'GitHub Activity', raw_value: `${ghVal} / 100`, weighted_score: (ghVal * 0.35).toFixed(1) },
                { key: 'skills', label: 'Skills Match', raw_value: 'Matched', weighted_score: (skillsVal * 2.0).toFixed(1) },
                { key: 'presentation', label: 'Presentation & Pitch', raw_value: `${presVal} / 10`, weighted_score: (presVal * 1.0).toFixed(1) },
              ],
              members: lbItem?.members || r.members || [
                { name: 'Candidate 1', email: 'candidate1@example.com', experience_years: expVal, github_url: 'https://github.com' },
              ],
            };
          });

          // Sort initially by rank
          mappedTeams.sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999));

          setTeams(mappedTeams);
          if (mappedTeams.length > 0) {
            setSelectedTeamId(mappedTeams[0].team_id);
          }

          // Compute passed count and cutoff floor
          const passedCount = mappedTeams.filter((t) => t.eligibility_status === 'ELIGIBLE').length;
          const eligibleScores = mappedTeams
            .filter((t) => t.status === 'SHORTLISTED')
            .map((t) => t.total_score);
          const cutoff = eligibleScores.length > 0 ? Math.min(...eligibleScores) : 75.0;

          // Update runInfo
          setRunInfo({
            run_id: data.run_id,
            total_teams: mappedTeams.length,
            shortlist_quota: quota,
            passed_hard_gates: passedCount,
            cutoff_floor: cutoff,
            weights: data.config?.weights || { experience_years: 35, github: 35, skills: 20, presentation: 10 },
          });
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

  // Counts for tabs
  const counts = useMemo(() => {
    return {
      all: teams.length,
      shortlisted: teams.filter((t) => t.status === 'SHORTLISTED').length,
      waitlisted: teams.filter((t) => t.status === 'WAITLISTED').length,
      ineligible: teams.filter((t) => t.status === 'INELIGIBLE').length,
    };
  }, [teams]);

  // Filter & Search
  const filteredTeams = useMemo(() => {
    let result = [...teams];

    // Status filter
    if (activeFilter === 'shortlisted') {
      result = result.filter((t) => t.status === 'SHORTLISTED');
    } else if (activeFilter === 'waitlisted') {
      result = result.filter((t) => t.status === 'WAITLISTED');
    } else if (activeFilter === 'ineligible') {
      result = result.filter((t) => t.status === 'INELIGIBLE');
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.team_name.toLowerCase().includes(q) ||
          String(t.team_id).toLowerCase().includes(q) ||
          (t.explanation && t.explanation.toLowerCase().includes(q))
      );
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'score_desc') return (b.total_score || 0) - (a.total_score || 0);
      if (sortBy === 'score_asc') return (a.total_score || 0) - (b.total_score || 0);
      if (sortBy === 'name_asc') return a.team_name.localeCompare(b.team_name);
      return (a.rank ?? 999) - (b.rank ?? 999);
    });

    return result;
  }, [teams, activeFilter, searchQuery, sortBy]);

  // Currently selected team object
  const selectedTeam = useMemo(() => {
    if (!selectedTeamId && teams.length > 0) return teams[0];
    return teams.find((t) => String(t.team_id) === String(selectedTeamId)) || teams[0] || null;
  }, [teams, selectedTeamId]);

  // Handle Export CSV
  const handleExportCsv = async () => {
    try {
      if (runId) {
        const blob = await downloadCsv(runId);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `shortlisted_teams_run_${runId}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showNotification('✓ Official evaluation CSV downloaded successfully!');
      } else {
        downloadEvaluationCsv(teams, '1');
        showNotification('✓ CSV ledger downloaded successfully!');
      }
    } catch {
      downloadEvaluationCsv(teams, runId || '1');
      showNotification('✓ CSV ledger downloaded successfully!');
    }
  };

  return (
    <div className="bg-surface text-on-surface font-body-md text-body-md antialiased min-h-screen">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-brand-yellow text-brand-dark border-2 border-[#0f172a] rounded-xl px-4 py-2.5 shadow-[4px_4px_0px_#0f172a] font-mono text-xs font-bold animate-bounce flex items-center gap-2">
          <span className="material-symbols-outlined text-sm font-bold">check_circle</span>
          <span>{toast}</span>
        </div>
      )}

      {/* Top Header */}
      <SchemaHeader />

      {/* Sidebar */}
      <SchemaSidebar activeStage="ranked-results" />

      {/* Main Content Pane */}
      <main className="ml-72 pt-16 min-h-screen p-space-lg flex flex-col gap-space-lg pb-24 bg-dot-pattern">
        {/* Banner */}
        <RankedHeaderBanner
          runInfo={runInfo}
          onExportLedger={handleExportCsv}
        />

        {/* Loading Spinner */}
        {loading && (
          <div className="bg-white p-8 rounded-xl border-2 border-[#0f172a] shadow-[4px_4px_0px_#0f172a] text-center font-mono font-bold text-sm flex items-center justify-center gap-3">
            <span className="material-symbols-outlined animate-spin text-2xl text-brand-blue">
              progress_activity
            </span>
            <span>Calculating deterministic team rankings...</span>
          </div>
        )}

        {/* Error Notice */}
        {error && (
          <div className="bg-rose-50 border-2 border-rose-500 rounded-xl p-4 text-rose-900 font-mono text-xs font-bold flex items-center justify-between">
            <span>Error: {error}</span>
            <button
              type="button"
              onClick={() => navigateWithState('/scoring-engine')}
              className="px-3 py-1 bg-white rounded border border-rose-600 hover:bg-rose-100 cursor-pointer"
            >
              Re-run Scoring
            </button>
          </div>
        )}

        {/* Empty State when no evaluation run is loaded */}
        {!loading && teams.length === 0 && (
          <div className="bg-white rounded-2xl border-2 border-[#0f172a] shadow-[6px_6px_0px_#0f172a] p-12 text-center flex flex-col items-center justify-center gap-4 max-w-xl mx-auto my-12">
            <div className="w-16 h-16 rounded-2xl bg-brand-yellow border-2 border-[#0f172a] shadow-[3px_3px_0px_#0f172a] flex items-center justify-center text-3xl font-bold">
              📋
            </div>
            <h2 className="font-display font-black text-2xl text-brand-dark">
              No Evaluation Results Found
            </h2>
            <p className="font-sans text-sm text-slate-600 font-medium leading-relaxed">
              To generate your candidate shortlist and ranked leaderboard, please upload a registration CSV spreadsheet and configure your scoring criteria.
            </p>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="mt-2 px-6 py-3 bg-brand-yellow hover:bg-yellow-300 text-brand-dark font-display font-bold text-sm rounded-xl border-2 border-[#0f172a] shadow-[3px_3px_0px_#0f172a] transition-all cursor-pointer"
            >
              Upload Registrations CSV
            </button>
          </div>
        )}

        {/* Main Leaderboard UI when teams are present */}
        {teams.length > 0 && (
          <>
            {/* Bento KPI Summary */}
            <RankedBentoMetrics runInfo={runInfo} />

            {/* Filter Toolbar */}
            <RankedFilterToolbar
              activeFilter={activeFilter}
              onSelectFilter={setActiveFilter}
              sortBy={sortBy}
              onSortChange={setSortBy}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              counts={counts}
            />

            {/* 2-Column Split: Table on Left, Details Drawer on Right */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
              {/* Left Column: Ranked Table */}
              <div className="lg:col-span-7 xl:col-span-8">
                <RankedTableContainer
                  teams={filteredTeams}
                  selectedTeamId={selectedTeamId}
                  onSelectTeam={(team) => setSelectedTeamId(team.team_id)}
                  topQuota={runInfo.shortlist_quota}
                  cutoffScore={runInfo.cutoff_floor}
                />
              </div>

              {/* Right Column: Team Inspection Drawer */}
              <div className="lg:col-span-5 xl:col-span-4">
                <TeamInspectionDrawer team={selectedTeam} />
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
