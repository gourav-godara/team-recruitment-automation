import { mockRankedTeams } from '../../data/mockRankedResults';

export default function MainstageBroadcastModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const top3 = mockRankedTeams.slice(0, 3);
  const remainingFinalists = mockRankedTeams.slice(3, 40);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-[#0f172a] text-surface-container-lowest w-full max-w-6xl max-h-[90vh] rounded-2xl border-4 border-secondary-fixed shadow-[8px_8px_0px_#2563eb] flex flex-col overflow-hidden my-auto">
        {/* Stage Header Banner */}
        <div className="bg-gradient-to-r from-primary-container via-[#1d4ed8] to-primary p-space-md sm:p-space-lg border-b-4 border-secondary-fixed flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-secondary-fixed text-on-secondary-fixed border-2 border-[#0f172a] flex items-center justify-center font-black text-2xl shadow-[3px_3px_0px_#0f172a]">
              🏆
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-label-sm text-label-sm uppercase px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-black tracking-wider">
                  LIVE MAINSTAGE FEED
                </span>
                <span className="flex items-center gap-1 font-mono text-xs text-emerald-300 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  482 → 40 CONSENSUS
                </span>
              </div>
              <h2 className="font-headline-lg text-2xl sm:text-3xl font-black text-white tracking-tight mt-0.5">
                ETHGlobal Singapore 2025 // Official Finalists
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-2 rounded-lg bg-surface-container-lowest text-on-surface font-label-md text-label-md font-black hover:bg-secondary-fixed transition-colors border-2 border-[#0f172a] shadow-[2px_2px_0px_#0f172a] flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">print</span>
              <span>Print Projection</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-secondary-fixed text-on-secondary-fixed font-black text-lg border-2 border-[#0f172a] shadow-[2px_2px_0px_#0f172a] flex items-center justify-center hover:bg-yellow-300 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Podium Highlights */}
        <div className="p-space-md sm:p-space-lg bg-[#131b2e] border-b-2 border-slate-700">
          <div className="text-center mb-4">
            <span className="font-label-sm text-label-sm uppercase font-mono tracking-widest text-secondary-fixed font-bold">
              TOP TIER HONORS
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
            {top3.map((team, idx) => {
              const placeColors = [
                'border-secondary-fixed bg-secondary-fixed/10',
                'border-slate-300 bg-slate-500/10',
                'border-amber-600 bg-amber-600/10',
              ];
              const placeBadges = ['🥇 1st Place', '🥈 2nd Place', '🥉 3rd Place'];
              return (
                <div
                  key={team.team_id || idx}
                  className={`p-4 rounded-xl border-2 ${placeColors[idx]} flex flex-col justify-between`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-label-sm text-xs font-black uppercase tracking-wider text-secondary-fixed">
                        {placeBadges[idx]}
                      </span>
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 border border-slate-600 font-bold">
                        {team.total_score.toFixed(2)} pts
                      </span>
                    </div>
                    <h3 className="font-headline-sm text-xl font-black text-white">
                      {team.team_name}
                    </h3>
                    <p className="text-xs text-slate-300 mt-1">{team.track}</p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-700/60 flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span>Rank #{idx + 1}</span>
                    <span className="text-emerald-400 font-bold">Verified Finalist</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Finalist Roster Table Grid */}
        <div className="flex-1 overflow-y-auto p-space-md sm:p-space-lg bg-[#0f172a]">
          <div className="flex items-center justify-between mb-3">
            <span className="font-label-md text-label-md font-bold uppercase tracking-wider text-slate-300">
              Stage Finalists (Ranks 4 - 40)
            </span>
            <span className="font-mono text-xs text-slate-400">
              Deterministic consensus verified • Zero drift
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {remainingFinalists.map((team, idx) => (
              <div
                key={team.team_id || idx}
                className="p-2.5 rounded-lg bg-[#1e293b] border border-slate-700 flex items-center justify-between hover:border-secondary-fixed transition-colors"
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="w-6 h-6 rounded bg-slate-800 border border-slate-600 flex items-center justify-center font-mono text-xs font-bold text-secondary-fixed shrink-0">
                    {team.rank || idx + 4}
                  </span>
                  <div className="truncate">
                    <span className="font-bold text-sm text-white block truncate">
                      {team.team_name}
                    </span>
                    <span className="text-[11px] text-slate-400 block truncate">
                      {team.track}
                    </span>
                  </div>
                </div>
                <span className="font-mono text-xs font-bold text-emerald-400 shrink-0 ml-2">
                  {team.total_score ? team.total_score.toFixed(1) : '88.5'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#131b2e] border-t-2 border-slate-700 flex items-center justify-between text-xs font-mono text-slate-400 px-space-lg">
          <span>ROOT MERKLE HASH: 8f9b2c01d94ea277b07542d937013ac9fb0e89104d49a372e591bc31289f2a</span>
          <span className="text-secondary-fixed font-bold">STATE SEALED &amp; VERIFIED</span>
        </div>
      </div>
    </div>
  );
}
