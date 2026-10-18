import { Fragment } from 'react';

export default function RankedTableContainer({
  teams,
  selectedTeamId,
  onSelectTeam,
  topQuota = 40,
  cutoffScore = 84.60,
  page = 1,
  totalPages = 12,
  onPageChange,
}) {
  return (
    <div className="bg-surface-container-lowest rounded-xl border-2 border-[#0f172a] shadow-[4px_4px_0px_#0f172a] overflow-hidden">
      {/* Table Header */}
      <div className="bg-[#0f172a] text-on-primary px-4 py-3 flex items-center justify-between font-label-md text-label-md font-bold tracking-wider uppercase">
        <div className="w-12 sm:w-16">Rank</div>
        <div className="flex-1 min-w-0">Project &amp; Track</div>
        <div className="w-32 hidden sm:block text-right">Vectors (T/R/P/V)</div>
        <div className="w-24 text-right">Total Score</div>
        <div className="w-36 text-right pr-2">Status Flag</div>
      </div>

      {/* Table Body Rows */}
      <div className="divide-y-2 divide-[#0f172a]/10 font-body-sm text-body-sm">
        {teams.map((team, index) => {
          const isSelected = team.team_id === selectedTeamId;
          const prevTeam = index > 0 ? teams[index - 1] : null;
          const isCutoffBoundary =
            prevTeam && prevTeam.rank <= topQuota && team.rank > topQuota;

          const isBubble = team.status_type === 'bubble';
          const isExcluded = team.status_type === 'excluded';
          const isWaitlist = team.status_type === 'waitlist';

          return (
            <Fragment key={team.team_id}>
              {/* Critical Cutoff Demarcation Horizon */}
              {isCutoffBoundary && (
                <div className="bg-secondary-fixed text-on-secondary-fixed border-y-4 border-[#0f172a] px-4 py-2 flex items-center justify-between shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]">
                  <div className="flex items-center gap-2 font-label-lg text-label-lg uppercase tracking-wider font-black">
                    <span className="material-symbols-outlined font-black">block</span>
                    <span>TOP {topQuota} FINALIST QUOTA HORIZON // CUTOFF SCORE {cutoffScore.toFixed(2)}</span>
                  </div>
                  <span className="font-mono font-label-sm text-label-sm px-2 py-0.5 bg-[#0f172a] text-on-primary rounded font-bold shadow-[1px_1px_0px_#0f172a]">
                    DELTA FLOOR -0.00
                  </span>
                </div>
              )}

              {/* Virtualized Gap Indicator between top few and cutoff boundary if gap exists */}
              {prevTeam && team.rank - prevTeam.rank > 5 && (
                <div className="bg-surface-container-low/60 px-4 py-2 flex items-center justify-center gap-2 text-on-surface-variant font-mono font-label-sm text-label-sm">
                  <span className="material-symbols-outlined text-sm">unfold_more</span>
                  <span>... Virtualized Consensus Window (#{prevTeam.rank + 1} through #{team.rank - 1}) ...</span>
                </div>
              )}

              {/* Table Row */}
              <div
                onClick={() => onSelectTeam(team)}
                className={`p-3 sm:px-4 flex items-center justify-between gap-2 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-secondary-fixed/30 hover:bg-secondary-fixed/50 border-l-8 border-l-primary-container'
                    : isBubble
                    ? 'bg-secondary-fixed/20 hover:bg-secondary-fixed/40 border-2 border-[#f59e0b]'
                    : isExcluded
                    ? 'bg-error-container/30 hover:bg-error-container/50 opacity-80'
                    : isWaitlist
                    ? 'bg-surface-container-low/80 hover:bg-surface-container-high opacity-85'
                    : 'hover:bg-surface-container-low'
                }`}
              >
                {/* Rank Number */}
                <div className="w-12 sm:w-16 font-mono font-headline-sm text-headline-sm font-extrabold">
                  <span
                    className={
                      isExcluded
                        ? 'text-error'
                        : isWaitlist
                        ? 'text-outline'
                        : 'text-on-surface'
                    }
                  >
                    #{String(team.rank).padStart(2, '0')}
                  </span>
                </div>

                {/* Project & Track */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-headline-sm text-headline-sm font-bold truncate ${
                        isExcluded ? 'text-on-surface line-through' : 'text-on-surface'
                      }`}
                    >
                      {team.team_name}
                    </span>
                    {team.is_verified && (
                      <span
                        className="material-symbols-outlined text-primary-container text-base font-bold"
                        title="Jury Verified"
                      >
                        verified
                      </span>
                    )}
                    {isBubble && (
                      <span
                        className="material-symbols-outlined text-[#f59e0b] text-base font-bold"
                        title="Bubble Vulnerability"
                      >
                        warning
                      </span>
                    )}
                    {isWaitlist && (
                      <span className="font-label-sm text-label-sm px-1.5 py-0.2 bg-outline-variant text-on-surface rounded font-mono font-bold">
                        WAITLIST #{team.waitlist_number}
                      </span>
                    )}
                  </div>
                  <div
                    className={`flex items-center gap-2 font-label-sm text-label-sm ${
                      isExcluded ? 'text-error font-bold' : 'text-on-surface-variant'
                    }`}
                  >
                    <span className="uppercase font-bold tracking-wide">{team.track}</span>
                    <span>•</span>
                    <span className="font-mono">
                      {isExcluded ? team.exclusion_reason : team.external_id}
                    </span>
                  </div>
                </div>

                {/* Vectors (T/R/P/V) */}
                <div className="w-32 hidden sm:flex flex-col items-end font-mono font-label-sm text-label-sm text-on-surface-variant">
                  <span>
                    {team.raw_vectors.tech.toFixed(1)} / {team.raw_vectors.repo.toFixed(1)}
                  </span>
                  <span>
                    {team.raw_vectors.pitch.toFixed(1)} / {team.raw_vectors.velocity.toFixed(1)}
                  </span>
                </div>

                {/* Total Score */}
                <div className="w-24 text-right">
                  <div
                    className={`font-tabular-score text-tabular-score font-extrabold ${
                      isSelected
                        ? 'text-primary-container'
                        : isExcluded
                        ? 'text-error'
                        : 'text-on-surface'
                    }`}
                  >
                    {team.total_score.toFixed(2)}
                  </div>
                  {team.delta_pts && (
                    <span className="text-xs font-mono text-error font-bold">
                      {team.delta_pts > 0 ? `+${team.delta_pts}` : team.delta_pts} pts
                    </span>
                  )}
                </div>

                {/* Status Flag */}
                <div className="w-36 flex justify-end">
                  {team.status_type === 'locked' && (
                    <span className="px-2.5 py-1 rounded-full bg-[#10b981] text-on-primary border-2 border-[#0f172a] shadow-[2px_2px_0px_#0f172a] font-label-sm text-label-sm whitespace-nowrap font-black">
                      {team.status}
                    </span>
                  )}
                  {team.status_type === 'solid' && (
                    <span className="px-2.5 py-1 rounded-full bg-primary-container text-on-primary-container border-2 border-[#0f172a] shadow-[2px_2px_0px_#0f172a] font-label-sm text-label-sm whitespace-nowrap font-bold">
                      {team.status}
                    </span>
                  )}
                  {team.status_type === 'bubble' && (
                    <span className="px-2.5 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed border-2 border-[#0f172a] shadow-[2px_2px_0px_#0f172a] font-label-sm text-label-sm whitespace-nowrap font-extrabold flex items-center gap-1">
                      <span>{team.status}</span>
                    </span>
                  )}
                  {team.status_type === 'waitlist' && (
                    <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface border border-[#0f172a] font-label-sm text-label-sm whitespace-nowrap font-bold">
                      {team.status}
                    </span>
                  )}
                  {team.status_type === 'excluded' && (
                    <span className="px-2 py-0.5 rounded-full bg-error text-on-error border border-[#0f172a] font-label-sm text-label-sm whitespace-nowrap font-bold">
                      {team.status}
                    </span>
                  )}
                </div>
              </div>
            </Fragment>
          );
        })}
      </div>

      {/* Table Footer Summary */}
      <div className="bg-surface-container-low px-4 py-3 flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant border-t-2 border-[#0f172a]">
        <span className="font-mono">
          Displaying window: Ranks #1 - #{teams[teams.length - 1]?.rank || 42} (Indexed consensus cache)
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="px-2 py-1 bg-surface-container rounded border border-[#0f172a] hover:bg-surface-container-high font-bold cursor-pointer disabled:opacity-50"
          >
            ← Prev
          </button>
          <span className="font-mono font-bold text-on-surface">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="px-2 py-1 bg-surface-container rounded border border-[#0f172a] hover:bg-surface-container-high font-bold cursor-pointer disabled:opacity-50"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
