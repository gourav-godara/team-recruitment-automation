import { Fragment } from 'react';

export default function RankedTableContainer({
  teams,
  selectedTeamId,
  onSelectTeam,
  topQuota = 5,
  cutoffScore = 75.0,
}) {
  if (!teams || teams.length === 0) {
    return (
      <div className="bg-surface-container-lowest rounded-xl border-2 border-[#0f172a] shadow-[4px_4px_0px_#0f172a] p-12 text-center flex flex-col items-center justify-center gap-3">
        <span className="material-symbols-outlined text-5xl text-slate-400">
          search_off
        </span>
        <h3 className="font-display font-bold text-xl text-brand-dark">
          No teams match the current filter
        </h3>
        <p className="font-sans text-sm text-slate-600 max-w-md">
          Try adjusting your search query or switching between the Shortlisted, Waitlisted, and Ineligible tabs.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-surface-container-lowest rounded-xl border-2 border-[#0f172a] shadow-[4px_4px_0px_#0f172a] overflow-hidden">
      {/* Table Header */}
      <div className="bg-[#0f172a] text-white px-4 py-3 flex items-center justify-between font-mono text-xs font-bold tracking-wider uppercase">
        <div className="w-14">Rank</div>
        <div className="flex-1 min-w-0 pr-4">Team &amp; Candidates</div>
        <div className="w-24 text-center hidden md:block">Team Size</div>
        <div className="w-32 text-right pr-4">Total Score</div>
        <div className="w-36 text-center">Status</div>
        <div className="w-24 text-right">Details</div>
      </div>

      {/* Table Body Rows */}
      <div className="divide-y-2 divide-[#0f172a]/10 font-sans text-sm">
        {teams.map((team, index) => {
          const isSelected = String(team.team_id) === String(selectedTeamId);
          const prevTeam = index > 0 ? teams[index - 1] : null;

          // Shortlist quota boundary indicator
          const isCutoffBoundary =
            prevTeam &&
            prevTeam.rank != null &&
            team.rank != null &&
            prevTeam.rank <= topQuota &&
            team.rank > topQuota;

          const isShortlisted =
            team.status === 'SHORTLISTED' ||
            (team.rank != null && team.rank <= topQuota && team.eligibility_status !== 'DISQUALIFIED');
          const isIneligible =
            team.eligibility_status === 'DISQUALIFIED' ||
            team.status === 'DISQUALIFIED' ||
            team.status === 'INELIGIBLE';

          return (
            <Fragment key={team.team_id || index}>
              {/* Shortlist Quota Cutoff Horizon */}
              {isCutoffBoundary && (
                <div className="bg-brand-yellow text-brand-dark border-y-2 border-[#0f172a] px-4 py-2 flex items-center justify-between shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] font-mono text-xs font-black">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm font-black">
                      horizontal_rule
                    </span>
                    <span>TOP {topQuota} SHORTLIST CUTOFF LINE</span>
                  </div>
                  <span className="px-2 py-0.5 bg-[#0f172a] text-white rounded text-[11px]">
                    Cutoff: {Number(cutoffScore).toFixed(1)} pts
                  </span>
                </div>
              )}

              {/* Table Row */}
              <div
                onClick={() => onSelectTeam(team)}
                className={`p-3.5 sm:px-4 flex items-center justify-between gap-3 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-amber-100/80 border-l-8 border-l-brand-blue'
                    : isIneligible
                    ? 'bg-rose-50/50 hover:bg-rose-50'
                    : isShortlisted
                    ? 'hover:bg-emerald-50/40'
                    : 'hover:bg-slate-50'
                }`}
              >
                {/* Rank Number */}
                <div className="w-14 font-mono font-extrabold text-base sm:text-lg">
                  {team.rank != null ? (
                    <span
                      className={`px-2 py-0.5 rounded border border-[#0f172a] shadow-[1px_1px_0px_#0f172a] ${
                        isShortlisted
                          ? 'bg-emerald-200 text-emerald-900'
                          : isIneligible
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-white text-slate-800'
                      }`}
                    >
                      #{String(team.rank).padStart(2, '0')}
                    </span>
                  ) : (
                    <span className="text-slate-400 font-normal">--</span>
                  )}
                </div>

                {/* Team Name & Candidates */}
                <div className="flex-1 min-w-0 pr-4">
                  <div className="font-display font-extrabold text-base text-brand-dark truncate">
                    {team.team_name}
                  </div>
                  {/* Candidate names or description */}
                  <div className="text-xs text-slate-600 truncate mt-0.5 font-medium">
                    {team.members_summary || team.description || `Team ID: ${team.external_id || team.team_id}`}
                  </div>
                  {/* Human readable decision explanation snippet */}
                  {team.explanation && (
                    <div className="text-[11px] text-slate-500 font-sans italic truncate mt-0.5">
                      💡 {team.explanation}
                    </div>
                  )}
                </div>

                {/* Team Size */}
                <div className="w-24 text-center hidden md:block font-mono text-xs text-slate-600 font-semibold">
                  {team.team_size || 3} members
                </div>

                {/* Total Score */}
                <div className="w-32 text-right pr-4">
                  <div className="font-mono font-black text-lg text-brand-dark">
                    {team.total_score != null ? Number(team.total_score).toFixed(1) : 'N/A'}
                    <span className="text-xs font-normal text-slate-500 ml-0.5">/100</span>
                  </div>
                  {team.total_score != null && (
                    <div className="w-full bg-slate-200 rounded-full h-1.5 mt-1 overflow-hidden">
                      <div
                        className={`h-full ${
                          isShortlisted ? 'bg-emerald-500' : isIneligible ? 'bg-rose-400' : 'bg-brand-blue'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(0, team.total_score))}%` }}
                      ></div>
                    </div>
                  )}
                </div>

                {/* Status Badge */}
                <div className="w-36 text-center">
                  <span
                    className={`px-3 py-1 rounded-full border border-[#0f172a] text-xs font-bold uppercase tracking-wide inline-flex items-center gap-1 shadow-[1px_1px_0px_#0f172a] ${
                      isShortlisted
                        ? 'bg-emerald-100 text-emerald-800'
                        : isIneligible
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    <span className="material-symbols-outlined text-xs font-bold">
                      {isShortlisted ? 'check_circle' : isIneligible ? 'cancel' : 'hourglass_bottom'}
                    </span>
                    <span>{isShortlisted ? 'SHORTLISTED' : isIneligible ? 'INELIGIBLE' : 'WAITLISTED'}</span>
                  </span>
                </div>

                {/* Action button */}
                <div className="w-24 text-right">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectTeam(team);
                    }}
                    className="px-2.5 py-1 bg-white hover:bg-brand-yellow text-brand-dark rounded border border-[#0f172a] font-mono text-xs font-bold shadow-[1px_1px_0px_#0f172a] transition-all cursor-pointer"
                  >
                    Inspect
                  </button>
                </div>
              </div>
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
