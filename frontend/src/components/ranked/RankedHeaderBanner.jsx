export default function RankedHeaderBanner({
  runInfo,
  onExportLedger,
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-space-md bg-surface-container-lowest p-space-md rounded-xl border-2 border-[#0f172a] shadow-[4px_4px_0px_#0f172a]">
      {/* Left Breadcrumbs & Seal */}
      <div className="flex flex-wrap items-center gap-space-sm">
        <span className="font-label-sm text-label-sm font-mono uppercase px-2.5 py-1 bg-secondary-fixed text-on-secondary-fixed rounded-full border-2 border-[#0f172a] shadow-[2px_2px_0px_#0f172a] font-extrabold">
          STAGE {runInfo.stage} // {runInfo.stage_name}
        </span>
        <span className="material-symbols-outlined text-outline text-lg">chevron_right</span>
        <h1 className="font-headline-sm text-headline-sm text-on-surface font-extrabold tracking-tight">
          {runInfo.title}
        </h1>
        <span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-surface-container text-on-surface border-2 border-[#0f172a] font-mono font-bold shadow-[1px_1px_0px_#0f172a]">
          SHA-256: {runInfo.file_hash_short}
        </span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-space-sm">
        <div className="flex items-center gap-1.5 px-3 py-1 bg-surface-container-high rounded-full border-2 border-[#0f172a] font-mono font-label-sm text-label-sm">
          <span className="w-2 h-2 rounded-full bg-[#10b981] inline-block"></span>
          <span className="font-bold text-on-surface">STATE FROZEN: {runInfo.state_frozen}</span>
        </div>

        <button
          type="button"
          onClick={onExportLedger}
          className="flex items-center gap-1 px-3 py-1 bg-surface-container-lowest hover:bg-secondary-fixed text-on-surface rounded-full border-2 border-[#0f172a] shadow-[2px_2px_0px_#0f172a] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#0f172a] transition-all font-label-md text-label-md font-bold cursor-pointer"
        >
          <span className="material-symbols-outlined text-sm">print</span>
          <span>Export Ledger</span>
        </button>
      </div>
    </div>
  );
}
