import { useState, Fragment } from 'react';

export default function ShortlistShiftPreviewTable({
  teams,
  topQuota = 40,
  curveType = 'z_score',
  onSelectTeam,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState('bubble'); // 'bubble' | 'all'

  const filteredTeams = teams.filter((t) => {
    const matchesSearch =
      t.team_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.external_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.track.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (filterMode === 'bubble') {
      // Show ranks within +/- 3 of quota cutoff
      return t.simulatedRank >= topQuota - 3 && t.simulatedRank <= topQuota + 3;
    }
    return true;
  });

  return (
    <section className="bg-surface-container-lowest p-space-lg rounded-xl border-2 border-[#0f172a] shadow-[4px_4px_0px_#0f172a] flex flex-col gap-space-md">
      {/* Section Title & Status Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm border-b-2 border-surface-container pb-space-md">
        <div className="flex items-center gap-space-sm">
          <div className="w-8 h-8 rounded-lg bg-secondary-fixed border-2 border-[#0f172a] flex items-center justify-center font-bold text-on-secondary-fixed shadow-[2px_2px_0px_#0f172a]">
            <span className="material-symbols-outlined text-sm">compare_arrows</span>
          </div>
          <div>
            <h2 className="font-headline-sm text-headline-sm text-on-surface tracking-tight">
              Live Shortlist Shift Preview
            </h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Real-time simulation of rank displacement around the Top {topQuota} boundary.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-space-xs">
          <span className="font-label-sm text-label-sm uppercase px-2.5 py-1 bg-surface-container-high text-on-surface font-extrabold rounded border border-[#0f172a]">
            SIMULATION ENGINE: ACTIVE
          </span>
          <span className="font-label-sm text-label-sm px-2.5 py-1 bg-secondary-fixed text-on-secondary-fixed font-mono font-bold rounded border border-[#0f172a] shadow-[1px_1px_0px_#0f172a]">
            BUBBLE ZONE: POS {topQuota - 2} - {topQuota + 3}
          </span>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFilterMode('bubble')}
            className={`px-3 py-1.5 rounded-lg border-2 border-[#0f172a] font-label-md text-label-md font-bold transition-all cursor-pointer ${
              filterMode === 'bubble'
                ? 'bg-secondary-fixed text-on-secondary-fixed shadow-[2px_2px_0px_#0f172a]'
                : 'bg-surface-container-low text-on-surface hover:bg-surface-container-high'
            }`}
          >
            Boundary Bubble (Pos {topQuota - 2}..{topQuota + 3})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-lg border-2 border-[#0f172a] font-label-md text-label-md font-bold transition-all cursor-pointer ${
              filterMode === 'all'
                ? 'bg-secondary-fixed text-on-secondary-fixed shadow-[2px_2px_0px_#0f172a]'
                : 'bg-surface-container-low text-on-surface hover:bg-surface-container-high'
            }`}
          >
            All Simulated ({teams.length} Teams)
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-sm">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search candidate teams..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-surface-container-low border-2 border-[#0f172a] text-sm text-on-surface placeholder-on-surface-variant focus:outline-none focus:bg-white shadow-[2px_2px_0px_#0f172a]"
          />
        </div>
      </div>

      {/* Bubble Teams Dynamic Matrix Table */}
      <div className="overflow-x-auto rounded-lg border-2 border-[#0f172a] shadow-[3px_3px_0px_#0f172a]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#0f172a] text-on-primary">
              <th className="py-3 px-4 font-label-md text-label-md uppercase tracking-wider">
                Simulated Rank
              </th>
              <th className="py-3 px-4 font-label-md text-label-md uppercase tracking-wider">
                Team / Project
              </th>
              <th className="py-3 px-4 font-label-md text-label-md uppercase tracking-wider">
                Track
              </th>
              <th className="py-3 px-4 font-label-md text-label-md uppercase tracking-wider">
                Raw Score
              </th>
              <th className="py-3 px-4 font-label-md text-label-md uppercase tracking-wider">
                Weighted ({curveType === 'z_score' ? 'Z-Score' : 'Min-Max'})
              </th>
              <th className="py-3 px-4 font-label-md text-label-md uppercase tracking-wider">
                Displacement
              </th>
              <th className="py-3 px-4 font-label-md text-label-md uppercase tracking-wider text-right">
                Quota Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-surface-container font-body-sm text-body-sm">
            {filteredTeams.map((team, idx) => {
              const prevTeam = idx > 0 ? filteredTeams[idx - 1] : null;
              const shouldRenderCutoffBeforeThisRow =
                prevTeam && prevTeam.simulatedRank <= topQuota && team.simulatedRank > topQuota;

              return (
                <Fragment key={team.team_id}>
                  {shouldRenderCutoffBeforeThisRow && (
                    <tr className="bg-primary-container text-on-primary-container border-y-2 border-[#0f172a]">
                      <td
                        colSpan={7}
                        className="py-2 px-4 font-label-sm text-label-sm uppercase font-black tracking-widest text-center shadow-inner"
                      >
                        ——— • TOP {topQuota} SHORTLIST CUTOFF LINE (8.3% QUOTA HORIZON) • ———
                      </td>
                    </tr>
                  )}
                  <tr
                    onClick={() => onSelectTeam && onSelectTeam(team)}
                    className={`transition-colors cursor-pointer group ${
                      team.simulatedRank <= topQuota
                        ? 'bg-surface-container-lowest hover:bg-[#fef08a]'
                        : 'bg-surface-container-low hover:bg-[#fef08a] opacity-90'
                    }`}
                    title="Click to inspect scoring vector breakdown"
                  >
                  {/* Simulated Rank */}
                  <td className="py-3.5 px-4 font-tabular-score text-tabular-score font-black">
                    <span
                      className={
                        team.simulatedRank <= topQuota ? 'text-on-surface' : 'text-error'
                      }
                    >
                      #{team.simulatedRank}
                    </span>
                  </td>

                  {/* Team / Project */}
                  <td className="py-3.5 px-4">
                    <div className="font-headline-sm text-sm font-bold text-on-surface group-hover:text-primary transition-colors flex items-center gap-1.5">
                      <span>{team.team_name}</span>
                      <span className="material-symbols-outlined text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                        open_in_new
                      </span>
                    </div>
                    <div className="font-body-sm text-xs text-on-surface-variant font-mono">
                      ID: {team.external_id} • {team.contributors} contributors
                    </div>
                  </td>

                  {/* Track */}
                  <td className="py-3.5 px-4">
                    <span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface border border-[#0f172a] font-bold">
                      {team.track}
                    </span>
                  </td>

                  {/* Raw Score */}
                  <td className="py-3.5 px-4 font-mono font-bold text-on-surface">
                    {team.rawScore} / 100
                  </td>

                  {/* Weighted Score */}
                  <td className="py-3.5 px-4 font-mono font-black text-primary text-base">
                    {team.weightedScore.toFixed(2)}
                  </td>

                  {/* Displacement Badge */}
                  <td className="py-3.5 px-4">
                    {team.displacementType === 'positive' && (
                      <span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-[#10b981] text-on-primary border border-[#0f172a] font-bold inline-flex items-center gap-0.5 shadow-[1px_1px_0px_#0f172a]">
                        <span className="material-symbols-outlined text-xs">arrow_upward</span>
                        {team.displacementLabel}
                      </span>
                    )}
                    {team.displacementType === 'new' && (
                      <span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-primary-container text-on-primary-container border border-[#0f172a] font-bold inline-flex items-center gap-0.5 shadow-[1px_1px_0px_#0f172a]">
                        <span className="material-symbols-outlined text-xs">add_circle</span>
                        NEW IN
                      </span>
                    )}
                    {team.displacementType === 'neutral' && (
                      <span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-surface-container-highest text-on-surface border border-[#0f172a] font-bold inline-flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-xs">horizontal_rule</span>
                        0 SHIFT
                      </span>
                    )}
                    {team.displacementType === 'negative' && (
                      <span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-error-container text-on-error-container border border-[#0f172a] font-bold inline-flex items-center gap-0.5 shadow-[1px_1px_0px_#0f172a]">
                        <span className="material-symbols-outlined text-xs">arrow_downward</span>
                        {team.displacementLabel}
                      </span>
                    )}
                  </td>

                  {/* Quota Status */}
                  <td className="py-3.5 px-4 text-right">
                    {team.quotaType === 'locked' && (
                      <span className="font-label-sm text-label-sm px-2.5 py-1 rounded-full bg-[#10b981] text-on-primary border-2 border-[#0f172a] shadow-[1px_1px_0px_#0f172a] font-extrabold uppercase">
                        LOCKED IN
                      </span>
                    )}
                    {team.quotaType === 'safe' && (
                      <span className="font-label-sm text-label-sm px-2.5 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed border-2 border-[#0f172a] shadow-[1px_1px_0px_#0f172a] font-extrabold uppercase">
                        BUBBLE SAFE
                      </span>
                    )}
                    {team.quotaType === 'wire' && (
                      <span className="font-label-sm text-label-sm px-2.5 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed border-2 border-[#0f172a] shadow-[1px_1px_0px_#0f172a] font-extrabold uppercase">
                        ON THE WIRE
                      </span>
                    )}
                    {team.quotaType === 'drop' && (
                      <span className="font-label-sm text-label-sm px-2.5 py-1 rounded-full bg-error text-on-error border-2 border-[#0f172a] shadow-[1px_1px_0px_#0f172a] font-extrabold uppercase">
                        DROP OUT
                      </span>
                    )}
                    {team.quotaType === 'eliminated' && (
                      <span className="font-label-sm text-label-sm px-2.5 py-1 rounded-full bg-surface-container-highest text-on-surface-variant border border-[#0f172a] font-extrabold uppercase">
                        ELIMINATED
                      </span>
                    )}
                  </td>
                </tr>
              </Fragment>
            );
          })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
