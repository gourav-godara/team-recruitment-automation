export default function ScoringKpiGrid({
  modelName = 'Balanced v3',
  totalSum = 100,
  curveType = 'z_score',
  topQuota = 40,
  totalCandidateTeams = 482,
  activeGatesCount = 4,
  disqualifiedCount = 14,
  onOpenGatesModal,
}) {
  const isSumBalanced = totalSum === 100;
  const quotaPct = ((topQuota / totalCandidateTeams) * 100).toFixed(1);

  return (
    <section aria-label="Engine Statistics" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-space-md">
      {/* KPI 1 */}
      <div className="bg-surface-container-lowest p-space-md rounded-xl border-2 border-[#0f172a] shadow-[3px_3px_0px_#0f172a] flex flex-col justify-between relative overflow-hidden group hover:-translate-y-0.5 transition-transform">
        <div className="flex items-center justify-between mb-space-xs">
          <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-black">
            Active Weight Model
          </span>
          <span className="w-7 h-7 rounded-full bg-secondary-fixed border-2 border-[#0f172a] flex items-center justify-center text-on-secondary-fixed shadow-[1px_1px_0px_#0f172a]">
            <span className="material-symbols-outlined text-sm">equalizer</span>
          </span>
        </div>
        <div>
          <div className="font-headline-md text-headline-md text-on-surface tracking-tight" id="model-name">
            {modelName}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span
              className={`font-label-sm text-label-sm px-2.5 py-0.5 rounded-full border border-[#0f172a] font-bold shadow-[1px_1px_0px_#0f172a] ${
                isSumBalanced
                  ? 'bg-[#10b981] text-on-primary'
                  : 'bg-error text-on-error'
              }`}
            >
              {totalSum}% {isSumBalanced ? 'Normalized' : 'Deviation'}
            </span>
            <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">
              {curveType === 'z_score' ? 'Z-Score Curve' : 'Min-Max Curve'}
            </span>
          </div>
        </div>
      </div>

      {/* KPI 2 */}
      <div className="bg-surface-container-lowest p-space-md rounded-xl border-2 border-[#0f172a] shadow-[3px_3px_0px_#0f172a] flex flex-col justify-between relative overflow-hidden group hover:-translate-y-0.5 transition-transform">
        <div className="flex items-center justify-between mb-space-xs">
          <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-black">
            Target Quota Horizon
          </span>
          <span className="w-7 h-7 rounded-full bg-primary-container text-on-primary-container border-2 border-[#0f172a] flex items-center justify-center shadow-[1px_1px_0px_#0f172a]">
            <span className="material-symbols-outlined text-sm">flag</span>
          </span>
        </div>
        <div>
          <div className="font-headline-md text-headline-md text-on-surface tracking-tight">
            Top {topQuota} Finalists
          </div>
          <div className="mt-2 font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-[#10b981]"></span>
            {quotaPct}% of {totalCandidateTeams} candidate teams
          </div>
        </div>
      </div>

      {/* KPI 3 */}
      <div
        onClick={onOpenGatesModal}
        className="bg-surface-container-lowest p-space-md rounded-xl border-2 border-[#0f172a] shadow-[3px_3px_0px_#0f172a] flex flex-col justify-between relative overflow-hidden group hover:-translate-y-0.5 transition-transform cursor-pointer"
        title="Click to inspect disqualified blocklist"
      >
        <div className="flex items-center justify-between mb-space-xs">
          <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-black">
            Binary Hard Gates
          </span>
          <span className="w-7 h-7 rounded-full bg-tertiary-container text-on-tertiary border-2 border-[#0f172a] flex items-center justify-center shadow-[1px_1px_0px_#0f172a]">
            <span className="material-symbols-outlined text-sm">block</span>
          </span>
        </div>
        <div>
          <div className="font-headline-md text-headline-md text-on-surface tracking-tight flex items-center gap-2">
            <span>{activeGatesCount} Enforced</span>
            <span className="font-label-sm text-label-sm px-2 py-0.5 bg-error text-on-error rounded border border-[#0f172a] font-bold">
              STRICT
            </span>
          </div>
          <div className="mt-2 font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1 font-medium">
            <span className="material-symbols-outlined text-error text-sm">warning</span>
            <span>{disqualifiedCount} automatic disqualifications</span>
          </div>
        </div>
      </div>

      {/* KPI 4 */}
      <div className="bg-surface-container-lowest p-space-md rounded-xl border-2 border-[#0f172a] shadow-[3px_3px_0px_#0f172a] flex flex-col justify-between relative overflow-hidden group hover:-translate-y-0.5 transition-transform">
        <div className="flex items-center justify-between mb-space-xs">
          <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-black">
            Score Drift Tolerance
          </span>
          <span className="w-7 h-7 rounded-full bg-surface-container text-on-surface border-2 border-[#0f172a] flex items-center justify-center shadow-[1px_1px_0px_#0f172a]">
            <span className="material-symbols-outlined text-sm">memory</span>
          </span>
        </div>
        <div>
          <div className="font-headline-md text-headline-md text-on-surface tracking-tight font-mono text-primary font-bold">
            0.00% Drift
          </div>
          <div className="mt-2 font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse"></span>
            Deterministic SIMD WebAssembly
          </div>
        </div>
      </div>
    </section>
  );
}
