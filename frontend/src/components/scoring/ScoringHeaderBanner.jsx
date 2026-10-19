export default function ScoringHeaderBanner({
  onResetBaseline,
  onPreviewImpact,
  onRunEngine,
  isComputing = false,
}) {
  return (
    <header className="flex flex-col gap-space-sm bg-surface-container-lowest p-space-lg rounded-xl border-2 border-[#0f172a] shadow-[4px_4px_0px_#0f172a] relative overflow-hidden">
      {/* Memphis Geometric Background Flairs */}
      <div className="absolute -right-12 -top-12 w-40 h-40 bg-secondary-fixed rounded-full border-2 border-[#0f172a] opacity-40 pointer-events-none"></div>
      <div className="absolute right-32 top-8 w-6 h-6 rotate-12 bg-primary-container rounded border-2 border-[#0f172a] pointer-events-none"></div>
      <div className="absolute right-20 bottom-3 w-4 h-4 bg-tertiary-container rounded-full border border-[#0f172a] pointer-events-none"></div>

      {/* Top Breadcrumbs / Neo Badges */}
      <div className="flex flex-wrap items-center gap-space-xs relative z-10">
        <span className="font-label-sm text-label-sm px-2.5 py-1 bg-surface-container-highest text-on-surface font-extrabold rounded-full border-2 border-[#0f172a] shadow-[2px_2px_0px_#0f172a] flex items-center gap-1">
          <span className="material-symbols-outlined text-xs">tune</span>
          STAGE 03 // SCORING ENGINE
        </span>
        <span className="font-label-sm text-label-sm px-2.5 py-1 bg-primary-fixed text-on-primary-fixed font-black tracking-wide rounded-full border-2 border-[#0f172a] shadow-[2px_2px_0px_#0f172a]">
          MULTI-VECTOR WEIGHT CALIBRATOR
        </span>
        <span className="font-label-sm text-label-sm px-2.5 py-1 bg-[#10b981] text-on-primary font-mono font-bold rounded-full border-2 border-[#0f172a] shadow-[2px_2px_0px_#0f172a] flex items-center gap-1">
          <span className="material-symbols-outlined text-xs">verified_user</span>
          DETERMINISTIC V2.4
        </span>
      </div>

      {/* Header Content & Action Cluster */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-space-md relative z-10 pt-1">
        <div className="max-w-3xl">
          <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight mb-space-xs">
            Scoring Engine &amp; Multi-Factor Weights
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
            Calibrate criteria multipliers, set normalization curves (Z-score vs min-max), and configure binary hard gates before consensus rankings are computed.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-space-sm shrink-0">
          <button
            type="button"
            id="btn-reset"
            onClick={onResetBaseline}
            className="px-4 py-2.5 rounded-lg font-label-lg text-label-lg uppercase bg-surface-container-high text-on-surface border-2 border-[#0f172a] shadow-[3px_3px_0px_#0f172a] hover:bg-surface-variant active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#0f172a] transition-all flex items-center gap-1.5 cursor-pointer font-bold"
          >
            <span className="material-symbols-outlined text-base">restart_alt</span>
            Reset to Baseline
          </button>

          <button
            type="button"
            id="btn-preview"
            onClick={onPreviewImpact}
            className="px-4 py-2.5 rounded-lg font-label-lg text-label-lg uppercase bg-secondary-fixed text-on-secondary-fixed border-2 border-[#0f172a] shadow-[4px_4px_0px_#0f172a] hover:bg-secondary-fixed-dim active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#0f172a] transition-all flex items-center gap-1.5 cursor-pointer font-extrabold"
          >
            <span className="material-symbols-outlined text-base">visibility</span>
            Preview Shortlist Impact
          </button>

          <button
            type="button"
            id="btn-run"
            disabled={isComputing}
            onClick={onRunEngine}
            className="px-5 py-2.5 rounded-lg font-label-lg text-label-lg uppercase bg-primary-container text-on-primary-container border-2 border-[#0f172a] shadow-[4px_4px_0px_#0f172a] hover:bg-primary active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#0f172a] transition-all flex items-center gap-1.5 cursor-pointer font-black disabled:opacity-75"
          >
            {isComputing ? (
              <>
                <span className="material-symbols-outlined animate-spin text-base">sync</span>
                <span>Computing SIMD...</span>
              </>
            ) : (
              <>
                <span>Run Engine &amp; Compute Ranks</span>
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
