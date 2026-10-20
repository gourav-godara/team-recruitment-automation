export default function TeamStabilityDetailModal({
  isOpen,
  onClose,
  team,
}) {
  if (!isOpen || !team) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface-container-lowest w-full max-w-xl rounded-2xl border-2 border-[#0f172a] shadow-[6px_6px_0px_#0f172a] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-primary-container px-space-lg py-4 border-b-2 border-[#0f172a] flex items-center justify-between text-on-primary-container">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-2xl font-bold">query_stats</span>
            <div>
              <h2 className="font-headline-sm text-lg font-black text-white">
                {team.name}
              </h2>
              <p className="font-body-sm text-xs text-white/90 font-mono">
                ID: {team.external_id} • Base Rank #{team.base_rank} • Volatility σ={team.volatility_sigma}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container-lowest text-on-surface border-2 border-[#0f172a] flex items-center justify-center font-bold hover:bg-secondary-fixed transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-space-lg flex flex-col gap-space-md">
          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 rounded-lg bg-surface-container-low border border-[#0f172a]">
              <div className="text-[11px] font-bold text-on-surface-variant uppercase">Excursion Range</div>
              <div className="text-base font-black font-mono text-on-surface">{team.range}</div>
            </div>
            <div className="p-2.5 rounded-lg bg-surface-container-low border border-[#0f172a]">
              <div className="text-[11px] font-bold text-on-surface-variant uppercase">Survival Rate</div>
              <div className="text-base font-black font-mono text-[#10b981]">{team.survival_rate}%</div>
            </div>
            <div className="p-2.5 rounded-lg bg-surface-container-low border border-[#0f172a]">
              <div className="text-[11px] font-bold text-on-surface-variant uppercase">Risk Verdict</div>
              <div className="text-base font-black font-mono text-tertiary">{team.risk_level}</div>
            </div>
          </div>

          {/* Profile Warning Box */}
          <div className="p-3 bg-secondary-fixed/30 rounded-lg border-2 border-[#0f172a] text-xs">
            <div className="font-black text-on-surface mb-0.5">Monte Carlo Perturbed Profile:</div>
            <p className="text-on-surface-variant font-mono">{team.perturbed_profile}</p>
          </div>

          {/* Vector Breakdown */}
          <div>
            <div className="font-label-sm text-label-sm font-bold uppercase text-on-surface mb-2">
              Preliminary Evaluation Vectors
            </div>
            <div className="space-y-2 font-mono text-xs">
              <div>
                <div className="flex justify-between text-on-surface font-semibold mb-1">
                  <span>Technical Depth: {team.tech_score} pts</span>
                  <span>Weight 35%</span>
                </div>
                <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden border border-[#0f172a]">
                  <div className="h-full bg-primary-container" style={{ width: `${team.tech_score}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-on-surface font-semibold mb-1">
                  <span>GitHub Quality: {team.github_score} pts</span>
                  <span>Weight 25%</span>
                </div>
                <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden border border-[#0f172a]">
                  <div className="h-full bg-[#10b981]" style={{ width: `${team.github_score}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-on-surface font-semibold mb-1">
                  <span>Track Alignment: {team.track_score} pts</span>
                  <span>Weight 20%</span>
                </div>
                <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden border border-[#0f172a]">
                  <div className="h-full bg-secondary-fixed-dim" style={{ width: `${team.track_score}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-on-surface font-semibold mb-1">
                  <span>Team Velocity: {team.velocity_score} pts</span>
                  <span>Weight 20%</span>
                </div>
                <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden border border-[#0f172a]">
                  <div className="h-full bg-tertiary-container" style={{ width: `${team.velocity_score}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-space-md bg-surface-container-low border-t-2 border-[#0f172a] flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-[#0f172a] text-white font-label-md text-label-md font-bold cursor-pointer hover:bg-primary transition-colors"
          >
            Close Telemetry
          </button>
        </div>
      </div>
    </div>
  );
}
