export default function MainstageBroadcastBar({
  isBroadcasting,
  onBroadcastToggle,
  onOpenStageView,
}) {
  return (
    <aside className="sticky bottom-4 z-30 bg-[#0f172a] text-surface-container-lowest p-space-md rounded-xl border-2 border-[#0f172a] shadow-[6px_6px_0px_#2563eb] flex flex-col sm:flex-row items-center justify-between gap-space-md">
      <div className="flex items-center gap-space-sm">
        <div className="w-10 h-10 rounded-full bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center shrink-0 border-2 border-surface-container-lowest shadow-[1px_1px_0px_#0f172a]">
          <span className="material-symbols-outlined font-black text-xl">lock</span>
        </div>
        <div>
          <div className="font-headline-sm text-headline-sm text-surface-bright font-black flex flex-wrap items-center gap-2">
            <span>Rankings Sealed &amp; Ready for Mainstage</span>
            <span className="font-label-sm text-label-sm uppercase px-2 py-0.5 rounded bg-[#10b981] text-on-primary font-bold">
              LIVE STAGE SAFE
            </span>
            {isBroadcasting && (
              <span className="font-label-sm text-label-sm uppercase px-2 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed font-black animate-pulse flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                ON AIR
              </span>
            )}
          </div>
          <p className="font-body-sm text-body-sm text-slate-300 text-xs sm:text-sm">
            All data is cryptographically sealed. Any changes to weights or input records will automatically invalidate this receipt.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-space-sm w-full sm:w-auto shrink-0">
        {isBroadcasting && (
          <button
            type="button"
            onClick={onOpenStageView}
            className="px-4 py-3 rounded-lg bg-surface-container-lowest text-on-surface border-2 border-surface-container-lowest shadow-[2px_2px_0px_#ffe24c] hover:bg-slate-100 font-label-lg text-label-lg uppercase tracking-wider font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">open_in_new</span>
            <span>View Projection</span>
          </button>
        )}

        <button
          type="button"
          onClick={onBroadcastToggle}
          className={`w-full sm:w-auto px-6 py-3 rounded-lg border-2 border-surface-container-lowest shadow-[3px_3px_0px_#ffe24c] hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1 active:translate-y-1 font-label-lg text-label-lg uppercase tracking-wider font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
            isBroadcasting
              ? 'bg-[#10b981] text-on-primary hover:bg-[#059669]'
              : 'bg-[#2563eb] text-on-primary hover:bg-[#1d4ed8]'
          }`}
        >
          <span className="material-symbols-outlined text-xl">
            {isBroadcasting ? 'sensors' : 'podium'}
          </span>
          <span>
            {isBroadcasting
              ? 'LIVE ON MAINSTAGE DISPLAY'
              : 'Broadcast to Live Presentation Stage'}
          </span>
        </button>
      </div>
    </aside>
  );
}
