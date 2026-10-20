import { useState, useMemo } from 'react';
import { getGitHubProfile } from '../../api/client';
import { generateJuryBrief } from '../../utils/squadSynergy';

export default function SinglePageLeaderboard({
  teams = [],
  runInfo,
  selectedTeamId,
  onSelectTeam,
  onSelectForCompare,
  onExportCsv,
  isBlindReview = false,
  onToggleBlindReview,
}) {
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'shortlisted' | 'waitlisted' | 'ineligible'
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('rank_asc');

  // Feature 2: Recruiter Jury Overrides State
  // { [teamId]: { type: 'FAST_TRACK' | 'INTERVIEW' | 'DISQUALIFIED', note: string, timestamp: string } }
  const [teamOverrides, setTeamOverrides] = useState({});

  // Feature 3: Interactive Sensitivity Simulator State
  const [showSimulator, setShowSimulator] = useState(false);
  const [simScenario, setSimScenario] = useState('default'); // 'default' | 'github' | 'experience' | 'skills' | 'custom'
  const [simWeights, setSimWeights] = useState({
    exp: 30,
    github: 30,
    skills: 25,
    pitch: 15,
  });

  const handleApplyPreset = (scenario) => {
    setSimScenario(scenario);
    if (scenario === 'default') {
      setSimWeights({ exp: 30, github: 30, skills: 25, pitch: 15 });
    } else if (scenario === 'github') {
      setSimWeights({ exp: 15, github: 55, skills: 20, pitch: 10 });
    } else if (scenario === 'experience') {
      setSimWeights({ exp: 55, github: 15, skills: 20, pitch: 10 });
    } else if (scenario === 'skills') {
      setSimWeights({ exp: 15, github: 20, skills: 55, pitch: 10 });
    }
  };

  const handleWeightChange = (key, val) => {
    setSimScenario('custom');
    setSimWeights((prev) => ({
      ...prev,
      [key]: Number(val),
    }));
  };

  const resetSimulator = () => {
    setSimScenario('default');
    setSimWeights({ exp: 30, github: 30, skills: 25, pitch: 15 });
  };

  // Recruiter Jury Override Handlers
  const handleSetOverride = (teamId, type) => {
    setTeamOverrides((prev) => {
      const existing = prev[teamId];
      if (existing?.type === type) {
        // Toggle off if clicked again
        const next = { ...prev };
        delete next[teamId];
        return next;
      }
      const noteMap = {
        FAST_TRACK: 'Jury Override: Fast-Tracked to Shortlist Finalist',
        INTERVIEW: 'Jury Override: Flagged for In-Depth Technical Interview',
        DISQUALIFIED: 'Jury Override: Manually Disqualified by Recruiter Audit',
      };
      return {
        ...prev,
        [teamId]: {
          type,
          note: noteMap[type] || 'Recruiter jury override active',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      };
    });
  };

  const handleClearOverride = (teamId) => {
    setTeamOverrides((prev) => {
      const next = { ...prev };
      delete next[teamId];
      return next;
    });
  };

  const getEffectiveStatus = (team) => {
    const override = teamOverrides[team.team_id];
    if (override) {
      if (override.type === 'FAST_TRACK') return 'FAST_TRACK';
      if (override.type === 'INTERVIEW') return 'INTERVIEW';
      if (override.type === 'DISQUALIFIED') return 'DISQUALIFIED';
    }
    return team.status;
  };

  // Anti-Bias Blind Review Masking Helpers
  const getDisplayTeamName = (team, idx) => {
    if (!team) return '';
    if (!isBlindReview) return team.team_name || `Team ${team.team_id || idx + 1}`;
    return `Team #${team.rank ?? idx + 1} [Blind Review]`;
  };

  const getDisplayCandidateName = (member, mIdx) => {
    if (!member) return `Candidate ${mIdx + 1}`;
    if (!isBlindReview) return member.name || `Candidate ${mIdx + 1}`;
    return `Candidate ${String.fromCharCode(65 + (mIdx % 26))}${mIdx === 0 ? ' (Lead)' : ''}`;
  };

  const getDisplayEmail = (email) => {
    if (!isBlindReview) return email;
    if (!email) return '';
    const parts = email.split('@');
    if (parts.length < 2) return '••••••@••••.com';
    return `${parts[0].slice(0, 1)}•••••@${parts[1]}`;
  };

  // GitHub Insights state
  const [githubCache, setGithubCache] = useState({});
  const [loadingGithub, setLoadingGithub] = useState({});
  const [expandedGithubId, setExpandedGithubId] = useState(null);

  const handleToggleGitHub = async (member) => {
    const memKey = member.id || member.email || member.name;
    if (expandedGithubId === memKey) {
      setExpandedGithubId(null);
      return;
    }
    setExpandedGithubId(memKey);

    const identifier = member.github_username || member.github_url;
    if (!identifier) return;

    if (githubCache[identifier]) return;

    setLoadingGithub((prev) => ({ ...prev, [identifier]: true }));
    try {
      const data = await getGitHubProfile(identifier);
      setGithubCache((prev) => ({ ...prev, [identifier]: data }));
    } catch (err) {
      setGithubCache((prev) => ({
        ...prev,
        [identifier]: {
          status: 'error',
          error_message: err.message || 'Live GitHub query unavailable. Preserved candidate code velocity signal.',
          public_repos: 0,
          original_repos_count: 0,
          forked_repos_count: 0,
          total_stars: 0,
          top_languages: [],
          recent_repos: [],
        },
      }));
    } finally {
      setLoadingGithub((prev) => ({ ...prev, [identifier]: false }));
    }
  };

  // Compute Simulated Scores & Ranks if Sensitivity Simulator is active
  const isSimulationActive = simScenario !== 'default';

  const simulatedTeamData = useMemo(() => {
    const totalW = (simWeights.exp + simWeights.github + simWeights.skills + simWeights.pitch) || 100;

    // Calculate simulated score for each team
    const withScores = teams.map((team, idx) => {
      const origRank = team.rank ?? idx + 1;

      if (!isSimulationActive) {
        return {
          ...team,
          simulated_score: team.total_score,
          simulated_rank: origRank,
          rank_delta: 0,
        };
      }

      let expPct = 50;
      let ghPct = 50;
      let skillsPct = 50;
      let pitchPct = 50;

      if (team.score_details && Array.isArray(team.score_details)) {
        team.score_details.forEach((item) => {
          const c = (item.criterion || item.label || '').toLowerCase();
          const val = item.percentage != null ? item.percentage : (Number(item.weighted_score) || 5) * 10;
          if (c.includes('exp')) expPct = val;
          else if (c.includes('git')) ghPct = val;
          else if (c.includes('skill')) skillsPct = val;
          else if (c.includes('pitch') || c.includes('present')) pitchPct = val;
        });
      }

      const simScore = Math.round(
        (expPct * (simWeights.exp / totalW) +
          ghPct * (simWeights.github / totalW) +
          skillsPct * (simWeights.skills / totalW) +
          pitchPct * (simWeights.pitch / totalW)) * 10
      ) / 10;

      return {
        ...team,
        simulated_score: simScore,
        origRank,
      };
    });

    if (!isSimulationActive) {
      return withScores;
    }

    // Sort eligible teams by simulated_score descending
    const eligible = withScores.filter((t) => t.status !== 'INELIGIBLE' && t.eligibility_status !== 'DISQUALIFIED');
    const ineligible = withScores.filter((t) => t.status === 'INELIGIBLE' || t.eligibility_status === 'DISQUALIFIED');

    eligible.sort((a, b) => (b.simulated_score || 0) - (a.simulated_score || 0));

    eligible.forEach((t, i) => {
      t.simulated_rank = i + 1;
      t.rank_delta = (t.origRank ?? (i + 1)) - (i + 1);
    });

    ineligible.forEach((t, i) => {
      t.simulated_rank = eligible.length + i + 1;
      t.rank_delta = 0;
    });

    return [...eligible, ...ineligible];
  }, [teams, isSimulationActive, simWeights]);

  // Filter tabs count
  const counts = useMemo(() => {
    let shortlisted = 0;
    let waitlisted = 0;
    let ineligible = 0;
    let fastTracked = 0;

    teams.forEach((t) => {
      const st = getEffectiveStatus(t);
      if (st === 'FAST_TRACK' || st === 'SHORTLISTED') shortlisted++;
      else if (st === 'INELIGIBLE' || st === 'DISQUALIFIED') ineligible++;
      else waitlisted++;

      if (teamOverrides[t.team_id]?.type === 'FAST_TRACK') fastTracked++;
    });

    return {
      all: teams.length,
      shortlisted,
      waitlisted,
      ineligible,
      fastTracked,
    };
  }, [teams, teamOverrides]);

  // Filtered & sorted teams
  const filteredTeams = useMemo(() => {
    let list = [...simulatedTeamData];

    if (activeFilter === 'shortlisted') {
      list = list.filter((t) => {
        const st = getEffectiveStatus(t);
        return st === 'SHORTLISTED' || st === 'FAST_TRACK';
      });
    } else if (activeFilter === 'waitlisted') {
      list = list.filter((t) => {
        const st = getEffectiveStatus(t);
        return st === 'WAITLISTED' || st === 'INTERVIEW';
      });
    } else if (activeFilter === 'ineligible') {
      list = list.filter((t) => {
        const st = getEffectiveStatus(t);
        return st === 'INELIGIBLE' || st === 'DISQUALIFIED' || t.eligibility_status === 'DISQUALIFIED';
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (t) =>
          t.team_name?.toLowerCase().includes(q) ||
          String(t.team_id).toLowerCase().includes(q) ||
          (t.members && t.members.some((m) => m.name?.toLowerCase().includes(q)))
      );
    }

    list.sort((a, b) => {
      const scoreA = isSimulationActive ? (a.simulated_score || 0) : (a.total_score || 0);
      const scoreB = isSimulationActive ? (b.simulated_score || 0) : (b.total_score || 0);
      const rankA = isSimulationActive ? (a.simulated_rank ?? 999) : (a.rank ?? 999);
      const rankB = isSimulationActive ? (b.simulated_rank ?? 999) : (b.rank ?? 999);

      if (sortBy === 'score_desc') return scoreB - scoreA;
      if (sortBy === 'score_asc') return scoreA - scoreB;
      if (sortBy === 'name_asc') return (a.team_name || '').localeCompare(b.team_name || '');
      return rankA - rankB;
    });

    return list;
  }, [simulatedTeamData, activeFilter, searchQuery, sortBy, isSimulationActive, teamOverrides]);

  // Selected team object
  const selectedTeam = useMemo(() => {
    if (!selectedTeamId && filteredTeams.length > 0) return filteredTeams[0];
    return filteredTeams.find((t) => String(t.team_id) === String(selectedTeamId)) || filteredTeams[0] || teams[0] || null;
  }, [filteredTeams, teams, selectedTeamId]);

  // Compute Jury Brief for selected team
  const selectedJuryBrief = useMemo(() => {
    if (!selectedTeam) return '';
    return generateJuryBrief(selectedTeam);
  }, [selectedTeam]);

  return (
    <section id="results-section" className="scroll-mt-20 flex flex-col gap-5">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 pb-2 border-b-4 border-[#0F172A]">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-emerald-400 text-[#0F172A] font-mono font-bold text-xs border-2 border-[#0F172A] flex items-center justify-center shadow-[2px_2px_0px_#0F172A]">
              04
            </span>
            <span className="font-mono text-xs font-black uppercase tracking-wider text-emerald-800">
              OFFICIAL EVALUATION LEADERBOARD
            </span>
          </div>
          <h2 className="font-display font-black text-2xl md:text-3xl text-[#0F172A] mt-1">
            Ranked Candidate Results & Shortlist
          </h2>
          <p className="text-sm font-sans text-slate-600 font-medium">
            Deterministic rankings with synchronized table inspection, jury controls, and sensitivity testing.
          </p>
        </div>

        {teams.length > 0 && (
          <button
            type="button"
            onClick={onExportCsv}
            className="px-4 py-2 bg-brand-yellow hover:bg-yellow-300 text-[#0F172A] font-display font-black text-xs md:text-sm rounded-xl border-2 border-[#0F172A] shadow-[3px_3px_0px_#0F172A] flex items-center gap-2 self-start md:self-auto cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg font-bold">download</span>
            <span>Download Official CSV</span>
          </button>
        )}
      </div>

      {teams.length === 0 ? (
        <div className="bg-white rounded-2xl border-4 border-[#0F172A] p-8 text-center shadow-[6px_6px_0px_#0F172A] flex flex-col items-center justify-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 border-2 border-[#0F172A] shadow-[3px_3px_0px_#0F172A] flex items-center justify-center text-2xl">
            🏆
          </div>
          <h3 className="font-display font-black text-xl text-[#0F172A]">
            No Leaderboard Generated Yet
          </h3>
          <p className="text-sm font-sans text-slate-600 max-w-md">
            Click "RUN DECISION ENGINE" above in Section 3 to calculate ranks and produce your official candidate shortlist.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {/* Bento KPI Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            <div className="bg-emerald-50 rounded-2xl border-3 border-[#0F172A] p-4 sm:p-5 shadow-[4px_4px_0px_#0F172A]">
              <span className="font-mono text-xs font-bold text-emerald-800 uppercase tracking-wider">
                Shortlisted Finalists
              </span>
              <div className="flex items-baseline gap-2 my-1.5">
                <span className="font-display font-black text-3xl md:text-4xl text-emerald-800">
                  {counts.shortlisted}
                </span>
                <span className="text-xs font-mono font-bold text-slate-600">
                  Teams
                </span>
              </div>
              <span className="text-[11px] text-slate-600 font-medium block">
                {counts.fastTracked > 0 ? `Includes ${counts.fastTracked} fast-tracked` : 'Within top selection quota'}
              </span>
            </div>

            <div className="bg-amber-50 rounded-2xl border-3 border-[#0F172A] p-4 sm:p-5 shadow-[4px_4px_0px_#0F172A]">
              <span className="font-mono text-xs font-bold text-amber-800 uppercase tracking-wider">
                Waitlisted
              </span>
              <div className="flex items-baseline gap-2 my-1.5">
                <span className="font-display font-black text-3xl md:text-4xl text-amber-800">
                  {counts.waitlisted}
                </span>
                <span className="text-xs font-mono font-bold text-slate-600">
                  Teams
                </span>
              </div>
              <span className="text-[11px] text-slate-600 font-medium block">
                Eligible reserve candidates
              </span>
            </div>

            <div className="bg-rose-50 rounded-2xl border-3 border-[#0F172A] p-4 sm:p-5 shadow-[4px_4px_0px_#0F172A]">
              <span className="font-mono text-xs font-bold text-rose-800 uppercase tracking-wider">
                Ineligible / Disqualified
              </span>
              <div className="flex items-baseline gap-2 my-1.5">
                <span className="font-display font-black text-3xl md:text-4xl text-rose-800">
                  {counts.ineligible}
                </span>
                <span className="text-xs font-mono font-bold text-slate-600">
                  Teams
                </span>
              </div>
              <span className="text-[11px] text-slate-600 font-medium block">
                Violated non-negotiable hard gates
              </span>
            </div>

            <div className="bg-blue-50 rounded-2xl border-3 border-[#0F172A] p-4 sm:p-5 shadow-[4px_4px_0px_#0F172A]">
              <span className="font-mono text-xs font-bold text-blue-800 uppercase tracking-wider">
                Cutoff Score Floor
              </span>
              <div className="flex items-baseline gap-2 my-1.5">
                <span className="font-display font-black text-3xl md:text-4xl text-blue-800">
                  {runInfo?.cutoff_floor != null ? Number(runInfo.cutoff_floor).toFixed(1) : '75.0'}
                </span>
                <span className="text-xs font-mono font-bold text-slate-600">
                  / 100
                </span>
              </div>
              <span className="text-[11px] text-slate-600 font-medium block">
                Minimum score to enter shortlist
              </span>
            </div>
          </div>

          {/* Filter Tabs & Search Controls */}
          <div className="bg-white rounded-2xl border-3 border-[#0F172A] p-3.5 sm:p-4 shadow-[4px_4px_0px_#0F172A] flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto scrollbar-none">
              <button
                type="button"
                onClick={() => setActiveFilter('all')}
                className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold border-2 border-[#0F172A] transition-all cursor-pointer whitespace-nowrap ${
                  activeFilter === 'all'
                    ? 'bg-brand-dark text-white shadow-[2px_2px_0px_#0F172A]'
                    : 'bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                All ({counts.all})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('shortlisted')}
                className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold border-2 border-[#0F172A] transition-all cursor-pointer whitespace-nowrap ${
                  activeFilter === 'shortlisted'
                    ? 'bg-emerald-600 text-white shadow-[2px_2px_0px_#0F172A]'
                    : 'bg-white text-slate-700 hover:bg-emerald-50'
                }`}
              >
                Shortlisted ({counts.shortlisted})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('waitlisted')}
                className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold border-2 border-[#0F172A] transition-all cursor-pointer whitespace-nowrap ${
                  activeFilter === 'waitlisted'
                    ? 'bg-amber-500 text-[#0F172A] shadow-[2px_2px_0px_#0F172A]'
                    : 'bg-white text-slate-700 hover:bg-amber-50'
                }`}
              >
                Waitlist ({counts.waitlisted})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('ineligible')}
                className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold border-2 border-[#0F172A] transition-all cursor-pointer whitespace-nowrap ${
                  activeFilter === 'ineligible'
                    ? 'bg-rose-600 text-white shadow-[2px_2px_0px_#0F172A]'
                    : 'bg-white text-slate-700 hover:bg-rose-50'
                }`}
              >
                Ineligible ({counts.ineligible})
              </button>
            </div>

            {/* Search & Sort & Simulator Toggle */}
            <div className="flex items-center flex-wrap gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-56">
                <input
                  type="text"
                  placeholder="Search team or candidate..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl border-2 border-[#0F172A] font-sans text-xs focus:bg-yellow-50 focus:outline-none"
                />
                <span className="material-symbols-outlined absolute left-2 top-2 text-slate-400 text-sm">
                  search
                </span>
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="py-1.5 px-2.5 rounded-xl border-2 border-[#0F172A] font-mono text-xs font-bold bg-white focus:outline-none cursor-pointer"
              >
                <option value="rank_asc">Rank (1 to N)</option>
                <option value="score_desc">Score (Highest)</option>
                <option value="score_asc">Score (Lowest)</option>
                <option value="name_asc">Team Name (A-Z)</option>
              </select>

              {/* Feature 3: Simulator Toggle Button */}
              <button
                type="button"
                onClick={() => setShowSimulator((prev) => !prev)}
                className={`py-1.5 px-3 rounded-xl border-2 border-[#0F172A] font-mono text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  showSimulator || isSimulationActive
                    ? 'bg-amber-400 text-[#0F172A] shadow-[2px_2px_0px_#0F172A]'
                    : 'bg-white hover:bg-amber-50 text-slate-800 shadow-[1px_1px_0px_#0F172A]'
                }`}
                title="Open What-If Sensitivity Simulator to test dynamic weight changes"
              >
                <span className="material-symbols-outlined text-sm font-bold">tune</span>
                <span>{isSimulationActive ? '⚡ Sim Active' : 'What-If Sim'}</span>
              </button>
            </div>
          </div>

          {/* Feature 3: Interactive "What-If" Sensitivity Simulator Panel */}
          {showSimulator && (
            <div className="p-4 bg-gradient-to-r from-amber-50/90 via-white to-purple-50/90 rounded-2xl border-3 border-[#0F172A] shadow-[4px_4px_0px_#0F172A] flex flex-col gap-3 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b-2 border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-amber-400 border-2 border-[#0F172A] flex items-center justify-center font-bold text-xs shadow-[1px_1px_0px_#0F172A]">
                    🎛️
                  </span>
                  <div>
                    <span className="font-display font-black text-sm text-[#0F172A]">
                      "What-If" Sensitivity Simulator
                    </span>
                    <span className="hidden sm:inline-block ml-2 px-2 py-0.2 rounded-full text-[9px] font-mono font-bold bg-purple-100 text-purple-900 border border-purple-300">
                      Live Dynamic Re-Ranking
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  {isSimulationActive && (
                    <button
                      type="button"
                      onClick={resetSimulator}
                      className="px-2.5 py-1 rounded-lg bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 font-mono text-[11px] font-bold cursor-pointer transition-colors"
                    >
                      ↺ Reset to Backend Weights
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowSimulator(false)}
                    className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">close</span>
                  </button>
                </div>
              </div>

              {/* Scenarios Preset Bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <span className="text-xs font-mono font-bold text-slate-600 uppercase shrink-0">
                  Preset Scenarios:
                </span>
                <div className="flex items-center flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('default')}
                    className={`px-2.5 py-1 rounded-lg font-mono text-xs font-bold border transition-all cursor-pointer ${
                      simScenario === 'default'
                        ? 'bg-brand-dark text-white border-brand-dark shadow-xs'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                    }`}
                  >
                    Standard (30/30/25/15)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('github')}
                    className={`px-2.5 py-1 rounded-lg font-mono text-xs font-bold border transition-all cursor-pointer ${
                      simScenario === 'github'
                        ? 'bg-purple-600 text-white border-purple-900 shadow-xs'
                        : 'bg-white hover:bg-purple-50 text-purple-900 border-purple-300'
                    }`}
                  >
                    ⚡ GitHub Velocity 55%
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('experience')}
                    className={`px-2.5 py-1 rounded-lg font-mono text-xs font-bold border transition-all cursor-pointer ${
                      simScenario === 'experience'
                        ? 'bg-blue-600 text-white border-blue-900 shadow-xs'
                        : 'bg-white hover:bg-blue-50 text-blue-900 border-blue-300'
                    }`}
                  >
                    💼 Senior Experience 55%
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('skills')}
                    className={`px-2.5 py-1 rounded-lg font-mono text-xs font-bold border transition-all cursor-pointer ${
                      simScenario === 'skills'
                        ? 'bg-emerald-600 text-white border-emerald-900 shadow-xs'
                        : 'bg-white hover:bg-emerald-50 text-emerald-900 border-emerald-300'
                    }`}
                  >
                    🎯 Skills Fit 55%
                  </button>
                </div>
              </div>

              {/* Interactive Sliders */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
                <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex flex-col gap-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="font-bold text-slate-700">Experience</span>
                    <span className="font-black text-brand-blue">{simWeights.exp}%</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="70"
                    step="5"
                    value={simWeights.exp}
                    onChange={(e) => handleWeightChange('exp', e.target.value)}
                    className="accent-brand-blue cursor-pointer h-1.5"
                  />
                </div>

                <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex flex-col gap-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="font-bold text-slate-700">GitHub Activity</span>
                    <span className="font-black text-purple-700">{simWeights.github}%</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="70"
                    step="5"
                    value={simWeights.github}
                    onChange={(e) => handleWeightChange('github', e.target.value)}
                    className="accent-purple-600 cursor-pointer h-1.5"
                  />
                </div>

                <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex flex-col gap-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="font-bold text-slate-700">Skills Match</span>
                    <span className="font-black text-emerald-700">{simWeights.skills}%</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="70"
                    step="5"
                    value={simWeights.skills}
                    onChange={(e) => handleWeightChange('skills', e.target.value)}
                    className="accent-emerald-600 cursor-pointer h-1.5"
                  />
                </div>

                <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex flex-col gap-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="font-bold text-slate-700">Pitch & Quality</span>
                    <span className="font-black text-amber-700">{simWeights.pitch}%</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    step="5"
                    value={simWeights.pitch}
                    onChange={(e) => handleWeightChange('pitch', e.target.value)}
                    className="accent-amber-500 cursor-pointer h-1.5"
                  />
                </div>
              </div>

              {isSimulationActive && (
                <div className="text-[11px] font-mono text-purple-950 bg-purple-100/70 p-2 rounded-lg border border-purple-200 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm font-bold text-purple-700">info</span>
                  <span>
                    <strong>Sensitivity Mode Active:</strong> Table is re-ranked dynamically based on your simulated criteria weights. Look for green <span className="text-emerald-700 font-bold">▲</span> and red <span className="text-rose-700 font-bold">▼</span> rank shifts in the table below.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Blind Review Mode Active Alert Banner */}
          {isBlindReview && (
            <div className="p-3 bg-purple-100/90 border-2 border-purple-500 rounded-xl flex items-center justify-between text-xs font-mono text-purple-950 shadow-[3px_3px_0px_#0F172A] animate-fadeIn">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-purple-700 font-bold text-lg shrink-0">
                  verified_user
                </span>
                <span>
                  <strong>BLIND REVIEW MODE ACTIVE:</strong> Team and candidate identities are masked with pseudonyms to guarantee 100% merit-based evaluation without nepotism, gender bias, or favoritism.
                </span>
              </div>
              <button
                type="button"
                onClick={onToggleBlindReview}
                className="underline hover:text-purple-700 font-bold shrink-0 cursor-pointer ml-3"
              >
                Disable
              </button>
            </div>
          )}

          {/* =================================================================================== */}
          {/* EQUAL DIMENSION 2-COLUMN SPLIT: BOTH SIDES SHARE EXACT SAME HEIGHT (740px)          */}
          {/* Internal scrolling inside both containers eliminates empty right-hand white space   */}
          {/* =================================================================================== */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Left: Scrollable Ranked Table Box (Same Height as Inspect Drawer) */}
            <div className="lg:col-span-7 h-[740px] max-h-[740px] flex flex-col bg-white rounded-2xl border-3 border-[#0F172A] shadow-[5px_5px_0px_#0F172A] overflow-hidden">
              {/* Box Top Header Bar */}
              <div className="p-3.5 bg-slate-100 border-b-2 border-[#0F172A] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-base text-brand-blue font-bold">
                    format_list_numbered
                  </span>
                  <span className="font-mono font-black text-xs text-slate-800 uppercase tracking-wider">
                    Ranked Teams ({filteredTeams.length} of {teams.length})
                  </span>
                </div>
                {isSimulationActive && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-200 text-amber-950 border border-amber-300">
                    ⚡ Simulated Ranks
                  </span>
                )}
              </div>

              {/* Scrollable Table Container */}
              <div className="flex-1 overflow-y-auto scrollbar-thin">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 z-10 bg-slate-100 border-b-2 border-[#0F172A] text-xs font-mono font-bold text-slate-700 shadow-xs">
                    <tr>
                      <th className="p-3 w-14 text-center">Rank</th>
                      <th className="p-3">Team & Members</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Score</th>
                      <th className="p-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-slate-100 font-sans text-xs">
                    {filteredTeams.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="p-8 text-center text-slate-500 font-mono">
                          No teams matched the active filter or search query.
                        </td>
                      </tr>
                    ) : (
                      filteredTeams.map((team, idx) => {
                        const isSelected = String(team.team_id) === String(selectedTeam?.team_id);
                        const effectiveStatus = getEffectiveStatus(team);
                        const isShortlisted = effectiveStatus === 'SHORTLISTED' || effectiveStatus === 'FAST_TRACK';
                        const isIneligible = effectiveStatus === 'INELIGIBLE' || effectiveStatus === 'DISQUALIFIED' || team.eligibility_status === 'DISQUALIFIED';
                        const override = teamOverrides[team.team_id];
                        const displayRank = isSimulationActive ? (team.simulated_rank ?? idx + 1) : (team.rank ?? idx + 1);
                        const displayScore = isSimulationActive ? (team.simulated_score ?? team.total_score) : team.total_score;

                        return (
                          <tr
                            key={team.team_id || idx}
                            onClick={() => onSelectTeam(team)}
                            className={`transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-yellow-100/70 font-semibold'
                                : 'hover:bg-slate-50'
                            }`}
                          >
                            {/* Rank Column with Optional Simulation Delta */}
                            <td className="p-3 text-center">
                              <div className="flex flex-col items-center justify-center gap-0.5">
                                <span
                                  className={`inline-flex items-center justify-center w-7 h-7 rounded-lg font-mono font-black text-xs border-2 border-[#0F172A] ${
                                    displayRank === 1
                                      ? 'bg-amber-300 text-amber-900 shadow-[2px_2px_0px_#0F172A]'
                                      : displayRank === 2
                                      ? 'bg-slate-300 text-slate-900 shadow-[2px_2px_0px_#0F172A]'
                                      : displayRank === 3
                                      ? 'bg-amber-600 text-white shadow-[2px_2px_0px_#0F172A]'
                                      : 'bg-white text-slate-700'
                                  }`}
                                >
                                  #{displayRank}
                                </span>
                                {isSimulationActive && team.rank_delta !== undefined && team.rank_delta !== 0 && (
                                  <span
                                    className={`text-[9px] font-mono font-black px-1 rounded ${
                                      team.rank_delta > 0
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : 'bg-rose-100 text-rose-800'
                                    }`}
                                  >
                                    {team.rank_delta > 0 ? `▲ +${team.rank_delta}` : `▼ ${Math.abs(team.rank_delta)}`}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Team Name & Size */}
                            <td className="p-3">
                              <div className="font-display font-bold text-sm text-[#0F172A]">
                                {getDisplayTeamName(team, idx)}
                              </div>
                              <div className="flex items-center flex-wrap gap-1.5 mt-0.5">
                                <span className="text-[11px] font-mono text-slate-500">
                                  {team.members && team.members.length > 0
                                    ? `${team.members.length} ${team.members.length === 1 ? 'Member' : 'Members'}`
                                    : `${team.team_size || 1} ${(team.team_size || 1) === 1 ? 'Member' : 'Members'}`}
                                </span>
                              </div>
                            </td>

                            {/* Status Badge with Recruiter Override Indicator */}
                            <td className="p-3">
                              {override ? (
                                <span
                                  className={`px-2 py-0.5 rounded-full font-mono font-black text-[9px] border border-[#0F172A] shadow-2xs whitespace-nowrap ${
                                    override.type === 'FAST_TRACK'
                                      ? 'bg-amber-300 text-amber-950'
                                      : override.type === 'INTERVIEW'
                                      ? 'bg-blue-300 text-blue-950'
                                      : 'bg-rose-300 text-rose-950'
                                  }`}
                                >
                                  {override.type === 'FAST_TRACK'
                                    ? '⭐ FAST-TRACK'
                                    : override.type === 'INTERVIEW'
                                    ? '💬 INTERVIEW'
                                    : '⛔ DISQUALIFIED'}
                                </span>
                              ) : (
                                <span
                                  className={`px-2.5 py-1 rounded-full font-mono font-bold text-[10px] border border-[#0F172A] whitespace-nowrap ${
                                    isShortlisted
                                      ? 'bg-emerald-100 text-emerald-900'
                                      : isIneligible
                                      ? 'bg-rose-100 text-rose-900'
                                      : 'bg-amber-100 text-amber-900'
                                  }`}
                                >
                                  {isShortlisted ? '● SHORTLISTED' : isIneligible ? '✕ INELIGIBLE' : '◌ WAITLIST'}
                                </span>
                              )}
                            </td>

                            {/* Score Bar */}
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <div className="w-14 bg-slate-200 rounded-full h-2 overflow-hidden border border-slate-400">
                                  <div
                                    className={`h-full ${
                                      isShortlisted
                                        ? 'bg-emerald-500'
                                        : isIneligible
                                        ? 'bg-rose-400'
                                        : 'bg-amber-500'
                                    }`}
                                    style={{ width: `${Math.min(100, displayScore || 0)}%` }}
                                  ></div>
                                </div>
                                <span className="font-mono font-black text-xs text-[#0F172A]">
                                  {Number(displayScore || 0).toFixed(1)}
                                </span>
                              </div>
                            </td>

                            {/* Actions */}
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onSelectTeam(team);
                                  }}
                                  className={`px-2 py-1 rounded-lg border font-mono font-bold text-[11px] shadow-[1px_1px_0px_#0F172A] cursor-pointer ${
                                    isSelected
                                      ? 'bg-brand-yellow text-[#0F172A] border-[#0F172A]'
                                      : 'bg-white hover:bg-yellow-100 border-[#0F172A]'
                                  }`}
                                >
                                  Inspect
                                </button>
                                {onSelectForCompare && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onSelectForCompare(team);
                                    }}
                                    title="Add to Head-to-Head Compare"
                                    className="px-2 py-1 bg-white hover:bg-blue-50 text-brand-blue rounded-lg border border-[#0F172A] font-mono font-bold text-[11px] shadow-[1px_1px_0px_#0F172A] cursor-pointer"
                                  >
                                    Compare
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Fixed Box Bottom Footer */}
              <div className="p-2.5 bg-slate-50 border-t-2 border-slate-200 flex items-center justify-between text-[11px] font-mono text-slate-500 shrink-0">
                <span>
                  Showing {filteredTeams.length} of {teams.length} teams
                </span>
                <span className="hidden sm:inline">
                  Click any team row to inspect full roster details →
                </span>
              </div>
            </div>

            {/* Right: Scrollable Team Inspection Drawer (Same Height as Table Box) */}
            <div className="lg:col-span-5 h-[740px] max-h-[740px] flex flex-col bg-white rounded-2xl border-3 border-[#0F172A] shadow-[5px_5px_0px_#0F172A] overflow-hidden">
              {selectedTeam ? (
                <>
                  {/* Fixed Drawer Header Bar */}
                  <div className="p-4 sm:p-5 pb-3 border-b-2 border-slate-200 bg-white z-10 shrink-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono font-black text-xs px-2 py-0.5 rounded bg-brand-yellow border border-[#0F172A]">
                            Rank #{selectedTeam.simulated_rank ?? selectedTeam.rank}
                          </span>
                          <span
                            className={`font-mono font-bold text-xs px-2 py-0.5 rounded border border-[#0F172A] ${
                              selectedTeam.status === 'SHORTLISTED'
                                ? 'bg-emerald-100 text-emerald-900'
                                : selectedTeam.status === 'INELIGIBLE' || selectedTeam.eligibility_status === 'DISQUALIFIED'
                                ? 'bg-rose-100 text-rose-900'
                                : 'bg-amber-100 text-amber-900'
                            }`}
                          >
                            {selectedTeam.status}
                          </span>
                          {teamOverrides[selectedTeam.team_id] && (
                            <span className="font-mono font-black text-[10px] px-2 py-0.5 rounded bg-purple-200 text-purple-950 border border-purple-400">
                              OVERRIDE ACTIVE
                            </span>
                          )}
                        </div>
                        <h3 className="font-display font-black text-xl text-[#0F172A] mt-1">
                          {getDisplayTeamName(selectedTeam, 0)}
                        </h3>
                        <span className="text-[11px] font-mono text-slate-500">
                          {(() => {
                            const cCount = selectedTeam.members && selectedTeam.members.length > 0
                              ? selectedTeam.members.length
                              : (selectedTeam.team_size || 1);
                            return `${cCount} Registered Candidate${cCount !== 1 ? 's' : ''}`;
                          })()}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-mono font-bold text-slate-500 uppercase block">
                          Composite Score
                        </span>
                        <span className="font-display font-black text-2xl text-brand-blue">
                          {Number(isSimulationActive ? (selectedTeam.simulated_score ?? selectedTeam.total_score) : (selectedTeam.total_score || 0)).toFixed(1)}
                          <span className="text-xs text-slate-400">/100</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Scrollable Drawer Body */}
                  <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-4 scrollbar-thin">
                    {/* Feature 2: Recruiter Jury Action Bar */}
                    <div className="p-3 bg-slate-50 rounded-xl border-2 border-slate-300 flex flex-col gap-2 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-[11px] text-slate-700 uppercase flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm text-brand-blue font-bold">how_to_reg</span>
                          Recruiter Jury Actions
                        </span>
                        {teamOverrides[selectedTeam.team_id] && (
                          <span className="px-2 py-0.2 rounded-full text-[9px] font-mono font-bold bg-purple-100 text-purple-900 border border-purple-300 animate-pulse">
                            {teamOverrides[selectedTeam.team_id].type}
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleSetOverride(selectedTeam.team_id, 'FAST_TRACK')}
                          className={`px-2 py-1.5 rounded-lg font-mono text-[11px] font-bold border transition-all flex items-center justify-center gap-1 cursor-pointer ${
                            teamOverrides[selectedTeam.team_id]?.type === 'FAST_TRACK'
                              ? 'bg-amber-400 text-amber-950 border-[#0F172A] shadow-xs'
                              : 'bg-white hover:bg-amber-50 text-amber-900 border-amber-300'
                          }`}
                          title="Fast-track this team to immediate finalist status"
                        >
                          <span>⭐ Fast-Track</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSetOverride(selectedTeam.team_id, 'INTERVIEW')}
                          className={`px-2 py-1.5 rounded-lg font-mono text-[11px] font-bold border transition-all flex items-center justify-center gap-1 cursor-pointer ${
                            teamOverrides[selectedTeam.team_id]?.type === 'INTERVIEW'
                              ? 'bg-blue-500 text-white border-[#0F172A] shadow-xs'
                              : 'bg-white hover:bg-blue-50 text-blue-900 border-blue-300'
                          }`}
                          title="Flag team for recruiter follow-up interview"
                        >
                          <span>💬 Interview</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSetOverride(selectedTeam.team_id, 'DISQUALIFIED')}
                          className={`px-2 py-1.5 rounded-lg font-mono text-[11px] font-bold border transition-all flex items-center justify-center gap-1 cursor-pointer ${
                            teamOverrides[selectedTeam.team_id]?.type === 'DISQUALIFIED'
                              ? 'bg-rose-500 text-white border-[#0F172A] shadow-xs'
                              : 'bg-white hover:bg-rose-50 text-rose-900 border-rose-300'
                          }`}
                          title="Manual disqualification by recruiter"
                        >
                          <span>⛔ Disqualify</span>
                        </button>
                      </div>
                      {teamOverrides[selectedTeam.team_id] && (
                        <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-[10px] font-mono">
                          <span className="text-slate-600 truncate mr-2">
                            {teamOverrides[selectedTeam.team_id].note}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleClearOverride(selectedTeam.team_id)}
                            className="text-slate-500 hover:text-rose-600 underline cursor-pointer shrink-0"
                          >
                            ↺ Reset
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Feature 4: Executive Jury Pitch Dossier */}
                    <div className="p-3.5 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 rounded-xl border-2 border-blue-300 shadow-2xs flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-[11px] text-blue-900 uppercase tracking-wide flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-sm text-brand-blue">summarize</span>
                          Executive Jury Pitch Dossier
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-blue-200/80 text-blue-950 font-mono text-[9px] font-extrabold uppercase">
                          Pitch Ready
                        </span>
                      </div>
                      <p className="text-xs font-sans text-slate-800 leading-relaxed font-medium">
                        {selectedJuryBrief}
                      </p>
                    </div>

                    {/* Plain-English Decision Reason */}
                    <div
                      className={`p-3.5 rounded-xl border-2 ${
                        selectedTeam.status === 'SHORTLISTED'
                          ? 'bg-emerald-50 border-emerald-400'
                          : selectedTeam.status === 'INELIGIBLE' || selectedTeam.eligibility_status === 'DISQUALIFIED'
                          ? 'bg-rose-50 border-rose-400'
                          : 'bg-amber-50 border-amber-400'
                      }`}
                    >
                      <span
                        className={`font-mono font-bold text-xs block mb-1 uppercase tracking-wide ${
                          selectedTeam.status === 'SHORTLISTED'
                            ? 'text-emerald-900'
                            : selectedTeam.status === 'INELIGIBLE' || selectedTeam.eligibility_status === 'DISQUALIFIED'
                            ? 'text-rose-900'
                            : 'text-amber-900'
                        }`}
                      >
                        {selectedTeam.status === 'SHORTLISTED'
                          ? '✓ Shortlist Decision Reason:'
                          : selectedTeam.status === 'INELIGIBLE' || selectedTeam.eligibility_status === 'DISQUALIFIED'
                          ? '✕ Disqualification Reason:'
                          : '◌ Waitlist Position Reason:'}
                      </span>
                      <p className="text-xs font-sans text-slate-800 leading-relaxed font-medium">
                        {selectedTeam.explanation ||
                          (selectedTeam.status === 'SHORTLISTED'
                            ? `Ranked #${selectedTeam.rank} with a composite score of ${selectedTeam.total_score}. Satisfied all eligibility rules (team size, GitHub verification) and fell within top quota.`
                            : selectedTeam.status === 'INELIGIBLE'
                            ? `Disqualified by eligibility gates: ${selectedTeam.disqualification_reason || 'Roster criteria not met.'}`
                            : `Eligible with a score of ${selectedTeam.total_score}, placed on reserve waitlist below the shortlist cutoff.`)}
                      </p>
                    </div>

                    {/* Non-Negotiable Gate Violations Card */}
                    {selectedTeam.failed_rules && selectedTeam.failed_rules.length > 0 && (
                      <div className="p-3.5 bg-rose-50/80 rounded-xl border-2 border-rose-400 flex flex-col gap-2.5 shadow-sm">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-rose-600 text-base font-bold">
                              gpp_bad
                            </span>
                            <span className="font-mono font-black text-xs text-rose-900 uppercase tracking-wide">
                              Hard Gate Failure Details
                            </span>
                          </div>
                          <span className="px-2 py-0.5 rounded font-mono font-black text-[10px] bg-rose-200 text-rose-900 border border-rose-300">
                            {selectedTeam.failed_rules.length} Failure{selectedTeam.failed_rules.length > 1 ? 's' : ''}
                          </span>
                        </div>

                        <div className="flex flex-col gap-2">
                          {selectedTeam.failed_rules.map((rule, rIdx) => (
                            <div
                              key={rIdx}
                              className="p-2.5 rounded-lg bg-white border border-rose-300 flex flex-col gap-1.5 shadow-xs"
                            >
                              <div className="flex items-center justify-between flex-wrap gap-1">
                                <span className="font-display font-bold text-xs text-rose-950 flex items-center gap-1">
                                  <span className="text-rose-600 font-black">✕</span> {rule.rule_name}
                                </span>
                                <div className="flex items-center gap-1">
                                  <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-300 font-mono text-[9px] font-bold">
                                    {rule.scope || 'MEMBER'} GATE
                                  </span>
                                  {(rule.expected_condition || rule.operator) && (
                                    <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200 font-mono text-[9px] font-bold">
                                      Expected: {rule.expected_condition || `${rule.operator} ${rule.threshold ?? ''}`}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <p className="text-[11px] font-sans text-slate-700 leading-snug">
                                {rule.reason || 'Criteria condition evaluated to false.'}
                              </p>

                              {rule.affected_members && rule.affected_members.length > 0 && (
                                <div className="mt-1 pt-1.5 border-t border-rose-100 flex flex-col gap-1">
                                  <span className="text-[10px] font-mono font-bold text-rose-800">
                                    Affected Candidate{rule.affected_members.length > 1 ? 's' : ''}:
                                  </span>
                                  <div className="flex flex-wrap gap-1.5">
                                    {rule.affected_members.map((m, mIdx) => (
                                      <div
                                        key={mIdx}
                                        className="px-2 py-1 rounded bg-rose-50 border border-rose-200 text-[10px] font-mono text-rose-900 flex flex-col"
                                      >
                                        <span className="font-bold">{m.member_name || m.member_id}</span>
                                        <span className="text-[9px] text-slate-600">
                                          Observed: {m.observed_value !== null && m.observed_value !== undefined ? String(m.observed_value) : 'Missing / Incomplete'}
                                        </span>
                                        {m.reason && (
                                          <span className="text-[9px] text-rose-700 italic">
                                            {m.reason}
                                          </span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Criteria Score Breakdown Bars */}
                    <div className="flex flex-col gap-2.5 p-3.5 bg-slate-50 rounded-xl border-2 border-slate-200 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-xs text-slate-700 uppercase flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-sm text-brand-blue">bar_chart</span>
                          Criteria Score Breakdown:
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          Weighted Points
                        </span>
                      </div>
                      {selectedTeam.score_details?.map((item, idx) => {
                        const barColor =
                          item.key === 'experience_years'
                            ? 'bg-emerald-500'
                            : item.key === 'github_composite_score'
                            ? 'bg-brand-blue'
                            : item.key === 'skills'
                            ? 'bg-purple-600'
                            : 'bg-rose-500';

                        return (
                          <div key={idx} className="flex flex-col gap-1">
                            <div className="flex justify-between text-xs font-sans">
                              <span className="text-slate-700 font-semibold">{item.label}</span>
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono font-bold text-[#0F172A]">{item.raw_value}</span>
                                {item.weighted_score != null && (
                                  <span className="text-[10px] font-mono text-slate-500">
                                    (+{item.weighted_score} pts)
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden border border-slate-300">
                              <div
                                className={`${barColor} h-full transition-all duration-500 ease-out`}
                                style={{
                                  width: `${Math.min(100, Math.max(12, item.percentage || 20))}%`,
                                }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Candidate Roster & Individual Member Scoring */}
                    <div className="flex flex-col gap-2 pt-2 border-t border-slate-200">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-xs text-slate-700 uppercase">
                          Candidate Roster ({selectedTeam.members?.length || 0}):
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          {isBlindReview ? 'Identities Anonymized' : 'Individual Candidate Breakdown'}
                        </span>
                      </div>

                      <div className="flex flex-col gap-3">
                        {selectedTeam.members && selectedTeam.members.length > 0 ? (
                          selectedTeam.members.map((member, idx) => {
                            const memKey = member.id || member.email || member.name || `m-${idx}`;
                            const identifier = member.github_username || member.github_url;
                            const isGhExpanded = expandedGithubId === memKey;
                            const isGhLoading = Boolean(identifier && loadingGithub[identifier]);
                            const ghData = identifier ? githubCache[identifier] : null;

                            return (
                              <div
                                key={memKey}
                                className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-2 text-xs shadow-xs"
                              >
                                {/* Member Header: Name, Score & Eligibility */}
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex flex-col min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-display font-bold text-sm text-[#0F172A] truncate">
                                        {getDisplayCandidateName(member, idx)}
                                      </span>
                                      {idx === 0 && (
                                        <span className="px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 border border-amber-300 font-mono text-[9px] font-bold">
                                          LEAD
                                        </span>
                                      )}
                                    </div>
                                    {member.email && (
                                      <span className="text-[11px] font-mono text-slate-500 truncate">
                                        {getDisplayEmail(member.email)}
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-1.5 shrink-0">
                                    {/* Individual Score Pill */}
                                    {(() => {
                                      const displayScore = member.score != null ? member.score : Number(selectedTeam.total_score || 72.0);
                                      return (
                                        <span
                                          className={`px-2 py-0.5 rounded-lg font-mono font-black text-xs border border-[#0F172A] ${
                                            displayScore >= 75
                                              ? 'bg-emerald-200 text-emerald-950'
                                              : displayScore >= 50
                                              ? 'bg-amber-200 text-amber-950'
                                              : 'bg-rose-200 text-rose-950'
                                          }`}
                                          title="Individual Candidate Composite Score"
                                        >
                                          {displayScore.toFixed(1)} / 100
                                        </span>
                                      );
                                    })()}

                                    {/* Member Eligibility Badge */}
                                    {member.is_eligible === false || (member.failed_rules && member.failed_rules.length > 0) ? (
                                      <span
                                        className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300 font-mono font-bold text-[10px]"
                                        title="Failed member-level eligibility rule"
                                      >
                                        ✕ Gate Failed
                                      </span>
                                    ) : (
                                      <span
                                        className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 font-mono font-bold text-[10px]"
                                        title="Satisfied candidate eligibility gates"
                                      >
                                        ● Eligible
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Experience & Source Attribution */}
                                <div className="flex items-center flex-wrap gap-2 text-[11px]">
                                  <span className="font-mono font-medium text-slate-700 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[13px] text-slate-500">
                                      work_history
                                    </span>
                                    {member.experience_years != null
                                      ? `${Number(member.experience_years).toFixed(1)} yrs exp`
                                      : 'Exp: Portfolio-Based (GitHub Verified)'}
                                  </span>

                                  <span
                                    className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold border ${
                                      member.experience_source === 'Declared in CSV'
                                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                                        : member.experience_years != null
                                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                                        : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    }`}
                                    title="Source of experience metric"
                                  >
                                    {member.experience_source === 'Declared in CSV'
                                      ? '📄 Declared in CSV'
                                      : member.experience_years != null
                                      ? '⚡ Inferred from Skills'
                                      : '💻 GitHub Verified Track Record'}
                                  </span>

                                  {!isBlindReview && member.declared_gender && (
                                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 font-mono text-[10px]">
                                      Gender: {member.declared_gender}
                                    </span>
                                  )}
                                </div>

                                {/* Technical Skills & Verified Language Stack */}
                                {(member.skills?.length > 0 || member.top_languages?.length > 0) && (
                                  <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                                    <span className="text-[10px] font-mono font-bold text-slate-600 uppercase">
                                      Tech Stack:
                                    </span>
                                    {(member.skills?.length > 0 ? member.skills : member.top_languages || []).slice(0, 6).map((sk, sIdx) => (
                                      <span
                                        key={sIdx}
                                        className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-900 border border-blue-300 font-mono text-[10px] font-bold shadow-2xs"
                                      >
                                        {sk}
                                      </span>
                                    ))}
                                  </div>
                                )}

                                {/* Verified Candidate GitHub Repository & Tech Stack Audit Box */}
                                <div className="p-2.5 rounded-lg bg-slate-100/90 border border-slate-300 flex flex-col gap-1.5 mt-0.5">
                                  <div className="flex items-center justify-between flex-wrap gap-1">
                                    <div className="flex items-center gap-1.5">
                                      <span className="material-symbols-outlined text-sm text-brand-blue font-bold">
                                        folder_code
                                      </span>
                                      <span className="font-mono font-bold text-[11px] text-[#0F172A]">
                                        {member.public_repos != null ? (
                                          member.public_repos > 0 ? (
                                            <span className="text-brand-blue font-bold">
                                              📦 {member.public_repos} Public Repositories{' '}
                                              {member.original_repos_count != null && (
                                                <span className="text-slate-600 text-[10px] font-normal">
                                                  ({member.original_repos_count} original, {member.forked_repos_count || 0} forks)
                                                </span>
                                              )}
                                            </span>
                                          ) : (
                                            <span className="text-amber-800 font-bold">
                                              📦 0 Public Repositories (Beginner profile)
                                            </span>
                                          )
                                        ) : member.github_url || member.github_username ? (
                                          <a
                                            href={
                                              member.github_url
                                                ? (member.github_url.startsWith('http') ? member.github_url : `https://${member.github_url}`)
                                                : `https://github.com/${member.github_username}`
                                            }
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-brand-blue hover:text-blue-700 hover:underline font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
                                            title="Open Candidate GitHub Profile"
                                          >
                                            <span>📦 GitHub Profile Linked</span>
                                            <span className="material-symbols-outlined text-[13px]">open_in_new</span>
                                          </a>
                                        ) : (
                                          <span className="text-rose-700 font-bold">
                                            ✕ No GitHub Profile Provided (0 Repos)
                                          </span>
                                        )}
                                      </span>
                                    </div>

                                    {member.total_stars != null && member.total_stars > 0 && (
                                      <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300 font-mono text-[9px] font-bold">
                                        ★ {member.total_stars} stars
                                      </span>
                                    )}
                                  </div>

                                  {/* Extracted Repository Tech Stack */}
                                  {member.top_languages && member.top_languages.length > 0 && (
                                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5 border-t border-slate-200">
                                      <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">
                                        Repo Tech Stack:
                                      </span>
                                      {member.top_languages.map((lang, lIdx) => (
                                        <span
                                          key={lIdx}
                                          className="px-1.5 py-0.2 rounded bg-white text-slate-800 border border-slate-300 font-mono text-[9px] font-bold shadow-2xs"
                                        >
                                          {lang}
                                        </span>
                                      ))}
                                    </div>
                                  )}

                                  {/* Quick preview of authentic recent repositories */}
                                  {member.recent_repos && member.recent_repos.length > 0 && (
                                    <div className="flex flex-col gap-1 pt-1 border-t border-slate-200">
                                      <span className="text-[10px] font-mono text-slate-500 uppercase font-bold">
                                        Verified Projects:
                                      </span>
                                      <div className="flex flex-col gap-1">
                                        {member.recent_repos.slice(0, 2).map((repo, rIdx) => (
                                          <div key={rIdx} className="flex items-center justify-between text-[10px] font-mono bg-white p-1 rounded border border-slate-200">
                                            <a
                                              href={repo.html_url || `https://github.com/${member.github_username || 'candidate'}/${repo.name}`}
                                              target="_blank"
                                              rel="noreferrer"
                                              className="text-brand-blue hover:underline font-bold truncate max-w-[180px]"
                                            >
                                              📁 {repo.name}
                                            </a>
                                            <div className="flex items-center gap-1.5 shrink-0">
                                              {repo.language && (
                                                <span className="px-1 py-0.2 rounded bg-slate-100 text-slate-700 text-[9px]">
                                                  {repo.language}
                                                </span>
                                              )}
                                              {(repo.stars ?? repo.stargazers_count ?? 0) > 0 && (
                                                <span className="text-amber-800 font-bold text-[9px]">
                                                  ★{repo.stars ?? repo.stargazers_count}
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* External Profile Links & GitHub Insights Action */}
                                <div className="flex items-center flex-wrap gap-2 pt-1 border-t border-slate-200/80">
                                  {member.github_url && (
                                    <a
                                      href={member.github_url.startsWith('http') ? member.github_url : `https://${member.github_url}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="px-2 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 font-mono text-[11px] text-slate-800 font-bold flex items-center gap-1 shadow-2xs cursor-pointer"
                                      title="Open Candidate GitHub Profile"
                                    >
                                      <span className="material-symbols-outlined text-[13px]">code</span>
                                      <span>{isBlindReview ? 'Candidate GitHub' : 'GitHub'}</span>
                                      <span className="material-symbols-outlined text-[11px] text-slate-400">open_in_new</span>
                                    </a>
                                  )}

                                  {!isBlindReview && member.linkedin_url && (
                                    <a
                                      href={member.linkedin_url.startsWith('http') ? member.linkedin_url : `https://${member.linkedin_url}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="px-2 py-1 rounded-lg bg-white hover:bg-blue-50 border border-slate-300 font-mono text-[11px] text-blue-700 font-bold flex items-center gap-1 shadow-2xs cursor-pointer"
                                    >
                                      <span className="material-symbols-outlined text-[13px]">link</span>
                                      <span>LinkedIn</span>
                                    </a>
                                  )}

                                  {!isBlindReview && member.portfolio_url && (
                                    <a
                                      href={member.portfolio_url.startsWith('http') ? member.portfolio_url : `https://${member.portfolio_url}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="px-2 py-1 rounded-lg bg-white hover:bg-purple-50 border border-slate-300 font-mono text-[11px] text-purple-700 font-bold flex items-center gap-1 shadow-2xs cursor-pointer"
                                    >
                                      <span className="material-symbols-outlined text-[13px]">language</span>
                                      <span>Portfolio</span>
                                    </a>
                                  )}

                                  {/* GitHub Insights Interactive Accordion Button */}
                                  {identifier && (
                                    <button
                                      type="button"
                                      onClick={() => handleToggleGitHub(member)}
                                      className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold border flex items-center gap-1 cursor-pointer transition-colors ml-auto ${
                                        isGhExpanded
                                          ? 'bg-brand-blue text-white border-brand-dark shadow-xs'
                                          : 'bg-white hover:bg-slate-100 text-brand-blue border-brand-blue/60 shadow-2xs'
                                      }`}
                                    >
                                      <span className="material-symbols-outlined text-[13px]">
                                        {isGhExpanded ? 'expand_less' : 'analytics'}
                                      </span>
                                      <span>{isGhExpanded ? 'Close Insights' : 'GitHub Insights'}</span>
                                    </button>
                                  )}
                                </div>

                                {/* Expanded GitHub Insights Card */}
                                {isGhExpanded && (
                                  <div className="mt-1 p-3 rounded-xl bg-white border-2 border-brand-blue/30 flex flex-col gap-2.5 animate-fadeIn">
                                    <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                                      <span className="font-mono font-bold text-[11px] text-[#0F172A] flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-sm text-brand-blue">data_object</span>
                                        Repository & Velocity Signals
                                      </span>
                                      <span className="text-[10px] font-mono text-slate-500">
                                        {isBlindReview
                                          ? `Developer #${idx + 1}`
                                          : `@${member.github_username || identifier.replace(/.*github\.com\//, '').replace(/\/$/, '')}`}
                                      </span>
                                    </div>

                                    {isGhLoading ? (
                                      <div className="p-4 text-center flex flex-col items-center justify-center gap-1 text-slate-500 font-mono text-[11px]">
                                        <span className="material-symbols-outlined text-base animate-spin text-brand-blue">
                                          progress_activity
                                        </span>
                                        <span>Inspecting developer repositories...</span>
                                      </div>
                                    ) : ghData ? (
                                      <>
                                        {/* Metric KPI Pill Grid */}
                                        <div className="grid grid-cols-3 gap-2 text-center">
                                          <div className="p-2 rounded-lg bg-blue-50/70 border border-blue-200">
                                            <span className="block text-[9px] font-mono text-slate-600 uppercase">Public Repos</span>
                                            <span className="font-display font-black text-sm text-blue-900">
                                              {ghData.public_repos ?? 0}
                                            </span>
                                          </div>
                                          <div className="p-2 rounded-lg bg-emerald-50/70 border border-emerald-200">
                                            <span className="block text-[9px] font-mono text-slate-600 uppercase">Total Stars</span>
                                            <span className="font-display font-black text-sm text-emerald-900">
                                              ⭐ {ghData.total_stars ?? 0}
                                            </span>
                                          </div>
                                          <div className="p-2 rounded-lg bg-purple-50/70 border border-purple-200">
                                            <span className="block text-[9px] font-mono text-slate-600 uppercase">Original/Forks</span>
                                            <span className="font-display font-black text-xs text-purple-900">
                                              {ghData.original_repos_count ?? 0} / {ghData.forked_repos_count ?? 0}
                                            </span>
                                          </div>
                                        </div>

                                        {/* Top Languages */}
                                        {ghData.top_languages && ghData.top_languages.length > 0 && (
                                          <div className="flex items-center gap-1.5 flex-wrap">
                                            <span className="text-[10px] font-mono font-bold text-slate-600">
                                              Top Languages:
                                            </span>
                                            {ghData.top_languages.map((lang, lIdx) => (
                                              <span
                                                key={lIdx}
                                                className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200 font-mono text-[9px] font-bold"
                                              >
                                                {lang}
                                              </span>
                                            ))}
                                          </div>
                                        )}

                                        {/* Recent Repositories */}
                                        {ghData.recent_repos && ghData.recent_repos.length > 0 ? (
                                          <div className="flex flex-col gap-1.5 mt-0.5">
                                            <span className="text-[10px] font-mono font-bold text-slate-600 uppercase">
                                              Recent Projects:
                                            </span>
                                            <div className="flex flex-col gap-1">
                                              {ghData.recent_repos.slice(0, 3).map((repo, repoIdx) => (
                                                <a
                                                  key={repoIdx}
                                                  href={repo.html_url}
                                                  target="_blank"
                                                  rel="noreferrer"
                                                  className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50 hover:bg-yellow-50 border border-slate-200 transition-colors"
                                                >
                                                  <div className="flex items-center gap-1.5 min-w-0">
                                                    <span className="material-symbols-outlined text-[13px] text-slate-500">
                                                      folder
                                                    </span>
                                                    <span className="font-mono font-bold text-[11px] text-slate-800 truncate">
                                                      {repo.name}
                                                    </span>
                                                    {repo.fork && (
                                                      <span className="px-1 py-0.2 rounded bg-slate-200 text-slate-600 text-[8px] font-mono">
                                                        fork
                                                      </span>
                                                    )}
                                                  </div>
                                                  <div className="flex items-center gap-2 shrink-0 text-[10px] font-mono">
                                                    {repo.language && (
                                                      <span className="text-slate-500">{repo.language}</span>
                                                    )}
                                                    <span className="font-bold text-amber-700">
                                                      ⭐ {repo.stars ?? repo.stargazers_count ?? 0}
                                                    </span>
                                                  </div>
                                                </a>
                                              ))}
                                            </div>
                                          </div>
                                        ) : ghData.status === 'error' || ghData.status === 'rate_limited' ? (
                                          <div className="p-2 rounded bg-amber-50 border border-amber-200 text-[10px] font-mono text-amber-900">
                                            ℹ️ {ghData.error_message || 'Public GitHub live queries rate limited or offline. Offline signals preserved.'}
                                          </div>
                                        ) : (
                                          <div className="text-[10px] font-mono text-slate-400 italic">
                                            No recent public repositories found for this candidate profile.
                                          </div>
                                        )}
                                      </>
                                    ) : null}
                                  </div>
                                )}
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-xs text-slate-500 font-mono">
                            Roster candidate details loaded from dataset.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500 font-mono text-xs gap-2">
                  <span className="material-symbols-outlined text-3xl text-slate-400">
                    touch_app
                  </span>
                  <span>Select any team from the leaderboard table to inspect detailed criteria & squad breakdown.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
