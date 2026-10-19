export default function RankedBentoMetrics({ runInfo }) {
  const passedPct = ((runInfo.passed_hard_gates / runInfo.total_teams) * 100).toFixed(1);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
      {/* Bento 1: Target Quota */}
      <div className="bg-surface-container-lowest p-space-lg rounded-xl border-2 border-[#0f172a] shadow-[4px_4px_0px_#0f172a] flex flex-col justify-between relative overflow-hidden group hover:-translate-y-0.5 transition-transform">
        <div className="absolute -right-4 -bottom-4 opacity-10 pointer-events-none">
          <span className="material-symbols-outlined text-[110px] text-primary">flag</span>
        </div>
        <div className="flex items-center justify-between mb-space-sm relative z-10">
          <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant font-extrabold">
            Target Quota
          </span>
          <span className="px-2 py-0.5 bg-primary-fixed text-on-primary-fixed border border-[#0f172a] rounded-full font-label-sm text-label-sm font-bold shadow-[1px_1px_0px_#0f172a]">
            Top {runInfo.quota_percentage}
          </span>
        </div>
        <div className="mb-space-sm relative z-10">
          <div className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-extrabold">
            {runInfo.shortlist_quota}{' '}
            <span className="font-headline-sm text-headline-sm text-on-surface-variant font-normal">
              / {runInfo.total_teams}
            </span>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 font-medium">
            Shortlist threshold pegged to consensus floor
          </p>
        </div>
        <div className="pt-space-sm border-t-2 border-[#0f172a]/10 flex items-center justify-between font-mono font-label-sm text-label-sm relative z-10">
          <span className="text-on-surface-variant font-medium">Cutoff Floor</span>
          <span className="px-2 py-0.5 bg-secondary-fixed text-on-secondary-fixed rounded border border-[#0f172a] font-bold shadow-[1px_1px_0px_#0f172a]">
            {runInfo.cutoff_floor.toFixed(2)} pts
          </span>
        </div>
      </div>

      {/* Bento 2: Active Weight Matrix */}
      <div className="bg-surface-container-lowest p-space-lg rounded-xl border-2 border-[#0f172a] shadow-[4px_4px_0px_#0f172a] flex flex-col justify-between group hover:-translate-y-0.5 transition-transform">
        <div className="flex items-center justify-between mb-space-sm">
          <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant font-extrabold">
            Weight Matrix
          </span>
          <span className="px-2 py-0.5 bg-secondary-container text-on-secondary-container border border-[#0f172a] rounded font-label-sm text-label-sm font-bold shadow-[1px_1px_0px_#0f172a]">
            {runInfo.weight_model}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-space-xs my-space-xs font-mono">
          <div className="bg-surface-container p-2 rounded border border-[#0f172a]">
            <div className="font-label-sm text-label-sm text-on-surface-variant font-bold">TECH DEPTH</div>
            <div className="font-tabular-score text-tabular-score text-primary font-bold">
              {runInfo.weights.tech}%
            </div>
          </div>
          <div className="bg-surface-container p-2 rounded border border-[#0f172a]">
            <div className="font-label-sm text-label-sm text-on-surface-variant font-bold">REPO HEALTH</div>
            <div className="font-tabular-score text-tabular-score text-on-surface font-bold">
              {runInfo.weights.repo}%
            </div>
          </div>
          <div className="bg-surface-container p-2 rounded border border-[#0f172a]">
            <div className="font-label-sm text-label-sm text-on-surface-variant font-bold">PRESENTATION</div>
            <div className="font-tabular-score text-tabular-score text-on-surface font-bold">
              {runInfo.weights.pitch}%
            </div>
          </div>
          <div className="bg-surface-container p-2 rounded border border-[#0f172a]">
            <div className="font-label-sm text-label-sm text-on-surface-variant font-bold">VELOCITY</div>
            <div className="font-tabular-score text-tabular-score text-secondary font-bold">
              {runInfo.weights.velocity}%
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm pt-1">
          <span>Deterministic Sum</span>
          <span className="text-[#10b981] font-bold font-mono">100.0% Validated</span>
        </div>
      </div>

      {/* Bento 3: Gate Integrity */}
      <div className="bg-surface-container-lowest p-space-lg rounded-xl border-2 border-[#0f172a] shadow-[4px_4px_0px_#0f172a] flex flex-col justify-between group hover:-translate-y-0.5 transition-transform">
        <div className="flex items-center justify-between mb-space-sm">
          <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant font-extrabold">
            Gate Integrity
          </span>
          <span className="px-2 py-0.5 bg-[#10b981] text-on-primary rounded-full font-label-sm text-label-sm border border-[#0f172a] font-bold shadow-[1px_1px_0px_#0f172a]">
            {runInfo.overrides_count} Overrides
          </span>
        </div>
        <div>
          <div className="flex items-baseline gap-space-xs">
            <span className="font-headline-lg text-headline-lg text-on-surface font-black">
              {runInfo.passed_hard_gates}
            </span>
            <span className="font-label-md text-label-md text-[#10b981] font-bold">
              Passed Hard Gates
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-full bg-surface-container-high h-2.5 rounded-full overflow-hidden border border-[#0f172a] shadow-inner">
              <div className="bg-primary h-full" style={{ width: `${passedPct}%` }}></div>
            </div>
            <span className="font-mono font-label-sm text-label-sm text-error font-bold whitespace-nowrap">
              {runInfo.excluded_count} Excl
            </span>
          </div>
        </div>
        <div className="pt-space-sm border-t-2 border-[#0f172a]/10 flex items-center justify-between font-mono font-label-sm text-label-sm">
          <span className="text-on-surface-variant font-medium">Cohort Mean</span>
          <span className="font-bold text-on-surface">
            {runInfo.cohort_mean.toFixed(2)} pts (±{runInfo.cohort_std_dev.toFixed(2)})
          </span>
        </div>
      </div>
    </div>
  );
}
