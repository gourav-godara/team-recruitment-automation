export default function ScoringBottomBar({
  onProceed,
  onInspectConfig,
}) {
  return (
    <div className="bg-secondary-fixed p-space-md rounded-xl border-2 border-[#0f172a] shadow-[4px_4px_0px_#0f172a] flex flex-col md:flex-row items-center justify-between gap-space-md">
      <div className="flex items-center gap-space-sm">
        <div className="w-10 h-10 rounded-full bg-surface-container-lowest border-2 border-[#0f172a] flex items-center justify-center text-on-surface shadow-[2px_2px_0px_#0f172a] shrink-0 font-bold">
          <span className="material-symbols-outlined">lock_open</span>
        </div>
        <div>
          <div className="font-headline-sm text-sm font-black text-on-secondary-fixed uppercase tracking-wider">
            Deterministic Engine Ready
          </div>
          <p className="font-body-sm text-body-sm text-on-secondary-fixed-variant leading-tight">
            Weights automatically re-normalize to 100%. All adjustments are logged to SHA-256 state seal.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 w-full md:w-auto">
        <button
          type="button"
          onClick={onInspectConfig}
          className="px-4 py-3 rounded-lg font-label-lg text-label-lg uppercase bg-surface-container-lowest text-on-surface border-2 border-[#0f172a] shadow-[3px_3px_0px_#0f172a] hover:bg-surface-container-low active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#0f172a] transition-all flex items-center justify-center gap-1.5 cursor-pointer font-bold"
        >
          <span className="material-symbols-outlined text-base">code</span>
          <span>Config JSON</span>
        </button>

        <button
          type="button"
          id="btn-lock-proceed"
          onClick={onProceed}
          className="w-full md:w-auto px-6 py-3 rounded-lg font-label-lg text-label-lg uppercase bg-primary-container text-on-primary-container border-2 border-[#0f172a] shadow-[4px_4px_0px_#0f172a] hover:bg-primary active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#0f172a] transition-all flex items-center justify-center gap-2 cursor-pointer font-black"
        >
          <span>Lock Weights &amp; Proceed to Ranked Results</span>
          <span className="material-symbols-outlined text-base">arrow_forward</span>
        </button>
      </div>
    </div>
  );
}
