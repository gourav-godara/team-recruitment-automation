import { useState, useMemo } from 'react';
import { getGitHubProfile } from '../../api/client';

export default function SinglePageLeaderboard({
  teams,
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

  // Filter tabs count
  const counts = useMemo(() => {
    return {
      all: teams.length,
      shortlisted: teams.filter((t) => t.status === 'SHORTLISTED').length,
      waitlisted: teams.filter((t) => t.status === 'WAITLISTED').length,
      ineligible: teams.filter((t) => t.status === 'INELIGIBLE' || t.eligibility_status === 'DISQUALIFIED').length,
    };
  }, [teams]);

  // Filtered & sorted teams
  const filteredTeams = useMemo(() => {
    let list = [...teams];

    if (activeFilter === 'shortlisted') {
      list = list.filter((t) => t.status === 'SHORTLISTED');
    } else if (activeFilter === 'waitlisted') {
      list = list.filter((t) => t.status === 'WAITLISTED');
    } else if (activeFilter === 'ineligible') {
      list = list.filter((t) => t.status === 'INELIGIBLE' || t.eligibility_status === 'DISQUALIFIED');
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
      if (sortBy === 'score_desc') return (b.total_score || 0) - (a.total_score || 0);
      if (sortBy === 'score_asc') return (a.total_score || 0) - (b.total_score || 0);
      if (sortBy === 'name_asc') return (a.team_name || '').localeCompare(b.team_name || '');
      return (a.rank ?? 999) - (b.rank ?? 999);
    });

    return list;
  }, [teams, activeFilter, searchQuery, sortBy]);

  // Selected team object
  const selectedTeam = useMemo(() => {
    if (!selectedTeamId && teams.length > 0) return teams[0];
    return teams.find((t) => String(t.team_id) === String(selectedTeamId)) || teams[0] || null;
  }, [teams, selectedTeamId]);

  return (
    <section id="results-section" className="scroll-mt-20 flex flex-col gap-6">
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
            Transparent deterministic rankings with per-team plain-English decision reasons.
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
        <div className="flex flex-col gap-6">
          {/* Bento KPI Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-emerald-50 rounded-2xl border-3 border-[#0F172A] p-5 shadow-[4px_4px_0px_#0F172A]">
              <span className="font-mono text-xs font-bold text-emerald-800 uppercase tracking-wider">
                Shortlisted Finalists
              </span>
              <div className="flex items-baseline gap-2 my-2">
                <span className="font-display font-black text-3xl md:text-4xl text-emerald-800">
                  {counts.shortlisted}
                </span>
                <span className="text-xs font-mono font-bold text-slate-600">
                  Teams
                </span>
              </div>
              <span className="text-xs text-slate-600 font-medium">
                Advanced to final interview quota
              </span>
            </div>

            <div className="bg-amber-50 rounded-2xl border-3 border-[#0F172A] p-5 shadow-[4px_4px_0px_#0F172A]">
              <span className="font-mono text-xs font-bold text-amber-800 uppercase tracking-wider">
                Waitlisted
              </span>
              <div className="flex items-baseline gap-2 my-2">
                <span className="font-display font-black text-3xl md:text-4xl text-amber-800">
                  {counts.waitlisted}
                </span>
                <span className="text-xs font-mono font-bold text-slate-600">
                  Teams
                </span>
              </div>
              <span className="text-xs text-slate-600 font-medium">
                Eligible contenders in reserve
              </span>
            </div>

            <div className="bg-rose-50 rounded-2xl border-3 border-[#0F172A] p-5 shadow-[4px_4px_0px_#0F172A]">
              <span className="font-mono text-xs font-bold text-rose-800 uppercase tracking-wider">
                Ineligible / Disqualified
              </span>
              <div className="flex items-baseline gap-2 my-2">
                <span className="font-display font-black text-3xl md:text-4xl text-rose-800">
                  {counts.ineligible}
                </span>
                <span className="text-xs font-mono font-bold text-slate-600">
                  Teams
                </span>
              </div>
              <span className="text-xs text-slate-600 font-medium">
                Violated non-negotiable hard gates
              </span>
            </div>

            <div className="bg-blue-50 rounded-2xl border-3 border-[#0F172A] p-5 shadow-[4px_4px_0px_#0F172A]">
              <span className="font-mono text-xs font-bold text-blue-800 uppercase tracking-wider">
                Cutoff Score Floor
              </span>
              <div className="flex items-baseline gap-2 my-2">
                <span className="font-display font-black text-3xl md:text-4xl text-blue-800">
                  {runInfo?.cutoff_floor != null ? Number(runInfo.cutoff_floor).toFixed(1) : '75.0'}
                </span>
                <span className="text-xs font-mono font-bold text-slate-600">
                  / 100
                </span>
              </div>
              <span className="text-xs text-slate-600 font-medium">
                Minimum score to enter shortlist
              </span>
            </div>
          </div>

          {/* Filter Tabs & Search Controls */}
          <div className="bg-white rounded-2xl border-3 border-[#0F172A] p-4 shadow-[4px_4px_0px_#0F172A] flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto scrollbar-none">
              <button
                type="button"
                onClick={() => setActiveFilter('all')}
                className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold border-2 border-[#0F172A] transition-all cursor-pointer ${
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
                className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold border-2 border-[#0F172A] transition-all cursor-pointer ${
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
                className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold border-2 border-[#0F172A] transition-all cursor-pointer ${
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
                className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold border-2 border-[#0F172A] transition-all cursor-pointer ${
                  activeFilter === 'ineligible'
                    ? 'bg-rose-600 text-white shadow-[2px_2px_0px_#0F172A]'
                    : 'bg-white text-slate-700 hover:bg-rose-50'
                }`}
              >
                Ineligible ({counts.ineligible})
              </button>
            </div>

            {/* Search & Sort & Blind Review Toggle */}
            <div className="flex items-center flex-wrap gap-2.5 w-full md:w-auto">
              {/* Anti-Bias Blind Review Toggle */}
              {onToggleBlindReview && (
                <button
                  type="button"
                  onClick={onToggleBlindReview}
                  className={`py-1.5 px-3 rounded-xl border-2 border-[#0F172A] font-mono text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                    isBlindReview
                      ? 'bg-purple-600 text-white shadow-[2px_2px_0px_#0F172A]'
                      : 'bg-white hover:bg-purple-50 text-purple-950 shadow-[1px_1px_0px_#0F172A]'
                  }`}
                  title="Toggle Blind Review Mode to mask identities and prevent unconscious bias"
                >
                  <span className="material-symbols-outlined text-sm font-bold">
                    {isBlindReview ? 'visibility_off' : 'visibility'}
                  </span>
                  <span>Blind Review: {isBlindReview ? 'ON' : 'OFF'}</span>
                </button>
              )}

              <div className="relative flex-1 md:w-60">
                <input
                  type="text"
                  placeholder="Search team or candidate..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border-2 border-[#0F172A] font-sans text-xs focus:bg-yellow-50 focus:outline-none"
                />
                <span className="material-symbols-outlined absolute left-2.5 top-2 text-slate-400 text-base">
                  search
                </span>
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="py-1.5 px-3 rounded-xl border-2 border-[#0F172A] font-mono text-xs font-bold bg-white focus:outline-none cursor-pointer"
              >
                <option value="rank_asc">Rank (1 to N)</option>
                <option value="score_desc">Score (Highest)</option>
                <option value="score_asc">Score (Lowest)</option>
                <option value="name_asc">Team Name (A-Z)</option>
              </select>
            </div>
          </div>

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

          {/* 2-Column Split: Leaderboard Table on Left, Inspection Drawer on Right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Ranked Table */}
            <div className="lg:col-span-7 bg-white rounded-2xl border-3 border-[#0F172A] shadow-[5px_5px_0px_#0F172A] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b-2 border-[#0F172A] text-xs font-mono font-bold text-slate-700">
                      <th className="p-3 w-14 text-center">Rank</th>
                      <th className="p-3">Team</th>
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
                        const isShortlisted = team.status === 'SHORTLISTED';
                        const isIneligible = team.status === 'INELIGIBLE' || team.eligibility_status === 'DISQUALIFIED';

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
                            {/* Rank */}
                            <td className="p-3 text-center">
                              <span
                                className={`inline-flex items-center justify-center w-7 h-7 rounded-lg font-mono font-black text-xs border-2 border-[#0F172A] ${
                                  team.rank === 1
                                    ? 'bg-amber-300 text-amber-900 shadow-[2px_2px_0px_#0F172A]'
                                    : team.rank === 2
                                    ? 'bg-slate-300 text-slate-900 shadow-[2px_2px_0px_#0F172A]'
                                    : team.rank === 3
                                    ? 'bg-amber-600 text-white shadow-[2px_2px_0px_#0F172A]'
                                    : 'bg-white text-slate-700'
                                }`}
                              >
                                #{team.rank ?? idx + 1}
                              </span>
                            </td>

                            {/* Team Name & Size */}
                            <td className="p-3">
                              <div className="font-display font-bold text-sm text-[#0F172A]">
                                {getDisplayTeamName(team, idx)}
                              </div>
                              <span className="text-[11px] font-mono text-slate-500">
                                {team.team_size || (team.members ? team.members.length : 3)} Members
                              </span>
                            </td>

                            {/* Status Badge */}
                            <td className="p-3">
                              <span
                                className={`px-2.5 py-1 rounded-full font-mono font-bold text-[10px] border border-[#0F172A] ${
                                  isShortlisted
                                    ? 'bg-emerald-100 text-emerald-900'
                                    : isIneligible
                                    ? 'bg-rose-100 text-rose-900'
                                    : 'bg-amber-100 text-amber-900'
                                }`}
                              >
                                {isShortlisted ? '● SHORTLISTED' : isIneligible ? '✕ INELIGIBLE' : '◌ WAITLIST'}
                              </span>
                            </td>

                            {/* Score Bar */}
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <div className="w-16 bg-slate-200 rounded-full h-2 overflow-hidden border border-slate-400">
                                  <div
                                    className={`h-full ${
                                      isShortlisted
                                        ? 'bg-emerald-500'
                                        : isIneligible
                                        ? 'bg-rose-400'
                                        : 'bg-amber-500'
                                    }`}
                                    style={{ width: `${Math.min(100, team.total_score || 0)}%` }}
                                  ></div>
                                </div>
                                <span className="font-mono font-black text-xs text-[#0F172A]">
                                  {Number(team.total_score || 0).toFixed(1)}
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
                                  className="px-2 py-1 bg-white hover:bg-yellow-100 rounded-lg border border-[#0F172A] font-mono font-bold text-[11px] shadow-[1px_1px_0px_#0F172A]"
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
                                    className="px-2 py-1 bg-white hover:bg-blue-50 text-brand-blue rounded-lg border border-[#0F172A] font-mono font-bold text-[11px] shadow-[1px_1px_0px_#0F172A]"
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
            </div>

            {/* Right: Team Inspection Drawer */}
            <div className="lg:col-span-5 bg-white rounded-2xl border-3 border-[#0F172A] p-6 shadow-[5px_5px_0px_#0F172A] flex flex-col gap-4 sticky top-24">
              {selectedTeam ? (
                <>
                  {/* Header */}
                  <div className="flex items-start justify-between pb-3 border-b-2 border-slate-200">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-xs px-2 py-0.5 rounded bg-brand-yellow border border-[#0F172A]">
                          Rank #{selectedTeam.rank}
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
                      </div>
                      <h3 className="font-display font-black text-xl text-[#0F172A] mt-1">
                        {getDisplayTeamName(selectedTeam, 0)}
                      </h3>
                      <span className="text-[11px] font-mono text-slate-500">
                        {selectedTeam.team_size || (selectedTeam.members ? selectedTeam.members.length : 1)} Registered Candidate{selectedTeam.team_size !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-mono font-bold text-slate-500 uppercase block">
                        Composite Score
                      </span>
                      <span className="font-display font-black text-2xl text-brand-blue">
                        {Number(selectedTeam.total_score || 0).toFixed(1)}
                        <span className="text-xs text-slate-400">/100</span>
                      </span>
                    </div>
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

                  {/* Score Breakdown Bars */}
                  <div className="flex flex-col gap-2">
                    <span className="font-mono font-bold text-xs text-slate-700 uppercase">
                      Criteria Score Breakdown:
                    </span>
                    {selectedTeam.score_details?.map((item, idx) => (
                      <div key={idx} className="flex flex-col gap-1">
                        <div className="flex justify-between text-xs font-sans">
                          <span className="text-slate-600 font-medium">{item.label}</span>
                          <span className="font-mono font-bold text-[#0F172A]">{item.raw_value}</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                          <div
                            className="bg-brand-blue h-full transition-all duration-300"
                            style={{
                              width: `${Math.min(100, Math.max(8, item.percentage ?? ((Number(item.weighted_score) || 5) * 5)))}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Candidate Roster & Individual Member Scoring */}
                  <div className="flex flex-col gap-2 pt-2 border-t border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-slate-700 uppercase">
                        Candidate Roster & Member Scoring ({selectedTeam.members?.length || 0}):
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {isBlindReview ? 'Identities Anonymized' : 'Independent Candidate Breakdown'}
                      </span>
                    </div>

                    <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-1">
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
                                  {member.score != null ? (
                                    <span
                                      className={`px-2 py-0.5 rounded-lg font-mono font-black text-xs border border-[#0F172A] ${
                                        member.score >= 75
                                          ? 'bg-emerald-200 text-emerald-950'
                                          : member.score >= 50
                                          ? 'bg-amber-200 text-amber-950'
                                          : 'bg-rose-200 text-rose-950'
                                      }`}
                                      title="Individual Candidate Composite Score"
                                    >
                                      {member.score.toFixed(1)} / 100
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-lg font-mono font-bold text-[10px] bg-slate-200 text-slate-700">
                                      Score: N/A
                                    </span>
                                  )}

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
                                    : 'Exp: Not specified'}
                                </span>

                                {/* Source attribution */}
                                <span
                                  className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold border ${
                                    member.experience_source === 'Declared in CSV'
                                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                                      : member.experience_source?.includes('Inferred')
                                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                                      : 'bg-slate-100 text-slate-600 border-slate-200'
                                  }`}
                                  title="Source of experience metric"
                                >
                                  {member.experience_source === 'Declared in CSV' ? '📄 Declared in CSV' : member.experience_source?.includes('Inferred') ? '⚡ Inferred from Skills' : '⚪ Not provided'}
                                </span>

                                {!isBlindReview && member.declared_gender && (
                                  <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 font-mono text-[10px]">
                                    Gender: {member.declared_gender}
                                  </span>
                                )}
                              </div>

                              {/* Technical Skills Tags */}
                              {member.skills && member.skills.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-0.5">
                                  {member.skills.slice(0, 5).map((sk, sIdx) => (
                                    <span
                                      key={sIdx}
                                      className="px-1.5 py-0.5 rounded bg-white text-slate-700 border border-slate-300 font-mono text-[10px]"
                                    >
                                      {sk}
                                    </span>
                                  ))}
                                  {member.skills.length > 5 && (
                                    <span className="text-[10px] font-mono text-slate-500 self-center">
                                      +{member.skills.length - 5} more
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* External Profile Links & GitHub Insights Action */}
                              <div className="flex items-center flex-wrap gap-2 pt-1 border-t border-slate-200/80">
                                {!isBlindReview ? (
                                  <>
                                    {member.github_url && (
                                      <a
                                        href={member.github_url.startsWith('http') ? member.github_url : `https://${member.github_url}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="px-2 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 font-mono text-[11px] text-slate-800 font-bold flex items-center gap-1 shadow-2xs"
                                      >
                                        <span className="material-symbols-outlined text-[13px]">code</span>
                                        <span>GitHub</span>
                                        <span className="material-symbols-outlined text-[11px] text-slate-400">open_in_new</span>
                                      </a>
                                    )}

                                    {member.linkedin_url && (
                                      <a
                                        href={member.linkedin_url.startsWith('http') ? member.linkedin_url : `https://${member.linkedin_url}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="px-2 py-1 rounded-lg bg-white hover:bg-blue-50 border border-slate-300 font-mono text-[11px] text-blue-700 font-bold flex items-center gap-1 shadow-2xs"
                                      >
                                        <span className="material-symbols-outlined text-[13px]">link</span>
                                        <span>LinkedIn</span>
                                      </a>
                                    )}

                                    {member.portfolio_url && (
                                      <a
                                        href={member.portfolio_url.startsWith('http') ? member.portfolio_url : `https://${member.portfolio_url}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="px-2 py-1 rounded-lg bg-white hover:bg-purple-50 border border-slate-300 font-mono text-[11px] text-purple-700 font-bold flex items-center gap-1 shadow-2xs"
                                      >
                                        <span className="material-symbols-outlined text-[13px]">language</span>
                                        <span>Portfolio</span>
                                      </a>
                                    )}
                                  </>
                                ) : (
                                  <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-900 border border-purple-200 font-mono text-[10px] flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[11px]">lock</span>
                                    <span>Direct links redacted in Blind Review</span>
                                  </span>
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
                                                    ⭐ {repo.stargazers_count || 0}
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
                </>
              ) : (
                <div className="p-8 text-center text-slate-500 font-mono text-xs">
                  Select a team from the table to inspect details.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
