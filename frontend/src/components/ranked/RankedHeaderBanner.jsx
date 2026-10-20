export default function RankedHeaderBanner({
  runInfo,
  onExportLedger,
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-space-md bg-surface-container-lowest p-space-md rounded-xl border-2 border-[#0f172a] shadow-[4px_4px_0px_#0f172a]">
      {/* Left Title & Status */}
      <div className="flex flex-wrap items-center gap-space-sm">
        <span className="font-label-sm text-label-sm font-mono uppercase px-2.5 py-1 bg-brand-yellow text-brand-dark rounded-full border-2 border-[#0f172a] shadow-[2px_2px_0px_#0f172a] font-extrabold">
          RUN #{runInfo?.run_id || '1'} • LEADERBOARD
        </span>
        <h1 className="font-headline-sm text-headline-sm text-on-surface font-extrabold tracking-tight">
          Candidate Shortlisting Leaderboard
        </h1>
      </div>

      {/* Right Controls: Export CSV */}
      <div className="flex items-center gap-space-sm">
        <button
          type="button"
          onClick={onExportLedger}
          className="flex items-center gap-1.5 px-4 py-2 bg-brand-yellow hover:bg-yellow-300 text-brand-dark rounded-xl border-2 border-[#0f172a] shadow-[2px_2px_0px_#0f172a] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#0f172a] transition-all font-label-md text-label-md font-bold cursor-pointer"
        >
          <span className="material-symbols-outlined text-base font-bold">download</span>
          <span>Export CSV Spreadsheet</span>
        </button>
      </div>
    </div>
  );
}
