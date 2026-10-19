export default function QualityKpiGrid({ dataset, onCriticalGapsClick, onImputationClick }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
      {/* Card 1: Signal Completeness */}
      <div className="bg-surface-container-lowest p-space-md rounded-xl border-2 border-[#0f172a] shadow-[4px_4px_0px_#0f172a] flex flex-col justify-between relative group hover:-translate-y-0.5 transition-transform">
        <div className="flex items-start justify-between">
          <div>
            <span className="font-label-sm text-label-sm uppercase tracking-wide text-on-surface-variant font-extrabold block">
              Signal Completeness
            </span>
            <span className="font-headline-xl text-headline-xl text-on-surface tracking-tighter mt-1 block font-black">
              {dataset.signal_completeness}%
            </span>
          </div>
          <span className="font-label-sm text-label-sm uppercase px-2 py-0.5 bg-secondary-fixed text-on-secondary-fixed rounded-full border border-[#0f172a] shadow-[2px_2px_0px_#0f172a] font-black">
            GATE READY
          </span>
        </div>
        <div className="mt-space-md pt-space-sm bg-surface-container-low p-2 rounded-lg border border-[#0f172a]/20 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-base text-primary font-bold">trending_up</span>
            <span className="font-label-sm text-label-sm font-bold text-on-surface">
              {dataset.signal_completeness_delta}
            </span>
          </div>
          <span className="font-label-sm text-label-sm text-on-surface-variant font-semibold">
            {dataset.schema_version}
          </span>
        </div>
      </div>

      {/* Card 2: Complete Records */}
      <div className="bg-surface-container-lowest p-space-md rounded-xl border-2 border-[#0f172a] shadow-[4px_4px_0px_#0f172a] flex flex-col justify-between relative hover:-translate-y-0.5 transition-transform">
        <div className="flex items-start justify-between">
          <div>
            <span className="font-label-sm text-label-sm uppercase tracking-wide text-on-surface-variant font-extrabold block">
              Complete Records
            </span>
            <span className="font-headline-xl text-headline-xl text-on-surface tracking-tighter mt-1 block font-black">
              {dataset.complete_records_pct}%
            </span>
          </div>
          <span className="w-7 h-7 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center border border-[#0f172a] shadow-[1px_1px_0px_#0f172a]">
            <span className="material-symbols-outlined text-sm font-bold">dataset_linked</span>
          </span>
        </div>
        <div className="mt-space-md pt-space-sm bg-surface-container-low p-2 rounded-lg border border-[#0f172a]/20 flex items-center justify-between">
          <span className="font-label-md text-label-md text-on-surface font-mono font-bold">
            {dataset.complete_records_count} / {dataset.total_teams} teams
          </span>
          <span className="font-label-sm text-label-sm px-1.5 py-0.5 bg-surface-container-high text-on-surface rounded font-semibold border border-[#0f172a]/30">
            Parity Solid
          </span>
        </div>
      </div>

      {/* Card 3: Critical Gaps */}
      <div
        onClick={onCriticalGapsClick}
        className="bg-tertiary-fixed p-space-md rounded-xl border-2 border-[#0f172a] shadow-[4px_4px_0px_#0f172a] flex flex-col justify-between relative hover:-translate-y-0.5 transition-transform cursor-pointer"
        title="Click to view quarantined teams"
      >
        <div className="flex items-start justify-between">
          <div>
            <span className="font-label-sm text-label-sm uppercase tracking-wide text-on-tertiary-fixed font-extrabold block">
              Critical Gaps
            </span>
            <span className="font-headline-xl text-headline-xl text-on-tertiary-fixed tracking-tighter mt-1 block font-black">
              {dataset.critical_gaps_count} Teams
            </span>
          </div>
          <span className="font-label-sm text-label-sm uppercase px-2 py-0.5 bg-tertiary text-on-tertiary rounded-full border border-[#0f172a] shadow-[2px_2px_0px_#0f172a] flex items-center gap-1 font-bold">
            <span className="material-symbols-outlined text-xs">warning</span> Action Req.
          </span>
        </div>
        <div className="mt-space-md pt-space-sm bg-surface-container-lowest p-2 rounded-lg flex items-center justify-between border border-[#0f172a] shadow-[1px_1px_0px_#0f172a]">
          <span className="font-label-sm text-label-sm text-on-surface font-bold">Missing Repo or Video</span>
          <span className="font-label-sm text-label-sm font-mono text-tertiary font-bold">Gate Blocked</span>
        </div>
      </div>

      {/* Card 4: Imputation Directive */}
      <div
        onClick={onImputationClick}
        className="bg-surface-container-lowest p-space-md rounded-xl border-2 border-[#0f172a] shadow-[4px_4px_0px_#0f172a] flex flex-col justify-between relative hover:-translate-y-0.5 transition-transform cursor-pointer"
        title="Click to learn about Imputation Directives"
      >
        <div className="flex items-start justify-between">
          <div>
            <span className="font-label-sm text-label-sm uppercase tracking-wide text-on-surface-variant font-extrabold block">
              Imputation Directive
            </span>
            <span className="font-headline-sm text-headline-sm text-on-surface font-extrabold mt-1 block">
              No Zero-Bias Skew
            </span>
          </div>
          <span className="w-7 h-7 rounded-full bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center border border-[#0f172a] shadow-[1px_1px_0px_#0f172a]">
            <span className="material-symbols-outlined text-sm font-bold">tune</span>
          </span>
        </div>
        <div className="mt-space-md pt-space-sm bg-surface-container-low p-2 rounded-lg border border-[#0f172a]/20 flex items-center justify-between">
          <span className="font-label-sm text-label-sm text-on-surface font-mono font-medium">
            Dashed Unknown Pill
          </span>
          <span className="font-label-sm text-label-sm px-1.5 py-0.5 bg-surface-container-highest text-on-surface rounded font-bold font-mono border border-[#0f172a]/30">
            μ=0.2 Bayes
          </span>
        </div>
      </div>
    </div>
  );
}
