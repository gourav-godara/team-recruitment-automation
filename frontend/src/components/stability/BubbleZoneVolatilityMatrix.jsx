import { Fragment } from 'react';

export default function BubbleZoneVolatilityMatrix({
  teams,
  onSelectTeam,
}) {
  return (
    <div className="bg-surface-container-lowest rounded-xl border-2 border-[#0f172a] shadow-[4px_4px_0px_#0f172a] overflow-hidden">
      {/* Header Strip */}
      <div className="bg-surface-container-high px-space-md py-3 flex items-center justify-between flex-wrap gap-2 border-b-2 border-[#0f172a]">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-tertiary text-xl font-bold">bubble_chart</span>
          <span className="font-headline-sm text-headline-sm text-on-surface font-extrabold">
            Bubble Zone Volatility Matrix
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">
            Cutoff Perimeter:
          </span>
          <span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-mono font-black text-label-sm text-label-sm border border-[#0f172a] shadow-[1px_1px_0px_#0f172a]">
            #36 to #43
          </span>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-inverse-surface text-surface font-label-md text-label-md uppercase tracking-wider">
              <th className="py-3 px-3 pl-4">Team</th>
              <th className="py-3 px-2 text-center">Base</th>
              <th className="py-3 px-2 text-center">Range</th>
              <th className="py-3 px-2 text-center">Vol (σ)</th>
              <th className="py-3 px-2 text-center">Base Stat</th>
              <th className="py-3 px-2">Perturbed Risk Profile</th>
              <th className="py-3 px-3 pr-4 text-right">Risk Level</th>
            </tr>
          </thead>
          <tbody className="font-body-sm text-body-sm divide-y-2 divide-surface-container">
            {teams.map((team, index) => {
              const prevTeam = index > 0 ? teams[index - 1] : null;
              const isCutoffBoundary = prevTeam && prevTeam.base_rank <= 40 && team.base_rank > 40;

              return (
                <Fragment key={team.team_id}>
                  {isCutoffBoundary && (
                    <tr className="bg-secondary-fixed text-on-secondary-fixed font-black border-y-4 border-[#0f172a]">
                      <td colSpan={7} className="py-2.5 px-4 text-center font-label-md text-label-md uppercase tracking-wider">
                        <div className="flex items-center justify-center gap-3">
                          <span className="material-symbols-outlined text-sm font-black">content_cut</span>
                          <span>CUTOFF HORIZON: SHORTLIST LIMIT RANK #40 VS #41 (DELTA = 0.10 PTS)</span>
                          <span className="material-symbols-outlined text-sm font-black">content_cut</span>
                        </div>
                      </td>
                    </tr>
                  )}
                  <tr
                    onClick={() => onSelectTeam && onSelectTeam(team)}
                    className={`transition-colors cursor-pointer ${
                      team.risk_type === 'bubble'
                        ? 'bg-tertiary-fixed/40 hover:bg-tertiary-fixed/60'
                        : team.risk_type === 'fragile'
                        ? 'bg-surface-container-low hover:bg-surface-container-high'
                        : team.risk_type === 'contender'
                        ? 'bg-surface-container-high hover:bg-surface-container-highest'
                        : 'hover:bg-surface-container-high'
                    }`}
                    title="Click to view detailed stability vector telemetry"
                  >
                  {/* Team */}
                  <td className="py-3 px-3 pl-4 font-bold text-on-surface">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          team.risk_type === 'safe'
                            ? 'bg-[#10b981]'
                            : team.risk_type === 'bubble'
                            ? 'bg-tertiary animate-ping'
                            : team.risk_type === 'fragile'
                            ? 'bg-secondary-fixed'
                            : team.risk_type === 'contender'
                            ? 'bg-primary-container'
                            : 'bg-outline-variant'
                        }`}
                      ></span>
                      <span className="font-headline-sm text-sm font-extrabold">{team.name}</span>
                    </div>
                  </td>

                  {/* Base Rank */}
                  <td className="py-3 px-2 text-center font-tabular-score text-tabular-score font-black">
                    <span
                      className={
                        team.risk_type === 'bubble'
                          ? 'text-tertiary'
                          : 'text-on-surface'
                      }
                    >
                      #{team.base_rank}
                    </span>
                  </td>

                  {/* Range */}
                  <td
                    className={`py-3 px-2 text-center font-mono font-bold ${
                      team.risk_type === 'bubble' || team.risk_type === 'fragile'
                        ? 'text-tertiary'
                        : team.risk_type === 'contender'
                        ? 'text-primary'
                        : 'text-on-surface-variant'
                    }`}
                  >
                    {team.range}
                  </td>

                  {/* Volatility Sigma */}
                  <td
                    className={`py-3 px-2 text-center font-mono font-bold ${
                      team.risk_type === 'bubble'
                        ? 'text-tertiary font-black'
                        : 'text-on-surface'
                    }`}
                  >
                    {team.volatility_sigma.toFixed(1)}
                  </td>

                  {/* Base Stat */}
                  <td className="py-3 px-2 text-center">
                    {team.base_stat === 'IN' ? (
                      <span className="px-2 py-0.5 rounded-full font-label-sm text-label-sm bg-[#10b981] text-on-primary font-bold border border-[#0f172a] shadow-[1px_1px_0px_#0f172a]">
                        IN
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full font-label-sm text-label-sm bg-error-container text-on-error-container font-bold border border-[#0f172a]">
                        OUT
                      </span>
                    )}
                  </td>

                  {/* Perturbed Profile */}
                  <td className="py-3 px-2 font-mono text-xs">
                    {team.risk_type === 'bubble' ? (
                      <span className="text-on-surface font-black">
                        <span className="text-tertiary">⚠️ CRITICAL:</span> {team.survival_rate}% survival rate!
                      </span>
                    ) : team.risk_type === 'fragile' ? (
                      <span className="text-on-surface font-semibold">
                        <span className="text-tertiary font-bold">AT RISK:</span> {team.perturbed_profile.replace('AT RISK: ', '')}
                      </span>
                    ) : team.risk_type === 'contender' ? (
                      <span className="text-on-surface font-semibold">
                        <span className="text-primary font-bold">44% promotion chance</span> if Tech &gt; 38%
                      </span>
                    ) : (
                      <span className="text-on-surface-variant">
                        {team.perturbed_profile}
                      </span>
                    )}
                  </td>

                  {/* Risk Level */}
                  <td className="py-3 px-3 pr-4 text-right">
                    {team.risk_type === 'safe' && (
                      <span className="px-2.5 py-1 rounded-full font-label-sm text-label-sm bg-[#10b981] text-on-primary font-extrabold border border-[#0f172a] shadow-[1px_1px_0px_#0f172a]">
                        SAFE
                      </span>
                    )}
                    {team.risk_type === 'fragile' && (
                      <span className="px-2.5 py-1 rounded-full font-label-sm text-label-sm bg-secondary-fixed text-on-secondary-fixed font-extrabold border border-[#0f172a] shadow-[1px_1px_0px_#0f172a]">
                        FRAGILE
                      </span>
                    )}
                    {team.risk_type === 'bubble' && (
                      <span className="px-2.5 py-1 rounded-full font-label-sm text-label-sm bg-tertiary-container text-on-tertiary-container font-black border border-[#0f172a] shadow-[1px_1px_0px_#0f172a] animate-pulse">
                        BUBBLE
                      </span>
                    )}
                    {team.risk_type === 'contender' && (
                      <span className="px-2.5 py-1 rounded-full font-label-sm text-label-sm bg-primary-fixed text-on-primary-fixed font-extrabold border border-[#0f172a] shadow-[1px_1px_0px_#0f172a]">
                        CONTENDER
                      </span>
                    )}
                    {team.risk_type === 'waitlist' && (
                      <span className="px-2.5 py-1 rounded-full font-label-sm text-label-sm bg-surface-container text-on-surface-variant font-bold border border-[#0f172a]">
                        WAITLIST
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

      {/* Footer Legend */}
      <div className="p-3 bg-surface-container-low border-t-2 border-[#0f172a] flex items-center justify-between flex-wrap gap-2 text-xs font-mono text-on-surface-variant">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]"></span> Safe (&gt;95% stability)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-secondary-fixed"></span> Fragile (75-95%)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-tertiary-container"></span> Bubble (&lt;75% lock)
          </span>
        </div>
        <span className="font-bold text-on-surface">Standard Deviation (σ) calculated over 10K iterations</span>
      </div>
    </div>
  );
}
