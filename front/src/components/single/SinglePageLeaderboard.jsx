import { useState, useMemo } from 'react';

export default function SinglePageLeaderboard({
  teams,
  runInfo,
  selectedTeamId,
  onSelectTeam,
  onSelectForCompare,
  onExportCsv,
}) {
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'shortlisted' | 'waitlisted' | 'ineligible'
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('rank_asc');

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

            {/* Search & Sort */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
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
                                {team.team_name}
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
                              : selectedTeam.status === 'INELIGIBLE'
                              ? 'bg-rose-100 text-rose-900'
                              : 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          {selectedTeam.status}
                        </span>
                      </div>
                      <h3 className="font-display font-black text-xl text-[#0F172A] mt-1">
                        {selectedTeam.team_name}
                      </h3>
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
                  <div className="p-3.5 bg-yellow-50 rounded-xl border-2 border-yellow-400">
                    <span className="font-mono font-bold text-xs text-yellow-900 block mb-1">
                      Plain-English Decision Reason:
                    </span>
                    <p className="text-xs font-sans text-slate-800 leading-relaxed font-medium">
                      {selectedTeam.explanation ||
                        (selectedTeam.status === 'SHORTLISTED'
                          ? `Ranked #${selectedTeam.rank} with a composite score of ${selectedTeam.total_score}. Satisfied all eligibility rules (team size, GitHub verification) and fell within the top quota.`
                          : selectedTeam.status === 'INELIGIBLE'
                          ? `Disqualified by eligibility gates: ${selectedTeam.disqualification_reason || 'Roster criteria not met.'}`
                          : `Eligible with a score of ${selectedTeam.total_score}, placed on reserve waitlist below the shortlist cutoff.`)}
                    </p>
                  </div>

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
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-brand-blue h-full"
                            style={{
                              width: `${Math.min(100, (Number(item.weighted_score) || 5) * 5)}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Candidate Roster */}
                  <div className="flex flex-col gap-2 pt-2 border-t border-slate-200">
                    <span className="font-mono font-bold text-xs text-slate-700 uppercase">
                      Candidate Roster ({selectedTeam.members?.length || 0} Members):
                    </span>
                    <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                      {selectedTeam.members && selectedTeam.members.length > 0 ? (
                        selectedTeam.members.map((member, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                          >
                            <div className="flex flex-col">
                              <span className="font-display font-bold text-slate-800">
                                {member.name || `Candidate ${idx + 1}`}
                              </span>
                              <span className="font-mono text-[10px] text-slate-500">
                                {member.experience_years != null ? `${member.experience_years} yrs exp` : ''}
                                {member.declared_gender ? ` • Gender: ${member.declared_gender}` : ''}
                              </span>
                            </div>
                            {member.github_url && (
                              <a
                                href={member.github_url.startsWith('http') ? member.github_url : `https://${member.github_url}`}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2 py-0.5 rounded bg-white hover:bg-slate-200 border border-slate-300 font-mono text-[11px] text-brand-blue font-bold flex items-center gap-1"
                              >
                                <span>GitHub</span>
                                <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                              </a>
                            )}
                          </div>
                        ))
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
