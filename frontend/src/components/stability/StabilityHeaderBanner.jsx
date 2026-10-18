export default function StabilityHeaderBanner({
  onDownloadCsv,
  onProceedAudit,
}) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-space-lg mb-space-lg">
      <div className="flex flex-col gap-space-xs max-w-3xl">
        <div className="flex items-center gap-space-sm flex-wrap">
          <span className="inline-flex items-center gap-1 font-label-sm text-label-sm uppercase px-2.5 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed font-black tracking-wider border-2 border-[#0f172a] shadow-[2px_2px_0px_#0f172a]">
            <span className="material-symbols-outlined text-sm font-black">casino</span>
            STAGE 06 // MONTE CARLO STRESS PARTY
          </span>
          <span className="text-outline-variant font-bold">/</span>
          <span className="font-label-md text-label-md font-mono text-on-surface-variant font-bold">
            N=10,000 PERTURBATIONS
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-container-high font-mono text-label-sm text-label-sm font-bold text-on-surface border border-[#0f172a]">
            <span className="inline-block w-2 h-2 rounded-full bg-[#10b981] animate-pulse"></span>
            STABILITY ENGINE LIVE
          </span>
        </div>

        <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-extrabold mt-1">
          Stability Stress Testing &amp; Cutoff Sensitivity
        </h1>

        <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
          Simulating ±15% Monte Carlo weight perturbations across 10,000 iterations to detect fragile cutoff positions and volatile rank swaps before 2:00 AM jury lockdown.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-space-sm flex-wrap shrink-0">
        <button
          type="button"
          onClick={onDownloadCsv}
          className="group inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-surface-container-lowest text-on-surface font-label-lg text-label-lg border-2 border-[#0f172a] shadow-[3px_3px_0px_#0f172a] hover:bg-surface-container-low transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#0f172a] cursor-pointer font-bold"
        >
          <span className="material-symbols-outlined text-lg text-primary font-bold">download</span>
          <span>Download Sensitivity Matrix (.csv)</span>
        </button>

        <button
          type="button"
          onClick={onProceedAudit}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary-container text-on-primary-container font-label-lg text-label-lg uppercase tracking-wide font-extrabold border-2 border-[#0f172a] shadow-[4px_4px_0px_#0f172a] hover:brightness-110 transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#0f172a] cursor-pointer"
        >
          <span>Lock Weights &amp; Proceed to Audit Export</span>
          <span className="material-symbols-outlined text-lg font-black">arrow_forward</span>
        </button>
      </div>
    </div>
  );
}
