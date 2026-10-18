export default function CompareHeaderBanner({
  onSwapCandidates,
  onExportDossier,
  onConfirmConsensus,
}) {
  return (
    <div className="flex flex-col gap-space-sm mb-space-lg">
      {/* Top Badges & Action Utilities */}
      <div className="flex flex-wrap items-center justify-between gap-space-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-label-sm text-label-sm uppercase px-3 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed border-2 border-[#0f172a] shadow-[2px_2px_0px_#0f172a] font-extrabold tracking-wider">
            STAGE 05 // TEAM COMPARE &amp; DELIBERATION
          </span>
          <span className="font-label-sm text-label-sm uppercase px-3 py-1 rounded-full bg-primary-container text-on-primary-container border-2 border-[#0f172a] shadow-[2px_2px_0px_#0f172a] font-extrabold">
            HEAD-TO-HEAD ARBITRATION
          </span>
          <span className="font-label-sm text-label-sm uppercase px-3 py-1 rounded-full bg-[#10b981] text-on-primary border-2 border-[#0f172a] shadow-[2px_2px_0px_#0f172a] font-mono font-bold">
            DETERMINISTIC SIMD V2.4
          </span>
        </div>

        {/* Action Utilities */}
        <div className="flex items-center gap-space-sm flex-wrap">
          <button
            type="button"
            onClick={onSwapCandidates}
            className="flex items-center gap-2 px-3.5 py-2 bg-surface-container-lowest text-on-surface font-label-lg text-label-lg rounded-lg border-2 border-[#0f172a] shadow-[3px_3px_0px_#0f172a] hover:bg-surface-container-low active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#0f172a] transition-all cursor-pointer font-bold"
          >
            <span className="material-symbols-outlined text-base">swap_horiz</span>
            <span>SWAP CANDIDATES</span>
          </button>

          <button
            type="button"
            onClick={onExportDossier}
            className="flex items-center gap-2 px-3.5 py-2 bg-surface-container-lowest text-on-surface font-label-lg text-label-lg rounded-lg border-2 border-[#0f172a] shadow-[3px_3px_0px_#0f172a] hover:bg-surface-container-low active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#0f172a] transition-all cursor-pointer font-bold"
          >
            <span className="material-symbols-outlined text-base">picture_as_pdf</span>
            <span>EXPORT DOSSIER</span>
          </button>

          <button
            type="button"
            onClick={onConfirmConsensus}
            id="primary-lock-btn"
            className="flex items-center gap-2 px-4 py-2 bg-secondary-fixed text-on-secondary-fixed font-label-lg text-label-lg rounded-lg border-2 border-[#0f172a] shadow-[4px_4px_0px_#0f172a] hover:bg-secondary-container active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#0f172a] transition-all font-black cursor-pointer"
          >
            <span className="material-symbols-outlined text-base font-black">verified</span>
            <span>CONFIRM TIE-BREAKER CONSENSUS</span>
          </button>
        </div>
      </div>

      {/* Title and Subtitle Block */}
      <div className="bg-surface-container-lowest p-space-md rounded-xl border-2 border-[#0f172a] shadow-[4px_4px_0px_#0f172a] flex flex-col md:flex-row md:items-center justify-between gap-space-md">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-extrabold">
            Team Comparison &amp; Boundary Tie-Breaker
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-4xl mt-1 leading-relaxed">
            Conduct forensic side-by-side arbitration between bubble-cutoff contenders, inspect commit timelines, normalize divergent judge rubrics, and lock jury consensus decisions.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 bg-surface-container-low p-2 rounded-lg border-2 border-[#0f172a]">
          <div className="flex flex-col text-right">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-mono">
              Quorum Deadline
            </span>
            <span className="font-label-lg text-label-lg text-on-surface font-bold">
              14m 22s Remaining
            </span>
          </div>
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#f43f5e] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-[#f43f5e]"></span>
          </span>
        </div>
      </div>
    </div>
  );
}
