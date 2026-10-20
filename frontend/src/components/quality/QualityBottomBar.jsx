export default function QualityBottomBar({
  readyTeams,
  totalTeams,
  hardExclusions,
  onExportCsv,
  onProceed,
}) {
  return (
    <div className="bg-surface-container-lowest p-space-md rounded-xl border-2 border-[#0f172a] shadow-[4px_4px_0px_#0f172a] flex flex-col md:flex-row items-center justify-between gap-space-md mt-space-sm">
      {/* Left Readiness Status */}
      <div className="flex items-center gap-space-md w-full md:w-auto">
        <div className="w-3.5 h-3.5 rounded-full bg-secondary-fixed border border-[#0f172a] shadow-[1px_1px_0px_#0f172a] animate-pulse shrink-0"></div>
        <div>
          <span className="font-label-lg text-label-lg text-on-surface font-extrabold block">
            {readyTeams} / {totalTeams} Teams Ready for Weighting
          </span>
          <span className="font-body-sm text-body-sm text-tertiary text-xs font-bold">
            {hardExclusions} Hard Exclusions Pending Verification
          </span>
        </div>
      </div>

      {/* Right Action Buttons */}
      <div className="flex flex-wrap items-center gap-space-sm w-full md:w-auto justify-end">
        <button
          type="button"
          onClick={onExportCsv}
          className="font-label-lg text-label-lg uppercase px-4 py-2.5 rounded-lg bg-surface-container-lowest text-on-surface border-2 border-[#0f172a] shadow-[4px_4px_0px_#0f172a] hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1 active:translate-y-1 transition-all flex items-center gap-1.5 font-bold cursor-pointer"
        >
          <span className="material-symbols-outlined text-base font-bold">download</span>
          Export DQ Diagnostic Report (CSV)
        </button>

        <button
          type="button"
          onClick={onProceed}
          className="font-label-lg text-label-lg uppercase px-5 py-2.5 rounded-lg bg-secondary-fixed text-on-secondary-fixed border-2 border-[#0f172a] shadow-[4px_4px_0px_#0f172a] hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1 active:translate-y-1 transition-all flex items-center gap-2 font-black cursor-pointer"
        >
          <span>Accept Data &amp; Proceed to Scoring Engine</span>
          <span className="material-symbols-outlined text-lg font-bold">arrow_forward</span>
        </button>
      </div>
    </div>
  );
}
